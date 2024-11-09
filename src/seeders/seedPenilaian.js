const Penilaian = require('../model/penilaian'); 

const dataPenilaian = [
    {
        "variable": "Pohon mati",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kematian pohon",
        "bobot": 8,
        "nilai": 1
    },
    {
        "variable": "Pohon hidup",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kematian pohon",
        "bobot": 0,
        "nilai": 0
    },
    {
        "variable": "Batang bagian bawah dan bagian atas",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan batang bagian terbakar",
        "bobot": 2,
        "nilai": 2
    },
    {
        "variable": "Batang bagian bawah terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan batang bagian terbakar",
        "bobot": 1,
        "nilai": 1
    },
    {
        "variable": "Batang tidak terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan batang bagian terbakar",
        "bobot": 0,
        "nilai": 0
    },
    {
        "variable": "Hangus dan luka",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan batang jenis kerusakan",
        "bobot": 6,
        "nilai": 3
    },
    {
        "variable": "Hangus terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan batang jenis kerusakan",
        "bobot": 4,
        "nilai": 2
    },
    {
        "variable": "Luka",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan batang jenis kerusakan",
        "bobot": 2,
        "nilai": 1
    },
    {
        "variable": "Tidak hangus dan tidak luka",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan batang jenis kerusakan",
        "bobot": 0,
        "nilai": 0
    },
    {
        "variable": "75%-100% tajuk terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan batang kerusakan tajuk",
        "bobot": 6,
        "nilai": 3
    },
    {
        "variable": "50%-75% tajuk terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan batang kerusakan tajuk",
        "bobot": 4,
        "nilai": 2
    },
    {
        "variable": "25%-50% tajuk terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan batang kerusakan tajuk",
        "bobot": 2,
        "nilai": 1
    },
    {
        "variable": "<25% tajuk terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan batang kerusakan tajuk",
        "bobot": 0,
        "nilai": 0
    },
    {
        "variable": "Patah dan terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan cabang",
        "bobot": 6,
        "nilai": 3
    },
    {
        "variable": "Terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan cabang",
        "bobot": 4,
        "nilai": 2
    },
    {
        "variable": "Patah",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan cabang",
        "bobot": 2,
        "nilai": 1
    },
    {
        "variable": "Tidak patah dan tidak terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan cabang",
        "bobot": 0,
        "nilai": 0
    },
    {
        "variable": "75%- 100% dedaunan terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan dedaunan",
        "bobot": 9,
        "nilai": 3
    },
    {
        "variable": "50%-75% dedaunan terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan dedaunan",
        "bobot": 6,
        "nilai": 2
    },
    {
        "variable": "25%-50% dedaunan terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan dedaunan",
        "bobot": 3,
        "nilai": 1
    },
    {
        "variable": "<25% dedaunan terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan dedaunan",
        "bobot": 0,
        "nilai": 0
    },
    {
        "variable": "Terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan akar",
        "bobot": 6,
        "nilai": 2
    },
    {
        "variable": "Luka",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan akar",
        "bobot": 3,
        "nilai": 1
    },
    {
        "variable": "Tidak luka dan terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan akar",
        "bobot": 0,
        "nilai": 0
    },
    {
        "variable": "Mengalami luka dan terbakar",
        "type": "Kondisi Vegetasi",
        "deskripsi": null,
        "kategori": "Kerusakan akar",
        "bobot": 9,
        "nilai": 3
    },
    {
        "variable": "Rendah",
        "type": "Kondisi Vegetasi",
        "deskripsi": "Sekurang-kurangnya 50% pohon (diganti tumbuhan) tidak terlihat rusak, sisa tajuk hangus, pucuk terbakar tapi bertunas, dan akar mati. Lebih dari 80% pohon yang terbakar dapat bertahan hidup",
        "kategori": "Tingkat keparahan vegetasi terbakar",
        "bobot": 8,
        "nilai": 1
    },
    {
        "variable": "Sedang",
        "type": "Kondisi Vegetasi",
        "deskripsi": "20-50% pohon tidak terlihat rusak, 40-80% pohon yang terbakar dapat bertahan hidup",
        "kategori": "Tingkat keparahan vegetasi terbakar",
        "bobot": 16,
        "nilai": 2
    },
    {
        "variable": "Tinggi",
        "type": "Kondisi Vegetasi",
        "deskripsi": "Kurang dari 20% pohon tidak terlihat rusak dan akar mati. Kurang dari 40% pohon yang terbakar dapat bertahan",
        "kategori": "Tingkat keparahan vegetasi terbakar",
        "bobot": 24,
        "nilai": 3
    },
    {
        "variable": "Rendah",
        "type": "Kondisi Tanah",
        "deskripsi": "Bila lapisan gambut yang terbakar sampai ke dalaman kurang dari 25 cm",
        "kategori": "Tingkat keparahan kondisi tanah gambut",
        "bobot": 10,
        "nilai": 1
    },
    {
        "variable": "Sedang",
        "type": "Kondisi Tanah",
        "deskripsi": "Bila lapisan gambut yang terbakar sampai kedalaman 25-50 cm",
        "kategori": "Tingkat keparahan kondisi tanah gambut",
        "bobot": 20,
        "nilai": 2
    },
    {
        "variable": "Tinggi",
        "type": "Kondisi Tanah",
        "deskripsi": "Bila lapisan gambut yang terbakar sampai kedalaman lebih dari 50 cm",
        "kategori": "Tingkat keparahan kondisi tanah gambut",
        "bobot": 30,
        "nilai": 3
    },
    {
        "variable": "Sedang",
        "type": "Kondisi Tanah",
        "deskripsi": "Pengarangan bagian bawah sedang, serasah terbakar habis atau mengarang, dan lapisan duff mengarang atau terbakar habis, lapisan di bawahnya tidak terlihat berubah. Abu berwarna terang. Sampah berkayu terbakar, kecuali log yang mengarang. Abu berwarna putih dan kelabu, arang terjadi pada 1 cm lapisan atas dari tanah mineral, tetapi soil tidak berubah",
        "kategori": "Tingkat keparahan kondisi tanah mineral",
        "bobot": 20,
        "nilai": 2
    },
    {
        "variable": "Rendah",
        "type": "Kondisi Tanah",
        "deskripsi": "Serasah terbakar habis atau mengarang, tetapi lapisan duff tidak rusak, walaupun permukaannya hangus. Sebagian terakumulasi sisa/sampah berkayu atau terbakar hangus. Tanah mineral tidak berubah, permukaan tanah hitam, abu terjadi untuk waktu yang singkat.",
        "kategori": "Tingkat keparahan kondisi tanah mineral",
        "bobot": 10,
        "nilai": 1
    },
    {
        "variable": "Tinggi",
        "type": "Kondisi Tanah",
        "deskripsi": "Pengarangan bagian bawah dalam, lapisan duff terbakar habis, bagian atas mineral terlihat kemerahan atau oranye. Warna tanah di bawah 1 cm lebih gelap atau mengarang dari bahan organik. Lapisan arang dapat meluas hingga kedalaman 10 cm atau lebih. Log terbakar atau mengarang dalam yang juga terjadi pada tumpukan potongan limbah kayu. Tekstur tanah dilapisan permukaan berubah. Semua batang semak terbakar dan hanya batang yang besar mengarang yang terlihat.",
        "kategori": "Tingkat keparahan kondisi tanah mineral",
        "bobot": 30,
        "nilai": 3
    }
]

async function seedPenilaian() {
    try {
        const penilaianCount = await Penilaian.count();

        if (penilaianCount === 0) {
            console.log("Database appears to be newly created. Seeding penilaian data...");
            await Penilaian.bulkCreate(dataPenilaian);
            console.log("Penilaian data seeding completed.");
        } else {
            console.log("Database already exists and contains data penilaian.");
        }

        console.log("Seeding penilaian completed!");
    } catch (error) {
        console.error("Error seeding penilaian data:", error);
    }
}

module.exports = seedPenilaian;