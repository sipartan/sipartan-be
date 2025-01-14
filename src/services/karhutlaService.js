const Observasi = require("../models/observasi");
const Plot = require("../models/plot");
const Penilaian = require("../models/penilaian");
const PenilaianObservasi = require("../models/penilaianObservasi");
const Dokumentasi = require("../models/dokumentasi");
const { Op } = require("sequelize");
const turf = require("@turf/turf");
const { DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client, bucketName } = require("../config/minioClient");
const config = require("../config/config");
const LokasiRegion = require("../models/lokasiRegion");
const DataUmumLahan = require("../models/dataUmum");
const User = require("../models/user");
const paginate = require("../utils/pagination");
const downloadPDFReport = require("../utils/generateReport/index");

const BASE_URL = config.env.baseUrl;

const createKarhutlaData = async (data) => {
    const {
        region: { provinsi, kabupaten, kecamatan, desa },
        dataumumlahan: { tutupan_lahan, jenis_vegetasi, luasan_karhutla, jenis_tanah, tinggi_muka_air_gambut, jenis_karhutla, penggunaan_lahan, latitude, longitude, temperatur, curah_hujan, kelembaban_udara },
        observasi: { tanggal_kejadian, tanggal_penilaian, dataPlot },
        user_id,
    } = data;

    // Step 1: Find or create LokasiRegion
    const [lokasiRegion] = await LokasiRegion.findOrCreate({
        where: { provinsi, kabupaten, kecamatan, desa },
        defaults: { provinsi, kabupaten, kecamatan, desa },
    });

    // Step 2: Find or create DataUmumLahan
    const [dataUmumLahan] = await DataUmumLahan.findOrCreate({
        where: { tutupan_lahan, jenis_vegetasi, luasan_karhutla, jenis_tanah, tinggi_muka_air_gambut, jenis_karhutla, penggunaan_lahan },
        defaults: {
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
        },
    });

    // Step 3: Create Observasi
    const observasi = await Observasi.create({
        user_id,
        data_lahan_id: dataUmumLahan.data_lahan_id,
        tanggal_kejadian,
        tanggal_penilaian,
    });

    // Step 4: Process Plots and Calculate Scores
    const plots = [];
    for (const plot of dataPlot) {
        // Convert coordinates for GeoJSON format
        const coordinates = plot.coordinates.map((coordinate) => [coordinate[1], coordinate[0]]);
        const polygonGeoJSON = {
            type: "Polygon",
            coordinates: [coordinates],
        };

        // Calculate area in hectares
        const area = turf.area(polygonGeoJSON);
        const luasan_plot = area / 10000;

        // Create Plot
        const newPlot = await Plot.create({
            observation_id: observasi.observation_id,
            luasan_plot,
            polygon: polygonGeoJSON,
        });

        // Create PenilaianObservasi entries for this plot
        let penilaianObservasiIds = [];
        if (Array.isArray(plot.penilaian_id)) {
            penilaianObservasiIds = await Promise.all(
                plot.penilaian_id.map(async (penilaian_id) => {
                    const penilaianObservasi = await PenilaianObservasi.create({
                        plot_id: newPlot.plot_id,
                        penilaian_id,
                    });
                    return penilaianObservasi.penilaian_observasi_id;
                })
            );
        }

        // Update Plot score
        const updatedPlot = await calculateScore(newPlot.plot_id);

        // Add to plots array with required structure
        plots.push({
            plot_id: updatedPlot.dataValues.plot_id,
            penilaian_observasi_ids: penilaianObservasiIds,
        });
    }

    // Step 5: Update Observasi with Final Score
    const totalScore = plots.reduce((sum, plot) => sum + (plot.skor || 0), 0);
    const finalScore = plots.length ? totalScore / plots.length : 0;

    observasi.skor_akhir = finalScore;
    await observasi.save();

    // Return the result
    return {
        observation_id: observasi.observation_id,
        data_lahan_id: observasi.data_lahan_id,
        skor_akhir: finalScore,
        tanggal_kejadian: observasi.tanggal_kejadian,
        tanggal_penilaian: observasi.tanggal_penilaian,
        plots: plots.map((plot) => ({
            plot_id: plot.plot_id,
            penilaian_observasi_ids: plot.penilaian_observasi_ids,
        })),
    };
};

