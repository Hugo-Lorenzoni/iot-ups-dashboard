// import Minio from "minio";
import * as Minio from "minio";

// Instantiate the minio client with the endpoint
// and access keys as shown below.
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: Number(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.ACCESSKEY || "minio",
  secretKey: process.env.SECRETKEY || "secret",
});

export default minioClient;
