# Install Python requirements
echo "Installing Python requirements..."
pip install -r requirements.txt

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

# Start the server
echo "Starting the server..."
npm start
