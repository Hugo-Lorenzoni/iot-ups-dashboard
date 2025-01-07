"use server";

import minioClient from "@/lib/minio";

export async function downloadVideo(
  formData: FormData
): Promise<string | undefined> {
  console.log("downloadVideo");
  const timestamp = formData.get("timestamp") as string | null;
  if (timestamp) {
    const time = new Date(timestamp);
    // time.setHours(time.getHours() + 1);
    console.log(time);
    const timestring = time.toISOString();

    const videoName = `video_${timestring
      .split(".")[0]
      .replace("T", "_")
      .replaceAll("-", "")
      .replaceAll(":", "")}.avi`;
    console.log(videoName);
    const url: string = await minioClient.presignedGetObject(
      "iot-bucket",
      videoName,
      24 * 60 * 60
    );
    return url;
  }
}
