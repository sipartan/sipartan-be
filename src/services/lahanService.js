const { Op } = require("sequelize");
const turf = require("@turf/turf");

const LokasiRegion = require("../models/lokasiRegion");
const DataUmumLahan = require("../models/dataUmum");
const Observasi = require("../models/observasi");
const Plot = require("../models/plot");
const User = require("../models/user");
const Penilaian = require("../models/penilaian");
const PenilaianObservasi = require("../models/penilaianObservasi");
const paginate = require("../utils/pagination");
const downloadPDFReport = require("../utils/generateReport/index");
const { NotFound } = require("../utils/response");
const config = require("../config/config");

const ObservasiService = require("./observasiService");

class LahanService {
  constructor() {
    this.observasiService = new ObservasiService();
  }

  /**
   * Create a new Lahan Karhutla (DataUmumLahan).
   * If the region does not exist, create one. Otherwise reuse.
   * @param {Object} data - All data needed to create the lahan karhutla
   * @returns {Promise<Object>} Created lahan data
   */
  async createLahanKarhutlaData(data) {
    const {
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
      kelembaban_udara,
    } = data;

    // 1. Find or create LokasiRegion in a single query
    const [lokasiRegion] = await LokasiRegion.findOrCreate({
      where: { provinsi, kabupaten, kecamatan, desa },
      defaults: { provinsi, kabupaten, kecamatan, desa },
    });

    // 2. Create DataUmumLahan using the region_location_id from LokasiRegion
    return await DataUmumLahan.create({
      user_id,
      region_location_id: lokasiRegion.region_location_id,
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
    });
  }


