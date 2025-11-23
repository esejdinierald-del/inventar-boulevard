import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "lucide-react";
import { toast } from "sonner";

interface ProductData {
  stokFillim: number;
  gjendje: number;
  shiriti: number;
}

interface CoffeeData {
  [key: string]: number;
}

interface TurnData {
  products: { [key: string]: ProductData };
  coffee: CoffeeData;
  xhiro: number;
  xhiroEmbelsira: number;
  akullore: number;
  mulliriFillim: number;
  mulliriPerfund: number;
}

const DailyEntry = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Lista e produkteve nga Excel
  const products = [
    "Kanace", "u.vit", "heineken 330", "korona", "paulaner", "rose",
    "r.bull", "b.52", "crodino", "biter", "Bustina", "uje", "caj", "caj bio"
  ];

  const coffeeTypes = [
    "KAFE", "KORRETO", "LATE", "AMERIKANE", "LECE.LECE", "KAPUCIN KAFE"
  ];

  const [turn1, setTurn1] = useState<TurnData>({
    products: Object.fromEntries(products.map(p => [p, { stokFillim: 0, gjendje: 0, shiriti: 0 }])),
    coffee: Object.fromEntries(coffeeTypes.map(c => [c, 0])),
    xhiro: 0,
    xhiroEmbelsira: 0,
    akullore: 0,
    mulliriFillim: 0,
    mulliriPerfund: 0,
  });

  const [turn2, setTurn2] = useState<TurnData>({
    products: Object.fromEntries(products.map(p => [p, { stokFillim: 0, gjendje: 0, shiriti: 0 }])),
    coffee: Object.fromEntries(coffeeTypes.map(c => [c, 0])),
    xhiro: 0,
    xhiroEmbelsira: 0,
    akullore: 0,
    mulliriFillim: 0,
    mulliriPerfund: 0,
  });

  const [furnizime, setFurnizime] = useState({ emertimi: "", vlera: 0 });

  // Formula: Diferenca = Stok Fillim - Gjendje - Shiriti
  const calculateDif = (stokFillim: number, gjendje: number, shiriti: number) => {
    return stokFillim - gjendje - shiriti;
  };

  // Formula: Diferenca Mulliri = Mulliri Fillim - Mulliri Perfund
  const calculateMulliriDif = (fillim: number, perfund: number) => {
    return fillim - perfund;
  };

  // Update product data for Turn 1
  const updateTurn1Product = (product: string, field: keyof ProductData, value: number) => {
    setTurn1(prev => ({
      ...prev,
      products: {
        ...prev.products,
        [product]: {
          ...prev.products[product],
          [field]: value
        }
      }
    }));
  };

  // Update product data for Turn 2
  const updateTurn2Product = (product: string, field: keyof ProductData, value: number) => {
    setTurn2(prev => ({
      ...prev,
      products: {
        ...prev.products,
        [product]: {
          ...prev.products[product],
          [field]: value
        }
      }
    }));
  };

  // Calculate totals
  const calculateTotalXhiro = () => {
    return turn1.xhiro + turn2.xhiro;
  };

  const calculateTotalProducts = (turn: TurnData) => {
    return Object.values(turn.products).reduce((sum, p) => sum + p.shiriti, 0);
  };

  const calculateTotalCoffee = (turn: TurnData) => {
    return Object.values(turn.coffee).reduce((sum, qty) => sum + qty, 0);
  };

  const handleSave = () => {
    const totalXhiro = calculateTotalXhiro();
    const mulliri1Dif = calculateMulliriDif(turn1.mulliriFillim, turn1.mulliriPerfund);
    const mulliri2Dif = calculateMulliriDif(turn2.mulliriFillim, turn2.mulliriPerfund);
    
    toast.success(`Të dhënat u ruajtën! Xhiro totale: ${totalXhiro.toLocaleString()} ALL`);
  };

  return (
    <Layout>
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Regjistrimi Ditor</h2>
            <p className="text-muted-foreground">Regjistro shitjet dhe inventarin për secilin turn</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>

        <Tabs defaultValue="turn1" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="turn1">Turni 1</TabsTrigger>
            <TabsTrigger value="turn2">Turni 2</TabsTrigger>
          </TabsList>

          <TabsContent value="turn1" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Produktet - Turni 1</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produkti</TableHead>
                        <TableHead>Stok Fillim</TableHead>
                        <TableHead>Gjendje</TableHead>
                        <TableHead>Shiriti</TableHead>
                        <TableHead>Dif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => {
                        const data = turn1.products[product];
                        const dif = calculateDif(data.stokFillim, data.gjendje, data.shiriti);
                        return (
                          <TableRow key={product}>
                            <TableCell className="font-medium">{product}</TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                value={data.stokFillim || ""} 
                                onChange={(e) => updateTurn1Product(product, 'stokFillim', Number(e.target.value))}
                                className="w-20" 
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                value={data.gjendje || ""} 
                                onChange={(e) => updateTurn1Product(product, 'gjendje', Number(e.target.value))}
                                className="w-20" 
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                value={data.shiriti || ""} 
                                onChange={(e) => updateTurn1Product(product, 'shiriti', Number(e.target.value))}
                                className="w-20" 
                              />
                            </TableCell>
                            <TableCell className={`font-medium ${dif !== 0 ? 'text-warning' : 'text-success'}`}>
                              {dif}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-bold">TOTALI</TableCell>
                        <TableCell className="font-bold">{Object.values(turn1.products).reduce((sum, p) => sum + p.stokFillim, 0)}</TableCell>
                        <TableCell className="font-bold">{Object.values(turn1.products).reduce((sum, p) => sum + p.gjendje, 0)}</TableCell>
                        <TableCell className="font-bold text-primary">{calculateTotalProducts(turn1)}</TableCell>
                        <TableCell className="font-bold">{Object.values(turn1.products).reduce((sum, p) => sum + calculateDif(p.stokFillim, p.gjendje, p.shiriti), 0)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kafe - Turni 1</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lloji</TableHead>
                        <TableHead>Sasia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coffeeTypes.map((coffee) => (
                        <TableRow key={coffee}>
                          <TableCell className="font-medium">{coffee}</TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              value={turn1.coffee[coffee] || ""} 
                              onChange={(e) => setTurn1(prev => ({
                                ...prev,
                                coffee: { ...prev.coffee, [coffee]: Number(e.target.value) }
                              }))}
                              className="w-24" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-bold">TOTALI</TableCell>
                        <TableCell className="font-bold text-primary">{calculateTotalCoffee(turn1)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xhiro dhe Të Dhëna Shtesë - Turni 1</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Xhiro T1 (ALL)</Label>
                    <Input 
                      type="number" 
                      value={turn1.xhiro || ""} 
                      onChange={(e) => setTurn1(prev => ({ ...prev, xhiro: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Xhiro Embëlsirat T1 (ALL)</Label>
                    <Input 
                      type="number" 
                      value={turn1.xhiroEmbelsira || ""} 
                      onChange={(e) => setTurn1(prev => ({ ...prev, xhiroEmbelsira: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Akullore T1 (ALL)</Label>
                    <Input 
                      type="number" 
                      value={turn1.akullore || ""} 
                      onChange={(e) => setTurn1(prev => ({ ...prev, akullore: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mëlliri Fillim (kg)</Label>
                    <Input 
                      type="number" 
                      value={turn1.mulliriFillim || ""} 
                      onChange={(e) => setTurn1(prev => ({ ...prev, mulliriFillim: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mëlliri Perfund (kg)</Label>
                    <Input 
                      type="number" 
                      value={turn1.mulliriPerfund || ""} 
                      onChange={(e) => setTurn1(prev => ({ ...prev, mulliriPerfund: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Diferenca Mëlliri (kg)</Label>
                    <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm font-medium">
                      {calculateMulliriDif(turn1.mulliriFillim, turn1.mulliriPerfund)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="turn2" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Produktet - Turni 2</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produkti</TableHead>
                        <TableHead>Stok Fillim</TableHead>
                        <TableHead>Gjendje</TableHead>
                        <TableHead>Shiriti</TableHead>
                        <TableHead>Dif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => {
                        const data = turn2.products[product];
                        const dif = calculateDif(data.stokFillim, data.gjendje, data.shiriti);
                        return (
                          <TableRow key={product}>
                            <TableCell className="font-medium">{product}</TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                value={data.stokFillim || ""} 
                                onChange={(e) => updateTurn2Product(product, 'stokFillim', Number(e.target.value))}
                                className="w-20" 
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                value={data.gjendje || ""} 
                                onChange={(e) => updateTurn2Product(product, 'gjendje', Number(e.target.value))}
                                className="w-20" 
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                value={data.shiriti || ""} 
                                onChange={(e) => updateTurn2Product(product, 'shiriti', Number(e.target.value))}
                                className="w-20" 
                              />
                            </TableCell>
                            <TableCell className={`font-medium ${dif !== 0 ? 'text-warning' : 'text-success'}`}>
                              {dif}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-bold">TOTALI</TableCell>
                        <TableCell className="font-bold">{Object.values(turn2.products).reduce((sum, p) => sum + p.stokFillim, 0)}</TableCell>
                        <TableCell className="font-bold">{Object.values(turn2.products).reduce((sum, p) => sum + p.gjendje, 0)}</TableCell>
                        <TableCell className="font-bold text-primary">{calculateTotalProducts(turn2)}</TableCell>
                        <TableCell className="font-bold">{Object.values(turn2.products).reduce((sum, p) => sum + calculateDif(p.stokFillim, p.gjendje, p.shiriti), 0)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kafe - Turni 2</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lloji</TableHead>
                        <TableHead>Sasia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coffeeTypes.map((coffee) => (
                        <TableRow key={coffee}>
                          <TableCell className="font-medium">{coffee}</TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              value={turn2.coffee[coffee] || ""} 
                              onChange={(e) => setTurn2(prev => ({
                                ...prev,
                                coffee: { ...prev.coffee, [coffee]: Number(e.target.value) }
                              }))}
                              className="w-24" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-bold">TOTALI</TableCell>
                        <TableCell className="font-bold text-primary">{calculateTotalCoffee(turn2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xhiro dhe Të Dhëna Shtesë - Turni 2</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Xhiro T2 (ALL)</Label>
                    <Input 
                      type="number" 
                      value={turn2.xhiro || ""} 
                      onChange={(e) => setTurn2(prev => ({ ...prev, xhiro: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Xhiro Embëlsirat T2 (ALL)</Label>
                    <Input 
                      type="number" 
                      value={turn2.xhiroEmbelsira || ""} 
                      onChange={(e) => setTurn2(prev => ({ ...prev, xhiroEmbelsira: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Akullore T2 (ALL)</Label>
                    <Input 
                      type="number" 
                      value={turn2.akullore || ""} 
                      onChange={(e) => setTurn2(prev => ({ ...prev, akullore: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mëlliri Fillim (kg)</Label>
                    <Input 
                      type="number" 
                      value={turn2.mulliriFillim || ""} 
                      onChange={(e) => setTurn2(prev => ({ ...prev, mulliriFillim: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mëlliri Perfund (kg)</Label>
                    <Input 
                      type="number" 
                      value={turn2.mulliriPerfund || ""} 
                      onChange={(e) => setTurn2(prev => ({ ...prev, mulliriPerfund: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Diferenca Mëlliri (kg)</Label>
                    <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm font-medium">
                      {calculateMulliriDif(turn2.mulliriFillim, turn2.mulliriPerfund)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Përmbledhje Ditore</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Xhiro Totale</p>
                <p className="text-2xl font-bold text-primary">{calculateTotalXhiro().toLocaleString()} ALL</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Total Produkte T1</p>
                <p className="text-2xl font-bold">{calculateTotalProducts(turn1)}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Total Produkte T2</p>
                <p className="text-2xl font-bold">{calculateTotalProducts(turn2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Furnizime dhe Shpenzime</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Emërtimi</Label>
                <Input 
                  placeholder="Përshkrimi i furnizimit" 
                  value={furnizime.emertimi}
                  onChange={(e) => setFurnizime(prev => ({ ...prev, emertimi: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Vlera (ALL)</Label>
                <Input 
                  type="number" 
                  value={furnizime.vlera || ""}
                  onChange={(e) => setFurnizime(prev => ({ ...prev, vlera: Number(e.target.value) }))}
                />
              </div>
            </div>
            <Button onClick={handleSave} className="w-full md:w-auto bg-gradient-primary">
              Ruaj të Dhënat
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DailyEntry;
