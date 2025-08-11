FROM node:18

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install Python dependencies
RUN pip3 install -r requirements.txt

# Install Node.js dependencies
RUN npm install

# Expose port (change if your server uses a different port)
EXPOSE 3000

# Start the server (update if you use a different start command)
CMD ["npm", "start"]