// user per lahan
// const getAllKarhutlaData = async (filters) => {
//     const {
//         userId,
//         page = 1,
//         limit = 10,
//         sortBy = "createdAt",
//         order = "DESC",
//         hasil_penilaian,
//         skor_min,
//         skor_max,
//         date_start,
//         date_end,
//     } = filters;

//     const where = {};
//     if (userId) where.user_id = userId; // Filter by user ID if provided
//     if (date_start && date_end) {
//         where.createdAt = { [Op.between]: [new Date(date_start), new Date(date_end)] };
//     } else if (date_start) {
//         where.createdAt = { [Op.gte]: new Date(date_start) };
//     } else if (date_end) {
//         where.createdAt = { [Op.lte]: new Date(date_end) };
//     }

//     // Observasi filter
//     const observasiWhere = {};
//     if (skor_min && skor_max) {
//         observasiWhere.skor_akhir = { [Op.between]: [parseFloat(skor_min), parseFloat(skor_max)] };
//     } else if (skor_min) {
//         observasiWhere.skor_akhir = { [Op.gte]: parseFloat(skor_min) };
//     } else if (skor_max) {
//         observasiWhere.skor_akhir = { [Op.lte]: parseFloat(skor_max) };
//     }

//     // Filter by hasil_penilaian
//     if (hasil_penilaian) {
//         const skorRange = await mapHasilPenilaianToSkor(hasil_penilaian);
//         if (skorRange) {
//             observasiWhere.skor_akhir = { [Op.between]: [skorRange.min, skorRange.max] };
//         }
//     }

//     const options = {
//         where,
//         include: [
//             {
//                 model: Observasi,
//                 required: true,
//                 where: observasiWhere,
//                 include: [
//                     {
//                         model: Plot,
//                         attributes: [
//                             "plot_id",
//                             "luasan_plot",
//                             "polygon",
//                             "kondisi_vegetasi",
//                             "kondisi_tanah",
//                             "skor",
//                         ],
//                     },
//                 ],
//             },
//             {
//                 model: User,
//                 attributes: ["user_id", "nama"], // Fetch user for each data_lahan
//             },
//             {
//                 model: LokasiRegion,
//                 attributes: ["region_location_id", "provinsi", "kabupaten", "kecamatan", "desa"],
//             },
//         ],
//         attributes: [
//             "data_lahan_id",
//             "tutupan_lahan",
//             "jenis_vegetasi",
//             "luasan_karhutla",
//             "jenis_tanah",
//             "tinggi_muka_air_gambut",
//             "jenis_karhutla",
//             "penggunaan_lahan",
//             "latitude",
//             "longitude",
//             "temperatur",
//             "curah_hujan",
//             "kelembaban_udara",
//             "createdAt",
//             "updatedAt",
//         ],
//         order: [[sortBy, order]],
//         page: parseInt(page, 10),
//         limit: parseInt(limit, 10),
//     };

//     const result = await paginate(DataUmumLahan, options);

//     // Transform the data into the desired format
//     result.results = result.results.map((lahan) => {
//         const region = lahan.lokasi_region;
//         const skorLahan = lahan.observasis.length ? lahan.observasis[0].skor_akhir : null;
//         return {
//             region: region
//                 ? {
//                       region_location_id: region.region_location_id,
//                       provinsi: region.provinsi,
//                       kabupaten: region.kabupaten,
//                       kecamatan: region.kecamatan,
//                       desa: region.desa,
//                   }
//                 : null,
//             user: lahan.user
//                 ? {
//                       user_id: lahan.user.user_id,
//                       nama: lahan.user.nama,
//                   }
//                 : null,
//             dataUmumLahan: {
//                 ...lahan.toJSON(),
//                 skor_lahan: skorLahan,
//                 hasil_penilaian_lahan: getHasilFromSkor(skorLahan),
//             },
//             observasi: lahan.observasis.map((obs) => ({
//                 observation_id: obs.observation_id,
//                 tanggal_kejadian: obs.tanggal_kejadian,
//                 tanggal_penilaian: obs.tanggal_penilaian,
//                 skor_akhir: obs.skor_akhir,
//                 hasil_penilaian: getHasilFromSkor(obs.skor_akhir),
//                 plots: obs.plots.map((plot) => ({
//                     plot_id: plot.plot_id,
//                     luasan_plot: plot.luasan_plot,
//                     polygon: plot.polygon,
//                     kondisi_vegetasi: plot.kondisi_vegetasi,
//                     kondisi_tanah: plot.kondisi_tanah,
//                     skor_plot: plot.skor,
//                     hasil_plot: getHasilFromSkor(plot.skor),
//                 })),
//             })),
//         };
//     });

