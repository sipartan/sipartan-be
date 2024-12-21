const InfoService = require('../services/infoService');
const logger = require('../utils/logger');

class InfoController {
    constructor() {
        this.infoService = new InfoService();
    }

    /**
     * Retrieves a list of provinces.
     */
    getProvinces = async (req, res, next) => {
        try {
            const provinces = await this.infoService.getProvinces();
            logger.info('Provinces retrieved successfully');
            return res.status(200).json(provinces);
        } catch (error) {
            logger.error('Failed to retrieve provinces:', error);
            return next(error);
        }
    };

    /**
     * Retrieves regencies based on a province ID.
     */
    getRegencies = async (req, res, next) => {
        try {
            const { province_id } = req.params;
            const regencies = await this.infoService.getRegencies(province_id);
            logger.info(`Regencies retrieved successfully for province ID: ${province_id}`);
            return res.status(200).json(regencies);
        } catch (error) {
            logger.error(`Failed to retrieve regencies for province ID: ${province_id}`, error);
            return next(error);
        }
    };

    /**
     * Retrieves districts based on a regency ID.
     */
    getDistricts = async (req, res, next) => {
        try {
            const { regency_id } = req.params;
            const districts = await this.infoService.getDistricts(regency_id);
            logger.info(`Districts retrieved successfully for regency ID: ${regency_id}`);
            return res.status(200).json(districts);
        } catch (error) {
            logger.error(`Failed to retrieve districts for regency ID: ${regency_id}`, error);
            return next(error);
        }
    };

    /**
     * Retrieves villages based on a district ID.
     */
    getVillages = async (req, res, next) => {
        try {
            const { district_id } = req.params;
            const villages = await this.infoService.getVillages(district_id);
            logger.info(`Villages retrieved successfully for district ID: ${district_id}`);
            return res.status(200).json(villages);
        } catch (error) {
            logger.error(`Failed to retrieve villages for district ID: ${district_id}`, error);
            return next(error);
        }
    };

    /**
     * Retrieves weather data by coordinates from OpenWeatherMap.
     */
    getWeatherByCoordinates = async (req, res, next) => {
        try {
            const { lat, lon } = req.query; // Validated by Joi in routes
            const weather = await this.infoService.getWeatherByCoordinates(lat, lon);
            logger.info(`Weather data retrieved successfully for coordinates: (${lat}, ${lon})`);
            return res.status(200).json(weather);
        } catch (error) {
            logger.error(`Failed to retrieve weather data for coordinates: (${lat}, ${lon})`, error);
            return next(error);
        }
    };

    /**
     * Retrieves weather data from BMKG by city ID.
     */
    getWeatherByCityId = async (req, res, next) => {
        try {
            const { city_id } = req.params;
            const weather = await this.infoService.getWeatherByCityId(city_id);
            logger.info(`Weather data retrieved successfully for city ID: ${city_id}`);
            return res.status(200).json(weather);
        } catch (error) {
            logger.error(`Failed to retrieve weather data for city ID: ${city_id}`, error);
            return next(error);
        }
    };

    /**
     * Reverse geocoding using Nominatim.
     */
    reverseGeocodeNomatim = async (req, res, next) => {
        try {
            const { lat, lon } = req.query; // Validated by Joi in routes
            const location = await this.infoService.reverseGeocodeNomatim(lat, lon);
            logger.info(`Reverse geocoding (Nominatim) successful for coordinates: (${lat}, ${lon})`);
            return res.status(200).json(location);
        } catch (error) {
            logger.error(`Failed to perform reverse geocoding (Nominatim) for coordinates: (${lat}, ${lon})`, error);
            return next(error);
        }
    };

    /**
     * Reverse geocoding using geocode.maps.co.
     */
    reverseGeocodeGeocode = async (req, res, next) => {
        try {
            const { lat, lon } = req.query; // Validated by Joi in routes
            const location = await this.infoService.reverseGeocodeGeocode(lat, lon);
            logger.info(`Reverse geocoding (geocode.maps.co) successful for coordinates: (${lat}, ${lon})`);
            return res.status(200).json(location);
        } catch (error) {
            logger.error(`Failed to perform reverse geocoding (geocode.maps.co) for coordinates: (${lat}, ${lon})`, error);
            return next(error);
        }
    };
}

module.exports = InfoController;