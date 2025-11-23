import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Coffee, FileText, BarChart3, Camera, Settings, Calendar, Download } from "lucide-react";

const Manual = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Manual Përdorimi</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Mirësevini në Bulevard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Ky aplikacion ju ndihmon të menaxhoni shitjet ditore, inventarin dhe raportet për biznesin tuaj. 
              Më poshtë gjeni udhëzime të hollësishme për përdorimin e çdo funksioni.
            </p>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="space-y-4">
          {/* Dashboard */}
          <AccordionItem value="dashboard" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="font-semibold">Dashboard (Faqja Kryesore)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-4">
              <h4 className="font-medium">Çfarë shihni këtu:</h4>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Përmbledhje e shitjeve ditore (Xhiro totale)</li>
                <li>Statistika për të dy turnet</li>
                <li>Akses i shpejtë te regjistrimi ditor dhe raportet</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Daily Entry */}
          <AccordionItem value="daily-entry" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-semibold">Regjistrimi Ditor</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <h4 className="font-medium mb-2">Si të përdorni:</h4>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground ml-4">
                  <li>
                    <strong className="text-foreground">Zgjidhni datën:</strong> Klikoni në kalendar për të zgjedhur datën e regjistrimit
                  </li>
                  <li>
                    <strong className="text-foreground">Shikoni të dy turnet:</strong> Faqja "Regjistrimi Ditor" tregon të dyja turnet (Turn 1 dhe Turn 2)
                  </li>
                  <li>
                    <strong className="text-foreground">Redaktoni produktet:</strong> Mund të ndryshoni sasitë, çmimet dhe të shtoni produkte të reja
                  </li>
                  <li>
                    <strong className="text-foreground">Kopjoni nga Turn 1 në Turn 2:</strong> Përdorni butonin "Kopjo stokun e kalkuluar në Turn 2"
                  </li>
                </ol>
              </div>

              <div>
                <h4 className="font-medium mb-2">Turnet Individuale:</h4>
                <p className="text-muted-foreground mb-2">Mund të hapni secilën turn veç e veç:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong className="text-foreground">Turn 1:</strong> Mëngjesi - Regjistroni shitjet dhe stokun e mëngjesit</li>
                  <li><strong className="text-foreground">Turn 2:</strong> Pasdite - Regjistroni shitjet dhe stokun e pasdites</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Products */}
          <AccordionItem value="products" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-primary" />
                <span className="font-semibold">Menaxhimi i Produkteve</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <h4 className="font-medium mb-2">Si të menaxhoni produktet:</h4>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground ml-4">
                  <li>
                    <strong className="text-foreground">Shtoni produkt të ri:</strong> Klikoni "Shto Produkt" dhe shkruani emrin
                  </li>
                  <li>
                    <strong className="text-foreground">Fshini produkt:</strong> Klikoni ikonën e fshirjes pranë produktit
                  </li>
                  <li>
                    <strong className="text-foreground">Rivendosni produktet:</strong> Përdorni butonin "🔄 Rivendos Produktet" për të kthyer produktet default
                  </li>
                </ol>
              </div>

              <div>
                <h4 className="font-medium mb-2">Lista Default e Produkteve:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>• Kanace</div>
                  <div>• Uje .vit</div>
                  <div>• Heineken shishe</div>
                  <div>• Korona</div>
                  <div>• Paulaner</div>
                  <div>• Rose</div>
                  <div>• Red.bull</div>
                  <div>• B 52</div>
                  <div>• Crodino</div>
                  <div>• Biter</div>
                  <div>• Bustina</div>
                  <div>• Uje</div>
                  <div>• Caj</div>
                  <div>• Caj bio</div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Coffee */}
          <AccordionItem value="coffee" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Coffee className="h-5 w-5 text-primary" />
                <span className="font-semibold">Kafet & Sasitë</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-4">
              <h4 className="font-medium">Llojet e kafeve:</h4>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong className="text-foreground">Espresso:</strong> Kafe e zezë</li>
                <li><strong className="text-foreground">Kapuçino:</strong> Kafe me qumësht</li>
                <li><strong className="text-foreground">Makiato:</strong> Espresso me njollë qumështi</li>
                <li><strong className="text-foreground">Amerikano:</strong> Espresso me ujë</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                Për çdo lloj kafe mund të regjistroni sasitë e shitura dhe çmimin.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Receipt Scanner */}
          <AccordionItem value="scanner" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-primary" />
                <span className="font-semibold">Skaneri i Faturave</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <h4 className="font-medium mb-2">Si të përdorni skanerin:</h4>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground ml-4">
                  <li>
                    <strong className="text-foreground">Klikoni "Skano Faturën":</strong> Hapet kamera ose galeria
                  </li>
                  <li>
                    <strong className="text-foreground">Bëni foto të faturës:</strong> Sigurohuni që teksti është i lexueshëm
                  </li>
                  <li>
                    <strong className="text-foreground">Prisni analizën:</strong> AI lexon automatikisht produktet dhe çmimet
                  </li>
                  <li>
                    <strong className="text-foreground">Verifiko të dhënat:</strong> Kontrolloni dhe korrigjoni nëse është e nevojshme
                  </li>
                </ol>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                💡 <strong>Këshillë:</strong> Për rezultate më të mira, bëni foto në dritë të mirë dhe mbajeni kamerën paralel me faturën.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Reports */}
          <AccordionItem value="reports" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="font-semibold">Raportet</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-4">
              <h4 className="font-medium">Çfarë përmban faqja e raporteve:</h4>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Shitjet ditore, javore dhe mujore</li>
                <li>Grafik me tendencat e shitjeve</li>
                <li>Krahasim mes turneve</li>
                <li>Produktet më të shitura</li>
                <li>Eksport i të dhënave (në të ardhmen)</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Calendar */}
          <AccordionItem value="calendar" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-semibold">Punoni me Data të Kaluara</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <h4 className="font-medium mb-2">Redaktimi i datave të kaluara:</h4>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground ml-4">
                  <li>
                    <strong className="text-foreground">Klikoni butonin "Hyr si Admin":</strong> Do t'ju kërkohet fjalëkalimi
                  </li>
                  <li>
                    <strong className="text-foreground">Futni fjalëkalimin admin:</strong> Pasi të identifikoheni, mund të redaktoni data të kaluara
                  </li>
                  <li>
                    <strong className="text-foreground">Bëni ndryshimet:</strong> Të gjitha fushat do të jenë të modifikueshme
                  </li>
                  <li>
                    <strong className="text-foreground">Ruani:</strong> Klikoni "Ruaj" për të përditësuar të dhënat
                  </li>
                </ol>
              </div>
              <p className="text-sm text-muted-foreground bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                ⚠️ <strong>Kujdes:</strong> Ndryshimi i datave të kaluara do të ndikojë në raportet dhe statistikat.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Install */}
          <AccordionItem value="install" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-primary" />
                <span className="font-semibold">Instalimi i Aplikacionit</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <h4 className="font-medium mb-2">Si të instaloni në celular:</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-foreground mb-2">📱 iPhone/iPad:</h5>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4 text-sm">
                      <li>Hapni faqen në Safari</li>
                      <li>Klikoni ikonën "Share" (shigjetë që del nga katrori)</li>
                      <li>Zgjidhni "Add to Home Screen"</li>
                      <li>Konfirmoni instalimin</li>
                    </ol>
                  </div>
                  <div>
                    <h5 className="font-medium text-foreground mb-2">📱 Android:</h5>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4 text-sm">
                      <li>Hapni faqen në Chrome</li>
                      <li>Klikoni "Instalo" kur shfaqet pop-up-i</li>
                      <li>Ose klikoni ⋮ (menu) → "Install app"</li>
                      <li>Konfirmoni instalimin</li>
                    </ol>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground bg-primary/10 border border-primary/20 p-3 rounded-lg">
                ✨ <strong>Përfitimet:</strong> Aplikacioni do të hapet si një app native dhe do të funksionojë edhe offline!
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Tips */}
          <AccordionItem value="tips" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <span className="text-xl">💡</span>
                <span className="font-semibold">Këshilla & Truke</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-4">
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2">
                  <span>✓</span>
                  <span><strong className="text-foreground">Ruani rregullisht:</strong> Klikoni "Ruaj" çdo herë pas ndryshimeve të rëndësishme</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span><strong className="text-foreground">Verifikoni kalkulimet:</strong> Sistemi kalkulon automatikisht fitimin dhe stokun</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span><strong className="text-foreground">Përdorni skanerin:</strong> Kursen kohë dhe redukton gabimet</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span><strong className="text-foreground">Instaloni aplikacionin:</strong> Për performancë më të mirë</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span><strong className="text-foreground">Backup-oni të dhënat:</strong> Eksportoni raportet rregullisht (së shpejti)</span>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Support */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-xl">❓</span>
              Ndihmë e Mëtejshme
            </h3>
            <p className="text-sm text-muted-foreground">
              Nëse keni pyetje ose hasni në probleme, kontaktoni administratorin e sistemit ose ekipin e mbështetjes teknike.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Manual;