//     return result;
// };


// user per observasi, the pagination work is still on per observation, nor per data lahan
const getAllKarhutlaData = async (filters) => {
    const {
        userId,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        order = "DESC",
        hasil_penilaian,
        skor_min,
        skor_max,
        date_start = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        date_end = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
    } = filters;

    const where = {};
    if (userId) where.user_id = userId; // Filter by user ID if provided
    if (date_start && date_end) {
        where.createdAt = { [Op.between]: [new Date(date_start), new Date(date_end)] };
    } else if (date_start) {
        where.createdAt = { [Op.gte]: new Date(date_start) };
    } else if (date_end) {
        where.createdAt = { [Op.lte]: new Date(date_end) };
    }

    // Observasi filter
    const observasiWhere = {};
    if (skor_min && skor_max) {
        observasiWhere.skor_akhir = { [Op.between]: [parseFloat(skor_min), parseFloat(skor_max)] };
    } else if (skor_min) {
        observasiWhere.skor_akhir = { [Op.gte]: parseFloat(skor_min) };
    } else if (skor_max) {
        observasiWhere.skor_akhir = { [Op.lte]: parseFloat(skor_max) };
    }

    // Filter by hasil_penilaian
    if (hasil_penilaian) {
        const skorRange = await mapHasilPenilaianToSkor(hasil_penilaian);
        if (skorRange) {
            observasiWhere.skor_akhir = { [Op.between]: [skorRange.min, skorRange.max] };
        }
    }

    const options = {
        where,
        include: [
            {
                model: Observasi,
                required: true,
                where: observasiWhere,
                include: [
                    {
                        model: Plot,
                        attributes: [
                            "plot_id",
                            "luasan_plot",
                            "polygon",
                            "kondisi_vegetasi",
                            "kondisi_tanah",
                            "skor",
                        ],
                    },
                    {
                        model: DataUmumLahan,
                        include: [
                            {
                                model: User,
                                attributes: ["user_id", "nama"], // Fetch user based on each observasi
                            },
                        ],
                    },
                ],
            },
            {
                model: LokasiRegion,
                attributes: ["region_location_id", "provinsi", "kabupaten", "kecamatan", "desa"],
            },
        ],
        attributes: [
            "data_lahan_id",
            "tutupan_lahan",
            "jenis_vegetasi",
            "luasan_karhutla",
            "jenis_tanah",
            "tinggi_muka_air_gambut",
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

    // Transform the data into the desired format
    result.results = result.results.map((lahan) => {
        const region = lahan.lokasi_region;
        const skorLahan = lahan.observasis.length
            ? Math.round(lahan.observasis.reduce((sum, obs) => sum + obs.skor_akhir, 0) / lahan.observasis.length)
            : null;
        return {
            region: region
                ? {
                    region_location_id: region.region_location_id,
                    provinsi: region.provinsi,
                    kabupaten: region.kabupaten,
                    kecamatan: region.kecamatan,
                    desa: region.desa,
                }
                : null,
            dataUmumLahan: {
                data_lahan_id: lahan.data_lahan_id,
                tutupan_lahan: lahan.tutupan_lahan,
                jenis_vegetasi: lahan.jenis_vegetasi,
                luasan_karhutla: lahan.luasan_karhutla,
                jenis_tanah: lahan.jenis_tanah,
                tinggi_muka_air_gambut: lahan.tinggi_muka_air_gambut,
                jenis_karhutla: lahan.jenis_karhutla,
                penggunaan_lahan: lahan.penggunaan_lahan,
                latitude: lahan.latitude,
                longitude: lahan.longitude,
                temperatur: lahan.temperatur,
                curah_hujan: lahan.curah_hujan,
                kelembaban_udara: lahan.kelembaban_udara,
                skor_lahan: skorLahan,
                hasil_penilaian_lahan: getHasilFromSkor(skorLahan),
            },
            observasi: lahan.observasis.map((obs) => ({
                user: obs.data_umum_lahan.user
                    ? {
                        user_id: obs.data_umum_lahan.user.user_id,
                        nama: obs.data_umum_lahan.user.nama,
                    }
                    : null,
                observation_id: obs.observation_id,
                tanggal_kejadian: obs.tanggal_kejadian,
                tanggal_penilaian: obs.tanggal_penilaian,
                skor_akhir: obs.skor_akhir,
                hasil_penilaian: getHasilFromSkor(obs.skor_akhir),
                plots: obs.plots.map((plot) => ({
                    plot_id: plot.plot_id,
                    luasan_plot: plot.luasan_plot,
                    polygon: plot.polygon,
                    kondisi_vegetasi: plot.kondisi_vegetasi,
                    kondisi_tanah: plot.kondisi_tanah,
                    skor_plot: plot.skor,
                    hasil_plot: getHasilFromSkor(plot.skor),
                })),
            })),
        };
    });

    return result;
};

const editKarhutlaData = async (newData) => {
    if (newData.lahan) {
        const { data_lahan_id, ...updatedData } = newData.lahan;
        await editLahanData(data_lahan_id, updatedData);
    }

    if (newData.observasi) {
        const { observation_id, ...updatedData } = newData.observasi;
        await editObservasiData(observation_id, updatedData);
    }

    if (newData.plot) {
        const { plot_id, polygon, penilaianList } = newData.plot;

        // Update plot details
        if (polygon) {
            await editPlotData(plot_id, polygon);
        }

        // Update penilaianList
        if (penilaianList && penilaianList.length > 0) {
            await editPenilaianObservasiData(plot_id, penilaianList);
        }
    }
};

const deleteKarhutlaData = async (query) => {
    if (query.lahanId) {
        await deleteLahanData(query.lahanId);
    }
    if (query.observasiId) {
        await deleteObservasiData(query.observasiId);
    }
    if (query.plotId) {
        await deletePlotData(query.plotId);
    }
};

const uploadDokumentasiData = async (files, fields) => {
    const uploadResults = await Promise.all(
        files.map(async ({ uploadPromise, s3Key }) => {
            try {
                await uploadPromise;
                return { s3Key, success: true };
            } catch (err) {
                return { s3Key, success: false, error: err };
            }
        })
    );

    const failed = uploadResults.filter((r) => !r.success);
    if (failed.length > 0) {
        throw new Error('Some files failed to upload');
    }

    const imageUrls = [];
    for (const { s3Key } of uploadResults) {
        const doc = await Dokumentasi.create({
            penilaian_observasi_id: fields.penilaian_observasi_id,
            s3_key: s3Key,
            tipe: fields.tipe,
            kategori: fields.kategori,
        });

        const imageUrl = `${process.env.BASE_URL}/observasi/dokumentasi/${doc.dokumentasi_id}`;
        imageUrls.push(imageUrl);
    }

    return { imageUrls };
};

const getImage = async (dokumentasiId) => {
    const dokumentasi = await Dokumentasi.findOne({
        where: { dokumentasi_id: dokumentasiId },
    });

    if (!dokumentasi) {
        throw new Error("Dokumentasi tidak ditemukan");
    }

    const s3Key = dokumentasi.s3_key;
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
    });

    const { Body } = await s3Client.send(command);

    if (!Body) {
        throw new Error("Failed to fetch image");
    }

    return Body;
};

