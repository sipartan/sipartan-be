const { Op, Sequelize } = require("sequelize");
const db = require("../config/database");
const { NotFound } = require("../utils/response");
const { Lahan, LokasiRegion, Observasi } = require("../models");
const { mapHasilPenilaianToSkor, getHasilFromSkor } = require("../utils/karhutlaPenilaian");
const { deleteObservasiData } = require("./observasiService");
const paginate = require("../utils/pagination");
const logger = require("../utils/logger");
const { areaQuery } = require("../utils/postgisQuery");

const createLahanData = async (data) => {
  const transaction = await db.transaction();
  try {
    logger.info("Creating Lahan data", { data });

    const {
      lokasi_region: { provinsi, kabupaten, kecamatan, desa },
      lahan: { nama_lahan, jenis_tanah, latitude, longitude, coordinates },
    } = data;

    logger.info("Finding or creating LokasiRegion", { provinsi, kabupaten, kecamatan, desa });
    const [lokasiRegion] = await LokasiRegion.findOrCreate({
      where: { provinsi, kabupaten, kecamatan, desa },
      defaults: { provinsi, kabupaten, kecamatan, desa },
      transaction,
    });

    // prepare polygon if coordinates are provided
    let polygon = null;
    let luasan_lahan = 0;

    if (coordinates && Array.isArray(coordinates)) {
      logger.info("Formatting coordinates for polygon", { coordinates });

      // convert [lat, long] to [long, lat]
      const formattedCoordinates = coordinates.map((coordinate) => [coordinate[1], coordinate[0]]);

      // ensure first and last coordinates are the same to form a valid polygon
      if (
        formattedCoordinates[0][0] !== formattedCoordinates[formattedCoordinates.length - 1][0] ||
        formattedCoordinates[0][1] !== formattedCoordinates[formattedCoordinates.length - 1][1]
      ) {
        formattedCoordinates.push(formattedCoordinates[0]); // close the polygon loop
      }

      // construct GeoJSON format for PostGIS
      const geoJsonPolygon = JSON.stringify({ // need to stringify to escape single quotes, the areaQuery expects a string
        type: "Polygon",
        coordinates: [formattedCoordinates],
      });

      // replace :geoJson with actual GeoJSON string
      // type: Sequelize.QueryTypes.SELECT to return only the first result
      const [result] = await db.query(areaQuery, {
        replacements: { geoJson: geoJsonPolygon }, // replace :geoJson with actual GeoJSON string
        type: Sequelize.QueryTypes.SELECT, // query type to return only the first result, select is used to return all results
      });

      luasan_lahan = parseFloat(result.area_in_hectares.toFixed(2));
      polygon = geoJsonPolygon;
    }

    logger.info("Creating new Lahan record", {
      lokasi_region_id: lokasiRegion.lokasi_region_id,
      nama_lahan,
      jenis_tanah,
      latitude,
      longitude,
      luasan_lahan,
      polygon,
    });

    const newLahan = await Lahan.create({
      lokasi_region_id: lokasiRegion.lokasi_region_id,
      nama_lahan,
      jenis_tanah,
      latitude,
      longitude,
      luasan_lahan,
      polygon: polygon ? db.literal(`ST_GeomFromGeoJSON('${polygon}')`) : null, // convert GeoJSON to PostGIS geometry
    }, { transaction });

    await transaction.commit();

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
        jenis_tanah: newLahan.jenis_tanah,
        latitude: newLahan.latitude,
        longitude: newLahan.longitude,
        luasan_lahan: newLahan.luasan_lahan,
        polygon: newLahan.polygon || null,
      },
    };
  } catch (error) {
    await transaction.rollback();
    logger.error("Error creating Lahan", { error: error.message });
    throw error;
  }
};

