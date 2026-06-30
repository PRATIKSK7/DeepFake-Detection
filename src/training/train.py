import os
import tensorflow as tf
from src.config import Config
from src.data.dataset_loader import get_datasets, verify_dataset_integrity
from src.models.efficientnet_v2 import build_model
from src.evaluation.evaluate import generate_evaluation_reports

def get_callbacks():
    """
    Returns a list of all required Keras Callbacks.
    """
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.2,
            patience=3,
            min_lr=1e-6,
            verbose=1
        ),
        tf.keras.callbacks.ModelCheckpoint(
            filepath=Config.BEST_MODEL_PATH,
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        ),
        tf.keras.callbacks.ModelCheckpoint(
            filepath=Config.LAST_MODEL_PATH,
            monitor='val_loss',
            save_best_only=False,
            verbose=0
        ),
        tf.keras.callbacks.TensorBoard(
            log_dir=os.path.join(Config.LOGS_DIR, 'tensorboard'),
            histogram_freq=1
        ),
        tf.keras.callbacks.CSVLogger(
            filename=os.path.join(Config.LOGS_DIR, 'training_history.csv'),
            separator=',',
            append=True # Append so phase 2 continues phase 1 logs
        ),
        tf.keras.callbacks.TerminateOnNaN()
    ]
    return callbacks

def train_model():
    # 1. Hardware & Mixed Precision setup
    Config.setup_hardware()
    Config.setup_directories()
    
    # 2. Verify dataset integrity before training
    print("\n[Stage 1] Verifying dataset integrity...")
    verify_dataset_integrity()
    
    # 3. Load Datasets
    print("\n[Stage 2] Loading Data Pipelines...")
    train_ds, val_ds, test_ds = get_datasets()
    
    # 4. Build Model
    print("\n[Stage 3] Building Model architecture...")
    model = build_model(fine_tune=False) # Start with Transfer Learning (frozen base)
    
    print(model.summary())
    
    # 5. Start Training
    print("\n[Stage 4] Initiating Training Phase...")
    callbacks = get_callbacks()
    
    try:
        # Phase 1: Train top layers
        print(f"\n--- Phase 1: Training Classification Head (LR: {Config.LR_STAGE_1}) ---")
        history = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=Config.EPOCHS,
            callbacks=callbacks
        )
        
        # Phase 2: Fine tuning
        print(f"\n--- Phase 2: Fine Tuning entire model (LR: {Config.LR_STAGE_2}) ---")
        model.trainable = True
        
        optimizer = tf.keras.optimizers.AdamW(learning_rate=Config.LR_STAGE_2)
        model.compile(
            optimizer=optimizer,
            loss='categorical_crossentropy',
            metrics=['accuracy', tf.keras.metrics.Precision(name='precision'), tf.keras.metrics.Recall(name='recall'), tf.keras.metrics.AUC(name='auc')]
        )
        
        fine_tune_epochs = min(5, Config.EPOCHS)
        
        history_fine = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=fine_tune_epochs,
            callbacks=callbacks
        )
        
    except Exception as e:
        print(f"\n[CRITICAL ERROR] Training halted: {e}")
        raise e
        
    print("\n[Stage 5] Training completed successfully. Initiating Automatic Evaluation...")
    # Trigger auto-evaluation
    try:
        generate_evaluation_reports(model, test_ds)
    except Exception as e:
        print(f"\n[WARNING] Automatic evaluation failed: {e}")
        print("Please run evaluation manually using `evaluate.py`.")

if __name__ == '__main__':
    train_model()
