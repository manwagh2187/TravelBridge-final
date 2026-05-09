import fs from 'fs';
import path from 'path';
import { hbAvailability } from '../../../lib/hotelbeds';

const CACHE_DIR = path.join(process.cwd(), 'data', 'hotelbeds-cache');
const INDEX_FILE = path.join(CACHE_DIR, 'hotel-index.json');

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

function cachePathForBody(body) {
  const destination = safeKey(body?.destination?.code || body?.destination?.name || 'unknown');
  const checkIn = dateKey(body?.stay?.checkIn || 'nocheckin');
  const checkOut = dateKey(body?.stay?.checkOut || 'nocheckout');
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
    'hotelName',
    'categoryCode',
    'categoryName',
    'destinationCode',
    'destinationName',
    'zoneCode',
    'zoneName',
    'latitude',
    'longitude',
    'image',
    'imagesJson',
    'roomCode',
    'roomName',
    'rateKey',
    'rateClass',
    'rateType',
    'net',
    'allotment',
    'paymentType',
    'packaging',
    'boardCode',
    'boardName',
    'rooms',
    'adults',
    'children',
    'cancellationFrom',
    'cancellationAmount',
  ];

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(','));
  }
  return lines.join('\n');
}

function pickImages(item) {
  const candidates = [
    item?.images,
    item?.image,
    item?.photos,
    item?.pictures,
    item?.gallery,
    item?.hotel?.images,
  ];

  for (const value of candidates) {
    if (Array.isArray(value) && value.length) {
      return value
        .map((img) => {
          if (typeof img === 'string') return img;
          return img?.path || img?.url || img?.image || img?.src || '';
        })
        .filter(Boolean);
    }
  }

  return [];
}

function flattenHotel(item) {
  const images = pickImages(item);

  const hotel = {
    hotelCode: item?.code || item?.hotel?.code || '',
    hotelName: item?.name || item?.hotel?.name || '',
    categoryCode: item?.categoryCode || item?.hotel?.categoryCode || '',
    categoryName: item?.categoryName || item?.hotel?.categoryName || '',
    destinationCode: item?.destinationCode || '',
    destinationName: item?.destinationName || item?.destination?.name || '',
    zoneCode: item?.zoneCode || '',
    zoneName: item?.zoneName || '',
    latitude: item?.latitude || item?.hotel?.latitude || '',
    longitude: item?.longitude || item?.hotel?.longitude || '',
    image: images[0] || '',
    imagesJson: JSON.stringify(images),
  };

  const rooms = Array.isArray(item?.rooms) ? item.rooms : [];
  const rows = [];

  for (const room of rooms) {
    const rates = Array.isArray(room?.rates) ? room.rates : [];

    for (const rate of rates) {
      const cancellation =
        Array.isArray(rate?.cancellationPolicies) && rate.cancellationPolicies.length
          ? rate.cancellationPolicies[0]
          : {};

      rows.push({
        ...hotel,
        roomCode: room?.code || '',
        roomName: room?.name || '',
        rateKey: rate?.rateKey || '',
        rateClass: rate?.rateClass || '',
        rateType: rate?.rateType || '',
        net: rate?.net || '',
        allotment: rate?.allotment || '',
        paymentType: rate?.paymentType || '',
        packaging: rate?.packaging || '',
        boardCode: rate?.boardCode || '',
        boardName: rate?.boardName || '',
        rooms: rate?.rooms || '',
        adults: rate?.adults || '',
        children: rate?.children || '',
        cancellationFrom: cancellation?.from || '',
        cancellationAmount: cancellation?.amount || '',
      });
    }
  }

  return rows;
}

function extractHotelList(data) {
  return (
    data?.hotels?.hotel ||
    data?.hotels?.hotels ||
    data?.hotels ||
    data?.results ||
    data?.data?.hotels ||
    data?.data?.results ||
    data?.hotels?.hotelList ||
    []
  );
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

    const data = await hbAvailability(body);
    const rawHotels = extractHotelList(data);
    const list = Array.isArray(rawHotels) ? rawHotels : [];

    const results = list.flatMap(flattenHotel);

    const hotelIndex = {};
    for (const row of results) {
      if (!row.hotelCode) continue;
      if (!hotelIndex[row.hotelCode]) {
        hotelIndex[row.hotelCode] = {
          hotelCode: row.hotelCode,
          hotelName: row.hotelName,
          categoryName: row.categoryName,
          destinationName: row.destinationName,
          zoneName: row.zoneName,
          image: row.image,
          imagesJson: row.imagesJson,
        };
      }
    }

    fs.writeFileSync(cacheFile, toCsv(results), 'utf8');
    fs.writeFileSync(INDEX_FILE, JSON.stringify(hotelIndex, null, 2), 'utf8');

    return res.status(200).json({
      results,
      raw: data,
      total: results.length,
      cacheFile,
    });
  } catch (error) {
    console.error('Availability API failed:', error);
    return res.status(500).json({ error: error.message });
  }
}