# SIPARTAN Backend

## Project Structure

```
.
├── Dockerfile
├── README.md
├── SIPARTAN.postman_collection
├── app.yaml
├── docker-compose.prod.yml
├── docker-compose.yml
├── package-lock.json
├── package.json
├── src
│   ├── app.js
│   ├── config
│   │   ├── config.js
│   │   ├── database.js
│   │   ├── dbGenerator.js
│   │   ├── minioClient.js
│   │   ├── passport.js
│   │   └── tokens.js
│   ├── controllers
│   │   ├── authController.js
│   │   ├── infoController.js
│   │   ├── lahanController.js
│   │   ├── observasiController.js
│   │   └── userController.js
│   ├── middlewares
│   │   ├── auth.js
│   │   ├── error.js
│   │   ├── multer.js
│   │   └── validate.js
│   ├── models
│   │   ├── dokumentasi.js
│   │   ├── index.js
│   │   ├── lahan.js
│   │   ├── lokasiRegion.js
│   │   ├── observasi.js
│   │   ├── penilaian.js
│   │   ├── penilaianObservasi.js
│   │   ├── plot.js
│   │   └── user.js
│   ├── routes
│   │   ├── authRoute.js
│   │   ├── infoRoute.js
│   │   ├── lahanRoute.js
│   │   ├── observasiRoute.js
│   │   └── userRoute.js
│   ├── seeders
│   │   ├── seedPenilaian.js
│   │   └── seedUser.js
│   ├── services
│   │   ├── authService.js
│   │   ├── dokumentasiService.js
│   │   ├── emailService.js
│   │   ├── infoService.js
│   │   ├── lahanService.js
│   │   ├── observasiService.js
│   │   ├── penilaianService.js
│   │   └── userService.js
│   ├── utils
│   │   ├── axiosClient.js
│   │   ├── generateReport
│   │   │   ├── index.js
│   │   │   └── pdfContent.js
│   │   ├── karhutlaPenilaian.js
│   │   ├── logger.js
│   │   ├── pagination.js
│   │   ├── postgisQuery.js
│   │   └── response.js
│   └── validations
│       ├── authValidation.js
│       ├── costumValidation.js
│       ├── infoValidation.js
│       ├── lahanValidation.js
│       ├── observasiValidation.js
│       └── userValidation.js
└── wait-for-it.sh
```

## Getting Started

The API documentation can be found in the [SIPARTAN.postman_collection](./SIPARTAN.postman_collection) file located in the root folder.

### Prerequisites

- Docker (recommended version 20+)
- Node.js (recommended version 16+)
- PostgreSQL (for local development without Docker if desired)
- MinIO server or compatible S3 storage (for image/file saving)

> Make sure Docker is properly installed and running. If you are not using Docker for the database or file storage, ensure you have PostgreSQL and MinIO (or alternative) configured.

### Local Development

1. Clone the repository:
   ```sh
   git clone https://github.com/sipartan/sipartan-be.git
   cd sipartan-be
   ```

2. Make the `wait-for-it.sh` script executable:
   ```sh
   chmod +x wait-for-it.sh
   ```

3. Copy the example environment file and fill in the values:
   ```sh
   cp .env.example .env
   # Edit .env with appropriate values (database credentials, MinIO credentials, etc.)
   ```

4. Install packages:
   ```sh
   npm install
   ```

5. Start the Docker containers:
   ```sh
   docker-compose up --build
   ```

6. Start the application:
   ```sh
   npm run dev
   ```

### Production

1. Clone the repository:
   ```sh
   git clone https://github.com/sipartan/sipartan-be.git
   cd sipartan-be
   ```

2. Make the `wait-for-it.sh` script executable:
   ```sh
   chmod +x wait-for-it.sh
   ```

3. Copy the example environment file and fill in the values:
   ```sh
   cp .env.example .env
   # Edit .env with appropriate values (database credentials, MinIO credentials, etc.)
   ```

4. Start the Docker containers with the production configuration:
   ```sh
   docker-compose -f docker-compose.prod.yml up --build
   ```
