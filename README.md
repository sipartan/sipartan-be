## SIPARTAN

Base URL :

> https://sipartan.et.r.appspot.com

- [Create User](#create-user)
- [Login](#login)
- [Get User](#get-user)
- [Create Penilaian](#create-penilaian)
- [Create Lahan Karhutla](#create-lahan-karhutla)
- [Create Karhutla](#create-karhutla)
- [Get Penilaian](#get-penilaian)
- [Get Single Result](#get-single-result)
- [Get Result](#get-result)
- [Delete Karhutla](#delete-karhutla)
- [Edit Karhutla](#edit-karhutla)
- [Download PDF Karhutla](#downloadPDF-karhutla)

## `Create User`

### POST /user

### https://sipartan.et.r.appspot.com/user

### Request body

| Fieldname | Type     | Necessity    | Desc |
| --------- | -------- | ------------ | ---- |
| nama      | `string` | **required** |      |
| instansi  | `string` | **required** |      |
| email     | `string` | **required** |      |
| username  | `string` | **required** |      |
| password  | `string` | **required** |      |

### Sample success response

```json
{
  "msg": "Register User Berhasil",
  "userCreated": {
    "user_id": "f240769f-0e6a-4128-afbc-289dca419b49",
    "nama": "rozan",
    "instansi": "IPB",
    "email": "rozan@gmail.com",
    "username": "rozan123",
    "password": "$2b$10$yB6.8eQq4zRpvxEzD2SnvOvLS9gcWPP4mgbjHWceFqWBV45.wZqAu",
    "updatedAt": "2023-10-29T17:45:17.916Z",
    "createdAt": "2023-10-29T17:45:17.916Z"
  }
}
```

## `Login`

### POST /user/login

### https://sipartan.et.r.appspot.com/user/login

### Request body

| Fieldname | Type     | Necessity    | Desc |
| --------- | -------- | ------------ | ---- |
| email     | `string` | **required** |      |
| password  | `string` | **required** |      |

### Sample success response

```json
{
  "msg": "Berhasil login",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJvemFuQGdtYWlsLmNvbSIsImlkIjoiZTU2Zjg1MWMtOWYzOC00NzA2LTgyYWEtZjVhYWJiOTY4NDJlIiwibmFtYSI6InJvemFuIiwiaWF0IjoxNjk4NjAxNjYxfQ.ugqHTVri_jan3ZXY4vdaI2SS1s6wPoAP-2-XZcc_lw0"
}
```

## `Get User`

### GET /user

### https://sipartan.et.r.appspot.com/user

### Sample success response

```json
{
  "msg": "Berhasil Get User",
  "foundUser": [
    {
      "user_id": "4048f2cf-23d2-4ed9-9588-126606a90013",
      "nama": "rozan",
      "instansi": "IPB",
      "email": "rozan@gmail.com",
      "username": "rozan123"
    }
  ]
}
```

## `Create Penilaian`

### POST /observasi/penilaian

### https://sipartan.et.r.appspot.com/observasi/penilaian

### Request body

| Fieldname | Type      | Necessity    | Desc |
| --------- | --------- | ------------ | ---- |
| variable  | `string`  | **required** |      |
| type      | `string`  | **required** |      |
| bobot     | `float`   | **required** |      |
| nilai     | `integer` | **required** |      |
| deskripsi | `string`  | **optional** |      |
| kategori  | `string`  | **required** |      |

### Sample success response

```json
{
  "msg": "berhasil create penilaian",
  "penilaian": {
    "penilaian_id": "c08d6930-61fb-4c6d-b9df-cda4a0729594",
    "variable": "Akar Luka dan Terbakar",
    "type": "Kondisi Tanah",
    "bobot": 9,
    "nilai": 3,
    "updatedAt": "2023-10-29T16:25:09.303Z",
    "createdAt": "2023-10-29T16:25:09.303Z"
  }
}
```

## `Create Lahan Karhutla`

### POST /lahan-karhutla

### https://sipartan.et.r.appspot.com/lahan-karhutla

### Request body

| Fieldname              | Type     | Necessity    | Desc |
| ---------------------- | -------- | ------------ | ---- |
| provinsi               | `string` | **required** |      |
| kabupaten              | `string` | **required** |      |
| kecamatan              | `string` | **required** |      |
| desa                   | `string` | **required** |      |
| tutupan_lahan          | `string` | **required** |      |
| jenis_vegetasi         | `string` | **required** |      |
| luasan_karhutla        | `float`  | **required** |      |
| jenis_tanah            | `string` | **required** |      |
| tinggi_muka_air_gambut | `float`  | **opsional** |      |
| jenis_karhutla         | `string` | **required** |      |
| penggunaan_lahan       | `string` | **required** |      |
| latitude               | `float`  | **required** |      |
| longitude              | `float`  | **required** |      |
| temperatur             | `float`  | **required** |      |
| curah_hujan            | `float`  | **required** |      |
| kelembapan_udara       | `float`  | **required** |      |

### Sample success response

```json
{
  "msg": "berhasil create data lahan Karhutla",
  "dataKarhutla": {
    "data_lahan_id": "b1d953fe-c50d-407c-8481-d7410ea21db2",
    "user_id": "e56f851c-9f38-4706-82aa-f5aabb96842e",
    "region_location_id": "b9cca140-1a6c-47cc-a94d-67504c733d45",
    "tutupan_lahan": "Hutan",
    "jenis_vegetasi": "pohon",
    "luasan_karhutla": 17.2,
    "jenis_tanah": "Gambut",
    "tinggi_muka_air_gambut": 3.9,
    "jenis_karhutla": "Sedang",
    "penggunaan_lahan": "sumber daya kayu",
    "updatedAt": "2023-10-29T16:06:24.225Z",
    "createdAt": "2023-10-29T16:06:24.225Z"
  }
}
```

## `Create Karhutla`

### POST /observasi

### https://sipartan.et.r.appspot.com/observasi

### Request body

| Fieldname               | Type           | Necessity    | Desc                                                     |
| ----------------------- | -------------- | ------------ | -------------------------------------------------------- |
| data_lahan_id           | `string`       | **required** |                                                          |
| tanggal_kejadian        | `date`         | **required** |                                                          |
| tanggal_penilaian       | `date`         | **required** |                                                          |
| dataPlot                | `array object` | **required** |                                                          |
| dataPlot[].luasan_plot  | `float`        | **required** |                                                          |
| dataPlot[].penilaian_id | `array`        | **required** | beberapa id dari penilaian yang dipilih ke plot tersebut |

### Sample success response

```json
{
  "msg": "berhasil create hasil",
  "result": {
    "observation_id": "5fe3d015-902c-478b-ba3d-01885867a828",
    "data_lahan_id": "b1d953fe-c50d-407c-8481-d7410ea21db2",
    "tanggal_kejadian": "2023-10-04T03:00:00.000Z",
    "tanggal_penilaian": "2023-10-05T03:00:00.000Z",
    "skor_akhir": 58,
    "updatedAt": "2023-10-29T16:54:15.049Z",
    "createdAt": "2023-10-29T16:54:14.899Z"
  }
}
```

## `Get Penilaian`

### GET /observasi/penilaian

### https://sipartan.et.r.appspot.com/observasi/penilaian

### Sample success response

```json
{
  "msg": "berhasil get penilaian",
  "result": [
    {
      "penilaian_id": "e67a075f-68e1-4aa6-a49c-633209680174",
      "variable": "Pohon Mati",
      "type": "Kondisi Vegetasi",
      "bobot": 8,
      "nilai": 1,
      "createdAt": "2023-10-29T16:11:12.994Z",
      "updatedAt": "2023-10-29T16:11:12.994Z"
    },
    {
      "penilaian_id": "c130b351-fde6-4310-8690-054f6fb7d851",
      "variable": "Pohon Hidup",
      "type": "Kondisi Vegetasi",
      "bobot": 0,
      "nilai": 0,
      "createdAt": "2023-10-29T16:11:37.889Z",
      "updatedAt": "2023-10-29T16:11:37.889Z"
    }
    //.....
  ]
}
```

## `Get Single Result`

### GET /lahan-karhutla/:id/:obsId

### https://sipartan.et.r.appspot.com/lahan-karhutla/:id/:obsId

### Sample success response

```json
{
  "msg": "berhasil get single result",
  "result": {
    "tutupan_lahan": "Hutan",
    "luasan_karhutla": 17.2,
    "jenis_karhutla": "Sedang",
    "provinsi": "Jawa Tengah",
    "kabupaten": "Pati",
    "kecamatan": "Trangkil",
    "desa": "Kertomulyo",
    "latitude": "-6.671529037509255",
    "longitude": "111.00579212756656",
    "temperatur": 7.5,
    "curah_hujan": 3.4,
    "kelembapan_udara": 2.9,
    "tanggalKejadian": "2023-10-04T03:00:00.000Z",
    "tanggalPenilaian": "2023-10-05T03:00:00.000Z",
    "single_plot": [
      {
        "luas_plot": 12.5,
        "skor_plot": 58
      },
      {
        "luas_plot": 15.9,
        "skor_plot": 58
      }
    ],
    "skor": 58,
    "hasil_penilaian": "Sedang"
  }
}
```

## `Get Result`

### GET /lahan-karhutla

### https://sipartan.et.r.appspot.com/lahan-karhutla

### Query

| Fieldname | Type     | Necessity    | Desc |
| --------- | -------- | ------------ | ---- |
| userId    | `string` | **optional** |      |

### Sample success response

```json
{
  "msg": "berhasil get results",
  "result": [
    {
      "tutupan_lahan": "Hutan",
      "luasan_karhutla": 17.2,
      "jenis_karhutla": "Sedang",
      "provinsi": "Jawa Tengah",
      "kabupaten": "Pati",
      "kecamatan": "Tlogowungu",
      "desa": "Sumbermulyo",
      "latitude": "-6.671529037509255",
      "longitude": "111.00579212756656",
      "temperatur": 7.5,
      "curah_hujan": 3.4,
      "kelembapan_udara": 2.9,
      "skor": 58,
      "hasil_penilaian": "Sedang"
    },
    {
      "tutupan_lahan": "Hutan",
      "luasan_karhutla": 17.2,
      "jenis_karhutla": "Sedang",
      "provinsi": "Jawa Tengah",
      "kabupaten": "Pati",
      "kecamatan": "Trangkil",
      "desa": "Kertomulyo",
      "latitude": "-6.671529037509255",
      "longitude": "111.00579212756656",
      "temperatur": 7.5,
      "curah_hujan": 3.4,
      "kelembapan_udara": 2.9,
      "skor": 58,
      "hasil_penilaian": "Sedang"
    }
  ]
}
```

## `Delete Karhutla`

### DELETE /lahan-karhutla/:id

### https://sipartan.et.r.appspot.com/lahan-karhutla/:id

### Sample success response

```json
{
  "msg": "berhasil delete karhutla",
  "result": 1
}
```

## `Edit Karhutla`

### PUT /lahan-karhutla/:id/:obsId

### https://sipartan.et.r.appspot.com/lahan-karhutla/:id/:obsId

### Request body

| Fieldname                                | Type     | Necessity    | Desc                                                                            |
| ---------------------------------------- | -------- | ------------ | ------------------------------------------------------------------------------- |
| provinsi                                 | `string` | **opsional** |                                                                                 |
| kabupaten                                | `string` | **opsional** |                                                                                 |
| kecamatan                                | `string` | **opsional** |                                                                                 |
| desa                                     | `string` | **opsional** |                                                                                 |
| tutupan_lahan                            | `string` | **opsional** |                                                                                 |
| jenis_vegetasi                           | `string` | **opsional** |                                                                                 |
| luasan_karhutla                          | `float`  | **opsional** |                                                                                 |
| jenis_tanah                              | `string` | **opsional** |                                                                                 |
| tinggi_muka_air_gambut                   | `float`  | **opsional** |                                                                                 |
| jenis_karhutla                           | `string` | **opsional** |                                                                                 |
| penggunaan_lahan                         | `string` | **opsional** |                                                                                 |
| latitude                                 | `string` | **opsional** |                                                                                 |
| longitude                                | `string` | **opsional** |                                                                                 |
| temperatur                               | `float`  | **opsional** |                                                                                 |
| curah_hujan                              | `float`  | **opsional** |                                                                                 |
| kelembapan_udara                         | `float`  | **opsional** |                                                                                 |
| tanggal_kejadian                         | `date`   | **opsional** |                                                                                 |
| tanggal_penilaian                        | `date`   | **opsional** |                                                                                 |
| luas_plot                                | `array`  | **opsional** |                                                                                 |
| luas_plot[].value                        | `float`  | **opsional** |                                                                                 |
| luas_plot[].plot_id                      | `string` | **opsional** |                                                                                 |
| data_indikator                           | `array`  | **opsional** | berisi nilai-nilai yang ingin diubah                                            |
| data_indikator[].penilaianObservation_id | `string` | **opsional** | Penilaian Observation id yang ada di setiap nilai (yang ada pada single result) |
| data_indikator[].penilaian_id            | `string` | **opsional** | tujuan penilaian id setelah berubah                                             |

### Sample success response

```json
{
  "msg": "berhasil edit karhutla",
  "result": [1]
}
```

## `DownloadPDF Karhutla`

### GET /lahan-karhutla/downloadPDF/:id/:obsId

### https://sipartan.et.r.appspot.com/lahan-karhutla/downloadPDF/:id/:obsId

### Sample success response

```json
{
  "msg": "berhasil downloadPDF karhutla",
  "result": 1
}
```

## `Create Dokumentasi`

### POST /observasi/dokumentasi

### https://sipartan.et.r.appspot.com/observasi/dokumentasi

### Request body

| Fieldname | Type     | Necessity    | Desc                                                                         |
| --------- | -------- | ------------ | ---------------------------------------------------------------------------- |
| plot_id   | `string` | **required** | plot_id dari dokumentasi2 nya                                                |
| type      | `string` | **required** | dokumentasi dari penilaian apa. misal: kematian pohon, kerusakan cabang, dll |
| file      | `file`   | **required** | file nya maksimal 3                                                          |

### Sample success response

```json
{
  "msg": "berhasil create dokumentasi",
  "result": 1
}
```

## `Get Image`

### GET /observasi/dokumentasi/:fileName

### https://sipartan.et.r.appspot.com/observasi/dokumentasi/:fileName

### Sample success response

```json
{
  "msg": "berhasil get image",
  "result": 1
}
```
