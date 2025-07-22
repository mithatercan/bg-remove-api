const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create upload directories
const createDirectories = async () => {
  const dirs = ['uploads', 'outputs', 'temp'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(path.join(__dirname, dir), { recursive: true });
    } catch (error) {
      console.log(`Directory ${dir} already exists or couldn't be created`);
    }
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'));
    }
  }
});

// Python model runner function
const runPythonModel = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const modelScriptPath = path.join(__dirname, 'model.py');
    
    // Run the Python model script with input and output paths as arguments
    const pythonProcess = spawn('python3', [modelScriptPath, inputPath, outputPath]);
    
    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0 && output.includes('SUCCESS')) {
        resolve({ success: true, output });
      } else {
        reject(new Error(`Python model failed: ${error || output}`));
      }
    });

    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Background Remover API is running' });
});

// Remove background endpoint
app.post('/remove-background', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const inputPath = req.file.path;
    const outputFileName = `processed-${req.file.filename}`;
    const outputPath = path.join(__dirname, 'outputs', outputFileName);

    console.log(`Processing image: ${req.file.originalname}`);
    console.log(`Input path: ${inputPath}`);
    console.log(`Output path: ${outputPath}`);

    // Run Python background removal
    await runPythonModel(inputPath, outputPath);

    // Check if output file was created
    try {
      await fs.access(outputPath);
    } catch (error) {
      throw new Error('Output file was not created');
    }

    // Send the processed image back
    res.sendFile(outputPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Failed to send processed image' });
      }

      // Clean up files after sending
      setTimeout(async () => {
        try {
          await fs.unlink(inputPath);
          await fs.unlink(outputPath);
          console.log('Cleaned up temporary files');
        } catch (cleanupError) {
          console.log('Could not clean up files:', cleanupError);
        }
      }, 5000); // Clean up after 5 seconds
    });

  } catch (error) {
    console.error('Error processing image:', error);
    
    // Clean up input file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.log('Could not clean up input file:', cleanupError);
      }
    }

    res.status(500).json({ 
      error: 'Failed to process image', 
      details: error.message 
    });
  }
});

// Remove background with URL endpoint
app.post('/remove-background-url', express.json(), async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'No image URL provided' });
    }

    // Download image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const fileName = `url-image-${uuidv4()}.jpg`;
    const inputPath = path.join(__dirname, 'uploads', fileName);
    const outputFileName = `processed-${fileName}`;
    const outputPath = path.join(__dirname, 'outputs', outputFileName);

    // Save downloaded image
    await fs.writeFile(inputPath, Buffer.from(imageBuffer));

    console.log(`Processing image from URL: ${imageUrl}`);
    console.log(`Input path: ${inputPath}`);
    console.log(`Output path: ${outputPath}`);

    // Run Python background removal
    await runPythonModel(inputPath, outputPath);

    // Check if output file was created
    try {
      await fs.access(outputPath);
    } catch (error) {
      throw new Error('Output file was not created');
    }

    // Send the processed image back
    res.sendFile(outputPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Failed to send processed image' });
      }

      // Clean up files after sending
      setTimeout(async () => {
        try {
          await fs.unlink(inputPath);
          await fs.unlink(outputPath);
          console.log('Cleaned up temporary files');
        } catch (cleanupError) {
          console.log('Could not clean up files:', cleanupError);
        }
      }, 5000); // Clean up after 5 seconds
    });

  } catch (error) {
    console.error('Error processing image from URL:', error);
    res.status(500).json({ 
      error: 'Failed to process image from URL', 
      details: error.message 
    });
  }
});

// Get API info
app.get('/', (req, res) => {
  res.json({
    name: 'Background Remover API',
    version: '1.0.0',
    endpoints: {
      'POST /remove-background': 'Remove background from uploaded image file',
      'POST /remove-background-url': 'Remove background from image URL',
      'GET /health': 'Health check endpoint'
    },
    usage: {
      'file_upload': 'Send image as multipart/form-data with field name "image"',
      'url_processing': 'Send JSON with "imageUrl" field containing image URL'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  await createDirectories();
  
  app.listen(PORT, () => {
    console.log(`🚀 Background Remover API running on port ${PORT}`);
    console.log(`🏥 Health Check: ${PORT}/health`);
  });
};

startServer().catch(console.error);

module.exports = app;
