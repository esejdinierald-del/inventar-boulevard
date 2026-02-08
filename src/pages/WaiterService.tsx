import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Coffee, Bell, FileText, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";

const WaiterService = () => {
  const [tableNumber, setTableNumber] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCallWaiter = async () => {
    if (!tableNumber || isNaN(Number(tableNumber))) {
      toast.error("Futni numrin e tavolinës");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("waiter_calls").insert({
        table_number: Number(tableNumber),
        call_type: "call_waiter",
        special_request: specialRequest || null,
        priority: 1,
      });

      if (error) throw error;
      toast.success("✅ Kamarieri është njoftuar!");
      setSpecialRequest("");
    } catch (error) {
      console.error("Gabim në thirrje:", error);
      toast.error("Gabim në thirrje");
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceRequest = async (type: string) => {
    if (!tableNumber || isNaN(Number(tableNumber))) {
      toast.error("Futni numrin e tavolinës");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("waiter_calls").insert({
        table_number: Number(tableNumber),
        call_type: type,
        priority: type === "bill" ? 2 : 1,
      });

      if (error) throw error;
      toast.success(`✅ ${type === "bill" ? "Kërkesa për faturë" : "Kërkesa"} është dërguar!`);
    } catch (error) {
      console.error("Gabim:", error);
      toast.error("Gabim në dërgim");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8 pb-24 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-full p-4">
            <Coffee className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Boulevard Café</h1>
          <p className="text-muted-foreground">Shërbimi Premium për Klientët</p>
        </div>

        {/* Table Selection Card */}
        <Card className="border-2 border-dashed border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Zgjidh Tavolinën</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="table">Numri i Tavolinës</Label>
              <Input
                id="table"
                type="number"
                min="1"
                max="50"
                placeholder="1-50"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="text-center text-lg font-semibold"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Futni numrin e tavolinës në të cilën ndodhen
            </p>
          </CardContent>
        </Card>

        {/* Service Options */}
        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={() => handleCallWaiter()}
            disabled={isLoading || !tableNumber}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white h-14 text-base font-semibold"
          >
            <Bell className="mr-2 h-5 w-5" />
            Thirr Kamarierin
          </Button>

          <Button
            onClick={() => handleServiceRequest("bill")}
            disabled={isLoading || !tableNumber}
            variant="outline"
            size="lg"
            className="h-14 text-base font-semibold border-2"
          >
            <FileText className="mr-2 h-5 w-5" />
            Kërkesa për Faturë
          </Button>

          <Button
            onClick={() => handleServiceRequest("menu")}
            disabled={isLoading || !tableNumber}
            variant="outline"
            size="lg"
            className="h-14 text-base font-semibold border-2"
          >
            <Coffee className="mr-2 h-5 w-5" />
            Kërkesa për Menu
          </Button>
        </div>

        {/* Special Request */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Mesazh Shtesë</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              placeholder="Shkruaj ndonjë kërkesë ose vërejtje të veçantë..."
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              className="w-full p-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-accent/20 border-accent">
          <CardContent className="pt-6 space-y-2">
            <div className="flex gap-2">
              <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-semibold mb-1">💡 Këshilla</p>
                <p>
                  Mund të dërgosh shumë kërkesa. Kamarieri do të shohë në kohë reale dhe do t'u përgjigjet sa më shpejt të mundë.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WaiterService;
