const { User, Lahan, Observasi, Penilaian, Dokumentasi, Plot, PenilaianObservasi, LokasiRegion } = require("../models");
const db = require("../config/database");
const { Op, Sequelize } = require("sequelize");
const { areaQuery } = require("../utils/postgisQuery");
const { deleteDokumentasiData } = require("./dokumentasiService");
const paginate = require("../utils/pagination");
const { mapHasilPenilaianToSkor, getHasilFromSkor } = require("../utils/karhutlaPenilaian");
const { NotFound, BadRequest } = require("../utils/response");
const downloadPDFReport = require("../utils/generateReport/index");
const logger = require("../utils/logger");

const createObservasiData = async (newDataObservasi) => {
    const transaction = await db.transaction();

    try {
        const {
            lahan_id,
            user_id,
            jenis_karhutla,
            temperatur,
            curah_hujan,
            kelembapan_udara,
            tanggal_kejadian,
            tanggal_penilaian,
            dataPlot,
            tutupan_lahan,
            jenis_vegetasi,
            tinggi_muka_air_gambut,
            penggunaan_lahan,
        } = newDataObservasi;

        logger.info("Creating new observasi data", { lahan_id, user_id, jenis_karhutla });

        // check if lahan exists
        const lahan = await Lahan.findByPk(lahan_id, { transaction });
        if (!lahan) {
            logger.warn("Lahan not found", { lahan_id });
            throw new NotFound(`Lahan with ID ${lahan_id} not found`);
        }

        const observasi = await Observasi.create(
            {
                lahan_id,
                user_id,
                jenis_karhutla,
                temperatur,
                curah_hujan,
                kelembapan_udara,
                tanggal_kejadian,
                tanggal_penilaian,
                skor_akhir: 0,
                luasan_karhutla: 0,
                tutupan_lahan,
                jenis_vegetasi,
                tinggi_muka_air_gambut: tinggi_muka_air_gambut || 0,
                penggunaan_lahan,
            },
            { transaction }
        );

        logger.info("Observasi created", { observasi_id: observasi.observasi_id });

        // create all plots
        const plots = [];
        let totalLuasanKarhutla = 0;

        for (const plot of dataPlot) {
            const coordinates = plot.coordinates.map((coord) => [coord[1], coord[0]]);
            if (
                coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
                coordinates[0][1] !== coordinates[coordinates.length - 1][1]
            ) {
                coordinates.push(coordinates[0]);
            }

            const geoJsonPolygon = JSON.stringify({
                type: "Polygon",
                coordinates: [coordinates],
            });

            const [result] = await db.query(areaQuery, {
                replacements: { geoJson: geoJsonPolygon },
                type: Sequelize.QueryTypes.SELECT,
                transaction,
            });

            const luasan_plot = parseFloat(result.area_in_hectares.toFixed(2));
            totalLuasanKarhutla += luasan_plot;

            const newPlot = await Plot.create(
                { observasi_id: observasi.observasi_id, luasan_plot, polygon: db.literal(`ST_GeomFromGeoJSON('${geoJsonPolygon}')`) },
                { transaction }
            );

            logger.info("Plot created", { plot_id: newPlot.plot_id });

            let penilaianObservasiIds = [];
            if (Array.isArray(plot.penilaian_id)) {
                penilaianObservasiIds = await Promise.all(
                    plot.penilaian_id.map(async (penilaian_id) => {
                        const penilaian = await Penilaian.findByPk(penilaian_id, { transaction });
                        if (!penilaian) {
                            logger.warn("Penilaian not found", { penilaian_id });
                            throw new NotFound(`Penilaian with ID ${penilaian_id} not found`);
                        }

                        const penilaianObservasi = await PenilaianObservasi.create(
                            { plot_id: newPlot.plot_id, penilaian_id },
                            { transaction }
                        );
                        return { penilaian_observasi_id: penilaianObservasi.penilaian_observasi_id, penilaian_id };
                    })
                );
            }

            const updatedPlot = await calculateScore(newPlot.plot_id, transaction);
            plots.push({ plot_id: updatedPlot.plot_id, skor: updatedPlot.skor, penilaianObservasiIds });
        }

        const totalScore = plots.reduce((sum, plot) => sum + (plot.skor || 0), 0);
        const finalScore = plots.length ? totalScore / plots.length : 0;

        observasi.skor_akhir = finalScore;
        observasi.luasan_karhutla = totalLuasanKarhutla;
        await observasi.save({ transaction });

        await transaction.commit();

        logger.info("Observasi creation successful", { observasi_id: observasi.observasi_id });

        return {
            observasi_id: observasi.observasi_id,
            skor_akhir: finalScore,
            luasan_karhutla: totalLuasanKarhutla,
            plots: plots.map((plot) => ({
                plot_id: plot.plot_id,
                penilaianList: plot.penilaianObservasiIds
            })),
        };
    } catch (error) {
        await transaction.rollback();
        logger.error("Error creating observation", { error: error.message });
        throw error;
    }
};

