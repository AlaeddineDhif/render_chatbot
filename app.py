from flask import Flask, request, jsonify, render_template
import google.generativeai as genai
import os
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configurez l'API avec la clé API stockée dans la variable d'environnement
genai.configure(api_key=os.environ.get("API_KEY"))


# Liste des modèles disponibles
models = genai.list_models()
for model in models:
    print(f"Model Name: {model.name}")
    print(f"Supported Methods: {model.supported_generation_methods}")
    print("------")




@app.route('/')
def home():
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask_question():
    try:
        data = request.json
        prompt = data['question']
        
        # Utilisez un modèle disponible
        model = genai.GenerativeModel('gemini-pro')  # Remplacez par un modèle disponible si nécessaire
        response = model.generate_content(prompt)
        
        return jsonify({
            'success': True,
            'answer': response.text,
            'timestamp': datetime.now().strftime("%d/%m/%Y %H:%M")
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)