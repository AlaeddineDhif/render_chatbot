from flask import Flask, request, jsonify, render_template
import google.generativeai as genai
import os
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configurez l'API avec la clé API stockée dans la variable d'environnement
genai.configure(api_key=os.environ.get("API_KEY"))

print(f"API_KEY: {os.environ.get('API_KEY')}")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask_question():
    try:
        data = request.json
        prompt = data['question']
        
        # Utilisez un modèle disponible
        model = genai.GenerativeModel('gemini-1.5-pro')  # Modèle disponible
        response = model.generate_content(prompt)
        
        # Formater la réponse pour supprimer les caractères superflus
        formatted_response = response.text.replace(':** * **', '').replace('*', '-')
        
        return jsonify({
            'success': True,
            'answer': formatted_response,
            'timestamp': datetime.now().strftime("%d/%m/%Y %H:%M")
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)