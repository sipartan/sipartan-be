const InfoService = require('../services/infoService');

class InfoController {
    constructor() {
        this.infoService = new InfoService();
    }

    getProvinces = async (req, res) => {
        try {
            const provinces = await this.infoService.getProvinces();
            res.json(provinces);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    getRegencies = async (req, res) => {
        try {
            const { province_id } = req.params;
            const regencies = await this.infoService.getRegencies(province_id);
            res.json(regencies);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    getDistricts = async (req, res) => {
        try {
            const { regency_id } = req.params;
            const districts = await this.infoService.getDistricts(regency_id);
            res.json(districts);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    getVillages = async (req, res) => {
        try {
            const { district_id } = req.params;
            const villages = await this.infoService.getVillages(district_id);
            res.json(villages);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    getWeatherByCoordinates = async (req, res) => {
        console.log('masuk');
        try {
            const { lat, lon } = req.query;
            const weather = await this.infoService.getWeatherByCoordinates(lat, lon);
            console.log(weather);
            res.json(weather);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    getWeatherByCityId = async (req, res) => {
        try {
            const { city_id } = req.params;
            const weather = await this.infoService.getWeatherByCityId(city_id);
            res.json(weather);
        } catch (error) {
            res.status(500).json({ error: error });
        }
    }

    reverseGeocodeNomatim = async (req, res) => {
        try {
            const { lat, lon } = req.query;
            const location = await this.infoService.reverseGeocodeNomatim(lat, lon);
            res.json(location);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    reverseGeocodeGeocode = async (req, res) => {
        try {
            const { lat, lon } = req.query;
            const location = await this.infoService.reverseGeocodeGeocode(lat, lon);
            res.json(location);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = InfoController;