  /**
   * Retrieves detailed single result data for lahan + specific observasi.
   */
  async getSingleResultData(lahanId, observasiId) {
    const lahan = await DataUmumLahan.findOne({
      where: { data_lahan_id: lahanId },
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
          where: { observation_id: observasiId },
          include: [
            {
              model: Plot,
              as: "plots",
              include: [
                {
                  model: PenilaianObservasi,
                  include: [Penilaian],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!lahan) {
      throw new Error("Lahan not found");
    }

    // Transform the data into the structure 
    const result = this._transformSingleResult(lahan);
    for (const obs of result.observasi) {
      for (const plot of obs.plots) {
        for (const pen of plot.penilaianList) {
          const dokumentasi = await this.observasiService.getDokumentasiId(pen.penilaianObservasiId);
          pen.images = dokumentasi.map(doc => `${config.env.baseUrl}/observasi/dokumentasi/${doc.dokumentasi_id}`);
        }
      }
    }

    return result;
  }

  /**
   * Retrieves multiple lahan (Karhutla) results with optional filters & pagination.
   */
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
      where.createdAt = { [Op.between]: [new Date(date_start), new Date(date_end)] };
    } else if (date_start) {
      where.createdAt = { [Op.gte]: new Date(date_start) };
    } else if (date_end) {
      where.createdAt = { [Op.lte]: new Date(date_end) };
    }

    // Observasi filters
    const obsWhere = {};
    // If skor_min & skor_max
    if (skor_min && skor_max) {
      obsWhere.skor_akhir = { [Op.between]: [parseFloat(skor_min), parseFloat(skor_max)] };
    } else if (skor_min) {
      obsWhere.skor_akhir = { [Op.gte]: parseFloat(skor_min) };
    } else if (skor_max) {
      obsWhere.skor_akhir = { [Op.lte]: parseFloat(skor_max) };
    }
    // Filter by hasil_penilaian => map to skor range
    if (hasil_penilaian) {
      const range = this._mapHasilPenilaianToSkor(hasil_penilaian);
      if (range) {
        obsWhere.skor_akhir = { [Op.between]: [range.min, range.max] };
      }
    }

    const options = {
      where,
      include: [
        {
          model: Observasi,
          required: true,
          where: obsWhere,
          include: [
            {
              model: Plot,
              attributes: ["plot_id", "luasan_plot", "polygon", "skor"],
            },
          ],
        },
      ],
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
      order: [[sortBy, order]],
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    const result = await paginate(DataUmumLahan, options);
    // Transform the data if needed
    result.results = result.results.map((lahan) => {
      const skor = lahan.observasis[0].skor_akhir;
      return {
        ...lahan.toJSON(),
        skor,
        hasil_penilaian: this._getHasilFromSkor(skor),
        observasi: lahan.observasis.map((obs) => ({
          observation_id: obs.observation_id,
          skor_akhir: obs.skor_akhir,
          hasil_penilaian: this._getHasilFromSkor(obs.skor_akhir),
          plots: obs.plots.map((plot) => ({
            plot_id: plot.plot_id,
            luasan_plot: plot.luasan_plot,
            polygon: plot.polygon,
            skor: plot.skor,
          })),
        })),
      };
    });

    return result;
  }

  /**
   * Download a PDF for a given lahan + observasi.
   */
  async downloadPDF(lahanId, obsId) {
    const dataPDF = await this.getSingleResultData(lahanId, obsId);
    return downloadPDFReport(dataPDF);
  }

  /**
   * Deletes a Karhutla (DataUmumLahan) by ID.
   */
  async deleteKarhutla(lahanId) {
    // Find the main Lahan record along with related Observasi records
    const foundLahan = await DataUmumLahan.findOne({
      where: { data_lahan_id: lahanId },
      include: [
        {
          model: Observasi,
          as: "observasis",
          include: [
            {
              model: Plot,
              as: "plots",
              include: [
                {
                  model: PenilaianObservasi,
                  as: "penilaian_observasis",
                  include: [
                    {
                      model: Dokumentasi,
                      as: "dokumentasis",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    // If the Lahan record is not found, throw an error
    if (!foundLahan) {
      throw new NotFound("Lahan tidak ditemukan");
    }

    // Use Promise.all for efficient parallel deletion
    const deletionPromises = [];

    // Iterate and queue deletions for related Dokumentasi, PenilaianObservasi, Plots, and Observasi
    for (const observasi of foundLahan.observasis) {
      for (const plot of observasi.plots) {
        for (const penilaian of plot.penilaian_observasis) {
          // Queue Dokumentasi deletions
          for (const dokumentasi of penilaian.dokumentasis) {
            deletionPromises.push(dokumentasi.destroy());
          }
          // Queue PenilaianObservasi deletions
          deletionPromises.push(penilaian.destroy());
        }
        // Queue Plot deletions
        deletionPromises.push(plot.destroy());
      }
      // Queue Observasi deletions
      deletionPromises.push(observasi.destroy());
    }

    // Execute all deletions in parallel
    await Promise.all(deletionPromises);

    // Finally, delete the Lahan record itself
    await foundLahan.destroy();

    return { message: "Data lahan deleted successfully." };
  }


  /**
   * Edits an existing Karhutla (DataUmumLahan + Observasi).
   */
  async editKarhutla(lahanId, observasiId, data) {
    const lahan = await DataUmumLahan.findOne({ where: { data_lahan_id: lahanId } });
    if (!lahan) {
      throw new NotFound("Lahan not found");
    }

    // Update lahan fields
    await lahan.update({
      tutupan_lahan: data.tutupan_lahan,
      jenis_vegetasi: data.jenis_vegetasi,
      luasan_karhutla: data.luasan_karhutla,
      jenis_tanah: data.jenis_tanah,
      tinggi_muka_air_gambut: data.tinggi_muka_air_gambut,
      jenis_karhutla: data.jenis_karhutla,
      penggunaan_lahan: data.penggunaan_lahan,
      latitude: data.latitude,
      longitude: data.longitude,
      temperatur: data.temperatur,
      curah_hujan: data.curah_hujan,
      kelembaban_udara: data.kelembaban_udara,
    });

    // Update lokasi region if needed
    await this._updateLokasiRegionIfNeeded(lahan, data);

    // Update Observasi dates
    await Observasi.update(
      {
        tanggal_kejadian: data.tanggal_kejadian,
        tanggal_penilaian: data.tanggal_penilaian,
      },
      { where: { observation_id: observasiId } }
    );

    // Update polygon if luas_plot is provided
    if (data.luas_plot) {
      for (const plotData of data.luas_plot) {
        const { plot_id, coordinates } = plotData;
        const polygonGeoJSON = {
          type: "Polygon",
          coordinates: [coordinates],
        };
        const area = turf.area(polygonGeoJSON);
        const newArea = area / 10000; // hectares

        await Plot.update(
          {
            luasan_plot: newArea,
            polygon: polygonGeoJSON,
          },
          { where: { plot_id } }
        );
      }
    }

    // If data_indikator => update penilaianObservasi and recalc plot scores
    if (data.data_indikator) {
      await this._updatePenilaianObservasiAndRecalc(observasiId, data.data_indikator);
    }

    return { message: "Karhutla data edited successfully." };
  }

  /********************************************************
   * Private Helpers
   ********************************************************/

  /**
   * Maps "hasil_penilaian" text to a skor range.
   */
  _mapHasilPenilaianToSkor(hasil_penilaian) {
    const mapping = {
      "sangat ringan": { min: 0, max: 20 },
      ringan: { min: 21, max: 40 },
      sedang: { min: 41, max: 60 },
      berat: { min: 61, max: 80 },
      "sangat berat": { min: 81, max: 100 },
    };
    return mapping[hasil_penilaian.toLowerCase()] || null;
  }

  /**
   * Returns a text-based interpretation of skor.
   */
  _getHasilFromSkor(skor) {
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

  /**
   * Transforms the raw lahan + observasi data.
   */
  _transformSingleResult(lahan) {
    const observasiList = lahan.observasis.map((obs) => {
      const plotList = obs.plots.map((plot) => {
        const penilaianList = plot.penilaian_observasis.map((po) => ({
          penilaianObservasiId: po.penilaian_observasi_id,
          penilaianId: po.penilaian_id,
          variable: po.penilaian.variable,
          kategori: po.penilaian.kategori,
          deskripsi: po.penilaian.deskripsi,
          images: [],
        }));
        return {
          plot_id: plot.plot_id,
          luasan_plot: plot.luasan_plot,
          polygon: plot.polygon,
          kondisi_vegetasi: plot.kondisi_vegetasi,
          kondisi_tanah: plot.kondisi_tanah,
          skor_plot: plot.skor,
          hasil_plot: this._getHasilFromSkor(plot.skor),
          penilaianList,
        };
      });
      return {
        observation_id: obs.observation_id,
        tanggal_kejadian: obs.tanggal_kejadian,
        tanggal_penilaian: obs.tanggal_penilaian,
        skor_akhir: obs.skor_akhir,
        hasil_penilaian: this._getHasilFromSkor(obs.skor_akhir),
        plots: plotList,
      };
    });

    return {
      lokasi_region: lahan.lokasi_region,
      dataumumlahan: {
        data_lahan_id: lahan.data_lahan_id,
        tutupan_lahan: lahan.tutupan_lahan,
        luasan_karhutla: lahan.luasan_karhutla,
        jenis_karhutla: lahan.jenis_karhutla,
        penggunaan_lahan: lahan.penggunaan_lahan,
        jenis_tanah: lahan.jenis_tanah,
        jenis_vegetasi: lahan.jenis_vegetasi,
        tinggi_muka_air_gambut: lahan.tinggi_muka_air_gambut,
        latitude: lahan.latitude,
        longitude: lahan.longitude,
        temperatur: lahan.temperatur,
        curah_hujan: lahan.curah_hujan,
        kelembaban_udara: lahan.kelembaban_udara,
      },
      user: lahan.user,
      observasi: observasiList,
    };
  }

  /**
   * Updates lokasi region if the user changed province/kab/kec/desa.
   */
  async _updateLokasiRegionIfNeeded(lahan, data) {
    const foundRegion = await LokasiRegion.findByPk(lahan.region_location_id);
    if (!foundRegion) {
      throw new NotFound("Lokasi region not found");
    }

    const { provinsi, kabupaten, kecamatan, desa } = data;
    if (!provinsi && !kabupaten && !kecamatan && !desa) {
      return; // Nothing to update
    }

    // Check if existing region combination is found
    const regionExisted = await LokasiRegion.findOne({
      where: {
        provinsi: provinsi || foundRegion.provinsi,
        kabupaten: kabupaten || foundRegion.kabupaten,
        kecamatan: kecamatan || foundRegion.kecamatan,
        desa: desa || foundRegion.desa,
      },
    });

    if (regionExisted) {
      lahan.region_location_id = regionExisted.region_location_id;
      await lahan.save();
    } else {
      // Create a new region
      const newRegion = await LokasiRegion.create({
        provinsi: provinsi || foundRegion.provinsi,
        kabupaten: kabupaten || foundRegion.kabupaten,
        kecamatan: kecamatan || foundRegion.kecamatan,
        desa: desa || foundRegion.desa,
      });
      lahan.region_location_id = newRegion.region_location_id;
      await lahan.save();
    }
  }

  /**
   * Updates penilaianObservasi and recalculates scores for all plots in an observasi.
   */
  async _updatePenilaianObservasiAndRecalc(observation_id, dataIndikator) {
    // dataIndikator is an array like [{ penilaianObservation_id, penilaian_id }, ...]
    for (const item of dataIndikator) {
      await PenilaianObservasi.update(
        { penilaian_id: item.penilaian_id },
        { where: { penilaian_observasi_id: item.penilaianObservation_id } }
      );
    }

    // Recalculate plot scores
    const foundPlots = await Plot.findAll({
      where: { observation_id },
    });

    const newScores = [];
    for (const plot of foundPlots) {
      // Reuse ObservasiService's calculateScore if you want
      const updatedPlot = await this.observasiService.calculateScore(plot.plot_id);
      newScores.push(updatedPlot.skor);
    }

    // Update the observation's final score
    const totalScore = newScores.reduce((acc, val) => acc + val, 0);
    const averageScore = newScores.length > 0 ? totalScore / newScores.length : 0;

    await Observasi.update(
      { skor_akhir: averageScore },
      { where: { observation_id } }
    );
  }
}

module.exports = LahanService;
