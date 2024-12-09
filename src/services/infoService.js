const axiosClient = require('../utils/axiosClient');
require('dotenv').config();

class InfoService {
    constructor() {
        this.wilayahBaseUrl = 'https://emsifa.github.io/api-wilayah-indonesia/api';
    }
    async getProvinces() {
        const response = await axiosClient.get(`${this.wilayahBaseUrl}/provinces.json`);
        return response.data;
    }

    async getRegencies(province_id) {
        const response = await axiosClient.get(`${this.wilayahBaseUrl}/regencies/${province_id}.json`);
        return response.data;
    }

    async getDistricts(regency_id) {
        const response = await axiosClient.get(`${this.wilayahBaseUrl}/districts/${regency_id}.json`);
        return response.data;
    }

    async getVillages(district_id) {
        const response = await axiosClient.get(`${this.wilayahBaseUrl}/villages/${district_id}.json`);
        return response.data;
    }

    async getWeatherByCoordinates(lat, lon) {
        const response = await axiosClient.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                lat,
                lon,
                appid: process.env.OPENWEATHER_API_KEY
            },
        });
        return response.data;
    }

    async getWeatherByCityId(city_id) {
        const response = await axiosClient.get('https://api.bmkg.go.id/publik/prakiraan-cuaca', {
            params: {
                adm4: city_id,
            },
        });
        return response.data;
    }

    async reverseGeocodeNomatim(lat, lon) {
        const response = await axiosClient.get('https://nominatim.openstreetmap.org/reverse', {
            params: {
                lat,
                lon,
                format: 'json',
            },
        });

        return response.data;
    }

    async reverseGeocodeGeocode(lat, lon) {
        const response = await axiosClient.get('https://geocode.maps.co/reverse', {
            params: {
                lat,
                lon,
                api_key: process.env.GEOCODE_API_KEY,
            },
        });

        return response.data;
    }
}

module.exports = InfoService;