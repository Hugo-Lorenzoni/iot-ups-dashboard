import { DHT22 } from "@/components/ui/dashboard/dht22";
import { UPS } from "@/components/ui/dashboard/ups";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 min-h-[100vh] bg-muted/50">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <DHT22 />
        <UPS />
        <div className="aspect-video rounded-xl bg-white" />
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-white md:min-h-min" />
    </div>
  );
}
