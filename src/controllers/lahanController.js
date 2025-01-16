const lahanService = require("../services/lahanService");

const createLahan = async (req, res, next) => {
    try {
        const newData = req.body;

        const dataKarhutla = await lahanService.createLahanData(newData);
        return res
            .status(201)
            .json({ status: 200, message: "Berhasil create data lahan Karhutla", data: dataKarhutla });
    } catch (error) {
        return next(error);
    }
}

const getAllLahan = async (req, res, next) => {
    try {
        const filters = req.query;
        const result = await lahanService.getAllLahanData(filters);
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil get results", data: result });
    } catch (error) {
        return next(error);
    }
}

const getDetailLahan = async (req, res, next) => {
    try {
        const { lahan_id } = req.params;
        const filters = req.query;
        const result = await lahanService.getDetailLahanData(lahan_id, filters);
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil get single result", data: result });
    } catch (error) {
        return next(error);
    }
}

const editLahan = async (req, res, next) => {
    try {
        const { lahan_id } = req.params;
        const newData = req.body;
        const result = await lahanService.editLahanData(lahan_id, newData);
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil edit data lahan", data: result });
    } catch (error) {
        return next(error);
    }
}

const deleteLahan = async (req, res, next) => {
    try {
        const { lahan_id } = req.params;
        await lahanService.deleteLahanData(lahan_id);
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil delete data lahan" });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    createLahan,
    getAllLahan,
    getDetailLahan,
    editLahan,
    deleteLahan,
}