const deleteDokumentasiData = async (dokumentasiId) => {
    // Step 1: Find the Dokumentasi record
    const dokumentasi = await Dokumentasi.findOne({
        where: { dokumentasi_id: dokumentasiId },
    });

    if (!dokumentasi) {
        throw new Error("Dokumentasi tidak ditemukan");
    }

    // Step 2: Delete the file from MinIO (S3)
    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: dokumentasi.s3_key,
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error("Error deleting file from MinIO:", error);
        throw new Error("Failed to delete file from MinIO");
    }

    // Step 3: Delete the Dokumentasi record from the database
    await Dokumentasi.destroy({ where: { dokumentasi_id: dokumentasiId } });
};

const getLahanDetailData = async (filters) => {
    const {
        observation_id,
        start_date,
        end_date,
        skor_akhir,
        hasil_penilaian,
        user_id,
    } = filters;

    const observasiWhere = {};

    // Apply filters for observation level
    if (observation_id) observasiWhere.observation_id = observation_id;
    if (start_date && end_date) {
        observasiWhere.tanggal_kejadian = {
            [Op.between]: [new Date(start_date), new Date(end_date)],
        };
    } else if (start_date) {
        observasiWhere.tanggal_kejadian = { [Op.gte]: new Date(start_date) };
    } else if (end_date) {
        observasiWhere.tanggal_kejadian = { [Op.lte]: new Date(end_date) };
    }
    if (skor_akhir) observasiWhere.skor_akhir = skor_akhir;
    if (hasil_penilaian) {
        const skorRange = await mapHasilPenilaianToSkor(hasil_penilaian);
        if (skorRange) {
            observasiWhere.skor_akhir = {
                [Op.between]: [skorRange.min, skorRange.max],
            };
        }
    }

    // Query data with filters
    // const result = await DataUmumLahan.findAll({
    //     include: [
    //         {
    //             model: LokasiRegion,
    //             attributes: ['provinsi', 'kabupaten', 'kecamatan', 'desa']
    //         },
    //         {
    //             model: Observasi,
    //             include: [
    //                 {
    //                     model: Plot,
    //                     include: [
    //                         {
    //                             model: PenilaianObservasi,
    //                             include: [

    //                                 {
    //                                     model: Penilaian,
    //                                     attributes: ['variable', 'type', 'deskripsi', 'kategori', 'bobot', 'nilai']
    //                                 },
    //                                 {
    //                                     model: Dokumentasi
    //                                 }
    //                             ]
    //                         }
    //                     ]
    //                 }
    //             ]
    //         },
    //         {
    //             model: User,
    //             attributes: ['nama', 'instansi', 'email', 'username']
    //         }
    //     ]
    // });

    const result = await PenilaianObservasi.findAll({
        include: [
            {
                model: Penilaian
            },
            {
                model: Dokumentasi
            }]
    });



    // Transform the data into the desired response format
    // const transformedData = result.map((lahan) => {
    //     const region = lahan.lokasi_region;
    //     const user = lahan.user;

    //     // Calculate skor_lahan as the average of skor_akhir from observasi
    //     const totalSkor = lahan.observasis.reduce((sum, obs) => sum + obs.skor_akhir, 0);
    //     const averageSkorLahan = lahan.observasis.length ? totalSkor / lahan.observasis.length : 0;

    //     const observasiList = lahan.observasis.map((obs) => {
    //         const plots = obs.plots.map((plot) => {
    //             const penilaianList = plot.penilaian_observasis.map((penilaianObservasi) => ({
    //                 penilaianObservasiId: penilaianObservasi.penilaian_observasi_id,
    //                 penilaianId: penilaianObservasi.penilaian.penilaian_id,
    //                 variable: penilaianObservasi.penilaian.variable,
    //                 kategori: penilaianObservasi.penilaian.kategori,
    //                 deskripsi: penilaianObservasi.penilaian.deskripsi,
    //                 image: penilaianObservasi.dokumentasis?.length
    //                     ? penilaianObservasi.dokumentasis.map((dokumentasi) => {
    //                         // Access the dataValues object to get the correct keys

    //                         console.log("Dokumentasi:", dokumentasi.dataValues);

    //                         const { dokumentasi_ } = dokumentasi.dataValues;

    //                         // Log for debugging
    //                         console.log("Dokumentasi ID:", dokumentasi_);

    //                         // Return the formatted image URL
    //                         return dokumentasi_
    //                             ? `${BASE_URL}/observasi/dokumentasi/${dokumentasi_}`
    //                             : null;
    //                     }).filter(Boolean) // Remove null values
    //                     : [],
    //             }));

    //             return {
    //                 plot_id: plot.plot_id,
    //                 luasan_plot: plot.luasan_plot,
    //                 polygon: plot.polygon,
    //                 kondisi_vegetasi: plot.kondisi_vegetasi,
    //                 kondisi_tanah: plot.kondisi_tanah,
    //                 skor_plot: plot.skor,
    //                 hasil_plot: getHasilFromSkor(plot.skor),
    //                 penilaianList,
    //             };
    //         });

    //         return {
    //             user: {
    //                 user_id: user.user_id,
    //                 nama: user.nama,
    //             },
    //             observation_id: obs.observation_id,
    //             tanggal_kejadian: obs.tanggal_kejadian,
    //             tanggal_penilaian: obs.tanggal_penilaian,
    //             skor_akhir: obs.skor_akhir,
    //             hasil_penilaian: getHasilFromSkor(obs.skor_akhir),
    //             plots,
    //         };
    //     });

    //     return {
    //         region: {
    //             region_location_id: region.region_location_id,
    //             provinsi: region.provinsi,
    //             kabupaten: region.kabupaten,
    //             kecamatan: region.kecamatan,
    //             desa: region.desa,
    //         },
    //         dataUmumLahan: {
    //             data_lahan_id: lahan.data_lahan_id,
    //             tutupan_lahan: lahan.tutupan_lahan,
    //             jenis_vegetasi: lahan.jenis_vegetasi,
    //             luasan_karhutla: lahan.luasan_karhutla,
    //             jenis_tanah: lahan.jenis_tanah,
    //             tinggi_muka_air_gambut: lahan.tinggi_muka_air_gambut,
    //             jenis_karhutla: lahan.jenis_karhutla,
    //             penggunaan_lahan: lahan.penggunaan_lahan,
    //             latitude: lahan.latitude,
    //             longitude: lahan.longitude,
    //             temperatur: lahan.temperatur,
    //             curah_hujan: lahan.curah_hujan,
    //             kelembaban_udara: lahan.kelembaban_udara,
    //             createdAt: lahan.createdAt,
    //             updatedAt: lahan.updatedAt,
    //             skor_lahan: averageSkorLahan,
    //             hasil_penilaian_lahan: getHasilFromSkor(averageSkorLahan),
    //         },
    //         observasi: observasiList,
    //     };
    // });

    return result;
};

