const Observasi = require("../model/observasi");
const Plot = require("../model/plot");
const Penilaian = require("../model/penilaian");
const PenilaianObservasi = require("../model/penilaianObservasi");
const Hasil = require("../model/hasil");
const Dokumentasi = require("../model/dokumentasi");

const createObservation = async (req, res) => {
  try {
    const { data_lahan_id, tanggal_kejadian, tanggal_penilaian, skor } =
      req.body;

    const observasi = await Observasi.create({
      data_lahan_id: data_lahan_id,
      tanggal_kejadian: tanggal_kejadian,
      tanggal_penilaian: tanggal_penilaian,
      skor: skor,
    });

    res.status(200).json({ msg: "berhasil create observasi", observasi });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const createPlot = async (req, res) => {
  try {
    const { observation_id, luasan_plot } = req.body;

    const plot = await Plot.create({
      observation_id: observation_id,
      luasan_plot: luasan_plot,
    });

    res.status(200).json({ msg: "berhasil create plot", plot });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const createPenilaian = async (req, res) => {
  try {
    const { variable, type, bobot, nilai } = req.body;

    const penilaian = await Penilaian.create({
      variable: variable,
      type: type,
      bobot: bobot,
      nilai: nilai,
    });

    res.status(200).json({ msg: "berhasil create penilaian", penilaian });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const createPenilaianObservasi = async (req, res) => {
  try {
    const { plot_id, penilaian_id } = req.body;

    const penilaianObservasi = await PenilaianObservasi.create({
      plot_id: plot_id,
      penilaian_id: penilaian_id,
    });

    res
      .status(200)
      .json({ msg: "berhasil create penilaian observasi", penilaianObservasi });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const createHasil = async (req, res) => {
  try {
    const { plot_id, kondisi_vegetasi, kondisi_tanah, skor } = req.body;

    const hasil = await Hasil.create({
      plot_id: plot_id,
      kondisi_vegetasi: kondisi_vegetasi,
      kondisi_tanah: kondisi_tanah,
      skor: skor,
    });

    res.status(200).json({ msg: "berhasil create hasil", hasil });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const createDokumentasi = async (req, res) => {
  try {
    const { observation_id, type } = req.body;
    const nama = req.file;

    const dokumentasi = await Dokumentasi.create({
      observation_id: observation_id,
      nama: nama.originalname,
      type: type,
    });

    res.status(200).json({ msg: "berhasil create dokumentasi", dokumentasi });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  createObservation,
  createPlot,
  createPenilaian,
  createPenilaianObservasi,
  createHasil,
  createDokumentasi,
};
