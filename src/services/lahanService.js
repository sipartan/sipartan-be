const { Op } = require("sequelize");
const { NotFound } = require("../utils/response");
const { Lahan, LokasiRegion, Observasi } = require("../models");
const { mapHasilPenilaianToSkor, getHasilFromSkor } = require("../utils/karhutlaPenilaian");
const { deleteObservasiData } = require("./observasiService");
const paginate = require("../utils/pagination");
const turf = require("@turf/turf");
const logger = require("../utils/logger");

const createLahanData = async (data) => {
  try {
    logger.info("Creating Lahan data", { data });

    const {
      lokasi_region: { provinsi, kabupaten, kecamatan, desa },
      lahan: {
        nama_lahan,
        tutupan_lahan,
        jenis_vegetasi,
        jenis_tanah,
        tinggi_muka_air_gambut,
        penggunaan_lahan,
        latitude,
        longitude,
        coordinates,
      },
    } = data;

    logger.info("Finding or creating LokasiRegion", { provinsi, kabupaten, kecamatan, desa });
    const [lokasiRegion] = await LokasiRegion.findOrCreate({
      where: { provinsi, kabupaten, kecamatan, desa },
      defaults: { provinsi, kabupaten, kecamatan, desa },
    });

    // Prepare polygon if coordinates are provided
    let polygon = null;
    let luasan_lahan = 0;
    if (coordinates && Array.isArray(coordinates)) {
      logger.info("Formatting coordinates for polygon", { coordinates });
      // lat, long to long, lat
      const formattedCoordinates = coordinates.map((coordinate) => [coordinate[1], coordinate[0]]);
      polygon = { type: "Polygon", coordinates: [formattedCoordinates] };
      const area = turf.area(polygon);
      luasan_lahan = parseFloat((area / 10000).toFixed(2));
    }

    logger.info("Creating new Lahan record", {
      lokasi_region_id: lokasiRegion.lokasi_region_id,
      nama_lahan,
      tutupan_lahan,
      jenis_vegetasi,
      jenis_tanah,
      tinggi_muka_air_gambut,
      penggunaan_lahan,
      latitude,
      longitude,
      luasan_lahan,
      polygon,
    });

    // Create Lahan record
    const newLahan = await Lahan.create({
      lokasi_region_id: lokasiRegion.lokasi_region_id,
      nama_lahan,
      tutupan_lahan,
      jenis_vegetasi,
      jenis_tanah,
      tinggi_muka_air_gambut: tinggi_muka_air_gambut || 0,
      penggunaan_lahan,
      latitude,
      longitude,
      luasan_lahan,
      ...(polygon && { polygon }), // Add polygon only if it exists
    });

    logger.info("Successfully created Lahan", { lahan_id: newLahan.lahan_id });
    return {
      lokasi_region: {
        provinsi: lokasiRegion.provinsi,
        kabupaten: lokasiRegion.kabupaten,
        kecamatan: lokasiRegion.kecamatan,
        desa: lokasiRegion.desa,
      },
      lahan: {
        lahan_id: newLahan.lahan_id,
        nama_lahan: newLahan.nama_lahan,
        tutupan_lahan: newLahan.tutupan_lahan,
        jenis_vegetasi: newLahan.jenis_vegetasi,
        jenis_tanah: newLahan.jenis_tanah,
        tinggi_muka_air_gambut: newLahan.tinggi_muka_air_gambut,
        penggunaan_lahan: newLahan.penggunaan_lahan,
        latitude: newLahan.latitude,
        longitude: newLahan.longitude,
        luasan_lahan: newLahan.luasan_lahan,
        polygon: newLahan.polygon || null,
      },
    };
  } catch (error) {
    logger.error("Error creating Lahan", { error: error.message });
    throw error;
  }
};

