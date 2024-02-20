const LokasiRegion = require("../model/lokasiRegion");
const DataUmumLahan = require("../model/dataUmum");
const LokasiTitik = require("../model/lokasiTitik");
const KeadaanCuaca = require("../model/keadaanCuaca");
const { Op } = require("sequelize");
const Observasi = require("../model/observasi");
const Plot = require("../model/plot");
const Hasil = require("../model/hasil");
const User = require("../model/user");
const { NotFound } = require("../utils/response")
const downloadPDFReport = require('../utils/generateReport/index');

class LahanService {
  async createLokasiRegionData (provinsi, kabupaten, kecamatan, desa) {
    return await LokasiRegion.create({
      provinsi: provinsi,
      kabupaten: kabupaten,
      kecamatan: kecamatan,
      desa: desa,
    });
  };

  async createDataUmumLahanData (
    user_id,
    region_location_id,
    tutupan_lahan,
    jenis_vegetasi,
    luasan_karhutla,
    jenis_tanah,
    tinggi_muka_air_gambut,
    jenis_karhutla,
    penggunaan_lahan
  ) {
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

  async createLokasiTitikData (data_lahan_id, latitude, longitude) {
    return await LokasiTitik.create({
      data_lahan_id: data_lahan_id,
      latitude: latitude,
      longitude: longitude,
    });
  };
  
  async createKeadaanCuacaData (
    point_location_id,
    temperatur,
    cuaca_hujan,
    kelembaban_udara
  ) {
    return await KeadaanCuaca.create({
      point_location_id: point_location_id,
      temperatur: temperatur,
      cuaca_hujan: cuaca_hujan,
      kelembaban_udara: kelembaban_udara,
    });
  };

  async createLahanKarhutlaData (
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
  ) {
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
      makeDataLahan = await this.createDataUmumLahanData(
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
      const makeLokasiRegion = await this.createLokasiRegionData(
        provinsi,
        kabupaten,
        kecamatan,
        desa
      );
  
      makeDataLahan = await this.createDataUmumLahanData(
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
  
    const makeLokasiTitik = await this.createLokasiTitikData(
      makeDataLahan.data_lahan_id,
      latitude,
      longitude
    );
  
    await this.createKeadaanCuacaData(
      makeLokasiTitik.point_location_id,
      temperatur,
      cuaca_hujan,
      kelembaban_udara
    );
  
    return makeDataLahan;
  };

  async timeAgo(date) {
    const currentDate = new Date();
    const timestamp = date.getTime();
    const currentTimestamp = currentDate.getTime();
    const difference = currentTimestamp - timestamp;

    const seconds = Math.floor(difference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (months > 0) {
        return months === 1 ? 'one month ago' : `${months} months ago`;
    } else if (weeks > 0) {
        return weeks === 1 ? 'one week ago' : `${weeks} weeks ago`;
    } else if (days > 0) {
        return days === 1 ? 'one day ago' : `${days} days ago`;
    } else if (hours > 0) {
        return hours === 1 ? 'one hour ago' : `${hours} hours ago`;
    } else if (minutes > 0) {
        return minutes === 1 ? 'one minute ago' : `${minutes} minutes ago`;
    } else {
        return 'just now';
    }
}

  async getSingleResultData (id, obsId) {
    const foundLahan = await DataUmumLahan.findOne({
      attributes: [
        "data_lahan_id",
        "region_location_id",
        "user_id",
        "tutupan_lahan",
        "luasan_karhutla",
        "jenis_karhutla",
        "penggunaan_lahan",
        "jenis_tanah",
      ],
      where: {
        data_lahan_id: id,
      },
    });
  
    const foundUser = await User.findOne({
      attributes: ["user_id", "nama", "instansi", "email", "username"],
      where: {
        user_id: foundLahan.dataValues.user_id,
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
      attributes: ["tanggal_kejadian", "tanggal_penilaian", "skor_akhir", "createdAt"],
      where: {
        data_lahan_id: id,
        observation_id: obsId,
      },
    });
  
    const foundPlot = await Plot.findAll({
      attributes: ["plot_id", "luasan_plot"],
      where: {
        observation_id: obsId,
      },
    });
    const plotIds = foundPlot.map(
      (result) => result.dataValues.plot_id
    );
    
    const resultSinglePlot = [];
    for (let i = 0; i < foundPlot.length; i++) {
      const foundHasilPlot = await Hasil.findOne({
        attributes: ["skor"],
        where: {
          plot_id: foundPlot[i].dataValues.plot_id,
        },
      });
      
      const singlePlot = {
        luas_plot: foundPlot[i].dataValues.luasan_plot,
        skor_plot: foundHasilPlot.dataValues.skor
      }

      resultSinglePlot.push(singlePlot)
    }
  
    const skor = foundObservasi.dataValues.skor_akhir;
    const tanggalKejadian = foundObservasi.dataValues.tanggal_kejadian;
    const tanggalPenilaian = foundObservasi.dataValues.tanggal_penilaian;
    const tanggalUpload = new Date(foundObservasi.dataValues.createdAt);
    const tanggalUploadFormatted = await this.timeAgo(tanggalUpload);

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
      penggunaan_lahan: foundLahan.dataValues.penggunaan_lahan,
      jenis_tanah: foundLahan.dataValues.jenis_tanah,
      nama_user: foundUser.dataValues.nama,
      instansi_user: foundUser.dataValues.instansi,
      tanggal_upload: tanggalUploadFormatted,
      provinsi: foundRegion.dataValues.provinsi,
      kabupaten: foundRegion.dataValues.kabupaten,
      kecamatan: foundRegion.dataValues.kecamatan,
      desa: foundRegion.dataValues.desa,
      latitude: foundTitik.dataValues.latitude,
      longitude: foundTitik.dataValues.longitude,
      temperatur: foundCuaca.dataValues.temperatur,
      cuaca_hujan: foundCuaca.dataValues.cuaca_hujan,
      kelembaban_udara: foundCuaca.dataValues.kelembaban_udara,
      tanggalKejadian: tanggalKejadian,
      tanggalPenilaian: tanggalPenilaian,
      single_plot: resultSinglePlot,
      skor: skor,
      hasil_penilaian: hasilPenilaian,
    };
  
    return data;
  };

  async getResultsData (userId) {
    let foundLahan;
    if (userId) {
      foundLahan = await DataUmumLahan.findAll({
        attributes: [
          "data_lahan_id",
          "region_location_id",
          "tutupan_lahan",
          "luasan_karhutla",
          "jenis_karhutla",
          "penggunaan_lahan",
        ],
        where: {
          user_id: userId,
        },
      });
    } else {
      foundLahan = await DataUmumLahan.findAll({
        attributes: [
          "data_lahan_id",
          "region_location_id",
          "tutupan_lahan",
          "luasan_karhutla",
          "jenis_karhutla",
          "penggunaan_lahan",
        ],
      });
    }
  
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
        attributes: ["observation_id", "tanggal_kejadian", "tanggal_penilaian", "skor_akhir"],
        where: {
          data_lahan_id: lahan[i].data_lahan_id,
        },
        order: [["createdAt", "DESC"]],
      });
      if (!foundObservasi) {
        throw new NotFound("Terdapat lahan yang tidak memiliki observasi");
      }
      
      if (foundObservasi.length > 0) {
        // ini baru cuma data observasi pertama aja yang ditampilin
      const skor = foundObservasi[0].dataValues.skor_akhir;
      const tanggalKejadian = foundObservasi[0].dataValues.tanggal_kejadian;
      const tanggalPenilaian = foundObservasi[0].dataValues.tanggal_penilaian;
      const observationId = foundObservasi[0].dataValues.observation_id;
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
        data_lahan_id: lahan[i].data_lahan_id,
        observation_id: observationId,
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
        tanggalKejadian: tanggalKejadian,
        tanggalPenilaian: tanggalPenilaian,
        skor: skor,
        hasil_penilaian: hasilPenilaian,
      };
  
      data.push(singleData);
      }
      
    }
  
    return data;
  };

  async downloadPDF () {
    return await downloadPDFReport();
  }

  async deleteKarhutla (id) {
    const foundLahan = await DataUmumLahan.findOne({
      where: {
        data_lahan_id: id,
      },
    });
    if (!foundLahan) {
      throw new NotFound("Lahan tidak ditemukan");
    }

    const lahanDeleted = await DataUmumLahan.destroy({
      where: {
        data_lahan_id: id,
      }
    });

    return lahanDeleted;
  };
}

module.exports = LahanService;