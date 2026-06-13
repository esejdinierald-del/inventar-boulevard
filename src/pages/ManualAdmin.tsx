import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Unlock, AlertCircle, XCircle, Lock, ShieldCheck, LockKeyhole, UnlockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ManualAdmin = () => {
  const navigate = useNavigate();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Auto-unlock if an admin session already exists
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.is_anonymous) return;
      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (isAdmin === true) setIsUnlocked(true);
    })();
  }, []);

  const handlePrint = () => window.print();

  const handleUnlock = async () => {
    if (!email || !password) {
      toast.error("Plotëso email-in dhe fjalëkalimin");
      return;
    }
    try {
      setIsAuthenticating(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.user) {
        toast.error("Email ose fjalëkalim i pavlefshëm");
        return;
      }
      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: data.user.id, _role: 'admin' });
      if (!isAdmin) {
        await supabase.auth.signOut();
        toast.error("Kjo llogari nuk ka të drejta admini");
        return;
      }
      setIsUnlocked(true);
      toast.success("Manuali u hap me sukses!");
    } catch (err) {
      console.error('Admin login error:', err);
      toast.error("Gabim gjatë hyrjes");
    } finally {
      setIsAuthenticating(false);
      setPassword("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleUnlock();
  };

  if (!isUnlocked) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Manual për Administratorët</CardTitle>
              <p className="text-muted-foreground mt-2">
                Ky manual është i mbrojtur. Fut fjalëkalimin e administratorit për të vazhduar.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Fut fjalëkalimin..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/manual')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Mbrapa
                </Button>
                <Button className="flex-1" onClick={handleUnlock}>
                  <Lock className="mr-2 h-4 w-4" />
                  Hap Manualin
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        {/* Print Button - Hidden on Print */}
        <div className="no-print flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/manual')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Mbrapa
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Manual për Administratorët</h1>
              <p className="text-muted-foreground">Udhëzues i plotë për menaxhim</p>
            </div>
          </div>
          <Button onClick={handlePrint} size="lg">
            <Printer className="mr-2 h-4 w-4" />
            Printo
          </Button>
        </div>

        {/* Cover Page */}
        <Card className="print-page-break">
          <CardHeader className="text-center space-y-4 py-12">
            <CardTitle className="text-4xl font-bold">MANUAL PËR ADMINISTRATORËT</CardTitle>
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
              <ul className="ml-6 space-y-1 text-sm">
                <li>1. Hyrja si Admin</li>
                <li>2. Menaxhimi i Stafit (PIN)</li>
                <li>3. Menaxhimi i Produkteve</li>
                <li>4. Menaxhimi i Llojeve të Kafesë</li>
                <li>5. Menaxhimi i Pijeve Alkoolike</li>
                <li>6. Modifikimi i të Dhënave të Kaluara</li>
                <li>7. Zhbllokimi i Turneve të Kyçura</li>
                <li>8. Raportet dhe Analizat</li>
                <li>9. Menaxhimi i Shpenzimeve</li>
                <li>10. Mapping i Produkteve</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 1. Hyrja si Admin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">1. Hyrja si Admin</CardTitle>
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
              <h4 className="font-semibold">Ndryshimi i fjalëkalimit:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Shko te Dashboard</li>
                <li>Skrollo poshtë te "Menaxhimi i Admin Settings"</li>
                <li>Fut fjalëkalimin aktual</li>
                <li>Fut fjalëkalimin e ri (2 herë për konfirmim)</li>
                <li>Kliko "Ruaj Fjalëkalimin"</li>
              </ol>
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

        {/* 2. Menaxhimi i Stafit */}
        <Card className="print-page-break">
          <CardHeader>
            <CardTitle className="text-xl">2. Menaxhimi i Stafit (PIN)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Si të aksesosh menaxhimin e stafit:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Hyr si Admin (shih seksionin 1)</li>
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

        {/* 3. Menaxhimi i Produkteve */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">3. Menaxhimi i Produkteve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Menaxhimi direkt në Regjistrimin Ditor:</h4>
            </div>

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
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Reradhitje produktesh (drag & drop)</li>
                <li>Modifikim masiv</li>
                <li>Eksportim në Excel</li>
                <li>Import nga Excel</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 4. Menaxhimi i Llojeve të Kafesë */}
        <Card className="print-page-break">
          <CardHeader>
            <CardTitle className="text-xl">4. Menaxhimi i Llojeve të Kafesë</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Si të aksesosh:</h4>
              <p className="text-sm">Dashboard → Llojet e Kafesë</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Funksionalitetet:</h4>
              <ul className="ml-6 space-y-2 list-disc">
                <li><strong>Shto lloje të reja:</strong> Kliko "+ Shto Lloj të Ri" dhe shkruaj emrin (p.sh. "Macchiato")</li>
                <li><strong>Reradhit llojet:</strong> Përdor drag & drop për të ndryshuar rendin e shfaqjes</li>
                <li><strong>Modifiko emrat:</strong> Kliko mbi emër për të modifikuar</li>
                <li><strong>Fshi lloje:</strong> Kliko butonin "Fshi" për lloje që nuk përdoren</li>
              </ul>
            </div>

            <div className="p-4 bg-info/10 border border-info/50 rounded-lg">
              <p className="font-semibold">Rendi i shfaqjes:</p>
              <p className="text-sm mt-2">Rendi që vendos këtu do të jetë rendi që stafi do të shohë në tabelën e kafesë gjatë regjistrimit ditor.</p>
            </div>
          </CardContent>
        </Card>

        {/* 5. Menaxhimi i Pijeve Alkoolike */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">5. Menaxhimi i Pijeve Alkoolike</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Si të aksesosh:</h4>
              <p className="text-sm">Dashboard → Pijet Alkoolike</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Fushat në inventar:</h4>
              <ul className="ml-6 space-y-2 list-disc">
                <li><strong>Pija:</strong> Emri i pijës</li>
                <li><strong>Furnizime:</strong> Sa copë janë shtuar në magazinë</li>
                <li><strong>Shitje:</strong> Sa copë janë shitur (automatik nga turnet)</li>
                <li><strong>Gjendje:</strong> Sa copë kemi aktualisht (Fillim + Furnizime - Shitje)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të shtosh furnizime të reja:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Gjej pijen në listë</li>
                <li>Në kolonën "Furnizime", shto sasinë e re (p.sh. +10)</li>
                <li>Kliko "💾 Ruaj Ndryshimet"</li>
                <li>Gjendja do të përditësohet automatikisht</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të shtosh pije të reja:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Kliko "+ Shto Pije të Re"</li>
                <li>Shkruaj emrin e pijës</li>
                <li>Vendos sasinë fillestare në "Furnizime"</li>
                <li>Kliko "💾 Ruaj"</li>
              </ol>
            </div>

            <div className="p-4 bg-warning/10 border border-warning/50 rounded-lg">
              <p className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Kontrolli i stokut:
              </p>
              <p className="text-sm mt-2">Pijet me gjendje më pak se 5 copë do të shfaqen me ngjyrë të verdhë si paralajmërim për të porositur furnizime.</p>
            </div>
          </CardContent>
        </Card>

        {/* 6. Modifikimi i të Dhënave të Kaluara */}
        <Card className="print-page-break">
          <CardHeader>
            <CardTitle className="text-xl">6. Modifikimi i të Dhënave të Kaluara</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Privilegjet e administratorit:</h4>
              <p className="text-sm">Si Admin, <strong>NUK ke kufizime kohore</strong>. Mund të modifikosh të gjitha fushat në çdo datë të kaluarën.</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të modifikosh të dhëna të kaluara:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Shko te "Regjistrimi Ditor"</li>
                <li>Kliko butonin "Admin" dhe fut fjalëkalimin</li>
                <li>Zgjidh datën e kaluar që dëshiron të modifikosh</li>
                <li>Të gjitha fushat do të jenë të hapura për modifikim</li>
                <li>Bëj ndryshimet e nevojshme</li>
                <li>Kliko "💾 Ruaj të Dhënat"</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Fushat që mund të modifikosh:</h4>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Të gjitha fushat e produkteve (Stok Fillim, Gjendje, Shiriti, Furnizime)</li>
                <li>Të gjitha llojet e kafesë</li>
                <li>Xhiro, Mulliri Fillim, Mulliri Perfund</li>
                <li>Emrat e produkteve</li>
                <li>Shtim/fshirje produktesh</li>
              </ul>
            </div>

            <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
              <p className="font-semibold flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                PËRGJEGJËSI E MADHE:
              </p>
              <ul className="ml-6 mt-2 space-y-1 text-sm">
                <li>• Modifikimet në të dhënat historike ndikojnë në raportet dhe analizat</li>
                <li>• Bëj backup para se të bësh ndryshime të mëdha</li>
                <li>• Dokumento arsyen e ndryshimit (në një sistem tjetër)</li>
                <li>• Informo stafin nëse ka ndryshime që i prekin</li>
              </ul>
            </div>

            <div className="p-4 bg-info/10 border border-info/50 rounded-lg">
              <p className="font-semibold">Audit Trail:</p>
              <p className="text-sm mt-2">Sistemi ruan historinë e ndryshimeve për çdo datë. Mund të shohësh ndryshimet e mëparshme në Dashboard → Histori Ndryshimesh.</p>
            </div>
          </CardContent>
        </Card>

        {/* 7. Zhbllokimi i Turneve të Kyçura */}
        <Card className="print-page-break">
          <CardHeader>
            <CardTitle className="text-xl">7. Zhbllokimi i Turneve të Kyçura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <LockKeyhole className="h-4 w-4" />
                Çfarë është kyçja e turnit:
              </h4>
              <p className="text-sm">Kur stafi printo raportin e turnit të tij, turni bëhet automatikisht i <strong>KYÇUR</strong>. Kjo parandalon ndryshime aksidentale pas mbylljes zyrtare të turnit.</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si ta njoh një turn të kyçur:</h4>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Në tab-in e turnit shfaqet ikona <LockKeyhole className="h-3 w-3 inline text-destructive" /> (dryna e kuqe)</li>
                <li>Poshtë tab-it shfaqet mesazhi: "🔒 Turni X është i kyçur"</li>
                <li>Tregohet kush e kyçi turnin dhe kur</li>
                <li>Të gjitha fushat e atij turni janë të blokuara</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <UnlockKeyhole className="h-4 w-4" />
                Si të zhbllokosh një turn:
              </h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Hyr si Admin në "Regjistrimi Ditor"</li>
                <li>Zgjidh datën e turnit që dëshiron të zhbllokosh</li>
                <li>Kliko tab-in e turnit të kyçur (T1 ose T2)</li>
                <li>Do të shfaqet mesazhi i kyçjes me butonin <strong>"🔓 Zhblloko"</strong></li>
                <li>Kliko butonin "Zhblloko"</li>
                <li>Do të shfaqet mesazhi "🔓 Turni X u zhbllokua"</li>
                <li>Tani të gjitha fushat janë të hapura për modifikim</li>
              </ol>
            </div>

            <div className="p-4 bg-warning/10 border border-warning/50 rounded-lg">
              <p className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                KUJDES:
              </p>
              <ul className="ml-6 mt-2 space-y-1 text-sm">
                <li>• Zhbllokimi duhet të bëhet vetëm kur ka nevojë reale për korrigjim</li>
                <li>• Pas korrigjimit, kërko nga stafi (ose ti) të printo dhe kyç përsëri turnin</li>
                <li>• Çdo zhbllokim duhet dokumentuar (arsyeja e korrigjimit)</li>
              </ul>
            </div>

            <div className="p-4 bg-info/10 border border-info/50 rounded-lg">
              <p className="font-semibold">Kush mund ta zhbllokojë:</p>
              <ul className="ml-6 mt-2 space-y-1 text-sm list-disc">
                <li>• Vetëm <strong>ADMINI</strong> mund të zhbllokojë turnet e kyçura</li>
                <li>• Stafi NUK ka opsion zhbllokimi - duhet të kontaktojë administratorin</li>
                <li>• Butoni "Zhblloko" shfaqet vetëm kur je loguar si Admin</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Raste tipike për zhbllokim:</h4>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Stafi bëri gabim në numërim dhe e zbuloi pas printimit</li>
                <li>U harrua të shtohej një furnizim</li>
                <li>Xhiro u fut gabim</li>
                <li>Diferenca e madhe në mulliri që kërkon korrigjim</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 8. Raportet dhe Analizat */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">8. Raportet dhe Analizat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Si të aksesosh:</h4>
              <p className="text-sm">Navigimi → Raportet</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Llojet e raporteve:</h4>
              <ul className="ml-6 space-y-2 list-disc">
                <li><strong>Raport Ditor:</strong> Xhiro, produkte, kafe për një ditë specifike</li>
                <li><strong>Raport Javor:</strong> Trend i shitjeve për javën e fundit</li>
                <li><strong>Raport Mujor:</strong> Përmbledhje mujore, krahasime</li>
                <li><strong>Raport Produktesh:</strong> Produktet më të shitura, diferenca</li>
                <li><strong>Raport Turnesh:</strong> Krahasim ndërmjet Turnit 1 dhe Turnit 2</li>
                <li><strong>Raport Stafi:</strong> Performanca e stafit (nëse ka të dhëna)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Filtra dhe eksportim:</h4>
              <ul className="ml-6 space-y-2 list-disc">
                <li>Filtro sipas datave (nga - deri)</li>
                <li>Filtro sipas produkteve</li>
                <li>Filtro sipas turneve</li>
                <li>Eksporto në Excel (.xlsx)</li>
                <li>Eksporto në PDF për printim</li>
                <li>Shfaq grafikë dhe diagrame</li>
              </ul>
            </div>

            <div className="p-4 bg-success/10 border border-success/50 rounded-lg">
              <p className="font-semibold">Analizat automatike:</p>
              <p className="text-sm mt-2">Sistemi gjeneron automatikisht insights si: produkti më i shitur, dita më profitable, trendet e shitjeve, etj.</p>
            </div>
          </CardContent>
        </Card>

        {/* 9. Menaxhimi i Shpenzimeve */}
        <Card className="print-page-break">
          <CardHeader>
            <CardTitle className="text-xl">9. Menaxhimi i Shpenzimeve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Si të aksesosh:</h4>
              <p className="text-sm">Navigimi → Shpenzimet</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të shtosh një shpenzim:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Kliko "+ Shto Shpenzim të Ri"</li>
                <li>Plotëso fushat:
                  <ul className="ml-6 mt-1 space-y-1 list-disc">
                    <li><strong>Emri i Produktit:</strong> Çfarë blejëm (p.sh. "Qumësht")</li>
                    <li><strong>Kategoria:</strong> Lloji i shpenzimit (Ushqimore, Pastrimi, etj.)</li>
                    <li><strong>Kosto:</strong> Shuma në ALL</li>
                    <li><strong>Data:</strong> Kur u bë shpenzimi</li>
                    <li><strong>Shënime:</strong> Detaje shtesë (opsionale)</li>
                  </ul>
                </li>
                <li>Kliko "💾 Ruaj"</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Kategoritë e shpenzimeve:</h4>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Ushqimore (produktet bazë)</li>
                <li>Pije</li>
                <li>Pastrimi</li>
                <li>Mirëmbajtja</li>
                <li>Rryma & Uji</li>
                <li>Pagat</li>
                <li>Tjera</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Raporte shpenzimesh:</h4>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Shiko totalin e shpenzimeve për periudhë</li>
                <li>Filtro sipas kategorive</li>
                <li>Krahasो shpenzimet me të ardhurat (xhiro)</li>
                <li>Gjenerо raporte fitim-humbje</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 10. Mapping i Produkteve */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">10. Mapping i Produkteve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Çfarë është mapping:</h4>
              <p className="text-sm">Mapping lidh emrat e produkteve nga shiriti (receipt) me produktet në sistemin tënd. Kjo bën që AI skaneri të lexojë saktë dhe automatikisht produktet.</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të aksesosh:</h4>
              <p className="text-sm">Regjistrimi Ditor → Butoni "Mapping Produktesh" (në krye, pranë Admin)</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Si të kriosh një mapping:</h4>
              <ol className="ml-6 space-y-2 list-decimal">
                <li>Kliko "Mapping Produktesh"</li>
                <li>Skano një shirit tipik për të marrë listën e produkteve</li>
                <li>Për çdo produkt nga shiriti, zgjidh produktin përkatës në sistem</li>
                <li>Vendos sasinë (p.sh. 1 copë = 1 produkt, ose 0.5 copë = 1 produkt)</li>
                <li>Kliko "💾 Ruaj Mapping"</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Llojet e mapping:</h4>
              <ul className="ml-6 space-y-2 list-disc">
                <li><strong>Produkte:</strong> Lidh produktet e shiritit me produktet në sistem</li>
                <li><strong>Kafe:</strong> Lidh llojet e kafesë nga shiriti me llojet në sistem</li>
                <li><strong>Kuzhina:</strong> Lidh produktet e kuzhinës (nëse ka)</li>
                <li><strong>Pije Alkoolike:</strong> Lidh pijet e shiritit me inventarin</li>
              </ul>
            </div>

            <div className="p-4 bg-success/10 border border-success/50 rounded-lg">
              <p className="font-semibold">Përfitimet:</p>
              <ul className="ml-6 mt-2 space-y-1 text-sm">
                <li>• Skanimi bëhet 10x më i shpejtë</li>
                <li>• Më pak gabime në lexim</li>
                <li>• Automatizim i plotë i regjistrimit</li>
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
              <h4 className="font-semibold">Përgjegjësitë e administratorit:</h4>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Mbaj konfidencial fjalëkalimin e administratorit</li>
                <li>Krijo backup të rregullt të të dhënave</li>
                <li>Trajno stafin për përdorimin e saktë të sistemit</li>
                <li>Kontrollo raportet rregullisht për anomali</li>
                <li>Përditëso PIN-et e stafit nëse ka dyshime për sigurinë</li>
                <li>Dokumento ndryshimet e mëdha në sistem</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Best Practices:</h4>
              <ul className="ml-6 space-y-1 text-sm list-disc">
                <li>Bëj backup çdo javë (eksporto të dhënat)</li>
                <li>Kontrollo diferencat e produkteve çdo ditë</li>
                <li>Shiko raportet javore për të identifikuar probleme</li>
                <li>Mbaj inventarin e pijeve të përditësuar</li>
                <li>Ndrysho fjalëkalimin e administratorit çdo 3 muaj</li>
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
          <p>Ky manual është pronë e biznesit dhe është KONFIDENCIAL</p>
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

export default ManualAdmin;
