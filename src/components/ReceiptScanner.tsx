import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Upload, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReceiptScannerProps {
  products: string[];
  onDataExtracted: (data: { [key: string]: number }) => void;
  turnName: string;
  turnData: {
    products: {
      [key: string]: {
        stokFillim: number;
        gjendje: number;
        shiriti: number;
        furnizime: number;
      };
    };
  };
  calculateDif: (stokFillim: number, furnizime: number, gjendje: number, shiriti: number) => number;
}

export const ReceiptScanner = ({ products, onDataExtracted, turnName, turnData, calculateDif }: ReceiptScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [mappedData, setMappedData] = useState<{ [key: string]: string }>({});

  // Check if there are any differences in current turn
  const hasAnyDifferences = () => {
    return Object.entries(turnData.products).some(([_, data]) => {
      const dif = calculateDif(data.stokFillim, data.furnizime, data.gjendje, data.shiriti);
      return dif !== 0;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fotoja është shumë e madhe! Maksimumi 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      setSelectedImage(imageData);
      setIsProcessing(true);

      try {
        toast.info("Po analizon foton... Kjo mund të marrë disa sekonda.");
        
        // Call the edge function to analyze the receipt
        const { data, error } = await supabase.functions.invoke('analyze-receipt', {
          body: { imageBase64: imageData }
        });

        if (error) {
          console.error("Error calling analyze-receipt:", error);
          throw new Error(error.message || "Failed to analyze receipt");
        }

        if (!data || !data.items || !Array.isArray(data.items)) {
          throw new Error("Invalid response from AI");
        }

      console.log("Receipt data:", data);

        // Build extracted text from AI response
        let text = "SHIRITI I SHITJEVE\n";
        text += "------------------------\n";
        text += "Emer          Sasia\n";
        text += "------------------------\n";
        
        // Load saved mapping
        const savedMapping = localStorage.getItem('receipt_product_mapping');
        const mapping = savedMapping ? JSON.parse(savedMapping) : {};
        
        data.items.forEach((item: { name: string; quantity: number }, index: number) => {
          text += `${item.name.padEnd(15)} ${item.quantity}\n`;
          
          // Use saved mapping if available, otherwise try smart matching
          if (mapping[item.name]) {
            setMappedData(prev => ({
              ...prev,
              [index.toString()]: mapping[item.name]
            }));
          } else {
            // Fallback to smart matching
            const matchedProduct = products.find(p => 
              p.toLowerCase().includes(item.name.toLowerCase()) ||
              item.name.toLowerCase().includes(p.toLowerCase())
            );
            if (matchedProduct) {
              setMappedData(prev => ({
                ...prev,
                [index.toString()]: matchedProduct
              }));
            }
          }
        });
        
        text += "------------------------\n";
        
        setExtractedText(text);
        toast.success("Fotoja u analizua me sukses!");
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error(error instanceof Error ? error.message : "Gabim gjatë analizimit të fotos");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMapProduct = (lineNumber: string, productName: string) => {
    setMappedData(prev => ({
      ...prev,
      [lineNumber]: productName
    }));
  };

  const handleApplyData = async () => {
    // Check for differences before applying
    if (hasAnyDifferences()) {
      toast.error("⚠️ Ka diferenca në shiriti aktual! Të gjitha diferencat duhet të jenë 0 para se të ngarkosh shiriti të ri.");
      return;
    }

    try {
      // Get the AI response data stored in state
      const { data: aiData, error } = await supabase.functions.invoke('analyze-receipt', {
        body: { imageBase64: selectedImage }
      });

      if (error || !aiData || !aiData.items) {
        toast.error("Gabim gjatë leximit të të dhënave");
        return;
      }

      const data: { [key: string]: number } = {};
      let hasUnmapped = false;
      
      aiData.items.forEach((item: { name: string; quantity: number }, index: number) => {
        const productName = mappedData[index.toString()];
        if (productName) {
          data[productName] = item.quantity;
        } else {
          hasUnmapped = true;
        }
      });

      if (hasUnmapped) {
        toast.error("Duhet të maposh të gjitha produktet para se të aplikosh!");
        return;
      }

      if (Object.keys(data).length > 0) {
        onDataExtracted(data);
        toast.success(`${Object.keys(data).length} produkte u ngarkuan!`);
        setIsOpen(false);
        resetState();
      } else {
        toast.error("Nuk u gjetën të dhëna për t'u ngarkuar");
      }
    } catch (error) {
      console.error("Error applying data:", error);
      toast.error("Gabim gjatë aplikimit të të dhënave");
    }
  };

  const resetState = () => {
    setSelectedImage(null);
    setExtractedText("");
    setMappedData({});
  };

  const handleClose = () => {
    setIsOpen(false);
    resetState();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs"
      >
        <Camera className="h-3 w-3 mr-1" />
        📸 Ngarko Shiriti {turnName}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Ngarko dhe Analizо Shiriti - {turnName}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left side - Image upload */}
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {!selectedImage ? (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isProcessing}
                    />
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Kliko për të ngarkuar foton e shiritit
                      </p>
                      <p className="text-xs text-muted-foreground">
                        (Maksimumi 5MB - JPG, PNG)
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Receipt"
                      className="w-full h-auto rounded"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {extractedText && (
                <div className="space-y-2">
                  <Label>Teksti i Lexuar:</Label>
                  <ScrollArea className="h-48 border rounded p-2">
                    <pre className="text-xs whitespace-pre-wrap">{extractedText}</pre>
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Right side - Product mapping */}
            {extractedText && (
              <div className="space-y-4">
                <div>
                  <Label>Lidh Produktet me Rreshtat:</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Zgjidh se cili produkt përputhet me cilën rresht në shiriti
                  </p>
                </div>

                <ScrollArea className="h-96">
                  <div className="space-y-2 pr-4">
                    {(() => {
                      // Only show product lines (skip headers and separators)
                      const lines = extractedText.split('\n');
                      const productLines: string[] = [];
                      let startCapturing = false;
                      
                      for (const line of lines) {
                        if (line.includes('Emer') && line.includes('Sasia')) {
                          startCapturing = true;
                          continue;
                        }
                        if (startCapturing && line.trim() && !line.includes('---')) {
                          productLines.push(line);
                        }
                      }
                      
                      return productLines.map((line, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <div className="flex-1 text-sm font-mono bg-muted p-2 rounded">
                            {line}
                          </div>
                          <select
                            value={mappedData[index.toString()] || ""}
                            onChange={(e) => handleMapProduct(index.toString(), e.target.value)}
                            className="text-xs border rounded p-1 min-w-[120px]"
                          >
                            <option value="">-- Zgjidh --</option>
                            {products.map(product => (
                              <option key={product} value={product}>
                                {product}
                              </option>
                            ))}
                          </select>
                        </div>
                      ));
                    })()}
                  </div>
                </ScrollArea>

                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleApplyData} className="flex-1">
                    ✓ Apliko të Dhënat
                  </Button>
                  <Button onClick={handleClose} variant="outline">
                    Anulo
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
