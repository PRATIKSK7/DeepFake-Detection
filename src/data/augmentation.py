import tensorflow as tf
from src.config import Config

def get_training_augmentation():
    """
    Returns a Keras Sequential model for training data augmentation.
    """
    return tf.keras.Sequential([
        # Geometric transformations
        tf.keras.layers.RandomFlip("horizontal"),
        tf.keras.layers.RandomRotation(factor=0.05),
        tf.keras.layers.RandomZoom(height_factor=(-0.1, 0.1), width_factor=(-0.1, 0.1)),
        tf.keras.layers.RandomTranslation(height_factor=0.05, width_factor=0.05),
        
        # Color & Light (RandomContrast and RandomBrightness are part of tf.keras.layers in TF 2.x)
        tf.keras.layers.RandomContrast(factor=0.2),
        tf.keras.layers.RandomBrightness(factor=0.2),
        
        # Random Crop (Assuming input has been resized to a slightly larger size like LOAD_SIZE)
        tf.keras.layers.RandomCrop(height=Config.IMAGE_SIZE[0], width=Config.IMAGE_SIZE[1]),
    ], name='training_augmentation')

def get_validation_augmentation():
    """
    Returns a Keras Sequential model for validation/testing (typically no augmentation, just CenterCrop).
    """
    return tf.keras.Sequential([
        tf.keras.layers.CenterCrop(height=Config.IMAGE_SIZE[0], width=Config.IMAGE_SIZE[1])
    ], name='validation_augmentation')
