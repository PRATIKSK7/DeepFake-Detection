import os
import io
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import tensorflow as tf
from src.config import Config

app = FastAPI(
    title="DeepGuard Inference API",
    description="FastAPI service for DeepFake image detection.",
    version="1.0.0"
)

# Global model instance
model = None

@app.on_event("startup")
async def startup_event():
    global model
    try:
        model_path = Config.BEST_MODEL_PATH
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}. Train the model first.")
        model = tf.keras.models.load_model(model_path)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Failed to load model: {e}")
        # Not raising here so the server can start, but /predict will fail
        
def process_image(image_bytes: bytes) -> np.ndarray:
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize(Config.IMAGE_SIZE)
        img_array = tf.keras.utils.img_to_array(image)
        # Rescaling (same as in dataset_loader)
        img_array = img_array / 255.0
        return np.expand_dims(img_array, axis=0)
    except Exception as e:
        raise ValueError(f"Invalid image format: {e}")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    global model
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded.")
        
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
        
    try:
        contents = await file.read()
        processed_img = process_image(contents)
        
        predictions = model.predict(processed_img, verbose=0)
        
        # Output format: [fake_prob, real_prob] based on class names ['fake', 'real']
        fake_prob = float(predictions[0][0])
        real_prob = float(predictions[0][1])
        
        result = "real" if real_prob > fake_prob else "fake"
        confidence = max(real_prob, fake_prob)
        
        return JSONResponse({
            "filename": file.filename,
            "prediction": result,
            "confidence": f"{confidence:.2%}",
            "probabilities": {
                "real": real_prob,
                "fake": fake_prob
            }
        })
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")

@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}
