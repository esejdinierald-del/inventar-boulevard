import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const LocalStorageViewer = () => {
  const [storageData, setStorageData] = useState<any>(null);

  const checkLocalStorage = () => {
    const today = new Date().toISOString().split('T')[0];
    const allData: any = {};
    
    // Get all keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          allData[key] = value ? JSON.parse(value) : null;
        } catch {
          allData[key] = localStorage.getItem(key);
        }
      }
    }
    
    setStorageData(allData);
  };

  const forceReload = () => {
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔍 Kontrollo të Dhënat në localStorage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkLocalStorage} variant="outline">
            Kontrollo localStorage
          </Button>
          <Button onClick={forceReload}>
            Rifresko Faqen
          </Button>
        </div>
        
        {storageData && (
          <div className="space-y-2">
            <Alert>
              <AlertDescription>
                Gjenda të gjitha: {Object.keys(storageData).length} çelësa në localStorage
              </AlertDescription>
            </Alert>
            
            <div className="max-h-96 overflow-auto bg-muted p-4 rounded-lg">
              <pre className="text-xs">
                {JSON.stringify(storageData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
