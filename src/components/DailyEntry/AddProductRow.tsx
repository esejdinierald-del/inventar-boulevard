import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";

interface AddProductRowProps {
  onAdd: (productName: string) => void;
  colSpan: number;
}

export const AddProductRow = ({ onAdd, colSpan }: AddProductRowProps) => {
  const [newProductName, setNewProductName] = useState("");

  const handleAdd = () => {
    onAdd(newProductName);
    setNewProductName("");
  };

  return (
    <TableRow className="bg-accent/20">
      <TableCell>
        <Input
          placeholder="Emri i produktit të ri..."
          value={newProductName}
          onChange={(e) => setNewProductName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          className="h-8"
        />
      </TableCell>
      <TableCell colSpan={colSpan - 2}>
        <Button onClick={handleAdd} size="sm" variant="outline" className="h-8">
          + Shto Produkt
        </Button>
      </TableCell>
      <TableCell></TableCell>
    </TableRow>
  );
};
