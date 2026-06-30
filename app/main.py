import streamlit as st
import os
import sys

# Add root directory to path to allow importing src
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.inference.predict import DeepfakeDetector

st.set_page_config(page_title="DeepGuard - DeepFake Detection", page_icon="🕵️‍♂️", layout="wide")

st.title("🕵️‍♂️ DeepGuard: Advanced DeepFake Image Detection")
st.write("Upload an image to verify its authenticity.")

@st.cache_resource
def load_model():
    try:
        return DeepfakeDetector()
    except Exception as e:
        st.error(f"Failed to load model: {e}")
        return None

detector = load_model()

uploaded_file = st.file_uploader("Choose an image...", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    st.image(uploaded_file, caption="Uploaded Image", use_column_width=True)
    
    if st.button("Analyze Image"):
        if detector is None:
            st.error("Model is not loaded. Cannot perform analysis.")
        else:
            with st.spinner("Analyzing pixels, extracting features, and checking for manipulation..."):
                # Save uploaded file temporarily
                temp_path = "temp_upload.jpg"
                with open(temp_path, "wb") as f:
                    f.write(uploaded_file.getbuffer())
                
                try:
                    result = detector.predict(temp_path, save_cam_path="temp_cam.jpg")
                    
                    if "error" in result:
                        st.error(result["error"])
                    else:
                        st.subheader("Analysis Results")
                        
                        col1, col2, col3 = st.columns(3)
                        
                        col1.metric("Prediction", result["prediction"])
                        col2.metric("Confidence", f"{result['confidence_percent']}%")
                        col3.metric("Inference Time", f"{result['inference_time_seconds']} s")
                        
                        if result.get("gradcam_path") and os.path.exists(result["gradcam_path"]):
                            st.write("### Explainability (Grad-CAM Heatmap)")
                            st.write("Highlighted regions show where the model focused to make its prediction.")
                            st.image(result["gradcam_path"], use_column_width=True)
                            
                except Exception as e:
                    st.error(f"Error during prediction: {e}")
                
                # Cleanup
                if os.path.exists(temp_path):
                    os.remove(temp_path)
