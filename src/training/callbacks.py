import tensorflow as tf
import os
from src.config import Config

def get_callbacks():
    """
    Returns a list of Keras callbacks for training.
    Includes: EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, and TensorBoard.
    """
    
    os.makedirs(Config.MODELS_DIR, exist_ok=True)
    os.makedirs(Config.LOGS_DIR, exist_ok=True)
    
    best_model_path = os.path.join(Config.MODELS_DIR, 'best_model.keras')
    last_model_path = os.path.join(Config.MODELS_DIR, 'last_model.keras')
    
    # Save the best model based on validation loss
    checkpoint_best = tf.keras.callbacks.ModelCheckpoint(
        filepath=best_model_path,
        monitor='val_loss',
        save_best_only=True,
        save_weights_only=False,
        mode='min',
        verbose=1
    )
    
    # Always save the last epoch model
    checkpoint_last = tf.keras.callbacks.ModelCheckpoint(
        filepath=last_model_path,
        monitor='val_loss',
        save_best_only=False,
        save_weights_only=False,
        verbose=0
    )
    
    # Early stopping to prevent overfitting
    early_stopping = tf.keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True,
        verbose=1
    )
    
    # Reduce learning rate when validation loss plateaus
    reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.2,
        patience=5,
        min_lr=1e-6,
        verbose=1
    )
    
    # TensorBoard for visualization
    tensorboard = tf.keras.callbacks.TensorBoard(
        log_dir=os.path.join(Config.LOGS_DIR, 'tensorboard'),
        histogram_freq=1,
        update_freq='epoch'
    )
    
    return [checkpoint_best, checkpoint_last, early_stopping, reduce_lr, tensorboard]
