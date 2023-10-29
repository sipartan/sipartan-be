const LokasiRegion = require("../model/lokasiRegion");
const DataUmumLahan = require("../model/dataUmum");
const LokasiTitik = require("../model/lokasiTitik");
const KeadaanCuaca = require("../model/keadaanCuaca");
const { Op } = require("sequelize");
const Observasi = require("../model/observasi");

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

const createLahanKarhutlaData = async (
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
) => {
  const foundRegion = await LokasiRegion.findAll({
    attributes: [
      "region_location_id",
      "provinsi",
      "kabupaten",
      "kecamatan",
      "desa",
    ],
    where: {
      [Op.and]: [
        {
          provinsi: provinsi,
        },
        {
          kabupaten: kabupaten,
        },
        {
          kecamatan: kecamatan,
        },
        {
          desa: desa,
        },
      ],
    },
  });

  let makeDataLahan = null;
  if (foundRegion.length > 0) {
    makeDataLahan = await createDataUmumLahanData(
      user_id,
      foundRegion[0].dataValues.region_location_id,
      tutupan_lahan,
      jenis_vegetasi,
      luasan_karhutla,
      jenis_tanah,
      tinggi_muka_air_gambut,
      jenis_karhutla,
      penggunaan_lahan
    );
  } else {
    const makeLokasiRegion = await createLokasiRegionData(
      provinsi,
      kabupaten,
      kecamatan,
      desa
    );

    makeDataLahan = await createDataUmumLahanData(
      user_id,
      makeLokasiRegion.region_location_id,
      tutupan_lahan,
      jenis_vegetasi,
      luasan_karhutla,
      jenis_tanah,
      tinggi_muka_air_gambut,
      jenis_karhutla,
      penggunaan_lahan
    );
  }

  const makeLokasiTitik = await createLokasiTitikData(
    makeDataLahan.data_lahan_id,
    latitude,
    longitude
  );

  await createKeadaanCuacaData(
    makeLokasiTitik.point_location_id,
    temperatur,
    cuaca_hujan,
    kelembaban_udara
  );

  return makeDataLahan;
};

const getSingleResultData = async (id, obsId) => {
  const foundLahan = await DataUmumLahan.findOne({
    attributes: [
      "data_lahan_id",
      "region_location_id",
      "tutupan_lahan",
      "luasan_karhutla",
      "jenis_karhutla",
      "penggunaan_lahan",
    ],
    where: {
      data_lahan_id: id,
    },
  });

  const foundRegion = await LokasiRegion.findOne({
    attributes: ["provinsi", "kabupaten", "kecamatan", "desa"],
    where: {
      region_location_id: foundLahan.dataValues.region_location_id,
    },
  });

  const foundTitik = await LokasiTitik.findOne({
    attributes: ["point_location_id", "latitude", "longitude"],
    where: {
      data_lahan_id: foundLahan.dataValues.data_lahan_id,
    },
  });

  const foundCuaca = await KeadaanCuaca.findOne({
    attributes: ["temperatur", "cuaca_hujan", "kelembaban_udara"],
    where: {
      point_location_id: foundTitik.dataValues.point_location_id,
    },
  });

  const foundObservasi = await Observasi.findOne({
    attributes: ["tanggal_kejadian", "tanggal_penilaian", "skor_akhir"],
    where: {
      data_lahan_id: id,
      observation_id: obsId,
    },
  });

  const skor = foundObservasi.dataValues.skor_akhir;
  let hasilPenilaian = "";
  switch (true) {
    case skor > 0 && skor <= 20:
      hasilPenilaian = "Sangat Ringan";
      break;
    case skor > 20 && skor <= 40:
      hasilPenilaian = "Ringan";
      break;
    case skor > 40 && skor <= 60:
      hasilPenilaian = "Sedang";
      break;
    case skor > 60 && skor <= 80:
      hasilPenilaian = "Berat";
      break;
    case skor > 80 && skor <= 100:
      hasilPenilaian = "Sangat Berat";
      break;

    default:
      break;
  }

  const data = {
    tutupan_lahan: foundLahan.dataValues.tutupan_lahan,
    luasan_karhutla: foundLahan.dataValues.luasan_karhutla,
    jenis_karhutla: foundLahan.dataValues.jenis_karhutla,
    provinsi: foundRegion.dataValues.provinsi,
    kabupaten: foundRegion.dataValues.kabupaten,
    kecamatan: foundRegion.dataValues.kecamatan,
    desa: foundRegion.dataValues.desa,
    latitude: foundTitik.dataValues.latitude,
    longitude: foundTitik.dataValues.longitude,
    temperatur: foundCuaca.dataValues.temperatur,
    cuaca_hujan: foundCuaca.dataValues.cuaca_hujan,
    kelembaban_udara: foundCuaca.dataValues.kelembaban_udara,
    skor: skor,
    hasil_penilaian: hasilPenilaian,
  };

  return data;
};

