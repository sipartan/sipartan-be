const { User, Lahan, Observasi, Penilaian, Dokumentasi, Plot, PenilaianObservasi, LokasiRegion } = require("../models");
const db = require("../config/database");
const { Op } = require("sequelize");
const turf = require("@turf/turf");
const { deleteDokumentasiData } = require("./dokumentasiService");
const config = require("../config/config");
const paginate = require("../utils/pagination");
const { mapHasilPenilaianToSkor, getHasilFromSkor } = require("../utils/karhutlaPenilaian");
const { NotFound } = require("../utils/response");
const downloadPDFReport = require("../utils/generateReport/index");
const logger = require("../utils/logger");

const BASE_URL = config.env.baseUrl;

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
        } = newDataObservasi;

        logger.info("Creating new observasi data", { lahan_id, user_id, jenis_karhutla });

        // Create the observation
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
            },
            { transaction }
        );

        logger.info("Observasi created", { observasi_id: observasi.observasi_id });

        // Create all plots
        const plots = [];
        let totalLuasanKarhutla = 0;

        for (const plot of dataPlot) {
            const coordinates = plot.coordinates.map((coord) => [coord[1], coord[0]]);
            const polygonGeoJSON = { type: "Polygon", coordinates: [coordinates] };
            const area = turf.area(polygonGeoJSON);
            const luasan_plot = area / 10000;

            totalLuasanKarhutla += luasan_plot;

            const newPlot = await Plot.create(
                { observasi_id: observasi.observasi_id, luasan_plot, polygon: polygonGeoJSON },
                { transaction }
            );

            logger.info("Plot created", { plot_id: newPlot.plot_id });

            let penilaianObservasiIds = [];
            if (Array.isArray(plot.penilaian_id)) {
                penilaianObservasiIds = await Promise.all(
                    plot.penilaian_id.map(async (penilaian_id) => {
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
            finalScore,
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

    try {
        if (lahan_id) where.lahan_id = lahan_id;
        if (user_id) where.user_id = user_id;

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

        if (jenis_karhutla) where.jenis_karhutla = jenis_karhutla;

        const options = {
            where,
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
                tutupan_lahan: observasi.lahan.tutupan_lahan,
                jenis_vegetasi: observasi.lahan.jenis_vegetasi,
                jenis_tanah: observasi.lahan.jenis_tanah,
                tinggi_muka_air_gambut: observasi.lahan.tinggi_muka_air_gambut,
                jenis_karhutla: observasi.lahan.jenis_karhutla,
                penggunaan_lahan: observasi.lahan.penggunaan_lahan,
                latitude: observasi.lahan.latitude,
                longitude: observasi.lahan.longitude,
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
                tutupan_lahan: observasi.lahan.tutupan_lahan,
                jenis_vegetasi: observasi.lahan.jenis_vegetasi,
                jenis_tanah: observasi.lahan.jenis_tanah,
                tinggi_muka_air_gambut: observasi.lahan.tinggi_muka_air_gambut,
                jenis_karhutla: observasi.lahan.jenis_karhutla,
                penggunaan_lahan: observasi.lahan.penggunaan_lahan,
                latitude: observasi.lahan.latitude,
                longitude: observasi.lahan.longitude,
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
                        image: po.dokumentasis.map((doc) => `${BASE_URL}/observasi/dokumentasi/${doc.dokumentasi_id}`),
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
        logger
        const observasi = await Observasi.findOne({ where: { observasi_id }, transaction });

        if (!observasi) {
            logger.warn("Observasi not found", { observasi_id });
            throw new NotFound(`Observasi with ID ${observasi_id} not found`);
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

const deleteObservasiData = async (observasi_id) => {
    const transaction = await db.transaction();

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

        await transaction.commit();
        logger.info("Successfully deleted observasi and associated data, ID:", { observasi_id });
    } catch (error) {
        await transaction.rollback();
        logger.error("Error deleting observasi data", { observasi_id, error: error.message });
        throw error;
    }
};

const editPlotData = async (plot_id, updatedData) => {
    const transaction = await db.transaction();

    try {
        logger.info("Editing plot data", { plot_id, updatedData });
        const { coordinates, penilaianList } = updatedData;

        // 1. Find the existing plot
        const plot = await Plot.findByPk(plot_id, { transaction });
        if (!plot) {
            logger.warn("Plot not found", { plot_id });
            throw new NotFound(`Plot with id ${plot_id} not found`);
        }

        // 2. Find the related observasi
        const observasi = await Observasi.findByPk(plot.observasi_id, { transaction });
        if (!observasi) {
            logger.warn("Observasi not found for plot", { plot_id });
            throw new NotFound(`Observasi not found for plot with id ${plot_id}`);
        }

        // 3. Update the polygon if coordinates are provided
        let totalArea = observasi.luasan_karhutla;

        if (coordinates) {
            logger.info("Updating plot coordinates", { plot_id, coordinates });
            const formattedCoordinates = coordinates.map((coord) => [coord[1], coord[0]]);
            const polygonGeoJSON = {
                type: "Polygon",
                coordinates: [formattedCoordinates],
            };

            // Calculate the new area (luasan_plot) in hectares
            const area = turf.area(polygonGeoJSON);
            const luasan_plot = area / 10000;

            // Update the plot polygon and area
            await plot.update({ polygon: polygonGeoJSON, luasan_plot }, { transaction });

            // Recalculate total area for the observasi
            const allPlots = await Plot.findAll({ where: { observasi_id: observasi.observasi_id }, transaction });
            totalArea = allPlots.reduce((sum, p) => sum + (p.luasan_plot || 0), 0);
        }

        // 4. Update or create PenilaianObservasi entries if penilaianList is provided
        let totalScore = observasi.skor_akhir;
        if (penilaianList) {
            logger.info("Updating penilaian list for plot", { plot_id, penilaianList });
            for (const penilaian of penilaianList) {
                const { penilaian_observasi_id, penilaian_id } = penilaian;

                if (penilaian_observasi_id) {
                    // Update existing PenilaianObservasi
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
                    // Create a new PenilaianObservasi if penilaian_observasi_id is not provided
                    await PenilaianObservasi.create(
                        {
                            plot_id,
                            penilaian_id,
                        },
                        { transaction }
                    );
                }
            }

            // Recalculate the overall score
            await calculateScore(plot_id, transaction);
            const allPlots = await Plot.findAll({ where: { observasi_id: observasi.observasi_id }, transaction });
            totalScore = allPlots.reduce((sum, p) => sum + (p.skor || 0), 0) / allPlots.length;
        }

        // 5. Update the observasi with recalculated values (if needed)
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

        // Commit the transaction
        await transaction.commit();
        logger.info("Successfully edited plot data", { plot_id });

        // 7. Return the updated plot details
        return {
            plot_id: plot.plot_id,
            luasan_plot: plot.luasan_plot,
            polygon: plot.polygon,
            penilaianList: penilaianList
                ? penilaianList.map((p) => ({
                    penilaian_observasi_id: p.penilaian_observasi_id,
                    penilaian_id: p.penilaian_id,
                }))
                : [],
        };
    } catch (error) {
        // Rollback the transaction if an error occurs
        await transaction.rollback();
        logger.error("Error editing plot data", { plot_id, error: error.message });
        throw error;
    }
};

const deletePlotData = async (plot_id, transaction = null) => {
    try {
        logger.info("Deleting plot data", { plot_id });

        const plot = await Plot.findByPk(plot_id, { transaction });
        if (!plot) {
            logger.warn("Plot not found", { plot_id });
            throw new NotFound(`Plot with id ${plot_id} not found`);
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
                        await deleteDokumentasiData(dokumentasi.dokumentasi_id);
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

        logger.info("Successfully deleted plot data", { plot_id });
    } catch (error) {
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