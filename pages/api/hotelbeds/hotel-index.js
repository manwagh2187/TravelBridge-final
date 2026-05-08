import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'data', 'hotelbeds-cache');
const INDEX_FILE = path.join(CACHE_DIR, 'hotel-index.json');

export default function handler(req, res) {
  try {
    if (!fs.existsSync(INDEX_FILE)) {
      return res.status(200).json({});
    }

    const data = fs.readFileSync(INDEX_FILE, 'utf8');
    return res.status(200).json(JSON.parse(data || '{}'));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}