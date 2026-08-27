"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Header from "../ui/Header";
import { receteler } from "../data/receteler";
import { supabase } from "../lib/supabase";

type Kategori = "Sandviç" | "Salata" | "İçecek" | "Ek Ürün";
type TopluKategori = "Tümü" | Kategori;
type DegisimTipi = "Yüzde" | "Sabit TL";
type DegisimYonu = "Artır" | "Azalt";
type Yuvarlama = "Yok" | "5 TL" | "10 TL";

type Urun = {
  id: number;
  ad: string;
  kategori: Kategori;
  satisFiyati: number;
  maliyet: number;
  aktif: boolean;
};

type Malzeme = {
  id: number;
  ad: string;
  kullanimAlani: "Sandviç" | "Salata";
  gramaj: number;
  birimFiyat: number;
  kalori100Gr: number;
};

const varsayilanUrunler: Urun[] = [
  { id: 1, ad: "Thales", kategori: "Sandviç", satisFiyati: 250, maliyet: 0, aktif: true },
  { id: 2, ad: "Pisagor", kategori: "Sandviç", satisFiyati: 250, maliyet: 0, aktif: true },
  { id: 3, ad: "Heredot", kategori: "Sandviç", satisFiyati: 300, maliyet: 0, aktif: true },
  { id: 4, ad: "Demokritos", kategori: "Sandviç", satisFiyati: 300, maliyet: 0, aktif: true },
  { id: 5, ad: "Öklid", kategori: "Sandviç", satisFiyati: 250, maliyet: 0, aktif: true },
  { id: 6, ad: "Erasmus", kategori: "Sandviç", satisFiyati: 200, maliyet: 0, aktif: true },
  { id: 7, ad: "Diyojen", kategori: "Sandviç", satisFiyati: 300, maliyet: 0, aktif: true },
  { id: 8, ad: "Aristo", kategori: "Sandviç", satisFiyati: 325, maliyet: 0, aktif: true },
  { id: 9, ad: "Spinoza", kategori: "Sandviç", satisFiyati: 350, maliyet: 0, aktif: true },
  { id: 10, ad: "Sokrates", kategori: "Sandviç", satisFiyati: 300, maliyet: 0, aktif: true },
  { id: 11, ad: "Kopernik", kategori: "Sandviç", satisFiyati: 300, maliyet: 0, aktif: true },
  { id: 12, ad: "Platon", kategori: "Sandviç", satisFiyati: 400, maliyet: 0, aktif: true },
  { id: 13, ad: "Heraklitos", kategori: "Sandviç", satisFiyati: 250, maliyet: 0, aktif: true },
  { id: 14, ad: "Ton Balıklı Salata", kategori: "Salata", satisFiyati: 400, maliyet: 0, aktif: true },
  { id: 15, ad: "Tulum Peynirli & Cevizli Salata", kategori: "Salata", satisFiyati: 400, maliyet: 0, aktif: true },
  { id: 16, ad: "Hellim Salata", kategori: "Salata", satisFiyati: 400, maliyet: 0, aktif: true },
  { id: 17, ad: "Akdeniz Salata", kategori: "Salata", satisFiyati: 400, maliyet: 0, aktif: true },
  { id: 18, ad: "Aristo Club Salata", kategori: "Salata", satisFiyati: 400, maliyet: 0, aktif: true },
  { id: 19, ad: "Portakal Suyu %100", kategori: "İçecek", satisFiyati: 125, maliyet: 0, aktif: true },
  { id: 20, ad: "Ayran", kategori: "İçecek", satisFiyati: 75, maliyet: 0, aktif: true },
  { id: 21, ad: "Coca-Cola", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 22, ad: "Coca-Cola Zero", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 23, ad: "Cappy Karışık Meyve Suyu", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 24, ad: "Cappy Vişne Meyve Suyu", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 25, ad: "Fanta", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 26, ad: "Sprite", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 27, ad: "Fuse Tea Limon", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 28, ad: "Fuse Tea Şeftali", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 29, ad: "Sade Soda", kategori: "İçecek", satisFiyati: 30, maliyet: 0, aktif: true },
  { id: 30, ad: "Su", kategori: "İçecek", satisFiyati: 20, maliyet: 0, aktif: true },
  { id: 31, ad: "Filtre Kahve", kategori: "İçecek", satisFiyati: 125, maliyet: 0, aktif: true },
  { id: 32, ad: "Esmer Baget Farkı", kategori: "Ek Ürün", satisFiyati: 30, maliyet: 0, aktif: true },
];

function para(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(tutar);
}

function yuvarlaFiyat(fiyat: number, yuvarlama: Yuvarlama) {
  if (yuvarlama === "5 TL") {
    return Math.round(fiyat / 5) * 5;
  }

  if (yuvarlama === "10 TL") {
    return Math.round(fiyat / 10) * 10;
  }

  return Math.round((fiyat + Number.EPSILON) * 100) / 100;
}

