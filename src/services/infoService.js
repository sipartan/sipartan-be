const axiosClient = require('../utils/axiosClient');
const config = require('../config/config');
const logger = require('../utils/logger');
const { BadRequest, NotFound } = require('../utils/response');

const wilayahBaseUrl = 'https://emsifa.github.io/api-wilayah-indonesia/api';
const openWeatherBaseUrl = 'https://api.openweathermap.org/data/2.5';
const bmkgBaseUrl = 'https://api.bmkg.go.id/publik/prakiraan-cuaca';
const nominatimBaseUrl = 'https://nominatim.openstreetmap.org/reverse';
const geocodeBaseUrl = 'https://geocode.maps.co/reverse';
const googleGeocodeBaseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

const OPEN_WEATHER_API_KEY = config.apiKeys.openWeather;
const GEOCODE_API_KEY = config.apiKeys.geocoding;
const GOOGLE_MAPS_API_KEY = config.apiKeys.googleMaps;

const getProvinces = async () => {
    try {
        const response = await axiosClient.get(`${wilayahBaseUrl}/provinces.json`);
        return response.data;
    } catch (error) {
        logger.error('Failed to retrieve provinces', error.message);
        if (error.status === 404) {
            throw new NotFound(`Provinces with province ID ${province_id} not found`);
        }
        throw new BadRequest('Failed to retrieve provinces');
    }
};

const getRegencies = async (province_id) => {
    try {
        const response = await axiosClient.get(`${wilayahBaseUrl}/regencies/${province_id}.json`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to retrieve regencies for province ID: ${province_id}`, error.message);
        if (error.status === 404) {
            throw new NotFound(`Regencies with province ID ${province_id} not found`);
        }
        throw new BadRequest('Failed to retrieve regencies');
    }
};


const getDistricts = async (regency_id) => {
    try {
        const response = await axiosClient.get(`${wilayahBaseUrl}/districts/${regency_id}.json`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to retrieve districts for regency ID: ${regency_id}`, error.message);
        if (error.status === 404) {
            throw new NotFound(`Districts with regency ID ${regency_id} not found`);
        }
        throw new BadRequest('Failed to retrieve districts');
    }
};

const getVillages = async (district_id) => {
    try {
        const response = await axiosClient.get(`${wilayahBaseUrl}/villages/${district_id}.json`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to retrieve villages for district ID: ${district_id}`, error.message);
        if (error.status === 404) {
            throw new NotFound(`Villages with district ID ${district_id} not found`);
        }
        throw new BadRequest('Failed to retrieve villages');
    }
};

const getWeatherByCoordinates = async (lat, lon) => {
    try {
        const response = await axiosClient.get(`${openWeatherBaseUrl}/weather`, {
            params: {
                lat,
                lon,
                appid: OPEN_WEATHER_API_KEY,
                units: 'metric',
                lang: 'id',
            },
        });
        if (response.status === 200) {
            logger.info(`Weather data retrieved successfully for coordinates: (${lat}, ${lon})`);
            return response.data;
        } else {
            throw new BadRequest('Failed to retrieve weather data');
        }
    } catch (error) {
        logger.error(`Failed to retrieve weather data for coordinates: (${lat}, ${lon})`, error);
        throw new BadRequest(error.response?.data?.message || 'Failed to retrieve weather data');
    }
};

const getWeatherByCityId = async (city_id) => {
    try {
        const response = await axiosClient.get(bmkgBaseUrl, {
            params: {
                adm4: city_id,
            },
        });
        if (response.status === 200) {
            logger.info(`Weather data retrieved successfully for city ID: ${city_id}`);
            return response.data;
        } else {
            throw new BadRequest('Failed to retrieve weather data');
        }
    } catch (error) {
        logger.error(`Failed to retrieve weather data for city ID: ${city_id}`, error);
        throw new BadRequest(error.response?.data?.message || 'Failed to retrieve weather data');
    }
};

const reverseGeocodeNomatim = async (lat, lon) => {
    try {
        const response = await axiosClient.get(nominatimBaseUrl, {
            params: {
                lat,
                lon,
                format: 'json',
                'accept-language': 'id',
            },
        });

        if (response.status === 200) {
            return response.data;
        } else {
            throw new BadRequest('Unexpected response from Nominatim');
        }
    } catch (error) {
        logger.error(`Failed to perform reverse geocoding (Nominatim)`, error);
        throw new BadRequest(error.response?.data?.message || 'Failed to perform reverse geocoding');
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
        if (response.status === 200) {
            logger.info(`Reverse geocoding (geocode.maps.co) successful for coordinates: (${lat}, ${lon})`);
            return response.data;
        } else {
            throw new BadRequest('Failed to perform reverse geocoding');
        }
    } catch (error) {
        logger.error(`Failed to perform reverse geocoding (geocode.maps.co)`, error);
        throw new BadRequest(error.response?.data?.message || 'Failed to perform reverse geocoding');
    }
};

const reverseGeocodeGoogle = async (lat, lon) => {
    try {
        const response = await axiosClient.get(googleGeocodeBaseUrl, {
            params: {
                latlng: `${lat},${lon}`,
                key: GOOGLE_MAPS_API_KEY,
                language: 'id',  
            },
        });

        if (response.status === 200 && response.data.status === 'OK') {
            logger.info(`Google reverse geocoding successful for coordinates: (${lat}, ${lon})`);

            const addressComponents = response.data.results[0].address_components;

            // helper function to get component by type
            const getComponent = (type) => {
                const component = addressComponents.find((comp) => comp.types.includes(type));
                return component ? component.long_name.toUpperCase() : null;
            };

            const desa = getComponent('administrative_area_level_4');
            let kecamatan = getComponent('administrative_area_level_3');
            const kabupaten = getComponent('administrative_area_level_2');
            const provinsi = getComponent('administrative_area_level_1');

            // remove the word 'KECAMATAN' if present and trim the result, because in api wilayah indonesia that is being used above
            // the word 'KECAMATAN' is not included in the name
            if (kecamatan) {
                kecamatan = kecamatan.replace(/\bKECAMATAN\b/gi, '').trim();
            }

            const result = {
                desa,
                kecamatan,
                kabupaten,
                provinsi,
            };

            return result;
        } else {
            throw new BadRequest('Failed to perform reverse geocoding with Google Maps API');
        }
    } catch (error) {
        logger.error(`Failed to perform reverse geocoding (Google Maps API)`, error);
        throw new BadRequest(error.response?.data?.error_message || 'Failed to perform reverse geocoding with Google Maps API');
    }
};


module.exports = {
    getProvinces,
    getRegencies,
    getDistricts,
    getVillages,
    getWeatherByCoordinates,
    getWeatherByCityId,
    reverseGeocodeNomatim,
    reverseGeocodeGeocode,
    reverseGeocodeGoogle,
};