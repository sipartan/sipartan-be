const Observasi = require("../model/observasi");
const Plot = require("../model/plot");
const Penilaian = require("../model/penilaian");
const PenilaianObservasi = require("../model/penilaianObservasi");
const Hasil = require("../model/hasil");
const Dokumentasi = require("../model/dokumentasi");
const { Op } = require("sequelize");

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

  async createPlotData (observation_id, dataPlot) {
    let result = [];
    for (let i = 0; i < dataPlot.length; i++) {
      const { luasan_plot, penilaian_id } = dataPlot[i];
  
      const makePlot = await Plot.create({
        observation_id: observation_id,
        luasan_plot: luasan_plot,
      });
  
      const makePenilaianObservasi = await this.createPenilaianObservasiData(
        makePlot.plot_id,
        penilaian_id
      );
  
      const calculateResult = await this.calculateScore(makePlot.plot_id);
  
      result.push(calculateResult);
    }
  
    return result;
  };

  async createPenilaianData (
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

  async createPenilaianObservasiData (plot_id, penilaian_id) {
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

  async createHasilData (
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

  async createDokumentasiData (plot_id, nama, type) {
    return await Dokumentasi.create({
      plot_id: plot_id,
      nama: nama.originalname,
      type: type,
    });
  };

  async calculateScore (plot_id) {
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

  async createKarhutlaData (data) {
    const { data_lahan_id, tanggal_kejadian, tanggal_penilaian, dataPlot } = data;
  
    const makeObservation = await this.createObservationData(
      data_lahan_id,
      tanggal_kejadian,
      tanggal_penilaian
    );
  
    const makePlot = await this.createPlotData(
      makeObservation.observation_id,
      dataPlot
    );
  
    let finalScoreBeforeMean = 0;
    const scoreResult = makePlot.map((result) => result.dataValues.skor);
    for (let i = 0; i < scoreResult.length; i++) {
      finalScoreBeforeMean += scoreResult[i];
    }
    const finalScore = finalScoreBeforeMean / scoreResult.length;
  
    makeObservation.skor_akhir = finalScore;
    await makeObservation.save();
  
    return makeObservation; // ntr kalo mau ubah sabi
  };

  async getPenilaianData () {
    return await Penilaian.findAll();
  };
}

module.exports = ObservasiService;
