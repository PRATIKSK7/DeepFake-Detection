import tensorflow as tf
from src.config import Config

def build_model(fine_tune=False):
    """
    Builds the EfficientNetV2 model with custom top layers for deepfake detection.
    Dynamically falls back to a smaller variant (B0) if running locally with limited RAM.
    
    Args:
        fine_tune (bool): If True, unfreezes the base model weights.
    """
    
    # Auto-detect variant based on memory and environment
    if Config.ENV == 'Local' and Config.SYSTEM_RAM_GB < 16.0:
        print(f"Warning: Low memory detected ({Config.SYSTEM_RAM_GB:.1f} GB RAM). Using EfficientNetV2B0 instead of B3 to prevent OOM.")
        model_class = tf.keras.applications.EfficientNetV2B0
    else:
        print(f"Sufficient memory detected. Using EfficientNetV2B3.")
        model_class = tf.keras.applications.EfficientNetV2B3
        
    # Load base model
    base_model = model_class(
        include_top=False,
        weights='imagenet',
        input_shape=Config.INPUT_SHAPE,
        include_preprocessing=False # We handle rescaling in dataset_loader
    )
    
    # Freeze or unfreeze base model
    base_model.trainable = fine_tune
    
    # Create the model using Functional API
    inputs = tf.keras.Input(shape=Config.INPUT_SHAPE)
    
    x = base_model(inputs, training=fine_tune)
    
    # Custom top layers
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    outputs = tf.keras.layers.Dense(2, activation='softmax')(x)
    
    model = tf.keras.Model(inputs, outputs)
    
    # Compile the model
    # We use a default learning rate here, but train.py overrides it for Stage 1 / Stage 2
    optimizer = tf.keras.optimizers.AdamW(learning_rate=Config.LR_STAGE_1)
    
    model.compile(
        optimizer=optimizer,
        loss='categorical_crossentropy',
        metrics=[
            'accuracy',
            tf.keras.metrics.Precision(name='precision'),
            tf.keras.metrics.Recall(name='recall'),
            tf.keras.metrics.AUC(name='auc')
        ]
    )
    
    return model
