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