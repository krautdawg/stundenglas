"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { getExportData } from "@/actions/admin";

export function ExportCSVButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    
    const result = await getExportData();
    
    if (!result.families || !result.familyHours) {
      setLoading(false);
      return;
    }

    const { families, familyHours } = result;

    // Build CSV
    const rows = [
      ["Familie", "Stunden (Jahr)", "Ziel (10h/Monat * Monate)"],
      ...families.map((f) => {
        const monthsElapsed = new Date().getMonth() + 1;
        return [
          f.name,
          (familyHours[f.id] || 0).toFixed(1),
          (monthsElapsed * 10).toString(),
        ];
      }),
    ];

    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `foerderkreis_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
  }

  return (
    <Button onClick={handleExport} variant="outline" disabled={loading} className="w-full">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      CSV Export fuer Vorstandssitzung
    </Button>
  );
}
