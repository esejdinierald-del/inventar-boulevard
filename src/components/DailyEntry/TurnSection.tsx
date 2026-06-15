import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TurnData, ProductData, ShpenzimiData } from "@/types/turn.types";
import { ProductTable } from "./ProductTable";
import { CoffeeTable } from "./CoffeeTable";
import { TurnExtras } from "./TurnExtras";
import { ShpenzimiTable } from "./ShpenzimiTable";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { CalculationService } from "@/services/calculations";
import { StockPropagationService } from "@/services/stock-propagation.service";
import { useDifStartDates } from "@/hooks/useDifStartDates";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TurnSectionProps {
  turnName: string;
  turnData: TurnData;
  products: string[];
  coffeeTypes: string[];
  /** Data aktuale e zgjedhur (YYYY-MM-DD) — për të llogaritur "Dif fillon". */
  selectedDate: string;
  alcoholicDrinks?: string[];
  isAdminUnlocked: boolean;
  isFieldDisabled: boolean;
  showCopyButton?: boolean;
  mulliriFillimDisabled?: boolean;
  isTurnLocked?: boolean;
  /** Kontrollon sfumimin e Stok Fillim & Dif për stafin. */
  gjendjeUploaded?: boolean;
  /** Kyçja 10-orëshe e kolonës Gjendje pas printit. */
  gjendjeLockedByPrint?: boolean;
  onConfirmGjendje?: () => void;
  onUnlockGjendje?: () => void;
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
}

export const TurnSection = ({
  turnName,
  turnData,
  products,
  coffeeTypes,
  selectedDate,
  alcoholicDrinks = [],
  isAdminUnlocked,
  isFieldDisabled,
  showCopyButton = false,
  mulliriFillimDisabled = false,
  isTurnLocked = false,
  gjendjeUploaded = true,
  gjendjeLockedByPrint = false,
  onConfirmGjendje,
  onUnlockGjendje,
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
}: TurnSectionProps) => {
  const { difStartDates } = useDifStartDates(products, selectedDate);
  return (
    <div className="space-y-4">
      {/* Products Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Produktet - Turni {turnName}</CardTitle>
          <div className="flex gap-2">
            <ReceiptScanner
              products={products}
              coffeeTypes={coffeeTypes}
              alcoholicDrinks={alcoholicDrinks}
              onDataExtracted={onReceiptData}
              turnName={turnName}
              turnData={turnData}
              calculateDif={CalculationService.calculateDif}
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
            gjendjeUploaded={gjendjeUploaded}
            gjendjeLockedByPrint={gjendjeLockedByPrint}
            onConfirmGjendje={onConfirmGjendje}
            onUnlockGjendje={onUnlockGjendje}
            onProductUpdate={onProductUpdate}
            onProductDelete={onProductDelete}
            difStartDates={difStartDates}
            onProductEdit={onProductEdit}
            onProductAdd={onProductAdd}
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
