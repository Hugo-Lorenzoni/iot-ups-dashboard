"use client";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ScanEye } from "lucide-react";

import { columns, type Log } from "./columns";
import { DataTable } from "./data-table";

function format(input: Date): string {
  return input
    .toLocaleDateString("fr-BE", {
      month: "long",
      year: "numeric",
    })
    .split(" ") // Split the string into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter
    .join(" "); // Join the words back into a single string
}

export function Logs({ logs }: { logs: Log[] }) {
  const oldestLog = logs[logs.length - 1].timestmp;
  const newestLog = logs[0].timestmp;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Logs d'activité</CardTitle>
        <CardDescription>
          Détection de mouvement dans le local 200
        </CardDescription>
      </CardHeader>
      <DataTable columns={columns} data={logs} />
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              {logs.length} détection <ScanEye className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {oldestLog && newestLog ? (
                <>
                  {format(oldestLog)} - {format(newestLog)}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
