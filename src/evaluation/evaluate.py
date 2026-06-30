import os
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix, roc_curve, auc, precision_recall_curve, f1_score
from src.config import Config
import seaborn as sns

def plot_training_history(csv_path):
    """
    Parses the CSVLogger output and generates Loss and Accuracy curves.
    """
    if not os.path.exists(csv_path):
        print(f"Warning: {csv_path} not found. Skipping history plots.")
        return
        
    df = pd.read_csv(csv_path)
    if 'accuracy' not in df.columns or 'val_accuracy' not in df.columns:
        print("Warning: Missing accuracy columns in CSV. Check metric names.")
        return
        
    epochs = range(1, len(df) + 1)
    
    # Plot Accuracy
    plt.figure(figsize=(10, 6))
    plt.plot(epochs, df['accuracy'], 'b-', label='Training Accuracy')
    plt.plot(epochs, df['val_accuracy'], 'r-', label='Validation Accuracy')
    plt.title('Training and Validation Accuracy')
    plt.xlabel('Epochs')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.grid(True)
    plt.savefig(os.path.join(Config.LOGS_DIR, 'accuracy_curve.png'))
    plt.close()
    
    # Plot Loss
    plt.figure(figsize=(10, 6))
    plt.plot(epochs, df['loss'], 'b-', label='Training Loss')
    plt.plot(epochs, df['val_loss'], 'r-', label='Validation Loss')
    plt.title('Training and Validation Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True)
    plt.savefig(os.path.join(Config.LOGS_DIR, 'loss_curve.png'))
    plt.close()

def generate_evaluation_reports(model=None, test_ds=None):
    """
    Evaluates the model on the test dataset and generates required reports.
    """
    print("\n--- Generating Evaluation Reports ---")
    
    if model is None:
        if os.path.exists(Config.BEST_MODEL_PATH):
            print("Loading best model from disk...")
            model = tf.keras.models.load_model(Config.BEST_MODEL_PATH)
        else:
            raise FileNotFoundError(f"Model not found at {Config.BEST_MODEL_PATH}")
            
    if test_ds is None:
        from src.data.dataset_loader import get_datasets
        _, _, test_ds = get_datasets()
        
    # Plot history first
    plot_training_history(os.path.join(Config.LOGS_DIR, 'training_history.csv'))
    
    print("Generating predictions on test set (this may take a while)...")
    
    y_true = []
    y_pred_probs = []
    
    for images, labels in test_ds:
        preds = model.predict(images, verbose=0)
        y_pred_probs.extend(preds)
        y_true.extend(labels.numpy())
        
    y_true = np.array(y_true)
    y_pred_probs = np.array(y_pred_probs)
    
    # Convert categorical labels back to 1D array of class indices (0=Fake, 1=Real)
    y_true_classes = np.argmax(y_true, axis=1)
    y_pred_classes = np.argmax(y_pred_probs, axis=1)
    y_pred_probs_positive = y_pred_probs[:, 1] # Probability of being 'Real'
    
    # 1. Classification Report & Metrics
    print("\n========================================")
    print("CLASSIFICATION REPORT")
    print("========================================")
    report = classification_report(y_true_classes, y_pred_classes, target_names=['Fake', 'Real'])
    print(report)
    
    f1 = f1_score(y_true_classes, y_pred_classes)
    print(f"F1 Score: {f1:.4f}")
    
    # 2. Confusion Matrix
    cm = confusion_matrix(y_true_classes, y_pred_classes)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=['Fake', 'Real'], yticklabels=['Fake', 'Real'])
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.savefig(os.path.join(Config.LOGS_DIR, 'confusion_matrix.png'))
    plt.close()
    
    # 3. ROC Curve and AUC
    fpr, tpr, _ = roc_curve(y_true_classes, y_pred_probs_positive)
    roc_auc = auc(fpr, tpr)
    print(f"ROC AUC:  {roc_auc:.4f}")
    
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:.4f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Receiver Operating Characteristic')
    plt.legend(loc="lower right")
    plt.grid(True)
    plt.savefig(os.path.join(Config.LOGS_DIR, 'roc_curve.png'))
    plt.close()
    
    # 4. Precision-Recall Curve
    precision, recall, _ = precision_recall_curve(y_true_classes, y_pred_probs_positive)
    
    plt.figure(figsize=(8, 6))
    plt.plot(recall, precision, color='blue', lw=2, label='PR Curve')
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title('Precision-Recall Curve')
    plt.legend(loc="lower left")
    plt.grid(True)
    plt.savefig(os.path.join(Config.LOGS_DIR, 'precision_recall_curve.png'))
    plt.close()
    
    print(f"\nAll reports generated and saved to {Config.LOGS_DIR}")

if __name__ == '__main__':
    generate_evaluation_reports()
