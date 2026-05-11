import fs from 'fs';
import path from 'path';
import { hbAvailability, hbHotelContent } from '../../../lib/hotelbeds';

const CACHE_DIR = path.join(process.cwd(), 'data', 'hotelbeds-cache');
const INDEX_FILE = path.join(CACHE_DIR, 'hotel-index.json');
const PHOTO_BASE = 'https://photos.hotelbeds.com/giata/';

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
    'roomImage',
    'roomImagesJson',
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

function normalizeImageUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${PHOTO_BASE}${value.replace(/^\/+/, '')}`;
}

function extractImageUrls(source) {
  const values = [];

  const candidates = [
    source?.images,
    source?.image,
    source?.photos,
    source?.pictures,
    source?.gallery,
    source?.hotel?.images,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      for (const img of candidate) {
        if (typeof img === 'string') {
          values.push(normalizeImageUrl(img));
        } else if (img && typeof img === 'object') {
          values.push(
            normalizeImageUrl(img?.path || img?.url || img?.image || img?.src || '')
          );
        }
      }
    }
  }

  return [...new Set(values.filter(Boolean))];
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

function extractContentHotels(data) {
  return (
    data?.hotels?.hotel ||
    data?.hotels ||
    data?.results ||
    data?.data?.hotels ||
    data?.data?.results ||
    []
  );
}

function pickRoomImages(room) {
  const images = extractImageUrls(room);
  if (images.length) return images;

  const nested = [];
  if (Array.isArray(room?.images)) {
    for (const item of room.images) {
      if (typeof item === 'string') nested.push(normalizeImageUrl(item));
      else if (item && typeof item === 'object') {
        nested.push(normalizeImageUrl(item?.path || item?.url || item?.image || item?.src || ''));
      }
    }
  }
  return [...new Set(nested.filter(Boolean))];
}

function flattenHotel(item, contentMeta = {}) {
  const hotelImages = contentMeta.hotelImages?.length ? contentMeta.hotelImages : extractImageUrls(item);

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
    image: hotelImages[0] || '',
    imagesJson: JSON.stringify(hotelImages),
  };

  const rooms = Array.isArray(item?.rooms) ? item.rooms : [];
  const rows = [];

  for (const room of rooms) {
    const roomImages = contentMeta.roomImagesByRoomCode?.[String(room?.code || '').trim()] || pickRoomImages(room);
    const rates = Array.isArray(room?.rates) ? room.rates : [];

    for (const rate of rates) {
      const cancellation =
        Array.isArray(rate?.cancellationPolicies) && rate.cancellationPolicies.length
          ? rate.cancellationPolicies[0]
          : {};

      rows.push({
        ...hotel,
        roomImage: roomImages[0] || '',
        roomImagesJson: JSON.stringify(roomImages),
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

    const baseResults = list.flatMap((item) => flattenHotel(item));

    const hotelCodes = [...new Set(baseResults.map((row) => String(row.hotelCode || '').trim()).filter(Boolean))];

    const contentByCode = new Map();

    if (hotelCodes.length) {
      try {
        const contentData = await hbHotelContent(hotelCodes);
        const contentHotels = extractContentHotels(contentData);

        for (const hotel of Array.isArray(contentHotels) ? contentHotels : []) {
          const code = String(hotel?.hotelCode || hotel?.code || '').trim();
          if (!code) continue;

          const hotelImages = extractImageUrls(hotel);

          const roomImagesByRoomCode = {};
          const roomList = Array.isArray(hotel?.rooms) ? hotel.rooms : [];
          for (const room of roomList) {
            const roomCode = String(room?.code || room?.roomCode || '').trim();
            if (!roomCode) continue;
            roomImagesByRoomCode[roomCode] = pickRoomImages(room);
          }

          contentByCode.set(code, {
            hotelImages,
            roomImagesByRoomCode,
          });
        }
      } catch (contentErr) {
        console.error('Hotel content lookup failed:', contentErr);
      }
    }

    const mergedResults = baseResults.map((row) => {
  const content = contentByCode.get(String(row.hotelCode || '').trim()) || {};
  const contentHotelImages = Array.isArray(content.hotelImages) ? content.hotelImages : [];
  const contentRoomImages = Array.isArray(content.roomImagesByRoomCode?.[String(row.roomCode || '').trim()])
    ? content.roomImagesByRoomCode[String(row.roomCode || '').trim()]
    : [];

  let existingHotelImages = [];
  let existingRoomImages = [];

  try {
    existingHotelImages = JSON.parse(row.imagesJson || '[]');
    if (!Array.isArray(existingHotelImages)) existingHotelImages = [];
  } catch {
    existingHotelImages = row.image ? [row.image] : [];
  }

  try {
    existingRoomImages = JSON.parse(row.roomImagesJson || '[]');
    if (!Array.isArray(existingRoomImages)) existingRoomImages = [];
  } catch {
    existingRoomImages = row.roomImage ? [row.roomImage] : [];
  }

  return {
    ...row,
    image: contentHotelImages[0] || row.image || existingHotelImages[0] || '',
    imagesJson: JSON.stringify(contentHotelImages.length ? contentHotelImages : existingHotelImages),
    roomImage: contentRoomImages[0] || row.roomImage || row.image || existingRoomImages[0] || '',
    roomImagesJson: JSON.stringify(contentRoomImages.length ? contentRoomImages : existingRoomImages),
  };
});

    const hotelIndex = {};
    for (const row of mergedResults) {
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
          roomImage: row.roomImage,
          roomImagesJson: row.roomImagesJson,
        };
      }
    }

    fs.writeFileSync(cacheFile, toCsv(mergedResults), 'utf8');
    fs.writeFileSync(INDEX_FILE, JSON.stringify(hotelIndex, null, 2), 'utf8');

    return res.status(200).json({
      results: mergedResults,
      raw: data,
      total: mergedResults.length,
      cacheFile,
    });
  } catch (error) {
    console.error('Availability API failed:', error);
    return res.status(500).json({ error: error.message });
  }
}