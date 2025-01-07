"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type UPS = {
  label: string;
  value: number | undefined;
}[];

const chartConfig = {
  value: {
    label: "%",
  },
  battery_pourcentage: {
    label: "UPS1 Battery %",
    color: "hsl(var(--chart-1))",
  },
  input: {
    label: "UPS2 Battery %",
    color: "hsl(var(--chart-1))",
  },
  output: {
    label: "UPS1 Load",
    color: "hsl(var(--chart-3))",
  },
  ups_load: {
    label: "UPS2 Load",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function UPS({ ups }: { ups: UPS }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>UPS</CardTitle>
        {/* <CardDescription>
          <>
            {new Date().toLocaleDateString("fr-BE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            -{" "}
            {new Date().toLocaleTimeString("fr-BE", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </>
        </CardDescription> */}
      </CardHeader>
      <CardContent className="grow">
        <ChartContainer
          config={chartConfig}
          className="min-h-[200px] w-full h-full"
        >
          <BarChart
            accessibilityLayer
            data={ups}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) =>
                chartConfig[value as keyof typeof chartConfig]?.label
              }
            />

            <XAxis
              dataKey="value"
              type="number"
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">Pas d'alerte</div>
      </CardFooter>
    </Card>
  );
}
