# react_flask_docker_app
Template for a webapp with React frontend and Flask in Docker backend


#### Source Document

Built using [Adam Raudonis's guide](https://adamraudonis.medium.com/how-to-deploy-a-website-on-aws-with-docker-flask-react-from-scratch-d0845ebd9da4) but porting shell commands to Powershell: 

# Geting Started

- Install [Git for Windows](https://gitforwindows.org/)

 ```shell
 git clone https://github.com/bradAnders/react_flask_docker_app.git
cd react_flask_docker_app
```

## Frontend

### Setup

- Install [Node.js 14.16](https://nodejs.org/en/)

- Create a new React aapp

```shell Windows
npx create-react-app frontend
cd frontend
```

- Create environment variables file `frontend/.env`

```.env
REACT_APP_API_URL=http://localhost:8080/api
```

- Install HTTP module [Axios](https://www.npmjs.com/package/axios) using *--save* to add to npm dependencies for this project

```shell
npm install --save axios
```

- Modify `frontend/src/App.js`

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

  React.useEffect(() => {
    axios.post(`${api_host}/submit_question`, { question }).then(({ data }) => {
      if (data) {
        setAnswer(data.answer);
      }
    });
  }, [question]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>List of topics to ask a question on</h1>
        <ul>
          {topics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
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
        <h1>Answer: {answer}</h1>
      </header>
    </div>
  );
};

export default App;

```

- Start the app

```shell
npm start
```

## Backend

### Setup

- Install [Python 3.9](https://www.python.org/downloads/windows/)

- Setup and activate virtual environment

```shell
cd ..
Set-ExecutionPolicy Unrestricted CurrentUser
python -m pip install --upgrade pip
python -m venv venv
.\venv\Scripts\activate
```

- Create python project `backend/`

```shell
mkdir backend
cd backend
pip install flask
pip install flask-cors
pip freeze > requirements.txt
```

- Create Flask app in `backend/app.py`

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
    return {"answer": f"Your Q was {len(question)} chars long"}


if __name__ == '__main__':
    app.run(port=8080)
```

- Test the app

```shell
python .\app.py
```

- Move the server part of the app to `backend/wsgi.py`

```python
from app import app


if __name__ == '__main__':

  app.run(port=8080)
```

- Use a production server from "waitress" (gunicorn not available on Windows)

```shell
pip install waitress
pip freeze > requirements.txt
waitress-serve --listen=*:8080 wsgi:app 
```

### Docker

- Install Docker Desktop for Windows https://docs.docker.com/docker-for-windows/install/

- Create `backend/Dockerfile`

```docker
# Base Docker image to start with
FROM python:3.9

# Change the shell into this directory
WORKDIR /backend

# Copy from the host machine to the container
COPY requirements.txt requirements.txt

# Run the shell command *at build time* to install python packages
RUN pip install -r requirements.txt

# Listen on this port
EXPOSE 8080

# Copy all files from host directory to the container
COPY . .

# Run the shell command *after container creation* to start the server
CMD ["waitress-serve", "--listen=*:8080", "wsgi:app"]
```

- Build and run the docker container
```shell
docker build -t app-backend .
docker run -p 8080:8080 app-backend
```

# Deploy to Amazon Web Services

## Frontend

- Install [AWS command line interface](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) and check it's installed


```shell
aws --version
```

- Create user account at [AWS Identity and Access Management](https://console.aws.amazon.com/iam/home?#) and configure the local user with the generated ID and secret key

```shell
aws configure
```

- Create an [S3 bucket](https://s3.console.aws.amazon.com/) to hold frontend files, in this case, it is called `	react-flask-docker-template`

- Edit environment variables file `frontend/.env`

```.env
REACT_APP_API_URL=/api
```

```shell
npm run build
aws s3 sync build/ s3://react-flask-docker-template --acl public-read
```

- Check the S3 bucket on AWS to make sure the static files were uploaded, and make then all public

- Create a content delivery network distribution `react-flask-docker-template.s3.amazonaws.com` on [CloudFront](https://console.aws.amazon.com/cloudfront/), linking to the S3 bucket

- Visit the [S3 hosted static content](https://d37iillsn951ev.cloudfront.net/index.html) to verify upload and correct permissions

- Create a script for the automation of frontend deployment, `deploy_frontend.bat`

```batch
call echo "Deploying Frontend..."
call cd .\frontend\
call npm run build
call aws s3 sync build/ s3://react-flask-docker-template
```

- Test the script

```shell
.\deploy_frontend.bat
```

## Backend

- Create a repository `react-flask-docker` in the [Elastic Container Registry](https://us-west-2.console.aws.amazon.com/ecr) to store the docker container

- Push the docker container

```shell
cd .\backend\
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 526520550780.dkr.ecr.us-west-2.amazonaws.com/react-flask-docker
docker build -t app-backend .
docker tag app-backend:latest 526520550780.dkr.ecr.us-west-2.amazonaws.com/react-flask-docker:latest
docker push 526520550780.dkr.ecr.us-west-2.amazonaws.com/react-flask-docker:latest
```

- Setup the docker container `react-flask-docker-app` on [Elastic Beanstalk](https://us-west-2.console.aws.amazon.com/elasticbeanstalk/)

- Go back to [AWS Identity and Access Management](https://console.aws.amazon.com/iam/home?#) and attach the policy **AmazonEC2ContainerRegistryReadOnly** to the **aws-elasticbeanstalk-ec2-role** role to allow the **Elastic Container Registry** `react-flask-docker` to talk to the **Elastic Beanstalk** `react-flask-docker-app`

- Create a the local folder in `backend/aws_deploy` and create the file `backend/aws_deploy/Dockerrun.aws.json`

```json
{
  "AWSEBDockerrunVersion": "1",
  "Image": {
    "Name": "526520550780.dkr.ecr.us-west-2.amazonaws.com/react-flask-docker",
    "Update": "true"
  },
  "Ports": [
    {
      "ContainerPort": 8080,
      "HostPort": 8080
    }
  ]
}
```

- Install Amazon Web Services Elastic Beanstalk Command Line Interface to deploy the docker image

```shell
pip install awsebcli
cd .\backend\aws_deploy\
eb init
eb deploy
```

- Visit [the dockerized api](http://reactflaskdockerapp-env.eba-a3gphbpp.us-west-2.elasticbeanstalk.com/api/get_topics) to test the deployment

Create `deploy_backend.bat` to automate the above steps

```batch
call echo "Deploying Backend..."
call cd .\backend\
call aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 526520550780.dkr.ecr.us-west-2.amazonaws.com/react-flask-docker
call docker build -t app-backend .
call docker tag app-backend:latest 526520550780.dkr.ecr.us-west-2.amazonaws.com/react-flask-docker:latest
call docker push 526520550780.dkr.ecr.us-west-2.amazonaws.com/react-flask-docker:latest
call cd .\aws_deploy\
call eb deploy
```

- Test the script

```shell
.\deploy_backend.bat
```

## Route Frontend to Backend

- Create a new (CloudFront Origin)[https://console.aws.amazon.com/cloudfront/] in the existing `react-flask-docker-template.s3.amazonaws.com`, selecting the *-- Elastic Load Balancer --* `awseb-AWSEB-...`

- Create a new (CloudFront Behavior)[https://console.aws.amazon.com/cloudfront/] at the path pattern `/api/*`

- Test out [the app](https://d37iillsn951ev.cloudfront.net/index.html)!

- Edit the first **CloudFront Origin** `react-flask-docker-template.s3.amazonaws.com` to **Restrict Bucket Access**, creating a **New Identity** if necesscary

- Edit the permissions for the **S3 Bucket** `react-flask-docker-template` to **Block all public access**

## Link the Domain Name

- Create a hosted zone `reactflaskdockerzone.io` in [AWS Route 53 Hosted Zones](https://console.aws.amazon.com/route53/v2/hostedzones#)

  - Skipping this step for now...