const getObservasiData = async (filters) => {
    const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        order = "DESC",
        lahan_id,
        user_id,
        nama_lahan,
        provinsi,
        kabupaten,
        kecamatan,
        desa,
        hasil_penilaian,
        skor_min,
        skor_max,
        tanggal_kejadian_start,
        tanggal_kejadian_end,
        tanggal_penilaian_start,
        tanggal_penilaian_end,
        jenis_karhutla,
    } = filters;

    const where = {};
    const lahanWhere = {};
    const lokasiWhere = {};

    try {
        if (lahan_id) where.lahan_id = lahan_id;
        if (user_id) where.user_id = user_id;
        if (jenis_karhutla) where.jenis_karhutla = jenis_karhutla;

        if (hasil_penilaian) {
            const skorRange = await mapHasilPenilaianToSkor(hasil_penilaian);
            if (skorRange) {
                where.skor_akhir = { [Op.between]: [skorRange.min, skorRange.max] };
            }
        }

        if (skor_min || skor_max) {
            where.skor_akhir = {
                ...(skor_min && { [Op.gte]: parseFloat(skor_min) }),
                ...(skor_max && { [Op.lte]: parseFloat(skor_max) }),
            };
        }

        if (tanggal_kejadian_start || tanggal_kejadian_end) {
            where.tanggal_kejadian = {
                ...(tanggal_kejadian_start && { [Op.gte]: new Date(tanggal_kejadian_start) }),
                ...(tanggal_kejadian_end && { [Op.lte]: new Date(tanggal_kejadian_end) }),
            };
        }

        if (tanggal_penilaian_start || tanggal_penilaian_end) {
            where.tanggal_penilaian = {
                ...(tanggal_penilaian_start && { [Op.gte]: new Date(tanggal_penilaian_start) }),
                ...(tanggal_penilaian_end && { [Op.lte]: new Date(tanggal_penilaian_end) }),
            };
        }

        if (nama_lahan) lahanWhere.nama_lahan = { [Op.iLike]: `%${nama_lahan}%` };

        if (provinsi) lokasiWhere.provinsi = provinsi;
        if (kabupaten) lokasiWhere.kabupaten = kabupaten;
        if (kecamatan) lokasiWhere.kecamatan = kecamatan;
        if (desa) lokasiWhere.desa = desa;

        const options = {
            where,
            include: [
                {
                    model: User,
                    attributes: ["user_id", "nama", "email", "instansi"],
                },
                {
                    model: Lahan,
                    where: lahanWhere,
                    include: [
                        {
                            model: LokasiRegion,
                            where: lokasiWhere,
                        },
                    ],
                }
            ],
            order: [[sortBy, order]],
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        };

        logger.info("Fetching observasi data", { options });
        const result = await paginate(Observasi, options);

        logger.info("Transforming observasi data");
        result.results = result.results.map((observasi) => ({
            user: {
                user_id: observasi.user.user_id,
                nama: observasi.user.nama,
                email: observasi.user.email,
                instansi: observasi.user.instansi,
            },
            lokasi_region: {
                provinsi: observasi.lahan.lokasi_region.provinsi,
                kabupaten: observasi.lahan.lokasi_region.kabupaten,
                kecamatan: observasi.lahan.lokasi_region.kecamatan,
                desa: observasi.lahan.lokasi_region.desa,
            },
            lahan: {
                nama_lahan: observasi.lahan.nama_lahan,
                jenis_tanah: observasi.lahan.jenis_tanah,
                latitude: observasi.lahan.latitude,
                longitude: observasi.lahan.longitude,
                luasan_lahan: observasi.lahan.luasan_lahan,
                polygon: observasi.lahan.polygon,
            },
            observasi: {
                observasi_id: observasi.observasi_id,
                lahan_id: observasi.lahan_id,
                jenis_karhutla: observasi.jenis_karhutla,
                temperatur: observasi.temperatur,
                curah_hujan: observasi.curah_hujan,
                kelembapan_udara: observasi.kelembapan_udara,
                tanggal_kejadian: observasi.tanggal_kejadian,
                tanggal_penilaian: observasi.tanggal_penilaian,
                luasan_karhutla: observasi.luasan_karhutla,
                skor_plot: observasi.skor_akhir,
                hasil_penilaian: getHasilFromSkor(observasi.skor_akhir),
                tutupan_lahan: observasi.tutupan_lahan,
                jenis_vegetasi: observasi.jenis_vegetasi,
                tinggi_muka_air_gambut: observasi.tinggi_muka_air_gambut,
                penggunaan_lahan: observasi.penggunaan_lahan,
                createdAt: observasi.createdAt,
                updatedAt: observasi.updatedAt,
            },
        }));

        return result;
    } catch (error) {
        logger.error("Error fetching observasi data", { error: error.message });
        throw error;
    }
};

