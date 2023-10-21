const LokasiRegion = require("../model/lokasiRegion");
const DataUmumLahan = require("../model/dataUmum");
const LokasiTitik = require("../model/lokasiTitik");
const KeadaanCuaca = require("../model/keadaanCuaca");

const createLokasiRegion = async (req, res) => {
  try {
    const { provinsi, kabupaten, kecamatan, desa } = req.body;

    const lokasiRegion = await LokasiRegion.create({
      provinsi: provinsi,
      kabupaten: kabupaten,
      kecamatan: kecamatan,
      desa: desa,
    });

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

    const dataUmumLahan = await DataUmumLahan.create({
      user_id: user_id,
      region_location_id: region_location_id,
      tutupan_lahan: tutupan_lahan,
      jenis_vegetasi: jenis_vegetasi,
      luasan_karhutla: luasan_karhutla,
      jenis_tanah: jenis_tanah,
      tinggi_muka_air_gambut: tinggi_muka_air_gambut,
      jenis_karhutla: jenis_karhutla,
      penggunaan_lahan: penggunaan_lahan,
    });

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

    const lokasiTitik = await LokasiTitik.create({
      data_lahan_id: data_lahan_id,
      latitude: latitude,
      longitude: longitude,
    });

    res
      .status(200)
      .json({ msg: "berhasil create lokasi titik", lokasiTitik });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const createKeadaanCuaca = async (req, res) => {
  try {
    const { point_location_id, temperatur, cuaca_hujan, kelembaban_udara } = req.body;

    const keadaanCuaca = await KeadaanCuaca.create({
      point_location_id: point_location_id,
      temperatur: temperatur,
      cuaca_hujan: cuaca_hujan,
      kelembaban_udara: kelembaban_udara,
    });

    res
      .status(200)
      .json({ msg: "berhasil create lokasi titik", keadaanCuaca });
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
