const Penilaian = require("../../model/penilaian");

const formatDate = (dateString) => {
  const date = new Date(dateString);

  const indonesianMonthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const day = date.getDate();
  const month =
    indonesianMonthNames[date.getMonth()];
  const year = date.getFullYear();

  const indonesianFormattedDate = `${day} ${month} ${year}`;

  return indonesianFormattedDate;
};

const findPenilaian = async (
  kategoriPenilaian,
  penilaianIds
) => {
  let penilaianVariabel = {};
  for (let i = 0; i < penilaianIds.length; i++) {
    const foundPenilaian =
      await Penilaian.findOne({
        attributes: ["variable", "deskripsi"],
        where: {
          kategori: kategoriPenilaian,
          penilaian_id: penilaianIds[i].penilaianIds,
        },
      });
    if (foundPenilaian) {
      penilaianVariabel.variable =
        foundPenilaian.dataValues.variable;
      penilaianVariabel.deskripsi =
        foundPenilaian.dataValues.deskripsi;
    }
  }

  if (
    kategoriPenilaian ==
      "Tingkat keparahan kondisi tanah mineral" ||
    kategoriPenilaian ==
      "Tingkat keparahan kondisi tanah gambut"
  ) {
    return penilaianVariabel;
  }

  return penilaianVariabel.variable;
};

