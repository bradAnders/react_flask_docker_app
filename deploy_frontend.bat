call echo "Deploying Frontend..."
call cd .\frontend\
call npm run build
call aws s3 sync build/ s3://react-flask-docker-template