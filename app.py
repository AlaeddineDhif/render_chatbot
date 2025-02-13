@app.route('/ask', methods=['POST'])
def ask_question():
    data = request.get_json()
    prompt = data['question']
    timestamp = datetime.now().strftime("%d/%m/%Y %H:%M")  # Single timestamp
    
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

        return app.response_class(generate(), mimetype='application/json')
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "timestamp": timestamp
        }), 500