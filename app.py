from flask import Flask, request, jsonify, render_template
import google.generativeai as genai
import os
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Assouplir les règles CORS

genai.configure(api_key=os.environ.get("YOUR_API_KEY"))

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask_question():
    try:
        data = request.get_json()
        prompt = data['question']
        
        # Configuration améliorée du modèle
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 1024
        }
        
        model = genai.GenerativeModel('gemini-pro', generation_config=generation_config)
        response = model.generate_content(prompt)
        
        return jsonify({
            'success': True,
            'answer': response.text,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)