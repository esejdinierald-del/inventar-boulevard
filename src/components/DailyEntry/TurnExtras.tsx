import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnData } from "@/types/turn.types";
import { CalculationService } from "@/services/calculations";
import { GrinderPhotoScanner } from "@/components/GrinderPhotoScanner";

interface TurnExtrasProps {
  turnName: string;
  turnData: TurnData;
  isAdminUnlocked: boolean;
  isFieldDisabled: boolean;
  mulliriFillimDisabled?: boolean;
  mulliriPerfundDisabled?: boolean;
  onUpdate: (field: keyof TurnData, value: number) => void;
  onMulliriPerfundUpdate?: (value: number) => void;
}

export const TurnExtras = ({
  turnName,
  turnData,
  isAdminUnlocked,
  isFieldDisabled,
  mulliriFillimDisabled = false,
  mulliriPerfundDisabled = false,
  onUpdate,
  onMulliriPerfundUpdate,
}: TurnExtrasProps) => {
  const totalCoffee = CalculationService.calculateTotalCoffee(turnData);
  const mulliriDif = CalculationService.calculateMulliriDif(
    turnData.mulliriFillim,
    turnData.mulliriPerfund,
    totalCoffee
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Xhiro {turnName} (ALL)</Label>
        <Input
          type="number"
          step="any"
          value={turnData.xhiro || ""}
          onChange={(e) => onUpdate('xhiro', Number(e.target.value))}
          disabled={true}
          className="bg-muted/50"
          title="Xhiro ngarkohet vetëm nga skaneri i shiritit"
        />
        <p className="text-xs text-muted-foreground">📸 Ngarkohet automatikisht nga skaneri i shiritit</p>
      </div>

      <div className="space-y-2">
        <Label>Mulliri Fillim (kg)</Label>
        <Input
          type="number"
          step="any"
          value={turnData.mulliriFillim || ""}
          onChange={(e) => onUpdate('mulliriFillim', Number(e.target.value))}
          disabled={mulliriFillimDisabled || !isAdminUnlocked}
          className={mulliriFillimDisabled ? "bg-muted/50" : ""}
          title={mulliriFillimDisabled ? "Automatikisht nga Mulliri Perfund T1" : ""}
        />
        {mulliriFillimDisabled && (
          <p className="text-xs text-muted-foreground">
            📊 {turnData.mulliriFillim > 0 
              ? `Ngarkuar nga Mulliri Perfund T1: ${turnData.mulliriFillim} kg` 
              : 'Në pritje të Mulliri Perfund nga T1'}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Mulliri Perfund (kg)</Label>
          {!mulliriPerfundDisabled && (
            <GrinderPhotoScanner
              turnName={turnName}
              onValueExtracted={onMulliriPerfundUpdate || ((value) => onUpdate('mulliriPerfund', value))}
              isAdminUnlocked={isAdminUnlocked}
              currentValue={turnData.mulliriPerfund}
            />
          )}
        </div>
        <Input
          type="number"
          step="any"
          value={turnData.mulliriPerfund || ""}
          onChange={(e) => {
            // Only admin can edit manually
            if (isAdminUnlocked) {
              const value = Number(e.target.value);
              if (onMulliriPerfundUpdate) {
                onMulliriPerfundUpdate(value);
              } else {
                onUpdate('mulliriPerfund', value);
              }
            }
          }}
          disabled={mulliriPerfundDisabled || !isAdminUnlocked}
          className={mulliriPerfundDisabled || !isAdminUnlocked ? "bg-muted/50" : ""}
          title={mulliriPerfundDisabled ? "Turni është i kyçur" : "Stafi fut vetëm me foto"}
        />
        {!isAdminUnlocked && !mulliriPerfundDisabled && (
          <p className="text-xs text-muted-foreground">📸 Fut numrin vetëm me foto</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Diferenca Mulliri (kg)</Label>
        <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm font-medium">
          {mulliriDif}
        </div>
      </div>
    </div>
  );
};
