import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Lock, Unlock, Calendar, Camera, Save, AlertCircle, CheckCircle, XCircle } from "lucide-react";

const Manual = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        {/* Print Button - Hidden on Print */}
        <div className="no-print flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manual Përdorimi</h1>
            <p className="text-muted-foreground">Udhëzues i plotë për Stafin dhe Administratorët</p>
          </div>
          <Button onClick={handlePrint} size="lg">
            <Printer className="mr-2 h-4 w-4" />
            Printo Manualin
          </Button>
        </div>

        {/* Cover Page */}
        <Card className="print-page-break">
          <CardHeader className="text-center space-y-4 py-12">
            <CardTitle className="text-4xl font-bold">MANUAL PËRDORIMI</CardTitle>
            <p className="text-xl text-muted-foreground">Sistem Regjistrimi Ditor</p>
            <p className="text-sm text-muted-foreground">Versioni 1.0</p>
          </CardHeader>
        </Card>

        {/* Table of Contents */}
        <Card className="print-page-break">
          <CardHeader>
            <CardTitle className="text-2xl">Përmbajtja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-bold text-lg">1. Për Stafin</h3>
              <ul className="ml-6 space-y-1 text-sm">
                <li>1.1 Hyrja në Sistem (Verifikimi me PIN)</li>
                <li>1.2 Zgjedhja e Datës dhe Turnit</li>
                <li>1.3 Regjistrimi i Produkteve</li>
                <li>1.4 Regjistrimi i Kafesë</li>
                <li>1.5 Përdorimi i Skanerit të Shiritit</li>
                <li>1.6 Përdorimi i Skanerit të Mullirit</li>
                <li>1.7 Regjistrimi i Pijeve Alkoolike</li>
                <li>1.8 Ruajtja e të Dhënave</li>
                <li>1.9 Koha e Lejuar për Modifikim</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg">2. Për Administratorët</h3>
              <ul className="ml-6 space-y-1 text-sm">
                <li>2.1 Hyrja si Admin</li>
                <li>2.2 Menaxhimi i Stafit (PIN)</li>
                <li>2.3 Menaxhimi i Produkteve</li>
                <li>2.4 Menaxhimi i Llojeve të Kafesë</li>
                <li>2.5 Menaxhimi i Pijeve Alkoolike</li>
                <li>2.6 Modifikimi i të Dhënave të Kaluara</li>
                <li>2.7 Raportet dhe Analizat</li>
                <li>2.8 Menaxhimi i Shpenzimeve</li>
                <li>2.9 Mapping i Produkteve</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 1: STAFF */}
        <Card className="print-page-break">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-3xl flex items-center gap-2">
              <Lock className="h-8 w-8" />
              1. MANUAL PËR STAFIN
            </CardTitle>
          </CardHeader>
        </Card>

        {/* 1.1 Hyrja në Sistem */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">1.1 Hyrja në Sistem (Verifikimi me PIN)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Hapat për të hyrë:
              </h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Hap aplikacionin dhe shko te faqja "Regjistrimi Ditor"</li>
                <li>Do të shfaqet automatikisht një dritare për verifikim</li>
                <li>Fut PIN-in tënd 4-shifror në fushën e dedikuar</li>
                <li>Kliko butonin "Verifiko" ose shtyp Enter</li>
                <li>Nëse PIN-i është i saktë, do të shfaqet mesazhi "Mirë se erdhe, [Emri yt]!"</li>
              </ol>
            </div>

            <div className="p-4 bg-warning/10 border border-warning/50 rounded-lg">
              <p className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                RËNDËSI:
              </p>
              <ul className="ml-6 mt-2 space-y-1 text-sm">
                <li>• PA verifikim me PIN, NUK mund të regjistrosh asnjë të dhënë</li>
                <li>• Të gjitha fushat do të jenë të blokuara derisa të verifikohesh</li>
                <li>• Çdo herë që ndryshon datën, duhet të verifikohesh përsëri</li>
                <li>• Çdo herë që kalon nga Turni 1 në Turni 2, verifikimi mbetet aktiv</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Problemet e mundshme:</h4>
              <ul className="ml-6 space-y-1 text-sm">
                <li>• <strong>PIN i gabuar:</strong> Shfaqet mesazhi "PIN i gabuar ose jo aktiv" - kontakto administratorin</li>
                <li>• <strong>PIN i çaktivizuar:</strong> Administratori mund ta ketë çaktivizuar - kontakto për aktivizim</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 1.2 Zgjedhja e Datës dhe Turnit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">1.2 Zgjedhja e Datës dhe Turnit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Zgjedhja e Datës:
              </h4>
              <ul className="ml-6 space-y-2 list-disc">
                <li>Në krye të faqes, në të djathtë, ke një fushë me ikonë kalendari</li>
                <li>Kliko mbi fushën dhe zgjidh datën që dëshiron</li>
                <li>Normalisht, zgjedh datën e sotme për regjistrim aktual</li>
                <li>Pas zgjedhjes së datës, do të duhet të verifikohesh përsëri me PIN</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Zgjedhja e Turnit:</h4>
              <ul className="ml-6 space-y-2 list-disc">
                <li>Në mes të faqes ka 2 butona: <strong>Turni 1</strong> dhe <strong>Turni 2</strong></li>
                <li>Kliko turnin që dëshiron të regjistrosh</li>
                <li>Emri yt do të shfaqet pranë turnit të zgjedhur</li>
              </ul>
            </div>

            <div className="p-4 bg-info/10 border border-info/50 rounded-lg">
              <p className="font-semibold">Koha e Lejuar për Modifikim:</p>
              <ul className="ml-6 mt-2 space-y-1 text-sm">
                <li>• Ditën e sotme mund të modifikosh gjithmonë</li>
                <li>• Ditën e djeshme mund të modifikosh VETËM brenda 4 orëve pas mesnatës (00:00 - 04:00)</li>
                <li>• Data të tjera të kaluara NUK mund t'i modifikosh (vetëm admini)</li>
                <li>• Nëse shikon mesazhin "🔒 Po shikon të dhëna nga e kaluara", vetëm shikimi është i lejuar</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 1.3 Regjistrimi i Produkteve */}
        <Card className="print-page-break">
          <CardHeader>
            <CardTitle className="text-xl">1.3 Regjistrimi i Produkteve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Fushat në tabelën e produkteve:</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border p-2 text-left">Fusha</th>
                      <th className="border p-2 text-left">Përshkrimi</th>
                      <th className="border p-2 text-left">Kush e plotëson</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2"><strong>Produkti</strong></td>
                      <td className="border p-2">Emri i produktit</td>
                      <td className="border p-2">Vetëm Admin</td>
                    </tr>
                    <tr>
                      <td className="border p-2"><strong>Stok Fillim</strong></td>
                      <td className="border p-2">Sa produkte kishim në fillim të turnit</td>
                      <td className="border p-2">Vetëm Admin</td>
                    </tr>
                    <tr>
                      <td className="border p-2"><strong>Gjendje</strong></td>
                      <td className="border p-2">Sa produkte kemi mbetur në fund të turnit</td>
                      <td className="border p-2 text-success font-semibold">STAFI (TI)</td>
                    </tr>
                    <tr>
                      <td className="border p-2"><strong>Shiriti</strong></td>
                      <td className="border p-2">Sa produkte tregon shiriti (nga skaneri)</td>
                      <td className="border p-2">Vetëm Admin</td>
                    </tr>
                    <tr>
                      <td className="border p-2"><strong>Furnizime</strong></td>
                      <td className="border p-2">Sa produkte u shtuan gjatë turnit</td>
                      <td className="border p-2 text-success font-semibold">STAFI (TI)</td>
                    </tr>
                    <tr>
                      <td className="border p-2"><strong>Dif</strong></td>
                      <td className="border p-2">Diferenca (llogaritet automatikisht)</td>
                      <td className="border p-2">Automatike</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të plotësosh:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li><strong>Gjendje:</strong> Numëro produktet që kanë mbetur në fund të turnit dhe shkruaj në kolonën "Gjendje"</li>
                <li><strong>Furnizime:</strong> Nëse janë shtuar produkte gjatë turnit, shkruaj sasinë në kolonën "Furnizime" (me ngjyrë të gjelbër)</li>
                <li>Nëse diferenca nuk është 0, do të shfaqet me ngjyrë të verdhë (warning)</li>
              </ol>
            </div>

            <div className="p-4 bg-success/10 border border-success/50 rounded-lg">
              <p className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                TOTALI:
              </p>
              <p className="text-sm mt-2">Në fund të tabelës do të shohësh një rresht "TOTALI" që mbledh automatikisht të gjitha vlerat.</p>
            </div>
          </CardContent>
        </Card>

        {/* 1.4 Regjistrimi i Kafesë */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">1.4 Regjistrimi i Kafesë</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Llojet e Kafesë:</h4>
              <p className="text-sm">Në tabelën e kafesë do të shohësh të gjitha llojet e kafeve që shërben biznesi (Espresso, Cappuccino, etj.)</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të regjistrosh:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Për çdo lloj kafe, shkruaj sasinë e shitur gjatë turnit</li>
                <li>Mund të përdorësh numra dhjetorë (p.sh. 15.5 kg)</li>
                <li>Nëse nuk është shitur asnjë nga një lloj, lëre bosh ose shkruaj 0</li>
              </ol>
            </div>

            <div className="p-4 bg-info/10 border border-info/50 rounded-lg">
              <p className="font-semibold">Totali i Kafesë:</p>
              <p className="text-sm mt-2">Në fund të tabelës do të shohësh "TOTALI" që llogarit automatikisht sasinë totale të kafesë së shitur në turn.</p>
            </div>

            <div className="p-4 bg-warning/10 border border-warning/50 rounded-lg">
              <p className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                RËNDËSI:
              </p>
              <p className="text-sm mt-2">Kjo sasi lidhet me "Diferenca Mulliri" dhe duhet të jetë sa më e saktë.</p>
            </div>
          </CardContent>
        </Card>

        {/* 1.5 Përdorimi i Skanerit të Shiritit */}
        <Card className="print-page-break">
          <CardHeader>
            <CardTitle className="text-xl">1.5 Përdorimi i Skanerit të Shiritit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Çfarë është skaneri i shiritit:
              </h4>
              <p className="text-sm">Skaneri i shiritit është një funksion që lexon automatikisht të dhënat nga fotoja e shiritit (receipt) të shtypshëm.</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Hapat për të përdorur skanerin:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Në seksionin "Produktet", në krah të titullit, ke një buton me ikonë kamere "📸 Skaneri i Shiritit"</li>
                <li>Kliko butonin dhe do të hapet një dritare</li>
                <li>Kliko "Ngarko Foto" dhe zgjidh foton e shiritit nga telefoni/kompjuteri</li>
                <li>Prit disa sekonda derisa AI të analizojë foton</li>
                <li>Skaneri do të lexojë automatikisht:
                  <ul className="ml-6 mt-1 space-y-1 list-disc">
                    <li>Vlerat e produkteve nga shiriti</li>
                    <li>Vlerat e kafesë</li>
                    <li>Xhiro totale</li>
                    <li>Pijet alkoolike (nëse ka)</li>
                  </ul>
                </li>
                <li>Do të shohësh mesazhin "✅ Të dhënat u ngarkuan me sukses!"</li>
                <li>Fushat përkatëse do të plotësohen automatikisht</li>
              </ol>
            </div>

            <div className="p-4 bg-success/10 border border-success/50 rounded-lg">
              <p className="font-semibold">Avantazhe:</p>
              <ul className="ml-6 mt-2 space-y-1 text-sm">
                <li>• Shpëton kohë - nuk duhet të shkruash manualisht</li>
                <li>• Redukton gabimet - AI lexon saktë numrat</li>
                <li>• Plotëson shumë fusha njëherësh</li>
              </ul>
            </div>

            <div className="p-4 bg-warning/10 border border-warning/50 rounded-lg">
              <p className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Kujdes:
              </p>
              <ul className="ml-6 mt-2 space-y-1 text-sm">
                <li>• Sigurohu që fotoja të jetë e qartë dhe e lexueshme</li>
                <li>• Kontrollo të dhënat pas skanimit - mund të ketë gabime</li>
                <li>• Nëse AI nuk lexon saktë, plotëso manualisht</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 1.6 Përdorimi i Skanerit të Mullirit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">1.6 Përdorimi i Skanerit të Mullirit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Çfarë është Mulliri:</h4>
              <p className="text-sm">Mulliri matet në kilogramë (kg) dhe tregon sasinë e kafesë së përpunuar.</p>
              <ul className="ml-6 mt-2 space-y-1 text-sm list-disc">
                <li><strong>Mulliri Fillim:</strong> Sa kg kishim në fillim të turnit</li>
                <li><strong>Mulliri Perfund:</strong> Sa kg kemi në fund të turnit</li>
                <li><strong>Diferenca Mulliri:</strong> Llogaritet automatikisht (Fillim - Perfund - Totali Kafes)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Hapat për të skanuar Mullirin Perfund:
              </h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Në seksionin "Xhiro dhe Të Dhëna Shtesë", pranë fushës "Mulliri Perfund", ke një buton me ikonë kamere</li>
                <li>Kliko butonin "📸 Skano Mullirin"</li>
                <li>Ngarko foton e mullirit (ekranin që tregon kilogramët)</li>
                <li>AI do të lexojë automatikisht vlerën në kg</li>
                <li>Vlera do të shkruhet automatikisht në fushë</li>
              </ol>
            </div>

            <div className="p-4 bg-info/10 border border-info/50 rounded-lg">
              <p className="font-semibold">Rëndësia e Diferencës:</p>
              <p className="text-sm mt-2">Diferenca e mullirit duhet të jetë sa më afër 0. Nëse është shumë e lartë, mund të tregojë:</p>
              <ul className="ml-6 mt-1 space-y-1 text-sm list-disc">
                <li>• Gabim në matje</li>
                <li>• Kafja e pa regjistruar</li>
                <li>• Problem teknik</li>
              </ul>
            </div>

            <div className="p-4 bg-warning/10 border border-warning/50 rounded-lg">
              <p className="font-semibold">Kujdes për Turni 2:</p>
              <p className="text-sm mt-2">Për Turnin 2, "Mulliri Fillim" merret automatikisht nga "Mulliri Perfund" i Turnit 1. Nuk mund ta ndryshosh.</p>
            </div>
          </CardContent>
        </Card>

        {/* 1.7 Regjistrimi i Pijeve Alkoolike */}
        <Card className="print-page-break">
          <CardHeader>
            <CardTitle className="text-xl">1.7 Regjistrimi i Pijeve Alkoolike</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Si funksionon:</h4>
              <p className="text-sm">Sistemi i pijeve alkoolike menaxhohet nga një inventar qendror që përditësohet automatikisht.</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Fushat në tabelë:</h4>
              <ul className="ml-6 space-y-2 list-disc">
                <li><strong>Pija:</strong> Emri i pijës (Raki, Birra, etj.)</li>
                <li><strong>Gjendje Aktuale:</strong> Sa copë kemi aktualisht në magazinë (lexim only)</li>
                <li><strong>Shitje:</strong> Sa copë u shitën në këtë turn (këtë e shkruan stafi)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të regjistrosh shitjet:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Shiko kolonën "Gjendje Aktuale" për të parë sa copë kemi</li>
                <li>Numëro sa copë u shitën gjatë këtij turni</li>
                <li>Shkruaj numrin në kolonën "Shitje"</li>
                <li>Kur të klikosh "💾 Ruaj të Dhënat", sistemi do të:
                  <ul className="ml-6 mt-1 space-y-1 list-disc">
                    <li>Zvogëlojë "Gjendjen Aktuale" me sasinë e shitur</li>
                    <li>Përditësojë inventarin qendror</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="p-4 bg-warning/10 border border-warning/50 rounded-lg">
              <p className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Paralajmërim për stok të ulët:
              </p>
              <p className="text-sm mt-2">Nëse një pije ka më pak se 5 copë, numri do të shfaqet me ngjyrë <span className="text-warning font-semibold">TË VERDHË</span> për të tërhequr vëmendjen.</p>
            </div>

            <div className="p-4 bg-info/10 border border-info/50 rounded-lg">
              <p className="font-semibold">Automatizimi:</p>
              <p className="text-sm mt-2">Pas ruajtjes, nuk duhet të bësh asgjë tjetër. Sistemi do të përditësojë automatikisht inventarin për turnet e ardhshme.</p>
            </div>
          </CardContent>
        </Card>

        {/* 1.8 Ruajtja e të Dhënave */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">1.8 Ruajtja e të Dhënave</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Save className="h-4 w-4" />
                Si të ruash:
              </h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Pasi të kesh plotësuar të gjitha fushat e kërkuara</li>
                <li>Skrollo poshtë deri në fund të faqes</li>
                <li>Do të shohësh një kartë "Përmbledhje" me:
                  <ul className="ml-6 mt-1 space-y-1 list-disc">
                    <li>Xhiro Totale (Turni 1 + Turni 2)</li>
                    <li>Xhiro T1</li>
                    <li>Xhiro T2</li>
                  </ul>
                </li>
                <li>Kliko butonin "💾 Ruaj të Dhënat"</li>
                <li>Do të shfaqet mesazhi "✅ Të dhënat u ruajtën! Xhiro totale: XXX ALL"</li>
              </ol>
            </div>

            <div className="p-4 bg-success/10 border border-success/50 rounded-lg">
              <p className="font-semibold">Çfarë ruhet:</p>
              <ul className="ml-6 mt-2 space-y-1 text-sm">
                <li>• Të gjitha produktet (gjendje, furnizime)</li>
                <li>• Të gjitha llojet e kafesë</li>
                <li>• Xhiro, Mulliri Fillim, Mulliri Perfund</li>
                <li>• Shitjet e pijeve alkoolike</li>
                <li>• Të dhënat për turnet e ardhshme (stoku për nesër)</li>
              </ul>
            </div>

            <div className="p-4 bg-warning/10 border border-warning/50 rounded-lg">
              <p className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Probleme të mundshme:
              </p>
              <div className="space-y-2 mt-2">
                <p className="text-sm font-semibold">Nëse të dhënat nuk ruhen:</p>
                <ol className="ml-6 space-y-1 text-sm list-decimal">
                  <li>Kliko butonin "🔍 Test Storage" për të kontrolluar</li>
                  <li>Mbyll tabs të tjera të kësaj faqeje</li>
                  <li>Rifresko faqen (tërhiq poshtë)</li>
                  <li>Sigurohu që "Private Browsing" të jetë OFF</li>
                  <li>Nëse problemi vazhdon, kontakto administratorin</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 1.9 Koha e Lejuar */}
        <Card className="print-page-break">
          <CardHeader>
            <CardTitle className="text-xl">1.9 Koha e Lejuar për Modifikim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Rregullat kohore:</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border p-2 text-left">Data</th>
                      <th className="border p-2 text-left">A mund të modifikosh?</th>
                      <th className="border p-2 text-left">Kushti</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2"><strong>Sot</strong></td>
                      <td className="border p-2 text-success">✅ PO</td>
                      <td className="border p-2">Gjithmonë, pa kufizime</td>
                    </tr>
                    <tr>
                      <td className="border p-2"><strong>Dje</strong></td>
                      <td className="border p-2 text-success">✅ PO</td>
                      <td className="border p-2">Vetëm 00:00 - 04:00 (4 orë pas mesnatës)</td>
                    </tr>
                    <tr>
                      <td className="border p-2"><strong>Më herët se dje</strong></td>
                      <td className="border p-2 text-destructive">❌ JO</td>
                      <td className="border p-2">Vetëm admini mund të modifikojë</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-info/10 border border-info/50 rounded-lg">
              <p className="font-semibold">Mesazhet që mund të shohësh:</p>
              <ul className="ml-6 mt-2 space-y-2 text-sm">
                <li>• <span className="text-success font-semibold">✅</span> "Jeni brenda 10 minutave pas mesnatës - mund të modifikoni të dhënat e djeshme" - Mund të regjistrosh</li>
                <li>• <span className="text-warning font-semibold">🔒</span> "Po shikon të dhëna nga e kaluara. Vetëm shikimi është i lejuar" - NUK mund të regjistrosh</li>
              </ul>
            </div>

            <div className="p-4 bg-warning/10 border border-warning/50 rounded-lg">
              <p className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Pse ka këto kufizime:
              </p>
              <p className="text-sm mt-2">Këto rregulla janë për të parandaluar ndryshime të pa autorizuara në të dhënat historike dhe për të mbajtur një audit trail të saktë.</p>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: ADMIN */}
        <Card className="print-page-break">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="text-3xl flex items-center gap-2">
              <Unlock className="h-8 w-8" />
              2. MANUAL PËR ADMINISTRATORËT
            </CardTitle>
          </CardHeader>
        </Card>

        {/* 2.1 Hyrja si Admin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">2.1 Hyrja si Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Hapat për të hapur modalitetin Admin:
              </h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Në krye të faqes "Regjistrimi Ditor", në të djathtë, ke një buton "Admin"</li>
                <li>Kliko butonin dhe do të hapet një dritare për fjalëkalim</li>
                <li>Fut fjalëkalimin e administratorit</li>
                <li>Kliko "Vazhdo" ose shtyp Enter</li>
                <li>Nëse fjalëkalimi është i saktë, do të shfaqet mesazhi "✅ Admin u hap me sukses!"</li>
                <li>Butoni do të ndryshojë në "Admin (Mbyll)" me ikonë <Unlock className="h-3 w-3 inline" /></li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Çfarë mund të bësh si Admin:</h4>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Modifikon të gjitha fushat në çdo datë (pa kufizime kohore)</li>
                <li>Modifikon emrat e produkteve</li>
                <li>Shton dhe fshin produkte</li>
                <li>Modifikon "Stok Fillim" dhe "Shiriti"</li>
                <li>Modifikon "Mulliri Fillim" dhe "Mulliri Perfund"</li>
                <li>Akseson Dashboard-in për menaxhim</li>
                <li>Shikon raportet dhe analizat</li>
                <li>Menaxhon stafin dhe PIN-et</li>
              </ul>
            </div>

            <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
              <p className="font-semibold flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                RËNDËSI:
              </p>
              <p className="text-sm mt-2">Fjalëkalimi i administratorit është <strong>SHUMË I RËNDËSISHËM</strong>. Mos e ndaj me askënd përveç administratorëve të autorizuar.</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të mbyllësh modalitetin Admin:</h4>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Kliko përsëri butonin "Admin (Mbyll)"</li>
                <li>Do të shfaqet mesazhi "Admin u mbyll"</li>
                <li>Tani do të kesh të njëjtat kufizime si stafi</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 2.2 Menaxhimi i Stafit */}
        <Card className="print-page-break">
          <CardHeader>
            <CardTitle className="text-xl">2.2 Menaxhimi i Stafit (PIN)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Si të aksesosh menaxhimin e stafit:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Hyr si Admin (shih seksionin 2.1)</li>
                <li>Shko te faqja "Dashboard" nga navigimi</li>
                <li>Skrollo poshtë deri te seksioni "Menaxhimi i PIN për Stafin"</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të shtosh një anëtar të ri të stafit:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Kliko butonin "+ Shto Staf të Ri"</li>
                <li>Do të shtohet një rresht i ri në fund të tabelës</li>
                <li>Plotëso fushat:
                  <ul className="ml-6 mt-1 space-y-1 list-disc">
                    <li><strong>Emri i Stafit:</strong> P.sh. "Artan Krasniqi"</li>
                    <li><strong>PIN (4 shifra):</strong> P.sh. "1234" (duhet të jetë unik)</li>
                    <li><strong>Aktiv:</strong> Lëre të çekuar (switch në të gjelbër)</li>
                  </ul>
                </li>
                <li>Kliko "💾 Ruaj Ndryshimet"</li>
                <li>Informo anëtarin e stafit për PIN-in e tij</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të çaktivizosh një anëtar të stafit:</h4>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Gjej anëtarin në tabelë</li>
                <li>Kliko switch-in "Aktiv" për ta çaktivizuar (do të bëhet i kuq)</li>
                <li>Kliko "💾 Ruaj Ndryshimet"</li>
                <li>Anëtari nuk do të mund të hyjë më me PIN-in e tij</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të ndryshosh PIN-in:</h4>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Gjej anëtarin në tabelë</li>
                <li>Ndrysho numrin në kolonën "PIN"</li>
                <li>Kliko "💾 Ruaj Ndryshimet"</li>
                <li>Informo anëtarin për PIN-in e ri</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të fshish një anëtar të stafit:</h4>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Gjej anëtarin në tabelë</li>
                <li>Kliko butonin e kuq "Fshi" në kolonën e fundit</li>
                <li>Konfirmo fshirjen</li>
                <li>Anëtari do të fshihet përfundimisht</li>
              </ul>
            </div>

            <div className="p-4 bg-warning/10 border border-warning/50 rounded-lg">
              <p className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                KUJDES:
              </p>
              <ul className="ml-6 mt-2 space-y-1 text-sm">
                <li>• PIN duhet të jetë 4 shifra</li>
                <li>• Çdo PIN duhet të jetë unik (nuk lejohen dublikata)</li>
                <li>• Mbaji PIN-et konfidenciale</li>
                <li>• Ndrysho PIN-in nëse dyshohet për kompromentim</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 2.3 Menaxhimi i Produkteve */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">2.3 Menaxhimi i Produkteve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Si të shtosh një produkt të ri:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Hyr si Admin</li>
                <li>Në tabelën e produkteve, skrollo poshtë deri në fund</li>
                <li>Do të shohësh një rresht me fushë të zbrazët dhe buton "+ Shto Produkt"</li>
                <li>Shkruaj emrin e produktit të ri në fushë (p.sh. "Suxhuk")</li>
                <li>Kliko "+ Shto Produkt" ose shtyp Enter</li>
                <li>Produkti do të shtohet në listë dhe do të jetë i disponueshëm në të gjitha turnet</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të modifikosh emrin e një produkti:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Hyr si Admin</li>
                <li>Në kolonën "Produkti", pranë emrit, do të shohësh një ikonë laps ✏️</li>
                <li>Kliko ikonën e lapsit</li>
                <li>Emri do të bëhet i modifikueshëm</li>
                <li>Shkruaj emrin e ri</li>
                <li>Kliko shenjën ✓ (të gjelbër) për të ruajtur ose ✕ (të kuqe) për të anuluar</li>
                <li>Emri do të përditësohet në të gjitha turnet</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të fshish një produkt:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Hyr si Admin</li>
                <li>Në kolonën e fundit të tabelës, do të shohësh një buton ✕ të kuq</li>
                <li>Kliko butonin për produktin që dëshiron të fshish</li>
                <li>Produkti do të fshihet nga lista</li>
              </ol>
            </div>

            <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
              <p className="font-semibold flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                KUJDES ME FSHIRJEN:
              </p>
              <ul className="ml-6 mt-2 space-y-1 text-sm">
                <li>• Fshirja e një produkti është e PËRHERSHME</li>
                <li>• TË GJITHA të dhënat historike për atë produkt do të humbasin</li>
                <li>• Këshillohet të bësh backup para se të fshish produkte të rëndësishme</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Menaxhimi në Dashboard:</h4>
              <p className="text-sm">Për menaxhim më të avancuar (reradhitje, import/export), shko te Dashboard → Menaxhimi i Produkteve.</p>
            </div>
          </CardContent>
        </Card>

        {/* 2.4-2.9 Quick Reference */}
        <Card className="print-page-break">
          <CardHeader>
            <CardTitle className="text-xl">2.4-2.9 Menaxhime të Tjera</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h4 className="font-semibold">2.4 Menaxhimi i Llojeve të Kafesë</h4>
              <p className="text-sm">Dashboard → Llojet e Kafesë</p>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Shto lloje të reja kafe (Espresso, Cappuccino, etj.)</li>
                <li>Reradhit llojet sipas preferencës</li>
                <li>Fshi lloje që nuk përdoren më</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">2.5 Menaxhimi i Pijeve Alkoolike</h4>
              <p className="text-sm">Dashboard → Pijet Alkoolike</p>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Shto pije të reja në inventar</li>
                <li>Përditëso furnizime (shto stok)</li>
                <li>Kontrollo gjendjen aktuale</li>
                <li>Shiko historinë e shitjeve</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">2.6 Modifikimi i të Dhënave të Kaluara</h4>
              <p className="text-sm">Si Admin, nuk ke kufizime kohore:</p>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Mund të modifikosh çdo datë në të kaluarën</li>
                <li>Mund të ndryshosh të gjitha fushat</li>
                <li>Përgjegjësia është e jotja për ndryshime të sakta</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">2.7 Raportet dhe Analizat</h4>
              <p className="text-sm">Navigimi → Raportet</p>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Shiko xhiro ditore, javore, mujore</li>
                <li>Analizo performancën e produkteve</li>
                <li>Krahasо turnet</li>
                <li>Eksporto raporte në Excel</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">2.8 Menaxhimi i Shpenzimeve</h4>
              <p className="text-sm">Navigimi → Shpenzimet</p>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Regjistro shpenzime të biznesit</li>
                <li>Kategorizо sipas llojit</li>
                <li>Shto shënime dhe receta</li>
                <li>Gjenerо raporte shpenzimesh</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">2.9 Mapping i Produkteve</h4>
              <p className="text-sm">Regjistrimi Ditor → Butoni "Mapping"</p>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Lidh produktet nga shiriti me produktet në sistem</li>
                <li>Krijon lidhje automatike për skanim më të shpejtë</li>
                <li>Përmirëson saktësinë e skanimit të shiritit</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Final Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Shënime të Fundit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Kontakt për Mbështetje:</h4>
              <p className="text-sm">Nëse has probleme teknike ose ke pyetje, kontakto administratorin e sistemit.</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Këshilla për Përdorim të Suksesshëm:</h4>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Ruaj të dhënat rregullisht për të shmangur humbjen</li>
                <li>Kontrollo diferencat para se të ruash</li>
                <li>Përdor skanerët për të kursyer kohë</li>
                <li>Mbaj konfidenciale PIN-et</li>
                <li>Raporto menjëherë probleme të sigurisë</li>
              </ul>
            </div>

            <div className="p-4 bg-muted border rounded-lg text-center">
              <p className="text-sm font-semibold">Versioni i Manualit: 1.0</p>
              <p className="text-xs text-muted-foreground mt-1">Përditësimi i fundit: {new Date().toLocaleDateString('sq-AL')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Print-only Footer */}
        <div className="print-only text-center text-xs text-muted-foreground mt-8">
          <p>© {new Date().getFullYear()} - Sistem Regjistrimi Ditor</p>
          <p>Ky manual është pronë e biznesit dhe është konfidencial</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-page-break {
            page-break-after: always;
            break-after: page;
          }
          
          .print-only {
            display: block !important;
          }
          
          body {
            font-size: 11pt;
            line-height: 1.4;
          }
          
          h1, h2, h3, h4 {
            page-break-after: avoid;
          }
          
          table {
            page-break-inside: avoid;
          }
          
          @page {
            margin: 2cm;
            size: A4;
          }
        }
        
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default Manual;
