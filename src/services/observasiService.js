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

class ObservasiService {
  /**
   * Creates a new Penilaian record (like a "variable" definition).
   */
  async createPenilaianData(variable, type, bobot, nilai, deskripsi, kategori) {
    return Penilaian.create({
      variable,
      type,
      bobot,
      nilai,
      deskripsi,
      kategori,
    });
  }

  /**
   * Uploads dokumentasi (images) to S3 + database reference.
   * Called by the controller after Busboy parsing.
   */
  async uploadDokumentasi(files, fields) {
    // 1. Wait for all uploadPromises
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

    // 2. Check for failures
    const failed = uploadResults.filter((r) => !r.success);
    if (failed.length > 0) {
      throw new Error("Some files failed to upload");
    }

    // 3. Save successful uploads to Dokumentasi and generate URLs
    const imageUrls = [];
    for (const { s3Key } of uploadResults) {
      const doc = await Dokumentasi.create({
        penilaian_observasi_id: fields.penilaian_observasi_id,
        s3_key: s3Key,
        tipe: fields.tipe,
        kategori: fields.kategori,
      });

      // Generate the image URL
      const imageUrl = `${config.env.baseUrl}/observasi/dokumentasi/${doc.dokumentasi_id}`;
      imageUrls.push(imageUrl);
    }

    // 4. Return the array of image URLs
    return {
      imageUrls,
    };
  }


  async deleteDokumentasi(dokumentasi_id) {
    const dokumentasi = await Dokumentasi.findOne({
      where: { dokumentasi_id },
    });

    if (!dokumentasi) {
      throw new Error("Dokumentasi tidak ditemukan");
    }

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: dokumentasi.s3_key,
    });
    await s3Client.send(command);

    // Delete from database
    await Dokumentasi.destroy({ where: { dokumentasi_id } });
  }

  /**
   * Creates a new Karhutla data (observation + multiple plots).
   */
  async createKarhutlaData(data) {
    const { data_lahan_id, tanggal_kejadian, tanggal_penilaian, dataPlot } = data;

    // 1. Create the observation
    const makeObservation = await this.createObservationData(
      data_lahan_id,
      tanggal_kejadian,
      tanggal_penilaian,
      0 // skor_akhir will be updated after plots
    );

    // 2. Create all plots for this observation
    const plots = await this.createPlotData(makeObservation.observation_id, dataPlot);

    // 3. Compute overall skor_akhir as the average of plot scores
    let totalScore = 0;
    for (const plot of plots) {
      totalScore += plot.skor;
    }
    const finalScore = plots.length ? totalScore / plots.length : 0;

    makeObservation.skor_akhir = finalScore;
    await makeObservation.save();

    const foundPlotIds = plots.map((p) => p.plot_id);
    return {
      observation_id: makeObservation.observation_id,
      data_lahan_id: makeObservation.data_lahan_id,
      finalScore,
      plotIds: foundPlotIds,
    };
  }

  /**
   * Retrieves all Penilaian records.
   */
  async getPenilaianData() {
    return Penilaian.findAll();
  }

  async getDokumentasiId(penilaian_observasi_id) {
    const dokumentasi = await Dokumentasi.findAll({
      attributes: ["dokumentasi_id"],
      where: { penilaian_observasi_id: penilaian_observasi_id },
    });

    return dokumentasi;
  }

  async getSignedFileStream(dokumentasi_id) {
    try {

      const dokumentasi = await Dokumentasi.findOne({
        where: { dokumentasi_id },
      });

      if (!dokumentasi) {
        throw new Error("Dokumentasi tidak ditemukan");
      }

      const s3Key = dokumentasi.s3_key;

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key, 
      });

      // Get the file stream
      const { Body } = await s3Client.send(command);

      if (!Body) {
        throw new Error("File not found");
      }

      return Body; // Return the file stream
    } catch (error) {
      console.error("Error fetching file from MinIO:", error);
      throw new Error("Unable to fetch file from storage");
    }
  }

  /**
   * Deletes a Penilaian by ID.
   */
  async deletePenilaian(penilaianId) {
    const foundPenilaian = await Penilaian.findOne({
      where: { penilaian_id: penilaianId },
    });
    if (!foundPenilaian) {
      throw new Error("Penilaian tidak ditemukan");
    }
    await foundPenilaian.destroy();
  }

  /********************************************************
   * Logic for Observasi & Plots
   ********************************************************/

  /**
   * Creates an Observasi record.
   */
  async createObservationData(data_lahan_id, tanggal_kejadian, tanggal_penilaian, skor_akhir) {
    return Observasi.create({
      data_lahan_id,
      tanggal_kejadian,
      tanggal_penilaian,
      skor_akhir,
    });
  }

  /**
   * Creates multiple plots from dataPlot array, linking penilaianObservasi.
   */
  async createPlotData(observation_id, dataPlot) {
    if (!Array.isArray(dataPlot)) {
      throw new Error("dataPlot must be an array");
    }

    const plots = [];
    for (const item of dataPlot) {
      const updatedPlot = await this._createSinglePlot(observation_id, item);
      plots.push(updatedPlot);
    }
    return plots;
  }

  /**
   * Helper to create a single plot and recalc score.
   */
  async _createSinglePlot(observation_id, plotData) {
    // Convert [lat, lon] => [lon, lat]
    const coordinates = plotData.coordinates.map((coord) => [coord[1], coord[0]]);
    const polygonGeoJSON = {
      type: "Polygon",
      coordinates: [coordinates],
    };

    const area = turf.area(polygonGeoJSON);
    const luasan_plot = area / 10000; // convert sqm to hectares

    const newPlot = await Plot.create({
      observation_id,
      luasan_plot,
      polygon: polygonGeoJSON,
    });

    if (Array.isArray(plotData.penilaian_id)) {
      await this.createPenilaianObservasiData(newPlot.plot_id, plotData.penilaian_id);
    }

    const updatedPlot = await this.calculateScore(newPlot.plot_id);
    return updatedPlot;
  }

  /**
   * Creates penilaianObservasi records linking a single plot to multiple penilaian.
   */
  async createPenilaianObservasiData(plot_id, penilaian_ids) {
    const result = [];
    for (const penId of penilaian_ids) {
      const record = await PenilaianObservasi.create({
        plot_id,
        penilaian_id: penId,
      });
      result.push(record.penilaian_observasi_id);
    }
    return result;
  }

  /**
   * Recomputes the plot score based on penilaianObservasi + penilaian bobots.
   */
  async calculateScore(plot_id) {
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
}

module.exports = ObservasiService;