const editLahanData = async (data_lahan_id, updatedData) => {
    // Step 1: Find the DataUmumLahan record
    const dataLahan = await DataUmumLahan.findByPk(data_lahan_id);

    if (!dataLahan) {
        throw new Error("Data lahan tidak ditemukan");
    }

    // Step 2: Update DataUmumLahan
    const updatedDataUmumLahan = await DataUmumLahan.update(updatedData, {
        where: { data_lahan_id },
    });

    return updatedDataUmumLahan;
};

const deleteLahanData = async (data_lahan_id) => {
    // Step 1: Find the DataUmumLahan record
    const dataLahan = await DataUmumLahan.findByPk(data_lahan_id);

    if (!dataLahan) {
        throw new Error("Data lahan tidak ditemukan");
    }

    // Step 2: Find all associated Observasi records
    const observasiRecords = await Observasi.findAll({
        where: { data_lahan_id },
        attributes: ["observation_id"],
    });

    // Step 3: Delete related Observasi and their associated data
    await Promise.all(
        observasiRecords.map(async (observasi) => {
            await deleteObservasiData(observasi.observation_id);
        })
    );

    // Step 4: Delete the DataUmumLahan record
    await DataUmumLahan.destroy({ where: { data_lahan_id } });
};

// masih belum tahu pathnya bakalan kek gimana
// const editKarhutlaData = async (lahanId, observasiId, updatedData) => {
//     // Step 1: Find the DataUmumLahan record
//     const dataLahan = await DataUmumLahan.findByPk(lahanId);

