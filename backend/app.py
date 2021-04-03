import json
from flask import Flask, request
from flask_cors import CORS


app = Flask(__name__)
CORS(app)


# NOTE: This route is needed for the deafault EB health check route
@app.route('/')
def home():
    return "ok"


@app.route('/api/get_topics')
def get_topics():
    return {"topics": ["topic1", "other stuff", "next topic"]}


@app.route('/api/submit_question', methods=["POST"])
def submit_qustion():
    question = json.loads(request.data)["question"]
    return {"answer": f"Your q was {len(question)} chars long"}


if __name__ == '__main__':
    app.run(port=8080)
