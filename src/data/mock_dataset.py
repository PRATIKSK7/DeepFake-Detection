import os
import cv2
import numpy as np

def generate_mock_dataset(base_dir, num_samples_per_class=10, img_size=(300, 300)):
    """
    Generates a small mock dataset for testing the pipeline locally.
    Creates simple images with geometric shapes/noise instead of real faces.
    """
    splits = ['train', 'val', 'test']
    classes = ['real', 'fake']
    
    for split in splits:
        for cls in classes:
            dir_path = os.path.join(base_dir, split, cls)
            os.makedirs(dir_path, exist_ok=True)
            
            for i in range(num_samples_per_class):
                # Generate a random dummy image
                img = np.random.randint(0, 256, (img_size[0], img_size[1], 3), dtype=np.uint8)
                
                # Add some distinct features to fake vs real so the model can learn something
                if cls == 'fake':
                    cv2.rectangle(img, (50, 50), (250, 250), (0, 0, 255), -1) # Red square
                else:
                    cv2.circle(img, (150, 150), 100, (0, 255, 0), -1) # Green circle
                    
                file_path = os.path.join(dir_path, f"mock_{split}_{cls}_{i}.jpg")
                cv2.imwrite(file_path, img)
    
    print(f"Mock dataset generated at {base_dir}")

if __name__ == "__main__":
    from src.config import Config
    generate_mock_dataset(Config.DATA_DIR)
