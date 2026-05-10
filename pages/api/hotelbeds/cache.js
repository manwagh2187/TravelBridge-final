import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'data', 'hotelbeds-cache');

function safeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function dateKey(value) {
  return String(value || '')
    .trim()
    .replace(/-/g, '_');
}

function cachePathForQuery(query) {
  const destination = safeKey(query?.destination || 'unknown');
  const checkIn = dateKey(query?.checkIn || 'nocheckin');
  const checkOut = dateKey(query?.checkOut || 'nocheckout');
  const guests = safeKey(query?.guests || '0');
  return path.join(CACHE_DIR, `${destination}_${checkIn}_${checkOut}_${guests}.csv`);
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function fromCsv(csv) {
  const lines = String(csv || '').split('\n').filter(Boolean);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] ?? '';
    });

    return {
      hotelCode: obj.hotelCode || '',
      hotelName: obj.hotelName || '',
      categoryCode: obj.categoryCode || '',
      categoryName: obj.categoryName || '',
      destinationCode: obj.destinationCode || '',
      destinationName: obj.destinationName || '',
      zoneCode: obj.zoneCode || '',
      zoneName: obj.zoneName || '',
      latitude: obj.latitude || '',
      longitude: obj.longitude || '',
      image: obj.image || '',
      imagesJson: obj.imagesJson || '[]',
      roomImage: obj.roomImage || '',
      roomImagesJson: obj.roomImagesJson || '[]',
      roomCode: obj.roomCode || '',
      roomName: obj.roomName || '',
      rateKey: obj.rateKey || '',
      rateClass: obj.rateClass || '',
      rateType: obj.rateType || '',
      net: Number(obj.net || 0),
      allotment: obj.allotment || '',
      paymentType: obj.paymentType || '',
      packaging: obj.packaging || '',
      boardCode: obj.boardCode || '',
      boardName: obj.boardName || '',
      rooms: obj.rooms || '',
      adults: obj.adults || '',
      children: obj.children || '',
      cancellationFrom: obj.cancellationFrom || '',
      cancellationAmount: obj.cancellationAmount || '',
      currency: 'INR',
      price: Number(obj.net || 0),
    };
  });
}

export default function handler(req, res) {
  const { destination, checkIn, checkOut, guests } = req.query;
  const filePath = cachePathForQuery({ destination, checkIn, checkOut, guests });

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Cache not found', filePath });
  }

  const csv = fs.readFileSync(filePath, 'utf8');
  const results = fromCsv(csv);

  return res.status(200).json({
    results,
    total: results.length,
    source: 'csv-cache',
    filePath,
  });
}