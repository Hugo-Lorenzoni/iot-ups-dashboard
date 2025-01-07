"use server";

import minioClient from "@/lib/minio";

export async function downloadVideo(formData: FormData): Promise<void> {
  console.log("downloadVideo");
  const timestamp = formData.get("timestamp") as string | null;
  if (timestamp) {
    const videoName = `video_${timestamp
      .replaceAll("-", "")
      .replace("T", "_")
      .replaceAll(".", "")
      .replaceAll(":", "")
      .substring(0, 15)}.avi`;
    console.log(videoName);
    const url: string = await minioClient.presignedGetObject(
      "iot-bucket",
      videoName,
      24 * 60 * 60
    );
  }
}
