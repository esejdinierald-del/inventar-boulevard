import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
interface ProductData {
  stokFillim: number;
  gjendje: number;
  shiriti: number;
  furnizime: number;
}
interface CoffeeData {
  [key: string]: number;
}
interface TurnData {
  products: {
    [key: string]: ProductData;
  };
  coffee: CoffeeData;
  xhiro: number;
  xhiroEmbelsira: number;
  akullore: number;
  mulliriFillim: number;
  mulliriPerfund: number;
}
const DailyEntry = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  // Lista e produkteve nga Excel
  const products = ["Kanace", "u.vit", "heineken 330", "korona", "paulaner", "rose", "r.bull", "b.52", "crodino", "biter", "Bustina", "uje", "caj", "caj bio"];
  const coffeeTypes = ["KAFE", "KORRETO", "LATE", "AMERIKANE", "LECE.LECE", "KAPUCIN KAFE"];
  const [turn1, setTurn1] = useState<TurnData>({
    products: Object.fromEntries(products.map(p => [p, {
      stokFillim: 0,
      gjendje: 0,
      shiriti: 0,
      furnizime: 0
    }])),
    coffee: Object.fromEntries(coffeeTypes.map(c => [c, 0])),
    xhiro: 0,
    xhiroEmbelsira: 0,
    akullore: 0,
    mulliriFillim: 0,
    mulliriPerfund: 0
  });
  const [turn2, setTurn2] = useState<TurnData>({
    products: Object.fromEntries(products.map(p => [p, {
      stokFillim: 0,
      gjendje: 0,
      shiriti: 0,
      furnizime: 0
    }])),
    coffee: Object.fromEntries(coffeeTypes.map(c => [c, 0])),
    xhiro: 0,
    xhiroEmbelsira: 0,
    akullore: 0,
    mulliriFillim: 0,
    mulliriPerfund: 0
  });
  const [furnizime, setFurnizime] = useState({
    emertimi: "",
    vlera: 0
  });

  // Formula: Diferenca = Stok Fillim + Furnizime - Gjendje - Shiriti
  const calculateDif = (stokFillim: number, furnizime: number, gjendje: number, shiriti: number) => {
    return stokFillim + furnizime - gjendje - shiriti;
  };

  // Formula: Diferenca Mulliri = (Mulliri Perfund - Mulliri Fillim) - Total Kafe
  const calculateMulliriDif = (fillim: number, perfund: number, totalKafe: number) => {
    return (perfund - fillim) - totalKafe;
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

  // Kopjon (Stok Fillim + Furnizime - Shiriti) T1 në Stok Fillim T2
  const copyT1ToT2 = () => {
    setTurn2(prev => ({
      ...prev,
      products: Object.fromEntries(Object.entries(prev.products).map(([key, data]) => {
        const t1Data = turn1.products[key];
        const calculatedStock = t1Data.stokFillim + t1Data.furnizime - t1Data.shiriti;
        return [key, {
          ...data,
          stokFillim: calculatedStock
        }];
      }))
    }));
    toast.success("Stoku i T1 u kalkulua dhe u kopjua në T2");
  };

  // Ruaj (Stok Fillim + Furnizime - Shiriti) T2 për ditën e nesërme
  const saveForNextDay = () => {
    const nextDayStock = Object.fromEntries(Object.entries(turn2.products).map(([key, data]) => {
      const calculatedStock = data.stokFillim + data.furnizime - data.shiriti;
      return [key, calculatedStock];
    }));
    localStorage.setItem(`stock_${selectedDate}`, JSON.stringify(nextDayStock));
    toast.success("Stoku u ruajt për ditën e nesërme!");
  };

  // Ngarko stokun nga dita e kaluar
  const loadFromPreviousDay = () => {
    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    const savedStock = localStorage.getItem(`stock_${yesterdayDate}`);
    if (savedStock) {
      const stockData = JSON.parse(savedStock);
      setTurn1(prev => ({
        ...prev,
        products: Object.fromEntries(Object.entries(prev.products).map(([key, data]) => [key, {
          ...data,
          stokFillim: stockData[key] || 0
        }]))
      }));
      toast.success("Stoku u ngarkua nga dita e kaluar!");
    } else {
      toast.error("Nuk ka të dhëna për ditën e kaluar");
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === "1983") {
      setIsAdminUnlocked(true);
      setShowPasswordDialog(false);
      setPasswordInput("");
      toast.success("Admin u hap me sukses!");
    } else {
      toast.error("Fjalëkalimi është gabim!");
      setPasswordInput("");
    }
  };

  const toggleAdminMode = () => {
    if (isAdminUnlocked) {
      setIsAdminUnlocked(false);
      toast.info("Admin u mbyll");
    } else {
      setShowPasswordDialog(true);
    }
  };
  const handleSave = () => {
    const totalXhiro = calculateTotalXhiro();
    const mulliri1Dif = calculateMulliriDif(turn1.mulliriFillim, turn1.mulliriPerfund, calculateTotalCoffee(turn1));
    const mulliri2Dif = calculateMulliriDif(turn2.mulliriFillim, turn2.mulliriPerfund, calculateTotalCoffee(turn2));

    // Automatikisht ruaj për ditën e nesërme
    saveForNextDay();
    toast.success(`Të dhënat u ruajtën! Xhiro totale: ${totalXhiro.toLocaleString()} ALL`);
  };
  return <Layout>
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Regjistrimi Ditor</h2>
            <p className="text-muted-foreground">Regjistro shitjet dhe inventarin për secilin turn</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant={isAdminUnlocked ? "default" : "outline"} 
              size="sm" 
              onClick={toggleAdminMode}
              className="text-xs"
            >
              {isAdminUnlocked ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
              {isAdminUnlocked ? "Admin (Mbyll)" : "Admin"}
            </Button>
            <Button variant="outline" size="sm" onClick={loadFromPreviousDay} className="text-xs">
              📥 Ngarko nga dje
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-auto" />
            </div>
          </div>
        </div>

        <Tabs defaultValue="turn1" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="turn1">Turni 1</TabsTrigger>
            <TabsTrigger value="turn2">Turni 2</TabsTrigger>
          </TabsList>

          <TabsContent value="turn1" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Produktet - Turni 1</CardTitle>
                <Button variant="outline" size="sm" onClick={copyT1ToT2} className="text-xs">
                  Kopjo në T2 →
                </Button>
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
                        <TableHead>Furnizime</TableHead>
                        <TableHead>Dif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map(product => {
                      const data = turn1.products[product];
                      const dif = calculateDif(data.stokFillim, data.furnizime, data.gjendje, data.shiriti);
                      return <TableRow key={product}>
                            <TableCell className="font-medium">{product}</TableCell>
                            <TableCell>
                              <Input type="number" value={data.stokFillim || ""} onChange={e => updateTurn1Product(product, 'stokFillim', Number(e.target.value))} className="w-20" disabled={!isAdminUnlocked} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" value={data.gjendje || ""} onChange={e => updateTurn1Product(product, 'gjendje', Number(e.target.value))} className="w-20" />
                            </TableCell>
                            <TableCell>
                              <Input type="number" value={data.shiriti || ""} onChange={e => updateTurn1Product(product, 'shiriti', Number(e.target.value))} className="w-20" />
                            </TableCell>
                            <TableCell>
                              <Input type="number" value={data.furnizime || ""} onChange={e => updateTurn1Product(product, 'furnizime', Number(e.target.value))} className="w-20 bg-success/10" />
                            </TableCell>
                            <TableCell className={`font-medium ${dif !== 0 ? 'text-warning' : 'text-success'}`}>
                              {dif}
                            </TableCell>
                          </TableRow>;
                    })}
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-bold">TOTALI</TableCell>
                        <TableCell className="font-bold">{Object.values(turn1.products).reduce((sum, p) => sum + p.stokFillim, 0)}</TableCell>
                        <TableCell className="font-bold">{Object.values(turn1.products).reduce((sum, p) => sum + p.gjendje, 0)}</TableCell>
                        <TableCell className="font-bold text-primary">{calculateTotalProducts(turn1)}</TableCell>
                        <TableCell className="font-bold text-success">{Object.values(turn1.products).reduce((sum, p) => sum + p.furnizime, 0)}</TableCell>
                        <TableCell className="font-bold">{Object.values(turn1.products).reduce((sum, p) => sum + calculateDif(p.stokFillim, p.furnizime, p.gjendje, p.shiriti), 0)}</TableCell>
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
                      {coffeeTypes.map(coffee => <TableRow key={coffee}>
                          <TableCell className="font-medium">{coffee}</TableCell>
                          <TableCell>
                            <Input type="number" value={turn1.coffee[coffee] || ""} onChange={e => setTurn1(prev => ({
                          ...prev,
                          coffee: {
                            ...prev.coffee,
                            [coffee]: Number(e.target.value)
                          }
                        }))} className="w-24" />
                          </TableCell>
                        </TableRow>)}
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
                    <Label>Mulliri Fillim (kg)</Label>
                    <Input type="number" value={turn1.mulliriFillim || ""} onChange={e => setTurn1(prev => ({
                    ...prev,
                    mulliriFillim: Number(e.target.value)
                  }))} disabled={!isAdminUnlocked} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mulliri Perfund (kg)</Label>
                    <Input type="number" value={turn1.mulliriPerfund || ""} onChange={e => setTurn1(prev => ({
                    ...prev,
                    mulliriPerfund: Number(e.target.value)
                  }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Diferenca Mulliri (kg)</Label>
                    <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm font-medium">
                      {calculateMulliriDif(turn1.mulliriFillim, turn1.mulliriPerfund, calculateTotalCoffee(turn1))}
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
                        <TableHead>Furnizime</TableHead>
                        <TableHead>Dif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map(product => {
                      const data = turn2.products[product];
                      const dif = calculateDif(data.stokFillim, data.furnizime, data.gjendje, data.shiriti);
                      return <TableRow key={product}>
                            <TableCell className="font-medium">{product}</TableCell>
                            <TableCell>
                              <Input type="number" value={data.stokFillim || ""} onChange={e => updateTurn2Product(product, 'stokFillim', Number(e.target.value))} className="w-20" disabled={!isAdminUnlocked} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" value={data.gjendje || ""} onChange={e => updateTurn2Product(product, 'gjendje', Number(e.target.value))} className="w-20" />
                            </TableCell>
                            <TableCell>
                              <Input type="number" value={data.shiriti || ""} onChange={e => updateTurn2Product(product, 'shiriti', Number(e.target.value))} className="w-20" />
                            </TableCell>
                            <TableCell>
                              <Input type="number" value={data.furnizime || ""} onChange={e => updateTurn2Product(product, 'furnizime', Number(e.target.value))} className="w-20 bg-success/10" />
                            </TableCell>
                            <TableCell className={`font-medium ${dif !== 0 ? 'text-warning' : 'text-success'}`}>
                              {dif}
                            </TableCell>
                          </TableRow>;
                    })}
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-bold">TOTALI</TableCell>
                        <TableCell className="font-bold">{Object.values(turn2.products).reduce((sum, p) => sum + p.stokFillim, 0)}</TableCell>
                        <TableCell className="font-bold">{Object.values(turn2.products).reduce((sum, p) => sum + p.gjendje, 0)}</TableCell>
                        <TableCell className="font-bold text-primary">{calculateTotalProducts(turn2)}</TableCell>
                        <TableCell className="font-bold text-success">{Object.values(turn2.products).reduce((sum, p) => sum + p.furnizime, 0)}</TableCell>
                        <TableCell className="font-bold">{Object.values(turn2.products).reduce((sum, p) => sum + calculateDif(p.stokFillim, p.furnizime, p.gjendje, p.shiriti), 0)}</TableCell>
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
                      {coffeeTypes.map(coffee => <TableRow key={coffee}>
                          <TableCell className="font-medium">{coffee}</TableCell>
                          <TableCell>
                            <Input type="number" value={turn2.coffee[coffee] || ""} onChange={e => setTurn2(prev => ({
                          ...prev,
                          coffee: {
                            ...prev.coffee,
                            [coffee]: Number(e.target.value)
                          }
                        }))} className="w-24" />
                          </TableCell>
                        </TableRow>)}
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
                    <Input type="number" value={turn2.xhiro || ""} onChange={e => setTurn2(prev => ({
                    ...prev,
                    xhiro: Number(e.target.value)
                  }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Xhiro Embëlsirat T2 (ALL)</Label>
                    <Input type="number" value={turn2.xhiroEmbelsira || ""} onChange={e => setTurn2(prev => ({
                    ...prev,
                    xhiroEmbelsira: Number(e.target.value)
                  }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Akullore T2 (ALL)</Label>
                    <Input type="number" value={turn2.akullore || ""} onChange={e => setTurn2(prev => ({
                    ...prev,
                    akullore: Number(e.target.value)
                  }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mulliri Fillim (kg)</Label>
                    <Input type="number" value={turn2.mulliriFillim || ""} onChange={e => setTurn2(prev => ({
                    ...prev,
                    mulliriFillim: Number(e.target.value)
                  }))} disabled={!isAdminUnlocked} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mulliri Perfund (kg)</Label>
                    <Input type="number" value={turn2.mulliriPerfund || ""} onChange={e => setTurn2(prev => ({
                    ...prev,
                    mulliriPerfund: Number(e.target.value)
                  }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Diferenca Mulliri (kg)</Label>
                    <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm font-medium">
                      {calculateMulliriDif(turn2.mulliriFillim, turn2.mulliriPerfund, calculateTotalCoffee(turn2))}
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
                <Input placeholder="Përshkrimi i furnizimit" value={furnizime.emertimi} onChange={e => setFurnizime(prev => ({
                ...prev,
                emertimi: e.target.value
              }))} />
              </div>
              <div className="space-y-2">
                <Label>Vlera (ALL)</Label>
                <Input type="number" value={furnizime.vlera || ""} onChange={e => setFurnizime(prev => ({
                ...prev,
                vlera: Number(e.target.value)
              }))} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} className="flex-1 md:flex-none bg-gradient-primary">
                💾 Ruaj të Dhënat
              </Button>
              <Button onClick={saveForNextDay} variant="outline" className="flex-1 md:flex-none">
                📅 Ruaj për nesër
              </Button>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hyrje si Admin</AlertDialogTitle>
              <AlertDialogDescription>
                Fut fjalëkalimin për të modifikuar të dhënat e stokut.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                type="password"
                placeholder="Fjalëkalimi"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPasswordInput("")}>Anulo</AlertDialogCancel>
              <AlertDialogAction onClick={handlePasswordSubmit}>Hyr</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>;
};
export default DailyEntry;