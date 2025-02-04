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
    const month = indonesianMonthNames[date.getMonth()];
    const year = date.getFullYear();
  
    const indonesianFormattedDate = `${day} ${month} ${year}`;
    return indonesianFormattedDate;
  };
  
  /**
   * Instead of querying the database, this function
   * will search the local penilaianList array from the new data structure.
   */
  const findPenilaian = async (kategoriPenilaian, penilaianList) => {
    let penilaianVariabel = {};
  
    for (let i = 0; i < penilaianList.length; i++) {
      const pen = penilaianList[i];
      if (pen.kategori === kategoriPenilaian) {
        penilaianVariabel.variable = pen.variable;
        penilaianVariabel.deskripsi = pen.deskripsi || "";
      }
    }
  
    // Special return for kondisi tanah
    if (
      kategoriPenilaian === "Tingkat keparahan kondisi tanah mineral" ||
      kategoriPenilaian === "Tingkat keparahan kondisi tanah gambut"
    ) {
      return penilaianVariabel;
    }
  
    // Otherwise return only the 'variable' text
    return penilaianVariabel.variable || "";
  };
  
  const pdfContent = async (data) => {
    /**
     * 1) Convert the new data structure into the old variable names 
     *    so can keep the same HTML placeholders.
     */
    const dataPDF = {};
  
    // User-related
    dataPDF.nama_user = data.user?.nama || "-";
    dataPDF.instansi_user = data.user?.instansi || "-";
  
    dataPDF.provinsi = data.lokasi_region?.provinsi || "-";
    dataPDF.kabupaten = data.lokasi_region?.kabupaten || "-";
    dataPDF.kecamatan = data.lokasi_region?.kecamatan || "-";
    dataPDF.desa = data.lokasi_region?.desa || "-";
  
    // Observasi-related
    dataPDF.tanggalKejadian = data.observasi?.tanggal_kejadian || null;
    dataPDF.tanggalPenilaian = data.observasi?.tanggal_penilaian || null;
    dataPDF.temperatur = data.observasi?.temperatur || "-";
    dataPDF.kelembapan_udara = data.observasi?.kelembapan_udara || "-";
    dataPDF.curah_hujan = data.observasi?.curah_hujan || "-";
    dataPDF.jenis_karhutla = data.observasi?.jenis_karhutla || "-";
    dataPDF.luasan_karhutla = data.observasi?.luasan_karhutla || "-";
    dataPDF.skor = data.observasi?.skor_akhir || "-";
    dataPDF.hasil_penilaian = data.observasi?.hasil_penilaian || "-";
  
    // Lahan-related
    dataPDF.jenis_tanah = data.lahan?.jenis_tanah || "-";
    dataPDF.jenis_vegetasi = data.lahan?.jenis_vegetasi || "-";
    dataPDF.penggunaan_lahan = data.lahan?.penggunaan_lahan || "-";
    dataPDF.tutupan_lahan = data.lahan?.tutupan_lahan || "-";
    dataPDF.tinggi_muka_air_gambut = data.lahan?.tinggi_muka_air_gambut || "-";
  
    dataPDF.single_plot = (data.observasi?.plots || []).map((plot) => {
      return {
        luas_plot: plot.luasan_plot,
        skor_plot: plot.skor_plot,
        hasil_plot: plot.hasil_plot,
        penilaianIdsSinglePlot: plot.penilaianList || [],
      };
    });
  
    /**
     * 2) Return the exact same HTML structure as before,
     *    but now it uses data from `dataPDF` adapted above.
     */
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
    
    <body class="A4">
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
                        <!--
                            We keep this as is, it's commented out in the original:
                            <tr>
                                <td class="col-3">Daerah Operasi</td>
                                <td class="col-9">: &lt;Daerah Operasi&gt;</td>
                            </tr>
                        -->
                    </tbody>
                </table>
                <table class="mb-5 black-border">
                    <tr class="text-center black-border">
                        <td colspan="2"><strong>Data Umum</strong></td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Tim Penilai</td>
                        <td class="col-7">: ${dataPDF.instansi_user}</td>
                    </tr>
                    <tr class="text-center black-border">
                        <td colspan="2"><strong>Lokasi</strong></td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Provinsi</td>
                        <td class="col-7">: ${dataPDF.provinsi}</td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Kabupaten</td>
                        <td class="col-7">: ${dataPDF.kabupaten}</td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Kecamatan</td>
                        <td class="col-7">: ${dataPDF.kecamatan}</td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Desa</td>
                        <td class="col-7">: ${dataPDF.desa}</td>
                    </tr>
                    <tr class="text-center black-border">
                        <td colspan="2"><strong>Waktu</strong></td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Tanggal Kejadian</td>
                        <td class="col-7">: ${
                          dataPDF.tanggalKejadian ? formatDate(dataPDF.tanggalKejadian) : "-"
                        }</td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Tanggal Penilaian</td>
                        <td class="col-7">: ${
                          dataPDF.tanggalPenilaian ? formatDate(dataPDF.tanggalPenilaian) : "-"
                        }</td>
                    </tr>
                    <tr class="text-center black-border">
                        <td colspan="2"><strong>Kondisi Cuaca</strong></td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Temperatur (°C)</td>
                        <td class="col-7">: ${dataPDF.temperatur}</td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Kelembapan Udara (RH)</td>
                        <td class="col-7">: ${dataPDF.kelembapan_udara}</td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Curah Hujan (mm)</td>
                        <td class="col-7">: ${dataPDF.curah_hujan}</td>
                    </tr>
                    <tr class="text-center black-border">
                        <td colspan="2"><strong>Data Lahan</strong></td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Jenis Tanah</td>
                        <td class="col-7">: ${dataPDF.jenis_tanah}</td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Jenis Vegetasi</td>
                        <td class="col-7">: ${dataPDF.jenis_vegetasi}</td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Jenis Karhutla</td>
                        <td class="col-7">: ${dataPDF.jenis_karhutla}</td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Penggunaan Lahan</td>
                        <td class="col-7">: ${dataPDF.penggunaan_lahan}</td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Tutupan Lahan</td>
                        <td class="col-7">: ${dataPDF.tutupan_lahan}</td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Estimasi Luas Karhutla</td>
                        <td class="col-7">: ${dataPDF.luasan_karhutla}</td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Tinggi Muka Air Gambut</td>
                        <td class="col-7">: ${dataPDF.tinggi_muka_air_gambut}</td>
                    </tr>
                    <tr class="text-center black-border">
                        <td colspan="2"><strong>Hasil Penilaian Rata - Rata</strong></td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Skor</td>
                        <td class="col-7">: ${dataPDF.skor}</td>
                    </tr>
                    <tr>
                        <td class="col-5" style="padding-left: 10px;">Tingkat Keparahan</td>
                        <td class="col-7">: ${dataPDF.hasil_penilaian}</td>
                    </tr>
                </table>
            </div>
        </section>
        
        ${await Promise.all(
          dataPDF.single_plot.map(async (plot, index) => {
            // Determine the correct tanah condition (gambut vs mineral)
            const dataTanah =
              dataPDF.jenis_tanah === "Gambut"
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
                      <div class="h6"><strong>Plot ${index + 1} :</strong></div>
                      <table class="mb-4 black-border">
                          <tr class="text-center black-border">
                              <td colspan="2"><strong>Luas Plot</strong></td>
                          </tr>
                          <tr>
                              <td class="col-6 pt-3 pb-3 ps-2">Luas Plot (m<sup>2</sup>)</td>
                              <td class="col-6 pt-3 pb-3">: ${plot.luas_plot ?? "-"}</td>
                          </tr>
                          <tr class="text-center black-border">
                              <td colspan="2"><strong>Kondisi Vegetasi</strong></td>
                          </tr>
                          <tr>
                              <td class="pt-3 ps-2">Kematian Pohon</td>
                              <td class="pt-3">: ${
                                await findPenilaian(
                                  "Kematian pohon",
                                  plot.penilaianIdsSinglePlot
                                )
                              }</td>
                          </tr>
                          <tr>
                              <td class="pt-3 ps-2">Kerusakan Batang</td>
                          </tr>
                          <tr>
                              <td class="pt-2 ps-4">- Bagian Terbakar</td>
                              <td class="pt-2">: ${
                                await findPenilaian(
                                  "Kerusakan batang bagian terbakar",
                                  plot.penilaianIdsSinglePlot
                                )
                              }</td>
                          </tr>
                          <tr>
                              <td class="pt-2 ps-4">- Jenis Kerusakan</td>
                              <td class="pt-2">: ${
                                await findPenilaian(
                                  "Kerusakan batang jenis kerusakan",
                                  plot.penilaianIdsSinglePlot
                                )
                              }</td>
                          </tr>
                          <tr>
                              <td class="pt-3 ps-2">Kerusakan Tajuk</td>
                              <td class="pt-3">: ${
                                await findPenilaian(
                                  "Kerusakan batang kerusakan tajuk",
                                  plot.penilaianIdsSinglePlot
                                )
                              }</td>
                          </tr>
                          <tr>
                              <td class="pt-3 ps-2">Kerusakan Cabang</td>
                              <td class="pt-3">: ${
                                await findPenilaian(
                                  "Kerusakan cabang",
                                  plot.penilaianIdsSinglePlot
                                )
                              }</td>
                          </tr>
                          <tr>
                              <td class="pt-3 ps-2">Kerusakan Dedaunan</td>
                              <td class="pt-3">: ${
                                await findPenilaian(
                                  "Kerusakan dedaunan",
                                  plot.penilaianIdsSinglePlot
                                )
                              }</td>
                          </tr>
                          <tr>
                              <td class="pt-3 ps-2">Kerusakan Akar</td>
                              <td class="pt-3">: ${
                                await findPenilaian(
                                  "Kerusakan akar",
                                  plot.penilaianIdsSinglePlot
                                )
                              }</td>
                          </tr>
                          <tr>
                              <td class="pt-3 pb-3 ps-2">Tingkat Keparahan Vegetasi Terbakar</td>
                              <td class="pt-3 pb-3">: ${
                                await findPenilaian(
                                  "Tingkat keparahan vegetasi terbakar",
                                  plot.penilaianIdsSinglePlot
                                )
                              }</td>
                          </tr>
                          <tr class="text-center black-border">
                              <td colspan="2"><strong>Kondisi Tanah</strong></td>
                          </tr>
                          <tr>
                              <td class="pt-3 ps-2">Tingkat Keparahan</td>
                          </tr>
                          ${
                            dataPDF.jenis_tanah === "Gambut"
                              ? `
                          <tr>
                            <td class="pt-2 ps-4">- Kondisi Tanah Gambut</td>
                            <td class="pt-2">: ${dataTanah.variable || "-"}</td>
                          </tr>`
                              : `
                          <tr>
                            <td class="pt-2 ps-4">- Kondisi Tanah Mineral</td>
                            <td class="pt-2">: ${dataTanah.variable || "-"}</td>
                          </tr>`
                          }
                          
                          ${
                            dataPDF.jenis_tanah === "Gambut"
                              ? `
                          <tr>
                            <td class="pt-2 pb-3 ps-4">- Keterangan</td>
                            <td class="pt-2 pb-3">: ${dataTanah.deskripsi || "-"}</td>
                          </tr>`
                              : `
                          <tr>
                            <td class="pt-2 pb-3 ps-4">- Keterangan</td>
                            <td class="pt-2 pb-3">: ${dataTanah.deskripsi || "-"}</td>
                          </tr>`
                          }
                          
                          <tr class="text-center black-border">
                              <td colspan="2"><strong>Hasil Penilaian Plot</strong></td>
                          </tr>
                          <tr>
                              <td class="pt-3 ps-2">Skor Plot</td>
                              <td class="pt-3">: ${plot.skor_plot ?? "-"}</td>
                          </tr>
                          <tr>
                              <td class="pt-3 pb-3 ps-2">Tingkat Keparahan</td>
                              <td class="pt-3 pb-3">: ${plot.hasil_plot ?? "-"}</td>
                          </tr>
                      </table>
                  </div>
              </section>
            `;
          })
        )}
    </body>
    
    </html>
    `;
  };
  
  module.exports = pdfContent;
  