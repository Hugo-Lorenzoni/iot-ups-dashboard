"use server";

import minioClient from "@/lib/minio";
import prisma from "@/lib/prisma";

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

export async function getLogs() {
  console.log("getLogs");
  const logs = await prisma.mouvement.findMany({
    take: 10,
    orderBy: {
      timestmp: "desc",
    },
  });

  return logs;
}

export async function getDht() {
  console.log("getDht");
  const dhtData = await prisma.dht.findMany({
    orderBy: {
      timestmp: "desc",
    },
  });
  // convert decimal to number
  const dht = dhtData.map((d) => {
    return {
      temperature: d.temperature.toNumber(),
      humidite: d.humidite.toNumber(),
      timestamp: d.timestmp,
    };
  });

  return dht;
}

export async function getUps() {
  console.log("getUps");
  const upsData = await prisma.ups.findFirst({ orderBy: { timestmp: "desc" } });

  const ups = [
    {
      label: "battery_pourcentage",
      value: upsData?.battery_pourcentage.toNumber(),
      fill: "var(--color-battery_pourcentage)",
    },
    {
      label: "output",
      value: (upsData?.output?.toNumber() || 360) / 10,
      fill: "var(--color-output)",
    },
    {
      label: "input",
      value: (upsData?.input.toNumber() || 27) * 3 + 16,
      fill: "var(--color-input)",
    },
    {
      label: "ups_load",
      value: (upsData?.ups_load.toNumber() || 1) * 69,
      fill: "var(--color-ups_load)",
    },
  ];

  return ups;
}
