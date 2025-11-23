import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductData } from "@/types/turn.types";
import { CalculationService } from "@/services/calculations";

interface ProductTableProps {
  products: string[];
  turnProducts: { [key: string]: ProductData };
  isAdminUnlocked: boolean;
  isFieldDisabled: boolean;
  onProductUpdate: (product: string, field: keyof ProductData, value: number) => void;
  onProductDelete?: (product: string) => void;
  onProductEdit?: (product: string) => void;
  editingProduct: string | null;
  editedProductName: string;
  onEditedNameChange: (name: string) => void;
  onSaveEdit: (oldName: string) => void;
  onCancelEdit: () => void;
}

export const ProductTable = ({
  products,
  turnProducts,
  isAdminUnlocked,
  isFieldDisabled,
  onProductUpdate,
  onProductDelete,
  onProductEdit,
  editingProduct,
  editedProductName,
  onEditedNameChange,
  onSaveEdit,
  onCancelEdit,
}: ProductTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px]">Produkti</TableHead>
            <TableHead className="min-w-[80px]">Stok Fillim</TableHead>
            <TableHead className="min-w-[80px]">Gjendje</TableHead>
            <TableHead className="min-w-[80px]">Shiriti</TableHead>
            <TableHead className="min-w-[80px]">Furnizime</TableHead>
            <TableHead className="min-w-[60px]">Dif</TableHead>
            {isAdminUnlocked && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map(product => {
            const data = turnProducts[product];
            const dif = CalculationService.calculateDif(
              data.stokFillim,
              data.furnizime,
              data.gjendje,
              data.shiriti
            );

            return (
              <TableRow key={product}>
                <TableCell className="font-medium">
                  {isAdminUnlocked && editingProduct === product ? (
                    <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap">
                      <Input
                        value={editedProductName}
                        onChange={(e) => onEditedNameChange(e.target.value)}
                        className="w-full sm:w-32 text-base"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSaveEdit(product)}
                          className="h-8 w-8 p-0 text-success touch-manipulation"
                        >
                          ✓
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onCancelEdit}
                          className="h-8 w-8 p-0 text-destructive touch-manipulation"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base">{product}</span>
                      {isAdminUnlocked && onProductEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onProductEdit(product)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground touch-manipulation"
                        >
                          ✏️
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={data.stokFillim || ""}
                    onChange={(e) => onProductUpdate(product, 'stokFillim', Number(e.target.value))}
                    className="w-full sm:w-20 text-base touch-manipulation"
                    disabled={!isAdminUnlocked}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={data.gjendje || ""}
                    onChange={(e) => onProductUpdate(product, 'gjendje', Number(e.target.value))}
                    className="w-full sm:w-20 text-base touch-manipulation"
                    disabled={isFieldDisabled}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={data.shiriti || ""}
                    onChange={(e) => onProductUpdate(product, 'shiriti', Number(e.target.value))}
                    className="w-full sm:w-20 text-base touch-manipulation"
                    disabled={isFieldDisabled}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={data.furnizime || ""}
                    onChange={(e) => onProductUpdate(product, 'furnizime', Number(e.target.value))}
                    className="w-full sm:w-20 bg-success/10 text-base touch-manipulation"
                    disabled={isFieldDisabled}
                  />
                </TableCell>
                <TableCell className={`font-medium text-sm sm:text-base ${dif !== 0 ? 'text-warning' : 'text-success'}`}>
                  {dif}
                </TableCell>
                {isAdminUnlocked && onProductDelete && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onProductDelete(product)}
                      className="h-10 w-10 p-0 text-destructive hover:text-destructive touch-manipulation"
                    >
                      ✕
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}

          {/* Total Row */}
          <TableRow className="bg-muted/50">
            <TableCell className="font-bold">TOTALI</TableCell>
            <TableCell className="font-bold">
              {Object.values(turnProducts).reduce((sum, p) => sum + p.stokFillim, 0)}
            </TableCell>
            <TableCell className="font-bold">
              {Object.values(turnProducts).reduce((sum, p) => sum + p.gjendje, 0)}
            </TableCell>
            <TableCell className="font-bold text-primary">
              {Object.values(turnProducts).reduce((sum, p) => sum + p.shiriti, 0)}
            </TableCell>
            <TableCell className="font-bold text-success">
              {Object.values(turnProducts).reduce((sum, p) => sum + p.furnizime, 0)}
            </TableCell>
            <TableCell className="font-bold">
              {Object.values(turnProducts).reduce(
                (sum, p) => sum + CalculationService.calculateDif(p.stokFillim, p.furnizime, p.gjendje, p.shiriti),
                0
              )}
            </TableCell>
            {isAdminUnlocked && <TableCell></TableCell>}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
