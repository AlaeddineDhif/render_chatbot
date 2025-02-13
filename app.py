from flask import Flask, request, jsonify, render_template, Response
import google.generativeai as genai
import os
import json
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.environ.get("AIzaSyDpBdtPhSifJaea1vSEOXyL-X23SEtmOoo"))

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask_question():
    data = request.get_json()
    prompt = data['question']
    timestamp = datetime.now().strftime("%d/%m/%Y %H:%M")

    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt, stream=True)

        def generate():
            try:
                for chunk in response:
                    yield json.dumps({
                        "chunk": chunk.text,
                        "timestamp": timestamp
                    }) + "\n"
            except Exception as e:
                yield json.dumps({
                    "error": str(e),
                    "timestamp": timestamp
                }) + "\n"

        return Response(generate(), mimetype='application/json')

    except Exception as e:
        return jsonify({
            "error": str(e),
            "timestamp": timestamp
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)