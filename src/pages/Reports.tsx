import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { toast } from "sonner";

const Reports = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");

  const handleUnlock = () => {
    if (password === "1983") {
      setIsUnlocked(true);
      toast.success("Raportet u zhbllokuan");
    } else {
      toast.error("Fjalëkalimi është i gabuar");
    }
  };
  const monthlyData = Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    sales: 0,
    t1: 0,
    t2: 0,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {!isUnlocked && (
          <Card className="border-warning">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Lock className="h-5 w-5 text-warning" />
                <Input
                  type="password"
                  placeholder="Fut fjalëkalimin për të parë raportet"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  className="flex-1"
                />
                <Button onClick={handleUnlock}>Zhblloko</Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className={!isUnlocked ? "blur-sm pointer-events-none select-none" : ""}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Raporte</h2>
            <p className="text-muted-foreground">Statistika dhe analiza e shitjeve</p>
          </div>
          <Select defaultValue="tetor">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Zgjidh muajin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tetor">Tetor 2024</SelectItem>
              <SelectItem value="shtator">Shtator 2024</SelectItem>
              <SelectItem value="gusht">Gusht 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Xhiro Totale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">63,000 ALL</div>
              <p className="text-xs text-success">+12.5% nga muaji i kaluar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Mesatarja Ditore</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0 ALL</div>
              <p className="text-xs text-muted-foreground">Bazuar në ditët aktive</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Ditë Aktive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0 / 31</div>
              <p className="text-xs text-muted-foreground">Ditë me regjistrime</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Të Dhëna Ditore - Tetor 2024</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Turni 1</TableHead>
                    <TableHead>Turni 2</TableHead>
                    <TableHead>Total Ditore</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((day) => (
                    <TableRow key={day.day}>
                      <TableCell className="font-medium">{day.day}</TableCell>
                      <TableCell>{day.t1.toLocaleString()} ALL</TableCell>
                      <TableCell>{day.t2.toLocaleString()} ALL</TableCell>
                      <TableCell className="font-medium">{day.sales.toLocaleString()} ALL</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">TOTALI</TableCell>
                    <TableCell className="font-bold">0 ALL</TableCell>
                    <TableCell className="font-bold">0 ALL</TableCell>
                    <TableCell className="font-bold text-primary">63,000 ALL</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produktet Më të Shitura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produkti</TableHead>
                    <TableHead>Sasia</TableHead>
                    <TableHead>Xhiro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Kafe</TableCell>
                    <TableCell>0 copë</TableCell>
                    <TableCell>0 ALL</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Kanace</TableCell>
                    <TableCell>0 copë</TableCell>
                    <TableCell>0 ALL</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Heineken 330</TableCell>
                    <TableCell>0 copë</TableCell>
                    <TableCell>0 ALL</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
