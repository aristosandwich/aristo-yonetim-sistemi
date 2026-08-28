"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Header from "../ui/Header";
import { aristoYaz, bekleyenIslemiTamamla, hataMesaji, kurus, tutarMetni, onbellekYaz, tumKayitlariOku, SurumluKuyruk } from "../lib/aristoIslemler";

type Urun = {
  id: number;
  ad: string;
  kategori: string;
  satisFiyati: number;
  aktif: boolean;
};

type SepetUrunu = {
  satirId: number;
  urunId: number;
  urun: string;
  kategori: string;
  adet: number;
  birimFiyat: number;
  extra: number;
  ekmek?: "Beyaz Baget" | "Esmer Baget";
};

type OdemeTipi =
  | "Kredi Kartı"
  | "Nakit"
  | "Bölünmüş Ödeme";

type EkranTipi =
  | "Adisyonlar"
  | "Sokak";

type Adisyon = {
  surum: number;
  id: string;
  ad: string;
  grup: "Masa" | "Dış" | "Take Away";
  sepet: SepetUrunu[];
  odemeTipi: OdemeTipi;
  nakitTutari: string;
  kartTutari: string;
  indirim: string;
  not: string;
  acilisZamani?: number;
};

type SatisKaydi = {
  surum: number;
  id: number;
  islemId: number;
  satirId?: number;
  adisyon?: string;
  tarih: string;
  urun: string;
  kategori: string;
  platform: string;
  odemeTipi: string;
  adet: number;
  birimFiyat: number;
  extra?: number;
  ekmek?: "Beyaz Baget" | "Esmer Baget";
  indirim: number;
  toplam: number;
  nakitTutari: number;
  kartTutari: number;
  onlineTutari: number;
  not: string;
};

type BekleyenKayit = {
  adisyonId?: string;
  islemId?: number;
  beklenenSurum?: number;
  kaynak: EkranTipi;
  baslik: string;
  platform: string;
  sepet: SepetUrunu[];
  odemeTipi: string;
  nakit: number;
  kart: number;
  online: number;
  indirim: number;
  not: string;
  toplam: number;
};


type AyarlarVerisi = {
  isletmeAdi: string;
  altBaslik: string;
  telefon: string;
  adres: string;
  vergiDairesi: string;
  vergiNo: string;
  instagram: string;
  googleYorumLinki: string;
  tesekkurMesaji: string;
  fisAltMesaji: string;
  logoYolu: string;
  kdvOrani: number;
  paraBirimi: string;
  yaziciKagitBoyutu: string;
  fisLogosuGoster: boolean;
  fisTelefonGoster: boolean;
  fisAdresGoster: boolean;
  fisVergiBilgisiGoster: boolean;
};

const varsayilanFisAyarlari: AyarlarVerisi = {
  isletmeAdi: "ARISTO",
  altBaslik: "Sandwich & Salad Bar",
  telefon: "",
  adres: "",
  vergiDairesi: "",
  vergiNo: "",
  instagram: "",
  googleYorumLinki: "",
  tesekkurMesaji:
    "Bizi tercih ettiğiniz için teşekkür ederiz.",
  fisAltMesaji: "Afiyet olsun.",
  logoYolu: "/aristo-logo.png",
  kdvOrani: 10,
  paraBirimi: "TRY",
  yaziciKagitBoyutu: "80 mm",
  fisLogosuGoster: true,
  fisTelefonGoster: true,
  fisAdresGoster: true,
  fisVergiBilgisiGoster: false,
};

function fisAyarlariniOku(): AyarlarVerisi {
  try {
    const kayitli =
      localStorage.getItem("aristo-ayarlar");

    if (!kayitli) {
      return varsayilanFisAyarlari;
    }

    const veri = JSON.parse(kayitli);

    return {
      ...varsayilanFisAyarlari,
      ...veri,
      kdvOrani: Number(
        veri.kdvOrani ??
          varsayilanFisAyarlari.kdvOrani
      ),
    };
  } catch {
    return varsayilanFisAyarlari;
  }
}

const kategoriSirasi = [
  "Sandviç",
  "Salata",
  "İçecek",
  "Ek Ürün",
];


function bosAdisyon(
  id: string,
  ad: string,
  grup: Adisyon["grup"]
): Adisyon {
  return {
    surum: 0,
    id,
    ad,
    grup,
    sepet: [],
    odemeTipi: "Kredi Kartı",
    nakitTutari: "0",
    kartTutari: "0",
    indirim: "0",
    not: "",
  };
}

const varsayilanAdisyonlar: Adisyon[] = [
  ...Array.from({ length: 4 }, (_, index) =>
    bosAdisyon(
      `masa-${index + 1}`,
      `Masa ${index + 1}`,
      "Masa"
    )
  ),

  ...Array.from({ length: 4 }, (_, index) =>
    bosAdisyon(
      `dis-${index + 1}`,
      `Dış ${index + 1}`,
      "Dış"
    )
  ),

  ...Array.from({ length: 3 }, (_, index) =>
    bosAdisyon(
      `take-away-${index + 1}`,
      `Take Away ${index + 1}`,
      "Take Away"
    )
  ),
];

function adisyonlariBirlestir(
  kayitliAdisyonlar: Adisyon[]
) {
  return varsayilanAdisyonlar.map(
    (varsayilan) => {
      const bulunan = kayitliAdisyonlar.find(
        (kayit) => kayit.id === varsayilan.id
      );

      if (!bulunan) {
        return varsayilan;
      }

      return {
        ...varsayilan,
        ...bulunan,
        sepet: Array.isArray(bulunan.sepet)
          ? bulunan.sepet.map((urun) => ({
              ...urun,
              satirId: urun.satirId || yeniSatirId(),
              urunId: Number(urun.urunId || 0),
              adet: Number(urun.adet || 0),
              birimFiyat: Number(urun.birimFiyat || 0),
              extra: Number(urun.extra || 0),
              ekmek: urun.ekmek,
            }))
          : [],
      };
    }
  );
}

function supabaseKaydiniAdisyonaCevir(
  kayit: Record<string, unknown>
): Adisyon {
  let hamSepet: unknown = kayit.sepet;

  if (typeof hamSepet === "string") {
    try {
      hamSepet = JSON.parse(hamSepet);
    } catch {
      hamSepet = [];
    }
  }

  const grup =
    kayit.grup === "Dış" ||
    kayit.grup === "Take Away"
      ? kayit.grup
      : "Masa";

  const odemeTipi =
    kayit.odeme_tipi === "Nakit" ||
    kayit.odeme_tipi === "Bölünmüş Ödeme"
      ? kayit.odeme_tipi
      : "Kredi Kartı";

  return {
    surum: Number(kayit.surum ?? 0),
    id: String(kayit.id ?? ""),
    ad: String(kayit.ad ?? ""),
    grup,
    sepet: Array.isArray(hamSepet)
      ? (hamSepet as SepetUrunu[])
      : [],
    odemeTipi,
    nakitTutari: String(kayit.nakit_tutari ?? "0"),
    kartTutari: String(kayit.kart_tutari ?? "0"),
    indirim: String(kayit.indirim ?? "0"),
    not: String(kayit.not ?? ""),
    acilisZamani:
      kayit.acilis_zamani === null ||
      kayit.acilis_zamani === undefined
        ? undefined
        : Number(kayit.acilis_zamani),
  };
}

function adisyonuSupabaseKaydinaCevir(adisyon: Adisyon) {
  return {
    id: adisyon.id, ad: adisyon.ad, grup: adisyon.grup, sepet: adisyon.sepet,
    odeme_tipi: adisyon.odemeTipi, nakit_tutari: tutarMetni(adisyon.nakitTutari || "0"),
    kart_tutari: tutarMetni(adisyon.kartTutari || "0"), indirim: tutarMetni(adisyon.indirim || "0"),
    not: adisyon.not, beklenenSurum: adisyon.surum,
  };
}
function yerelAdisyonOnbelleginiGuncelle(adisyonlar: Adisyon[]) {
  onbellekYaz("aristo-acik-adisyonlar", adisyonlar);
}

function para(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(tutar);
}

function yuvarla(tutar: number) {
  return Math.round(
    (tutar + Number.EPSILON) * 100
  ) / 100;
}

function sepetToplami(sepet: SepetUrunu[]) {
  return sepet.reduce((toplam, urun) => toplam + urun.adet *
    (Math.round(Number(urun.birimFiyat || 0) * 100) + Math.round(Number(urun.extra || 0) * 100)), 0) / 100;
}

function sepetAdedi(sepet: SepetUrunu[]) {
  return sepet.reduce(
    (toplam, urun) =>
      toplam + Number(urun.adet || 0),
    0
  );
}

function yeniSatirId() {
  return (
    Date.now() +
    Math.floor(Math.random() * 100000)
  );
}

function platformTahsilatKaydiMi(
  platform?: string
) {
  return [
    "Getir",
    "GetirYemek",
    "Trendyol",
    "Trendyol / Uber",
    "Uber",
    "Yemeksepeti",
  ].includes(platform || "");
}

function supabaseKaydiniSatisKaydinaCevir(
  kayit: Record<string, unknown>
): SatisKaydi {
  const ekmek =
    kayit.ekmek === "Beyaz Baget" ||
    kayit.ekmek === "Esmer Baget"
      ? kayit.ekmek
      : undefined;

  return {
    surum: Number(kayit.surum ?? 1),
    id: Number(kayit.id || 0),
    islemId: Number(
      kayit.islem_id || kayit.id || 0
    ),
    satirId:
      kayit.satir_id === null ||
      kayit.satir_id === undefined
        ? undefined
        : Number(kayit.satir_id),
    adisyon: String(kayit.adisyon ?? ""),
    tarih: String(kayit.tarih ?? ""),
    urun: String(kayit.urun ?? ""),
    kategori: String(kayit.kategori ?? ""),
    platform: String(kayit.platform ?? ""),
    odemeTipi: String(kayit.odeme_tipi ?? ""),
    adet: Number(kayit.adet || 0),
    birimFiyat: Number(kayit.birim_fiyat || 0),
    extra: Number(kayit.extra || 0),
    ekmek,
    indirim: Number(kayit.indirim || 0),
    toplam: Number(kayit.toplam || 0),
    nakitTutari: Number(kayit.nakit_tutari || 0),
    kartTutari: Number(kayit.kart_tutari || 0),
    onlineTutari: Number(kayit.online_tutari || 0),
    not: String(kayit.not ?? ""),
  };
}

function yerelSatisOnbelleginiGuncelle(satislar: SatisKaydi[]) {
  onbellekYaz("aristo-satislar", satislar);
}