//     if (!dataLahan) {
//         throw new Error("Data lahan tidak ditemukan");
//     }

//     // Step 2: Find the Observasi record
//     const observasi = await Observasi.findOne({
//         where: { observation_id: observasiId, data_lahan_id: lahanId },
//     });

//     if (!observasi) {
//         throw new Error("Observasi tidak ditemukan");
//     }

//     // Step 3: Update DataUmumLahan (if applicable)
//     if (updatedData.dataUmumLahan) {
//         await DataUmumLahan.update(updatedData.dataUmumLahan, {
//             where: { data_lahan_id: lahanId },
//         });
//     }

//     // Step 4: Update Observasi (if applicable)
//     if (updatedData.observasi) {
//         await Observasi.update(updatedData.observasi, {
//             where: { observation_id: observasiId },
//         });
//     }

//     // Step 5: Update Plots (if applicable)
//     if (updatedData.plots) {
//         const plotUpdates = updatedData.plots.map(async (plot) => {
//             const existingPlot = await Plot.findOne({
//                 where: { plot_id: plot.plot_id, observation_id: observasiId },
//             });

//             if (!existingPlot) {
//                 throw new Error(`Plot dengan ID ${plot.plot_id} tidak ditemukan`);
//             }

//             // Update the plot
//             await Plot.update(
//                 {
//                     luasan_plot: plot.luasan_plot,
//                     polygon: plot.polygon,
//                     kondisi_vegetasi: plot.kondisi_vegetasi,
//                     kondisi_tanah: plot.kondisi_tanah,
//                     skor: plot.skor,
//                 },
//                 { where: { plot_id: plot.plot_id } }
//             );

