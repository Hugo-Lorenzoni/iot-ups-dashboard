// import Minio from "minio";
const Minio = require("minio");

// Instantiate the minio client with the endpoint
// and access keys as shown below.
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: Number(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

export default minioClient;
