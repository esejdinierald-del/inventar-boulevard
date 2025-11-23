import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StorageService } from "@/services/storage.service";

export const StorageDebugger = () => {
  const [debugInfo, setDebugInfo] = useState<string>("");

  const checkStorage = () => {
    const today = new Date().toISOString().split('T')[0];
    const savedData = StorageService.getDailyEntryData(today);
    const products = StorageService.getProducts();
    const coffeeTypes = StorageService.getCoffeeTypes();
    
    const info = {
      data_per_sot: today,
      ka_te_dhena: savedData ? "✅ PO" : "❌ JO",
      turn1_produktet: savedData?.turn1.products || {},
      turn2_produktet: savedData?.turn2.products || {},
      turn1_xhiro: savedData?.turn1.xhiro || 0,
      turn2_xhiro: savedData?.turn2.xhiro || 0,
      produkte_ne_liste: products,
      kafe_ne_liste: coffeeTypes,
      total_keys_ne_localStorage: Object.keys(localStorage).length
    };
    
    setDebugInfo(JSON.stringify(info, null, 2));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔍 Kontrollo të Dhënat</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={checkStorage} className="mb-4">
          Kontrollo localStorage
        </Button>
        {debugInfo && (
          <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
            {debugInfo}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};
