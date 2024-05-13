const LahanService = require("../service/lahanService");

class LahanController {
  constructor() {
    this.lahanService = new LahanService();
  }

  createLokasiRegion = async (req, res) => {
    try {
      const { provinsi, kabupaten, kecamatan, desa } = req.body;

      const lokasiRegion = await this.lahanService.createLokasiRegionData(
        provinsi,
        kabupaten,
        kecamatan,
        desa
      );

      res.status(200).json({ msg: "berhasil create lokasi region", lokasiRegion });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  createDataUmumLahan = async (req, res) => {
    try {
      const {
        region_location_id,
        tutupan_lahan,
        jenis_vegetasi,
        luasan_karhutla,
        jenis_tanah,
        tinggi_muka_air_gambut,
        jenis_karhutla,
        penggunaan_lahan,
      } = req.body;

      // ntr ubah lagi kalo dh aktifin auth
      const user_id = req.user.id;

      const dataUmumLahan = await this.lahanService.createDataUmumLahanData(
        user_id,
        region_location_id,
        tutupan_lahan,
        jenis_vegetasi,
        luasan_karhutla,
        jenis_tanah,
        tinggi_muka_air_gambut,
        jenis_karhutla,
        penggunaan_lahan
      );

      res.status(200).json({ msg: "berhasil create data umum lahan", dataUmumLahan });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  createLahanKarhutla = async (req, res) => {
    try {
      const {
        provinsi,
        kabupaten,
        kecamatan,
        desa,
        tutupan_lahan,
        jenis_vegetasi,
        luasan_karhutla,
        jenis_tanah,
        tinggi_muka_air_gambut,
        jenis_karhutla,
        penggunaan_lahan,
        latitude,
        longitude,
        temperatur,
        cuaca_hujan,
        kelembaban_udara,
      } = req.body;

      // ntr ubah lagi kalo dh aktifin auth
      const user_id = req.user.id;

      // contoh validasi data sama ngirim response yang bener
      const requiredFields = [
        "provinsi",
        "kabupaten",
        "kecamatan",
        "desa",
        "tutupan_lahan",
        "jenis_vegetasi",
        "luasan_karhutla",
        "jenis_tanah",
        "jenis_karhutla",
        "penggunaan_lahan",
        "latitude",
        "longitude",
        "temperatur",
        "cuaca_hujan",
        "kelembaban_udara",
      ];

      const missingFields = requiredFields.filter((field) => !req.body.hasOwnProperty(field));

      if (missingFields.length > 0) {
        res
          .status(400)
          .json({ msg: `Data belum lengkap, field yang kurang: ${missingFields.join(", ")}` });
      } else {
        if (
          typeof provinsi !== "string" ||
          typeof kabupaten !== "string" ||
          typeof kecamatan !== "string" ||
          typeof desa !== "string" ||
          typeof tutupan_lahan !== "string" ||
          typeof jenis_vegetasi !== "string" ||
          typeof jenis_tanah !== "string" ||
          typeof jenis_karhutla !== "string" ||
          typeof penggunaan_lahan !== "string" ||
          typeof latitude !== "string" ||
          typeof longitude !== "string" ||
          typeof luasan_karhutla !== "number" ||
          typeof tinggi_muka_air_gambut !== "number" ||
          typeof temperatur !== "number" ||
          typeof cuaca_hujan !== "number" ||
          typeof kelembaban_udara !== "number"
        ) {
          res.status(400).json({ msg: "jenis data tidak sesuai" });
        } else {
          const dataKarhutla = await this.lahanService.createLahanKarhutlaData(
            provinsi,
            kabupaten,
            kecamatan,
            desa,
            user_id,
            tutupan_lahan,
            jenis_vegetasi,
            luasan_karhutla,
            jenis_tanah,
            tinggi_muka_air_gambut,
            jenis_karhutla,
            penggunaan_lahan,
            latitude,
            longitude,
            temperatur,
            cuaca_hujan,
            kelembaban_udara
          );

          res.status(201).json({ msg: "berhasil create data lahan Karhutla", dataKarhutla });
        }
      }
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  getSingleResult = async (req, res) => {
    try {
      const { id, obsId } = req.params;

      const result = await this.lahanService.getSingleResultData(id, obsId);

      res.status(200).json({ msg: "berhasil get single result", result });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  getResults = async (req, res) => {
    try {
      const { userId } = req.query;

      const result = await this.lahanService.getResultsData(userId);

      res.status(200).json({ msg: "berhasil get results", result });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  downloadPDF = async (req, res) => {
    try {
      const { id, obsId } = req.params;

      const result = await this.lahanService.downloadPDF(id, obsId);

      res.setHeader("Content-Type", "application/pdf");
      res.send(result);
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  deleteKarhutla = async (req, res) => {
    try {
      const { id } = req.params;

      const result = await this.lahanService.deleteKarhutla(id);

      res.status(200).json({ msg: "berhasil delete karhutla", result });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  editKarhutla = async (req, res) => {
    try {
      const { id, obsId } = req.params;
      const { data } = req.body;

      const fieldsToCheckString = [
        "provinsi",
        "kabupaten",
        "kecamatan",
        "desa",
        "tutupan_lahan",
        "jenis_vegetasi",
        "jenis_tanah",
        "jenis_karhutla",
        "penggunaan_lahan",
        "latitude",
        "longitude",
      ];

      const fieldsToCheckNumber = [
        "luasan_karhutla",
        "tinggi_muka_air_gambut",
        "temperatur",
        "cuaca_hujan",
        "kelembaban_udara",
      ];

      for (const field of fieldsToCheckString) {
        if (data[field] && typeof data[field] !== "string") {
          res.status(400).json({ msg: "jenis data tidak sesuai" });
          return;
        }
      }

      for (const field of fieldsToCheckNumber) {
        if (data[field] && typeof data[field] !== "number") {
          res.status(400).json({ msg: "jenis data tidak sesuai" });
          return;
        }
      }

      const result = await this.lahanService.editKarhutla(id, obsId, data);

      res.status(200).json({ msg: "berhasil edit karhutla", result });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };
}

module.exports = LahanController;
