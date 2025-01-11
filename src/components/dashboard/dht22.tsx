"use client";

import {
  Droplet,
  Thermometer,
  ThermometerIcon,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { getDht } from "@/app/actions";
import { REFETCH_INTERVAL } from "@/utils/constants";

const chartConfig = {
  temperature: {
    label: "Température",
    color: "hsl(var(--chart-1))",
  },
  humidite: {
    label: "Humidité",
    color: "hsl(var(--chart-2))",
  },
  timestamp: {
    label: "Horodatage",
  },
} satisfies ChartConfig;

type DHT = {
  temperature: number;
  humidite: number;
  timestamp: Date | null;
}[];

function format(input: Date): string {
  return input
    .toLocaleTimeString("fr-BE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .split(" ") // Split the string into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter
    .join(" "); // Join the words back into a single string
}

export function DHT22() {
  const { data: dht } = useQuery({
    queryKey: ["dht"],
    queryFn: getDht,
    refetchInterval: REFETCH_INTERVAL,
  });

  if (!dht) {
    return null;
  }

  const oldestData = dht[dht.length - 1].timestamp;
  const newestData = dht[0].timestamp;

  const maxTemperature = Math.max(...dht.map((d) => d.temperature));
  const minTemperature = Math.min(...dht.map((d) => d.temperature));
  const maxHumidite = Math.max(...dht.map((d) => d.humidite));
  const minHumidite = Math.min(...dht.map((d) => d.humidite));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Température et humidité</CardTitle>
        {/* <CardDescription>
          Température et humidité de la pièce
        </CardDescription> */}
      </CardHeader>
      <CardContent className="grow">
        <ChartContainer
          config={chartConfig}
          className="min-h-[200px] w-full h-full"
        >
          <AreaChart
            accessibilityLayer
            data={dht}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = value as Date;
                return date.toLocaleTimeString("fr-BE", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
              }}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent indicator="dot" labelKey="timestamp" />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="humidite"
              type="natural"
              fill="var(--color-humidite)"
              fillOpacity={0.4}
              stroke="var(--color-humidite)"
              stackId="a"
            />
            <Area
              dataKey="temperature"
              type="natural"
              fill="var(--color-temperature)"
              fillOpacity={0.4}
              stroke="var(--color-temperature)"
              stackId="a"
            />
            <LabelList dataKey="timestamp" position="top" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none ">
              <ThermometerIcon className="size-4" /> Tempréature :{" "}
              {minTemperature}°C - {maxTemperature}°C
            </div>
            <div className="flex items-center gap-2 font-medium leading-none ">
              <Droplet className="size-4" /> Humidité : {minHumidite}% -{" "}
              {maxHumidite}%
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {oldestData && newestData ? (
                <>
                  {format(oldestData)} - {format(newestData)}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
