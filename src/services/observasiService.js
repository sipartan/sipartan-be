const Observasi = require("../models/observasi");
const Plot = require("../models/plot");
const Penilaian = require("../models/penilaian");
const PenilaianObservasi = require("../models/penilaianObservasi");
const Hasil = require("../models/hasil");
const Dokumentasi = require("../models/dokumentasi");
const { Op } = require("sequelize");
require("dotenv").config();
const turf = require("@turf/turf");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client, bucketName } = require("../config/minioClient");

class ObservasiService {
  async createObservationData(
    data_lahan_id,
    tanggal_kejadian,
    tanggal_penilaian,
    skor_akhir
  ) {
    return await Observasi.create({
      data_lahan_id: data_lahan_id,
      tanggal_kejadian: tanggal_kejadian,
      tanggal_penilaian: tanggal_penilaian,
      skor_akhir: skor_akhir,
    });
  }

  async createPlotData(observation_id, dataPlot) {
    let result = [];
    for (let i = 0; i < dataPlot.length; i++) {
      const { penilaian_id } = dataPlot[i];

      const coordinates = dataPlot[i].coordinates.map(coord => [coord[1], coord[0]]);
      const polygonGeoJSON = {
        type: "Polygon",
        coordinates: [coordinates],
      };


      // Calculate the area using turf.js (area in square meters)
      const area = turf.area(polygonGeoJSON);
      console.log("Area in square meters: ", area);
      // Convert area to hectares (1 hectare = 10,000 square meters)
      const luasan_plot = area / 10000;
      console.log("Area in hectares: ", luasan_plot);

      const makePlot = await Plot.create({
        observation_id: observation_id,
        luasan_plot: luasan_plot,
        polygon: polygonGeoJSON,
      });

      const makePenilaianObservasi = await this.createPenilaianObservasiData(
        makePlot.plot_id,
        penilaian_id
      );

      const calculateResult = await this.calculateScore(makePlot.plot_id);

      result.push(calculateResult);
    }

    return result;
  }

  async createPenilaianData(
    variable,
    type,
    bobot,
    nilai,
    deskripsi,
    kategori
  ) {
    return await Penilaian.create({
      variable: variable,
      type: type,
      bobot: bobot,
      nilai: nilai,
      deskripsi: deskripsi,
      kategori: kategori,
    });
  };

  async createPenilaianObservasiData(plot_id, penilaian_id) {
    let result = [];
    for (let i = 0; i < penilaian_id.length; i++) {
      const penilaianObservasi = await PenilaianObservasi.create({
        plot_id: plot_id,
        penilaian_id: penilaian_id[i],
      });
      result.push(penilaianObservasi.penilaian_observasi_id);
    }

    return result;
  };

  async createHasilData(
    plot_id,
    kondisi_vegetasi,
    kondisi_tanah,
    skor
  ) {
    return await Hasil.create({
      plot_id: plot_id,
      kondisi_vegetasi: kondisi_vegetasi,
      kondisi_tanah: kondisi_tanah,
      skor: skor,
    });
  };

  async createDokumentasiData(plot_id, files, type) {
    for (let i = 0; i < files.length; i++) {
      await Dokumentasi.create({
        plot_id: plot_id,
        nama: files[i].key, // Store the object key
        type: type,
      });
    }
    return "Dokumentasi created successfully";
  }


  async getImageUrl(penilaian_observasi_id) {
    // Find all images for the given penilaian_observasi_id
    const images = await Dokumentasi.findAll({
      attributes: ["s3_key"],
      where: {
        penilaian_observasi_id: penilaian_observasi_id,
      },
    });

    // Generate signed URLs for each image
    const imageUrls = await Promise.all(
      images.map(async (image) => {
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: image.s3_key,
        });
        return await getSignedUrl(s3Client, command, { Expires: 60 * 60 }); // 1 hour expiration
      })
    );

    return imageUrls;
  }

  async calculateScore(plot_id) {
    const foundPenilaianPlot = await PenilaianObservasi.findAll({
      attributes: ["penilaian_id"],
      where: {
        plot_id: plot_id,
      },
    });
    const penilaianIds = foundPenilaianPlot.map(
      (result) => result.dataValues.penilaian_id
    );

    const foundNilaiVegetasi = await Penilaian.findAll({
      attributes: ["bobot"],
      where: {
        penilaian_id: {
          [Op.in]: penilaianIds,
        },
        type: "Kondisi Vegetasi",
      },
    });
    const nilaiVegetasi = foundNilaiVegetasi.map(
      (result) => result.dataValues.bobot
    );

    const foundNilaiTanah = await Penilaian.findAll({
      attributes: ["bobot"],
      where: {
        penilaian_id: {
          [Op.in]: penilaianIds,
        },
        type: "Kondisi Tanah",
      },
    });
    const nilaiTanah = foundNilaiTanah.map((result) => result.dataValues.bobot);

    let resultNilaiVegetasi = 0;
    for (let i = 0; i < nilaiVegetasi.length; i++) {
      resultNilaiVegetasi += nilaiVegetasi[i];
    }

    const makeHasil = await this.createHasilData(
      plot_id,
      resultNilaiVegetasi,
      nilaiTanah[0],
      resultNilaiVegetasi + nilaiTanah[0]
    );

    return makeHasil;
  };

  async createKarhutlaData(data) {
    const { data_lahan_id, tanggal_kejadian, tanggal_penilaian, dataPlot } = data;

    const makeObservation = await this.createObservationData(
      data_lahan_id,
      tanggal_kejadian,
      tanggal_penilaian
    );

    const makePlot = await this.createPlotData(makeObservation.observation_id, dataPlot);

    let finalScoreBeforeMean = 0;
    const scoreResult = makePlot.map((result) => result.dataValues.skor);
    for (let i = 0; i < scoreResult.length; i++) {
      finalScoreBeforeMean += scoreResult[i];
    }
    const finalScore = finalScoreBeforeMean / scoreResult.length;

    makeObservation.skor_akhir = finalScore;
    await makeObservation.save();

    const foundPlot = await Plot.findAll({
      attributes: ["plot_id", "luasan_plot"],
      where: {
        observation_id: makeObservation.observation_id,
      },
    });
    const plotIds = foundPlot.map((res) => res.dataValues.plot_id);

    const result = { ...makeObservation.dataValues, plotIds: plotIds };

    return result;
  }

  async getPenilaianData() {
    return await Penilaian.findAll();
  };

  async deletePenilaian(id) {
    const foundPenilaian = await Penilaian.findOne({
      where: {
        penilaian_id: id,
      },
    });
    if (!foundPenilaian) {
      throw new NotFound("penilaian tidak ditemukan");
    }

    const penilaianDeleted = await Penilaian.destroy({
      where: {
        penilaian_id: id,
      },
    });

    return penilaianDeleted;
  };
}

module.exports = ObservasiService;
