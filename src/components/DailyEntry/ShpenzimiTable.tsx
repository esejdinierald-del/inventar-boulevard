import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { ShpenzimiData } from "@/types/turn.types";
import { useState } from "react";

interface ShpenzimiTableProps {
  shpenzime: ShpenzimiData[];
  isFieldDisabled: boolean;
  onAdd: (shpenzimi: ShpenzimiData) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof ShpenzimiData, value: string | number) => void;
}

export const ShpenzimiTable = ({
  shpenzime,
  isFieldDisabled,
  onAdd,
  onRemove,
  onUpdate,
}: ShpenzimiTableProps) => {
  const [newEmertimi, setNewEmertimi] = useState("");
  const [newVlera, setNewVlera] = useState("");

  const totalShpenzime = shpenzime.reduce((sum, s) => sum + (s.vlera || 0), 0);

  const handleAdd = () => {
    if (!newEmertimi.trim()) return;
    
    onAdd({
      emertimi: newEmertimi.trim(),
      vlera: Number(newVlera) || 0
    });
    
    setNewEmertimi("");
    setNewVlera("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <Table className="[&_th]:px-1 [&_th]:md:px-2 [&_td]:px-1 [&_td]:md:px-2 [&_th]:text-xs [&_th]:md:text-sm [&_th]:whitespace-nowrap">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60%]">Emërtimi</TableHead>
            <TableHead className="text-right">Vlera (ALL)</TableHead>
            {!isFieldDisabled && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {shpenzime.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isFieldDisabled ? 2 : 3} className="text-center text-muted-foreground py-6">
                Nuk ka shpenzime të regjistruara
              </TableCell>
            </TableRow>
          ) : (
            shpenzime.map((shpenzimi, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    value={shpenzimi.emertimi}
                    onChange={(e) => onUpdate(index, "emertimi", e.target.value)}
                    disabled={isFieldDisabled}
                    className="h-8"
                    placeholder="p.sh. Anullim kafe"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={shpenzimi.vlera || ""}
                    onChange={(e) => onUpdate(index, "vlera", Number(e.target.value))}
                    disabled={isFieldDisabled}
                    className="h-8 text-right"
                    placeholder="0"
                  />
                </TableCell>
                {!isFieldDisabled && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onRemove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
          
          {/* Row for adding new expense */}
          {!isFieldDisabled && (
            <TableRow className="bg-muted/30">
              <TableCell>
                <Input
                  value={newEmertimi}
                  onChange={(e) => setNewEmertimi(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-8"
                  placeholder="Shkruaj emërtimin..."
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={newVlera}
                  onChange={(e) => setNewVlera(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-8 text-right"
                  placeholder="0"
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary hover:text-primary"
                  onClick={handleAdd}
                  disabled={!newEmertimi.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-semibold">Total Shpenzime</TableCell>
            <TableCell className="text-right font-bold text-destructive">
              {totalShpenzime.toLocaleString()} ALL
            </TableCell>
            {!isFieldDisabled && <TableCell></TableCell>}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};
