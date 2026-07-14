import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CoffeeData } from "@/types/turn.types";
import { CalculationService } from "@/services/calculations";

interface CoffeeTableProps {
  coffeeTypes: string[];
  coffeeData: CoffeeData;
  isFieldDisabled: boolean;
  isAdminUnlocked: boolean;
  onCoffeeUpdate: (coffee: string, value: number) => void;
}

export const CoffeeTable = ({
  coffeeTypes,
  coffeeData,
  isFieldDisabled,
  isAdminUnlocked,
  onCoffeeUpdate,
}: CoffeeTableProps) => {
  const totalCoffee = Object.values(coffeeData).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="overflow-x-auto">
      <Table className="[&_th]:px-1 [&_th]:md:px-4 [&_td]:px-1 [&_td]:md:px-4 [&_th]:text-xs [&_th]:md:text-sm">
        <TableHeader>
          <TableRow>
            <TableHead>Lloji</TableHead>
            <TableHead>Sasia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coffeeTypes.map(coffee => (
            <TableRow key={coffee}>
              <TableCell className="font-medium">{coffee}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="any"
                  value={coffeeData[coffee] || ""}
                  onChange={(e) => onCoffeeUpdate(coffee, Number(e.target.value))}
                  className="w-16 md:w-24"
                  disabled={isFieldDisabled}
                />
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/50">
            <TableCell className="font-bold">TOTALI</TableCell>
            <TableCell className="font-bold text-primary">{totalCoffee}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