//             // Update PenilaianObservasi for this plot
//             if (plot.penilaianList) {
//                 await PenilaianObservasi.destroy({ where: { plot_id: plot.plot_id } });

//                 // Re-create PenilaianObservasi
//                 await Promise.all(
//                     plot.penilaianList.map(async (penilaian) => {
//                         await PenilaianObservasi.create({
//                             plot_id: plot.plot_id,
//                             penilaian_id: penilaian.penilaian_id,
//                         });
//                     })
//                 );
//             }
//         });

//         await Promise.all(plotUpdates);
//     }
// };

const editObservasiData = async (observasiId, updatedData) => {
    // Step 1: Find the Observasi record
    const observasi = await Observasi.findByPk(observasiId);

    if (!observasi) {
        throw new Error("Observasi tidak ditemukan");
    }

    // Step 2: Update Observasi
    const updatedObservasi = await Observasi.update(updatedData, {
        where: { observation_id: observasiId },
    });

    return updatedObservasi;
};

const deleteObservasiData = async (observation_id) => {
    // Step 1: Find the Observasi record
    const observasi = await Observasi.findByPk(observation_id);

    if (!observasi) {
        throw new Error("Observasi tidak ditemukan");
    }

    // Step 2: Find all related Plot records
    const plotRecords = await Plot.findAll({
        where: { observation_id },
        attributes: ["plot_id"],
    });

    // Step 3: Delete related Plots and their associated data
    await Promise.all(
        plotRecords.map(async (plot) => {
            await deletePlotData(plot.plot_id);
        })
    );

    // Step 4: Delete the Observasi record
    await Observasi.destroy({ where: { observation_id } });
};

const editPlotData = async (plotId, polygon) => {
    // Step 1: Find the Plot record
    const plot = await Plot.findByPk(plotId);

    if (!plot) {
        throw new Error("Plot tidak ditemukan");
    }

    // Step 2: Convert coordinates for GeoJSON format
    const coordinates = polygon.coordinates[0].map((coord) => [coord[1], coord[0]]);
    const polygonGeoJSON = {
        type: "Polygon",
        coordinates: [coordinates],
    };

    // Step 3: Calculate area in hectares
    const area = turf.area(polygonGeoJSON);
    const luasan_plot = area / 10000; // Convert area to hectares

    // Step 4: Update the Plot record
    await plot.update({
        luasan_plot,
        polygon: polygonGeoJSON,
    });
};

const editPenilaianObservasiData = async (plotId, penilaianList) => {
    // Step 1: Update or create PenilaianObservasi records
    await Promise.all(
        penilaianList.map(async (penilaian) => {
            const { penilaian_observasi_id, penilaian_id } = penilaian;

            // Check if the PenilaianObservasi record exists
            const existingPenilaianObservasi = await PenilaianObservasi.findByPk(penilaian_observasi_id);

            console.log(existingPenilaianObservasi);
            console.log(penilaian_observasi_id, penilaian_id);

            if (existingPenilaianObservasi) {
                // If the record exists, update it
                await existingPenilaianObservasi.update({ penilaian_id });
            } else {
                // If it doesn't exist throw error
                throw new Error(`PenilaianObservasi dengan ID ${penilaian_observasi_id} tidak ditemukan`);
            }
        })
    );

    // Step 2: Recalculate the Plot score
    const updatedPlot = await calculateScore(plotId);

    // Step 3: Update the corresponding Observasi's skor_akhir
    if (updatedPlot) {
        const observasi = await Observasi.findByPk(updatedPlot.observation_id);

        if (observasi) {
            // Get all plots related to this Observasi
            const relatedPlots = await Plot.findAll({
                where: { observation_id: observasi.observation_id },
            });

            // Calculate the final skor_akhir for the Observasi
            const totalScore = relatedPlots.reduce((sum, plot) => sum + (plot.skor || 0), 0);
            const finalScore = relatedPlots.length ? totalScore / relatedPlots.length : 0;

            // Update the Observasi's skor_akhir
            observasi.skor_akhir = finalScore;
            await observasi.save();
        }
    }
};

