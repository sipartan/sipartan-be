const LokasiRegion = require("../model/lokasiRegion");
const DataUmumLahan = require("../model/dataUmum");
const LokasiTitik = require("../model/lokasiTitik");
const KeadaanCuaca = require("../model/keadaanCuaca");

const createLokasiRegionData = async (provinsi, kabupaten, kecamatan, desa) => {
  return await LokasiRegion.create({
    provinsi: provinsi,
    kabupaten: kabupaten,
    kecamatan: kecamatan,
    desa: desa,
  });
};

const createDataUmumLahanData = async (
  user_id,
  region_location_id,
  tutupan_lahan,
  jenis_vegetasi,
  luasan_karhutla,
  jenis_tanah,
  tinggi_muka_air_gambut,
  jenis_karhutla,
  penggunaan_lahan
) => {
  return await DataUmumLahan.create({
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
};

const createLokasiTitikData = async (data_lahan_id, latitude, longitude) => {
  return await LokasiTitik.create({
    data_lahan_id: data_lahan_id,
    latitude: latitude,
    longitude: longitude,
  });
};

const createKeadaanCuacaData = async (
  point_location_id,
  temperatur,
  cuaca_hujan,
  kelembaban_udara
) => {
  return await KeadaanCuaca.create({
    point_location_id: point_location_id,
    temperatur: temperatur,
    cuaca_hujan: cuaca_hujan,
    kelembaban_udara: kelembaban_udara,
  });
};

module.exports = {
  createLokasiRegionData,
  createDataUmumLahanData,
  createLokasiTitikData,
  createKeadaanCuacaData,
};
