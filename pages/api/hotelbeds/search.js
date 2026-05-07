import fs from 'fs';
import path from 'path';
import { hbAvailability, normalizeHotelbedsHotel } from '../../../lib/hotelbeds';

const CACHE_DIR = path.join(process.cwd(), 'data', 'hotelbeds-cache');

function safeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function cachePathForBody(body) {
  const destination = safeKey(body?.destination?.code || body?.destination?.name || 'unknown');
  const checkIn = safeKey(body?.stay?.checkIn || 'nocheckin');
  const checkOut = safeKey(body?.stay?.checkOut || 'nocheckout');
  const guests = safeKey(body?.occupancies?.[0]?.adults || '0');
  return path.join(CACHE_DIR, `${destination}_${checkIn}_${checkOut}_${guests}.csv`);
}

function ensureDir() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function escapeCsv(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows) {
  const headers = [
    'hotelCode',
    'name',
    'destinationName',
    'zoneName',
    'categoryName',
    'country',
    'price',
    'currency',
    'roomName',
    'boardName',
    'paymentType',
    'rateKey',
    'roomCode',
  ];

  const lines = [headers.join(',')];

  for (const row of rows) {
    lines.push(
      [
        row.hotelCode,
        row.name,
        row.destinationName,
        row.zoneName,
        row.categoryName,
        row.country,
        row.price,
        row.currency,
        row.roomName,
        row.boardName,
        row.paymentType,
        row.rateKey,
        row.roomCode,
      ]
        .map(escapeCsv)
        .join(',')
    );
  }

  return lines.join('\n');
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
  const lines = String(csv || '')
    .split('\n')
    .filter(Boolean);

  if (lines.length <= 1) return [];

  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] ?? '';
    });

    return {
      hotelCode: obj.hotelCode,
      id: obj.hotelCode,
      name: obj.name,
      destinationName: obj.destinationName,
      zoneName: obj.zoneName,
      categoryName: obj.categoryName,
      country: obj.country,
      price: Number(obj.price || 0),
      currency: obj.currency || 'INR',
      bestRate: {
        net: Number(obj.price || 0),
        currency: obj.currency || 'INR',
        roomName: obj.roomName || '',
        boardName: obj.boardName || '',
        paymentType: obj.paymentType || '',
        rateKey: obj.rateKey || '',
        roomCode: obj.roomCode || '',
      },
      rates: [
        {
          roomName: obj.roomName || '',
          boardName: obj.boardName || '',
          paymentType: obj.paymentType || '',
          rateKey: obj.rateKey || '',
          roomCode: obj.roomCode || '',
          net: Number(obj.price || 0),
          currency: obj.currency || 'INR',
        },
      ],
    };
  });
}

function normalizeList(data) {
  const rawHotels = data?.hotels?.hotel || data?.hotels || data?.results || [];
  const list = Array.isArray(rawHotels) ? rawHotels : [];
  return list.map(normalizeHotelbedsHotel);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = {
      ...req.body,
      destination: {
        ...(req.body?.destination || {}),
        code: String(req.body?.destination?.code || '').trim().toUpperCase(),
      },
      currency: String(req.body?.currency || 'INR').trim().toUpperCase(),
    };

    ensureDir();
    const cacheFile = cachePathForBody(body);

    if (fs.existsSync(cacheFile)) {
      const cachedCsv = fs.readFileSync(cacheFile, 'utf8');
      const results = fromCsv(cachedCsv);
      return res.status(200).json({
        results,
        raw: { cached: true, source: 'csv' },
        total: results.length,
      });
    }

    const data = await hbAvailability(body);
    const results = normalizeList(data);

    const csv = toCsv(
      results.map((hotel) => ({
        hotelCode: hotel.hotelCode || hotel.id || '',
        name: hotel.name || '',
        destinationName: hotel.destinationName || '',
        zoneName: hotel.zoneName || '',
        categoryName: hotel.categoryName || '',
        country: hotel.country || '',
        price: hotel.price || hotel.bestRate?.net || 0,
        currency: hotel.currency || hotel.bestRate?.currency || 'INR',
        roomName: hotel.bestRate?.roomName || '',
        boardName: hotel.bestRate?.boardName || '',
        paymentType: hotel.bestRate?.paymentType || '',
        rateKey: hotel.bestRate?.rateKey || '',
        roomCode: hotel.bestRate?.roomCode || '',
      }))
    );

    fs.writeFileSync(cacheFile, csv, 'utf8');

    return res.status(200).json({
      results,
      raw: data,
      total: data?.hotels?.total ?? results.length,
    });
  } catch (error) {
    console.error('Availability API failed:', error);

    try {
      const fallbackBody = {
        ...req.body,
        destination: {
          ...(req.body?.destination || {}),
          code: String(req.body?.destination?.code || '').trim().toUpperCase(),
        },
        currency: String(req.body?.currency || 'INR').trim().toUpperCase(),
      };

      const cacheFile = cachePathForBody(fallbackBody);
      if (fs.existsSync(cacheFile)) {
        const cachedCsv = fs.readFileSync(cacheFile, 'utf8');
        const results = fromCsv(cachedCsv);
        return res.status(200).json({
          results,
          raw: { cached: true, fallback: true },
          total: results.length,
        });
      }
    } catch {}

    return res.status(500).json({ error: error.message });
  }
}