const URUN_SUTUNLARI = "id, ad, kategori, satis_fiyati, aktif";
const FIYAT_AKTARIM_ISARETI = "aristo-urunler-bulut-fiyat-v1";
const AKTARIM_ONCESI_YEDEK = "aristo-urunler-aktarim-oncesi-v1";

// Geçersiz veya eksik fiyatları sıfır kabul edip kaydetme.
function urunListesiniDogrula(veri: unknown, bulut: boolean): Urun[] {
  if (!Array.isArray(veri)) throw new Error("Ürün listesi okunamadı.");
  const kimlikler = new Set<number>();
  return veri.map((ham: unknown) => {
    if (!ham || typeof ham !== "object") throw new Error("Geçersiz ürün kaydı.");
    const kayit = ham as Record<string, unknown>;
    const id = Number(kayit.id);
    const hamFiyat = bulut ? kayit.satis_fiyati : kayit.satisFiyati;
    const fiyat = Number(hamFiyat);
    const kategoriler: string[] = ["Sandviç", "Salata", "İçecek", "Ek Ürün"];
    if (!Number.isSafeInteger(id) || id <= 0 || kimlikler.has(id) ||
        typeof kayit.ad !== "string" || !kayit.ad.trim() ||
        !kategoriler.includes(String(kayit.kategori)) ||
        (typeof hamFiyat !== "number" && typeof hamFiyat !== "string") ||
        String(hamFiyat).trim() === "" || !Number.isFinite(fiyat) || fiyat < 0 ||
        typeof kayit.aktif !== "boolean") {
      throw new Error("Ürün kaydında geçersiz fiyat veya bilgi var; fiyatlar değiştirilmedi.");
    }
    kimlikler.add(id);
    return {
      id, ad: kayit.ad, kategori: kayit.kategori as Kategori,
      satisFiyati: fiyat, aktif: kayit.aktif,
      maliyet: Number.isFinite(Number(kayit.maliyet)) ? Number(kayit.maliyet) : 0,
    };
  });
}

function fiyatlariBirlestir(bulut: Urun[], yerel: Urun[]): Urun[] {
  const yerelHarita = new Map(yerel.map((urun) => [urun.id, urun]));
  // İsim, kategori, aktiflik ve yeni ürünler ortak listeden korunur.
  // Eski tarayıcı kaydından yalnızca aynı ürüne ait fiyat önerilir.
  return bulut.map((urun) => {
    const aday = yerelHarita.get(urun.id);
    return aday && aday.ad === urun.ad && aday.kategori === urun.kategori
      ? { ...urun, satisFiyati: aday.satisFiyati }
      : urun;
  });
}

function degisenleriBul(liste: Urun[], onceki: Urun[]): Urun[] {
  const harita = new Map(onceki.map((urun) => [urun.id, urun]));
  return liste.filter((urun) => {
    const eski = harita.get(urun.id);
    return !eski || eski.satisFiyati !== urun.satisFiyati || eski.aktif !== urun.aktif;
  });
}

function fiyatOnbelleginiYaz(liste: Urun[]) {
  // Yalnızca sunucudan doğrulanmış kayıtlar ana önbelleğe yazılır.
  localStorage.setItem("aristo-urunler", JSON.stringify(liste));
  localStorage.setItem(FIYAT_AKTARIM_ISARETI, "tamam");
  window.dispatchEvent(new Event("storage"));
}

