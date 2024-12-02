const ObservasiService = require("../service/observasiService");
const Dokumentasi = require("../model/dokumentasi");
const Busboy = require("busboy");
const { s3Client, bucketName } = require("../config/minioClient");
const { Upload } = require("@aws-sdk/lib-storage");
const { nanoid } = require("nanoid");

class ObservasiController {
  constructor() {
    this.observasiService = new ObservasiService();
  }

  createObservation = async (req, res) => {
    try {
      const { data_lahan_id, tanggal_kejadian, tanggal_penilaian, skor_akhir } = req.body;

      const observasi = await this.observasiService.createObservationData(
        data_lahan_id,
        tanggal_kejadian,
        tanggal_penilaian,
        skor_akhir
      );

      res.status(200).json({ msg: "berhasil create observasi", observasi });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  createPlot = async (req, res) => {
    try {
      const { observation_id, luasan_plot } = req.body;

      const plot = await this.observasiService.createPlotData(observation_id, luasan_plot);

      res.status(200).json({ msg: "berhasil create plot", plot });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  createPenilaian = async (req, res) => {
    try {
      const { variable, type, bobot, nilai, deskripsi, kategori } = req.body;

      const requiredFields = ["variable", "type", "kategori", "bobot", "nilai"];

      const missingFields = requiredFields.filter((field) => !req.body.hasOwnProperty(field));

      if (missingFields.length > 0) {
        res
          .status(400)
          .json({ msg: `Data belum lengkap, field yang kurang: ${missingFields.join(", ")}` });
      } else {
        if (deskripsi && typeof deskripsi !== "string") {
          res.status(400).json({ msg: "jenis data tidak sesuai" });
        } else {
          if (
            typeof variable !== "string" ||
            typeof type !== "string" ||
            typeof kategori !== "string" ||
            typeof bobot !== "number" ||
            typeof nilai !== "number"
          ) {
            res.status(400).json({ msg: "jenis data tidak sesuai" });
          } else {
            const penilaian = await this.observasiService.createPenilaianData(
              variable,
              type,
              bobot,
              nilai,
              deskripsi,
              kategori
            );

            res.status(201).json({ msg: "berhasil create penilaian", penilaian });
          }
        }
      }
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  createPenilaianObservasi = async (req, res) => {
    try {
      const { plot_id, penilaian_id } = req.body;

      const penilaianObservasi = await this.observasiService.createPenilaianObservasiData(
        plot_id,
        penilaian_id
      );

      res.status(200).json({ msg: "berhasil create penilaian observasi", penilaianObservasi });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  createHasil = async (req, res) => {
    try {
      const { plot_id, kondisi_vegetasi, kondisi_tanah, skor } = req.body;

      const hasil = await this.observasiService.createHasilData({
        plot_id,
        kondisi_vegetasi,
        kondisi_tanah,
        skor,
      });

      res.status(200).json({ msg: "berhasil create hasil", hasil });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  createDokumentasi = async (req, res) => {
    try {
      const busboy = Busboy({ headers: req.headers });
      const files = [];
      const fields = {};
  
      // Parse fields
      busboy.on("field", (fieldname, value) => {
        fields[fieldname] = value;
      });
  
      // Parse files
      busboy.on("file", (fieldname, file, fileInfo) => {
        const { filename, mimeType } = fileInfo;
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  
        if (!allowedTypes.includes(mimeType)) {
          return res.status(400).json({ msg: "Only jpeg, jpg, or png files are allowed" });
        }
  
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hour = String(now.getHours()).padStart(2, "0");
        const minute = String(now.getMinutes()).padStart(2, "0");
        const second = String(now.getSeconds()).padStart(2, "0");
        const nanoId = nanoid();
  
        const filenameFormatted = `${year}-${month}-${day}_${hour}-${minute}-${second}_${nanoId}_${filename}`;
        const s3Key = `${year}/${month}/${fields.provinsi}/${fields.kabupaten}/${fields.kecamatan}/${fields.desa}/${fields.tipe}/${fields.kategori}/${filenameFormatted}`;
  
        // Upload using @aws-sdk/lib-storage
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
  
      // When done parsing
      busboy.on("finish", async () => {
        // Validate required fields
        const requiredFields = [
          "penilaian_observasi_id",
          "provinsi",
          "kabupaten",
          "kecamatan",
          "desa",
          "tipe",
          "kategori",
        ];
        const missingFields = requiredFields.filter((field) => !fields[field]);
  
        if (missingFields.length > 0) {
          return res.status(400).json({
            msg: `Missing required fields: ${missingFields.join(", ")}`,
          });
        }
  
        if (files.length === 0) {
          return res.status(400).json({ msg: "No files uploaded" });
        }
  
        // Wait for all files to upload to S3
        const uploadResults = await Promise.all(
          files.map(async ({ uploadPromise, s3Key }) => {
            try {
              await uploadPromise;
              return { s3Key, success: true };
            } catch (error) {
              console.error("File upload failed:", error);
              return { s3Key, success: false, error };
            }
          })
        );
  
        // Check for failed uploads
        const failedUploads = uploadResults.filter((result) => !result.success);
        if (failedUploads.length > 0) {
          return res.status(500).json({
            msg: "Some files failed to upload",
            errors: failedUploads.map((result) => result.error.message),
          });
        }
  
        // Save successful uploads to the database
        for (const { s3Key } of uploadResults) {
          await Dokumentasi.create({
            penilaian_observasi_id: fields.penilaian_observasi_id,
            s3_key: s3Key,
            tipe: fields.tipe,
            kategori: fields.kategori,
          });
        }
  
        // Respond with success
        res.status(201).json({
          msg: "Successfully created documentation",
          dokumentasi: uploadResults.map((result) => result.s3Key),
        });
      });
  
      req.pipe(busboy);
    } catch (error) {
      console.error("Error creating documentation:", error);
      res.status(500).json({ msg: error.message });
    }
  };

  createKarhutla = async (req, res) => {
    try {
      const { data } = req.body;
      const requiredFields = ["data_lahan_id", "tanggal_kejadian", "tanggal_penilaian", "dataPlot"];

      const missingFields = requiredFields.filter((field) => !data.hasOwnProperty(field));

      if (missingFields.length > 0) {
        res.status(400).json({
          msg: `Data belum lengkap, field yang kurang: ${missingFields.join(", ")}`,
        });
      } else {
        let falseTypeInd = 0;
        data.dataPlot.forEach((plot) => {
          if (!Array.isArray(plot.coordinates)) {
            falseTypeInd++;
          }
        });
        if (falseTypeInd >= 1) {
          res.status(400).json({ msg: "Jenis data tidak sesuai" });
        } else {
          const result = await this.observasiService.createKarhutlaData(data);

          res.status(201).json({ msg: "Berhasil create hasil", result });
        }
      }
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  getPenilaian = async (req, res) => {
    try {
      const result = await this.observasiService.getPenilaianData();

      res.status(200).json({ msg: "berhasil get penilaian", result });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  getImageUrl = async (req, res) => {
    try {
      const { penilaian_observasi_id } = req.params;
      const result = await this.observasiService.getImageUrl(penilaian_observasi_id);

      res.status(200).json({ msg: "berhasil get image name", result });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  deletePenilaian = async (req, res) => {
    try {
      const { id } = req.params;

      const result = await this.observasiService.deletePenilaian(id);

      res.status(200).json({ msg: "berhasil delete penilaian", result });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };
}

module.exports = ObservasiController;
