# react_flask_docker_app
Template for a webapp with React frontend and Flask in Docker backend


#### Source Document

Built using the following guide but porting shell commands to Powershell: https://adamraudonis.medium.com/how-to-deploy-a-website-on-aws-with-docker-flask-react-from-scratch-d0845ebd9da4

# Geting Started

If on Windows, intsall Git https://gitforwindows.org/

```shell
git clone https://github.com/bradAnders/react_flask_docker_app.git
cd react_flask_docker_app
```

## Frontend

### Setup

Install Node.js 14.16: https://nodejs.org/en/

```shell Windows
npx create-react-app frontend
cd frontend
```
Modify App.js

```jsx
import React from "react";
import axios from "axios";
import "./App.css";

let api_host = process.env.REACT_APP_API_URL;

let App = () => {
  var [question, setQuestion] = React.useState("");
  var [topics, setTopics] = React.useState([]);
  var [answer, setAnswer] = React.useState("");

  React.useEffect(() => {
    axios.get(`${api_host}/get_topics`).then(({ data: { topics } }) => {
      setTopics(topics);
    });
  }, []);

  let handleSubmit = (event) => {
    event.preventDefault();
    axios.post(`${api_host}/submit_question`, { question }).then(({ data }) => {
      if (data) {
        setAnswer(data.answer);
      }
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>List of topics to ask a question on</h1>
        <ul>
          {topics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
        <form onSubmit={handleSubmit}>
          <label>
            Question:
            <input
              type="text"
              value={question}
              onChange={({ target }) => {
                if (target) {
                  setQuestion(target.value);
                }
              }}
            />
          </label>
          <input type="Submit" />
        </form>
        <h1>Answer: {answer}</h1>
      </header>
    </div>
  );
};

export default App;
```

Start the app

```shell
npm start
```

Install HTTP module [Axios](https://www.npmjs.com/package/axios) using *--save* to add to npm dependencies for this project

```shell
npm install --save axios
```

## Backend

### Setup

Install Python 3.9 https://www.python.org/downloads/windows/

Setup a virtual environment, using the "-m"

```shell
Set-ExecutionPolicy Unrestricted CurrentUser
python -m pip install --upgrade pip
python -m venv venv
.\venv\Scripts\activate
mkdir backend
cd backend
pip install flask
pip install flask-cors
pip freeze > requirements.txt
```

Modify app.py

```python
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
```

Test the app
```shell
python .\app.py
```

Use a production server from "waitress" (gunicorn not available on Windows)

```shell
pip install waitress
pip freeze > requirements.txt
waitress-serve --listen=*:8080 app:app 
```