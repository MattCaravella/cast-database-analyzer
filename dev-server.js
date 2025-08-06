import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 8080;

app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Development server running at http://localhost:${PORT}`);
});