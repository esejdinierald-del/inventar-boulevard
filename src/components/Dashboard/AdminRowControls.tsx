import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Kolonat ndihmëse për admin te tabelat e inventarit:
 *  - Shigjeta ▲▼ për të ndryshuar `sort_order` (swap me fqinjin).
 *  - Checkbox për `track_daily` (nëse produkti shfaqet te faqja e Regjistrimit Ditor).
 *
 * `tableName` duhet të ketë kolonat `id`, `sort_order`, `track_daily`.
 */
interface AdminRowControlsProps {
  tableName: "products" | "coffee_types" | "kitchen_products" | "alcoholic_drinks_inventory";
  rowId: string;
  sortOrder: number;
  trackDaily: boolean;
  isFirst: boolean;
  isLast: boolean;
  /** Rreshti i drejtpërdrejtë sipër (për të bërë swap sort_order). */
  prevRow?: { id: string; sort_order: number };
  /** Rreshti i drejtpërdrejtë poshtë (për të bërë swap sort_order). */
  nextRow?: { id: string; sort_order: number };
  onChanged: () => void | Promise<void>;
}

export const AdminRowControls = ({
  tableName,
  rowId,
  sortOrder,
  trackDaily,
  isFirst,
  isLast,
  prevRow,
  nextRow,
  onChanged,
}: AdminRowControlsProps) => {
  const [busy, setBusy] = useState(false);

  const swapWith = async (neighbor?: { id: string; sort_order: number }) => {
    if (!neighbor || busy) return;
    setBusy(true);
    try {
      // Përdorim një vlerë të përkohshme për të shmangur konfliktin e UNIQUE-it (nëse do të kishte).
      // Për siguri, thjesht kryhen 2 update-e.
      const { error: e1 } = await supabase
        .from(tableName)
        .update({ sort_order: neighbor.sort_order })
        .eq("id", rowId);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from(tableName)
        .update({ sort_order: sortOrder })
        .eq("id", neighbor.id);
      if (e2) throw e2;
      await onChanged();
    } catch (err) {
      console.error("Reorder error:", err);
      toast.error("Gabim në ndryshimin e renditjes");
    } finally {
      setBusy(false);
    }
  };

  const toggleTrackDaily = async (checked: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ track_daily: checked })
        .eq("id", rowId);
      if (error) throw error;
      await onChanged();
    } catch (err) {
      console.error("track_daily update error:", err);
      toast.error("Gabim në përditësim");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex flex-col">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-5 w-6 p-0"
          disabled={isFirst || busy || !prevRow}
          onClick={() => swapWith(prevRow)}
          aria-label="Lëviz lart"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-5 w-6 p-0"
          disabled={isLast || busy || !nextRow}
          onClick={() => swapWith(nextRow)}
          aria-label="Lëviz poshtë"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>
      <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
        <Checkbox
          checked={trackDaily}
          onCheckedChange={(v) => toggleTrackDaily(Boolean(v))}
          disabled={busy}
        />
        Ditore
      </label>
    </div>
  );
};
