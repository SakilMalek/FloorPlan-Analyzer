# backend/server.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import cv2
import pytesseract
from pdf2image import convert_from_bytes
from sklearn.cluster import DBSCAN
from collections import defaultdict
import re
import os
import google.generativeai as genai
import json
import io
import pandas as pd
from inference_sdk import InferenceHTTPClient # <-- ADDED IMPORT

# --- Initialize Flask App ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# --- Helper Functions ---
def parse_architectural_scale(scale_str, dpi):
    try:
        if ":" in scale_str:
            parts = scale_str.split(':')
            real_unit = float(parts[1])
            pixels_per_cm = dpi / 2.54
            return (pixels_per_cm * 100) / real_unit
        match = re.match(r'(\d+/\d+|\d+|\d+\.\d+)\s*"\s*=\s*(\d+)\'\s*(?:-\s*(\d+)")?', scale_str)
        if not match: return None
        drawing_inches_str, real_feet_str, real_inches_str = match.groups()
        drawing_inches = eval(drawing_inches_str) if "/" in drawing_inches_str else float(drawing_inches_str)
        total_real_inches = (float(real_feet_str) * 12) + (float(real_inches_str) if real_inches_str else 0.0)
        pixels_per_inch = (drawing_inches * dpi) / total_real_inches
        return pixels_per_inch * 39.3701
    except Exception:
        return None

