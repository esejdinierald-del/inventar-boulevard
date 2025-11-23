import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CoffeeData } from "@/types/turn.types";
import { CalculationService } from "@/services/calculations";

interface CoffeeTableProps {
  coffeeTypes: string[];
  coffeeData: CoffeeData;
  isFieldDisabled: boolean;
  onCoffeeUpdate: (coffee: string, value: number) => void;
}

export const CoffeeTable = ({
  coffeeTypes,
  coffeeData,
  isFieldDisabled,
  onCoffeeUpdate,
}: CoffeeTableProps) => {
  const totalCoffee = Object.values(coffeeData).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px]">Lloji</TableHead>
            <TableHead className="min-w-[100px]">Sasia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coffeeTypes.map(coffee => (
            <TableRow key={coffee}>
              <TableCell className="font-medium text-sm sm:text-base">{coffee}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={coffeeData[coffee] || ""}
                  onChange={(e) => onCoffeeUpdate(coffee, Number(e.target.value))}
                  className="w-full sm:w-24 text-base touch-manipulation"
                  disabled={isFieldDisabled}
                />
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/50">
            <TableCell className="font-bold text-sm sm:text-base">TOTALI</TableCell>
            <TableCell className="font-bold text-primary text-sm sm:text-base">{totalCoffee}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
