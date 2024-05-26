const ObservasiService = require("../service/observasiService");
const path = require("path");
const fs = require("fs").promises;

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
      const { plot_id, type } = req.body;
      const files = req.files;

      const dokumentasi = await this.observasiService.createDokumentasiData(plot_id, files, type);

      res.status(201).json({ msg: "berhasil create dokumentasi" });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  createKarhutla = async (req, res) => {
    try {
      const { data } = req.body;
      const requiredFields = ["data_lahan_id", "tanggal_kejadian", "tanggal_penilaian", "dataPlot"];

      const missingFields = requiredFields.filter((field) => !data.hasOwnProperty(field));
      let falseTypeInd = 0;

      if (missingFields.length > 0) {
        res
          .status(400)
          .json({ msg: `Data belum lengkap, field yang kurang: ${missingFields.join(", ")}` });
      } else {
        data.dataPlot.forEach((plot) => {
          if (typeof plot.luasan_plot !== "number") {
            falseTypeInd++;
          }
        });
        if (falseTypeInd >= 1) {
          res.status(400).json({ msg: "jenis data tidak sesuai" });
        } else {
          const result = await this.observasiService.createKarhutlaData(data);

          res.status(201).json({ msg: "berhasil create hasil", result });
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

  getImage = async (req, res) => {
    try {
      const fileName = req.params.fileName;

      const filePath = path.join(global.__basedir, "image", "upload", fileName);

      // Read the file asynchronously
      let fileContent = {};
      try {
        fileContent = await fs.readFile(filePath);

        // Set the appropriate headers for the response
        res.setHeader("Content-Type", "image/jpeg");

        // Send the file content as the response
        res.send(fileContent);
      } catch (error) {
        res.status(400).json({ msg: "Image tidak ditemukan" });
      }
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  getImageName = async (req, res) => {
    try {
      const { plot_id, type } = req.body;
      const result = await this.observasiService.getImageName(plot_id, type);

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
