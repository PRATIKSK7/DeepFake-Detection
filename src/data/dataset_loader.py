import os
import tensorflow as tf
from src.config import Config
from src.data.augmentation import get_training_augmentation, get_validation_augmentation

def get_datasets():
    """
    Loads train, validation, and test datasets using tf.keras.utils.image_dataset_from_directory.
    Applies caching, augmentation, resizing, batching, and prefetching.
    """
    print(f"Loading datasets from {Config.DATA_DIR}...")
    
    # Define normalization layer
    normalization_layer = tf.keras.layers.Rescaling(1./255)
    
    # Load Training Data
    train_ds = tf.keras.utils.image_dataset_from_directory(
        Config.TRAIN_DIR,
        labels='inferred',
        label_mode='categorical', # Because Softmax is requested
        class_names=['fake', 'real'], # Ensure explicit ordering (0=fake, 1=real)
        color_mode='rgb',
        batch_size=Config.BATCH_SIZE,
        image_size=Config.LOAD_SIZE, # Load at larger size for RandomCrop
        shuffle=True,
    )
    
    # Load Validation Data
    val_ds = tf.keras.utils.image_dataset_from_directory(
        Config.VAL_DIR,
        labels='inferred',
        label_mode='categorical',
        class_names=['fake', 'real'],
        color_mode='rgb',
        batch_size=Config.BATCH_SIZE,
        image_size=Config.LOAD_SIZE,
        shuffle=False,
    )
    
    # Load Test Data
    test_ds = tf.keras.utils.image_dataset_from_directory(
        Config.TEST_DIR,
        labels='inferred',
        label_mode='categorical',
        class_names=['fake', 'real'],
        color_mode='rgb',
        batch_size=Config.BATCH_SIZE,
        image_size=Config.LOAD_SIZE,
        shuffle=False,
    )
    
    # Apply Pipeline to Training
    train_aug = get_training_augmentation()
    
    if Config.USE_CACHE:
        print("Enabling dataset cache (RAM >= 16GB).")
        train_ds = train_ds.cache()
    else:
        print("Disabling dataset cache to prevent OOM (RAM < 16GB).")
        
    train_ds = train_ds.shuffle(buffer_size=1000)
    # Augmentation maps are applied sequentially over batches (tf.keras preprocessing layers support batches)
    train_ds = train_ds.map(lambda x, y: (train_aug(x, training=True), y), num_parallel_calls=tf.data.AUTOTUNE)
    train_ds = train_ds.map(lambda x, y: (normalization_layer(x), y), num_parallel_calls=tf.data.AUTOTUNE)
    train_ds = train_ds.prefetch(buffer_size=tf.data.AUTOTUNE)
    
    # Apply Pipeline to Validation
    val_aug = get_validation_augmentation()
    if Config.USE_CACHE:
        val_ds = val_ds.cache()
    val_ds = val_ds.map(lambda x, y: (val_aug(x, training=False), y), num_parallel_calls=tf.data.AUTOTUNE)
    val_ds = val_ds.map(lambda x, y: (normalization_layer(x), y), num_parallel_calls=tf.data.AUTOTUNE)
    val_ds = val_ds.prefetch(buffer_size=tf.data.AUTOTUNE)
    
    # Apply Pipeline to Test
    if Config.USE_CACHE:
        test_ds = test_ds.cache()
    test_ds = test_ds.map(lambda x, y: (val_aug(x, training=False), y), num_parallel_calls=tf.data.AUTOTUNE)
    test_ds = test_ds.map(lambda x, y: (normalization_layer(x), y), num_parallel_calls=tf.data.AUTOTUNE)
    test_ds = test_ds.prefetch(buffer_size=tf.data.AUTOTUNE)
    
    return train_ds, val_ds, test_ds

def verify_dataset_integrity():
    """
    Verifies that the dataset exists and prints the class distribution.
    """
    if not os.path.exists(Config.DATA_DIR):
        raise ValueError(f"DATA_DIR {Config.DATA_DIR} does not exist.")
        
    for split, dir_path in [('Train', Config.TRAIN_DIR), ('Validation', Config.VAL_DIR), ('Test', Config.TEST_DIR)]:
        print(f"\nVerifying {split} Data in {dir_path}")
        total = 0
        for class_name in ['real', 'fake']:
            class_path = os.path.join(dir_path, class_name)
            if not os.path.exists(class_path):
                print(f"  [ERROR] Class directory missing: {class_path}")
                continue
                
            num_images = len([f for f in os.listdir(class_path) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))])
            print(f"  - {class_name}: {num_images} images")
            total += num_images
        print(f"  Total {split}: {total} images")
        
    print("\nDataset verification complete.\n")
