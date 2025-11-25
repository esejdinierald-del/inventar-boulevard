import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Upload, Save, Trash2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { AdminPasswordDialog } from "@/components/DailyEntry/AdminPasswordDialog";
import { StorageService } from "@/services/storage.service";
import { MappingData } from "@/types/mapping.types";

interface InvoiceMappingManagerProps {
  products: string[];
  coffeeTypes: string[];
  kitchenProducts: string[];
  alcoholicDrinks?: string[];
  isAdmin?: boolean;
  onApplySupplies?: (mapping: MappingData) => void;
}

interface InvoiceProduct {
  name: string;
  originalName: string;
}

// Normalizo emrin e produktit për matching më të mirë
const normalizeProductName = (name: string): string => {
  return name
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ')  // Zëvendëso hapësira të shumta me një
    .replace(/\s*(E|I|TE)\s*\d+\s*(CP|GR|ML|KG|L|PCS|COPE|COPË)?\s*$/i, '')  // Heq paketimin në fund
    .replace(/\s*(NGA|ME|PA|PER|PRO)\s+.*$/i, '')  // Heq detaje shtesë
    .trim();
};

// Gjej mapping më të mirë për një produkt
const findBestMapping = (productName: string, savedMapping: MappingData | null) => {
  if (!savedMapping) return null;
  
  const normalized = normalizeProductName(productName);
  
  // Provo match të saktë së pari
  if (savedMapping[productName]) {
    return savedMapping[productName];
  }
  
  // Provo match me emrin e normalizuar
  for (const [key, value] of Object.entries(savedMapping)) {
    if (normalizeProductName(key) === normalized) {
      return value;
    }
  }
  
  // Provo partial match
  for (const [key, value] of Object.entries(savedMapping)) {
    const normalizedKey = normalizeProductName(key);
    if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
      return value;
    }
  }
  
  return null;
};

