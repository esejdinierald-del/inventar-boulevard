import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Upload } from "lucide-react";

interface InvoiceProduct {
  name: string;
  originalName: string;
}

interface InvoiceMapping {
  [key: string]: {
    type: 'product' | 'kitchen' | 'alcoholic_drink';
    name: string;
    quantity: number;
  };
}

interface InvoiceMappingStepProps {
  detectedProducts: InvoiceProduct[];
  invoiceMapping: InvoiceMapping;
  products: string[];
  kitchenProducts: string[];
  alcoholicDrinks: string[];
  isAdmin: boolean;
  onMappingChange: (product: string, type: 'product' | 'kitchen' | 'alcoholic_drink', name: string) => void;
  onQuantityChange: (product: string, quantity: number) => void;
  onSave: () => void;
  onApply: () => void;
  onBack: () => void;
}

export const InvoiceMappingStep = ({
  detectedProducts,
  invoiceMapping,
  products,
  kitchenProducts,
  alcoholicDrinks,
  isAdmin,
  onMappingChange,
  onQuantityChange,
  onSave,
  onApply,
  onBack,
}: InvoiceMappingStepProps) => {
  const mappedCount = detectedProducts.filter(p => invoiceMapping[p.name]).length;

  return (
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
                <div className="flex gap-2 items-center flex-1">
                  <select
                    value={currentValue}
                    onChange={(e) => {
                      const [type, name] = e.target.value.split(':');
                      if (type && name) {
                        onMappingChange(product.name, type as 'product' | 'kitchen' | 'alcoholic_drink', name);
                      }
                    }}
                    className="text-sm border rounded p-2 flex-1"
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
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs whitespace-nowrap">Sasia:</Label>
                        <Input
                          type="number"
                          min="1"
                          value={mapping.quantity}
                          onChange={(e) => onQuantityChange(product.name, parseInt(e.target.value) || 1)}
                          className="w-20 h-8 text-sm"
                        />
                      </div>
                      <span className="text-xs text-green-600 whitespace-nowrap">
                        ✓ {mapping.type === 'product' ? '📦' : mapping.type === 'kitchen' ? '🍳' : '🍸'} {mapping.name}
                      </span>
                    </div>
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
            : `✓ ${mappedCount} produkte janë tashmë të mapuara dhe gati për t'u aplikuar në stok.`
          }
        </p>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={onBack} variant="outline">
          ← Kthehu
        </Button>
        {isAdmin ? (
          <Button onClick={onSave} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            Ruaj Mapimin
          </Button>
        ) : (
          <Button 
            onClick={onApply} 
            className="flex-1"
            disabled={mappedCount === 0}
          >
            <Upload className="mr-2 h-4 w-4" />
            Apliko Furnizime ({mappedCount})
          </Button>
        )}
      </div>
    </div>
  );
};
