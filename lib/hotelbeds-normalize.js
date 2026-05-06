export function normalizeHotelbedsHotel(item) {
  return {
    id: item?.hotel?.code || item?.hotelCode || item?.code || '',
    name: item?.hotel?.name || item?.name || '',
    city: item?.destination?.name || item?.city || '',
    country: item?.country?.name || item?.country || '',
    rating: item?.rating || item?.hotel?.rating || null,
    images: item?.hotel?.images || [],
    description: item?.description || item?.hotel?.description || '',
    minPrice:
      item?.minRate?.amount ||
      item?.price?.amount ||
      item?.price ||
      0,
    currency:
      item?.minRate?.currency ||
      item?.price?.currency ||
      'INR',
    raw: item,
  };
}