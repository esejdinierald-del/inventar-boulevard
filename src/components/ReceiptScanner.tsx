import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Upload, Camera, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StorageService } from "@/services/storage.service";

interface ReceiptScannerProps {
  products: string[];
  coffeeTypes: string[];
  alcoholicDrinks?: string[];
  onDataExtracted: (
    productData: { [key: string]: number }, 
    coffeeData: { [key: string]: number },
    alcoholicDrinksData?: { [key: string]: number },
    total?: number
  ) => void;
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

export const ReceiptScanner = ({ products, coffeeTypes, alcoholicDrinks = [], onDataExtracted, turnName, turnData, calculateDif }: ReceiptScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [mappedData, setMappedData] = useState<{ [key: string]: { type: 'product' | 'coffee' | 'kitchen' | 'alcoholic_drink'; name: string; quantity: number } }>({});
  const [receiptItems, setReceiptItems] = useState<Array<{ name: string; quantity: number }>>([]);
  const [receiptTotal, setReceiptTotal] = useState<number | null>(null);
  const [showDifferenceWarning, setShowDifferenceWarning] = useState(false);
  const [differencesList, setDifferencesList] = useState<Array<{ product: string; dif: number }>>([]);

  // Check if there are any differences in current turn
  const getDifferences = () => {
    const diffs: Array<{ product: string; dif: number }> = [];
    Object.entries(turnData.products).forEach(([product, data]) => {
      const dif = calculateDif(data.stokFillim, data.furnizime, data.gjendje, data.shiriti);
      if (dif !== 0) {
        diffs.push({ product, dif });
      }
    });
    return diffs;
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
        
        // Save the receipt items and total for later use
        setReceiptItems(data.items);
        setReceiptTotal(data.total || null);

        // Build extracted text from AI response
        let text = "SHIRITI I SHITJEVE\n";
        text += "------------------------\n";
        text += "Emer          Sasia\n";
        text += "------------------------\n";
        
        // Load saved mapping from Supabase
        const mapping = await StorageService.getProductMapping() || {};
        
        data.items.forEach((item: { name: string; quantity: number }, index: number) => {
          text += `${item.name.padEnd(15)} ${item.quantity}\n`;
          
          // Use saved mapping if available
          if (mapping[item.name]) {
            // Handle both old format (string) and new format (object)
            const mappingValue = mapping[item.name];
            if (typeof mappingValue === 'string') {
              // Old format - assume it's a product with quantity 1
              setMappedData(prev => ({
                ...prev,
                [index.toString()]: { type: 'product', name: mappingValue, quantity: 1 }
              }));
            } else {
              // New format - ensure quantity exists
              setMappedData(prev => ({
                ...prev,
                [index.toString()]: { ...mappingValue, quantity: mappingValue.quantity || 1 }
              }));
            }
          } else {
            // Try smart matching for products
            const matchedProduct = products.find(p => 
              p.toLowerCase().includes(item.name.toLowerCase()) ||
              item.name.toLowerCase().includes(p.toLowerCase())
            );
            if (matchedProduct) {
              setMappedData(prev => ({
                ...prev,
                [index.toString()]: { type: 'product', name: matchedProduct, quantity: 1 }
              }));
            } else {
              // Try smart matching for coffee types
              const matchedCoffee = coffeeTypes.find(c => 
                c.toLowerCase().includes(item.name.toLowerCase()) ||
                item.name.toLowerCase().includes(c.toLowerCase())
              );
              if (matchedCoffee) {
                setMappedData(prev => ({
                  ...prev,
                  [index.toString()]: { type: 'coffee', name: matchedCoffee, quantity: 1 }
                }));
              } else {
                // Try smart matching for alcoholic drinks
                const matchedDrink = alcoholicDrinks.find(d => 
                  d.toLowerCase().includes(item.name.toLowerCase()) ||
                  item.name.toLowerCase().includes(d.toLowerCase())
                );
                if (matchedDrink) {
                  setMappedData(prev => ({
                    ...prev,
                    [index.toString()]: { type: 'alcoholic_drink', name: matchedDrink, quantity: 1 }
                  }));
                }
              }
            }
          }
        });
        
        text += "------------------------\n";
        if (data.total) {
          text += `TOTALI: ${data.total.toFixed(2)} ALL\n`;
          text += "------------------------\n";
        }
        
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

  const handleMapProduct = (lineNumber: string, type: 'product' | 'coffee' | 'kitchen' | 'alcoholic_drink', name: string, quantity: number) => {
    setMappedData(prev => ({
      ...prev,
      [lineNumber]: { type, name, quantity }
    }));
  };

  const proceedWithApply = () => {
    try {
      // Use the stored receipt items instead of making another API call
      if (!receiptItems || receiptItems.length === 0) {
        console.error("❌ No receipt items");
        toast.error("Nuk ka të dhëna për t'u ngarkuar");
        return;
      }

      const productData: { [key: string]: number } = {};
      const coffeeData: { [key: string]: number } = {};
      const alcoholicDrinksData: { [key: string]: number } = {};
      let unmappedCount = 0;
      
      receiptItems.forEach((item: { name: string; quantity: number }, index: number) => {
        const mapping = mappedData[index.toString()];
        console.log(`Item ${index}: ${item.name} -> ${mapping ? `${mapping.type}:${mapping.name} x${mapping.quantity}` : 'IGNORED'}`);
        
        if (mapping) {
          const adjustedQuantity = item.quantity * (mapping.quantity || 1);
          if (mapping.type === 'product') {
            productData[mapping.name] = (productData[mapping.name] || 0) + adjustedQuantity;
          } else if (mapping.type === 'coffee') {
            coffeeData[mapping.name] = (coffeeData[mapping.name] || 0) + adjustedQuantity;
          } else if (mapping.type === 'alcoholic_drink') {
            alcoholicDrinksData[mapping.name] = (alcoholicDrinksData[mapping.name] || 0) + adjustedQuantity;
          }
        } else {
          unmappedCount++;
        }
      });

      console.log("Final product data:", productData);
      console.log("Final coffee data:", coffeeData);
      console.log("Final alcoholic drinks data:", alcoholicDrinksData);
      console.log("Unmapped/ignored items:", unmappedCount);
      console.log("Receipt total:", receiptTotal);

      if (Object.keys(productData).length > 0 || Object.keys(coffeeData).length > 0 || Object.keys(alcoholicDrinksData).length > 0) {
        console.log("✅ Calling onDataExtracted with product, coffee, alcoholic drinks data and total");
        onDataExtracted(productData, coffeeData, alcoholicDrinksData, receiptTotal || undefined);
        const total = Object.keys(productData).length + Object.keys(coffeeData).length + Object.keys(alcoholicDrinksData).length;
        let message = unmappedCount > 0 
          ? `${total} artikuj u ngarkuan (${unmappedCount} të pamapuar u injoruan)`
          : `${total} artikuj u ngarkuan!`;
        
        if (receiptTotal) {
          message += ` - Xhiro: ${receiptTotal.toFixed(2)} ALL`;
        }
        
        toast.success(message);
        setIsOpen(false);
        resetState();
      } else {
        console.error("❌ No data to apply");
        toast.error("Asnjë artikull i mapuar për t'u ngarkuar");
      }
    } catch (error) {
      console.error("Error applying data:", error);
      toast.error("Gabim gjatë aplikimit të të dhënave");
    }
  };

  const handleApplyData = () => {
    console.log("🔍 handleApplyData called");
    console.log("receiptItems:", receiptItems);
    console.log("mappedData:", mappedData);
    
    // Check for differences before applying
    const diffs = getDifferences();
    if (diffs.length > 0) {
      setDifferencesList(diffs);
      setShowDifferenceWarning(true);
      return;
    }

    // No differences, proceed directly
    proceedWithApply();
  };

  const resetState = () => {
    setSelectedImage(null);
    setExtractedText("");
    setMappedData({});
    setReceiptItems([]);
    setReceiptTotal(null);
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

      <AlertDialog open={showDifferenceWarning} onOpenChange={setShowDifferenceWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Paralajmërim - Ka Diferenca!
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>Ka diferenca në shiriti aktual që duhet të kontrollohen:</p>
                <div className="bg-orange-50 border border-orange-200 rounded p-3 max-h-48 overflow-y-auto">
                  {differencesList.map(({ product, dif }) => (
                    <div key={product} className="flex justify-between py-1 text-sm">
                      <span className="font-medium">{product}:</span>
                      <span className={`font-bold ${dif > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {dif > 0 ? '+' : ''}{dif}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium">
                  ⚠️ Rekomandohet të kontrollosh diferencat para se të ngarkosh shiriti të ri.
                </p>
                <p className="text-xs text-muted-foreground">
                  Nëse vazhdon, shiriti i ri do të ngarkohet edhe pse ka diferenca.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulo - Kontrollo Diferencat</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowDifferenceWarning(false);
                proceedWithApply();
              }}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Vazhdo Sidoqoftë
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Ngarko dhe Analizо Shiriti - {turnName}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <div className="space-y-4 p-1">
            {/* Image upload section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Hapi 1: Ngarko Foton</Label>
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
                <div className="space-y-2 mt-4">
                  <Label>Teksti i Lexuar:</Label>
                  <ScrollArea className="h-32 border rounded p-2">
                    <pre className="text-xs whitespace-pre-wrap">{extractedText}</pre>
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Product mapping section */}
            {extractedText && (
              <div className="space-y-4 mt-6 pt-6 border-t">
                <div>
                  <Label className="text-base font-semibold">Hapi 2: Mapo Produktet (Opsionale)</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Mapo vetëm produktet që dëshiron të gjurmosh. Të tjerët do të injiorohen.
                  </p>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
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
                        if (startCapturing && line.trim() && !line.includes('---') && !line.includes('TOTALI')) {
                          productLines.push(line);
                        }
                      }
                      
                      return productLines.map((line, index) => {
                        const mapping = mappedData[index.toString()];
                        const isMapped = !!mapping;
                        const currentValue = mapping ? `${mapping.type}:${mapping.name}` : "";
                        
                        return (
                          <div key={index} className="space-y-2 p-3 border rounded bg-card">
                            <div className="text-xs font-mono bg-muted p-2 rounded">
                              {line}
                            </div>
                            <div className="flex gap-2">
                              <select
                                value={currentValue}
                            onChange={(e) => {
                              const val = e.target.value;
                              const colonIdx = val.indexOf(':');
                              if (colonIdx === -1) return;
                              const type = val.substring(0, colonIdx);
                              const name = val.substring(colonIdx + 1);
                              if (type && name) {
                                const currentQuantity = mapping?.quantity || 1;
                                handleMapProduct(index.toString(), type as 'product' | 'coffee' | 'alcoholic_drink', name, currentQuantity);
                              }
                            }}
                                className={`flex-1 text-sm border rounded p-2 ${
                                  isMapped ? 'border-green-500 bg-green-50' : 'border-orange-500'
                                }`}
                              >
                                <option value="">⚪ Injoro (mos e mapo)</option>
                                <optgroup label="📦 Produkte">
                                  {products.map(product => (
                                    <option key={product} value={`product:${product}`}>
                                      {product}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="☕ Kafe">
                                  {coffeeTypes.map(coffee => (
                                    <option key={coffee} value={`coffee:${coffee}`}>
                                      {coffee}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="🍸 Pijet Alkoolike">
                                  {alcoholicDrinks.map(drink => (
                                    <option key={drink} value={`alcoholic_drink:${drink}`}>
                                      {drink}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                              {isMapped && (
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={mapping.quantity || 1}
                                  onChange={(e) => {
                                    const quantity = parseFloat(e.target.value) || 1;
                                    handleMapProduct(index.toString(), mapping.type, mapping.name, quantity);
                                  }}
                                  className="w-20 text-sm"
                                  placeholder="Sasi"
                                />
                              )}
                            </div>
                            {isMapped && (
                              <div className="text-xs text-green-600">
                                ✓ {mapping.type === 'product' ? '📦 Produkt' : mapping.type === 'coffee' ? '☕ Kafe' : '🍸 Pije Alkoolike'}: {mapping.name} x{mapping.quantity}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                </div>

                <div className="sticky bottom-0 bg-background pt-4 pb-2 border-t mt-4">
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleApplyData} 
                      className="flex-1 h-12 text-base"
                      disabled={isProcessing}
                    >
                      ✓ Apliko të Dhënat
                    </Button>
                    <Button 
                      onClick={handleClose} 
                      variant="outline"
                      className="h-12"
                    >
                      Anulo
                    </Button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