const getAllLahanData = async (filters) => {
  try {
    logger.info("Fetching all Lahan data", { filters });

    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "DESC",
      lahan_id,
      nama_lahan,
      provinsi,
      kabupaten,
      kecamatan,
      desa,
      hasil_penilaian,
      skor_min,
      skor_max,
      tanggal_penilaian_start,
      tanggal_penilaian_end,
      tanggal_kejadian_start,
      tanggal_kejadian_end,
    } = filters;

    // Filtering for Lahan
    const lahanWhere = {};
    if (nama_lahan) lahanWhere.nama_lahan = { [Op.iLike]: `%${nama_lahan}%` };
    if (lahan_id) lahanWhere.lahan_id = lahan_id;

    // Filtering for LokasiRegion
    const regionWhere = {};
    if (provinsi) regionWhere.provinsi = provinsi;
    if (kabupaten) regionWhere.kabupaten = kabupaten;
    if (kecamatan) regionWhere.kecamatan = kecamatan;
    if (desa) regionWhere.desa = desa;

    // filtering for Observasi
    const observasiWhere = {};
    if (skor_min || skor_max) {
      observasiWhere.skor_akhir = {
        ...(skor_min && { [Op.gte]: parseFloat(skor_min) }),
        ...(skor_max && { [Op.lte]: parseFloat(skor_max) }),
      };
    }

    if (hasil_penilaian) {
      const range = await mapHasilPenilaianToSkor(hasil_penilaian);
      if (range) {
        observasiWhere.skor_akhir = { [Op.between]: [range.min, range.max] };
      }
    }

    if (tanggal_penilaian_start || tanggal_penilaian_end) {
      observasiWhere.tanggal_penilaian = {
        ...(tanggal_penilaian_start && { [Op.gte]: new Date(tanggal_penilaian_start) }),
        ...(tanggal_penilaian_end && { [Op.lte]: new Date(tanggal_penilaian_end) }),
      };
    }

    if (tanggal_kejadian_start || tanggal_kejadian_end) {
      observasiWhere.tanggal_kejadian = {
        ...(tanggal_kejadian_start && { [Op.gte]: new Date(tanggal_kejadian_start) }),
        ...(tanggal_kejadian_end && { [Op.lte]: new Date(tanggal_kejadian_end) }),
      };
    }

    // Query to fetch data
    const options = {
      where: lahanWhere,
      include: [
        {
          model: LokasiRegion,
          where: regionWhere,
          attributes: ["provinsi", "kabupaten", "kecamatan", "desa"],
        },
        {
          model: Observasi,
          where: observasiWhere,
          required: false,
          limit: 1,
          order: [["tanggal_penilaian", "DESC"]],
        },
      ],
      order: [[sortBy, order]],
      page: parseInt(page),
      limit: limit ? parseInt(limit) : undefined,
    };

    logger.info("Executing query with options", { options });
    const result = await paginate(Lahan, options);

    // Transforming the data
    logger.info("Transforming fetched data");
    result.results = result.results.map((lahan) => {
      const latestObservasi = lahan.observasis[0];

      return {
        lokasi_region: {
          provinsi: lahan.lokasi_region.provinsi,
          kabupaten: lahan.lokasi_region.kabupaten,
          kecamatan: lahan.lokasi_region.kecamatan,
          desa: lahan.lokasi_region.desa,
        },
        lahan: {
          lahan_id: lahan.lahan_id,
          nama_lahan: lahan.nama_lahan,
          tutupan_lahan: lahan.tutupan_lahan,
          jenis_vegetasi: lahan.jenis_vegetasi,
          jenis_tanah: lahan.jenis_tanah,
          tinggi_muka_air_gambut: lahan.tinggi_muka_air_gambut,
          jenis_karhutla: lahan.jenis_karhutla,
          penggunaan_lahan: lahan.penggunaan_lahan,
          latitude: lahan.latitude,
          longitude: lahan.longitude,
          luasan_lahan: lahan.luasan_lahan,
          polygon: lahan.polygon || null,
          observasiTerakhir: latestObservasi
            ? {
              jenis_karhutla: latestObservasi.jenis_karhutla,
              temperatur: latestObservasi.temperatur,
              curah_hujan: latestObservasi.curah_hujan,
              kelembapan_udara: latestObservasi.kelembapan_udara,
              tanggal_kejadian: latestObservasi.tanggal_kejadian,
              tanggal_penilaian: latestObservasi.tanggal_penilaian,
              skor_akhir: latestObservasi.skor_akhir,
              hasil_penilaian: getHasilFromSkor(latestObservasi.skor_akhir),
            }
            : null,
        },
      };
    });

    logger.info("Successfully fetched and transformed Lahan data");
    return result;
  } catch (error) {
    logger.error("Error fetching Lahan data", { error: error.message });
    throw error;
  }
};

const getDetailLahanData = async (lahan_id) => {
  try {
    const lahan = await Lahan.findByPk(lahan_id, {
      include: [
        {
          model: LokasiRegion,
          attributes: ["lokasi_region_id", "provinsi", "kabupaten", "kecamatan", "desa"],
        },
      ],
    });

    if (!lahan) {
      logger.warn("Lahan not found", { lahan_id });
      throw new NotFound(`Lahan with ID ${lahan_id} not found`);
    }

    return {
      lokasi_region: {
        provinsi: lahan.lokasi_region.provinsi,
        kabupaten: lahan.lokasi_region.kabupaten,
        kecamatan: lahan.lokasi_region.kecamatan,
        desa: lahan.lokasi_region.desa,
      },
      lahan: {
        lahan_id: lahan.lahan_id,
        nama_lahan: lahan.nama_lahan,
        tutupan_lahan: lahan.tutupan_lahan,
        jenis_vegetasi: lahan.jenis_vegetasi,
        jenis_tanah: lahan.jenis_tanah,
        tinggi_muka_air_gambut: lahan.tinggi_muka_air_gambut,
        jenis_karhutla: lahan.jenis_karhutla,
        penggunaan_lahan: lahan.penggunaan_lahan,
        latitude: lahan.latitude,
        longitude: lahan.longitude,
        luasan_lahan: lahan.luasan_lahan,
        polygon: lahan.polygon || null,
      },
    };
  }
  catch (error) {
    logger.error("Error fetching Lahan data", { lahan_id, error: error.message });
    throw error;
  }
};