const pdfContent = async (dataPDF) => {
//   console.log(dataPDF);
  return `
  <!DOCTYPE html>
  <html>
  
  <head>
      <meta charset="UTF-8" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/paper-css/0.3.0/paper.css">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet"
          integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
      <style>
          @page {
              size: A4
          }
  
          body {
              font-family: Arial, sans-serif;
          }
  
          .black-border {
              border: 1px solid black;
          }
      </style>
  </head>
  
  <!-- Set "A5", "A4" or "A3" for class name -->
  <!-- Set also "landscape" if you need -->
  
  <body class="A4">
  
      <!-- Each sheet element should have the class "sheet" -->
      <!-- "padding-**mm" is optional: you can set 10, 15, 20 or 25 -->
      <section class="sheet padding-15mm">
          <div class="container d-flex flex-column">
              <div class="text-center">
                  <div style="margin-bottom: 0.3rem;">KEMENTERIAN LINGKUNGAN HIDUP DAN KEHUTANAN</div>
                  <div style="margin-bottom: 0.3rem;">DIREKTORAT &lt;DIREKTORAT&gt;</div>
                  <div style="margin-bottom: 2rem;">WILAYAH &lt;WILAYAH&gt;</div>
                  <div style="margin-bottom: 2.5rem;">
                      <strong>
                          LAPORAN KEPARAHAN KEBAKARAN HUTAN DAN LAHAN
                      </strong>
                  </div>
              </div>
              <table class="table table-borderless table-sm mb-3">
                  <tbody>
                      <tr>
                          <td class="col-3">Nomor</td>
                          <td class="col-9">: &lt;Nomor Surat&gt;</td>
                      </tr>
                  </tbody>
              </table>
              <table class="table table-borderless table-sm mb-4">
                  <tbody>
                      <tr>
                          <td>Salam Hormat,</td>
                      </tr>
                      <tr>
                          <td class="col-3">Ketua Tim</td>
                          <td class="col-9">: ${dataPDF.nama_user}</td>
                      </tr>
                      <!-- <tr>
                          <td class="col-3">Daerah Operasi</td>
                          <td class="col-9">: &lt;Daerah Operasi&gt;</td>
                      </tr> -->
                  </tbody>
              </table>
              <table class="mb-5 black-border">
                  <tr class="text-center black-border">
                      <td colspan="2"><strong>Data Umum</strong></td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Tim Patroli</td>
                      <td class="col-7">: ${dataPDF.instansi_user}</td>
                  </tr>
                  <tr class="text-center black-border">
                      <td colspan="2"><strong>Lokasi</strong></td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Provinsi</td>
                      <td class="col-7">: ${
                        dataPDF.provinsi
                      }</td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Kabupaten</td>
                      <td class="col-7">: ${
                        dataPDF.kabupaten
                      }</td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Kecamatan</td>
                      <td class="col-7">: ${
                        dataPDF.kecamatan
                      }</td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Desa</td>
                      <td class="col-7">: ${
                        dataPDF.desa
                      }</td>
                  </tr>
                  <tr class="text-center black-border">
                      <td colspan="2"><strong>Waktu</strong></td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Tanggal Kejadian</td>
                      <td class="col-7">: ${formatDate(
                        dataPDF.tanggalKejadian
                      )}</td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Tanggal Penilaian</td>
                      <td class="col-7">: ${formatDate(
                        dataPDF.tanggalPenilaian
                      )}</td>
                  </tr>
                  <tr class="text-center black-border">
                      <td colspan="2"><strong>Kondisi Cuaca</strong></td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Temperatur (°C)</td>
                      <td class="col-7">: ${
                        dataPDF.temperatur
                      }</td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Kelembapan Udara (RH)</td>
                      <td class="col-7">: ${
                        dataPDF.kelembaban_udara
                      }</td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Curah Hujan (mm)</td>
                      <td class="col-7">: ${
                        dataPDF.cuaca_hujan
                      }</td>
                  </tr>
                  <tr class="text-center black-border">
                      <td colspan="2"><strong>Data Lahan</strong></td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Jenis Tanah</td>
                      <td class="col-7">: ${
                        dataPDF.jenis_tanah
                      }</td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Jenis Vegetasi</td>
                      <td class="col-7">: ${
                        dataPDF.jenis_vegetasi
                      }</td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Jenis Karhutla</td>
                      <td class="col-7">: ${
                        dataPDF.jenis_karhutla
                      }</td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Penggunaan Lahan</td>
                      <td class="col-7">: ${
                        dataPDF.penggunaan_lahan
                      }</td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Tutupan Lahan</td>
                      <td class="col-7">: ${
                        dataPDF.tutupan_lahan
                      }</td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Estimasi Luas Karhutla</td>
                      <td class="col-7">: ${
                        dataPDF.luasan_karhutla
                      }</td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Tinggi Muka Air Gambut</td>
                      <td class="col-7">: ${
                        dataPDF.tinggi_muka_air_gambut
                      }</td>
                  </tr>
                  <tr class="text-center black-border">
                      <td colspan="2"><strong>Hasil Penilaian Rata - Rata</strong></td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Skor</td>
                      <td class="col-7">: ${
                        dataPDF.skor
                      }</td>
                  </tr>
                  <tr>
                      <td class="col-5" style="padding-left: 10px;">Tingkat Keparahan</td>
                      <td class="col-7">: ${
                        dataPDF.hasil_penilaian
                      }</td>
                  </tr>
              </table>
          </div>
      </section>
      
      ${await Promise.all(
        dataPDF.single_plot.map(
          async (plot, index) => {
            const dataTanah =
              dataPDF.jenis_tanah == "Gambut"
                ? await findPenilaian(
                    "Tingkat keparahan kondisi tanah gambut",
                    plot.penilaianIdsSinglePlot
                  )
                : await findPenilaian(
                    "Tingkat keparahan kondisi tanah mineral",
                    plot.penilaianIdsSinglePlot
                  );
            return `
            <section class="sheet padding-15mm">
                <div class="container d-flex flex-column">
                    <div class="h6"><strong>Plot ${
                      index + 1
                    } :</strong></div>
                    <table class="mb-4 black-border">
                        <tr class="text-center black-border">
                            <td colspan="2"><strong>Luas Plot</strong></td>
                        </tr>
                        <tr>
                            <td class="col-6 pt-3 pb-3 ps-2">Luas Plot (m<sup>2</sup>)</td>
                            <td class="col-6 pt-3 pb-3">: ${
                              plot.luas_plot
                            }</td>
                        </tr>
                        <tr class="text-center black-border">
                            <td colspan="2"><strong>Kondisi Vegetasi</strong></td>
                        </tr>
                        <tr>
                            <td class="pt-3 ps-2">Kematian Pohon</td>
                            <td class="pt-3">: ${await findPenilaian(
                              "Kematian pohon",
                              plot.penilaianIdsSinglePlot
                            )}</td>
                        </tr>
                        <tr>
                            <td class="pt-3 ps-2">Kerusakan Batang</td>
                        </tr>
                        <tr>
                            <td class="pt-2 ps-4">- Bagian Terbakar</td>
                            <td class="pt-2">: ${await findPenilaian(
                              "Kerusakan batang bagian terbakar",
                              plot.penilaianIdsSinglePlot
                            )}</td>
                        </tr>
                        <tr>
                            <td class="pt-2 ps-4">- Jenis Kerusakan</td>
                            <td class="pt-2">: ${await findPenilaian(
                              "Kerusakan batang jenis kerusakan",
                              plot.penilaianIdsSinglePlot
                            )}</td>
                        </tr>
                        <tr>
                            <td class="pt-3 ps-2">Kerusakan Tajuk</td>
                            <td class="pt-3">: ${await findPenilaian(
                              "Kerusakan batang kerusakan tajuk",
                              plot.penilaianIdsSinglePlot
                            )}</td>
                        </tr>
                        <tr>
                            <td class="pt-3 ps-2">Kerusakan Cabang</td>
                            <td class="pt-3">: ${await findPenilaian(
                              "Kerusakan cabang",
                              plot.penilaianIdsSinglePlot
                            )}</td>
                        </tr>
                        <tr>
                            <td class="pt-3 ps-2">Kerusakan Dedaunan</td>
                            <td class="pt-3">: ${await findPenilaian(
                              "Kerusakan dedaunan",
                              plot.penilaianIdsSinglePlot
                            )}</td>
                        </tr>
                        <tr>
                            <td class="pt-3 ps-2">Kerusakan Akar</td>
                            <td class="pt-3">: ${await findPenilaian(
                              "Kerusakan akar",
                              plot.penilaianIdsSinglePlot
                            )}</td>
                        </tr>
                        <tr>
                            <td class="pt-3 pb-3 ps-2">Tingkat Keparahan Vegetasi Terbakar</td>
                            <td class="pt-3 pb-3">: ${await findPenilaian(
                              "Tingkat keparahan vegetasi terbakar",
                              plot.penilaianIdsSinglePlot
                            )}</td>
                        </tr>
                        <tr class="text-center black-border">
                            <td colspan="2"><strong>Kondisi Tanah</strong></td>
                        </tr>
                        <tr>
                            <td class="pt-3 ps-2">Tingkat Keparahan</td>
                        </tr>
                        ${
                          dataPDF.jenis_tanah ==
                          "Gambut"
                            ? `<tr>
                        <td class="pt-2 ps-4">- Kondisi Tanah Gambut</td>
                        <td class="pt-2">: ${dataTanah.variable}</td>
                        </tr>`
                            : `
                        <tr>
                            <td class="pt-2 ps-4">- Kondisi Tanah Mineral</td>
                            <td class="pt-2">: ${dataTanah.variable}</td>
                        </tr>`
                        }
                        
                        ${
                          dataPDF.jenis_tanah ==
                          "Gambut"
                            ? `<tr>
                            <td class="pt-2 pb-3 ps-4">- Keterangan</td>
                            <td class="pt-2 pb-3">: ${dataTanah.deskripsi}</td>
                        </tr>`
                            : `
                        <tr>
                            <td class="pt-2 pb-3 ps-4">- Keterangan</td>
                            <td class="pt-2 pb-3">: ${dataTanah.deskripsi}</td>
                        </tr>`
                        }
                        
                        <tr class="text-center black-border">
                            <td colspan="2"><strong>Hasil Penilaian Plot</strong></td>
                        </tr>
                        <tr>
                            <td class="pt-3 ps-2">Skor Plot</td>
                            <td class="pt-3">: ${
                              plot.skor_plot
                            }</td>
                        </tr>
                        <tr>
                            <td class="pt-3 pb-3 ps-2">Tingkat Keparahan</td>
                            <td class="pt-3 pb-3">: ${
                              plot.hasil_plot
                            }</td>
                        </tr>
                    </table>
                </div>
            </section>
        `;
          }
        )
      )}
      
  </body>
  
  </html>
    `;
};

module.exports = pdfContent;
