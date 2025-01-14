const Busboy = require("busboy");
const { Upload } = require("@aws-sdk/lib-storage");
const { nanoid } = require("nanoid");
const { s3Client, bucketName } = require("../config/minioClient");
const ObservasiService = require("../services/observasiService");

class ObservasiController {
  constructor() {
    this.observasiService = new ObservasiService();
  }

  /**
   * Creates a new Penilaian.
   * [POST] /observasi/penilaian
   */
  createPenilaian = async (req, res, next) => {
    try {
      const { variable, type, bobot, nilai, deskripsi, kategori } = req.body;

      const penilaian = await this.observasiService.createPenilaianData(
        variable,
        type,
        bobot,
        nilai,
        deskripsi,
        kategori
      );
      return res.status(201).json({
        status: 200,
        message: "Berhasil create penilaian",
        data: penilaian,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Creates new Dokumentasi using Busboy for file upload.
   * [POST] /observasi/dokumentasi
   */
  createDokumentasi = async (req, res, next) => {
    try {
      const busboy = Busboy({ headers: req.headers });
      const files = [];
      const fields = {};

      busboy.on("field", (fieldname, value) => {
        fields[fieldname] = value;
      });

      busboy.on("file", (file, fileInfo) => {
        const { mimeType } = fileInfo;
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
        if (!allowedTypes.includes(mimeType)) {
          return res.status(400).json({
            status: 400,
            message: "Only jpeg, jpg, or png files are allowed",
            data: null,
          });
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hour = String(now.getHours()).padStart(2, "0");
        const minute = String(now.getMinutes()).padStart(2, "0");
        const second = String(now.getSeconds()).padStart(2, "0");
        const nanoId = nanoid();

        const filenameFormatted = `${year}-${month}-${day}_${hour}-${minute}-${second}_${nanoId}`;
        const s3Key = `${year}/${month}/${fields.provinsi}/${fields.kabupaten}/${fields.kecamatan}/${fields.desa}/${fields.tipe}/${fields.kategori}/${filenameFormatted}`;

        const uploadPromise = new Upload({
          client: s3Client,
          params: {
            Bucket: bucketName,
            Key: s3Key,
            Body: file,
            ContentType: mimeType,
          },
        }).done();

        files.push({ uploadPromise, s3Key });
      });

      busboy.on("finish", async () => {
        try {
          if (files.length === 0) {
            return res.status(400).json({
              status: 400,
              message: "No files uploaded",
              data: null,
            });
          }

          const { imageUrls } = await this.observasiService.uploadDokumentasi(
            files,
            fields
          );

          return res.status(201).json({
            status: 200,
            message: "Successfully created documentation",
            data: { imageUrls },
          });
        } catch (error) {
          return next(error);
        }
      });

      req.pipe(busboy);
    } catch (error) {
      return next(error);
    }
  };

  deleteDokumentasi = async (req, res, next) => {
    try {
      const { dokumentasi_id } = req.params;
      await this.observasiService.deleteDokumentasi(dokumentasi_id);
      return res.status(200).json({
        status: 200,
        message: "Berhasil delete dokumentasi"
      });
    } catch (error) {
      return next(error);
    }
  };

  getImage = async (req, res, next) => {
    try {
      const { dokumentasi_id } = req.params;

      const fileStream = await this.observasiService.getSignedFileStream(dokumentasi_id);

      // Pipe the file stream directly to the response
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Creates new Karhutla data (observation + multiple plots).
   * [POST] /observasi
   */
  createKarhutla = async (req, res, next) => {
    try {
      const { data } = req.body;
      const result = await this.observasiService.createKarhutlaData(data);
      return res.status(201).json({
        status: 200,
        message: "Berhasil create hasil",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Retrieves all Penilaian data.
   * [GET] /observasi/penilaian
   */
  getPenilaian = async (req, res, next) => {
    try {
      const result = await this.observasiService.getPenilaianData();
      return res.status(200).json({
        status: 200,
        message: "Berhasil get penilaian",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Deletes a penilaian by ID.
   * [DELETE] /penilaian/:id
   */
  deletePenilaian = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.observasiService.deletePenilaian(id);
      return res.status(200).json({
        status: 200,
        message: "Berhasil delete penilaian",
      });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = ObservasiController;