const getObservasiDetailData = async (observasi_id) => {
    try {
        logger.info("Fetching observasi detail data", { observasi_id });

        const observasi = await Observasi.findOne({
            where: { observasi_id },
            include: [
                {
                    model: User,
                    attributes: ["user_id", "nama", "email", "instansi"],
                },
                {
                    model: Lahan,
                    include: [
                        {
                            model: LokasiRegion,
                        },
                    ],
                },
                {
                    model: Plot,
                    include: [
                        {
                            model: PenilaianObservasi,
                            include: [
                                {
                                    model: Penilaian,
                                },
                                {
                                    model: Dokumentasi,
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        if (!observasi) {
            logger.warn("Observasi not found", { observasi_id });
            throw new NotFound(`Observasi with ID ${observasi_id} not found`);
        }

        logger.info("Transforming observasi data");
        const transformedData = {
            user: {
                user_id: observasi.user.user_id,
                nama: observasi.user.nama,
                email: observasi.user.email,
                instansi: observasi.user.instansi,
            },
            lokasi_region: {
                provinsi: observasi.lahan.lokasi_region.provinsi,
                kabupaten: observasi.lahan.lokasi_region.kabupaten,
                kecamatan: observasi.lahan.lokasi_region.kecamatan,
                desa: observasi.lahan.lokasi_region.desa,
            },
            lahan: {
                nama_lahan: observasi.lahan.nama_lahan,
                jenis_tanah: observasi.lahan.jenis_tanah,
                latitude: observasi.lahan.latitude,
                longitude: observasi.lahan.longitude,
                luasan_lahan: observasi.lahan.luasan_lahan,
                polygon: observasi.lahan.polygon,
            },
            observasi: {
                observasi_id: observasi.observasi_id,
                jenis_karhutla: observasi.jenis_karhutla,
                temperatur: observasi.temperatur,
                curah_hujan: observasi.curah_hujan,
                kelembapan_udara: observasi.kelembapan_udara,
                tanggal_kejadian: observasi.tanggal_kejadian,
                tanggal_penilaian: observasi.tanggal_penilaian,
                luasan_karhutla: observasi.luasan_karhutla,
                skor_akhir: observasi.skor_akhir,
                hasil_penilaian: getHasilFromSkor(observasi.skor_akhir),
                tutupan_lahan: observasi.tutupan_lahan,
                jenis_vegetasi: observasi.jenis_vegetasi,
                tinggi_muka_air_gambut: observasi.tinggi_muka_air_gambut,
                penggunaan_lahan: observasi.penggunaan_lahan,
                createdAt: observasi.createdAt,
                updatedAt: observasi.updatedAt,
                plots: observasi.plots.map((plot) => ({
                    plot_id: plot.plot_id,
                    luasan_plot: plot.luasan_plot,
                    polygon: plot.polygon,
                    kondisi_vegetasi: plot.kondisi_vegetasi,
                    kondisi_tanah: plot.kondisi_tanah,
                    skor_plot: plot.skor,
                    hasil_plot: getHasilFromSkor(plot.skor),
                    penilaianList: plot.penilaian_observasis.map((po) => ({
                        penilaian_observasi_id: po.penilaian_observasi_id,
                        penilaian_id: po.penilaian.penilaian_id,
                        variable: po.penilaian.variable,
                        kategori: po.penilaian.kategori,
                        deskripsi: po.penilaian.deskripsi,
                        dokumentasi_ids: po.dokumentasis.map((doc) => doc.dokumentasi_id),
                    })),
                })),
            },
        };

        return transformedData;
    } catch (error) {
        logger.error("Error fetching observasi detail data", { error: error.message });
        throw error;
    }
};

const editObservasiData = async (observasi_id, updatedData) => {
    const transaction = await db.transaction();

    try {
        const observasi = await Observasi.findOne({ where: { observasi_id }, transaction });

        if (!observasi) {
            logger.warn("Observasi not found", { observasi_id });
            throw new NotFound(`Observasi with ID ${observasi_id} not found`);
        }

        const tanggalKejadian = new Date(observasi.tanggal_kejadian);
        const now = new Date();
        const diffInDays = Math.floor((now - tanggalKejadian) / (1000 * 60 * 60 * 24));

        if (diffInDays > 6) {
            logger.warn("Edit denied: Observasi is older than 6 days", { observasi_id });
            throw new BadRequest(`Observasi cannot be edited as more than 6 days have passed since tanggal_kejadian.`);
        }

        logger.info("Editing observasi data", { observasi_id });
        await observasi.update(updatedData, { transaction });

        await transaction.commit();
        logger.info("Observasi data edited successfully", { observasi_id });
        return observasi;
    } catch (error) {
        await transaction.rollback();
        logger.error("Error editing observasi data", { error: error.message });
        throw error;
    }
};

const deleteObservasiData = async (observasi_id, providedTransaction = null) => {
    transaction = providedTransaction || (await db.transaction());

    try {
        logger.info("Fetching observasi for deletion, ID:", { observasi_id });
        const observasi = await Observasi.findByPk(observasi_id, { transaction });

        if (!observasi) {
            logger.warn("Observasi not found, ID:", { observasi_id });
            throw new NotFound(`Observasi with id ${observasi_id} not found`);
        }

        logger.info("Fetching associated plot records for observasi, ID:", { observasi_id });
        const plotRecords = await Plot.findAll({ where: { observasi_id }, attributes: ["plot_id"], transaction });

        logger.info("Deleting associated plot records for observasi, ID:", { observasi_id });
        await Promise.all(
            plotRecords.map(async (plot) => {
                await deletePlotData(plot.plot_id, transaction);
            })
        );

        logger.info("Deleting observasi record, ID:", { observasi_id });
        await Observasi.destroy({ where: { observasi_id }, transaction });

        if (!providedTransaction) await transaction.commit();
        logger.info("Successfully deleted observasi and associated data, ID:", { observasi_id });
    } catch (error) {
        if (!providedTransaction) await transaction.rollback();
        logger.error("Error deleting observasi data", { observasi_id, error: error.message });
        throw error;
    }
};

const editPlotData = async (plot_id, updatedData) => {
    const transaction = await db.transaction();

    try {
        logger.info("Editing plot data", { plot_id, updatedData });
        const { coordinates, penilaianList } = updatedData;

        // 1. find the existing plot
        const plot = await Plot.findByPk(plot_id, { transaction });
        if (!plot) {
            logger.warn("Plot not found", { plot_id });
            throw new NotFound(`Plot with id ${plot_id} not found`);
        }

        // 2. find the related observasi
        const observasi = await Observasi.findByPk(plot.observasi_id, { transaction });

        if (!observasi) {
            logger.warn("Observasi not found for plot", { plot_id });
            throw new NotFound(`Observasi not found for plot with id ${plot_id}`);
        }

        // 3. check if 6 days have passed since tanggal_kejadian
        const tanggalKejadian = new Date(observasi.tanggal_kejadian);
        const now = new Date();
        const diffInDays = Math.floor((now - tanggalKejadian) / (1000 * 60 * 60 * 24));

        if (diffInDays > 6) {
            logger.warn("Edit denied: Plot is part of an Observasi older than 6 days", { plot_id });
            throw new BadRequest(`Plot cannot be edited as more than 6 days have passed since tanggal_kejadian.`);
        }

        // 4. update the polygon if coordinates are provided
        let totalArea = observasi.luasan_karhutla;

        if (coordinates) {
            logger.info("Updating plot coordinates", { plot_id, coordinates });
            const formattedCoordinates = coordinates.map((coord) => [coord[1], coord[0]]);

            if (
                formattedCoordinates[0][0] !== formattedCoordinates[formattedCoordinates.length - 1][0] ||
                formattedCoordinates[0][1] !== formattedCoordinates[formattedCoordinates.length - 1][1]
            ) {
                formattedCoordinates.push(formattedCoordinates[0]);
            }

            const geoJsonPolygon = JSON.stringify({
                type: "Polygon",
                coordinates: [formattedCoordinates],
            });

            const [result] = await db.query(areaQuery, {
                replacements: { geoJson: geoJsonPolygon },
                type: Sequelize.QueryTypes.SELECT,
                transaction,
            });

            const luasan_plot = parseFloat(result.area_in_hectares.toFixed(2));

            // update the plot polygon and area
            await plot.update({ polygon: db.literal(`ST_GeomFromGeoJSON('${geoJsonPolygon}')`), luasan_plot }, { transaction });

            // recalculate total area for the observasi
            const allPlots = await Plot.findAll({ where: { observasi_id: observasi.observasi_id }, transaction });
            totalArea = allPlots.reduce((sum, p) => sum + (p.luasan_plot || 0), 0);
        }

        // 5. update or create PenilaianObservasi entries if penilaianList is provided
        let totalScore = observasi.skor_akhir;
        if (penilaianList) {
            logger.info("Updating penilaian list for plot", { plot_id, penilaianList });
            for (const penilaian of penilaianList) {
                const { penilaian_observasi_id, penilaian_id } = penilaian;

                // check if penilaian_id exists
                const penilaianExists = await Penilaian.findByPk(penilaian_id, { transaction });
                if (!penilaianExists) {
                    logger.warn("Penilaian not found", { penilaian_id });
                    throw new NotFound(`Penilaian with ID ${penilaian_id} not found`);
                }

                if (penilaian_observasi_id) {
                    // update existing PenilaianObservasi
                    const existingPenilaianObservasi = await PenilaianObservasi.findOne({
                        where: { penilaian_observasi_id, plot_id },
                        transaction,
                    });
                    if (existingPenilaianObservasi) {
                        await existingPenilaianObservasi.update({ penilaian_id }, { transaction });
                    } else {
                        logger.warn("PenilaianObservasi not found", { penilaian_observasi_id, plot_id });
                        throw new NotFound(`PenilaianObservasi with id ${penilaian_observasi_id} and plot_id ${plot_id} not found`);
                    }
                } else {
                    // create a new PenilaianObservasi if penilaian_observasi_id is not provided
                    await PenilaianObservasi.create(
                        {
                            plot_id,
                            penilaian_id,
                        },
                        { transaction }
                    );
                }
            }

            // recalculate the overall score
            await calculateScore(plot_id, transaction);
            const allPlots = await Plot.findAll({ where: { observasi_id: observasi.observasi_id }, transaction });
            totalScore = allPlots.reduce((sum, p) => sum + (p.skor || 0), 0) / allPlots.length;
        }

        // 6. update the observasi with recalculated values (if needed)
        if (coordinates || penilaianList) {
            logger.info("Updating observasi with recalculated values", { observasi_id: observasi.observasi_id, totalScore, totalArea });
            await observasi.update(
                {
                    skor_akhir: totalScore,
                    luasan_karhutla: totalArea,
                },
                { transaction }
            );
        }

        // commit the transaction
        await transaction.commit();
        logger.info("Successfully edited plot data", { plot_id });

        const updatedPlotData = await Plot.findByPk(plot_id, {
            include: [
                {
                    model: PenilaianObservasi,
                    include: [
                        {
                            model: Penilaian,
                        },
                        {
                            model: Dokumentasi,
                        },
                    ],
                },
            ],
        });

        // 7. return the updated plot details
        return {
            plot_id: updatedPlotData.plot_id,
            luasan_plot: updatedPlotData.luasan_plot,
            polygon: updatedPlotData.polygon,
            kondisi_vegetasi: updatedPlotData.kondisi_vegetasi,
            kondisi_tanah: updatedPlotData.kondisi_tanah,
            skor_plot: updatedPlotData.skor,
            hasil_plot: getHasilFromSkor(updatedPlotData.skor),
            penilaianList: updatedPlotData.penilaian_observasis.map((po) => ({
                penilaian_observasi_id: po.penilaian_observasi_id,
                penilaian_id: po.penilaian_id,
                variable: po.penilaian.variable,
                kategori: po.penilaian.kategori,
                deskripsi: po.penilaian.deskripsi,
                dokumentasi_ids: po.dokumentasis.map((doc) => doc.dokumentasi_id),
            })),
        }
    } catch (error) {
        // rollback the transaction if an error happen
        if (transaction) await transaction.rollback();
        logger.error("Error editing plot data", { plot_id, error: error.message });
        throw error;
    }
};

const deletePlotData = async (plot_id, providedTransaction = null) => {
    transaction = providedTransaction || (await db.transaction());

    try {
        logger.info("Deleting plot data", { plot_id });

        const plot = await Plot.findByPk(plot_id, { transaction });
        if (!plot) {
            logger.warn("Plot not found", { plot_id });
            throw new NotFound(`Plot with id ${plot_id} not found`);
        }

        const observasi = await Observasi.findByPk(plot.observasi_id, { transaction });
        if (!observasi) {
            logger.warn("Observasi not found for plot", { plot_id });
            throw new NotFound(`Observasi not found for plot with id ${plot_id}`);
        }

        logger.info("Fetching associated PenilaianObservasi records", { plot_id });
        const penilaianObservasiRecords = await PenilaianObservasi.findAll({
            where: { plot_id },
            attributes: ["penilaian_observasi_id"],
            transaction,
        });

        await Promise.all(
            penilaianObservasiRecords.map(async (penilaianObservasi) => {
                const dokumentasiRecords = await Dokumentasi.findAll({
                    where: { penilaian_observasi_id: penilaianObservasi.penilaian_observasi_id },
                    attributes: ["dokumentasi_id"],
                    transaction,
                });

                logger.info("Deleting associated Dokumentasi records", { penilaian_observasi_id: penilaianObservasi.penilaian_observasi_id });
                await Promise.all(
                    dokumentasiRecords.map(async (dokumentasi) => {
                        await deleteDokumentasiData(dokumentasi.dokumentasi_id, transaction);
                    })
                );

                logger.info("Deleting PenilaianObservasi record", { penilaian_observasi_id: penilaianObservasi.penilaian_observasi_id });
                await PenilaianObservasi.destroy({
                    where: { penilaian_observasi_id: penilaianObservasi.penilaian_observasi_id },
                    transaction,
                });
            })
        );

        logger.info("Deleting plot record", { plot_id });
        await Plot.destroy({ where: { plot_id }, transaction });

        // recalculate skor_akhir and luasan_karhutla
        logger.info("Recalculating Observasi data", { observasi_id: observasi.observasi_id });

        const remainingPlots = await Plot.findAll({
            where: { observasi_id: observasi.observasi_id },
            attributes: ["skor", "luasan_plot"],
            transaction,
        });

        let skorAkhir = null;
        let luasanKarhutla = null;

        if (remainingPlots.length > 0) {
            // calculate total skor_akhir and luasan_karhutla
            skorAkhir = remainingPlots.reduce((acc, plot) => acc + (plot.skor || 0), 0);
            luasanKarhutla = remainingPlots.reduce((acc, plot) => acc + (plot.luasan_plot || 0), 0);
        }

        logger.info("Updating Observasi", {
            observasi_id: observasi.observasi_id,
            skor_akhir: skorAkhir,
            luasan_karhutla: luasanKarhutla,
        });

        await Observasi.update(
            { skor_akhir: skorAkhir, luasan_karhutla: luasanKarhutla },
            { where: { observasi_id: observasi.observasi_id }, transaction }
        );

        if (!providedTransaction) await transaction.commit();
        logger.info("Successfully deleted plot data and recalculated observasi", { plot_id });

    } catch (error) {
        if (!providedTransaction) await transaction.rollback();
        logger.error("Error deleting plot data", { plot_id, error: error.message });
        throw error;
    }
};

const convertToPDF = async (observasi_id) => {
    try {
        logger.info("Converting observasi to PDF", { observasi_id });

        const observasi = await getObservasiDetailData(observasi_id);
        const content = await downloadPDFReport(observasi);
        logger.info("Successfully converted observasi to PDF", { observasi_id });

        return content;
    } catch (error) {
        logger.error("Error converting observasi to PDF", { observasi_id, error: error.message });
        throw error;
    }
};

const calculateScore = async (plot_id, transaction = null) => {
    try {
        logger.info("Calculating score for plot", { plot_id });

        const penilaianObs = await PenilaianObservasi.findAll({ where: { plot_id }, transaction });
        const penilaianIds = penilaianObs.map((po) => po.penilaian_id);

        logger.info("Fetching associated penilaian items", { plot_id, penilaianIds });
        const [vegetasiItems, tanahItems] = await Promise.all([
            Penilaian.findAll({ where: { penilaian_id: { [Op.in]: penilaianIds }, type: "Kondisi Vegetasi" }, transaction }),
            Penilaian.findAll({ where: { penilaian_id: { [Op.in]: penilaianIds }, type: "Kondisi Tanah" }, transaction }),
        ]);

        const sumVegetasi = vegetasiItems.reduce((acc, item) => acc + (item.bobot || 0), 0);
        const sumTanah = tanahItems.reduce((acc, item) => acc + (item.bobot || 0), 0);
        const newSkor = sumVegetasi + sumTanah;

        logger.info("Updating plot with new scores", { plot_id, sumVegetasi, sumTanah, newSkor });
        await Plot.update(
            { kondisi_vegetasi: sumVegetasi, kondisi_tanah: sumTanah, skor: newSkor },
            { where: { plot_id }, transaction }
        );

        logger.info("Successfully updated plot scores", { plot_id });
        return Plot.findByPk(plot_id, { transaction });
    } catch (error) {
        logger.error("Error calculating score for plot", { plot_id, error: error.message });
        throw error;
    }
};

module.exports = {
    createObservasiData,
    getObservasiData,
    getObservasiDetailData,
    editObservasiData,
    deleteObservasiData,
    editPlotData,
    deletePlotData,
    convertToPDF,
};