export default function Satislar() {
  const [urunler, setUrunler] =
    useState<Urun[]>([]);

  const [kategori, setKategori] =
    useState("Sandviç");

  const [ekran, setEkran] =
    useState<EkranTipi>("Adisyonlar");

  const [adisyonlar, setAdisyonlar] =
    useState<Adisyon[]>(
      varsayilanAdisyonlar
    );

  const [aktifAdisyonId, setAktifAdisyonId] =
    useState("masa-1");

  const [sokakSepeti, setSokakSepeti] =
    useState<SepetUrunu[]>([]);

  const [sokakOdemeTipi, setSokakOdemeTipi] =
    useState<OdemeTipi>("Kredi Kartı");

  const [sokakNakit, setSokakNakit] =
    useState("0");

  const [sokakKart, setSokakKart] =
    useState("0");

  const [sokakIndirim, setSokakIndirim] =
    useState("0");

  const [sokakNot, setSokakNot] =
    useState("");






  const [kayitlar, setKayitlar] =
    useState<SatisKaydi[]>([]);

  const [bekleyenKayit, setBekleyenKayit] =
    useState<BekleyenKayit | null>(null);

  const [kaydediliyor, setKaydediliyor] =
    useState(false);

  const [duzenlenenIslemId, setDuzenlenenIslemId] =
    useState<number | null>(null);

  const [mesaj, setMesaj] = useState("");

  const [sonEklenenId, setSonEklenenId] =
    useState<number | null>(null);

  const [secilenUrun, setSecilenUrun] =
    useState<Urun | null>(null);

  const [secimAdet, setSecimAdet] =
    useState(1);

  const [secimExtra, setSecimExtra] =
    useState("0");

  const [secimFiyat, setSecimFiyat] =
    useState("");

  const [secimEkmek, setSecimEkmek] =
    useState<"Beyaz Baget" | "Esmer Baget">(
      "Beyaz Baget"
    );

  const [simdi, setSimdi] =
    useState(Date.now());

  const [hazir, setHazir] = useState(false);
  const [veriHatasi, setVeriHatasi] = useState("");
  const [masaDurumu, setMasaDurumu] = useState("");
  const [taslakHatasi, setTaslakHatasi] = useState("");
  const gecersizTaslak = useRef(false);
  const islemKilidi = useRef(false);
  const duzenlenenSurum = useRef<number | undefined>(undefined);
  const adisyonRef = useRef(adisyonlar);
  const adisyonKayitZamanlayicisi = useRef<number | null>(null);
  const kuyruk = useRef<SurumluKuyruk<Adisyon> | null>(null);
  const sokakKirli = useRef(false);
  sokakKirli.current = sokakSepeti.length > 0;

  useEffect(() => {
    let aktif = true;
    async function yukle() {
      try {
        await bekleyenIslemiTamamla();
        const [u, s, a] = await Promise.all([
          tumKayitlariOku("urunler", "id, ad, kategori, satis_fiyati, aktif"),
          tumKayitlariOku("satislar", "*"),
          tumKayitlariOku("acik_adisyonlar", "id, ad, grup, sepet, odeme_tipi, nakit_tutari, kart_tutari, indirim, not, acilis_zamani, surum"),
        ]);
        if (!aktif) return;
        const urunler = u.filter(k => k.aktif).map(k => ({ id: Number(k.id), ad: String(k.ad), kategori: String(k.kategori), satisFiyati: Number(k.satis_fiyati), aktif: true }));
        setUrunler(urunler);
        setKategori(kategoriSirasi.find(k => urunler.some(u => u.kategori === k)) || "Sandviç");
        const masalar = adisyonlariBirlestir(a.map(supabaseKaydiniAdisyonaCevir));
        adisyonRef.current = masalar;
        setAdisyonlar(masalar);
        yerelAdisyonOnbelleginiGuncelle(masalar);
        const satislar = s.map(supabaseKaydiniSatisKaydinaCevir).sort((a,b) => b.islemId-a.islemId || a.id-b.id);
        setKayitlar(satislar);
        yerelSatisOnbelleginiGuncelle(satislar);
        kuyruk.current = new SurumluKuyruk<Adisyon>(async masa => {
          const sonuc = await aristoYaz("adisyon", adisyonuSupabaseKaydinaCevir(masa));
          if (!sonuc.adisyon) throw new Error("Masa sonucu eksik. Sayfayı yenileyin.");
          return supabaseKaydiniAdisyonaCevir(sonuc.adisyon);
        }, (gonderilen, sunucu, dahaYeni) => {
          dahaYeni = dahaYeni || adisyonRef.current.find(m => m.id === sunucu.id) !== gonderilen;
          adisyonRef.current = adisyonRef.current.map(m => m.id !== sunucu.id ? m : dahaYeni ? { ...m, surum: sunucu.surum } : sunucu);
          if (aktif) setAdisyonlar(adisyonRef.current);
          yerelAdisyonOnbelleginiGuncelle(adisyonRef.current);
        });
        kuyruk.current.baslat(masalar);
        setHazir(true);
      } catch (h) { if (aktif) setVeriHatasi(hataMesaji(h)); }
    }
    void yukle();
    const ayrilma = (e: BeforeUnloadEvent) => {
      if (gecersizTaslak.current || kuyruk.current?.kirli || islemKilidi.current || sokakKirli.current) { e.preventDefault(); e.returnValue = ""; }
    };
    const linkTiklama = (e: MouseEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest("a[href]")) return;
      if (gecersizTaslak.current || kuyruk.current?.kirli || islemKilidi.current) {
        e.preventDefault(); e.stopPropagation();
        window.alert("Masa kaydı tamamlanana kadar bu sayfada kalın. Hata varsa taslağınızı not edip sayfayı yenileyin.");
      } else if (sokakKirli.current && !window.confirm("Sokak sepeti henüz satış olarak kaydedilmedi. Sayfadan ayrılırsanız taslak kaybolur. Ayrılmak istiyor musunuz?")) {
        e.preventDefault(); e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", ayrilma);
    document.addEventListener("click", linkTiklama, true);
    return () => {
      aktif = false;
      window.removeEventListener("beforeunload", ayrilma);
      document.removeEventListener("click", linkTiklama, true);
    };
  }, []);

  useEffect(() => {
    const zamanlayici = window.setInterval(() => {
      setSimdi(Date.now());
    }, 60000);

    return () => {
      window.clearInterval(zamanlayici);
    };
  }, []);

  const aktifAdisyon = useMemo(
    () =>
      adisyonlar.find(
        (adisyon) =>
          adisyon.id === aktifAdisyonId
      ) || adisyonlar[0],
    [adisyonlar, aktifAdisyonId]
  );

  const doluAdisyonlar = useMemo(
    () =>
      adisyonlar.filter(
        (adisyon) =>
          Array.isArray(adisyon.sepet) &&
          adisyon.sepet.length > 0
      ),
    [adisyonlar]
  );

  const aktifSepet =
    ekran === "Adisyonlar"
      ? aktifAdisyon.sepet
      : sokakSepeti;

  const araToplam =
    sepetToplami(aktifSepet);

  const aktifIndirim =
    ekran === "Adisyonlar"
      ? Math.max(
          Number(
            aktifAdisyon.indirim || 0
          ),
          0
        )
      : Math.max(
          Number(
            sokakIndirim || 0
          ),
          0
        );

  const genelToplam = yuvarla(Math.max(
    araToplam - aktifIndirim,
    0
  ));

  const gorunenKategoriler =
    useMemo(() => {
      const bilinenler =
        kategoriSirasi.filter(
          (kategoriAdi) =>
            urunler.some(
              (urun) =>
                urun.kategori ===
                kategoriAdi
            )
        );

      const digerleri = Array.from(
        new Set(
          urunler
            .map(
              (urun) => urun.kategori
            )
            .filter(
              (kategoriAdi) =>
                !kategoriSirasi.includes(
                  kategoriAdi
                )
            )
        )
      );

      return [
        ...bilinenler,
        ...digerleri,
      ];
    }, [urunler]);

  const filtrelenmisUrunler =
    useMemo(
      () =>
        urunler.filter(
          (urun) =>
            urun.kategori === kategori
        ),
      [urunler, kategori]
    );

  const islemler = useMemo(() => {
    const gruplar: Record<
      number,
      SatisKaydi[]
    > = {};

    kayitlar.forEach((kayit) => {
      if (
        platformTahsilatKaydiMi(
          kayit.platform
        )
      ) {
        return;
      }

      const islemId =
        kayit.islemId || kayit.id;

      if (!gruplar[islemId]) {
        gruplar[islemId] = [];
      }

      gruplar[islemId].push(kayit);
    });

    return Object.entries(gruplar)
      .map(
        ([islemId, urunKayitlari]) => ({
          islemId: Number(islemId),
          tarih:
            urunKayitlari[0]?.tarih ||
            "-",
          adisyon:
            urunKayitlari[0]?.adisyon ||
            "",
          platform:
            urunKayitlari[0]
              ?.platform || "-",
          odemeTipi:
            urunKayitlari[0]
              ?.odemeTipi || "-",
          not:
            urunKayitlari[0]?.not ||
            "",
          urunler: urunKayitlari,
          toplam:
            urunKayitlari.reduce(
              (toplam, kayit) =>
                toplam +
                Number(
                  kayit.toplam || 0
                ),
              0
            ),
        })
      )
      .sort(
        (a, b) =>
          b.islemId - a.islemId
      );
  }, [kayitlar]);

  const bugunkuSatisToplami =
    useMemo(() => {
      const bugun = new Date();

      return kayitlar
        .filter((kayit) => {
          if (
            platformTahsilatKaydiMi(
              kayit.platform
            )
          ) {
            return false;
          }

          const tarih = new Date(
            kayit.islemId || kayit.id
          );

          return (
            tarih.getDate() ===
              bugun.getDate() &&
            tarih.getMonth() ===
              bugun.getMonth() &&
            tarih.getFullYear() ===
              bugun.getFullYear()
          );
        })
        .reduce(
          (toplam, kayit) =>
            toplam +
            Number(
              kayit.toplam || 0
            ),
          0
        );
    }, [kayitlar]);

  async function adisyonKuyrugunuKaydet() {
    try {
      await kuyruk.current?.kaydet();
      setMasaDurumu("Masa buluta kaydedildi.");
    } catch (h) { setVeriHatasi(hataMesaji(h)); throw h; }
  }

  function adisyonlariKaydet(yeniAdisyonlar: Adisyon[]) {
    if (!hazir || veriHatasi || islemKilidi.current) return;
    const onceki = adisyonRef.current;
    adisyonRef.current = yeniAdisyonlar;
    setAdisyonlar(yeniAdisyonlar);
    try {
      for (const masa of yeniAdisyonlar) {
        adisyonuSupabaseKaydinaCevir(masa);
        for (const u of masa.sepet) {
          kurus(u.birimFiyat); kurus(u.extra || 0);
          if (!Number.isInteger(u.adet) || u.adet < 1 || u.adet > 9999) throw new Error("Ürün adedi 1–9999 arasında tam sayı olmalı.");
        }
      }
    } catch (h) { gecersizTaslak.current = true; setTaslakHatasi(hataMesaji(h)); return; }
    gecersizTaslak.current = false; setTaslakHatasi("");
    for (const masa of yeniAdisyonlar) {
      if (masa !== onceki.find(m => m.id === masa.id)) kuyruk.current?.ekle(masa);
    }
    setMasaDurumu("Masa kaydediliyor… Bu sayfada kalın.");
    if (adisyonKayitZamanlayicisi.current) window.clearTimeout(adisyonKayitZamanlayicisi.current);
    adisyonKayitZamanlayicisi.current = window.setTimeout(() => {
      adisyonKayitZamanlayicisi.current = null;
      void adisyonKuyrugunuKaydet().catch(() => undefined);
    }, 400);
  }

  function aktifAdisyonuGuncelle(
    degisiklik:
      | Partial<Adisyon>
      | ((adisyon: Adisyon) => Adisyon)
  ) {
    const yeniAdisyonlar =
      adisyonRef.current.map((adisyon) => {
        if (
          adisyon.id !==
          aktifAdisyonId
        ) {
          return adisyon;
        }

        if (
          typeof degisiklik ===
          "function"
        ) {
          return degisiklik(
            adisyon
          );
        }

        return {
          ...adisyon,
          ...degisiklik,
        };
      });

    adisyonlariKaydet(
      yeniAdisyonlar
    );
  }

  function aktifSepetiGuncelle(
    yeniSepet:
      | SepetUrunu[]
      | ((
          mevcut: SepetUrunu[]
        ) => SepetUrunu[])
  ) {
    if (ekran === "Adisyonlar") {
      aktifAdisyonuGuncelle(
        (adisyon) => {
          const sonuc =
            typeof yeniSepet ===
            "function"
              ? yeniSepet(
                  adisyon.sepet
                )
              : yeniSepet;

          return {
            ...adisyon,
            sepet: sonuc,
            acilisZamani:
              sonuc.length > 0
                ? adisyon.acilisZamani ||
                  Date.now()
                : undefined,
          };
        }
      );

      return;
    }

    setSokakSepeti(
      typeof yeniSepet ===
        "function"
        ? yeniSepet(sokakSepeti)
        : yeniSepet
    );
  }

  function uruneTikla(urun: Urun) {
    const altSecimGerekli =
      urun.kategori === "Sandviç" ||
      urun.kategori === "Salata";

    if (!altSecimGerekli) {
      sepeteDogrudanEkle(urun);
      return;
    }

    setSecilenUrun(urun);
    setSecimAdet(1);
    setSecimExtra("0");
    setSecimFiyat(String(Number(urun.satisFiyati || 0)));
    setSecimEkmek("Beyaz Baget");
  }

  function sepeteDogrudanEkle(urun: Urun) {
    aktifSepetiGuncelle((mevcutSepet) => {
      const bulunan = mevcutSepet.find(
        (sepetUrunu) =>
          sepetUrunu.urunId === urun.id &&
          Number(sepetUrunu.extra || 0) === 0 &&
          !sepetUrunu.ekmek
      );

      if (bulunan) {
        return mevcutSepet.map((sepetUrunu) =>
          sepetUrunu.satirId === bulunan.satirId
            ? {
                ...sepetUrunu,
                adet: sepetUrunu.adet + 1,
              }
            : sepetUrunu
        );
      }

      return [
        ...mevcutSepet,
        {
          satirId: yeniSatirId(),
          urunId: urun.id,
          urun: urun.ad,
          kategori: urun.kategori,
          adet: 1,
          birimFiyat: Number(urun.satisFiyati || 0),
          extra: 0,
        },
      ];
    });

    setSonEklenenId(urun.id);
    window.setTimeout(() => setSonEklenenId(null), 300);
  }

  function secimiSepeteEkle() {
    if (!secilenUrun) return;

    const adet = Math.max(Number(secimAdet || 1), 1);
    const extra = Math.max(Number(secimExtra || 0), 0);
    const satisFiyati = Math.max(
      Number(secimFiyat || secilenUrun.satisFiyati || 0),
      0
    );
    try {
      if (!Number.isInteger(adet) || adet < 1 || adet > 9999) throw new Error("Adet pozitif tam sayı olmalı.");
      kurus(extra); kurus(satisFiyati);
    } catch (h) { window.alert(hataMesaji(h)); return; }
    const ekmek =
      secilenUrun.kategori === "Sandviç"
        ? secimEkmek
        : undefined;

    aktifSepetiGuncelle((mevcutSepet) => [
      ...mevcutSepet,
      {
        satirId: yeniSatirId(),
        urunId: secilenUrun.id,
        urun: secilenUrun.ad,
        kategori: secilenUrun.kategori,
        adet,
        birimFiyat: satisFiyati,
        extra,
        ekmek,
      },
    ]);

    setSonEklenenId(secilenUrun.id);
    setSecilenUrun(null);
    window.setTimeout(() => setSonEklenenId(null), 300);
  }

  function adetArtir(
    satirId: number
  ) {
    aktifSepetiGuncelle(
      (sepet) =>
        sepet.map((urun) =>
          urun.satirId === satirId
            ? {
                ...urun,
                adet: urun.adet + 1,
              }
            : urun
        )
    );
  }

  function adetAzalt(
    satirId: number
  ) {
    aktifSepetiGuncelle(
      (sepet) => {
        const bulunan =
          sepet.find(
            (urun) =>
              urun.satirId === satirId
          );

        if (!bulunan) {
          return sepet;
        }

        if (bulunan.adet <= 1) {
          return sepet.filter(
            (urun) =>
              urun.satirId !== satirId
          );
        }

        return sepet.map(
          (urun) =>
            urun.satirId === satirId
              ? {
                  ...urun,
                  adet:
                    urun.adet - 1,
                }
              : urun
        );
      }
    );
  }

  function birimFiyatDegistir(
    satirId: number,
    deger: string
  ) {
    const birimFiyat = Math.max(
      Number(deger || 0),
      0
    );

    aktifSepetiGuncelle(
      (sepet) =>
        sepet.map((urun) =>
          urun.satirId === satirId
            ? {
                ...urun,
                birimFiyat,
              }
            : urun
        )
    );
  }

  function extraDegistir(
    satirId: number,
    deger: string
  ) {
    const extra = Math.max(
      Number(deger || 0),
      0
    );

    aktifSepetiGuncelle(
      (sepet) =>
        sepet.map((urun) =>
          urun.satirId === satirId
            ? {
                ...urun,
                extra,
              }
            : urun
        )
    );
  }

  function satiriSil(
    satirId: number
  ) {
    aktifSepetiGuncelle(
      (sepet) =>
        sepet.filter(
          (urun) =>
            urun.satirId !== satirId
        )
    );
  }

  function sokakOdemeDegistir(
    yeniOdemeTipi: OdemeTipi
  ) {
    setSokakOdemeTipi(
      yeniOdemeTipi
    );

    if (
      yeniOdemeTipi ===
      "Bölünmüş Ödeme"
    ) {
      const yarisi = yuvarla(
        genelToplam / 2
      );

      setSokakNakit(
        String(yarisi)
      );

      setSokakKart(
        String(
          yuvarla(
            genelToplam - yarisi
          )
        )
      );

      return;
    }

    setSokakNakit("0");
    setSokakKart("0");
  }

  function adisyonOdemeDegistir(
    yeniOdemeTipi: OdemeTipi
  ) {
    if (
      yeniOdemeTipi ===
      "Bölünmüş Ödeme"
    ) {
      const yarisi = yuvarla(
        genelToplam / 2
      );

      aktifAdisyonuGuncelle({
        odemeTipi:
          yeniOdemeTipi,
        nakitTutari:
          String(yarisi),
        kartTutari: String(
          yuvarla(
            genelToplam - yarisi
          )
        ),
      });

      return;
    }

    aktifAdisyonuGuncelle({
      odemeTipi: yeniOdemeTipi,
      nakitTutari: "0",
      kartTutari: "0",
    });
  }

  function adisyonNakitDegistir(
    deger: string
  ) {
    const nakit = Math.max(
      Number(deger || 0),
      0
    );

    aktifAdisyonuGuncelle({
      nakitTutari: deger,
      kartTutari: String(
        yuvarla(
          Math.max(
            genelToplam - nakit,
            0
          )
        )
      ),
    });
  }

  function adisyonKartDegistir(
    deger: string
  ) {
    const kart = Math.max(
      Number(deger || 0),
      0
    );

    aktifAdisyonuGuncelle({
      kartTutari: deger,
      nakitTutari: String(
        yuvarla(
          Math.max(
            genelToplam - kart,
            0
          )
        )
      ),
    });
  }

  function sokakNakitDegistir(
    deger: string
  ) {
    const nakit = Math.max(
      Number(deger || 0),
      0
    );

    setSokakNakit(deger);

    setSokakKart(
      String(
        yuvarla(
          Math.max(
            genelToplam - nakit,
            0
          )
        )
      )
    );
  }

  function sokakKartDegistir(
    deger: string
  ) {
    const kart = Math.max(
      Number(deger || 0),
      0
    );

    setSokakKart(deger);

    setSokakNakit(
      String(
        yuvarla(
          Math.max(
            genelToplam - kart,
            0
          )
        )
      )
    );
  }

  function kayitOnayiAc() {
    if (!hazir || veriHatasi || islemKilidi.current) return;
    if (gecersizTaslak.current) { window.alert(taslakHatasi); return; }
    if (aktifSepet.length === 0) {
      alert("Sepete ürün ekle.");
      return;
    }

    if (
      aktifIndirim >
      araToplam
    ) {
      alert(
        "İndirim ara toplamdan fazla olamaz."
      );
      return;
    }

    let baslik = "";
    let platform = "";
    let odemeTipi = "";
    let nakit = 0;
    let kart = 0;
    let online = 0;
    let not = "";

    if (ekran === "Adisyonlar") {
      baslik = aktifAdisyon.ad;
      platform = "Dükkân";
      not = aktifAdisyon.not;

      if (
        aktifAdisyon.odemeTipi ===
        "Nakit"
      ) {
        odemeTipi = "Nakit";
        nakit = genelToplam;
      } else if (
        aktifAdisyon.odemeTipi ===
        "Kredi Kartı"
      ) {
        odemeTipi =
          "Kredi Kartı";
        kart = genelToplam;
      } else {
        nakit = Math.max(
          Number(
            aktifAdisyon.nakitTutari ||
              0
          ),
          0
        );

        kart = Math.max(
          Number(
            aktifAdisyon.kartTutari ||
              0
          ),
          0
        );

        const fark = yuvarla(
          genelToplam -
            nakit -
            kart
        );

        if (
          !Number.isFinite(fark) || Math.round(fark * 100) !== 0
        ) {
          alert(
            fark > 0
              ? `${para(
                  fark
                )} ödeme eksik.`
              : `${para(
                  Math.abs(fark)
                )} fazla ödeme girildi.`
          );

          return;
        }

        odemeTipi =
          "Nakit + Kredi Kartı";
      }
    }

    if (ekran === "Sokak") {
      baslik =
        duzenlenenIslemId !== null
          ? "Sokak Satışı Düzenleme"
          : "Sokak / Dükkân Satışı";

      platform =
        "Sokak Satışı";

      not = sokakNot;

      if (
        sokakOdemeTipi ===
        "Nakit"
      ) {
        odemeTipi = "Nakit";
        nakit = genelToplam;
      } else if (
        sokakOdemeTipi ===
        "Kredi Kartı"
      ) {
        odemeTipi =
          "Kredi Kartı";
        kart = genelToplam;
      } else {
        nakit = Math.max(
          Number(sokakNakit || 0),
          0
        );

        kart = Math.max(
          Number(sokakKart || 0),
          0
        );

        const fark = yuvarla(
          genelToplam -
            nakit -
            kart
        );

        if (
          !Number.isFinite(fark) || Math.round(fark * 100) !== 0
        ) {
          alert(
            fark > 0
              ? `${para(
                  fark
                )} ödeme eksik.`
              : `${para(
                  Math.abs(fark)
                )} fazla ödeme girildi.`
          );

          return;
        }

        odemeTipi =
          "Nakit + Kredi Kartı";
      }
    }



    try {
      for (const urun of aktifSepet) {
        if (!Number.isInteger(urun.adet) || urun.adet < 1 || urun.adet > 9999) throw new Error("Ürün adedi geçersiz.");
        kurus(urun.birimFiyat); kurus(urun.extra || 0);
      }
      if (kurus(nakit) + kurus(kart) !== kurus(genelToplam)) throw new Error("Ödeme toplamını kontrol edin.");
      kurus(aktifIndirim);
    } catch (h) { window.alert(hataMesaji(h)); return; }
    setBekleyenKayit({
      adisyonId: ekran === "Adisyonlar" ? aktifAdisyon.id : undefined,
      islemId: ekran === "Sokak" ? duzenlenenIslemId ?? undefined : undefined,
      beklenenSurum: ekran === "Sokak" ? duzenlenenSurum.current : undefined,
      kaynak: ekran,
      baslik,
      platform,
      sepet: aktifSepet,
      odemeTipi,
      nakit,
      kart,
      online,
      indirim:
        aktifIndirim,
      not,
      toplam: genelToplam,
    });
  }

  async function kaydiTamamla() {
    if (!bekleyenKayit || !hazir || veriHatasi || islemKilidi.current) return;
    islemKilidi.current = true;
    setKaydediliyor(true);
    try {
      if (adisyonKayitZamanlayicisi.current) window.clearTimeout(adisyonKayitZamanlayicisi.current);
      await adisyonKuyrugunuKaydet();
      const b = bekleyenKayit;
      const sonuc = await aristoYaz("satis", {
        sepet: b.sepet, indirim: tutarMetni(b.indirim), nakit: tutarMetni(b.nakit),
        kart: tutarMetni(b.kart), toplam: tutarMetni(b.toplam), not: b.not.trim(),
        islemId: b.islemId, beklenenSurum: b.beklenenSurum,
        adisyonId: b.adisyonId, adisyonSurum: b.adisyonId ? kuyruk.current?.surum(b.adisyonId) : undefined,
      });
      if (!sonuc.satislar || !sonuc.islemId) throw new Error("Satış sonucu eksik. Yeni kayıt girmeden sayfayı yenileyin.");
      const yeni = sonuc.satislar.map(supabaseKaydiniSatisKaydinaCevir);
      const tum = [...yeni, ...kayitlar.filter(k => k.islemId !== sonuc.islemId)];
      setKayitlar(tum);
      yerelSatisOnbelleginiGuncelle(tum);
      if (sonuc.adisyon) {
        const kapali = supabaseKaydiniAdisyonaCevir(sonuc.adisyon);
        kuyruk.current?.onayla(kapali);
        adisyonRef.current = adisyonRef.current.map(m => m.id === kapali.id ? kapali : m);
        setAdisyonlar(adisyonRef.current);
        yerelAdisyonOnbelleginiGuncelle(adisyonRef.current);
      }
      if (b.kaynak === "Sokak") {
        setSokakSepeti([]); setSokakOdemeTipi("Kredi Kartı");
        setSokakNakit("0"); setSokakKart("0"); setSokakIndirim("0"); setSokakNot("");
        sokakKirli.current = false;
      }
      if (b.kaynak === "Sokak") { setDuzenlenenIslemId(null); duzenlenenSurum.current = undefined; }
      setBekleyenKayit(null);
      setMesaj(b.islemId ? "Satış ve kasa güncellendi." : "Satış, masa ve kasa kaydedildi.");
      window.setTimeout(() => setMesaj(""), 3000);
    } catch (h) { setVeriHatasi(hataMesaji(h)); }
    finally { islemKilidi.current = false; setKaydediliyor(false); }
  }

  function satisiDuzenle(
    islemId: number
  ) {
    const islemKayitlari =
      kayitlar.filter(
        (kayit) =>
          kayit.islemId === islemId
      );

    if (
      islemKayitlari.length === 0
    ) {
      return;
    }

    const ilk =
      islemKayitlari[0];
    duzenlenenSurum.current = Math.max(...islemKayitlari.map(k => k.surum));

    const duzenlenecekSepet =
      islemKayitlari.map(
        (kayit) => ({
          satirId:
            kayit.satirId ||
            yeniSatirId(),
          urunId:
            urunler.find(
              (urun) =>
                urun.ad === kayit.urun
            )?.id || kayit.id,
          urun: kayit.urun,
          kategori:
            kayit.kategori,
          adet: kayit.adet,
          birimFiyat:
            kayit.birimFiyat,
          extra: Number(
            kayit.extra || 0
          ),
          ekmek: kayit.ekmek,
        })
      );

    const toplamIndirim =
      islemKayitlari.reduce(
        (toplam, kayit) =>
          toplam +
          Number(
            kayit.indirim || 0
          ),
        0
      );

    setDuzenlenenIslemId(
      islemId
    );

    setEkran("Sokak");
      setSokakSepeti(
        duzenlenecekSepet
      );
      setSokakIndirim(
        String(
          yuvarla(
            toplamIndirim
          )
        )
      );
      setSokakNot(
        ilk.not || ""
      );

      const toplamNakit =
        islemKayitlari.reduce(
          (toplam, kayit) =>
            toplam +
            Number(
              kayit.nakitTutari ||
                0
            ),
          0
        );

      const toplamKart =
        islemKayitlari.reduce(
          (toplam, kayit) =>
            toplam +
            Number(
              kayit.kartTutari ||
                0
            ),
          0
        );

      if (
        toplamNakit > 0 &&
        toplamKart > 0
      ) {
        setSokakOdemeTipi(
          "Bölünmüş Ödeme"
        );
        setSokakNakit(
          String(
            yuvarla(toplamNakit)
          )
        );
        setSokakKart(
          String(
            yuvarla(toplamKart)
          )
        );
      } else if (
        toplamNakit > 0
      ) {
        setSokakOdemeTipi(
          "Nakit"
        );
        setSokakNakit("0");
        setSokakKart("0");
      } else {
        setSokakOdemeTipi(
          "Kredi Kartı"
        );
        setSokakNakit("0");
        setSokakKart("0");
      }


    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function satisiIptalEt(islemId: number) {
    if (!hazir || veriHatasi || islemKilidi.current) return;
    if (!window.confirm("Bu satış iptal edilsin mi? Nakit payı kasadan düşülecek.")) return;
    if (!window.confirm("Emin misin? Satış raporlardan da kaldırılacak.")) return;
    const satirlar = kayitlar.filter(k => k.islemId === islemId);
    if (!satirlar.length) return;
    islemKilidi.current = true; setKaydediliyor(true);
    try {
      await adisyonKuyrugunuKaydet();
      await aristoYaz("satis_sil", { islemId, beklenenSurum: Math.max(...satirlar.map(k => k.surum)) });
      const yeni = kayitlar.filter(k => k.islemId !== islemId);
      setKayitlar(yeni); yerelSatisOnbelleginiGuncelle(yeni);
      if (duzenlenenIslemId === islemId) { setDuzenlenenIslemId(null); setSokakSepeti([]); }
      setMesaj("Satış iptal edildi; kasa düzeltildi.");
    } catch (h) { setVeriHatasi(hataMesaji(h)); }
    finally { islemKilidi.current = false; setKaydediliyor(false); }
  }

  function aktifSepetiTemizle() {
    if (
      aktifSepet.length === 0
    ) {
      return;
    }

    const onay =
      window.confirm(
        "Bu sepetteki bütün ürünler silinsin mi?"
      );

    if (!onay) {
      return;
    }

    if (ekran === "Adisyonlar") {
      aktifAdisyonuGuncelle({ ...bosAdisyon(aktifAdisyon.id, aktifAdisyon.ad, aktifAdisyon.grup), surum: aktifAdisyon.surum });
    } else { aktifSepetiGuncelle([]); }

    if (ekran === "Sokak") {
      setSokakIndirim("0");
      setSokakNot("");
    }

  }

  function htmlKacis(deger: string) {
    return deger
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function yazdirmaBasligi() {
    return ekran === "Adisyonlar"
      ? aktifAdisyon.ad
      : "Dükkân Satışı";
  }

  function yazdirmaNotu() {
    return ekran === "Adisyonlar"
      ? aktifAdisyon.not.trim()
      : sokakNot.trim();
  }

  function yazdirmaPenceresiAc(
    tur: "Mutfak" | "Hesap"
  ) {
    if (aktifSepet.length === 0) {
      alert("Yazdırılacak sipariş yok.");
      return;
    }

    const ayarlar = fisAyarlariniOku();

    const pencere = window.open(
      "",
      "_blank",
      "width=430,height=760"
    );

    if (!pencere) {
      alert(
        "Yazdırma penceresi açılamadı. Tarayıcıdaki açılır pencere engelini kapat."
      );
      return;
    }

    const baslik = htmlKacis(
      yazdirmaBasligi()
    );

    const notMetni = htmlKacis(
      yazdirmaNotu()
    );

    const tarih =
      new Intl.DateTimeFormat(
        "tr-TR",
        {
          dateStyle: "short",
          timeStyle: "short",
        }
      ).format(new Date());

    const kagitGenisligi =
      ayarlar.yaziciKagitBoyutu ===
      "58 mm"
        ? "58mm"
        : "80mm";

    const govdeGenisligi =
      ayarlar.yaziciKagitBoyutu ===
      "58 mm"
        ? "50mm"
        : "72mm";

    const logoAdresi =
      ayarlar.logoYolu
        ? new URL(
            ayarlar.logoYolu,
            window.location.origin
          ).href
        : "";

    const logoBolumu =
      tur === "Hesap" &&
      ayarlar.fisLogosuGoster &&
      logoAdresi
        ? `
          <img
            class="logo"
            src="${htmlKacis(
              logoAdresi
            )}"
            alt="Logo"
          />
        `
        : "";

    const telefonBolumu =
      tur === "Hesap" &&
      ayarlar.fisTelefonGoster &&
      ayarlar.telefon.trim()
        ? `<div class="iletisim">${htmlKacis(
            ayarlar.telefon.trim()
          )}</div>`
        : "";

    const adresBolumu =
      tur === "Hesap" &&
      ayarlar.fisAdresGoster &&
      ayarlar.adres.trim()
        ? `<div class="iletisim">${htmlKacis(
            ayarlar.adres.trim()
          ).replaceAll(
            "\n",
            "<br />"
          )}</div>`
        : "";

    const vergiBolumu =
      tur === "Hesap" &&
      ayarlar.fisVergiBilgisiGoster &&
      (ayarlar.vergiDairesi.trim() ||
        ayarlar.vergiNo.trim())
        ? `
          <div class="iletisim">
            ${htmlKacis(
              ayarlar.vergiDairesi.trim()
            )}
            ${
              ayarlar.vergiDairesi.trim() &&
              ayarlar.vergiNo.trim()
                ? " · "
                : ""
            }
            ${htmlKacis(
              ayarlar.vergiNo.trim()
            )}
          </div>
        `
        : "";

    const urunSatirlari =
      aktifSepet
        .map((urun) => {
          const urunAdi =
            htmlKacis(urun.urun);

          const ekmek = urun.ekmek
            ? `<div class="alt">• ${htmlKacis(
                urun.ekmek
              )}</div>`
            : "";

          const extra =
            Number(urun.extra || 0) >
            0
              ? tur === "Mutfak"
                ? `<div class="alt">• EXTRA</div>`
                : `<div class="alt">Extra: +${htmlKacis(
                    para(
                      Number(
                        urun.extra || 0
                      )
                    )
                  )}</div>`
              : "";

          const satirToplami =
            urun.adet *
            (Number(
              urun.birimFiyat || 0
            ) +
              Number(
                urun.extra || 0
              ));

          const fiyat =
            tur === "Hesap"
              ? `<strong>${htmlKacis(
                  para(satirToplami)
                )}</strong>`
              : "";

          return `
            <div class="urun">
              <div class="urun-ust">
                <span>
                  <strong>${urun.adet} x</strong>
                  ${urunAdi}
                </span>
                ${fiyat}
              </div>
              ${ekmek}
              ${extra}
            </div>
          `;
        })
        .join("");

    const araToplamSatiri =
      tur === "Hesap" &&
      aktifIndirim > 0
        ? `
          <div class="ozet-satir">
            <span>Ara Toplam</span>
            <strong>${htmlKacis(
              para(araToplam)
            )}</strong>
          </div>
        `
        : "";

    const indirimSatiri =
      tur === "Hesap" &&
      aktifIndirim > 0
        ? `
          <div class="ozet-satir">
            <span>İndirim</span>
            <strong>-${htmlKacis(
              para(aktifIndirim)
            )}</strong>
          </div>
        `
        : "";

    let odemeBilgisi = "";

    if (tur === "Hesap") {
      if (
        aktifOdemeTipi ===
        "Nakit"
      ) {
        odemeBilgisi = `
          <div class="ozet-satir">
            <span>Ödeme</span>
            <strong>Nakit</strong>
          </div>
        `;
      } else if (
        aktifOdemeTipi ===
        "Kredi Kartı"
      ) {
        odemeBilgisi = `
          <div class="ozet-satir">
            <span>Ödeme</span>
            <strong>Kredi Kartı</strong>
          </div>
        `;
      } else {
        const nakit =
          ekran === "Adisyonlar"
            ? Number(
                aktifAdisyon.nakitTutari ||
                  0
              )
            : Number(
                sokakNakit || 0
              );

        const kart =
          ekran === "Adisyonlar"
            ? Number(
                aktifAdisyon.kartTutari ||
                  0
              )
            : Number(
                sokakKart || 0
              );

        odemeBilgisi = `
          <div class="ozet-satir">
            <span>Nakit</span>
            <strong>${htmlKacis(
              para(nakit)
            )}</strong>
          </div>
          <div class="ozet-satir">
            <span>Kredi Kartı</span>
            <strong>${htmlKacis(
              para(kart)
            )}</strong>
          </div>
        `;
      }
    }

    const toplamBolumu =
      tur === "Hesap"
        ? `
          <div class="cizgi"></div>
          ${araToplamSatiri}
          ${indirimSatiri}
          <div class="ozet-satir toplam">
            <span>TOPLAM</span>
            <strong>${htmlKacis(
              para(genelToplam)
            )}</strong>
          </div>
          <div class="ince-cizgi"></div>
          ${odemeBilgisi}
          <div class="kdv">
            Fiyatlara KDV dahildir.
            KDV oranı: %${Number(
              ayarlar.kdvOrani || 0
            )}
          </div>
        `
        : "";

    const notBolumu = notMetni
      ? `
        <div class="cizgi"></div>
        <div class="not">
          <strong>NOT</strong>
          <div>${notMetni.replaceAll(
            "\n",
            "<br />"
          )}</div>
        </div>
      `
      : "";

    const sosyalBolumu =
      tur === "Hesap" &&
      (ayarlar.instagram.trim() ||
        ayarlar.googleYorumLinki.trim())
        ? `
          <div class="cizgi"></div>
          ${
            ayarlar.instagram.trim()
              ? `<div class="sosyal">Instagram: ${htmlKacis(
                  ayarlar.instagram.trim()
                )}</div>`
              : ""
          }
          ${
            ayarlar.googleYorumLinki.trim()
              ? `<div class="sosyal">Google yorum bağlantımızı ziyaret edebilirsiniz.</div>`
              : ""
          }
        `
        : "";

    const altMesaj =
      tur === "Mutfak"
        ? "Sipariş fişi"
        : `
          <div>${htmlKacis(
            ayarlar.tesekkurMesaji
          )}</div>
          <strong>${htmlKacis(
            ayarlar.fisAltMesaji
          )}</strong>
        `;

    pencere.document.write(`
      <!doctype html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <title>${tur} Fişi - ${baslik}</title>

          <style>
            @page {
              size: ${kagitGenisligi} auto;
              margin: 3mm;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
            }

            body {
              width: ${govdeGenisligi};
              margin: 0 auto;
              color: #000000;
              font-family:
                Arial,
                Helvetica,
                sans-serif;
              font-size: 13px;
              line-height: 1.35;
            }

            .merkez {
              text-align: center;
            }

            .logo {
              display: block;
              width: 23mm;
              height: 23mm;
              margin: 0 auto 2mm;
              object-fit: contain;
              filter: grayscale(1) contrast(1.2);
            }

            .marka {
              margin: 0;
              font-size: 23px;
              font-weight: 900;
              letter-spacing: 0.6px;
            }

            .alt-baslik {
              margin-top: 2px;
              font-size: 11px;
              font-weight: 700;
            }

            .iletisim {
              margin-top: 3px;
              font-size: 10px;
              line-height: 1.3;
            }

            .fis-turu {
              margin-top: 12px;
              font-size: 16px;
              font-weight: 900;
              letter-spacing: 0.3px;
            }

            .adisyon {
              margin-top: 5px;
              font-size: ${
                tur === "Mutfak"
                  ? "25px"
                  : "20px"
              };
              font-weight: 900;
            }

            .tarih {
              margin-top: 4px;
              font-size: 11px;
            }

            .cizgi {
              border-top: 1px dashed #000000;
              margin: 10px 0;
            }

            .ince-cizgi {
              border-top: 1px dotted #777777;
              margin: 8px 0;
            }

            .urun {
              padding: ${
                tur === "Mutfak"
                  ? "9px 0"
                  : "7px 0"
              };
              border-bottom: 1px dotted #777777;
              break-inside: avoid;
            }

            .urun-ust,
            .ozet-satir {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 8px;
            }

            .urun-ust {
              font-size: ${
                tur === "Mutfak"
                  ? "17px"
                  : "13px"
              };
            }

            .urun-ust > span {
              min-width: 0;
              text-align: left;
              overflow-wrap: anywhere;
            }

            .urun-ust > strong {
              flex-shrink: 0;
            }

            .alt {
              margin-top: 3px;
              padding-left: 15px;
              text-align: left;
              font-size: ${
                tur === "Mutfak"
                  ? "14px"
                  : "12px"
              };
              font-weight: ${
                tur === "Mutfak"
                  ? "800"
                  : "400"
              };
            }

            .ozet-satir {
              margin-top: 5px;
            }

            .toplam {
              align-items: center;
              margin-top: 8px;
              font-size: 20px;
              font-weight: 900;
            }

            .not {
              padding: 7px;
              border: 2px solid #000000;
              font-size: ${
                tur === "Mutfak"
                  ? "17px"
                  : "14px"
              };
              font-weight: ${
                tur === "Mutfak"
                  ? "800"
                  : "400"
              };
              white-space: normal;
              overflow-wrap: anywhere;
            }

            .not strong {
              display: block;
              margin-bottom: 4px;
              font-size: 14px;
            }

            .kdv {
              margin-top: 9px;
              text-align: center;
              font-size: 9px;
            }

            .sosyal {
              margin-top: 4px;
              text-align: center;
              font-size: 10px;
              overflow-wrap: anywhere;
            }

            .alt-metin {
              margin-top: 16px;
              text-align: center;
              font-size: 11px;
              line-height: 1.5;
            }

            .mali-degeri-yok {
              margin-top: 8px;
              text-align: center;
              font-size: 9px;
              font-weight: 700;
            }

            @media print {
              body {
                width: ${govdeGenisligi};
              }
            }
          </style>
        </head>

        <body>
          <div class="merkez">
            ${logoBolumu}

            <h1 class="marka">
              ${htmlKacis(
                ayarlar.isletmeAdi ||
                  "ARISTO"
              )}
            </h1>

            <div class="alt-baslik">
              ${htmlKacis(
                ayarlar.altBaslik || ""
              )}
            </div>

            ${telefonBolumu}
            ${adresBolumu}
            ${vergiBolumu}

            <div class="fis-turu">
              ${
                tur === "Mutfak"
                  ? "MUTFAK SİPARİŞİ"
                  : "HESAP ADİSYONU"
              }
            </div>

            <div class="adisyon">
              ${baslik}
            </div>

            <div class="tarih">
              ${htmlKacis(tarih)}
            </div>
          </div>

          <div class="cizgi"></div>

          ${urunSatirlari}
          ${toplamBolumu}
          ${notBolumu}
          ${sosyalBolumu}

          <div class="alt-metin">
            ${altMesaj}
          </div>

          ${
            tur === "Hesap"
              ? `<div class="mali-degeri-yok">MALİ DEĞERİ YOKTUR</div>`
              : ""
          }

          <script>
            window.addEventListener(
              "load",
              () => {
                window.setTimeout(
                  () => window.print(),
                  250
                );
              }
            );

            window.addEventListener(
              "afterprint",
              () => {
                window.close();
              }
            );
          </script>
        </body>
      </html>
    `);

    pencere.document.close();
  }

  const kartStili: CSSProperties = {
    background: "#ffffff",
    border:
      "1px solid #e3e8e5",
    borderRadius: "18px",
    padding: "20px",
    boxShadow:
      "0 8px 24px rgba(23,77,56,0.07)",
  };

  const butonStili: CSSProperties = {
    border:
      "1px solid #d1d5db",
    borderRadius: "11px",
    padding: "11px 14px",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 700,
    cursor: "pointer",
  };

  const alanStili: CSSProperties = {
    width: "100%",
    padding: "12px",
    boxSizing: "border-box",
    border:
      "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "16px",
    background: "#ffffff",
  };

  const aktifOdemeTipi =
    ekran === "Adisyonlar"
      ? aktifAdisyon.odemeTipi
      : sokakOdemeTipi;

  if (!hazir) return <main style={{ padding: 30 }}><Header /><p role="status">{veriHatasi || "Güncel kayıtlar buluttan okunuyor…"}</p>{veriHatasi && <button onClick={() => window.location.reload()}>Yeniden yükle</button>}</main>;

  return (
    <main
      className="satis-mobil-main"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f7faf8 0%, #eef4f0 100%)",
        padding:
          "28px 18px 60px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div role="status" style={{ padding: "8px 16px", color: veriHatasi ? "#b91c1c" : "#174d38" }}>
        {veriHatasi || taslakHatasi || masaDurumu}
        {veriHatasi && <><p>Taslağınız aşağıda duruyor. Çakışmada buluttaki kayıt ezilmez; gerekiyorsa taslağı not edip güncel kaydı yükleyin.</p><button onClick={() => window.location.reload()}>Güncel kayıtları yükle</button></>}
      </div>
      <fieldset disabled={kaydediliyor || !!veriHatasi} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>

      <style jsx global>{`
        html, body {
          max-width: 100%;
          overflow-x: hidden;
        }

        button, input, textarea, select {
          font: inherit;
        }

        .mobil-ana-icerik {
          width: 100%;
          min-width: 0;
        }

        @media (max-width: 980px) {
          .satis-ana-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .satis-sticky-panel,
          .dolu-adisyon-panel {
            position: static !important;
            top: auto !important;
          }

          .adisyon-ust-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .satis-mobil-main {
            padding: 14px 9px 42px !important;
          }

          .mobil-ana-icerik {
            max-width: 100% !important;
          }

          .satis-ust-ozet {
            align-items: stretch !important;
            gap: 12px !important;
          }

          .satis-ust-ozet > div {
            width: 100%;
          }

          .bugunku-satis-karti {
            padding: 15px !important;
          }

          .adisyon-ust-grid {
            gap: 12px !important;
          }

          .adisyon-kart-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }

          .adisyon-kart-grid > button {
            min-width: 0 !important;
            min-height: 88px !important;
            padding: 10px !important;
          }

          .urun-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }

          .urun-grid > button {
            min-width: 0 !important;
            min-height: 108px !important;
            padding: 13px !important;
          }

          .kategori-butonlari {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .kategori-butonlari > button {
            width: 100%;
          }

          .sepet-satir {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 10px !important;
          }

          .sepet-satir > div:last-child {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            text-align: left !important;
          }

          .sepet-satir > div:last-child > strong,
          .sepet-satir > div:last-child > button {
            margin-top: 0 !important;
          }

          .sepet-alan-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .yazdir-grid,
          .bolunmus-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .odeme-tip-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .odeme-tip-grid > button {
            min-height: 50px !important;
          }

          .odenecek-toplam {
            font-size: 34px !important;
            overflow-wrap: anywhere;
          }

          .mobil-modal-kutu {
            width: calc(100% - 20px) !important;
            max-height: calc(100vh - 24px) !important;
            overflow-y: auto !important;
            padding: 18px !important;
          }

          .mobil-modal-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .mobil-modal-butonlar {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .son-satis-butonlari > button {
            flex: 1 1 140px;
          }
        }

        @media (max-width: 380px) {
          .adisyon-kart-grid,
          .urun-grid,
          .kategori-butonlari {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>

      <div
        className="mobil-ana-icerik"
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <Header />

        <div
          className="satis-ust-ozet"
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "18px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 6px",
                color: "#153f30",
              }}
            >
              Sipariş ve Ödeme
            </h1>

            <p
              style={{
                margin: 0,
                color: "#66736c",
              }}
            >
              Siparişi oluştur, ödeme yöntemini seç ve işlemi tamamla.
            </p>
          </div>

          <div className="bugunku-satis-karti" style={kartStili}>
            <small
              style={{
                color: "#6b7280",
              }}
            >
              BUGÜNKÜ SATIŞ
            </small>

            <h2
              style={{
                margin: "6px 0 0",
                color: "#174d38",
              }}
            >
              {para(
                bugunkuSatisToplami
              )}
            </h2>
          </div>
        </div>

        <div
          style={{
            marginBottom: "14px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#174d38",
            }}
          >
            🍽️ Adisyonlar
          </h2>
        </div>

        {duzenlenenIslemId !==
          null && (
          <div
            style={{
              padding: "14px 18px",
              marginBottom: "18px",
              borderRadius: "12px",
              background: "#fff7ed",
              border:
                "1px solid #fdba74",
              color: "#9a3412",
              fontWeight: 700,
            }}
          >
            ✏️ Kayıt
            düzenliyorsun. Kaydettiğinde
            eski satışın yerine geçecek.
          </div>
        )}

        {ekran ===
          "Adisyonlar" && (
          <section
            className="adisyon-ust-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(310px, 1fr))",
              gap: "16px",
              marginBottom: "20px",
              alignItems: "start",
            }}
          >
            <div style={kartStili}>
              <h2
                style={{
                  margin: "0 0 14px",
                  color: "#174d38",
                }}
              >
                Tüm Adisyonlar
              </h2>

              <div
                className="adisyon-kart-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(135px, 1fr))",
                  gap: "9px",
                }}
              >
                {adisyonlar.map(
                  (adisyon) => {
                    const dolu =
                      adisyon.sepet.length > 0;

                    const aktif =
                      adisyon.id ===
                      aktifAdisyonId;

                    const toplam =
                      Math.max(
                        sepetToplami(
                          adisyon.sepet
                        ) -
                          Number(
                            adisyon.indirim ||
                              0
                          ),
                        0
                      );

                    return (
                      <button
                        key={adisyon.id}
                        onClick={() =>
                          setAktifAdisyonId(
                            adisyon.id
                          )
                        }
                        style={{
                          minHeight: "94px",
                          padding: "12px",
                          borderRadius: "13px",
                          textAlign: "left",
                          cursor: "pointer",
                          border: aktif
                            ? "3px solid #174d38"
                            : dolu
                              ? "2px solid #f59e0b"
                              : "1px solid #86c7a3",
                          background: aktif
                            ? "#e7f4ec"
                            : dolu
                              ? "#fffbeb"
                              : "#f0fdf4",
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            fontSize: "16px",
                          }}
                        >
                          {dolu
                            ? "🟠"
                            : "🟢"}{" "}
                          {adisyon.ad}
                        </strong>

                        <small
                          style={{
                            display: "block",
                            marginTop: "7px",
                            color: "#6b7280",
                          }}
                        >
                          {dolu
                            ? `${sepetAdedi(
                                adisyon.sepet
                              )} ürün`
                            : "Boş"}
                        </small>

                        {dolu && (
                          <strong
                            style={{
                              display: "block",
                              marginTop: "4px",
                              color: "#174d38",
                            }}
                          >
                            {para(toplam)}
                          </strong>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div
              className="dolu-adisyon-panel"
              style={{
                ...kartStili,
                position: "sticky",
                top: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: "#b45309",
                  }}
                >
                  🟠 Dolu Adisyonlar
                </h2>

                <strong
                  style={{
                    minWidth: "34px",
                    height: "34px",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "999px",
                    background: "#fff7ed",
                    color: "#b45309",
                  }}
                >
                  {doluAdisyonlar.length}
                </strong>
              </div>

              {doluAdisyonlar.length === 0 ? (
                <div
                  style={{
                    padding: "26px 14px",
                    textAlign: "center",
                    borderRadius: "13px",
                    background: "#f0fdf4",
                    color: "#15803d",
                  }}
                >
                  <strong>
                    Şu anda dolu adisyon yok.
                  </strong>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "9px",
                  }}
                >
                  {doluAdisyonlar.map(
                    (adisyon) => {
                      const toplam =
                        Math.max(
                          sepetToplami(
                            adisyon.sepet
                          ) -
                            Number(
                              adisyon.indirim ||
                                0
                            ),
                          0
                        );

                      const gecenDakika =
                        adisyon.acilisZamani
                          ? Math.max(
                              Math.floor(
                                (simdi -
                                  adisyon.acilisZamani) /
                                  60000
                              ),
                              0
                            )
                          : 0;

                      const aktif =
                        adisyon.id ===
                        aktifAdisyonId;

                      return (
                        <button
                          key={adisyon.id}
                          onClick={() =>
                            setAktifAdisyonId(
                              adisyon.id
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "13px",
                            border: aktif
                              ? "3px solid #174d38"
                              : "1px solid #f5c36b",
                            background: aktif
                              ? "#e7f4ec"
                              : "#fffbeb",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <strong
                              style={{
                                fontSize: "17px",
                              }}
                            >
                              {adisyon.ad}
                            </strong>

                            <strong
                              style={{
                                color: "#174d38",
                                fontSize: "17px",
                              }}
                            >
                              {para(toplam)}
                            </strong>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              gap: "12px",
                              marginTop: "7px",
                              color: "#6b7280",
                              fontSize: "14px",
                            }}
                          >
                            <span>
                              {sepetAdedi(
                                adisyon.sepet
                              )}{" "}
                              ürün
                            </span>

                            <span>
                              ⏱️ {gecenDakika} dk
                            </span>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </section>
        )}



        <div
          style={{
            marginBottom: "17px",
          }}
        >
          <h2
            style={{
              margin: "0 0 4px",
              color: "#174d38",
            }}
          >
            {ekran === "Adisyonlar"
              ? aktifAdisyon.ad
              : "Dükkân Satışı"}
          </h2>

          <small
            style={{
              color: "#6b7280",
            }}
          >
            {`${sepetAdedi(aktifSepet)} ürün · ${para(genelToplam)}`}
          </small>
        </div>

        <section
          className="satis-ana-grid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1.55fr) minmax(340px, .85fr)",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <div>
            <section
              style={{
                ...kartStili,
                marginBottom: "18px",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                }}
              >
                Menü
              </h2>

              <div
                className="kategori-butonlari"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom:
                    "17px",
                }}
              >
                {gorunenKategoriler.map(
                  (kategoriAdi) => (
                    <button
                      key={
                        kategoriAdi
                      }
                      onClick={() =>
                        setKategori(
                          kategoriAdi
                        )
                      }
                      style={{
                        ...butonStili,
                        background:
                          kategori ===
                          kategoriAdi
                            ? "#174d38"
                            : "#ffffff",
                        color:
                          kategori ===
                          kategoriAdi
                            ? "#ffffff"
                            : "#111827",
                      }}
                    >
                      {kategoriAdi}
                    </button>
                  )
                )}
              </div>

              <div
                className="urun-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: "11px",
                }}
              >
                {filtrelenmisUrunler.map(
                  (urun) => (
                    <button
                      key={urun.id}
                      onClick={() =>
                        uruneTikla(urun)
                      }
                      style={{
                        minHeight:
                          "125px",
                        padding: "17px",
                        borderRadius:
                          "15px",
                        textAlign:
                          "left",
                        cursor:
                          "pointer",
                        border:
                          "1px solid #d8dfdb",
                        background:
                          "#ffffff",
                        transform:
                          sonEklenenId ===
                          urun.id
                            ? "scale(.96)"
                            : "scale(1)",
                        transition:
                          "transform .18s ease",
                      }}
                    >
                      <strong
                        style={{
                          display:
                            "block",
                          minHeight:
                            "43px",
                          fontSize:
                            "17px",
                        }}
                      >
                        {urun.ad}
                      </strong>

                      <strong
                        style={{
                          color:
                            "#174d38",
                          fontSize:
                            "20px",
                        }}
                      >
                        {para(
                          Number(
                            urun.satisFiyati ||
                              0
                          )
                        )}
                      </strong>
                    </button>
                  )
                )}
              </div>
            </section>

            <section
              style={kartStili}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom:
                    "12px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  🛒 Sepet
                </h2>

                {aktifSepet.length >
                  0 && (
                  <button
                    onClick={
                      aktifSepetiTemizle
                    }
                    style={{
                      ...butonStili,
                      color:
                        "#b91c1c",
                    }}
                  >
                    Sepeti Temizle
                  </button>
                )}
              </div>

              {aktifSepet.length ===
              0 ? (
                <p
                  style={{
                    color:
                      "#6b7280",
                  }}
                >
                  Sepet boş.
                </p>
              ) : (
                aktifSepet.map(
                  (urun) => {
                    const satirToplami =
                      urun.adet *
                      (urun.birimFiyat +
                        Number(
                          urun.extra ||
                            0
                        ));

                    return (
                      <div
                        className="sepet-satir"
                        key={
                          urun.satirId
                        }
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "minmax(145px, 1fr) auto",
                          gap: "13px",
                          padding:
                            "15px 0",
                          borderBottom:
                            "1px solid #e5e7eb",
                        }}
                      >
                        <div>
                          <strong
                            style={{
                              fontSize:
                                "17px",
                            }}
                          >
                            {urun.urun}
                          </strong>

                          {urun.ekmek && (
                            <p
                              style={{
                                margin: "6px 0 0",
                                color: "#174d38",
                                fontWeight: 700,
                              }}
                            >
                              🥖 {urun.ekmek}
                            </p>
                          )}

                          <div
                            className="sepet-alan-grid"
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(2, minmax(0, 145px))",
                              gap: "10px",
                              marginTop: "9px",
                            }}
                          >
                            <div>
                              <label
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 700,
                                }}
                              >
                                Bu Satışa Özel Fiyat
                              </label>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={urun.birimFiyat}
                                onChange={(event) =>
                                  birimFiyatDegistir(
                                    urun.satirId,
                                    event.target.value
                                  )
                                }
                                style={{
                                  ...alanStili,
                                  marginTop: "5px",
                                }}
                              />
                            </div>

                            <div>
                              <label
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 700,
                                }}
                              >
                                Extra Ücret (₺)
                              </label>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={urun.extra}
                                onChange={(event) =>
                                  extraDegistir(
                                    urun.satirId,
                                    event.target.value
                                  )
                                }
                                style={{
                                  ...alanStili,
                                  marginTop: "5px",
                                }}
                              />
                            </div>
                          </div>

                          <small
                            style={{
                              display: "block",
                              marginTop: "7px",
                              color: "#6b7280",
                            }}
                          >
                            Bu fiyat yalnızca seçili satışta geçerlidir.
                          </small>
                        </div>

                        <div
                          style={{
                            textAlign:
                              "right",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "8px",
                            }}
                          >
                            <button
                              onClick={() =>
                                adetAzalt(
                                  urun.satirId
                                )
                              }
                              style={
                                butonStili
                              }
                            >
                              −
                            </button>

                            <strong>
                              {urun.adet}
                            </strong>

                            <button
                              onClick={() =>
                                adetArtir(
                                  urun.satirId
                                )
                              }
                              style={
                                butonStili
                              }
                            >
                              +
                            </button>
                          </div>

                          <strong
                            style={{
                              display:
                                "block",
                              marginTop:
                                "12px",
                              color:
                                "#174d38",
                            }}
                          >
                            {para(
                              satirToplami
                            )}
                          </strong>

                          <button
                            onClick={() =>
                              satiriSil(
                                urun.satirId
                              )
                            }
                            style={{
                              border:
                                "none",
                              background:
                                "transparent",
                              color:
                                "#b91c1c",
                              cursor:
                                "pointer",
                              marginTop:
                                "8px",
                            }}
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </section>
          </div>

          <div
            className="satis-sticky-panel"
            style={{
              position: "sticky",
              top: "18px",
            }}
          >


            <section
              style={{
                ...kartStili,
                marginBottom:
                  "17px",
              }}
            >
              <label>
                <strong>
                  İndirim
                </strong>
              </label>

              <input
                type="number"
                min="0"
                value={
                  ekran === "Adisyonlar"
                    ? aktifAdisyon.indirim
                    : sokakIndirim
                }
                onChange={(
                  event
                ) => {
                  if (
                    ekran ===
                    "Adisyonlar"
                  ) {
                    aktifAdisyonuGuncelle(
                      {
                        indirim:
                          event
                            .target
                            .value,
                      }
                    );
                  } else {
                    setSokakIndirim(
                      event.target.value
                    );
                  }
                }}
                style={{
                  ...alanStili,
                  margin:
                    "7px 0 14px",
                }}
              />

              <label>
                <strong>
                  Not
                </strong>
              </label>

              <textarea
                rows={3}
                value={
                  ekran === "Adisyonlar"
                    ? aktifAdisyon.not
                    : sokakNot
                }
                onChange={(
                  event
                ) => {
                  if (
                    ekran ===
                    "Adisyonlar"
                  ) {
                    aktifAdisyonuGuncelle(
                      {
                        not: event
                          .target
                          .value,
                      }
                    );
                  } else {
                    setSokakNot(
                      event.target.value
                    );
                  }
                }}
                style={{
                  ...alanStili,
                  marginTop:
                    "7px",
                  resize:
                    "vertical",
                }}
              />
            </section>

            <section
              style={{
                ...kartStili,
                border:
                  "2px solid #174d38",
              }}
            >
              <small
                style={{
                  color:
                    "#6b7280",
                }}
              >
                ÖDENECEK TOPLAM
              </small>

              <h1
                className="odenecek-toplam"
                style={{
                  margin:
                    "7px 0 18px",
                  color:
                    "#174d38",
                  fontSize:
                    "44px",
                }}
              >
                {para(
                  genelToplam
                )}
              </h1>

                  <div
                    className="yazdir-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap: "9px",
                      marginBottom: "16px",
                    }}
                  >
                    <button
                      onClick={() =>
                        yazdirmaPenceresiAc("Mutfak")
                      }
                      disabled={aktifSepet.length === 0}
                      style={{
                        ...butonStili,
                        minHeight: "52px",
                        opacity:
                          aktifSepet.length === 0
                            ? 0.45
                            : 1,
                      }}
                    >
                      🖨️ Mutfak Fişi
                    </button>

                    <button
                      onClick={() =>
                        yazdirmaPenceresiAc("Hesap")
                      }
                      disabled={aktifSepet.length === 0}
                      style={{
                        ...butonStili,
                        minHeight: "52px",
                        opacity:
                          aktifSepet.length === 0
                            ? 0.45
                            : 1,
                      }}
                    >
                      🧾 Hesap Yazdır
                    </button>
                  </div>

                  <div
                    style={{
                      padding: "15px",
                      marginBottom: "10px",
                      borderRadius: "14px",
                      background: "#f7f9f8",
                      border: "1px solid #d8dfdb",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        marginBottom: "10px",
                        fontSize: "16px",
                      }}
                    >
                      Ödeme nasıl alındı?
                    </strong>

                    <div
                      className="odeme-tip-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(3, minmax(0, 1fr))",
                        gap: "8px",
                      }}
                    >
                      {(
                        [
                          "Kredi Kartı",
                          "Nakit",
                          "Bölünmüş Ödeme",
                        ] as OdemeTipi[]
                      ).map((odeme) => (
                        <button
                          key={odeme}
                          onClick={() =>
                            ekran === "Adisyonlar"
                              ? adisyonOdemeDegistir(odeme)
                              : sokakOdemeDegistir(odeme)
                          }
                          style={{
                            ...butonStili,
                            minHeight: "60px",
                            padding: "8px",
                            background:
                              aktifOdemeTipi === odeme
                                ? "#174d38"
                                : "#ffffff",
                            color:
                              aktifOdemeTipi === odeme
                                ? "#ffffff"
                                : "#111827",
                            borderColor:
                              aktifOdemeTipi === odeme
                                ? "#174d38"
                                : "#d1d5db",
                          }}
                        >
                          {odeme === "Kredi Kartı"
                            ? "💳 Kart"
                            : odeme === "Nakit"
                              ? "💵 Nakit"
                              : "➗ Kart + Nakit"}
                        </button>
                      ))}
                    </div>

                    {aktifOdemeTipi === "Bölünmüş Ödeme" && (
                      <div
                        className="bolunmus-grid"
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(2, minmax(0, 1fr))",
                          gap: "10px",
                          marginTop: "12px",
                        }}
                      >
                        <div>
                          <label>
                            <strong>Nakit</strong>
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={
                              ekran === "Adisyonlar"
                                ? aktifAdisyon.nakitTutari
                                : sokakNakit
                            }
                            onChange={(event) =>
                              ekran === "Adisyonlar"
                                ? adisyonNakitDegistir(
                                    event.target.value
                                  )
                                : sokakNakitDegistir(
                                    event.target.value
                                  )
                            }
                            style={{
                              ...alanStili,
                              marginTop: "6px",
                            }}
                          />
                        </div>

                        <div>
                          <label>
                            <strong>Kart</strong>
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={
                              ekran === "Adisyonlar"
                                ? aktifAdisyon.kartTutari
                                : sokakKart
                            }
                            onChange={(event) =>
                              ekran === "Adisyonlar"
                                ? adisyonKartDegistir(
                                    event.target.value
                                  )
                                : sokakKartDegistir(
                                    event.target.value
                                  )
                            }
                            style={{
                              ...alanStili,
                              marginTop: "6px",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
              <button
                onClick={
                  kayitOnayiAc
                }
                disabled={
                  aktifSepet.length ===
                  0
                }
                style={{
                  width: "100%",
                  minHeight:
                    "62px",
                  border: "none",
                  borderRadius:
                    "12px",
                  background:
                    "#174d38",
                  color:
                    "#ffffff",
                  fontWeight: 800,
                  fontSize:
                    "17px",
                  cursor:
                    "pointer",
                  opacity:
                    aktifSepet.length ===
                    0
                      ? 0.45
                      : 1,
                }}
              >
                {duzenlenenIslemId !== null
                  ? "✏️ DEĞİŞİKLİKLERİ ONAYLA"
                  : "✅ ÖDEMEYİ TAMAMLA"}
              </button>
            </section>
          </div>
        </section>

        <section
          style={{
            ...kartStili,
            marginTop: "22px",
          }}
        >
          <details>
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 800,
                fontSize: "19px",
              }}
            >
              🧾 Son Satışlar ve
              Düzeltmeler
            </summary>

            <div
              style={{
                paddingTop:
                  "13px",
              }}
            >
              {islemler.length ===
              0 ? (
                <p>
                  Henüz satış yok.
                </p>
              ) : (
                islemler
                  .slice(0, 20)
                  .map((islem) => (
                    <div
                      key={
                        islem.islemId
                      }
                      style={{
                        padding:
                          "15px 0",
                        borderBottom:
                          "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap: "12px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div>
                          <strong>
                            {islem.adisyon
                              ? `${islem.adisyon} — `
                              : ""}
                            {
                              islem.platform
                            }
                          </strong>

                          <br />

                          <small
                            style={{
                              color:
                                "#6b7280",
                            }}
                          >
                            {
                              islem.tarih
                            }{" "}
                            ·{" "}
                            {
                              islem.odemeTipi
                            }
                          </small>
                        </div>

                        <strong
                          style={{
                            color:
                              "#174d38",
                          }}
                        >
                          {para(
                            islem.toplam
                          )}
                        </strong>
                      </div>

                      <ul>
                        {islem.urunler.map(
                          (urun) => (
                            <li
                              key={
                                urun.id
                              }
                            >
                              {
                                urun.urun
                              }{" "}
                              x
                              {
                                urun.adet
                              }
                              {urun.ekmek
                                ? ` · ${urun.ekmek}`
                                : ""}
                              {Number(
                                urun.extra ||
                                  0
                              ) > 0
                                ? ` · Extra +${para(
                                    Number(
                                      urun.extra
                                    )
                                  )}`
                                : ""}
                            </li>
                          )
                        )}
                      </ul>

                      <div
                        className="son-satis-butonlari"
                        style={{
                          display:
                            "flex",
                          gap: "9px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <button
                          onClick={() =>
                            satisiDuzenle(
                              islem.islemId
                            )
                          }
                          style={
                            butonStili
                          }
                        >
                          ✏️ Düzenle
                        </button>

                        <button
                          onClick={() =>
                            satisiIptalEt(
                              islem.islemId
                            )
                          }
                          style={{
                            ...butonStili,
                            color:
                              "#b91c1c",
                            borderColor:
                              "#fecaca",
                          }}
                        >
                          🗑️ İptal Et
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </details>
        </section>
      </div>

      {secilenUrun && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "grid",
            placeItems: "center",
            padding: "18px",
            background: "rgba(10,30,22,.52)",
          }}
        >
          <div
            style={{
              width: "min(470px, 100%)",
              padding: "25px",
              borderRadius: "20px",
              background: "#ffffff",
              boxShadow: "0 25px 70px rgba(0,0,0,.28)",
            }}
          >
            <h2 style={{ margin: "0 0 6px", color: "#174d38" }}>
              {secilenUrun.ad}
            </h2>

            <p style={{ margin: "0 0 13px", color: "#6b7280" }}>
              Menü fiyatı: {para(Number(secilenUrun.satisFiyati || 0))}
            </p>

            <div style={{ marginBottom: "17px" }}>
              <label>
                <strong>Bu Satışa Özel Fiyat (₺)</strong>
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={secimFiyat}
                onChange={(event) =>
                  setSecimFiyat(event.target.value)
                }
                style={{
                  ...alanStili,
                  marginTop: "7px",
                }}
              />

              <small
                style={{
                  display: "block",
                  marginTop: "6px",
                  color: "#6b7280",
                }}
              >
                İndirim veya özel fiyat girebilirsin; menü fiyatı değişmez.
              </small>
            </div>

            {secilenUrun.kategori === "Sandviç" && (
              <div style={{ marginBottom: "18px" }}>
                <strong>Ekmek Seçimi</strong>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "9px",
                    marginTop: "9px",
                  }}
                >
                  {(["Beyaz Baget", "Esmer Baget"] as const).map(
                    (ekmek) => (
                      <button
                        key={ekmek}
                        onClick={() => setSecimEkmek(ekmek)}
                        style={{
                          ...butonStili,
                          minHeight: "55px",
                          background:
                            secimEkmek === ekmek ? "#174d38" : "#ffffff",
                          color:
                            secimEkmek === ekmek ? "#ffffff" : "#111827",
                        }}
                      >
                        🥖 {ekmek}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div>
                <label><strong>Adet</strong></label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    marginTop: "7px",
                  }}
                >
                  <button
                    onClick={() => setSecimAdet((adet) => Math.max(adet - 1, 1))}
                    style={butonStili}
                  >
                    −
                  </button>
                  <strong style={{ minWidth: "30px", textAlign: "center" }}>
                    {secimAdet}
                  </strong>
                  <button
                    onClick={() => setSecimAdet((adet) => adet + 1)}
                    style={butonStili}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label><strong>Extra Tutar (₺)</strong></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={secimExtra}
                  onChange={(event) => setSecimExtra(event.target.value)}
                  style={{ ...alanStili, marginTop: "7px" }}
                />
              </div>
            </div>

            <div
              style={{
                padding: "14px",
                marginBottom: "18px",
                borderRadius: "12px",
                background: "#f7f9f8",
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <span>Satır toplamı</span>
              <strong style={{ color: "#174d38" }}>
                {para(
                  secimAdet *
                    (Math.max(
                      Number(secimFiyat || secilenUrun.satisFiyati || 0),
                      0
                    ) +
                      Math.max(Number(secimExtra || 0), 0))
                )}
              </strong>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setSecilenUrun(null)}
                style={{ ...butonStili, minHeight: "53px" }}
              >
                Vazgeç
              </button>

              <button
                onClick={secimiSepeteEkle}
                style={{
                  minHeight: "53px",
                  border: "none",
                  borderRadius: "11px",
                  background: "#174d38",
                  color: "#ffffff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                ➕ Sepete Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {bekleyenKayit && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            padding: "18px",
            background:
              "rgba(10,30,22,.52)",
          }}
        >
          <div
            style={{
              width:
                "min(520px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "25px",
              borderRadius:
                "20px",
              background:
                "#ffffff",
              boxShadow:
                "0 25px 70px rgba(0,0,0,.28)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color:
                  "#174d38",
              }}
            >
              Ödeme Özeti
            </h2>

            <p>
              <strong>
                {
                  bekleyenKayit.baslik
                }
              </strong>
            </p>

            <p>
              Platform:{" "}
              <strong>
                {
                  bekleyenKayit.platform
                }
              </strong>
            </p>

            <p>
              Ödeme:{" "}
              <strong>
                {
                  bekleyenKayit.odemeTipi
                }
              </strong>
            </p>

            <div
              style={{
                borderTop:
                  "1px solid #e5e7eb",
                borderBottom:
                  "1px solid #e5e7eb",
                padding:
                  "10px 0",
                margin:
                  "15px 0",
              }}
            >
              {bekleyenKayit.sepet.map(
                (urun) => (
                  <div
                    key={
                      urun.satirId
                    }
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap: "12px",
                      padding:
                        "8px 0",
                    }}
                  >
                    <span>
                      {urun.urun} x
                      {urun.adet}
                      {urun.ekmek
                        ? ` · ${urun.ekmek}`
                        : ""}
                      {Number(
                        urun.extra ||
                          0
                      ) > 0
                        ? ` · Extra +${para(
                            urun.extra
                          )}`
                        : ""}
                    </span>

                    <strong>
                      {para(
                        urun.adet *
                          (urun.birimFiyat +
                            Number(
                              urun.extra ||
                                0
                            ))
                      )}
                    </strong>
                  </div>
                )
              )}
            </div>

            {bekleyenKayit.indirim >
              0 && (
              <p>
                İndirim:{" "}
                <strong>
                  -
                  {para(
                    bekleyenKayit.indirim
                  )}
                </strong>
              </p>
            )}

            <h1
              style={{
                color:
                  "#174d38",
              }}
            >
              {para(
                bekleyenKayit.toplam
              )}
            </h1>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "10px",
              }}
            >
              <button
                onClick={() =>
                  setBekleyenKayit(
                    null
                  )
                }
                disabled={kaydediliyor}
                style={{
                  ...butonStili,
                  minHeight:
                    "53px",
                  opacity:
                    kaydediliyor
                      ? 0.6
                      : 1,
                }}
              >
                ← Geri Dön
              </button>

              <button
                onClick={
                  kaydiTamamla
                }
                disabled={kaydediliyor}
                style={{
                  minHeight:
                    "53px",
                  border: "none",
                  borderRadius:
                    "11px",
                  background:
                    "#174d38",
                  color:
                    "#ffffff",
                  fontWeight: 800,
                  cursor:
                    kaydediliyor
                      ? "wait"
                      : "pointer",
                  opacity:
                    kaydediliyor
                      ? 0.75
                      : 1,
                }}
              >
                {kaydediliyor
                  ? "KAYDEDİLİYOR..."
                  : "✅ ÖDEMEYİ TAMAMLA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mesaj && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: "25px",
            transform:
              "translateX(-50%)",
            zIndex: 9999,
            padding:
              "15px 22px",
            borderRadius:
              "13px",
            background:
              "#174d38",
            color: "#ffffff",
            fontWeight: 800,
            boxShadow:
              "0 12px 30px rgba(0,0,0,.2)",
          }}
        >
          ✅ {mesaj}
        </div>
      )}
      </fieldset>
    </main>
  );
}
