import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductData } from "@/types/turn.types";
import { CalculationService } from "@/services/calculations";
import { AddProductRow } from "./AddProductRow";

interface ProductTableProps {
  products: string[];
  turnProducts: { [key: string]: ProductData };
  isAdminUnlocked: boolean;
  isFieldDisabled: boolean;
  onProductUpdate: (product: string, field: keyof ProductData, value: number) => void;
  onProductDelete?: (product: string) => void;
  onProductEdit?: (product: string) => void;
  onProductAdd?: (productName: string) => boolean | Promise<boolean>;
  editingProduct: string | null;
  editedProductName: string;
  onEditedNameChange: (name: string) => void;
  onSaveEdit: (oldName: string) => void;
  onCancelEdit: () => void;
}

// Gjendje dhe Furnizime bllokojnë vetëm për data të kaluara
// Për ditën e sotme dhe ditën e djeshme brenda 4-orëve, janë gjithmonë të hapura për staff
const isGjendjeDisabled = (isFieldDisabled: boolean): boolean => {
  return isFieldDisabled;
};

const isFurnizimeDisabled = (isFieldDisabled: boolean): boolean => {
  return isFieldDisabled;
};

export const ProductTable = ({
  products,
  turnProducts,
  isAdminUnlocked,
  isFieldDisabled,
  onProductUpdate,
  onProductDelete,
  onProductEdit,
  onProductAdd,
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
            <TableHead>Produkti</TableHead>
            <TableHead>Stok Fillim</TableHead>
            <TableHead>Gjendje</TableHead>
            <TableHead>Shiriti</TableHead>
            <TableHead>Furnizime</TableHead>
            <TableHead>Dif</TableHead>
            {isAdminUnlocked && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map(product => {
            const data = turnProducts[product];
            
            // Skip if no data for this product
            if (!data) {
              console.warn(`No data found for product: ${product}`);
              return null;
            }
            
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
                    <div className="flex items-center gap-2">
                      <Input
                        value={editedProductName}
                        onChange={(e) => onEditedNameChange(e.target.value)}
                        className="w-32"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSaveEdit(product)}
                        className="h-7 px-2 text-success"
                      >
                        ✓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancelEdit}
                        className="h-7 px-2 text-destructive"
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{product}</span>
                      {isAdminUnlocked && onProductEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onProductEdit(product)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
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
                    value={data.stokFillim || ""}
                    onChange={(e) => onProductUpdate(product, 'stokFillim', Number(e.target.value))}
                    className="w-20"
                    disabled={!isAdminUnlocked}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="any"
                    value={data.gjendje || ""}
                    onChange={(e) => onProductUpdate(product, 'gjendje', Number(e.target.value))}
                    className="w-20"
                    disabled={isGjendjeDisabled(isFieldDisabled)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="any"
                    value={data.shiriti || ""}
                    onChange={(e) => onProductUpdate(product, 'shiriti', Number(e.target.value))}
                    className="w-20"
                    disabled={!isAdminUnlocked}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="any"
                    value={data.furnizime || ""}
                    onChange={(e) => onProductUpdate(product, 'furnizime', Number(e.target.value))}
                    className="w-20 bg-success/10"
                    disabled={isFurnizimeDisabled(isFieldDisabled)}
                  />
                </TableCell>
                <TableCell className={`font-medium ${dif !== 0 ? 'text-warning' : 'text-success'}`}>
                  {dif}
                </TableCell>
                {isAdminUnlocked && onProductDelete && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onProductDelete(product)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
              {Object.values(turnProducts).filter(p => p).reduce((sum, p) => sum + p.stokFillim, 0)}
            </TableCell>
            <TableCell className="font-bold">
              {Object.values(turnProducts).filter(p => p).reduce((sum, p) => sum + p.gjendje, 0)}
            </TableCell>
            <TableCell className="font-bold text-primary">
              {Object.values(turnProducts).filter(p => p).reduce((sum, p) => sum + p.shiriti, 0)}
            </TableCell>
            <TableCell className="font-bold text-success">
              {Object.values(turnProducts).filter(p => p).reduce((sum, p) => sum + p.furnizime, 0)}
            </TableCell>
            <TableCell className="font-bold">
              {Object.values(turnProducts).filter(p => p).reduce(
                (sum, p) => sum + CalculationService.calculateDif(p.stokFillim, p.furnizime, p.gjendje, p.shiriti),
                0
              )}
            </TableCell>
            {isAdminUnlocked && <TableCell></TableCell>}
          </TableRow>
          
          {/* Add Product Row */}
          {isAdminUnlocked && onProductAdd && (
            <AddProductRow onAdd={onProductAdd} colSpan={7} />
          )}
        </TableBody>
      </Table>
    </div>
  );
};
