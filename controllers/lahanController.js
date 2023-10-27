const {
  createLokasiRegionData,
  createDataUmumLahanData,
  createLokasiTitikData,
  createKeadaanCuacaData,
} = require("../service/lahanService");

const createLokasiRegion = async (req, res) => {
  try {
    const { provinsi, kabupaten, kecamatan, desa } = req.body;

    const lokasiRegion = await createLokasiRegionData(
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

const createDataUmumLahan = async (req, res) => {
  try {
    const {
      user_id,
      region_location_id,
      tutupan_lahan,
      jenis_vegetasi,
      luasan_karhutla,
      jenis_tanah,
      tinggi_muka_air_gambut,
      jenis_karhutla,
      penggunaan_lahan,
    } = req.body;

    const dataUmumLahan = await createDataUmumLahanData(
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

const createLokasiTitik = async (req, res) => {
  try {
    const { data_lahan_id, latitude, longitude } = req.body;

    const lokasiTitik = await createLokasiTitikData(
      data_lahan_id,
      latitude,
      longitude
    );

    res.status(200).json({ msg: "berhasil create lokasi titik", lokasiTitik });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const createKeadaanCuaca = async (req, res) => {
  try {
    const { point_location_id, temperatur, cuaca_hujan, kelembaban_udara } =
      req.body;

    const keadaanCuaca = await createKeadaanCuacaData(
      point_location_id,
      temperatur,
      cuaca_hujan,
      kelembaban_udara,
    );

    res.status(200).json({ msg: "berhasil create lokasi titik", keadaanCuaca });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  createLokasiRegion,
  createDataUmumLahan,
  createLokasiTitik,
  createKeadaanCuaca,
};
