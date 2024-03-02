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

      res
        .status(200)
        .json({ msg: "berhasil create lokasi region", lokasiRegion });
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
  
      res
        .status(200)
        .json({ msg: "berhasil create data umum lahan", dataUmumLahan });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

  createLokasiTitik = async (req, res) => {
    try {
      const { data_lahan_id, latitude, longitude } = req.body;
  
      const lokasiTitik = await this.lahanService.createLokasiTitikData(
        data_lahan_id,
        latitude,
        longitude
      );
  
      res.status(200).json({ msg: "berhasil create lokasi titik", lokasiTitik });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };
  
  createKeadaanCuaca = async (req, res) => {
    try {
      const { point_location_id, temperatur, cuaca_hujan, kelembaban_udara } =
        req.body;
  
      const keadaanCuaca = await this.lahanService.createKeadaanCuacaData(
        point_location_id,
        temperatur,
        cuaca_hujan,
        kelembaban_udara
      );
  
      res.status(200).json({ msg: "berhasil create lokasi titik", keadaanCuaca });
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
  
      res
        .status(200)
        .json({ msg: "berhasil create data lahan Karhutla", dataKarhutla });
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

      res.setHeader('Content-Type', 'application/pdf');
      res.send(result);
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  }

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

      const result = await this.lahanService.editKarhutla(id, obsId, data);

      res.status(200).json({ msg: "berhasil edit karhutla", result });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  }
}

module.exports = LahanController;
