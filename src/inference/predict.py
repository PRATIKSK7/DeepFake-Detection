import os
import time
import numpy as np
import tensorflow as tf
from src.config import Config
from src.data.preprocessing import preprocessor
from src.explainability.gradcam import make_gradcam_heatmap, save_and_display_gradcam

class DeepfakeDetector:
    def __init__(self, model_path=None):
        if model_path is None:
            model_path = os.path.join(Config.MODELS_DIR, 'best_model.keras')
            
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}")
            
        print("Loading Deepfake Detection model...")
        self.model = tf.keras.models.load_model(model_path)
        
        # Identify the base model layer (which outputs the feature map) for Grad-CAM
        self.last_conv_layer_name = None
        for layer in reversed(self.model.layers):
            if isinstance(layer, tf.keras.Model):
                self.last_conv_layer_name = layer.name
                break
        
        # Fallback if we couldn't automatically find it
        if not self.last_conv_layer_name:
            self.last_conv_layer_name = "efficientnetv2-b3" # Default for our architecture

    def predict(self, image_path, save_cam_path="output_cam.jpg"):
        """
        Runs full inference pipeline on an uploaded image.
        Returns dictionary with metrics.
        """
        start_time = time.time()
        
        # 1. Preprocess (Extract face, resize, normalize)
        face_img = preprocessor.extract_face(image_path)
        if face_img is None:
            print("Warning: No face detected. Using full image as fallback.")
            import cv2
            face_img = cv2.imread(image_path)
            face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
            face_img = cv2.resize(face_img, Config.IMAGE_SIZE)
            
        normalized_face = preprocessor.normalize(face_img)
        input_tensor = np.expand_dims(normalized_face, axis=0)
        
        # 2. Prediction
        prediction_score = self.model.predict(input_tensor, verbose=0)[0][0]
        
        # 3. Label and Confidence
        # Since Real=1, Fake=0
        if prediction_score >= 0.5:
            label = "Real"
            confidence = prediction_score * 100
        else:
            label = "Fake"
            confidence = (1.0 - prediction_score) * 100
            
        inference_time = time.time() - start_time
        
        # 4. Grad-CAM Visualization
        # Save the cropped face for heatmap superimposition
        temp_face_path = "temp_face.jpg"
        import cv2
        cv2.imwrite(temp_face_path, cv2.cvtColor(face_img, cv2.COLOR_RGB2BGR))
        
        try:
            heatmap = make_gradcam_heatmap(input_tensor, self.model, self.last_conv_layer_name)
            save_and_display_gradcam(temp_face_path, heatmap, cam_path=save_cam_path)
            cam_generated = True
        except Exception as e:
            print(f"Warning: Grad-CAM generation failed: {e}")
            cam_generated = False
            
        if os.path.exists(temp_face_path):
            os.remove(temp_face_path)
            
        result = {
            "prediction": label,
            "confidence_percent": round(float(confidence), 2),
            "inference_time_seconds": round(float(inference_time), 4),
            "probability_score": float(prediction_score),
            "gradcam_path": save_cam_path if cam_generated else None
        }
        
        return result

if __name__ == '__main__':
    # Test inference on a dummy image if exists
    import sys
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
        try:
            detector = DeepfakeDetector()
            res = detector.predict(img_path)
            print(res)
        except Exception as e:
            print(e)
    else:
        print("Usage: python predict.py <path_to_image>")
