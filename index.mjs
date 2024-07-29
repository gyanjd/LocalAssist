import express from 'express';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import iconv from 'iconv-lite';
import { vectorised } from './vectorised.mjs';
import { llmChat } from './embedding.mjs'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('file'), (req, res) => {
  const filePath = req.file.path;
  const outputFilePath = `uploads/processed-${req.file.originalname}`;

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return res.status(500).send('Error reading file');
    }

    const utf8Data = iconv.decode(data, 'utf8');
    fs.writeFile(outputFilePath, utf8Data, 'utf8', async (err) => {
      if (err) {
        return res.status(500).send('Error writing file');
      }
      await vectorised(`processed-${req.file.originalname}`);
      res.send(`File processed and saved as ${outputFilePath}`);
    });
  });
});

app.post('/message', async (req, res) => {
  const userMessage = req.body.message;
  const response =  await llmChat(userMessage);
  const botResponse = `LLM : "${response}"`;
  res.json({ response: botResponse });
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
