import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TurnData, ProductData } from "@/types/turn.types";
import { ProductTable } from "./ProductTable";
import { CoffeeTable } from "./CoffeeTable";
import { TurnExtras } from "./TurnExtras";
import { AddProductRow } from "./AddProductRow";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { CalculationService } from "@/services/calculations";

interface TurnSectionProps {
  turnName: string;
  turnData: TurnData;
  products: string[];
  coffeeTypes: string[];
  isAdminUnlocked: boolean;
  isFieldDisabled: boolean;
  showCopyButton?: boolean;
  mulliriFillimDisabled?: boolean;
  onProductUpdate: (product: string, field: keyof ProductData, value: number) => void;
  onCoffeeUpdate: (coffee: string, value: number) => void;
  onTurnUpdate: (field: keyof TurnData, value: number) => void;
  onMulliriPerfundUpdate?: (value: number) => void;
  onCopyToNextTurn?: () => void;
  onReceiptData: (productData: { [key: string]: number }, coffeeData: { [key: string]: number }) => void;
  onProductDelete?: (product: string) => void | Promise<void>;
  onProductAdd?: (productName: string) => boolean | Promise<boolean>;
  onProductEdit?: (product: string) => void;
  editingProduct: string | null;
  editedProductName: string;
  onEditedNameChange: (name: string) => void;
  onSaveEdit: (oldName: string) => void;
  onCancelEdit: () => void;
}

export const TurnSection = ({
  turnName,
  turnData,
  products,
  coffeeTypes,
  isAdminUnlocked,
  isFieldDisabled,
  showCopyButton = false,
  mulliriFillimDisabled = false,
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
}: TurnSectionProps) => {
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
            onProductUpdate={onProductUpdate}
            onProductDelete={onProductDelete}
            onProductEdit={onProductEdit}
            editingProduct={editingProduct}
            editedProductName={editedProductName}
            onEditedNameChange={onEditedNameChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
          />
          {isAdminUnlocked && onProductAdd && (
            <table className="w-full">
              <tbody>
                <AddProductRow onAdd={onProductAdd} colSpan={7} />
              </tbody>
            </table>
          )}
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
            onUpdate={onTurnUpdate}
            onMulliriPerfundUpdate={onMulliriPerfundUpdate}
          />
        </CardContent>
      </Card>
    </div>
  );
};
