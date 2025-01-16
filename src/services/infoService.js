const axiosClient = require('../utils/axiosClient');
const config = require('../config/config');
const logger = require('../utils/logger');

// class InfoService {
//     constructor() {
//         this.wilayahBaseUrl = 'https://emsifa.github.io/api-wilayah-indonesia/api';
//     }

//     /**
//      * Retrieves all provinces.
//      * @returns {Promise<Array>} List of provinces.
//      */
//     async getProvinces() {
//         try {
//             const response = await axiosClient.get(`${this.wilayahBaseUrl}/provinces.json`);
//             logger.info('Provinces retrieved successfully');
//             return response.data;
//         } catch (error) {
//             logger.error('Failed to retrieve provinces:', error);
//             throw error;
//         }
//     }

//     /**
//      * Retrieves regencies based on a province ID.
//      * @param {number|string} province_id - The ID of the province.
//      * @returns {Promise<Array>} List of regencies.
//      */
//     async getRegencies(province_id) {
//         try {
//             const response = await axiosClient.get(`${this.wilayahBaseUrl}/regencies/${province_id}.json`);
//             logger.info(`Regencies retrieved successfully for province ID: ${province_id}`);
//             return response.data;
//         } catch (error) {
//             logger.error(`Failed to retrieve regencies for province ID: ${province_id}`, error);
//             throw error;
//         }
//     }

//     /**
//      * Retrieves districts based on a regency ID.
//      * @param {number|string} regency_id - The ID of the regency.
//      * @returns {Promise<Array>} List of districts.
//      */
//     async getDistricts(regency_id) {
//         try {
//             const response = await axiosClient.get(`${this.wilayahBaseUrl}/districts/${regency_id}.json`);
//             logger.info(`Districts retrieved successfully for regency ID: ${regency_id}`);
//             return response.data;
//         } catch (error) {
//             logger.error(`Failed to retrieve districts for regency ID: ${regency_id}`, error);
//             throw error;
//         }
//     }

//     /**
//      * Retrieves villages based on a district ID.
//      * @param {number|string} district_id - The ID of the district.
//      * @returns {Promise<Array>} List of villages.
//      */
//     async getVillages(district_id) {
//         try {
//             const response = await axiosClient.get(`${this.wilayahBaseUrl}/villages/${district_id}.json`);
//             logger.info(`Villages retrieved successfully for district ID: ${district_id}`);
//             return response.data;
//         } catch (error) {
//             logger.error(`Failed to retrieve villages for district ID: ${district_id}`, error);
//             throw error;
//         }
//     }

//     /**
//      * Retrieves weather data from OpenWeather by coordinates.
//      * @param {number} lat - Latitude.
//      * @param {number} lon - Longitude.
//      * @returns {Promise<Object>} Weather data.
//      */
//     async getWeatherByCoordinates(lat, lon) {
//         try {
//             const response = await axiosClient.get('https://api.openweathermap.org/data/2.5/weather', {
//                 params: {
//                     lat,
//                     lon,
//                     appid: config.apiKeys.openWeather,
//                 },
//             });
//             logger.info(`Weather data retrieved successfully for coordinates: (${lat}, ${lon})`);
//             return response.data;
//         } catch (error) {
//             logger.error(`Failed to retrieve weather data for coordinates: (${lat}, ${lon})`, error);
//             throw error;
//         }
//     }

//     /**
//      * Retrieves weather data from BMKG by city ID.
//      * @param {number|string} city_id - ID of the city/region.
//      * @returns {Promise<Object>} Weather data.
//      */
//     async getWeatherByCityId(city_id) {
//         try {
//             const response = await axiosClient.get('https://api.bmkg.go.id/publik/prakiraan-cuaca', {
//                 params: {
//                     adm4: city_id,
//                 },
//             });
//             logger.info(`Weather data retrieved successfully for city ID: ${city_id}`);
//             return response.data;
//         } catch (error) {
//             logger.error(`Failed to retrieve weather data for city ID: ${city_id}`, error);
//             throw error;
//         }
//     }

//     /**
//      * Performs reverse geocoding using Nominatim.
//      * @param {number} lat - Latitude.
//      * @param {number} lon - Longitude.
//      * @returns {Promise<Object>} Location details.
//      */
//     async reverseGeocodeNomatim(lat, lon) {
//         try {
//             const response = await axiosClient.get('https://nominatim.openstreetmap.org/reverse', {
//                 params: {
//                     lat,
//                     lon,
//                     format: 'json',
//                 },
//             });
//             logger.info(`Reverse geocoding (Nominatim) successful for coordinates: (${lat}, ${lon})`);
//             return response.data;
//         } catch (error) {
//             logger.error(`Failed to perform reverse geocoding (Nominatim) for coordinates: (${lat}, ${lon})`, error);
//             throw error;
//         }
//     }

