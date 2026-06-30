# DeepGuard: DeepFake Detection System

DeepGuard is a production-ready system for detecting DeepFake images using EfficientNetV2. It is optimized to train seamlessly across Local, Kaggle, and Google Colab environments.

## Kaggle Deployment

This project includes a generated Kaggle notebook (`DeepFake_Training.ipynb`) that requires **zero manual configuration**.

1. Upload the entire `deepguard-code` repository to Kaggle, or copy the contents of `DeepFake_Training.ipynb` into a new Notebook.
2. Add the `real-vs-fake` dataset to your Notebook.
3. Select **GPU P100** or **T4x2**.
4. Click **Run All**. 
5. The pipeline will automatically detect the Kaggle environment, configure mixed precision, train the model, evaluate metrics, and save `best_model.keras` to the outputs.

## Local Training (MacBook / Low RAM Support)

DeepGuard dynamically scales its architecture based on available RAM:
- If you have **< 16GB RAM** (e.g., 8GB MacBook Air), it will disable `tf.data.Dataset.cache()` and fallback to the smaller `EfficientNetV2B0` model to prevent Out-Of-Memory (OOM) crashes.
- Apple Silicon (MPS) mixed precision is enabled automatically.

```bash
pip install -r requirements.txt
python3 src/training/train.py
```

## FastAPI Inference

Once the model is trained, start the FastAPI production backend:

```bash
uvicorn app.api:app --host 0.0.0.0 --port 8000
```

### Test Inference
```bash
curl -X POST "http://localhost:8000/predict" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@path_to_image.jpg"
```