const editLahanData = async (lahan_id, data) => {
  try {
    logger.info("Editing Lahan data", { lahan_id, data });

    // Step 1: Find the existing Lahan including its LokasiRegion
    const lahan = await Lahan.findByPk(lahan_id, {
      include: [
        {
          model: LokasiRegion,
          attributes: ["lokasi_region_id", "provinsi", "kabupaten", "kecamatan", "desa"],
        },
      ],
    });

    if (!lahan) {
      logger.warn("Lahan not found", { lahan_id });
      throw new NotFound(`Lahan with ID ${lahan_id} not found`);
    }

    logger.info("Found Lahan", { lahan_id });

    // Step 2: Update Lahan data
    const lahanData = data.lahan || {};
    if (lahanData.coordinates) {
      logger.info("Formatting coordinates to polygon", { coordinates: lahanData.coordinates });

      // Convert coordinates to a Polygon
      const formattedCoordinates = lahanData.coordinates.map((coord) => [coord[1], coord[0]]);
      lahanData.polygon = { type: "Polygon", coordinates: [formattedCoordinates] };
      const area = turf.area(lahanData.polygon);
      lahanData.luasan_lahan = parseFloat((area / 10000).toFixed(2));
      delete lahanData.coordinates; // Remove coordinates to avoid Sequelize error
    }

    let updatedLokasiRegion = lahan.lokasi_region; // Default to the existing region

    // Step 3: Update related LokasiRegion if provided
    if (data.lokasi_region) {
      logger.info("Updating LokasiRegion", { lahan_id, lokasi_region: data.lokasi_region });

      const updatedRegion = {
        provinsi: data.lokasi_region.provinsi || lahan.lokasi_region?.provinsi,
        kabupaten: data.lokasi_region.kabupaten || lahan.lokasi_region?.kabupaten,
        kecamatan: data.lokasi_region.kecamatan || lahan.lokasi_region?.kecamatan,
        desa: data.lokasi_region.desa || lahan.lokasi_region?.desa,
      };

      // Find or create new LokasiRegion
      const [lokasiRegion] = await LokasiRegion.findOrCreate({
        where: updatedRegion,
        defaults: updatedRegion,
      });

      lahanData.lokasi_region_id = lokasiRegion.lokasi_region_id;
      updatedLokasiRegion = lokasiRegion; // Use the newly created or found region in the return data
    }

    // Update Lahan in place
    await lahan.update(lahanData);
    logger.info("Updated Lahan data", { lahan_id });

    logger.info("Successfully edited Lahan", { lahan_id });

    return {
      lokasi_region: {
        provinsi: updatedLokasiRegion.provinsi,
        kabupaten: updatedLokasiRegion.kabupaten,
        kecamatan: updatedLokasiRegion.kecamatan,
        desa: updatedLokasiRegion.desa,
      },
      lahan: {
        lahan_id: lahan.lahan_id,
        nama_lahan: lahan.nama_lahan,
        tutupan_lahan: lahan.tutupan_lahan,
        jenis_vegetasi: lahan.jenis_vegetasi,
        jenis_tanah: lahan.jenis_tanah,
        tinggi_muka_air_gambut: lahan.tinggi_muka_air_gambut,
        jenis_karhutla: lahan.jenis_karhutla,
        penggunaan_lahan: lahan.penggunaan_lahan,
        latitude: lahan.latitude,
        longitude: lahan.longitude,
        luasan_lahan: lahan.luasan_lahan,
        polygon: lahan.polygon || null,
      },
    };
  } catch (error) {
    logger.error("Error updating Lahan", { lahan_id, error: error.message });
    throw error;
  }
};

const deleteLahanData = async (lahan_id) => {
  try {
    logger.info("Deleting Lahan data", { lahan_id });

    // step 1: find the lahan
    const lahan = await Lahan.findByPk(lahan_id);

    if (!lahan) {
      logger.warn("Lahan not found", { lahan_id });
      throw new NotFound(`Lahan with ID ${lahan_id} not found`);
    }

    logger.info("Found Lahan", { lahan_id });

    // step 2: find all observasi related to the lahan
    const observasiList = await Observasi.findAll({
      where: { lahan_id },
      attributes: ["observasi_id"],
    });

    logger.info("Found related Observasi", { lahan_id, observasiCount: observasiList.length });

    // step 3: delete all observasi and related data
    await Promise.all(
      observasiList.map(async (observasi) => {
        logger.info("Deleting Observasi", { observasi_id: observasi.observasi_id });
        await deleteObservasiData(observasi.observasi_id);
      })
    );

    // step 4: delete the lahan
    logger.info("Deleting Lahan", { lahan_id });
    await lahan.destroy();

    logger.info("Successfully deleted Lahan", { lahan_id });
  } catch (error) {
    logger.error("Error deleting Lahan", { lahan_id, error: error.message });
    throw error;
  }
};

module.exports = {
  createLahanData,
  getAllLahanData,
  getDetailLahanData,
  editLahanData,
  deleteLahanData,
};