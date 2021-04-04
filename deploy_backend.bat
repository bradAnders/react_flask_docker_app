call echo "Deploying Backend..."
call cd .\backend\
call aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 526520550780.dkr.ecr.us-west-2.amazonaws.com/react-flask-docker
call docker build -t app-backend .
call docker tag app-backend:latest 526520550780.dkr.ecr.us-west-2.amazonaws.com/react-flask-docker:latest
call docker push 526520550780.dkr.ecr.us-west-2.amazonaws.com/react-flask-docker:latest
call cd .\aws_deploy\
call eb deploy