import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, UnlockKeyhole, CheckCircle2 } from "lucide-react";
import { TurnData, ProductData, ShpenzimiData } from "@/types/turn.types";
import { ProductTable } from "./ProductTable";
import { CoffeeTable } from "./CoffeeTable";
import { TurnExtras } from "./TurnExtras";
import { ShpenzimiTable } from "./ShpenzimiTable";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { CalculationService } from "@/services/calculations";
import { toast } from "sonner";

interface TurnSectionProps {
  turnName: string;
  turnData: TurnData;
  products: string[];
  coffeeTypes: string[];
  alcoholicDrinks?: string[];
  isAdminUnlocked: boolean;
  isFieldDisabled: boolean;
  showCopyButton?: boolean;
  mulliriFillimDisabled?: boolean;
  isTurnLocked?: boolean;
  onProductUpdate: (product: string, field: keyof ProductData, value: number) => void;
  onCoffeeUpdate: (coffee: string, value: number) => void;
  onTurnUpdate: (field: keyof TurnData, value: number) => void;
  onMulliriPerfundUpdate?: (value: number) => void;
  onCopyToNextTurn?: () => void;
  onReceiptData: (productData: { [key: string]: number }, coffeeData: { [key: string]: number }, alcoholicDrinksData?: { [key: string]: number }, total?: number) => void;
  onProductDelete?: (product: string) => void | Promise<void>;
  onProductAdd?: (productName: string) => boolean | Promise<boolean>;
  onProductEdit?: (product: string) => void;
  editingProduct: string | null;
  editedProductName: string;
  onEditedNameChange: (name: string) => void;
  onSaveEdit: (oldName: string) => void;
  onCancelEdit: () => void;
  onShpenzimiAdd: (shpenzimi: ShpenzimiData) => void;
  onShpenzimiRemove: (index: number) => void;
  onShpenzimiUpdate: (index: number, field: keyof ShpenzimiData, value: string | number) => void;
  gjendjeConfirmed?: boolean;
  onConfirmGjendje?: () => void;
  onUnlockGjendje?: () => void;
  blurGjendje?: boolean;
  hideXhiro?: boolean;
}

export const TurnSection = ({
  turnName,
  turnData,
  products,
  coffeeTypes,
  alcoholicDrinks = [],
  isAdminUnlocked,
  isFieldDisabled,
  showCopyButton = false,
  mulliriFillimDisabled = false,
  isTurnLocked = false,
  onProductUpdate,
  onCoffeeUpdate,
  onTurnUpdate,
  onMulliriPerfundUpdate,
  onCopyToNextTurn,
  onReceiptData,
  onProductDelete,
  onProductAdd,
  onProductEdit,
  editingProduct,
  editedProductName,
  onEditedNameChange,
  onSaveEdit,
  onCancelEdit,
  onShpenzimiAdd,
  onShpenzimiRemove,
  onShpenzimiUpdate,
  gjendjeConfirmed = false,
  onConfirmGjendje,
  onUnlockGjendje,
  blurGjendje = false,
  hideXhiro = false,
}: TurnSectionProps) => {
  // Skaneri i shiritit hapet vetëm pasi staf të konfirmojë Gjendjen.
  // Admin/menaxher e ka hapur gjithmonë (mund të punojë lirshëm).
  const scannerDisabled = !isAdminUnlocked && !gjendjeConfirmed;

  return (
    <div className="space-y-4">
      {/* Products Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle>Produktet - Turni {turnName}</CardTitle>
          <div className="flex gap-2 flex-wrap">

            {/* Treguesi që Gjendja është e mbyllur (staf) */}
            {!isAdminUnlocked && gjendjeConfirmed && (
              <span className="inline-flex items-center text-xs text-muted-foreground px-2">
                <Lock className="h-3 w-3 mr-1" />
                Gjendja e mbyllur
              </span>
            )}

            {/* Zhblloko Gjendjen (vetëm admin, kur është konfirmuar) */}
            {isAdminUnlocked && gjendjeConfirmed && onUnlockGjendje && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onUnlockGjendje();
                  toast.success("🔓 Gjendja u zhbllokua.");
                }}
                className="text-xs"
              >
                <UnlockKeyhole className="h-3 w-3 mr-1" />
                Zhblloko Gjendjen
              </Button>
            )}

            <ReceiptScanner
              products={products}
              coffeeTypes={coffeeTypes}
              alcoholicDrinks={alcoholicDrinks}
              onDataExtracted={onReceiptData}
              turnName={turnName}
              turnData={turnData}
              calculateDif={CalculationService.calculateDif}
              disabled={scannerDisabled}
              disabledReason="Mbyll fillimisht Gjendjen (kliko 'Mbyll Gjendjen & Hap Skanerin') përpara se të ngarkosh shiritin."
            />
            {showCopyButton && onCopyToNextTurn && (
              <Button variant="outline" size="sm" onClick={onCopyToNextTurn} className="text-xs">
                Kopjo në T2 →
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ProductTable
            products={products}
            turnProducts={turnData.products}
            isAdminUnlocked={isAdminUnlocked}
            isFieldDisabled={isFieldDisabled}
            gjendjeConfirmed={gjendjeConfirmed}
            blurGjendje={blurGjendje}
            turnLocked={isTurnLocked}
            onProductUpdate={onProductUpdate}
            onProductDelete={onProductDelete}
            onProductEdit={onProductEdit}
            onProductAdd={onProductAdd}
            onConfirmGjendje={onConfirmGjendje}
            editingProduct={editingProduct}
            editedProductName={editedProductName}
            onEditedNameChange={onEditedNameChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
          />

        </CardContent>
      </Card>

      {/* Coffee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kafe - Turni {turnName}</CardTitle>
        </CardHeader>
        <CardContent>
          <CoffeeTable
            coffeeTypes={coffeeTypes}
            coffeeData={turnData.coffee}
            isFieldDisabled={isFieldDisabled}
            isAdminUnlocked={isAdminUnlocked}
            onCoffeeUpdate={onCoffeeUpdate}
          />
        </CardContent>
      </Card>


      {/* Turn Extras */}
      <Card>
        <CardHeader>
          <CardTitle>Xhiro dhe Të Dhëna Shtesë - Turni {turnName}</CardTitle>
        </CardHeader>
        <CardContent>
          <TurnExtras
            turnName={turnName}
            turnData={turnData}
            isAdminUnlocked={isAdminUnlocked}
            isFieldDisabled={isFieldDisabled}
            mulliriFillimDisabled={mulliriFillimDisabled}
            mulliriPerfundDisabled={isTurnLocked}
            onUpdate={onTurnUpdate}
            onMulliriPerfundUpdate={onMulliriPerfundUpdate}
            hideXhiro={hideXhiro}
          />
        </CardContent>
      </Card>

      {/* Shpenzime Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shpenzime / Anullime - Turni {turnName}</CardTitle>
        </CardHeader>
        <CardContent>
          <ShpenzimiTable
            shpenzime={turnData.shpenzime || []}
            isFieldDisabled={isFieldDisabled}
            onAdd={onShpenzimiAdd}
            onRemove={onShpenzimiRemove}
            onUpdate={onShpenzimiUpdate}
          />
        </CardContent>
      </Card>
    </div>
  );
};
