# Free Background Remover API

A free, open-source Node.js API server that provides background removal functionality using the powerful [rembg](https://github.com/danielgatis/rembg) Python library developed by Daniel Gatis.

## Features

- 🆓 Completely free to use
- 🖼️ Remove background from uploaded image files
- 🔗 Remove background from images via URL
- 🚀 RESTful API endpoints
- 📁 Automatic file cleanup
- 🛡️ Input validation and error handling
- 📊 Health check endpoint
- 🎯 Powered by the state-of-the-art [rembg](https://github.com/danielgatis/rembg) model

## Prerequisites

- Node.js (v14 or higher)
- Python 3.x
- Required Python packages:
  - rembg
  - Pillow
  - numpy
  - (see requirements.txt for complete list)

## Installation

1. Install Node.js dependencies:
```bash
cd api
npm install
```

2. Install Python dependencies:
```bash
pip install rembg onnxruntime Pillow requests
# Or use the requirements.txt file
pip install -r requirements.txt
```

## Usage

### Start the API server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The API will be available at `http://localhost:3001`

### API Endpoints

#### 1. Remove Background from File Upload

**POST** `/remove-background`

Upload an image file and get back the image with background removed.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: Image file with field name "image"

**Example using curl:**
```bash
curl -X POST \
  -F "image=@/path/to/your/image.jpg" \
  http://localhost:3001/remove-background \
  --output processed-image.png
```

#### 2. Remove Background from URL

**POST** `/remove-background-url`

Provide an image URL and get back the image with background removed.

**Request:**
- Method: POST
- Content-Type: application/json
- Body: `{"imageUrl": "https://example.com/image.jpg"}`

**Example using curl:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/image.jpg"}' \
  http://localhost:3001/remove-background-url \
  --output processed-image.png
```

#### 3. Health Check

**GET** `/health`

Check if the API is running.

**Example:**
```bash
curl http://localhost:3001/health
```

#### 4. API Documentation

**GET** `/`

Get API information and usage instructions.

**Example:**
```bash
curl http://localhost:3001/
```

## How It Works

This API provides a simple interface to the powerful [rembg](https://github.com/danielgatis/rembg) background removal tool. The rembg library uses machine learning models to identify and remove backgrounds from images with high accuracy.

1. The API receives an image (via file upload or URL)
2. The image is processed using the rembg Python library
3. The background is removed, producing a transparent PNG
4. The processed image is returned to the client

All processing happens server-side, with no client-side dependencies required.

## Supported Image Formats

- JPEG/JPG
- PNG
- WebP

## File Size Limits

- Maximum file size: 10MB

## Response Format

### Success Response
- Status: 200
- Content-Type: image/png
- Body: Processed image with transparent background

### Error Response
- Status: 400/500
- Content-Type: application/json
- Body: `{"error": "Error message", "details": "Additional details"}`

## Example Usage in JavaScript

### File Upload Example
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

fetch('http://localhost:3001/remove-background', {
  method: 'POST',
  body: formData
})
.then(response => response.blob())
.then(blob => {
  const imageUrl = URL.createObjectURL(blob);
  // Use the processed image
});
```

### URL Processing Example
```javascript
fetch('http://localhost:3001/remove-background-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageUrl: 'https://example.com/image.jpg'
  })
})
.then(response => response.blob())
.then(blob => {
  const imageUrl = URL.createObjectURL(blob);
  // Use the processed image
});
```

## Environment Variables

- `PORT`: Server port (default: 3001)

## Error Handling

The API includes comprehensive error handling for:
- Invalid file formats
- File size limits
- Network errors
- Python script execution errors
- File system operations

## Security Considerations

- File uploads are validated by type and size
- Temporary files are automatically cleaned up
- No sensitive data is logged
- Images are processed locally, not sent to external services

## Acknowledgements

This API is built on top of the excellent [rembg](https://github.com/danielgatis/rembg) library by Daniel Gatis.

## License

This project is open-source and free to use. Please check the rembg library's license for its usage terms.

## Development

To modify the background removal logic, edit the Python script generation in `server.js` or create a separate Python script file.

## Troubleshooting

1. **Python not found**: Ensure Python 3 is installed and accessible as `python3`
2. **Missing dependencies**: Run `pip install -r ../model/requirements.txt`
3. **Port already in use**: Change the PORT environment variable
4. **File permissions**: Ensure the API has write permissions for uploads/outputs directories