const getAllLahanData = async (filters) => {
  try {
    logger.info("Fetching all Lahan data", { filters });

    const {
      page = 1,
      limit = null,
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

    // filter for Lahan
    const lahanWhere = {};
    if (nama_lahan) lahanWhere.nama_lahan = { [Op.iLike]: `%${nama_lahan}%` }; // case-insensitive search
    if (lahan_id) lahanWhere.lahan_id = lahan_id;

    // filter for LokasiRegion
    const regionWhere = {};
    if (provinsi) regionWhere.provinsi = provinsi;
    if (kabupaten) regionWhere.kabupaten = kabupaten;
    if (kecamatan) regionWhere.kecamatan = kecamatan;
    if (desa) regionWhere.desa = desa;

    // filter for Observasi
    const observasiWhere = {};
    if (skor_min || skor_max) {
      observasiWhere.skor_akhir = {
        ...(skor_min && { [Op.gte]: parseFloat(skor_min) }), // gte = greater than or equal
        ...(skor_max && { [Op.lte]: parseFloat(skor_max) }), // lte = less than or equal
      };
    }

    if (hasil_penilaian) {
      const range = await mapHasilPenilaianToSkor(hasil_penilaian);
      if (range) {
        observasiWhere.skor_akhir = { [Op.between]: [range.min, range.max] }; // between min and max
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

    // check if there are Observasi filters, if there is then the value will become true
    const hasObservasiFilter = Object.keys(observasiWhere).length > 0;

    // query to fetch data
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
          required: hasObservasiFilter, // based on wether there is a filter for observasi
          separate: false, // enforcing an INNER JOIN instead of LEFT JOIN to ensure a true JOIN instead of post-query filtering
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
          jenis_tanah: lahan.jenis_tanah,
          jenis_karhutla: lahan.jenis_karhutla,
          latitude: lahan.latitude,
          longitude: lahan.longitude,
          luasan_lahan: lahan.luasan_lahan,
          polygon: lahan.polygon || null,
          observasiTerakhir: latestObservasi
            ? {
              luasan_karhutla: latestObservasi.luasan_karhutla,
              jenis_karhutla: latestObservasi.jenis_karhutla,
              tinggi_muka_air_gambut: latestObservasi.tinggi_muka_air_gambut,
              penggunaan_lahan: latestObservasi.penggunaan_lahan,
              tutupan_lahan: latestObservasi.tutupan_lahan,
              jenis_vegetasi: latestObservasi.jenis_vegetasi,
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
        jenis_tanah: lahan.jenis_tanah,
        latitude: lahan.latitude,
        longitude: lahan.longitude,
        luasan_lahan: lahan.luasan_lahan,
        polygon: lahan.polygon || null,
      },
    };
  } catch (error) {
    logger.error("Error fetching Lahan data", { lahan_id, error: error.message });
    throw error;
  }
};

const editLahanData = async (lahan_id, data) => {
  const transaction = await db.transaction();
  try {
    logger.info("Editing Lahan data", { lahan_id, data });

    // 1: find the existing Lahan including its LokasiRegion
    const lahan = await Lahan.findByPk(lahan_id, {
      include: [
        {
          model: LokasiRegion,
          attributes: ["lokasi_region_id", "provinsi", "kabupaten", "kecamatan", "desa"],
        },
      ],
      transaction,
    });

    if (!lahan) {
      logger.warn("Lahan not found", { lahan_id });
      throw new NotFound(`Lahan with ID ${lahan_id} not found`);
    }

    logger.info("Found Lahan", { lahan_id });

    // 2: update Lahan data
    const lahanData = data.lahan || {};
    let polygon = null;
    let luasan_lahan = 0;

    if (lahanData.coordinates && Array.isArray(lahanData.coordinates)) {
      logger.info("Formatting coordinates to polygon", { coordinates: lahanData.coordinates });

      // convert [lat, long] to [long, lat]
      const formattedCoordinates = lahanData.coordinates.map((coord) => [coord[1], coord[0]]);

      // ensure first and last coordinates are the same to form a valid polygon
      if (
        formattedCoordinates[0][0] !== formattedCoordinates[formattedCoordinates.length - 1][0] ||
        formattedCoordinates[0][1] !== formattedCoordinates[formattedCoordinates.length - 1][1]
      ) {
        formattedCoordinates.push(formattedCoordinates[0]); // close the polygon loop
      }

      // construct GeoJSON and stringify it for PostGIS
      const geoJsonPolygon = JSON.stringify({
        type: "Polygon",
        coordinates: [formattedCoordinates],
      });

      // calculate area using PostGIS
      const [result] = await db.query(areaQuery, { // result only expected to have 1 row, the first row
        replacements: { geoJson: geoJsonPolygon },
        type: Sequelize.QueryTypes.SELECT,
        transaction,
      });

      luasan_lahan = parseFloat(result.area_in_hectares.toFixed(2));
      polygon = geoJsonPolygon;
      delete lahanData.coordinates; // remove raw coordinates
    }

    let updatedLokasiRegion = lahan.lokasi_region; // default to the existing region

    // 3: update related LokasiRegion if provided
    if (data.lokasi_region) {
      logger.info("Updating LokasiRegion", { lahan_id, lokasi_region: data.lokasi_region });

      const updatedRegion = {
        provinsi: data.lokasi_region.provinsi || lahan.lokasi_region?.provinsi,
        kabupaten: data.lokasi_region.kabupaten || lahan.lokasi_region?.kabupaten,
        kecamatan: data.lokasi_region.kecamatan || lahan.lokasi_region?.kecamatan,
        desa: data.lokasi_region.desa || lahan.lokasi_region?.desa,
      };

      // find or create new LokasiRegion
      const [lokasiRegion] = await LokasiRegion.findOrCreate({
        where: updatedRegion,
        defaults: updatedRegion,
        transaction,
      });

      lahanData.lokasi_region_id = lokasiRegion.lokasi_region_id;
      updatedLokasiRegion = lokasiRegion;
    }

    // update Lahan in place
    await lahan.update({
      ...lahanData,
      luasan_lahan: luasan_lahan ? luasan_lahan : lahan.luasan_lahan,
      polygon: polygon ? db.literal(`ST_GeomFromGeoJSON('${polygon}')`) : lahan.polygon,
    }, { transaction });

    await transaction.commit();

    const newLahan = await Lahan.findByPk(lahan_id);

    logger.info("Successfully edited Lahan", { lahan_id });

    return {
      lokasi_region: {
        provinsi: updatedLokasiRegion.provinsi,
        kabupaten: updatedLokasiRegion.kabupaten,
        kecamatan: updatedLokasiRegion.kecamatan,
        desa: updatedLokasiRegion.desa,
      },
      lahan: {
        lahan_id: newLahan.lahan_id,
        nama_lahan: newLahan.nama_lahan,
        jenis_tanah: newLahan.jenis_tanah,
        latitude: newLahan.latitude,
        longitude: newLahan.longitude,
        luasan_lahan: newLahan.luasan_lahan,
        polygon: newLahan.polygon || null,
      },
    };
  } catch (error) {
    await transaction.rollback();
    logger.error("Error updating Lahan", { lahan_id, error: error.message });
    throw error;
  }
};

const deleteLahanData = async (lahan_id) => {
  const transaction = await db.transaction();
  
  try {
    logger.info("Deleting Lahan data", { lahan_id });

    // 1: find the Lahan
    const lahan = await Lahan.findByPk(lahan_id);

    if (!lahan) {
      logger.warn("Lahan not found", { lahan_id });
      throw new NotFound(`Lahan with ID ${lahan_id} not found`);
    }

    logger.info("Found Lahan", { lahan_id });

    // 2: find all Observasi related to the Lahan
    const observasiList = await Observasi.findAll({
      where: { lahan_id },
      attributes: ["observasi_id"],
      transaction
    });

    logger.info("Found related Observasi", { lahan_id, observasiCount: observasiList.length });

    // 3: delete all Observasi and related data
    await Promise.all(
      observasiList.map(async (observasi) => {
        logger.info("Deleting Observasi", { observasi_id: observasi.observasi_id });
        await deleteObservasiData(observasi.observasi_id, transaction);
      })
    );

    // 4: delete the Lahan
    logger.info("Deleting Lahan", { lahan_id });
    await lahan.destroy({ transaction });

    await transaction.commit();
    logger.info("Successfully deleted Lahan and all related data", { lahan_id });

  } catch (error) {
    await transaction.rollback();
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
