"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { ArrowUpDown, Cctv } from "lucide-react";

export type Log = {
  id: number;
  timestmp: Date | null;
};

export const columns: ColumnDef<Log>[] = [
  {
    accessorKey: "id",
    header: "#",
  },
  {
    accessorKey: "timestmp",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const timestamp = row.getValue("timestmp") as Date | null;

      if (!timestamp) {
        return <div>No data</div>;
      }

      return <div>{timestamp.toISOString()}</div>;
    },
  },
  {
    accessorKey: "timestmp2",
    header: "Description",
    cell: ({ row }) => {
      const timestamp = row.getValue("timestmp") as Date | null;

      if (!timestamp) {
        return <div className="text-right font-medium">No data</div>;
      }

      const date = timestamp.toLocaleDateString("fr-BE", {
        day: "numeric",
        month: "long",
      });
      const time = timestamp.toLocaleTimeString("fr-BE");

      return (
        <div className="font-medium">
          Un mouvement a été détecté le {date} à {time}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: () => (
      <div className="text-right">
        <Button>
          Regardé l'enregistrement <Cctv />
        </Button>
      </div>
    ),
  },
];
