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
const ObservasiService = require("../service/observasiService");

class LahanService {
  constructor() {
    this.observasiService = new ObservasiService();
  }
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
      where: { data_lahan_id: id },
      include: [
        {
          model: LokasiRegion,
          as: "lokasi_region",
          attributes: ["provinsi", "kabupaten", "kecamatan", "desa"],
        },
        {
          model: User,
          as: "user",
          attributes: ["nama", "instansi", "email"],
        },
        {
          model: Observasi,
          as: "observasis",
          where: { observation_id: obsId },
          include: [
            {
              model: Plot,
              as: "plots",
              include: [
                {
                  model: PenilaianObservasi,
                  include: [
                    {
                      model: Penilaian,
                    },
                  ],
                },
                {
                  model: Hasil,
                },
              ],
            },
          ],
        },
      ],
    });

    if (!foundLahan) {
      throw new Error("Lahan not found");
    }

    const observasiList = foundLahan.observasis.map((obs) => {
      const plotList = obs.plots.map((plot) => {
        const penilaianList = plot.penilaian_observasis.map((penObs) => {
          return {
            penilaianObservasiId: penObs.penilaian_observasi_id,
            penilaianId: penObs.penilaian_id,
            variable: penObs.penilaian.variable,
            kategori: penObs.penilaian.kategori,
            deskripsi: penObs.penilaian.deskripsi,
            images: [],
          };
        });

        return {
          plot_id: plot.plot_id,
          luasan_plot: plot.luasan_plot,
          polygon: plot.polygon,
          skor_plot: plot.hasil.skor,
          hasil_plot: this.getHasilPenilaianFromSkor(plot.hasil.skor),
          penilaianList: penilaianList,
          // images: [], // We'll populate this next
        };
      });

      return {
        observation_id: obs.observation_id,
        tanggal_kejadian: obs.tanggal_kejadian,
        tanggal_penilaian: obs.tanggal_penilaian,
        skor_akhir: obs.skor_akhir,
        hasil_penilaian: this.getHasilPenilaianFromSkor(obs.skor_akhir),
        plots: plotList,
      };
    });

    // // Fetch images for each plot
    // for (const obs of observasiList) {
    //   for (const plot of obs.plots) {
    //     plot.images = await this.observasiService.getImageUrl(plot.plot_id);
    //   }
    // }

    // // Fetch images for each penilaian
    for (const obs of observasiList) {
      for (const plot of obs.plots) {
        for (const penilaian of plot.penilaianList) {
          penilaian.images = await this.observasiService.getImageUrl(penilaian.penilaianObservasiId);
        }
      }
    }


    const result = {
      lokasi_region: foundLahan.lokasi_region,
      dataumumlahan: {
        data_lahan_id: foundLahan.data_lahan_id,
        tutupan_lahan: foundLahan.tutupan_lahan,
        luasan_karhutla: foundLahan.luasan_karhutla,
        jenis_karhutla: foundLahan.jenis_karhutla,
        penggunaan_lahan: foundLahan.penggunaan_lahan,
        jenis_tanah: foundLahan.jenis_tanah,
        jenis_vegetasi: foundLahan.jenis_vegetasi,
        tinggi_muka_air_gambut: foundLahan.tinggi_muka_air_gambut,
        latitude: foundLahan.latitude,
        longitude: foundLahan.longitude,
        temperatur: foundLahan.temperatur,
        curah_hujan: foundLahan.curah_hujan,
        kelembaban_udara: foundLahan.kelembaban_udara,
      },
      user: foundLahan.user,
      observasi: observasiList,
    };

    return result;
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
      include: [
        {
          model: Observasi,
          attributes: ["observation_id", "skor_akhir", "createdAt"],
          include: [
            {
              model: Plot,
              attributes: ["plot_id", "luasan_plot", "polygon"],
            },
          ],
        },
      ],
      order: [[sortBy, order]],
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const result = await paginate(DataUmumLahan, options);

    // Process the results to add additional data like hasil_penilaian
    result.results = result.results.map((lahan) => {
      const skor = lahan.observasis[0].skor_akhir;
      return {
        ...lahan.toJSON(),
        skor: skor,
        hasil_penilaian: this.getHasilPenilaianFromSkor(skor),
        observasi: lahan.observasis.map((obs) => ({
          observation_id: obs.observation_id,
          skor_akhir: obs.skor_akhir,
          hasil_penilaian: this.getHasilPenilaianFromSkor(obs.skor_akhir),
          plots: obs.plots.map((plot) => ({
            plot_id: plot.plot_id,
            luasan_plot: plot.luasan_plot,
            polygon: plot.polygon,
          })),
        })),
      };
    });

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
