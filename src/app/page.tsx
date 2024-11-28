import { DHT22 } from "@/components/dashboard/dht22";
import { Logs } from "@/components/dashboard/logs";
import { UPS } from "@/components/dashboard/ups";
import Image from "next/image";

export default function Home() {
  return (
    <main className="h-dvh">
      <div className="grid grid-cols-[450px_1fr] gap-4 p-4 bg-muted/50 h-full w-full min-h-0">
        <div className="grid grid-rows-2 gap-4 h-full min-h-0">
          <DHT22 />
          <UPS />
          {/* <div className="rounded-xl bg-white" />
          <div className="rounded-xl bg-white" /> */}
        </div>
        <div className="h-full min-h-0">
          {/* <div className="rounded-xl bg-white h-full min-h-0" /> */}
          <Logs />
        </div>
      </div>
    </main>
  );
}
