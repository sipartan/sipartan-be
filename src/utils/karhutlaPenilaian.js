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

module.exports = {
    mapHasilPenilaianToSkor,
    getHasilFromSkor,
};