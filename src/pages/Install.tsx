import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Monitor, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      toast.success("Aplikacioni u instalua me sukses!");
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.error("Instalimi nuk është i mundur në këtë pajisje ose shfletues");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success("Po instalohet aplikacioni...");
    }
    
    setDeferredPrompt(null);
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Instalo Aplikacionin</h1>
            <p className="text-muted-foreground">
              Përdore aplikacionin Bulevard direkt nga telefoni ose tableti yt
            </p>
          </div>

          {isInstalled ? (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-700">Aplikacioni është i Instaluar!</CardTitle>
                </div>
                <CardDescription>
                  Aplikacioni Bulevard është i instaluar dhe gati për përdorim
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              {deferredPrompt ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Instalo Tani</CardTitle>
                    <CardDescription>
                      Kliko butonin më poshtë për të instaluar aplikacionin në pajisjen tënde
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={handleInstallClick} 
                      size="lg" 
                      className="w-full"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Instalo Aplikacionin
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Si ta Instalosh?</CardTitle>
                    <CardDescription>
                      Aplikacioni mund të instalohet direkt nga shfletuesi yt
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Smartphone className="h-5 w-5 mt-1 text-primary" />
                        <div>
                          <h3 className="font-semibold">iPhone / Safari</h3>
                          <p className="text-sm text-muted-foreground">
                            Shtyp butonin "Share" → "Add to Home Screen"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Monitor className="h-5 w-5 mt-1 text-primary" />
                        <div>
                          <h3 className="font-semibold">Android / Chrome</h3>
                          <p className="text-sm text-muted-foreground">
                            Shtyp ikonën me tre pika → "Install app" ose "Add to Home screen"
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Përfitimet e Instalimit</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Funksionon offline - përdore edhe pa internet</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Hapet më shpejt se përmes shfletuesit</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Ikonë në ekranin kryesor si aplikacionet e tjera</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Përdorim më i thjeshtë pa shfletuesin e hapur</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Install;