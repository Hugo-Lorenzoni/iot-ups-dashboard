import { DHT22 } from "@/components/dashboard/dht22";
import { Logs } from "@/components/dashboard/logs";
import { UPS } from "@/components/dashboard/ups";
import prisma from "@/lib/prisma";

export default async function Home() {
  const logs = await prisma.mouvement.findMany({
    take: 10,
    orderBy: {
      timestmp: "desc",
    },
  });

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

  const upsData = await prisma.ups.findFirst();

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

  return (
    <main className="h-dvh">
      <div className="grid grid-cols-[450px_1fr] gap-4 p-4 bg-muted/50 h-full w-full min-h-0">
        <div className="grid grid-rows-2 gap-4 h-full min-h-0">
          <DHT22 dht={dht} />
          <UPS ups={ups} />
          {/* <div className="rounded-xl bg-white" />
          <div className="rounded-xl bg-white" /> */}
        </div>
        <div className="h-full min-h-0">
          {/* <div className="rounded-xl bg-white h-full min-h-0" /> */}
          <Logs logs={logs} />
        </div>
      </div>
    </main>
  );
}
