import { searchHotels, getHotelDetails, getRoomAvailability } from './tbo';
import { getCachedSearch, setCachedSearch } from './hotel-cache';
import { mapHotelSearchResult, mapRoom } from './hotel-mapper';

export async function searchIndiaHotels(params) {
  const normalized = {
    country: 'India',
    state: params.state || '',
    city: params.city || '',
    checkIn: params.checkIn || '',
    checkOut: params.checkOut || '',
    guests: Number(params.guests || 2),
    page: Number(params.page || 1),
    limit: Number(params.limit || 20),
    sort: params.sort || 'recommended',
  };

  const cached = getCachedSearch(normalized);
  if (cached) return cached;

  const raw = await searchHotels(normalized);
  const hotels = (raw.hotels || raw.results || []).map(mapHotelSearchResult);

  const result = {
    page: normalized.page,
    limit: normalized.limit,
    total: raw.total || hotels.length,
    hotels,
  };

  setCachedSearch(normalized, result);
  return result;
}

export async function loadHotelDetails(hotelId) {
  const raw = await getHotelDetails(hotelId);
  return mapHotelSearchResult(raw);
}

export async function loadHotelRooms(hotelId, params) {
  const raw = await getRoomAvailability(hotelId, params);
  return (raw.rooms || raw.results || []).map(mapRoom);
}