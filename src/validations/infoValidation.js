const Joi = require('joi');

const getRegencies = {
    params: Joi.object().keys({
        province_id: Joi.number().required()
    }).unknown(false)
};

const getDistricts = {
    params: Joi.object().keys({
        regency_id: Joi.number().required()
    }).unknown(false)
};

const getVillages = {
    params: Joi.object().keys({
        district_id: Joi.number().required()
    }).unknown(false)
};

const getWeatherByCoordinates = {
    query: Joi.object().keys({
        lat: Joi.number().required(),
        lon: Joi.number().required()
    }).unknown(false)
};

const reverseGeocodeNomatim = {
    query: Joi.object().keys({
        lat: Joi.number().required(),
        lon: Joi.number().required()
    }).unknown(false)
};

const getWeatherByCityId = {
    params: Joi.object().keys({
        city_id: Joi.string().required()
    }).unknown(false)
};

const reverseGeocodeGeocode = {
    query: Joi.object().keys({
        lat: Joi.number().required(),
        lon: Joi.number().required()
    }).unknown(false)
};

const reverseGeocodeGoogle = {
    query: Joi.object().keys({
        lat: Joi.number().required(),
        lon: Joi.number().required()
    }).unknown(false)
};

module.exports = {
    getRegencies,
    getDistricts,
    getVillages,
    getWeatherByCoordinates,
    reverseGeocodeNomatim,
    getWeatherByCityId,
    reverseGeocodeGeocode,
    reverseGeocodeGoogle
};