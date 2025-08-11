FROM node:18

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

WORKDIR /app

COPY . .

# Create and activate Python virtual environment, then install requirements
RUN python3 -m venv /app/venv \
    && . /app/venv/bin/activate \
    && /app/venv/bin/pip install --upgrade pip \
    && /app/venv/bin/pip install -r requirements.txt

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]
