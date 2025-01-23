const infoService = require('../services/infoService');
const logger = require('../utils/logger');

/**
 * Retrieves a list of provinces.
 */
const getProvinces = async (req, res, next) => {
    try {
        const provinces = await infoService.getProvinces();
        logger.info('Provinces retrieved successfully');
        return res.status(200).json({ status: 200, message: 'Provinces retrieved successfully', data: provinces });
    } catch (error) {
        logger.error('Failed to retrieve provinces:', error);
        return next(error);
    }
};

/**
 * Retrieves regencies based on a province ID.
 */
const getRegencies = async (req, res, next) => {
    const { province_id } = req.params;
    try {
        const regencies = await infoService.getRegencies(province_id);
        logger.info(`Regencies retrieved successfully for province ID: ${province_id}`);
        return res.status(200).json({ status: 200, message: 'Regencies retrieved successfully', data: regencies });
    } catch (error) {
        logger.error(`Failed to retrieve regencies for province ID: ${province_id}`, error);
        return next(error);
    }
};

/**
 * Retrieves districts based on a regency ID.
 */
const getDistricts = async (req, res, next) => {
    const { regency_id } = req.params;
    try {
        const districts = await infoService.getDistricts(regency_id);
        logger.info(`Districts retrieved successfully for regency ID: ${regency_id}`);
        return res.status(200).json({ status: 200, message: 'Districts retrieved successfully', data: districts });
    } catch (error) {
        logger.error(`Failed to retrieve districts for regency ID: ${regency_id}`, error);
        return next(error);
    }
};

/**
 * Retrieves villages based on a district ID.
 */
const getVillages = async (req, res, next) => {
    const { district_id } = req.params;
    try {
        const villages = await infoService.getVillages(district_id);
        logger.info(`Villages retrieved successfully for district ID: ${district_id}`);
        return res.status(200).json({ status: 200, message: 'Villages retrieved successfully', data: villages });
    } catch (error) {
        logger.error(`Failed to retrieve villages for district ID: ${district_id}`, error);
        return next(error);
    }
};

/**
 * Retrieves weather data by coordinates from OpenWeatherMap.
 */
const getWeatherByCoordinates = async (req, res, next) => {
    const { lat, lon } = req.query;
    try {
        const weather = await infoService.getWeatherByCoordinates(lat, lon);
        logger.info(`Weather data retrieved successfully for coordinates: (${lat}, ${lon})`);
        return res.status(200).json({ status: 200, message: 'Weather data retrieved successfully', data: weather });
    } catch (error) {
        logger.error(`Failed to retrieve weather data for coordinates: (${lat}, ${lon})`, error);
        return next(error);
    }
};

/**
 * Retrieves weather data from BMKG by city ID.
 */
const getWeatherByCityId = async (req, res, next) => {
    const { city_id } = req.params;
    try {
        const weather = await infoService.getWeatherByCityId(city_id);
        logger.info(`Weather data retrieved successfully for city ID: ${city_id}`);
        return res.status(200).json({ status: 200, message: 'Weather data retrieved successfully', data: weather });
    } catch (error) {
        logger.error(`Failed to retrieve weather data for city ID: ${city_id}`, error);
        return next(error);
    }
};

/**
 * Reverse geocoding using Nominatim.
 */
const reverseGeocodeNomatim = async (req, res, next) => {
    const { lat, lon } = req.query;
    try {
        const location = await infoService.reverseGeocodeNomatim(lat, lon);
        logger.info(`Location retrieved successfully for coordinates: (${lat}, ${lon})`);
        return res.status(200).json({ status: 200, message: 'Location retrieved successfully', data: location });
    } catch (error) {
        logger.error(`Failed to retrieve location for coordinates: (${lat}, ${lon})`, error);
        return next(error);
    }
};

/**
 * Reverse geocoding using geocode.maps.co.
 */
const reverseGeocodeGeocode = async (req, res, next) => {
    const { lat, lon } = req.query; 
    try {
        const location = await infoService.reverseGeocodeGeocode(lat, lon);
        logger.info(`Location retrieved successfully for coordinates: (${lat}, ${lon})`);
        return res.status(200).json({ status: 200, message: 'Location retrieved successfully', data: location });
    } catch (error) {
        logger.error(`Failed to retrieve location for coordinates: (${lat}, ${lon})`, error);
        return next(error);
    }
};

/**
 * Reverse geocoding using google maps api.
 */
const reverseGeocodeGoogle = async (req, res, next) => {
    const { lat, lon } = req.query;
    try {
        const location = await infoService.reverseGeocodeGoogle(lat, lon);
        logger.info(`Location retrieved successfully for coordinates: (${lat}, ${lon})`);
        return res.status(200).json({ status: 200, message: 'Location retrieved successfully', data: location });
    } catch (error) {
        logger.error(`Failed to retrieve location for coordinates: (${lat}, ${lon})`, error);
        return next(error);
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