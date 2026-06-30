import os
import psutil
import tensorflow as tf

class Environment:
    """Helper to detect environment dynamically."""
    @staticmethod
    def get_type():
        if os.path.exists('/kaggle/input'):
            return 'Kaggle'
        elif 'COLAB_GPU' in os.environ:
            return 'Colab'
        return 'Local'

class Config:
    # Environment
    ENV = Environment.get_type()
    
    # Project paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Dynamic Data Dir Resolution
    if ENV == 'Kaggle':
        # Find dataset in Kaggle input
        DATA_DIR = '/kaggle/input/real-vs-fake' # Usually Kaggle mounts datasets here
        if not os.path.exists(DATA_DIR):
            # Fallback scan
            for root, dirs, files in os.walk('/kaggle/input'):
                if 'train' in dirs and 'valid' in dirs:
                    DATA_DIR = root
                    break
    else:
        DATA_DIR = os.path.expanduser('~/Downloads/real_vs_fake/real-vs-fake')
        
    TRAIN_DIR = os.path.join(DATA_DIR, 'train')
    VAL_DIR = os.path.join(DATA_DIR, 'valid')
    TEST_DIR = os.path.join(DATA_DIR, 'test')
    
    MODELS_DIR = os.path.join(BASE_DIR, 'models')
    LOGS_DIR = os.path.join(BASE_DIR, 'logs')
    
    # Memory configurations (Dynamic based on system RAM)
    SYSTEM_RAM_GB = psutil.virtual_memory().total / (1024**3)
    USE_CACHE = SYSTEM_RAM_GB >= 16.0  # Only cache if we have >= 16GB RAM to avoid OOM
    
    # Model configuration
    IMAGE_SIZE = (300, 300)  # Target size
    LOAD_SIZE = (320, 320)   # Larger size to load into before RandomCrop
    INPUT_SHAPE = (300, 300, 3)
    BATCH_SIZE = 32  # Will be dynamically adapted if needed
    EPOCHS = 10 
    
    # Learning Rates for Two-Stage Training
    LR_STAGE_1 = 1e-4
    LR_STAGE_2 = 1e-5
    
    # Preprocessing
    FACE_MARGIN = 0.2
    
    # Checkpoint configuration
    BEST_MODEL_PATH = os.path.join(MODELS_DIR, 'best_model.keras')
    LAST_MODEL_PATH = os.path.join(MODELS_DIR, 'last_model.keras')
    
    @classmethod
    def setup_directories(cls):
        os.makedirs(cls.MODELS_DIR, exist_ok=True)
        os.makedirs(cls.LOGS_DIR, exist_ok=True)
        
    @classmethod
    def setup_hardware(cls):
        """
        Sets up hardware and mixed precision policy automatically based on available accelerators.
        """
        print("\n--- Hardware Setup ---")
        try:
            # Check for Apple Silicon GPU
            if len(tf.config.list_physical_devices('macOS')) > 0 or len(tf.config.list_physical_devices('MPS')) > 0:
                print("Apple Silicon GPU (MPS) detected. Configuring...")
                policy = tf.keras.mixed_precision.Policy('mixed_float16')
                tf.keras.mixed_precision.set_global_policy(policy)
                print("Mixed Precision: mixed_float16 enabled for MPS.")
            # Check for CUDA GPU
            elif len(tf.config.list_physical_devices('GPU')) > 0:
                print("CUDA GPU detected. Configuring...")
                gpus = tf.config.list_physical_devices('GPU')
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, True)
                policy = tf.keras.mixed_precision.Policy('mixed_float16')
                tf.keras.mixed_precision.set_global_policy(policy)
                print("Mixed Precision: mixed_float16 enabled for CUDA.")
            else:
                print("No supported GPU found. Using CPU.")
        except Exception as e:
            print(f"Warning: Hardware configuration failed: {e}. Falling back to default.")

