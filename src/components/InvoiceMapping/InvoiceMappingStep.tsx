import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Upload } from "lucide-react";
import { InvoiceProduct } from "@/hooks/useInvoiceMappings";

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
  invoiceTotal: number;
  products: string[];
  kitchenProducts: string[];
  alcoholicDrinks: string[];
  isAdmin: boolean;
  onMappingChange: (product: string, type: 'product' | 'kitchen' | 'alcoholic_drink', name: string) => void;
  onQuantityChange: (product: string, quantity: number) => void;
  onInvoiceQuantityChange: (product: string, quantity: number) => void;
  onSave: () => void;
  onApply: () => void;
  onBack: () => void;
}

export const InvoiceMappingStep = ({
  detectedProducts,
  invoiceMapping,
  invoiceTotal,
  products,
  kitchenProducts,
  alcoholicDrinks,
  isAdmin,
  onMappingChange,
  onQuantityChange,
  onInvoiceQuantityChange,
  onSave,
  onApply,
  onBack,
}: InvoiceMappingStepProps) => {
  const mappedCount = detectedProducts.filter(p => invoiceMapping[p.name]).length;

  // Llogarit totalin e furnizimeve për çdo produkt të mapuar
  const getCalculatedSupply = (product: InvoiceProduct) => {
    const mapping = invoiceMapping[product.name];
    if (!mapping) return 0;
    return product.invoiceQuantity * mapping.quantity;
  };

  return (
    <div className="flex-1 space-y-4 overflow-hidden flex flex-col">
      <div className="flex-shrink-0">
        <Label>Mapo produktet nga fatura me artikujt e sistemit</Label>
        <p className="text-xs text-muted-foreground">
          U gjetën {detectedProducts.length} artikuj nga faturat. Zgjidh korrespondencën dhe kontrollo sasitë.
        </p>
      </div>

      {/* Header */}
      <div className="hidden md:grid grid-cols-[1fr_auto_1.2fr_80px_80px_80px] gap-2 px-3 text-xs font-medium text-muted-foreground border-b pb-2">
        <span>Artikulli i faturës</span>
        <span></span>
        <span>Produkti në sistem</span>
        <span className="text-center">Sasia faturës</span>
        <span className="text-center">Copë/njësi</span>
        <span className="text-center">Furnizime</span>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {detectedProducts.map((product, index) => {
            const mapping = invoiceMapping[product.name];
            const currentValue = mapping ? `${mapping.type}:${mapping.name}` : "";
            const calculatedSupply = getCalculatedSupply(product);
            
            return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_auto_1.2fr_80px_80px_80px] gap-2 items-center p-3 border rounded">
                {/* Emri nga fatura + çmimi */}
                <div>
                  <p className="text-sm font-mono font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.invoicePrice > 0 
                      ? `${product.invoicePrice.toLocaleString()} lekë` 
                      : 'Pa çmim'}
                  </p>
                </div>

                <div className="text-muted-foreground hidden md:block">→</div>

                {/* Select produkti */}
                <select
                  value={currentValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    const colonIdx = val.indexOf(':');
                    if (colonIdx === -1) return;
                    const type = val.substring(0, colonIdx);
                    const name = val.substring(colonIdx + 1);
                    if (type && name) {
                      onMappingChange(product.name, type as 'product' | 'kitchen' | 'alcoholic_drink', name);
                    }
                  }}
                  className="text-sm border rounded p-2"
                  disabled={!isAdmin}
                >
                  <option value="">-- Zgjidh --</option>
                  <optgroup label="📦 Produkte">
                    {products.map(p => (
                      <option key={p} value={`product:${p}`}>{p}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🍳 Kuzhinë">
                    {kitchenProducts.map(k => (
                      <option key={k} value={`kitchen:${k}`}>{k}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🍸 Pijet Alkoolike">
                    {alcoholicDrinks.map(d => (
                      <option key={d} value={`alcoholic_drink:${d}`}>{d}</option>
                    ))}
                  </optgroup>
                </select>

                {/* Sasia nga fatura - editabile */}
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={product.invoiceQuantity}
                  onChange={(e) => onInvoiceQuantityChange(product.name, parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm text-center"
                  title="Sasia nga fatura"
                />

                {/* Copë/njësi (mapping quantity) */}
                {mapping ? (
                  <Input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={mapping.quantity}
                    onChange={(e) => onQuantityChange(product.name, parseFloat(e.target.value) || 1)}
                    className="h-8 text-sm text-center"
                    disabled={!isAdmin}
                    title="Sa copë për njësi"
                  />
                ) : (
                  <div className="h-8 flex items-center justify-center text-xs text-muted-foreground">-</div>
                )}

                {/* Furnizime totale = sasia × copë/njësi */}
                <div className={`h-8 flex items-center justify-center text-sm font-bold rounded ${
                  mapping ? 'bg-green-100 text-green-800' : 'text-muted-foreground'
                }`}>
                  {mapping ? calculatedSupply : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Krahasimi i vlerës së faturës vs produkteve */}
      {detectedProducts.length > 0 && (() => {
        const sumProducts = detectedProducts.reduce((sum, p) => sum + p.invoicePrice, 0);
        const diff = invoiceTotal - sumProducts;
        const isMatch = Math.abs(diff) < 1;
        return (
          <div className={`rounded-lg border p-3 ${
            isMatch 
              ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20' 
              : 'border-destructive/50 bg-destructive/10'
          }`}>
            <div className="flex items-center justify-between text-sm">
              <span>📄 Total fatura (foto): <strong>{invoiceTotal.toLocaleString()} lekë</strong></span>
              <span>📋 Shuma artikujve: <strong>{sumProducts.toLocaleString()} lekë</strong></span>
              <span className={`font-bold ${isMatch ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
                {isMatch ? '✅ Përputhet!' : `⚠️ Diferencë: ${diff > 0 ? '+' : ''}${diff.toLocaleString()} lekë`}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Përmbledhje furnizimesh - agreguar sipas produktit destinacion */}
      {mappedCount > 0 && (() => {
        const aggregated: { [key: string]: { name: string; totalUnits: number; totalCost: number } } = {};
        detectedProducts
          .filter(p => invoiceMapping[p.name])
          .forEach(p => {
            const mapping = invoiceMapping[p.name];
            const units = p.invoiceQuantity * mapping.quantity;
            const key = `${mapping.type}:${mapping.name}`;
            if (aggregated[key]) {
              aggregated[key].totalUnits += units;
              aggregated[key].totalCost += p.invoicePrice;
            } else {
              aggregated[key] = { name: mapping.name, totalUnits: units, totalCost: p.invoicePrice };
            }
          });
        return (
          <div className="rounded-lg border border-info/50 bg-info/10 p-3">
            <p className="text-xs font-medium mb-1">📦 Përmbledhje furnizimesh (agreguar):</p>
            <p className="text-xs text-muted-foreground">
              {Object.values(aggregated).map(agg => {
                const avgPrice = agg.totalUnits > 0 ? Math.round(agg.totalCost / agg.totalUnits) : 0;
                return `${agg.name}: ${agg.totalUnits} copë (${avgPrice} lekë/copë)`;
              }).join(' | ')}
            </p>
          </div>
        );
      })()}

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
