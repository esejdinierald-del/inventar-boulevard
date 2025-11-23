import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Upload, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

interface ProductMappingManagerProps {
  products: string[];
}

interface ReceiptProduct {
  name: string;
  originalName: string;
}

export const ProductMappingManager = ({ products }: ProductMappingManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [detectedProducts, setDetectedProducts] = useState<ReceiptProduct[]>([]);
  const [productMapping, setProductMapping] = useState<{ [key: string]: string }>({});
  const [step, setStep] = useState<'upload' | 'mapping'>('upload');

  // Load saved mapping from localStorage
  const loadSavedMapping = () => {
    const saved = localStorage.getItem('receipt_product_mapping');
    if (saved) {
      const mapping = JSON.parse(saved);
      setProductMapping(mapping);
      toast.success("Mapimi i ruajtur u ngarkua!");
    }
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imagePromises = Array.from(files).map(file => {
      return new Promise<string>((resolve, reject) => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} është shumë e madhe! Maksimumi 5MB`);
          reject();
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const images = await Promise.all(imagePromises);
      setUploadedImages(images);
      toast.success(`${images.length} foto u ngarkuan!`);
    } catch (error) {
      console.error("Error uploading images:", error);
    }
  };

  const analyzeAllReceipts = async () => {
    if (uploadedImages.length === 0) {
      toast.error("Ngarko të paktën një foto!");
      return;
    }

    setIsProcessing(true);
    const allProducts = new Set<string>();

    try {
      toast.info(`Po analizon ${uploadedImages.length} shirita...`);

      for (let i = 0; i < uploadedImages.length; i++) {
        const image = uploadedImages[i];
        
        const { data, error } = await supabase.functions.invoke('analyze-receipt', {
          body: { imageBase64: image }
        });

        if (error) {
          console.error(`Error analyzing receipt ${i + 1}:`, error);
          continue;
        }

        if (data && data.items) {
          data.items.forEach((item: { name: string }) => {
            allProducts.add(item.name);
          });
        }

        toast.info(`Analizuar ${i + 1}/${uploadedImages.length} shirita...`);
      }

      const uniqueProducts: ReceiptProduct[] = Array.from(allProducts).map(name => ({
        name,
        originalName: name
      }));

      setDetectedProducts(uniqueProducts);
      setStep('mapping');
      toast.success(`U gjetën ${uniqueProducts.length} produkte unike!`);
    } catch (error) {
      console.error("Error analyzing receipts:", error);
      toast.error("Gabim gjatë analizimit të shiritave");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingChange = (receiptProduct: string, systemProduct: string) => {
    setProductMapping(prev => ({
      ...prev,
      [receiptProduct]: systemProduct
    }));
  };

  const saveMapping = () => {
    localStorage.setItem('receipt_product_mapping', JSON.stringify(productMapping));
    toast.success("Mapimi u ruajt me sukses!");
    setIsOpen(false);
    resetState();
  };

  const resetState = () => {
    setUploadedImages([]);
    setDetectedProducts([]);
    setProductMapping({});
    setStep('upload');
  };

  const handleClose = () => {
    setIsOpen(false);
    resetState();
  };

  const deleteMapping = () => {
    localStorage.removeItem('receipt_product_mapping');
    setProductMapping({});
    toast.success("Mapimi u fshi!");
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadSavedMapping();
            setIsOpen(true);
          }}
          className="text-xs"
        >
          <Upload className="h-3 w-3 mr-1" />
          ⚙️ Menaxho Mapimin
        </Button>
        {Object.keys(productMapping).length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={deleteMapping}
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
              Menaxhimi i Mapimit të Produkteve
              {step === 'upload' && " - Hapi 1: Ngarko Shirita"}
              {step === 'mapping' && " - Hapi 2: Mapo Produktet"}
            </DialogTitle>
          </DialogHeader>

          {step === 'upload' && (
            <div className="flex-1 space-y-4">
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label>Ngarko disa foto të shiritave për të krijuar listën e produkteve</Label>
                    <p className="text-xs text-muted-foreground">
                      AI do të analizojë të gjitha shiritat dhe do të krijojë një listë unike produktesh
                    </p>
                  </div>
                  
                  <label className="border-2 border-dashed rounded-lg p-8 text-center block cursor-pointer hover:bg-accent/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesUpload}
                      className="hidden"
                      disabled={isProcessing}
                    />
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      Kliko për të ngarkuar foto (mund të zgjedhësh shumë)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Maksimumi 5MB për foto - JPG, PNG
                    </p>
                  </label>

                  {uploadedImages.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {uploadedImages.length} foto u ngarkuan
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {uploadedImages.slice(0, 8).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt={`Receipt ${i + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                        ))}
                      </div>
                      {uploadedImages.length > 8 && (
                        <p className="text-xs text-muted-foreground">
                          +{uploadedImages.length - 8} foto të tjera...
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={analyzeAllReceipts}
                    disabled={isProcessing || uploadedImages.length === 0}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Po analizon...
                      </>
                    ) : (
                      <>Analizo Shiritat dhe Vazhdo →</>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {step === 'mapping' && (
            <div className="flex-1 space-y-4 overflow-hidden flex flex-col">
              <div>
                <Label>Mapo produktet e shiritit me produktet e sistemit</Label>
                <p className="text-xs text-muted-foreground">
                  U gjetën {detectedProducts.length} produkte unike nga shiritat. Zgjidh se cili produkt i shiritit korrespondon me cilën në sistem.
                </p>
              </div>

              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-2">
                  {detectedProducts.map((product, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-mono font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">Nga shiriti</p>
                      </div>
                      <div className="text-muted-foreground">→</div>
                      <select
                        value={productMapping[product.name] || ""}
                        onChange={(e) => handleMappingChange(product.name, e.target.value)}
                        className="text-sm border rounded p-2 min-w-[180px]"
                      >
                        <option value="">-- Zgjidh produktin --</option>
                        {products.map(p => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => setStep('upload')} variant="outline">
                  ← Kthehu
                </Button>
                <Button onClick={saveMapping} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Ruaj Mapimin
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
