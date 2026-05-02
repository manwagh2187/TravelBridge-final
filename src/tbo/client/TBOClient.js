const axios = require('axios');

class TBOClient {
    constructor() {
        this.client = axios.create({
            baseURL: 'https://api.tbo.com', // Example base URL
            timeout: 10000,
        });
    }

    async searchHotels(params) {
        return this.client.get('/hotel/search', { params });
    }

    async getHotelDetails(hotelId) {
        return this.client.get(`/hotel/details/${hotelId}`);
    }

    async checkRoomAvailability(params) {
        return this.client.post('/hotel/availability', params);
    }

    async bookHotel(params) {
        return this.client.post('/hotel/book', params);
    }
}

module.exports = new TBOClient();