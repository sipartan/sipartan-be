const LokasiRegion = require("../model/lokasiRegion");
const DataUmumLahan = require("../model/dataUmum");
const { Op, where } = require("sequelize");
const Observasi = require("../model/observasi");
const Plot = require("../model/plot");
const Hasil = require("../model/hasil");
const User = require("../model/user");
const { NotFound } = require("../utils/response");
const downloadPDFReport = require("../utils/generateReport/index");
const PenilaianObservasi = require("../model/penilaianObservasi");
const Penilaian = require("../model/penilaian");
const paginate = require('../utils/pagination');
const Dokumentasi = require("../model/dokumentasi");

class LahanService {
  async createLokasiRegionData(provinsi, kabupaten, kecamatan, desa) {
    return await LokasiRegion.create({
      provinsi: provinsi,
      kabupaten: kabupaten,
      kecamatan: kecamatan,
      desa: desa,
    });
  }

  async createDataUmumLahanData(
    user_id,
    region_location_id,
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
    curah_hujan,
    kelembaban_udara
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
      latitude: latitude,
      longitude: longitude,
      temperatur: temperatur,
      curah_hujan: curah_hujan,
      kelembaban_udara: kelembaban_udara,
    });
  }

  async createLahanKarhutlaData(
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
    curah_hujan,
    kelembaban_udara
  ) {
    const foundRegion = await LokasiRegion.findAll({
      attributes: ["region_location_id", "provinsi", "kabupaten", "kecamatan", "desa"],
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
        penggunaan_lahan,
        latitude,
        longitude,
        temperatur,
        curah_hujan,
        kelembaban_udara
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
        penggunaan_lahan,
        latitude,
        longitude,
        temperatur,
        curah_hujan,
        kelembaban_udara
      );
    }

    return makeDataLahan;
  }

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
      return months === 1 ? "one month ago" : `${months} months ago`;
    } else if (weeks > 0) {
      return weeks === 1 ? "one week ago" : `${weeks} weeks ago`;
    } else if (days > 0) {
      return days === 1 ? "one day ago" : `${days} days ago`;
    } else if (hours > 0) {
      return hours === 1 ? "one hour ago" : `${hours} hours ago`;
    } else if (minutes > 0) {
      return minutes === 1 ? "one minute ago" : `${minutes} minutes ago`;
    } else {
      return "just now";
    }
  }

  async getSingleResultData(id, obsId) {
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
        "jenis_vegetasi",
        "tinggi_muka_air_gambut",
        "latitude",
        "longitude",
        "temperatur",
        "curah_hujan",
        "kelembaban_udara",
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
    const plotIds = foundPlot.map((result) => result.dataValues.plot_id);

    const resultSinglePlot = [];
    for (let i = 0; i < foundPlot.length; i++) {
      const foundHasilPlot = await Hasil.findOne({
        attributes: ["skor"],
        where: {
          plot_id: foundPlot[i].dataValues.plot_id,
        },
      });

      const foundPenilaianObservasi = await PenilaianObservasi.findAll({
        attributes: ["penilaian_id", "penilaian_observasi_id", "plot_id"],
        where: {
          plot_id: foundPlot[i].dataValues.plot_id,
        },
      });

      const foundPenilaianIds = [];

      for (let i = 0; i < foundPenilaianObservasi.length; i++) {
        let foundPenilaianIdsObj = {};
        foundPenilaianIdsObj.penilaianObservasiIds =
          foundPenilaianObservasi[i].dataValues.penilaian_observasi_id;
        foundPenilaianIdsObj.penilaianIds = foundPenilaianObservasi[i].dataValues.penilaian_id;

        const penilaianattr = await Penilaian.findOne({
          attributes: ["variable", "kategori", "deskripsi"],
          where: {
            penilaian_id: foundPenilaianObservasi[i].dataValues.penilaian_id,
          },
        });

        const foundImageName = await Dokumentasi.findAll({
          attributes: ["nama"],
          where: {
            plot_id: foundPenilaianObservasi[i].dataValues.plot_id,
            type: penilaianattr.dataValues.kategori,
          },
        });

        let imageNames = [];
        if (foundImageName.length > 0) {
          imageNames = foundImageName.map((result) => result.dataValues.nama);
        }

        foundPenilaianIdsObj.penilaianName = penilaianattr.dataValues.variable;
        foundPenilaianIdsObj.penilaianKategori = penilaianattr.dataValues.kategori;
        foundPenilaianIdsObj.penilaianDeskripsi = penilaianattr.dataValues.deskripsi || "";
        foundPenilaianIdsObj.penilaianImgNames = imageNames;
        foundPenilaianIds.push(foundPenilaianIdsObj);
      }

      const skorPlot = foundHasilPlot.dataValues.skor;
      let hasilPlot = "";

      switch (true) {
        case skorPlot > 0 && skorPlot <= 20:
          hasilPlot = "Sangat Ringan";
          break;
        case skorPlot > 20 && skorPlot <= 40:
          hasilPlot = "Ringan";
          break;
        case skorPlot > 40 && skorPlot <= 60:
          hasilPlot = "Sedang";
          break;
        case skorPlot > 60 && skorPlot <= 80:
          hasilPlot = "Berat";
          break;
        case skorPlot > 80 && skorPlot <= 100:
          hasilPlot = "Sangat Berat";
          break;

        default:
          break;
      }

      const singlePlot = {
        plot_id: foundPlot[i].dataValues.plot_id,
        luas_plot: foundPlot[i].dataValues.luasan_plot,
        skor_plot: skorPlot,
        hasil_plot: hasilPlot,
        penilaianIdsSinglePlot: foundPenilaianIds,
      };

      resultSinglePlot.push(singlePlot);
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
      jenis_vegetasi: foundLahan.dataValues.jenis_vegetasi,
      tinggi_muka_air_gambut: foundLahan.dataValues.tinggi_muka_air_gambut,
      nama_user: foundUser.dataValues.nama,
      instansi_user: foundUser.dataValues.instansi,
      tanggal_upload: tanggalUploadFormatted,
      provinsi: foundRegion.dataValues.provinsi,
      kabupaten: foundRegion.dataValues.kabupaten,
      kecamatan: foundRegion.dataValues.kecamatan,
      desa: foundRegion.dataValues.desa,
      latitude: foundLahan.dataValues.latitude,
      longitude: foundLahan.dataValues.longitude,
      temperatur: foundLahan.dataValues.temperatur,
      curah_hujan: foundLahan.dataValues.curah_hujan,
      kelembaban_udara: foundLahan.dataValues.kelembaban_udara,
      tanggalKejadian: tanggalKejadian,
      tanggalPenilaian: tanggalPenilaian,
      single_plot: resultSinglePlot,
      skor: skor,
      hasil_penilaian: hasilPenilaian,
    };

    return data;
  }

  async getResultsData(filters) {
    const {
      userId,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "DESC",
      hasil_penilaian,
      skor_min,
      skor_max,
      date_start,
      date_end,
    } = filters;

    const where = {};

    if (userId) {
      where.user_id = userId;
    }

    if (date_start && date_end) {
      where.createdAt = {
        [Op.between]: [new Date(date_start), new Date(date_end)],
      };
    } else if (date_start) {
      where.createdAt = {
        [Op.gte]: new Date(date_start),
      };
    } else if (date_end) {
      where.createdAt = {
        [Op.lte]: new Date(date_end),
      };
    }

    // Use include to join Observasi and filter by skor
    const include = [
      {
        model: Observasi,
        attributes: ["observation_id", "skor_akhir", "createdAt"],
        where: {},
        required: true,
      },
    ];

    if (skor_min && skor_max) {
      include[0].where.skor_akhir = {
        [Op.between]: [parseFloat(skor_min), parseFloat(skor_max)],
      };
    } else if (skor_min) {
      include[0].where.skor_akhir = {
        [Op.gte]: parseFloat(skor_min),
      };
    } else if (skor_max) {
      include[0].where.skor_akhir = {
        [Op.lte]: parseFloat(skor_max),
      };
    }

    if (hasil_penilaian) {
      const skorRange = this.getSkorRangeFromHasilPenilaian(hasil_penilaian);
      if (skorRange) {
        include[0].where.skor_akhir = {
          [Op.between]: [skorRange.min, skorRange.max],
        };
      }
    }

    const options = {
      where,
      attributes: [
        "data_lahan_id",
        "region_location_id",
        "tutupan_lahan",
        "luasan_karhutla",
        "jenis_karhutla",
        "penggunaan_lahan",
        "latitude",
        "longitude",
        "temperatur",
        "curah_hujan",
        "kelembaban_udara",
        "createdAt",
        "updatedAt",
      ],
      include,
      order: [[sortBy, order]],
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const result = await paginate(DataUmumLahan, options);

    // Process the results to add additional data like hasil_penilaian
    // for (const lahan of result.results) {
    //   const skor = lahan.observasis[0].skor_akhir;
    //   lahan.dataValues.skor = skor;
    //   lahan.dataValues.hasil_penilaian = this.getHasilPenilaianFromSkor(skor);
    // }

    return result;
  }

  getSkorRangeFromHasilPenilaian(hasil_penilaian) {
    // Map hasil_penilaian to skor ranges
    switch (hasil_penilaian.toLowerCase()) {
      case "sangat ringan":
        return { min: 0, max: 20 };
      case "ringan":
        return { min: 21, max: 40 };
      case "sedang":
        return { min: 41, max: 60 };
      case "berat":
        return { min: 61, max: 80 };
      case "sangat berat":
        return { min: 81, max: 100 };
      default:
        return null;
    }
  }

  getHasilPenilaianFromSkor(skor) {
    switch (true) {
      case skor >= 0 && skor <= 20:
        return "Sangat Ringan";
      case skor > 20 && skor <= 40:
        return "Ringan";
      case skor > 40 && skor <= 60:
        return "Sedang";
      case skor > 60 && skor <= 80:
        return "Berat";
      case skor > 80 && skor <= 100:
        return "Sangat Berat";
      default:
        return "Tidak Diketahui";
    }
  }

  async downloadPDF(id, obsId) {
    const dataPDF = await this.getSingleResultData(id, obsId);

    return await downloadPDFReport(dataPDF);
  }

  async deleteKarhutla(id) {
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
      },
    });

    return lahanDeleted;
  }

  async editKarhutla(id, obsId, data) {
    const {
      tutupan_lahan,
      jenis_vegetasi,
      luasan_karhutla,
      jenis_tanah,
      tinggi_muka_air_gambut,
      jenis_karhutla,
      penggunaan_lahan,
      provinsi,
      kabupaten,
      kecamatan,
      desa,
      latitude,
      longitude,
      temperatur,
      curah_hujan,
      kelembaban_udara,
      tanggal_kejadian,
      tanggal_penilaian,
      data_indikator,
      luas_plot,
    } = data;

    const foundLahan = await DataUmumLahan.findOne({
      where: { data_lahan_id: id },
    });

    const lahanToEdit = await DataUmumLahan.update(
      {
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
        curah_hujan,
        kelembaban_udara,
      },
      { where: { data_lahan_id: id } }
    );

    const foundRegion = await LokasiRegion.findOne({
      where: { region_location_id: foundLahan.dataValues.region_location_id },
    });

    if (provinsi || kabupaten || kecamatan || desa) {
      const regionExisted = await LokasiRegion.findAll({
        attributes: ["region_location_id", "provinsi", "kabupaten", "kecamatan", "desa"],
        where: {
          [Op.and]: [
            { provinsi: provinsi || foundRegion.dataValues.provinsi },
            { kabupaten: kabupaten || foundRegion.dataValues.kabupaten },
            { kecamatan: kecamatan || foundRegion.dataValues.kecamatan },
            { desa: desa || foundRegion.dataValues.desa },
          ],
        },
      });

      if (regionExisted.length > 0) {
        foundLahan.region_location_id = regionExisted[0].dataValues.region_location_id;
        await foundLahan.save();
      } else {
        const makeLokasiRegion = await this.createLokasiRegionData(
          provinsi || foundRegion.dataValues.provinsi,
          kabupaten || foundRegion.dataValues.kabupaten,
          kecamatan || foundRegion.dataValues.kecamatan,
          desa || foundRegion.dataValues.desa
        );

        foundLahan.region_location_id = makeLokasiRegion.region_location_id;
        await foundLahan.save();
      }
    }

    // Update observation dates
    await Observasi.update(
      { tanggal_kejadian, tanggal_penilaian },
      { where: { observation_id: obsId } }
    );

    // Update each plot with new area and polygon geometry if provided
    if (luas_plot) {
      for (let i = 0; i < luas_plot.length; i++) {
        const { plot_id, coordinates } = luas_plot[i];

        // Create a GeoJSON polygon from the provided coordinates
        const polygonGeoJSON = {
          type: "Polygon",
          coordinates: [coordinates],
        };

        // Calculate the area in square meters and convert to hectares
        const area = turf.area(polygonGeoJSON);
        const luasan_plot = area / 10000; // Convert to hectares

        await Plot.update(
          {
            luasan_plot: luasan_plot,
            polygon: polygonGeoJSON, // Store the polygon as GeoJSON
          },
          {
            where: { plot_id: plot_id },
          }
        );
      }
    }

    // Process data indicators and update plot scores
    if (data_indikator) {
      for (let i = 0; i < data_indikator.length; i++) {
        await PenilaianObservasi.update(
          { penilaian_id: data_indikator[i].penilaian_id },
          { where: { penilaian_observasi_id: data_indikator[i].penilaianObservation_id } }
        );
      }

      const foundPlots = await Plot.findAll({
        attributes: ["plot_id", "observation_id", "luasan_plot"],
        where: { observation_id: obsId },
      });

      let newScore = [];
      for (let i = 0; i < foundPlots.length; i++) {
        const foundPenilaianPlot = await PenilaianObservasi.findAll({
          attributes: ["penilaian_id"],
          where: { plot_id: foundPlots[i].dataValues.plot_id },
        });
        const penilaianIds = foundPenilaianPlot.map((result) => result.dataValues.penilaian_id);

        const foundNilaiVegetasi = await Penilaian.findAll({
          attributes: ["bobot"],
          where: {
            penilaian_id: { [Op.in]: penilaianIds },
            type: "Kondisi Vegetasi",
          },
        });
        const nilaiVegetasi = foundNilaiVegetasi.map((result) => result.dataValues.bobot);

        const foundNilaiTanah = await Penilaian.findAll({
          attributes: ["bobot"],
          where: {
            penilaian_id: { [Op.in]: penilaianIds },
            type: "Kondisi Tanah",
          },
        });
        const nilaiTanah = foundNilaiTanah.map((result) => result.dataValues.bobot);

        let resultNilaiVegetasi = nilaiVegetasi.reduce((acc, val) => acc + val, 0);

        await Hasil.update(
          {
            kondisi_vegetasi: resultNilaiVegetasi,
            kondisi_tanah: nilaiTanah[0],
            skor: resultNilaiVegetasi + nilaiTanah[0],
          },
          { where: { plot_id: foundPlots[i].dataValues.plot_id } }
        );

        newScore.push(resultNilaiVegetasi + nilaiTanah[0]);
      }

      let scoreBeforeMean = newScore.reduce((acc, val) => acc + val, 0);

      await Observasi.update(
        { skor_akhir: scoreBeforeMean / newScore.length },
        { where: { observation_id: obsId } }
      );
    }

    return lahanToEdit;
  }
}

module.exports = LahanService;
