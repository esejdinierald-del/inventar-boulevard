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

  const handleSave = () => {
    toast.success("Të dhënat u ruajtën me sukses!");
  };

  return (
    <Layout>
      <div className="space-y-6">
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
                      {products.map((product) => (
                        <TableRow key={product}>
                          <TableCell className="font-medium">{product}</TableCell>
                          <TableCell>
                            <Input type="number" defaultValue="0" className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" defaultValue="0" className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" defaultValue="0" className="w-20" />
                          </TableCell>
                          <TableCell className="font-medium">0</TableCell>
                        </TableRow>
                      ))}
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
                            <Input type="number" defaultValue="0" className="w-24" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xhiro dhe Të Dhëna Shtesë</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Xhiro T1</Label>
                    <Input type="number" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Xhiro Embëlsirat T1</Label>
                    <Input type="number" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Akullore T1</Label>
                    <Input type="number" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mëlliri Fillim</Label>
                    <Input type="number" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mëlliri Perfund</Label>
                    <Input type="number" defaultValue="0" />
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
                      {products.map((product) => (
                        <TableRow key={product}>
                          <TableCell className="font-medium">{product}</TableCell>
                          <TableCell>
                            <Input type="number" defaultValue="0" className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" defaultValue="0" className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" defaultValue="0" className="w-20" />
                          </TableCell>
                          <TableCell className="font-medium">0</TableCell>
                        </TableRow>
                      ))}
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
                            <Input type="number" defaultValue="0" className="w-24" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xhiro dhe Të Dhëna Shtesë</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Xhiro T2</Label>
                    <Input type="number" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Xhiro Embëlsirat T2</Label>
                    <Input type="number" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Akullore T2</Label>
                    <Input type="number" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mëlliri Fillim</Label>
                    <Input type="number" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mëlliri Perfund</Label>
                    <Input type="number" defaultValue="0" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Furnizime dhe Shpenzime</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Emërtimi</Label>
                <Input placeholder="Përshkrimi i furnizimit" />
              </div>
              <div className="space-y-2">
                <Label>Vlera (ALL)</Label>
                <Input type="number" defaultValue="0" />
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
