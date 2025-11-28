import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Shield, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Manual = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20 md:pb-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Manuali i Përdorimit</h1>
          <p className="text-xl text-muted-foreground">
            Zgjedh manualin që dëshiron të shohësh
          </p>
        </div>

        {/* Manual Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Staff Manual Card */}
          <Card className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate('/manual-staff')}>
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Manual për Stafin</CardTitle>
                <CardDescription className="text-base mt-2">
                  Udhëzime të detajuara për përdorimin ditor të sistemit
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Përmban:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Hyrja me PIN</li>
                  <li>• Regjistrimi i produkteve</li>
                  <li>• Përdorimi i skanerëve</li>
                  <li>• Regjistrimi i kafesë dhe pijeve</li>
                  <li>• Ruajtja e të dhënave</li>
                </ul>
              </div>
              <Button className="w-full group-hover:bg-primary/90" size="lg">
                Hap Manualin
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Admin Manual Card */}
          <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 border-primary/20" onClick={() => navigate('/manual-admin')}>
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-2xl">Manual për Administratorët</CardTitle>
                <CardDescription className="text-base mt-2">
                  Udhëzime të plota për menaxhimin e sistemit
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Përmban:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Menaxhimi i stafit dhe PIN-eve</li>
                  <li>• Menaxhimi i produkteve dhe kafesë</li>
                  <li>• Inventari i pijeve alkoolike</li>
                  <li>• Raportet dhe analizat</li>
                  <li>• Modifikimi i të dhënave të kaluara</li>
                </ul>
              </div>
              <Button className="w-full group-hover:bg-primary/90" size="lg" variant="default">
                Hap Manualin
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">💡 Këshilla:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Manualet mund të printohen për referencë offline</li>
                <li>• Çdo manual përmban udhëzime të detajuara hap-pas-hapi</li>
                <li>• Përdor butonin "Mbrapa" për të kthyer te zgjedhja e manualeve</li>
                <li>• Në rast problemesh teknike, kontakto administratorin e sistemit</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Manual;