def get_gemini_analysis(api_key, image, df):
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
        You are a senior architect analyst. Analyze the provided floor plan image and the initial CSV data.
        Correct room labels, group objects by room, and verify dimensions.
        Return a single, clean JSON object that is a list of dictionaries. Each dictionary represents a room and should contain 'room_name' and a list of 'objects'.
        Each object should include 'object_class', 'width_m', 'height_m', and a 'bbox' dictionary with 'x', 'y', 'width', 'height' in pixels.
        Do not include any text outside of the JSON object.

        Initial Data:
        ```csv
        {df.to_csv(index=False)}
        ```
        """
        response = model.generate_content([prompt, image])
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "").strip()
        final_data_list = json.loads(cleaned_response)
        
        rows = []
        for room in final_data_list:
            room_name = room.get('room_name', 'UNKNOWN')
            for obj in room.get('objects', []):
                rows.append({
                    'room': room_name,
                    'object_class': obj.get('object_class'),
                    'width_m': obj.get('width_m'),
                    'height_m': obj.get('height_m'),
                    'bbox': obj.get('bbox', {'x': 0, 'y': 0, 'width': 0, 'height': 0}) 
                })
        return pd.DataFrame(rows)
    except Exception as e:
        print(f"Gemini Error: {e}")
        df['bbox'] = [None] * len(df)
        return df

### NEW FUNCTION: REAL IMAGE PROCESSING ###
def process_image(image_pil, pixels_per_meter, roboflow_client):
    """
    Processes a single image: object detection, OCR, and data structuring.
    This is the real pipeline from your Streamlit app.
    """
    image_path = "temp_image_for_processing.jpg"
    image_pil.save(image_path)
    
    # --- OBJECT DETECTION ---
    try:
        print("Calling Roboflow for object detection...")
        result = roboflow_client.infer(image_path, model_id="cubicasa5k-2-qpmsa/6")
        print(f"Roboflow found {len(result.get('predictions', []))} objects.")
    except Exception as e:
        print(f"❌ Roboflow inference failed: {e}")
        return None

    # --- OCR FOR LABEL ASSOCIATION ---
    try:
        print("Performing OCR for label association...")
        ocr_data = pytesseract.image_to_data(image_pil, output_type=pytesseract.Output.DICT)
        W, H = image_pil.size
        words, boxes = [], []
        for i in range(len(ocr_data['text'])):
            word = ocr_data['text'][i]
            if word.strip() and len(word.strip()) > 1:
                x1, y1 = ocr_data['left'][i], ocr_data['top'][i]
                x2, y2 = x1 + ocr_data['width'][i], y1 + ocr_data['height'][i]
                norm_box = [int(1000 * x1 / W), int(1000 * y1 / H), int(1000 * x2 / W), int(1000 * y2 / H)]
                words.append(word)
                boxes.append(norm_box)
        
        grouped_labels = []
        if words:
            coords = np.array([[(box[0] + box[2]) / 2, (box[1] + box[3]) / 2] for box in boxes])
            clustering = DBSCAN(eps=25, min_samples=1).fit(coords)
            clusters = defaultdict(list)
            for i, word_data in enumerate(zip(words, boxes)):
                word, box = word_data
                clusters[clustering.labels_[i]].append({'text': word, 'box': box})
            for cid, items in clusters.items():
                full_text = ' '.join([i['text'] for i in items])
                avg_x = np.mean([(i['box'][0] + i['box'][2]) / 2 for i in items])
                avg_y = np.mean([(i['box'][1] + i['box'][3]) / 2 for i in items])
                grouped_labels.append({"text": full_text, "center": (avg_x, avg_y)})

        # Associate detections with labels
        for pred in result['predictions']:
            pred_center_norm = np.array([1000 * pred['x'] / W, 1000 * pred['y'] / H])
            if grouped_labels:
                distances = [np.linalg.norm(pred_center_norm - np.array(l['center'])) for l in grouped_labels]
                pred['label'] = grouped_labels[np.argmin(distances)]['text']
            else:
                pred['label'] = "UNKNOWN"
    except Exception as layout_e:
        print(f"Could not perform text layout analysis: {layout_e}")
        for pred in result['predictions']:
            pred['label'] = "UNKNOWN"

    # --- CREATE INITIAL DATAFRAME ---
    initial_data = [{
        'object_class': pred['class'],
        'room': pred.get('label', 'UNKNOWN'),
        'width_m': round(pred['width'] / pixels_per_meter, 2),
        'height_m': round(pred['height'] / pixels_per_meter, 2),
        'bbox': {
            'x': int(pred['x'] - pred['width'] / 2),
            'y': int(pred['y'] - pred['height'] / 2),
            'width': int(pred['width']),
            'height': int(pred['height'])
        }
    } for pred in result['predictions']]
    
    return pd.DataFrame(initial_data)

# --- Main API Endpoint ---
@app.route('/api/analyze', methods=['POST'])
def analyze_floorplan():
    if 'file' not in request.files: return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"error": "No selected file"}), 400

    gemini_api_key = request.form.get('geminiApiKey')
    roboflow_api_key = request.form.get('roboflowApiKey')
    scale_str = request.form.get('scale', '1/4" = 1\'')
    dpi = int(request.form.get('dpi', 300))

    if not gemini_api_key or not roboflow_api_key:
        return jsonify({"error": "API keys for Gemini and Roboflow are required"}), 400

    try:
        image_bytes = file.read()
        image_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        return jsonify({"error": f"Failed to process image: {str(e)}"}), 500

    ### MODIFIED SECTION: USE REAL ANALYSIS ###
    pixels_per_meter = parse_architectural_scale(scale_str, dpi)
    if not pixels_per_meter: return jsonify({"error": "Invalid scale format"}), 400

    # Initialize Roboflow client
    roboflow_client = InferenceHTTPClient(api_url="https://detect.roboflow.com", api_key=roboflow_api_key)
    
    # Run the real processing pipeline
    initial_df = process_image(image_pil, pixels_per_meter, roboflow_client)
    
    if initial_df is None or initial_df.empty:
        return jsonify({"error": "Failed to detect any objects in the image."}), 500
    
    print("Calling Gemini for verification...")
    final_df = get_gemini_analysis(gemini_api_key, image_pil, initial_df)

    result_json = final_df.to_json(orient="records")
    return result_json

if __name__ == '__main__':
    app.run(debug=True, port=5001)