const deletePlotData = async (plot_id) => {
    // Step 1: Find the Plot record
    const plot = await Plot.findByPk(plot_id);

    if (!plot) {
        throw new Error("Plot tidak ditemukan");
    }

    // Step 2: Find related PenilaianObservasi records
    const penilaianObservasiRecords = await PenilaianObservasi.findAll({
        where: { plot_id },
        attributes: ["penilaian_observasi_id"],
    });

    // Step 3: Delete related Dokumentasi files and PenilaianObservasi records
    await Promise.all(
        penilaianObservasiRecords.map(async (penilaianObservasi) => {
            const dokumentasiRecords = await Dokumentasi.findAll({
                where: { penilaian_observasi_id: penilaianObservasi.penilaian_observasi_id },
                attributes: ["dokumentasi_id"],
            });

            // Delete each Dokumentasi file from MinIO
            await Promise.all(
                dokumentasiRecords.map(async (dokumentasi) => {
                    await deleteDokumentasiData(dokumentasi.dokumentasi_id);
                })
            );

            // Delete the PenilaianObservasi record
            await PenilaianObservasi.destroy({
                where: { penilaian_observasi_id: penilaianObservasi.penilaian_observasi_id },
            });
        })
    );

    // Step 4: Delete the Plot record
    await Plot.destroy({ where: { plot_id } });
};

const convertToPDFData = async (lahanId, observasiId) => {
    const dataPDF = await getLahanDetailData({ observation_id: observasiId });
}

const createPenilaianData = async (data) => {
    const { variable, type, deskripsi, kategori, bobot, nilai } = data;

    const penilaian = await Penilaian.create({ variable, type, deskripsi, kategori, bobot, nilai });

    return penilaian;
}

const getAllPenilaianData = async () => {
    const penilaian = await Penilaian.findAll();

    return penilaian;
}

const mapHasilPenilaianToSkor = async (hasil_penilaian) => {
    const mapping = {
        "sangat ringan": { min: 0, max: 20 },
        ringan: { min: 21, max: 40 },
        sedang: { min: 41, max: 60 },
        berat: { min: 61, max: 80 },
        "sangat berat": { min: 81, max: 100 },
    };
    return mapping[hasil_penilaian.toLowerCase()] || null;
}

const getHasilFromSkor = (skor) => {
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

const calculateScore = async (plot_id) => {
    const penilaianObs = await PenilaianObservasi.findAll({
        where: { plot_id },
    });
    const penilaianIds = penilaianObs.map((po) => po.penilaian_id);

    // Sum bobot for "Kondisi Vegetasi"
    const vegetasiItems = await Penilaian.findAll({
        where: { penilaian_id: { [Op.in]: penilaianIds }, type: "Kondisi Vegetasi" },
    });
    const sumVegetasi = vegetasiItems.reduce((acc, item) => acc + (item.bobot || 0), 0);

    // Sum bobot for "Kondisi Tanah"
    const tanahItems = await Penilaian.findAll({
        where: { penilaian_id: { [Op.in]: penilaianIds }, type: "Kondisi Tanah" },
    });
    const sumTanah = tanahItems.reduce((acc, item) => acc + (item.bobot || 0), 0);

    // Final skor
    const newSkor = sumVegetasi + sumTanah;

    await Plot.update(
        {
            kondisi_vegetasi: sumVegetasi,
            kondisi_tanah: sumTanah,
            skor: newSkor,
        },
        { where: { plot_id } }
    );

    // Return updated plot
    return Plot.findByPk(plot_id);
}

module.exports = {
    createKarhutlaData,
    getAllKarhutlaData,
    editKarhutlaData,
    deleteKarhutlaData,
    uploadDokumentasiData,
    getImage,
    deleteDokumentasiData,
    getLahanDetailData,
    convertToPDFData,
    createPenilaianData,
    getAllPenilaianData
};