//     /**
//      * Performs reverse geocoding using geocode.maps.co.
//      * @param {number} lat - Latitude.
//      * @param {number} lon - Longitude.
//      * @returns {Promise<Object>} Location details.
//      */
//     async reverseGeocodeGeocode(lat, lon) {
//         try {
//             const response = await axiosClient.get('https://geocode.maps.co/reverse', {
//                 params: {
//                     lat,
//                     lon,
//                     api_key: config.apiKeys.geocoding,
//                 },
//             });
//             logger.info(`Reverse geocoding (geocode.maps.co) successful for coordinates: (${lat}, ${lon})`);
//             return response.data;
//         } catch (error) {
//             logger.error(`Failed to perform reverse geocoding (geocode.maps.co) for coordinates: (${lat}, ${lon})`, error);
//             throw error;
//         }
//     }
// }
const wilayahBaseUrl = 'https://emsifa.github.io/api-wilayah-indonesia/api';
const openWeatherBaseUrl = 'https://api.openweathermap.org/data/2.5';
const bmkgBaseUrl = 'https://api.bmkg.go.id/publik/prakiraan-cuaca';
const nominatimBaseUrl = 'https://nominatim.openstreetmap.org/reverse';
const geocodeBaseUrl = 'https://geocode.maps.co/reverse';

const OPEN_WEATHER_API_KEY = config.apiKeys.openWeather;
const GEOCODE_API_KEY = config.apiKeys.geocoding;

const getProvinces = async () => {
    try {
        const response = await axiosClient.get(`${wilayahBaseUrl}/provinces.json`);
        logger.info('Provinces retrieved successfully');
        return response.data;
    } catch (error) {
        logger.error('Failed to retrieve provinces:', error);
        throw error;
    }
}

const getRegencies = async (province_id) => {
    try {
        const response = await axiosClient.get(`${wilayahBaseUrl}/regencies/${province_id}.json`);
        logger.info(`Regencies retrieved successfully for province ID: ${province_id}`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to retrieve regencies for province ID: ${province_id}`, error);
        throw error;
    }
}

const getDistricts = async (regency_id) => {
    try {
        const response = await axiosClient.get(`${wilayahBaseUrl}/districts/${regency_id}.json`);
        logger.info(`Districts retrieved successfully for regency ID: ${regency_id}`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to retrieve districts for regency ID: ${regency_id}`, error);
        throw error;
    }
}

const getVillages = async (district_id) => {
    try {
        const response = await axiosClient.get(`${wilayahBaseUrl}/villages/${district_id}.json`);
        logger.info(`Villages retrieved successfully for district ID: ${district_id}`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to retrieve villages for district ID: ${district_id}`, error);
        throw error;
    }
}

const getWeatherByCoordinates = async (lat, lon) => {
    try {
        const response = await axiosClient.get(`${openWeatherBaseUrl}/weather`, {
            params: {
                lat,
                lon,
                appid: OPEN_WEATHER_API_KEY,
            },
        });
        logger.info(`Weather data retrieved successfully for coordinates: (${lat}, ${lon})`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to retrieve weather data for coordinates: (${lat}, ${lon})`, error);
        throw error;
    }
}

const getWeatherByCityId = async (city_id) => {
    try {
        const response = await axiosClient.get(bmkgBaseUrl, {
            params: {
                adm4: city_id,
            },
        });
        logger.info(`Weather data retrieved successfully for city ID: ${city_id}`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to retrieve weather data for city ID: ${city_id}`, error);
        throw error;
    }
}

const reverseGeocodeNomatim = async (lat, lon) => {
    try {
        const response = await axiosClient.get(nominatimBaseUrl, {
            params: {
                lat,
                lon,
                format: 'json',
                'accept-language': 'id', // Use Indonesian for better localization
            },
        });

        if (response.status === 200) {
            // const data = response.data.address;

            // // Custom interpretation of the response
            // const result = {
            //     provinsi: data.state || null, // Provinsi
            //     kabupaten: data.city || (data.city_district && !data.city ? data.city_district : null) || null, // Kabupaten/Kota
            //     kecamatan: data.suburb || (data.city_district && data.city ? data.city_district : null) || null, // Kecamatan
            //     desa: data.neighbourhood || data.village || null, // Desa
            // };

            // logger.info(`Reverse geocoding (Nominatim) successful for coordinates: (${lat}, ${lon})`);
            // return {
            //     asli: response.data.address, // Original response
            //     edit: result, // Edited response
            // };
            return response.data;
        } else {
            throw new Error(`Unexpected response: ${response.message}`);
        }
    } catch (error) {
        logger.error(`Failed to perform reverse geocoding (Nominatim)`, error);
        throw error;
    }
};

const reverseGeocodeGeocode = async (lat, lon) => {
    try {
        const response = await axiosClient.get(geocodeBaseUrl, {
            params: {
                lat,
                lon,
                api_key: GEOCODE_API_KEY,
            },
        });
        logger.info(`Reverse geocoding (geocode.maps.co) successful for coordinates: (${lat}, ${lon})`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to perform reverse geocoding (geocode.maps.co)`, error);
        throw error;
    }
}

module.exports = {
    getProvinces,
    getRegencies,
    getDistricts,
    getVillages,
    getWeatherByCoordinates,
    getWeatherByCityId,
    reverseGeocodeNomatim,
    reverseGeocodeGeocode,
};