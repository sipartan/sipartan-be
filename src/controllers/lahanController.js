const LahanService = require("../services/lahanService");

class LahanController {
  constructor() {
    this.lahanService = new LahanService();
  }

  /**
   * Creates a new Lahan Karhutla (DataUmumLahan).
   * [POST] /lahan-karhutla
   */
  createLahanKarhutla = async (req, res, next) => {
    try {
      const user_id = req.user.user_id;
      const newData = { ...req.body, user_id };

      const dataKarhutla = await this.lahanService.createLahanKarhutlaData(newData);
      return res
        .status(201)
        .json({ status: 200, message: "Berhasil create data lahan Karhutla", data: dataKarhutla });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Retrieves a single result for lahan + specific observasi.
   * [GET] /lahan-karhutla/:id/:obsId
   */
  getSingleResult = async (req, res, next) => {
    try {
      const { id, obsId } = req.params;
      const result = await this.lahanService.getSingleResultData(id, obsId);
      return res
        .status(200)
        .json({ status: 200, message: "Berhasil get single result", data: result });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Retrieves all lahan (Karhutla) with optional filters/pagination.
   * [GET] /lahan-karhutla
   */
  getResults = async (req, res, next) => {
    try {
      const filters = req.query;
      const result = await this.lahanService.getResultsData(filters);
      return res
        .status(200)
        .json({ status: 200, message: "Berhasil get results", data: result });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Downloads a PDF for a given lahan + observasi.
   * [GET] /lahan-karhutla/downloadPDF/:id/:obsId
   */
  downloadPDF = async (req, res, next) => {
    try {
      const { id, obsId } = req.params;
      const pdfBuffer = await this.lahanService.downloadPDF(id, obsId);

      res.setHeader("Content-Type", "application/pdf");
      return res.status(200).send(pdfBuffer);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Edits Karhutla data for a lahan + observasi.
   * [PUT] /lahan-karhutla/:id/:obsId
   */
  editKarhutla = async (req, res, next) => {
    try {
      const { id, obsId } = req.params;
      const updatedData = req.body.data;

      const result = await this.lahanService.editKarhutla(id, obsId, updatedData);
      return res
        .status(200)
        .json({ status: 200, message: "Berhasil edit karhutla", data: result });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Deletes a lahan (Karhutla).
   * [DELETE] /lahan-karhutla/:id
   */
  deleteKarhutla = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.lahanService.deleteKarhutla(id);
      return res
        .status(200)
        .json({ status: 200, message: "Berhasil delete karhutla", data: result });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = LahanController;