const getResultsData = async () => {
  const foundLahan = await DataUmumLahan.findAll({
    attributes: [
      "data_lahan_id",
      "region_location_id",
      "tutupan_lahan",
      "luasan_karhutla",
      "jenis_karhutla",
      "penggunaan_lahan",
    ],
  });

  const lahan = foundLahan.map((result) => result.dataValues);

  const data = [];
  for (let i = 0; i < lahan.length; i++) {
    const foundRegion = await LokasiRegion.findOne({
      attributes: ["provinsi", "kabupaten", "kecamatan", "desa"],
      where: {
        region_location_id: lahan[i].region_location_id,
      },
    });

    const foundTitik = await LokasiTitik.findOne({
      attributes: ["point_location_id", "latitude", "longitude"],
      where: {
        data_lahan_id: lahan[i].data_lahan_id,
      },
    });

    const foundCuaca = await KeadaanCuaca.findOne({
      attributes: ["temperatur", "cuaca_hujan", "kelembaban_udara"],
      where: {
        point_location_id: foundTitik.dataValues.point_location_id,
      },
    });

    const foundObservasi = await Observasi.findAll({
      attributes: ["tanggal_kejadian", "tanggal_penilaian", "skor_akhir"],
      where: {
        data_lahan_id: lahan[i].data_lahan_id,
      },
      order: [["createdAt", "DESC"]],
    });

    const skor = foundObservasi[0].dataValues.skor_akhir;
    let hasilPenilaian = "";
    switch (true) {
      case skor > 0 && skor <= 20:
        hasilPenilaian = "Sangat Ringan";
        break;
      case skor > 20 && skor <= 40:
        hasilPenilaian = "Ringan";
        break;
      case skor > 40 && skor <= 60:
        hasilPenilaian = "Sedang";
        break;
      case skor > 60 && skor <= 80:
        hasilPenilaian = "Berat";
        break;
      case skor > 80 && skor <= 100:
        hasilPenilaian = "Sangat Berat";
        break;

      default:
        break;
    }

    const singleData = {
      tutupan_lahan: lahan[i].tutupan_lahan,
      luasan_karhutla: lahan[i].luasan_karhutla,
      jenis_karhutla: lahan[i].jenis_karhutla,
      provinsi: foundRegion.dataValues.provinsi,
      kabupaten: foundRegion.dataValues.kabupaten,
      kecamatan: foundRegion.dataValues.kecamatan,
      desa: foundRegion.dataValues.desa,
      latitude: foundTitik.dataValues.latitude,
      longitude: foundTitik.dataValues.longitude,
      temperatur: foundCuaca.dataValues.temperatur,
      cuaca_hujan: foundCuaca.dataValues.cuaca_hujan,
      kelembaban_udara: foundCuaca.dataValues.kelembaban_udara,
      skor: skor,
      hasil_penilaian: hasilPenilaian,
    };

    data.push(singleData);
  }

  return data;
};

module.exports = {
  createLokasiRegionData,
  createDataUmumLahanData,
  createLokasiTitikData,
  createKeadaanCuacaData,
  createLahanKarhutlaData,
  getSingleResultData,
  getResultsData,
};
