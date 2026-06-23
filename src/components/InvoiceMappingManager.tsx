import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Trash2 } from "lucide-react";
import { MappingData } from "@/types/mapping.types";
import { useInvoiceMappings } from "@/hooks/useInvoiceMappings";
import { InvoiceUploadStep } from "./InvoiceMapping/InvoiceUploadStep";
import { InvoiceMappingStep } from "./InvoiceMapping/InvoiceMappingStep";

interface InvoiceMappingManagerProps {
  products: string[];
  kitchenProducts: string[];
  alcoholicDrinks?: string[];
  isAdmin?: boolean;
  /**
   * Turni në të cilin do të aplikohen furnizimet. Kapet **kur përdoruesi hap
   * dialogun** — nuk varet nga `activeTurn` global, kështu që ndryshimi i tab-it
   * pas hapjes nuk e ridrejton faturën në turnin gabim.
   */
  targetTurn?: "turn1" | "turn2";
  onApplySupplies?: (mapping: MappingData, targetTurn?: "turn1" | "turn2") => void;
}

export const InvoiceMappingManager = ({ 
  products, 
  kitchenProducts, 
  alcoholicDrinks = [], 
  isAdmin = false, 
  targetTurn,
  onApplySupplies 
}: InvoiceMappingManagerProps) => {
  const {
    isOpen,
    isProcessing,
    uploadedImages,
    detectedProducts,
    invoiceMapping,
    invoiceTotal,
    step,
    setStep,
    handleImagesUpload,
    analyzeAllInvoices,
    handleMappingChange,
    handleQuantityChange,
    handleInvoiceQuantityChange,
    saveMapping,
    applySupplies,
    deleteMapping,
    handleOpen,
    handleClose,
  } = useInvoiceMappings();

  const handleSave = async () => {
    const success = await saveMapping(isAdmin);
    if (success) {
      handleClose();
    }
  };

  const handleApply = () => {
    // `targetTurn` mbahet konstant për gjithë jetën e dialogut.
    const success = applySupplies(
      onApplySupplies
        ? (mapping) => onApplySupplies(mapping, targetTurn)
        : undefined
    );
    if (success) {
      handleClose();
    }
  };


  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpen}
          className="text-xs"
        >
          <Upload className="h-3 w-3 mr-1" />
          📦 Ngarko Furnizime
        </Button>
        {isAdmin && Object.keys(invoiceMapping).length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm('⚠️ Je i sigurt? Kjo do të fshijë TË GJITHA mapinget e faturave. Veprimi nuk mund të zhbëhet.')) {
                deleteMapping(isAdmin);
              }
            }}
            className="text-xs text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Fshi Mapimin
          </Button>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Menaxhimi i Mapimit të Faturave të Blerjes
              {step === 'upload' && " - Hapi 1: Ngarko Fatura"}
              {step === 'mapping' && " - Hapi 2: Mapo Produktet"}
            </DialogTitle>
          </DialogHeader>

          {step === 'upload' && (
            <InvoiceUploadStep
              uploadedImages={uploadedImages}
              isProcessing={isProcessing}
              onImagesUpload={handleImagesUpload}
              onAnalyze={analyzeAllInvoices}
            />
          )}

          {step === 'mapping' && (
            <InvoiceMappingStep
              detectedProducts={detectedProducts}
              invoiceMapping={invoiceMapping}
              invoiceTotal={invoiceTotal}
              products={products}
              kitchenProducts={kitchenProducts}
              alcoholicDrinks={alcoholicDrinks}
              isAdmin={isAdmin}
              onMappingChange={handleMappingChange}
              onQuantityChange={handleQuantityChange}
              onInvoiceQuantityChange={handleInvoiceQuantityChange}
              onSave={handleSave}
              onApply={handleApply}
              onBack={() => setStep('upload')}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
