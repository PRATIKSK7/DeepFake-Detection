import cv2
import numpy as np
from mtcnn import MTCNN
from PIL import Image

class FacePreprocessor:
    def __init__(self, target_size=(224, 224), margin=0.2):
        self.detector = MTCNN()
        self.target_size = target_size
        self.margin = margin

    def extract_face(self, image_path_or_array):
        """
        Extracts the largest face from an image.
        Returns the cropped and aligned face as a numpy array, or None if no face found.
        """
        if isinstance(image_path_or_array, str):
            img = cv2.imread(image_path_or_array)
            if img is None:
                return None
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        else:
            img = image_path_or_array

        results = self.detector.detect_faces(img)
        if not results:
            return None

        # Get the largest face
        largest_face = max(results, key=lambda rect: rect['box'][2] * rect['box'][3])
        x, y, width, height = largest_face['box']
        
        # Enforce positive coordinates
        x, y = max(0, x), max(0, y)

        # Apply margin
        margin_x = int(width * self.margin)
        margin_y = int(height * self.margin)
        
        x1 = max(0, x - margin_x)
        y1 = max(0, y - margin_y)
        x2 = min(img.shape[1], x + width + margin_x)
        y2 = min(img.shape[0], y + height + margin_y)

        face_crop = img[y1:y2, x1:x2]
        
        # Optional: Face alignment using keypoints (eyes) could be added here
        # For this version, bounding box extraction is implemented as baseline alignment
        
        # Resize
        face_resized = cv2.resize(face_crop, self.target_size)
        return face_resized

    def normalize(self, face_img):
        """
        Normalize pixel values to [0, 1] range.
        """
        return face_img.astype(np.float32) / 255.0

# Singleton instance for general usage
preprocessor = FacePreprocessor()