export const InvoiceMappingManager = ({ products, coffeeTypes, kitchenProducts, alcoholicDrinks = [], isAdmin = false, onApplySupplies }: InvoiceMappingManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [detectedProducts, setDetectedProducts] = useState<InvoiceProduct[]>([]);
  const [invoiceMapping, setInvoiceMapping] = useState<{ [key: string]: { type: 'product' | 'coffee' | 'kitchen' | 'alcoholic_drink'; name: string } }>({});
  const [step, setStep] = useState<'upload' | 'mapping'>('upload');

  const loadSavedMapping = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_mappings')
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const mapping: typeof invoiceMapping = {};
        data.forEach(item => {
          mapping[item.invoice_name] = {
            type: item.product_type as 'product' | 'coffee' | 'kitchen' | 'alcoholic_drink',
            name: item.product_name
          };
        });
        setInvoiceMapping(mapping);
        toast.success("Mapimi i faturave u ngarkua!");
      }
    } catch (error) {
      console.error("Error loading invoice mapping:", error);
      toast.error("Gabim gjatë ngarkimit të mapimit");
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

  const analyzeAllInvoices = async () => {
    if (uploadedImages.length === 0) {
      toast.error("Ngarko të paktën një foto!");
      return;
    }

    setIsProcessing(true);
    const allProducts = new Set<string>();

    try {
      toast.info(`Po analizon ${uploadedImages.length} fatura...`);

      for (let i = 0; i < uploadedImages.length; i++) {
        const image = uploadedImages[i];
        
        const { data, error } = await supabase.functions.invoke('analyze-invoice', {
          body: { imageBase64: image }
        });

        if (error) {
          console.error(`Error analyzing invoice ${i + 1}:`, error);
          continue;
        }

        if (data && data.success && data.data && data.data.items) {
          data.data.items.forEach((item: { name: string }) => {
            allProducts.add(item.name);
          });
        }

        toast.info(`Analizuar ${i + 1}/${uploadedImages.length} fatura...`);
      }

      const uniqueProducts: InvoiceProduct[] = Array.from(allProducts).map(name => ({
        name,
        originalName: name
      }));

      setDetectedProducts(uniqueProducts);
      
      // Ngarko mappings e ruajtura nga databaza dhe apliko automatikisht me fuzzy matching
      const { data: savedMappingsData } = await supabase
        .from('invoice_mappings')
        .select('*');
      
      let savedMapping: typeof invoiceMapping | null = null;
      if (savedMappingsData && savedMappingsData.length > 0) {
        savedMapping = {};
        savedMappingsData.forEach(item => {
          savedMapping![item.invoice_name] = {
            type: item.product_type as 'product' | 'coffee' | 'kitchen' | 'alcoholic_drink',
            name: item.product_name
          };
        });
      }
      
      if (savedMapping) {
        const autoMapped: typeof invoiceMapping = {};
        const matchedProducts: string[] = [];
        
        uniqueProducts.forEach(product => {
          const bestMatch = findBestMapping(product.name, savedMapping);
          if (bestMatch) {
            autoMapped[product.name] = bestMatch;
            matchedProducts.push(product.name);
          }
        });
        
        setInvoiceMapping(autoMapped);
        
        const mappedCount = matchedProducts.length;
        if (mappedCount > 0) {
          toast.success(`U gjetën ${uniqueProducts.length} produkte! ${mappedCount} u mapuan automatikisht.`, {
            description: matchedProducts.slice(0, 3).join(", ") + (mappedCount > 3 ? "..." : "")
          });
        } else {
          toast.info(`U gjetën ${uniqueProducts.length} produkte unike, por asnjë nuk është i mapuar.`);
        }
      } else {
        toast.info(`U gjetën ${uniqueProducts.length} produkte unike. Admini duhet të krijojë mapping.`);
      }
      
      setStep('mapping');
    } catch (error) {
      console.error("Error analyzing invoices:", error);
      toast.error("Gabim gjatë analizimit të faturave");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingChange = (invoiceProduct: string, type: 'product' | 'coffee' | 'kitchen' | 'alcoholic_drink', name: string) => {
    const newMapping = {
      ...invoiceMapping,
      [invoiceProduct]: { type, name }
    };
    console.log('Mapping changed:', { invoiceProduct, type, name });
    console.log('New mapping state:', newMapping);
    setInvoiceMapping(newMapping);
  };

  const saveMapping = async () => {
    console.log("=== SAVE MAPPING CALLED ===");
    console.log("isAdmin:", isAdmin);
    console.log("invoiceMapping:", invoiceMapping);
    console.log("Mapping entries count:", Object.keys(invoiceMapping).length);
    
    if (!isAdmin) {
      console.error("User is not admin!");
      toast.error("Vetëm admin mund të ruajë mapimin!");
      return;
    }
    
    if (Object.keys(invoiceMapping).length === 0) {
      console.error("No mappings to save!");
      toast.error("Nuk ka asnjë mapping për të ruajtur!");
      return;
    }
    
    try {
      // Konverto mapping object në array për insert
      const mappingsToInsert = Object.entries(invoiceMapping).map(([invoiceName, mapping]) => ({
        invoice_name: invoiceName,
        product_type: mapping.type,
        product_name: mapping.name
      }));
      
      console.log("Inserting mappings:", mappingsToInsert);
      
      // Fshij mappings ekzistuese dhe shto të rejat
      const { error: deleteError } = await supabase
        .from('invoice_mappings')
        .delete()
        .in('invoice_name', Object.keys(invoiceMapping));
      
      if (deleteError) throw deleteError;
      
      const { error: insertError } = await supabase
        .from('invoice_mappings')
        .insert(mappingsToInsert);
      
      if (insertError) throw insertError;
      
      console.log("Successfully saved mapping!");
      toast.success("Mapimi i faturave u ruajt me sukses!");
      setIsOpen(false);
      resetState();
    } catch (error) {
      console.error("Error saving invoice mapping:", error);
      toast.error("Gabim gjatë ruajtjes së mapimit: " + (error as Error).message);
    }
  };

  const applySupplies = async () => {
    const mappedProducts = detectedProducts.filter(p => invoiceMapping[p.name]);
    if (mappedProducts.length === 0) {
      toast.error("Nuk ka produkte të mapuara për t'u aplikuar!");
      return;
    }

    if (onApplySupplies) {
      onApplySupplies(invoiceMapping);
    }

    toast.success(`${mappedProducts.length} produkte u aplikuan në stok!`, {
      description: mappedProducts.map(p => 
        `${invoiceMapping[p.name].name}`
      ).join(", ")
    });
    setIsOpen(false);
    resetState();
  };

  const resetState = () => {
    setUploadedImages([]);
    setDetectedProducts([]);
    setInvoiceMapping({});
    setStep('upload');
  };

  const handleClose = () => {
    setIsOpen(false);
    resetState();
  };

  const deleteMapping = async () => {
    if (!isAdmin) {
      toast.error("Vetëm admin mund të fshijë mapimin!");
      return;
    }
    try {
      const { error } = await supabase
        .from('invoice_mappings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Fshij të gjitha
      
      if (error) throw error;
      
      setInvoiceMapping({});
      toast.success("Të gjitha mapingjet u fshinë!");
    } catch (error) {
      console.error("Error deleting invoice mapping:", error);
      toast.error("Gabim gjatë fshirjes së mapimit");
    }
  };

  const handleOpenClick = async () => {
    await loadSavedMapping();
    setIsOpen(true);
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenClick}
          className="text-xs"
        >
          <Upload className="h-3 w-3 mr-1" />
          📦 Ngarko Furnizime
        </Button>
        {isAdmin && Object.keys(invoiceMapping).length > 0 && (
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
              Menaxhimi i Mapimit të Faturave të Blerjes
              {step === 'upload' && " - Hapi 1: Ngarko Fatura"}
              {step === 'mapping' && " - Hapi 2: Mapo Produktet"}
            </DialogTitle>
          </DialogHeader>

          {step === 'upload' && (
            <div className="flex-1 space-y-4">
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label>Ngarko disa foto të faturave për të krijuar listën e produkteve</Label>
                    <p className="text-xs text-muted-foreground">
                      AI do të analizojë të gjitha faturat dhe do të krijojë një listë unike produktesh
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
                            alt={`Invoice ${i + 1}`}
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
                    onClick={analyzeAllInvoices}
                    disabled={isProcessing || uploadedImages.length === 0}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Po analizon...
                      </>
                    ) : (
                      <>Analizo Faturat dhe Vazhdo →</>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {step === 'mapping' && (
            <div className="flex-1 space-y-4 overflow-hidden flex flex-col">
              <div className="flex-shrink-0">
                <Label>Mapo produktet nga fatura me artikujt e sistemit</Label>
                <p className="text-xs text-muted-foreground">
                  U gjetën {detectedProducts.length} artikuj unikë nga faturat. Zgjidh se cili artikull i faturës korrespondon me produktet në sistem.
                </p>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {detectedProducts.map((product, index) => {
                    const mapping = invoiceMapping[product.name];
                    const currentValue = mapping ? `${mapping.type}:${mapping.name}` : "";
                    
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded">
                        <div className="flex-1">
                          <p className="text-sm font-mono font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">Nga fatura</p>
                        </div>
                        <div className="text-muted-foreground">→</div>
                        <div className="flex gap-2 items-center">
                          <select
                            value={currentValue}
                            onChange={(e) => {
                              const [type, name] = e.target.value.split(':');
                              if (type && name) {
                                handleMappingChange(product.name, type as 'product' | 'coffee' | 'kitchen' | 'alcoholic_drink', name);
                              }
                            }}
                            className="text-sm border rounded p-2 min-w-[200px]"
                            disabled={!isAdmin}
                          >
                            <option value="">-- Zgjidh --</option>
                            <optgroup label="📦 Produkte">
                              {products.map(p => (
                                <option key={p} value={`product:${p}`}>
                                  {p}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="☕ Kafe">
                              {coffeeTypes.map(c => (
                                <option key={c} value={`coffee:${c}`}>
                                  {c}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="🍳 Kuzhinë">
                              {kitchenProducts.map(k => (
                                <option key={k} value={`kitchen:${k}`}>
                                  {k}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="🍸 Pijet Alkoolike">
                              {alcoholicDrinks.map(d => (
                                <option key={d} value={`alcoholic_drink:${d}`}>
                                  {d}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                          {mapping && (
                            <span className="text-xs text-green-600 whitespace-nowrap">
                              ✓ {mapping.type === 'product' ? '📦' : mapping.type === 'coffee' ? '☕' : mapping.type === 'kitchen' ? '🍳' : '🍸'} {mapping.name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="rounded-lg border border-info/50 bg-info/10 p-3">
                <p className="text-sm">
                  {isAdmin 
                    ? "💡 Mund të modifikosh mappings dhe të aplikosh furnizime në stok."
                    : `✓ ${detectedProducts.filter(p => invoiceMapping[p.name]).length} produkte janë tashmë të mapuara dhe gati për t'u aplikuar në stok.`
                  }
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => setStep('upload')} variant="outline">
                  ← Kthehu
                </Button>
                {isAdmin ? (
                  <Button onClick={saveMapping} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Ruaj Mapimin
                  </Button>
                ) : (
                  <Button 
                    onClick={applySupplies} 
                    className="flex-1"
                    disabled={detectedProducts.filter(p => invoiceMapping[p.name]).length === 0}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Apliko Furnizime ({detectedProducts.filter(p => invoiceMapping[p.name]).length})
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
