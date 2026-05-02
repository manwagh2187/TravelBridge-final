export function mapHotelSearchResult(item) {
  return {
    supplier: 'TBO',
    supplierHotelId: item.hotelId,
    title: item.name,
    description: item.description || '',
    city: item.city || '',
    state: item.state || '',
    country: item.country || 'India',
    address: item.address || '',
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    starRating: item.starRating ?? null,
    imagesJson: JSON.stringify(item.images || []),
    amenitiesJson: JSON.stringify(item.amenities || []),
    currency: item.currency || 'INR',
    minPrice: item.minPrice ?? null,
    taxesJson: JSON.stringify(item.taxes || {}),
    cancellationPolicyJson: JSON.stringify(item.cancellationPolicy || {}),
    status: 'active',
  };
}

export function mapRoom(item) {
  return {
    supplierRoomId: item.roomId,
    title: item.name,
    capacity: item.maxOccupancy || 2,
    mealPlan: item.mealPlan || 'Room only',
    refundability: item.refundable ? 'refundable' : 'non-refundable',
    pricePerNight: item.pricePerNight || 0,
    taxAmount: item.taxes || 0,
    totalPrice: item.total || 0,
    currency: item.currency || 'INR',
    inventory: item.availableRooms || 0,
    bedType: item.bedType || '',
    cancellationPolicyJson: JSON.stringify(item.cancellationPolicy || {}),
  };
}