export default function Urunler() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);
  const [arama, setArama] = useState("");
  const [kategori, setKategori] = useState<TopluKategori>("Tümü");
  const [mesaj, setMesaj] = useState("");
  const [bulutUrunleri, setBulutUrunleri] = useState<Urun[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bulutHazir, setBulutHazir] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [yerelAktarimBekliyor, setYerelAktarimBekliyor] = useState(false);
  const [hata, setHata] = useState("");
  const [uyari, setUyari] = useState("");
  const kayitKilidi = useRef(false);
  const kilitli = yukleniyor || kaydediliyor || !bulutHazir;
  const degisenUrunler = useMemo(
    () => degisenleriBul(urunler, bulutUrunleri), [urunler, bulutUrunleri]
  );
  const kayitBekliyor = degisenUrunler.length > 0;


  const [topluKategori, setTopluKategori] =
    useState<TopluKategori>("Sandviç");
  const [degisimTipi, setDegisimTipi] =
    useState<DegisimTipi>("Yüzde");
  const [degisimYonu, setDegisimYonu] =
    useState<DegisimYonu>("Artır");
  const [degisimMiktari, setDegisimMiktari] = useState("");
  const [yuvarlama, setYuvarlama] = useState<Yuvarlama>("Yok");
  const [onizlemeAcik, setOnizlemeAcik] = useState(false);

  useEffect(() => {
    let aktif = true;
    let yerelUrunler: Urun[] = [];
    let aktarimTamam = false;
    let hamYerel = "";
    try {
      hamYerel = localStorage.getItem("aristo-urunler") || "";
      if (hamYerel) yerelUrunler = urunListesiniDogrula(JSON.parse(hamYerel), false);
      aktarimTamam = localStorage.getItem(FIYAT_AKTARIM_ISARETI) === "tamam";
      setUrunler(yerelUrunler);
    } catch {
      setUyari("Tarayıcıdaki ürün kopyası okunamadı. Ortak liste yüklenecek.");
    }

    try {
      const veri: unknown = JSON.parse(localStorage.getItem("aristo-malzemeler") || "[]");
      setMalzemeler(Array.isArray(veri) ? veri as Malzeme[] : []);
    } catch {
      setMalzemeler([]);
    }

    async function yukle() {
      try {
        const sonuc = await supabase.from("urunler").select(URUN_SUTUNLARI)
          .order("id", { ascending: true });
        if (sonuc.error) throw sonuc.error;
        const ortak = urunListesiniDogrula(sonuc.data, true);
        if (!ortak.length) throw new Error("Ortak ürün listesi boş; eski fiyatlar otomatik yüklenmedi.");
        if (!aktif) return;

        setBulutUrunleri(ortak);
        const aday = aktarimTamam ? ortak : fiyatlariBirlestir(ortak, yerelUrunler);
        const farkVar = degisenleriBul(aday, ortak).length > 0;

        if (farkVar) {
          // Yeni fiyatların üzerine eski bulut fiyatlarını yazma.
          try {
            if (!localStorage.getItem(AKTARIM_ONCESI_YEDEK)) {
              localStorage.setItem(AKTARIM_ONCESI_YEDEK, hamYerel);
            }
          } catch {
            setUyari("Tarayıcıya ek bir fiyat kopyası kaydedilemedi. İndirdiğin yedeği sakla.");
          }
          setUrunler(aday);
          setYerelAktarimBekliyor(true);
        } else {
          setUrunler(ortak);
          try { fiyatOnbelleginiYaz(ortak); }
          catch { setUyari("Ortak fiyatlar okundu; tarayıcı kopyası güncellenemedi."); }
        }
        setBulutHazir(true);
      } catch (err) {
        console.error("Ürünler okunamadı:", err);
        if (aktif) setHata("Ürünler sunucudan okunamadı. Fiyatlar değiştirilmedi. İnternetini ve oturumunu kontrol edip sayfayı yenile.");
      } finally {
        if (aktif) setYukleniyor(false);
      }
    }
    void yukle();
    return () => { aktif = false; };
  }, []);

  useEffect(() => {
    if (!kayitBekliyor && !kaydediliyor) return;
    const uyarmadanCikma = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const baglantiTiklandi = (event: MouseEvent) => {
      const hedef = event.target;
      if (!(hedef instanceof Element)) return;
      const link = hedef.closest("a[href]");
      if (!link) return;
      const metin = kayitKilidi.current
        ? "Kayıt sürüyor. Tamamlanmadan çıkarsan aktarım yarıda kalabilir. Yine de çıkılsın mı?"
        : "Kaydedilmeyen fiyatlar var. Kaydetmeden çıkılsın mı?";
      if (!window.confirm(metin)) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", uyarmadanCikma);
    document.addEventListener("click", baglantiTiklandi, true);
    return () => {
      window.removeEventListener("beforeunload", uyarmadanCikma);
      document.removeEventListener("click", baglantiTiklandi, true);
    };
  }, [kayitBekliyor, kaydediliyor]);

  function bildirimGoster(metin: string) {
    setMesaj(metin);
  }

  // Ekrandaki düzenlemeler taslaktır. Tek Kaydet düğmesi, her tuş vuruşunda
  // farklı bir fiyatın arka arkaya sunucuya gönderilmesini engeller.
  function urunleriKaydet(yeniListe: Urun[], bildirim = true) {
    if (kilitli || kayitKilidi.current) return;
    if (yeniListe.some((urun) => !Number.isFinite(urun.satisFiyati) || urun.satisFiyati < 0)) {
      setHata("Geçerli, sıfır veya daha büyük bir fiyat gir.");
      return;
    }
    setUrunler(yeniListe);
    setHata("");
    if (bildirim) bildirimGoster("Değişiklik hazır. Üstteki Kaydet ve Satışa Aktar düğmesine bas.");
  }

  async function bulutaKaydet() {
    if (kilitli || kayitKilidi.current || !kayitBekliyor) return;
    kayitKilidi.current = true;
    setKaydediliyor(true);
    setHata("");
    setMesaj("");
    let dogrulanmis = [...bulutUrunleri];
    let kaydedilen = 0;
    try {
      const dogruListe = urunListesiniDogrula(urunler, false);
      const degisenler = degisenleriBul(dogruListe, bulutUrunleri);
      for (const urun of degisenler) {
        const onceki = dogrulanmis.find((kayit) => kayit.id === urun.id);
        if (!onceki) throw new Error("Ürün ortak listede bulunamadı.");
        const degisiklik: { satis_fiyati?: number; aktif?: boolean } = {};
        if (urun.satisFiyati !== onceki.satisFiyati) degisiklik.satis_fiyati = urun.satisFiyati;
        if (urun.aktif !== onceki.aktif) degisiklik.aktif = urun.aktif;

        // Sadece değişen alanları yaz. Başka bir ekranda değişmiş bir satırı
        // eski kopyayla ezmemek için okuduğumuz değerleri de filtrele.
        const sonuc = await supabase.from("urunler").update(degisiklik)
          .eq("id", urun.id)
          .eq("satis_fiyati", onceki.satisFiyati)
          .eq("aktif", onceki.aktif)
          .select(URUN_SUTUNLARI).maybeSingle();
        if (sonuc.error) throw sonuc.error;
        if (!sonuc.data) throw new Error("Ürün değişmiş veya kayıt izni verilmemiş.");
        const kayit = urunListesiniDogrula([sonuc.data], true)[0];
        if (kayit.id !== urun.id || kayit.satisFiyati !== urun.satisFiyati || kayit.aktif !== urun.aktif) {
          throw new Error("Kaydedilen fiyat doğrulanamadı.");
        }
        dogrulanmis = dogrulanmis.map((eski) => eski.id === kayit.id ? kayit : eski);
        kaydedilen += 1;
        setBulutUrunleri(dogrulanmis);
      }

      setUrunler(dogrulanmis);
      setYerelAktarimBekliyor(false);
      try { fiyatOnbelleginiYaz(dogrulanmis); }
      catch { setUyari("Fiyatlar sunucuya kaydedildi; yalnızca tarayıcı kopyası güncellenemedi."); }
      bildirimGoster("Fiyatlar kaydedildi. Satış ekranını yenilediğinde güncel fiyatları göreceksin.");
    } catch (err) {
      console.error("Ürün fiyatları kaydedilemedi:", err);
      setBulutUrunleri(dogrulanmis);
      setHata(`${kaydedilen > 0 ? kaydedilen + " ürün kaydedildi; kalanlar kaydedilemedi." : "Fiyatlar kaydedilemedi."} Ekrandaki değişiklikler korunuyor. İnternetini ve oturumunu kontrol edip tekrar Kaydet'e bas. Sorun sürerse bu uyarıyı ilet.`);
    } finally {
      kayitKilidi.current = false;
      setKaydediliyor(false);
    }
  }

  function ortakFiyatlariKullan() {
    if (kilitli || kayitKilidi.current) return;
    if (!window.confirm("Ekrandaki değişiklikler bırakılıp satışın şu an kullandığı ortak fiyatlar gösterilsin mi?")) return;
    setUrunler(bulutUrunleri);
    setYerelAktarimBekliyor(false);
    setHata("");
    setMesaj("");
    try { fiyatOnbelleginiYaz(bulutUrunleri); }
    catch { setUyari("Ortak fiyatlar gösteriliyor; tarayıcı kopyası güncellenemedi."); }
  }

  function fiyatGuncelle(id: number, fiyat: number) {
    const yeniListe = urunler.map((urun) =>
      urun.id === id
        ? {
            ...urun,
            satisFiyati: Math.max(fiyat, 0),
          }
        : urun
    );

    urunleriKaydet(yeniListe);
  }

  function fiyatiDegistir(id: number, fark: number) {
    const yeniListe = urunler.map((urun) =>
      urun.id === id
        ? {
            ...urun,
            satisFiyati: Math.max(
              Number(urun.satisFiyati || 0) + fark,
              0
            ),
          }
        : urun
    );

    urunleriKaydet(yeniListe);
  }

  function aktiflikGuncelle(id: number, aktif: boolean) {
    const yeniListe = urunler.map((urun) =>
      urun.id === id
        ? {
            ...urun,
            aktif,
          }
        : urun
    );

    urunleriKaydet(yeniListe);
  }

  function varsayilanaDon() {
    const onay = window.confirm(
      "Fiyatlar ilk menü fiyatlarına dönsün mü? Uygulamak için ardından Kaydet düğmesine basmalısın."
    );

    if (!onay) return;

    urunleriKaydet(urunler.map((urun) => {
      const varsayilan = varsayilanUrunler.find((kayit) => kayit.id === urun.id && kayit.ad === urun.ad);
      return varsayilan ? { ...urun, satisFiyati: varsayilan.satisFiyati } : urun;
    }));
  }

  function yeniTopluFiyat(eskiFiyat: number) {
    const miktar = Math.max(
      Number(degisimMiktari || 0),
      0
    );

    let yeniFiyat = eskiFiyat;

    if (degisimTipi === "Yüzde") {
      const fark = eskiFiyat * (miktar / 100);

      yeniFiyat =
        degisimYonu === "Artır"
          ? eskiFiyat + fark
          : eskiFiyat - fark;
    } else {
      yeniFiyat =
        degisimYonu === "Artır"
          ? eskiFiyat + miktar
          : eskiFiyat - miktar;
    }

    return Math.max(
      yuvarlaFiyat(yeniFiyat, yuvarlama),
      0
    );
  }

  const topluEtkilenecekUrunler = useMemo(() => {
    return urunler
      .filter(
        (urun) =>
          topluKategori === "Tümü" ||
          urun.kategori === topluKategori
      )
      .map((urun) => ({
        ...urun,
        yeniFiyat: yeniTopluFiyat(
          Number(urun.satisFiyati || 0)
        ),
      }));
  }, [
    urunler,
    topluKategori,
    degisimTipi,
    degisimYonu,
    degisimMiktari,
    yuvarlama,
  ]);

  function topluDegisikligiOnizle() {
    if (!Number.isFinite(Number(degisimMiktari)) || Number(degisimMiktari || 0) <= 0) {
      alert("Değişim miktarını gir.");
      return;
    }

    if (topluEtkilenecekUrunler.length === 0) {
      alert("Bu kategoride ürün yok.");
      return;
    }

    setOnizlemeAcik(true);
  }

  function topluDegisikligiUygula() {
    if (kilitli || kayitKilidi.current) return;
    const onay = window.confirm(
      `${topluEtkilenecekUrunler.length} ürünün fiyatı değiştirilsin mi?`
    );

    if (!onay) return;

    const yeniFiyatlar = new Map(
      topluEtkilenecekUrunler.map((urun) => [
        urun.id,
        urun.yeniFiyat,
      ])
    );

    const yeniListe = urunler.map((urun) =>
      yeniFiyatlar.has(urun.id)
        ? {
            ...urun,
            satisFiyati:
              yeniFiyatlar.get(urun.id) ??
              urun.satisFiyati,
          }
        : urun
    );

    urunleriKaydet(yeniListe);

    setOnizlemeAcik(false);
    setDegisimMiktari("");
  }

  function maliyetHesapla(urun: Urun) {
    const recete = receteler.find(
      (kayit) => kayit.urun === urun.ad
    );

    if (!recete) {
      return 0;
    }

    const kullanimAlani =
      urun.kategori === "Salata"
        ? "Salata"
        : "Sandviç";

    return recete.malzemeler.reduce(
      (toplam, satir) => {
        const ayniIsimliMalzemeler =
          malzemeler.filter(
            (malzeme) =>
              malzeme.ad === satir.malzeme
          );

        const malzeme =
          ayniIsimliMalzemeler.find(
            (kayit) =>
              kayit.kullanimAlani ===
              kullanimAlani
          ) || ayniIsimliMalzemeler[0];

        if (!malzeme) {
          return toplam;
        }

        return (
          toplam +
          (Number(malzeme.birimFiyat || 0) /
            1000) *
            Number(satir.gram || 0)
        );
      },
      0
    );
  }

  const hesaplananUrunler = useMemo(() => {
    return urunler.map((urun) => {
      const maliyet = maliyetHesapla(urun);
      const kar =
        Number(urun.satisFiyati || 0) -
        maliyet;

      const karOrani =
        urun.satisFiyati > 0
          ? (kar / urun.satisFiyati) * 100
          : 0;

      return {
        ...urun,
        maliyet,
        kar,
        karOrani,
      };
    });
  }, [urunler, malzemeler]);

  const filtrelenmisUrunler = useMemo(() => {
    const aranan = arama
      .trim()
      .toLocaleLowerCase("tr-TR");

    return hesaplananUrunler.filter(
      (urun) => {
        const kategoriUygun =
          kategori === "Tümü" ||
          urun.kategori === kategori;

        const aramaUygun =
          !aranan ||
          urun.ad
            .toLocaleLowerCase("tr-TR")
            .includes(aranan);

        return kategoriUygun && aramaUygun;
      }
    );
  }, [
    hesaplananUrunler,
    arama,
    kategori,
  ]);

  const aktifUrunSayisi = urunler.filter(
    (urun) => urun.aktif
  ).length;

  const ortalamaFiyat =
    urunler.length > 0
      ? urunler.reduce(
          (toplam, urun) =>
            toplam +
            Number(urun.satisFiyati || 0),
          0
        ) / urunler.length
      : 0;

  const ortalamaKarOrani =
    hesaplananUrunler.length > 0
      ? hesaplananUrunler.reduce(
          (toplam, urun) =>
            toplam + urun.karOrani,
          0
        ) / hesaplananUrunler.length
      : 0;

  const kartStili: CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e3e8e5",
    borderRadius: "18px",
    padding: "20px",
    boxShadow:
      "0 8px 24px rgba(23,77,56,0.07)",
  };

  const alanStili: CSSProperties = {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    boxSizing: "border-box",
    background: "#ffffff",
    fontSize: "16px",
  };

  const butonStili: CSSProperties = {
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "10px 13px",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 750,
    cursor: "pointer",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f7faf8 0%, #eef4f0 100%)",
        padding: "28px 14px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        <Header />

        <h1
          style={{
            margin: "0 0 6px",
            color: "#153f30",
            fontSize: "clamp(30px, 5vw, 42px)",
          }}
        >
          🧾 Ürünler ve Fiyatlar
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: "22px",
            color: "#66736c",
          }}
        >
          Fiyatları düzenle, ardından Kaydet ve Satışa Aktar düğmesine bas.
        </p>

        <section aria-label="Fiyat kaydı" style={{
          ...kartStili, marginBottom: "18px", border: "2px solid #174d38",
          position: "sticky", top: "8px", zIndex: 20,
        }}>
          <strong role="status" aria-live="polite">
            {yukleniyor ? "Fiyatlar yükleniyor…" : kaydediliyor ? "Fiyatlar kaydediliyor…"
              : yerelAktarimBekliyor ? "Bu ekrandaki güncel fiyatlar henüz satışa aktarılmadı."
              : kayitBekliyor ? `${degisenUrunler.length} üründe kaydedilmeyen değişiklik var.`
              : bulutHazir ? "Fiyatlar ortak listeden okunuyor." : "Fiyat bağlantısı kurulamadı."}
          </strong>
          {yerelAktarimBekliyor && <p style={{ margin: "8px 0", color: "#705019" }}>
            Aşağıdaki fiyatlar bu tarayıcıdaki listenden alındı. Güncel fiyatların bunlarsa
            Kaydet ve Satışa Aktar'a bas. Sayfayı açmak tek başına fiyat değiştirmez.
          </p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" }}>
            <button type="button" onClick={() => void bulutaKaydet()}
              disabled={kilitli || !kayitBekliyor}
              style={{ ...butonStili, background: "#174d38", color: "white", minHeight: "48px",
                opacity: kilitli || !kayitBekliyor ? 0.55 : 1 }}>
              {kaydediliyor ? "Kaydediliyor…" : "Kaydet ve Satışa Aktar"}
            </button>
            {kayitBekliyor && <button type="button" onClick={ortakFiyatlariKullan}
              disabled={kilitli} style={butonStili}>
              Değişiklikleri Bırak
            </button>}
          </div>
          {hata && <p role="alert" style={{ color: "#b91c1c", marginBottom: 0 }}>{hata}</p>}
          {uyari && <p role="status" style={{ color: "#92400e", marginBottom: 0 }}>{uyari}</p>}
          {mesaj && <p role="status" style={{ color: "#174d38", marginBottom: 0 }}>{mesaj}</p>}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(185px, 1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
                fontWeight: 800,
              }}
            >
              TOPLAM ÜRÜN
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {urunler.length}
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
                fontWeight: 800,
              }}
            >
              AKTİF ÜRÜN
            </small>

            <h2
              style={{
                marginBottom: 0,
                color: "#15803d",
              }}
            >
              {aktifUrunSayisi}
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
                fontWeight: 800,
              }}
            >
              ORTALAMA FİYAT
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {para(ortalamaFiyat)}
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
                fontWeight: 800,
              }}
            >
              ORTALAMA KÂR
            </small>

            <h2 style={{ marginBottom: 0 }}>
              %{ortalamaKarOrani.toFixed(1)}
            </h2>
          </div>
        </section>

        <section
          style={{
            ...kartStili,
            marginBottom: "18px",
            border: "2px solid #174d38",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 5px" }}>
                ⚡ Toplu Fiyat Değiştir
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                }}
              >
                Zam veya indirim yap, önce ön izle, sonra uygula.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(175px, 1fr))",
              gap: "12px",
            }}
          >
            <div>
              <label>
                <strong>Kategori</strong>
              </label>

              <select
                disabled={kilitli}
                value={topluKategori}
                onChange={(event) =>
                  setTopluKategori(
                    event.target.value as TopluKategori
                  )
                }
                style={{
                  ...alanStili,
                  marginTop: "7px",
                }}
              >
                <option>Tümü</option>
                <option>Sandviç</option>
                <option>Salata</option>
                <option>İçecek</option>
                <option>Ek Ürün</option>
              </select>
            </div>

            <div>
              <label>
                <strong>İşlem</strong>
              </label>

              <select
                disabled={kilitli}
                value={degisimYonu}
                onChange={(event) =>
                  setDegisimYonu(
                    event.target.value as DegisimYonu
                  )
                }
                style={{
                  ...alanStili,
                  marginTop: "7px",
                }}
              >
                <option>Artır</option>
                <option>Azalt</option>
              </select>
            </div>

            <div>
              <label>
                <strong>Değişim Tipi</strong>
              </label>

              <select
                disabled={kilitli}
                value={degisimTipi}
                onChange={(event) =>
                  setDegisimTipi(
                    event.target.value as DegisimTipi
                  )
                }
                style={{
                  ...alanStili,
                  marginTop: "7px",
                }}
              >
                <option>Yüzde</option>
                <option>Sabit TL</option>
              </select>
            </div>

            <div>
              <label>
                <strong>
                  {degisimTipi === "Yüzde"
                    ? "Oran (%)"
                    : "Tutar (₺)"}
                </strong>
              </label>

              <input
                disabled={kilitli}
                type="number"
                min="0"
                step="0.01"
                value={degisimMiktari}
                onChange={(event) =>
                  setDegisimMiktari(
                    event.target.value
                  )
                }
                placeholder={
                  degisimTipi === "Yüzde"
                    ? "Örneğin: 10"
                    : "Örneğin: 25"
                }
                style={{
                  ...alanStili,
                  marginTop: "7px",
                }}
              />
            </div>

            <div>
              <label>
                <strong>Yuvarlama</strong>
              </label>

              <select
                disabled={kilitli}
                value={yuvarlama}
                onChange={(event) =>
                  setYuvarlama(
                    event.target.value as Yuvarlama
                  )
                }
                style={{
                  ...alanStili,
                  marginTop: "7px",
                }}
              >
                <option>Yok</option>
                <option>5 TL</option>
                <option>10 TL</option>
              </select>
            </div>
          </div>

          <button
                disabled={kilitli}
            onClick={topluDegisikligiOnizle}
            style={{
              marginTop: "15px",
              border: "none",
              borderRadius: "11px",
              padding: "13px 18px",
              background:
                degisimYonu === "Artır"
                  ? "#174d38"
                  : "#b45309",
              color: "#ffffff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            👀 Değişiklikleri Ön İzle
          </button>
        </section>

        <section
          style={{
            ...kartStili,
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            marginBottom: "18px",
          }}
        >
          <div>
            <label>
              <strong>Ürün Ara</strong>
            </label>

            <input
                disabled={kilitli}
              value={arama}
              onChange={(event) =>
                setArama(event.target.value)
              }
              placeholder="Örneğin: Aristo"
              style={{
                ...alanStili,
                marginTop: "7px",
              }}
            />
          </div>

          <div>
            <label>
              <strong>Kategori</strong>
            </label>

            <select
                disabled={kilitli}
              value={kategori}
              onChange={(event) =>
                setKategori(
                  event.target.value as TopluKategori
                )
              }
              style={{
                ...alanStili,
                marginTop: "7px",
              }}
            >
              <option>Tümü</option>
              <option>Sandviç</option>
              <option>Salata</option>
              <option>İçecek</option>
              <option>Ek Ürün</option>
            </select>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <button
                disabled={kilitli}
              onClick={varsayilanaDon}
              style={{
                ...butonStili,
                width: "100%",
                minHeight: "44px",
              }}
            >
              ↩️ İlk Menü Fiyatlarına Dön
            </button>
          </div>
        </section>

        <section style={kartStili}>
          {filtrelenmisUrunler.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "#6b7280",
                padding: "25px",
              }}
            >
              Ürün bulunamadı.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(270px, 1fr))",
                gap: "12px",
              }}
            >
              {filtrelenmisUrunler.map(
                (urun) => (
                  <div
                    key={urun.id}
                    style={{
                      border:
                        "1px solid #e5e7eb",
                      borderRadius: "15px",
                      padding: "16px",
                      opacity: urun.aktif
                        ? 1
                        : 0.5,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <strong
                          style={{
                            fontSize: "18px",
                          }}
                        >
                          {urun.ad}
                        </strong>

                        <p
                          style={{
                            margin: "5px 0 0",
                            color: "#6b7280",
                            fontSize: "14px",
                          }}
                        >
                          {urun.kategori}
                        </p>
                      </div>

                      <label
                        style={{
                          display:
                            "inline-flex",
                          alignItems:
                            "center",
                          gap: "7px",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        <input
                disabled={kilitli}
                          type="checkbox"
                          checked={urun.aktif}
                          onChange={(event) =>
                            aktiflikGuncelle(
                              urun.id,
                              event.target
                                .checked
                            )
                          }
                        />

                        {urun.aktif
                          ? "Aktif"
                          : "Pasif"}
                      </label>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "48px minmax(90px, 1fr) 48px",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <button
                disabled={kilitli}
                        onClick={() =>
                          fiyatiDegistir(
                            urun.id,
                            -5
                          )
                        }
                        style={{
                          ...butonStili,
                          height: "48px",
                          padding: 0,
                          fontSize: "22px",
                        }}
                      >
                        −
                      </button>

                      <input
                disabled={kilitli}
                        type="number"
                        min="0"
                        value={
                          urun.satisFiyati
                        }
                        onChange={(event) =>
                          fiyatGuncelle(
                            urun.id,
                            Number(
                              event.target
                                .value
                            )
                          )
                        }
                        style={{
                          ...alanStili,
                          textAlign: "center",
                          fontWeight: 900,
                          fontSize: "19px",
                        }}
                      />

                      <button
                disabled={kilitli}
                        onClick={() =>
                          fiyatiDegistir(
                            urun.id,
                            5
                          )
                        }
                        style={{
                          ...butonStili,
                          height: "48px",
                          padding: 0,
                          fontSize: "22px",
                          color: "#174d38",
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(3, 1fr)",
                        gap: "7px",
                        marginTop: "9px",
                      }}
                    >
                      {[-10, 10, 25].map(
                        (fark) => (
                          <button
                disabled={kilitli}
                            key={fark}
                            onClick={() =>
                              fiyatiDegistir(
                                urun.id,
                                fark
                              )
                            }
                            style={{
                              ...butonStili,
                              padding: "8px",
                              fontSize:
                                "13px",
                              color:
                                fark < 0
                                  ? "#b91c1c"
                                  : "#174d38",
                            }}
                          >
                            {fark > 0
                              ? `+${fark} ₺`
                              : `${fark} ₺`}
                          </button>
                        )
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: "10px",
                        marginTop: "13px",
                        paddingTop: "11px",
                        borderTop:
                          "1px solid #e5e7eb",
                        fontSize: "14px",
                      }}
                    >
                      <span>
                        Maliyet:{" "}
                        <strong>
                          {urun.maliyet > 0
                            ? para(
                                urun.maliyet
                              )
                            : "—"}
                        </strong>
                      </span>

                      <span
                        style={{
                          color:
                            urun.karOrani >=
                            50
                              ? "#15803d"
                              : urun.karOrani >=
                                  0
                                ? "#b45309"
                                : "#b91c1c",
                          fontWeight: 800,
                        }}
                      >
                        Kâr %
                        {urun.karOrani.toFixed(
                          1
                        )}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {onizlemeAcik && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            padding: "18px",
            background:
              "rgba(10,30,22,0.55)",
          }}
        >
          <div
            style={{
              width: "min(620px, 100%)",
              maxHeight: "88vh",
              overflowY: "auto",
              borderRadius: "20px",
              padding: "24px",
              background: "#ffffff",
              boxShadow:
                "0 25px 70px rgba(0,0,0,0.28)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#174d38",
              }}
            >
              Toplu Fiyat Ön İzlemesi
            </h2>

            <p
              style={{
                color: "#6b7280",
              }}
            >
              {topluEtkilenecekUrunler.length} ürün etkilenecek.
            </p>

            <div
              style={{
                borderTop:
                  "1px solid #e5e7eb",
                borderBottom:
                  "1px solid #e5e7eb",
                margin: "15px 0",
              }}
            >
              {topluEtkilenecekUrunler.map(
                (urun) => (
                  <div
                    key={urun.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(120px, 1fr) auto auto",
                      gap: "12px",
                      padding: "11px 0",
                      borderBottom:
                        "1px solid #f0f0f0",
                    }}
                  >
                    <strong>
                      {urun.ad}
                    </strong>

                    <span
                      style={{
                        color: "#6b7280",
                        textDecoration:
                          "line-through",
                      }}
                    >
                      {para(
                        urun.satisFiyati
                      )}
                    </span>

                    <strong
                      style={{
                        color:
                          urun.yeniFiyat >=
                          urun.satisFiyati
                            ? "#15803d"
                            : "#b91c1c",
                      }}
                    >
                      {para(
                        urun.yeniFiyat
                      )}
                    </strong>
                  </div>
                )
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "10px",
              }}
            >
              <button
                disabled={kilitli}
                onClick={() =>
                  setOnizlemeAcik(false)
                }
                style={{
                  ...butonStili,
                  minHeight: "52px",
                }}
              >
                ← Vazgeç
              </button>

              <button
                disabled={kilitli}
                onClick={
                  topluDegisikligiUygula
                }
                style={{
                  minHeight: "52px",
                  border: "none",
                  borderRadius: "11px",
                  background:
                    degisimYonu === "Artır"
                      ? "#174d38"
                      : "#b45309",
                  color: "#ffffff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Taslağa Uygula; Sonra Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}