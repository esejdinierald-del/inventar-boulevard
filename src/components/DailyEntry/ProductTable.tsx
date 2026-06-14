import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Unlock, Lock } from "lucide-react";
import { ProductData } from "@/types/turn.types";
import { CalculationService } from "@/services/calculations";
import { AddProductRow } from "./AddProductRow";

interface ProductTableProps {
  products: string[];
  turnProducts: { [key: string]: ProductData };
  isAdminUnlocked: boolean;
  isFieldDisabled: boolean;
  /** Kur false dhe staf: kolonat Stok Fillim & Dif janë të sfumuara. */
  gjendjeUploaded?: boolean;
  /** Kur true (dhe staf): kolona Gjendje sfumohet dhe bllokohet — kyçje 10h pas printit. */
  gjendjeLockedByPrint?: boolean;
  /** Thirret kur stafi shtyp "Ngarko Gjendjen". */
  onConfirmGjendje?: () => void;
  /** Thirret nga admini për të riaktivizuar stafin (zhbllokon kolonën Gjendje). */
  onUnlockGjendje?: () => void;
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

const isGjendjeDisabled = (isFieldDisabled: boolean): boolean => isFieldDisabled;
const isFurnizimeDisabled = (isFieldDisabled: boolean): boolean => isFieldDisabled;

export const ProductTable = ({
  products,
  turnProducts,
  isAdminUnlocked,
  isFieldDisabled,
  gjendjeUploaded = true,
  onConfirmGjendje,
  onUnlockGjendje,
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
  // Sfumimi aplikohet vetëm për staf (jo admin) derisa Gjendja të konfirmohet
  const isBlurred = !isAdminUnlocked && !gjendjeUploaded;
  const blurClass = isBlurred ? "blur-sm opacity-40 select-none pointer-events-none" : "";

  // Kontrollo nëse të paktën një produkt ka gjendje > 0 (lejojmë konfirmimin)
  const hasAnyGjendje = Object.values(turnProducts).some(p => p && p.gjendje > 0);

  return (
    <div className="space-y-3">
      {/* Banner para konfirmimit — stafi numëron dhe ngarkon gjendjen */}
      {!isAdminUnlocked && !gjendjeUploaded && onConfirmGjendje && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-sm">
            <p className="font-medium">📋 Numëro fizikisht gjendjen e secilit produkt</p>
            <p className="text-xs text-muted-foreground">
              Pasi të plotësosh kolonën <strong>Gjendje</strong>, shtyp butonin për të zbuluar <strong>Stok Fillim</strong> dhe <strong>Dif</strong>. Pas konfirmimit, kolona Gjendje do të kyçet.
            </p>
          </div>
          <Button
            size="sm"
            onClick={onConfirmGjendje}
            disabled={!hasAnyGjendje}
            className="whitespace-nowrap"
          >
            <Eye className="h-3 w-3 mr-1" />
            Ngarko Gjendjen
          </Button>
        </div>
      )}

      {/* Banner pas konfirmimit — kolona Gjendje e kyçur; vetëm admini riaktivizon */}
      {gjendjeUploaded && (
        <div className="rounded-lg border border-success/50 bg-success/10 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4 text-success" />
            <div>
              <p className="font-medium">✅ Gjendja u ngarkua dhe është kyçur</p>
              <p className="text-xs text-muted-foreground">
                {isAdminUnlocked
                  ? "Mund ta riaktivizosh stafin për ta modifikuar sërish."
                  : "Për të modifikuar Gjendjen, kërko adminin që të riaktivizojë."}
              </p>
            </div>
          </div>
          {isAdminUnlocked && onUnlockGjendje && (
            <Button
              variant="outline"
              size="sm"
              onClick={onUnlockGjendje}
              className="whitespace-nowrap"
            >
              <Unlock className="h-3 w-3 mr-1" />
              Riaktivizo për stafin
            </Button>
          )}
        </div>
      )}


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
                <TableCell className={`font-medium ${blurClass}`}>
                  {isAdminUnlocked && editingProduct === product ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editedProductName}
                        onChange={(e) => onEditedNameChange(e.target.value)}
                        className="w-32"
                        autoFocus
                      />
                      <Button variant="ghost" size="sm" onClick={() => onSaveEdit(product)} className="h-7 px-2 text-success">✓</Button>
                      <Button variant="ghost" size="sm" onClick={onCancelEdit} className="h-7 px-2 text-destructive">✕</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{product}</span>
                      {isAdminUnlocked && onProductEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onProductEdit(product)} className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">✏️</Button>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className={blurClass}>
                  <Input
                    type="number"
                    step="any"
                    value={data.stokFillim || ""}
                    onChange={(e) => onProductUpdate(product, 'stokFillim', Number(e.target.value))}
                    className="w-20"
                    disabled={!isAdminUnlocked}
                    tabIndex={isBlurred ? -1 : 0}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="any"
                    value={data.gjendje || ""}
                    onChange={(e) => onProductUpdate(product, 'gjendje', Number(e.target.value))}
                    className="w-20"
                    disabled={isGjendjeDisabled(isFieldDisabled) || (gjendjeUploaded && !isAdminUnlocked)}
                  />
                </TableCell>
                <TableCell className={blurClass}>
                  <Input
                    type="number"
                    step="any"
                    value={data.shiriti || ""}
                    onChange={(e) => onProductUpdate(product, 'shiriti', Number(e.target.value))}
                    className="w-20"
                    disabled={!isAdminUnlocked}
                    tabIndex={isBlurred ? -1 : 0}
                  />
                </TableCell>
                <TableCell className={blurClass}>
                  <Input
                    type="number"
                    step="any"
                    value={data.furnizime || ""}
                    onChange={(e) => onProductUpdate(product, 'furnizime', Number(e.target.value))}
                    className="w-20 bg-success/10"
                    disabled={isFurnizimeDisabled(isFieldDisabled)}
                    tabIndex={isBlurred ? -1 : 0}
                  />
                </TableCell>
                <TableCell className={`font-medium ${dif !== 0 ? 'text-warning' : 'text-success'} ${blurClass}`}>
                  {dif}
                </TableCell>
                {isAdminUnlocked && onProductDelete && (
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => onProductDelete(product)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">✕</Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}

          {/* Total Row */}
          <TableRow className="bg-muted/50">
            <TableCell className="font-bold">TOTALI</TableCell>
            <TableCell className={`font-bold ${blurClass}`}>
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
            <TableCell className={`font-bold ${blurClass}`}>
              {Object.values(turnProducts).filter(p => p).reduce(
                (sum, p) => sum + CalculationService.calculateDif(p.stokFillim, p.furnizime, p.gjendje, p.shiriti),
                0
              )}
            </TableCell>
            {isAdminUnlocked && <TableCell></TableCell>}
          </TableRow>
          
          {isAdminUnlocked && onProductAdd && (
            <AddProductRow onAdd={onProductAdd} colSpan={7} />
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};
