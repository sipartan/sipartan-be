const {
  createObservationData,
  createPlotData,
  createPenilaianData,
  createPenilaianObservasiData,
  createHasilData,
  createDokumentasiData,
  createKarhutlaData,
  getPenilaianData,
} = require("../service/observasiService");

const createObservation = async (req, res) => {
  try {
    const { data_lahan_id, tanggal_kejadian, tanggal_penilaian, skor_akhir } =
      req.body;

    const observasi = await createObservationData(
      data_lahan_id,
      tanggal_kejadian,
      tanggal_penilaian,
      skor_akhir
    );

    res.status(200).json({ msg: "berhasil create observasi", observasi });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const createPlot = async (req, res) => {
  try {
    const { observation_id, luasan_plot } = req.body;

    const plot = await createPlotData(observation_id, luasan_plot);

    res.status(200).json({ msg: "berhasil create plot", plot });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const createPenilaian = async (req, res) => {
  try {
    const { variable, type, bobot, nilai } = req.body;

    const penilaian = await createPenilaianData(variable, type, bobot, nilai);

    res.status(200).json({ msg: "berhasil create penilaian", penilaian });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const createPenilaianObservasi = async (req, res) => {
  try {
    const { plot_id, penilaian_id } = req.body;

    const penilaianObservasi = await createPenilaianObservasiData(
      plot_id,
      penilaian_id
    );

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

    const hasil = await createHasilData({
      plot_id,
      kondisi_vegetasi,
      kondisi_tanah,
      skor,
    });

    res.status(200).json({ msg: "berhasil create hasil", hasil });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const createDokumentasi = async (req, res) => {
  try {
    const { plot_id, type } = req.body;
    const nama = req.file;

    const dokumentasi = await createDokumentasiData(plot_id, nama, type);

    res.status(200).json({ msg: "berhasil create dokumentasi", dokumentasi });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const createKarhutla = async (req, res) => {
  try {
    const { data } = req.body;
    // console.log(data)

    const result = await createKarhutlaData(data);

    res.status(200).json({ msg: "berhasil create hasil", result });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getPenilaian = async (req, res) => {
  try {
    const result = await getPenilaianData()

    res.status(200).json({ msg: "berhasil get penilaian", result });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
}

module.exports = {
  createObservation,
  createPlot,
  createPenilaian,
  createPenilaianObservasi,
  createHasil,
  createDokumentasi,
  createKarhutla,
  getPenilaian,
};
