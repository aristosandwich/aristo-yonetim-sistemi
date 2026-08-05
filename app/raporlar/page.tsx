"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import Header from "../ui/Header";

type TarihliKayit = {
  id?: number | string;
  islemId?: number | string;
  tarih?: string;
};

type SatisKaydi = TarihliKayit & {
  adisyon?: string;
  urun?: string;
  kategori?: string;
  platform?: string;
  odemeTipi?: string;
  adet?: number;
  toplam?: number;
  nakitTutari?: number;
  kartTutari?: number;
  onlineTutari?: number;
};

type GiderKaydi = TarihliKayit & {
  kategori?: string;
  aciklama?: string;
  odemeTipi?: "Nakit" | "Kart" | "Banka";
  tutar?: number;
};

type TahsilatKaydi = TarihliKayit & {
  platform?: string;
  donem?: string;
  tutar?: number;
};

type Donem =
  | "Bugün"
  | "Dün"
  | "Son 7 Gün"
  | "Bu Ay"
  | "Tarih Seç"
  | "Tarih Aralığı"
  | "Tümü";

function depodanOku<T>(anahtar: string): T[] {
  try {
    const veri = JSON.parse(
      localStorage.getItem(anahtar) || "[]"
    );

    return Array.isArray(veri)
      ? (veri as T[])
      : [];
  } catch {
    return [];
  }
}

function kayitTarihi(kayit: TarihliKayit) {
  const deger =
    kayit.islemId ??
    kayit.id ??
    kayit.tarih;

  if (
    deger === undefined ||
    deger === null
  ) {
    return null;
  }

  const tarih = new Date(deger);

  return Number.isNaN(tarih.getTime())
    ? null
    : tarih;
}

function ayniGunMu(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function yerelTarihMetni(tarih: Date) {
  const yil = tarih.getFullYear();
  const ay = String(
    tarih.getMonth() + 1
  ).padStart(2, "0");
  const gun = String(
    tarih.getDate()
  ).padStart(2, "0");

  return `${yil}-${ay}-${gun}`;
}

function secilenTarihiOlustur(
  tarihMetni: string
) {
  if (!tarihMetni) {
    return null;
  }

  const [yil, ay, gun] = tarihMetni
    .split("-")
    .map(Number);

  if (!yil || !ay || !gun) {
    return null;
  }

  return new Date(yil, ay - 1, gun);
}

function donemeUygunMu(
  kayit: TarihliKayit,
  donem: Donem,
  seciliTarih: string,
  baslangicTarihi: string,
  bitisTarihi: string
) {
  if (donem === "Tümü") {
    return true;
  }

  const tarih = kayitTarihi(kayit);

  if (!tarih) {
    return false;
  }

  const bugun = new Date();

  if (donem === "Bugün") {
    return ayniGunMu(tarih, bugun);
  }

  if (donem === "Dün") {
    const dun = new Date(bugun);
    dun.setDate(dun.getDate() - 1);
    return ayniGunMu(tarih, dun);
  }

  if (donem === "Tarih Seç") {
    const secilen =
      secilenTarihiOlustur(seciliTarih);

    if (!secilen) {
      return false;
    }

    return ayniGunMu(tarih, secilen);
  }

  if (donem === "Tarih Aralığı") {
    const baslangic =
      secilenTarihiOlustur(
        baslangicTarihi
      );

    const bitis =
      secilenTarihiOlustur(
        bitisTarihi
      );

    if (!baslangic || !bitis) {
      return false;
    }

    baslangic.setHours(
      0,
      0,
      0,
      0
    );

    bitis.setHours(
      23,
      59,
      59,
      999
    );

    return (
      tarih >= baslangic &&
      tarih <= bitis
    );
  }

  if (donem === "Bu Ay") {
    return (
      tarih.getMonth() ===
        bugun.getMonth() &&
      tarih.getFullYear() ===
        bugun.getFullYear()
    );
  }

  const baslangic = new Date();
  baslangic.setHours(0, 0, 0, 0);
  baslangic.setDate(
    baslangic.getDate() - 6
  );

  return tarih >= baslangic;
}

function platformSatisKaydiMi(
  platform?: string
) {
  return [
    "Getir",
    "GetirYemek",
    "Trendyol",
    "Trendyol / Uber",
    "Uber",
    "Uber Eats",
    "Yemeksepeti",
  ].includes(platform || "");
}

function para(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(tutar);
}

function tarihBasligi(
  tarihMetni: string
) {
  const tarih =
    secilenTarihiOlustur(tarihMetni);

  if (!tarih) {
    return "Tarih seçilmedi";
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(tarih);
}


function saatEtiketi(saat: number) {
  return `${String(saat).padStart(2, "0")}:00`;
}

function yuzde(deger: number, toplam: number) {
  if (toplam <= 0) {
    return 0;
  }

  return (deger / toplam) * 100;
}

function raporBasligi(
  donem: Donem,
  seciliTarih: string,
  baslangicTarihi: string,
  bitisTarihi: string
) {
  if (donem === "Tarih Seç") {
    return tarihBasligi(
      seciliTarih
    );
  }

  if (
    donem === "Tarih Aralığı"
  ) {
    if (
      !baslangicTarihi ||
      !bitisTarihi
    ) {
      return "Tarih aralığı seçilmedi";
    }

    return `${tarihBasligi(
      baslangicTarihi
    )} – ${tarihBasligi(
      bitisTarihi
    )}`;
  }

  return donem;
}

export default function Raporlar() {
  const [satislar, setSatislar] =
    useState<SatisKaydi[]>([]);

  const [giderler, setGiderler] =
    useState<GiderKaydi[]>([]);

  const [tahsilatlar, setTahsilatlar] =
    useState<TahsilatKaydi[]>([]);

  const [donem, setDonem] =
    useState<Donem>("Bugün");

  const [seciliTarih, setSeciliTarih] =
    useState(() =>
      yerelTarihMetni(new Date())
    );

  const [
    baslangicTarihi,
    setBaslangicTarihi,
  ] = useState(() => {
    const tarih = new Date();

    tarih.setDate(
      tarih.getDate() - 6
    );

    return yerelTarihMetni(tarih);
  });

  const [bitisTarihi, setBitisTarihi] =
    useState(() =>
      yerelTarihMetni(new Date())
    );

  useEffect(() => {
    function verileriYukle() {
      setSatislar(
        depodanOku<SatisKaydi>(
          "aristo-satislar"
        )
      );

      setGiderler(
        depodanOku<GiderKaydi>(
          "aristo-giderler"
        ).map((kayit) => ({
          ...kayit,
          odemeTipi:
            kayit.odemeTipi ||
            "Nakit",
        }))
      );

      setTahsilatlar(
        depodanOku<TahsilatKaydi>(
          "aristo-tahsilatlar"
        )
      );
    }

    verileriYukle();

    window.addEventListener(
      "focus",
      verileriYukle
    );

    window.addEventListener(
      "storage",
      verileriYukle
    );

    return () => {
      window.removeEventListener(
        "focus",
        verileriYukle
      );

      window.removeEventListener(
        "storage",
        verileriYukle
      );
    };
  }, []);

  const filtreliDukkanSatislari =
    useMemo(
      () =>
        satislar.filter(
          (kayit) =>
            !platformSatisKaydiMi(
              kayit.platform
            ) &&
            donemeUygunMu(
              kayit,
              donem,
              seciliTarih,
              baslangicTarihi,
              bitisTarihi
            )
        ),
      [
        satislar,
        donem,
        seciliTarih,
        baslangicTarihi,
        bitisTarihi,
      ]
    );

  const satisIslemleri = useMemo(() => {
    const gruplar: Record<
      string,
      {
        kimlik: string;
        tarih: Date | null;
        adisyon: string;
        odemeTipi: string;
        toplam: number;
        urunler: string[];
      }
    > = {};

    filtreliDukkanSatislari.forEach((kayit) => {
      const kimlik = String(
        kayit.islemId ??
          kayit.id ??
          kayit.tarih ??
          Math.random()
      );

      if (!gruplar[kimlik]) {
        gruplar[kimlik] = {
          kimlik,
          tarih: kayitTarihi(kayit),
          adisyon:
            kayit.adisyon ||
            kayit.platform ||
            "Dükkân",
          odemeTipi:
            kayit.odemeTipi ||
            "Belirtilmemiş",
          toplam: 0,
          urunler: [],
        };
      }

      gruplar[kimlik].toplam +=
        Number(kayit.toplam || 0);

      gruplar[kimlik].urunler.push(
        `${Number(kayit.adet || 0)} x ${
          kayit.urun || "Ürün"
        }`
      );
    });

    return Object.values(gruplar).sort((a, b) => {
      const aZaman = a.tarih?.getTime() || 0;
      const bZaman = b.tarih?.getTime() || 0;
      return bZaman - aZaman;
    });
  }, [filtreliDukkanSatislari]);

  const satisGunleri = useMemo(() => {
    const gunler: Record<
      string,
      {
        gunAnahtari: string;
        tarih: Date;
        satislar: typeof satisIslemleri;
        toplam: number;
        nakit: number;
        kart: number;
        diger: number;
      }
    > = {};

    satisIslemleri.forEach((islem) => {
      const tarih = islem.tarih || new Date(0);
      const gunAnahtari = yerelTarihMetni(tarih);

      if (!gunler[gunAnahtari]) {
        gunler[gunAnahtari] = {
          gunAnahtari,
          tarih: new Date(
            tarih.getFullYear(),
            tarih.getMonth(),
            tarih.getDate()
          ),
          satislar: [],
          toplam: 0,
          nakit: 0,
          kart: 0,
          diger: 0,
        };
      }

      gunler[gunAnahtari].satislar.push(islem);
      gunler[gunAnahtari].toplam += islem.toplam;

      const odeme = islem.odemeTipi.toLocaleLowerCase("tr-TR");

      if (odeme.includes("nakit") && odeme.includes("kart")) {
        gunler[gunAnahtari].diger += islem.toplam;
      } else if (odeme.includes("nakit")) {
        gunler[gunAnahtari].nakit += islem.toplam;
      } else if (
        odeme.includes("kart") ||
        odeme.includes("kredi")
      ) {
        gunler[gunAnahtari].kart += islem.toplam;
      } else {
        gunler[gunAnahtari].diger += islem.toplam;
      }
    });

    return Object.values(gunler)
      .map((gun) => ({
        ...gun,
        satislar: [...gun.satislar].sort((a, b) => {
          const aZaman = a.tarih?.getTime() || 0;
          const bZaman = b.tarih?.getTime() || 0;
          return aZaman - bZaman;
        }),
      }))
      .sort((a, b) => b.tarih.getTime() - a.tarih.getTime());
  }, [satisIslemleri]);

  const filtreliGiderler =
    useMemo(
      () =>
        giderler.filter((kayit) =>
          donemeUygunMu(
            kayit,
            donem,
            seciliTarih,
            baslangicTarihi,
            bitisTarihi
          )
        ),
      [
        giderler,
        donem,
        seciliTarih,
        baslangicTarihi,
        bitisTarihi,
      ]
    );

  const filtreliTahsilatlar =
    useMemo(
      () =>
        tahsilatlar.filter(
          (kayit) =>
            donemeUygunMu(
              kayit,
              donem,
              seciliTarih,
              baslangicTarihi,
              bitisTarihi
            )
        ),
      [
        tahsilatlar,
        donem,
        seciliTarih,
        baslangicTarihi,
        bitisTarihi,
      ]
    );

  const dukkanSatisToplami =
    filtreliDukkanSatislari.reduce(
      (toplam, kayit) =>
        toplam +
        Number(kayit.toplam || 0),
      0
    );

  const nakitSatis =
    filtreliDukkanSatislari.reduce(
      (toplam, kayit) =>
        toplam +
        Number(
          kayit.nakitTutari || 0
        ),
      0
    );

  const kartSatis =
    filtreliDukkanSatislari.reduce(
      (toplam, kayit) =>
        toplam +
        Number(
          kayit.kartTutari || 0
        ),
      0
    );

  const platformTahsilatToplami =
    filtreliTahsilatlar.reduce(
      (toplam, kayit) =>
        toplam +
        Number(kayit.tutar || 0),
      0
    );

  const toplamParaGirisi =
    dukkanSatisToplami +
    platformTahsilatToplami;

  const toplamGider =
    filtreliGiderler.reduce(
      (toplam, kayit) =>
        toplam +
        Number(kayit.tutar || 0),
      0
    );

  const nakitGider =
    filtreliGiderler
      .filter(
        (kayit) =>
          (kayit.odemeTipi ||
            "Nakit") === "Nakit"
      )
      .reduce(
        (toplam, kayit) =>
          toplam +
          Number(kayit.tutar || 0),
        0
      );

  const kartGider =
    filtreliGiderler
      .filter(
        (kayit) =>
          kayit.odemeTipi === "Kart"
      )
      .reduce(
        (toplam, kayit) =>
          toplam +
          Number(kayit.tutar || 0),
        0
      );

  const bankaGider =
    filtreliGiderler
      .filter(
        (kayit) =>
          kayit.odemeTipi === "Banka"
      )
      .reduce(
        (toplam, kayit) =>
          toplam +
          Number(kayit.tutar || 0),
        0
      );

  const kasadaKalmasiGereken =
    nakitSatis - nakitGider;

  const bankaNeti =
    kartSatis +
    platformTahsilatToplami -
    kartGider -
    bankaGider;

  const netKalan =
    toplamParaGirisi -
    toplamGider;

  const islemSayisi = new Set(
    filtreliDukkanSatislari.map(
      (kayit) =>
        kayit.islemId ??
        kayit.id ??
        kayit.tarih
    )
  ).size;

  const ortalamaFis =
    islemSayisi > 0
      ? dukkanSatisToplami /
        islemSayisi
      : 0;

  const adisyonGruplari =
    useMemo(() => {
      const gruplar: Record<
        string,
        {
          toplam: number;
          islemKimlikleri: Set<
            string | number
          >;
        }
      > = {};

      filtreliDukkanSatislari.forEach(
        (kayit) => {
          const adisyon =
            kayit.adisyon ||
            kayit.platform ||
            "Dükkân";

          if (!gruplar[adisyon]) {
            gruplar[adisyon] = {
              toplam: 0,
              islemKimlikleri:
                new Set(),
            };
          }

          gruplar[adisyon].toplam +=
            Number(
              kayit.toplam || 0
            );

          gruplar[
            adisyon
          ].islemKimlikleri.add(
            kayit.islemId ??
              kayit.id ??
              kayit.tarih ??
              adisyon
          );
        }
      );

      return Object.entries(gruplar)
        .map(
          ([adisyon, bilgi]) => ({
            adisyon,
            toplam: bilgi.toplam,
            islemSayisi:
              bilgi
                .islemKimlikleri
                .size,
          })
        )
        .sort(
          (a, b) =>
            b.toplam - a.toplam
        );
    }, [
      filtreliDukkanSatislari,
    ]);

  const platformGruplari =
    useMemo(() => {
      const gruplar: Record<
        string,
        {
          toplam: number;
          kayitSayisi: number;
        }
      > = {};

      filtreliTahsilatlar.forEach(
        (kayit) => {
          const platform =
            kayit.platform ||
            "Belirtilmemiş";

          if (!gruplar[platform]) {
            gruplar[platform] = {
              toplam: 0,
              kayitSayisi: 0,
            };
          }

          gruplar[platform].toplam +=
            Number(
              kayit.tutar || 0
            );

          gruplar[
            platform
          ].kayitSayisi += 1;
        }
      );

      return Object.entries(gruplar)
        .map(
          ([platform, bilgi]) => ({
            platform,
            ...bilgi,
          })
        )
        .sort(
          (a, b) =>
            b.toplam - a.toplam
        );
    }, [filtreliTahsilatlar]);

  const giderGruplari =
    useMemo(() => {
      const gruplar: Record<
        string,
        {
          toplam: number;
          kayitlar: GiderKaydi[];
        }
      > = {};

      filtreliGiderler.forEach(
        (kayit) => {
          const kategori =
            kayit.kategori ||
            "Diğer";

          if (!gruplar[kategori]) {
            gruplar[kategori] = {
              toplam: 0,
              kayitlar: [],
            };
          }

          gruplar[kategori].toplam +=
            Number(
              kayit.tutar || 0
            );

          gruplar[
            kategori
          ].kayitlar.push(kayit);
        }
      );

      return Object.entries(gruplar)
        .map(
          ([kategori, bilgi]) => ({
            kategori,
            ...bilgi,
          })
        )
        .sort(
          (a, b) =>
            b.toplam - a.toplam
        );
    }, [filtreliGiderler]);

  const saatlikSatislar =
    useMemo(() => {
      const saatler = Array.from(
        { length: 24 },
        (_, saat) => ({
          saat,
          toplam: 0,
          islemSayisi: 0,
        })
      );

      const islemSaatleri: Record<
        string,
        Set<string | number>
      > = {};

      filtreliDukkanSatislari.forEach(
        (kayit) => {
          const tarih =
            kayitTarihi(kayit);

          if (!tarih) {
            return;
          }

          const saat = tarih.getHours();

          saatler[saat].toplam +=
            Number(kayit.toplam || 0);

          if (!islemSaatleri[saat]) {
            islemSaatleri[saat] =
              new Set();
          }

          islemSaatleri[saat].add(
            kayit.islemId ??
              kayit.id ??
              kayit.tarih ??
              `${saat}-${Math.random()}`
          );
        }
      );

      return saatler
        .map((kayit) => ({
          ...kayit,
          islemSayisi:
            islemSaatleri[
              kayit.saat
            ]?.size || 0,
        }))
        .filter(
          (kayit) =>
            kayit.toplam > 0 ||
            kayit.islemSayisi > 0
        );
    }, [filtreliDukkanSatislari]);

  const kategoriDagilimi =
    useMemo(() => {
      const gruplar: Record<
        string,
        {
          toplam: number;
          adet: number;
        }
      > = {};

      filtreliDukkanSatislari.forEach(
        (kayit) => {
          const kategori =
            kayit.kategori ||
            "Belirtilmemiş";

          if (!gruplar[kategori]) {
            gruplar[kategori] = {
              toplam: 0,
              adet: 0,
            };
          }

          gruplar[kategori].toplam +=
            Number(kayit.toplam || 0);

          gruplar[kategori].adet +=
            Number(kayit.adet || 0);
        }
      );

      return Object.entries(gruplar)
        .map(([kategori, bilgi]) => ({
          kategori,
          ...bilgi,
        }))
        .sort(
          (a, b) =>
            b.toplam - a.toplam
        );
    }, [filtreliDukkanSatislari]);

  const urunDagilimi =
    useMemo(() => {
      const gruplar: Record<
        string,
        {
          adet: number;
          toplam: number;
        }
      > = {};

      filtreliDukkanSatislari.forEach(
        (kayit) => {
          const urun =
            kayit.urun ||
            "Belirtilmemiş";

          if (!gruplar[urun]) {
            gruplar[urun] = {
              adet: 0,
              toplam: 0,
            };
          }

          gruplar[urun].adet +=
            Number(kayit.adet || 0);

          gruplar[urun].toplam +=
            Number(kayit.toplam || 0);
        }
      );

      return Object.entries(gruplar)
        .map(([urun, bilgi]) => ({
          urun,
          ...bilgi,
        }))
        .sort(
          (a, b) => b.adet - a.adet
        );
    }, [filtreliDukkanSatislari]);

  const odemeDagilimi = [
    {
      ad: "Nakit",
      tutar: nakitSatis,
      renk: "#15803d",
    },
    {
      ad: "Kart",
      tutar: kartSatis,
      renk: "#294b8f",
    },
  ].filter((kayit) => kayit.tutar > 0);

  const enYogunSaat =
    saatlikSatislar.length > 0
      ? [...saatlikSatislar].sort(
          (a, b) =>
            b.toplam - a.toplam
        )[0]
      : null;

  const enCokSatanUrun =
    urunDagilimi[0] || null;

  const kartStili: CSSProperties = {
    background: "#ffffff",
    border:
      "1px solid #e3e8e5",
    borderRadius: "18px",
    padding: "19px",
    boxShadow:
      "0 8px 24px rgba(23,77,56,0.07)",
  };

  const satirStili: CSSProperties = {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "14px",
    padding: "11px 0",
    borderBottom:
      "1px solid #e5e7eb",
  };

  const secimStili: CSSProperties = {
    width: "100%",
    minWidth: "190px",
    padding: "12px 14px",
    borderRadius: "11px",
    border:
      "1px solid #d1d5db",
    background: "#ffffff",
    fontWeight: 800,
    fontSize: "15px",
    boxSizing: "border-box",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f7faf8 0%, #eef4f0 100%)",
        padding:
          "28px 14px 60px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
        }}
      >
        <Header />

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "flex-end",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "22px",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 6px",
                color: "#153f30",
                fontSize:
                  "clamp(29px, 5vw, 42px)",
              }}
            >
              📅 Gün Sonu ve Raporlar
            </h1>

            <p
              style={{
                margin: 0,
                color: "#66736c",
              }}
            >
              Dükkân satışları,
              platformlardan net yatan
              para, giderler ve kalan
              tutar.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#475569",
                  fontSize: "13px",
                  fontWeight: 800,
                }}
              >
                Rapor Dönemi
              </label>

              <select
                value={donem}
                onChange={(event) =>
                  setDonem(
                    event.target
                      .value as Donem
                  )
                }
                style={secimStili}
              >
                <option>Bugün</option>
                <option>Dün</option>
                <option>Son 7 Gün</option>
                <option>Bu Ay</option>
                <option>Tarih Seç</option>
                <option>Tarih Aralığı</option>
                <option>Tümü</option>
              </select>
            </div>

            {donem ===
              "Tarih Seç" && (
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    color: "#475569",
                    fontSize: "13px",
                    fontWeight: 800,
                  }}
                >
                  Görmek İstediğin Gün
                </label>

                <input
                  type="date"
                  value={seciliTarih}
                  onChange={(event) =>
                    setSeciliTarih(
                      event.target.value
                    )
                  }
                  style={secimStili}
                />
              </div>
            )}

            {donem ===
              "Tarih Aralığı" && (
              <>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      color: "#475569",
                      fontSize: "13px",
                      fontWeight: 800,
                    }}
                  >
                    Başlangıç
                  </label>

                  <input
                    type="date"
                    value={baslangicTarihi}
                    max={bitisTarihi}
                    onChange={(event) =>
                      setBaslangicTarihi(
                        event.target.value
                      )
                    }
                    style={secimStili}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      color: "#475569",
                      fontSize: "13px",
                      fontWeight: 800,
                    }}
                  >
                    Bitiş
                  </label>

                  <input
                    type="date"
                    value={bitisTarihi}
                    min={baslangicTarihi}
                    onChange={(event) =>
                      setBitisTarihi(
                        event.target.value
                      )
                    }
                    style={secimStili}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            borderRadius: "13px",
            background: "#eef4ff",
            border:
              "1px solid #cfdcf5",
            color: "#294b8f",
            fontWeight: 800,
          }}
        >
          Gösterilen dönem:{" "}
          {raporBasligi(
            donem,
            seciliTarih,
            baslangicTarihi,
            bitisTarihi
          )}
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginBottom: "19px",
          }}
        >
          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
                fontWeight: 800,
              }}
            >
              DÜKKÂN SATIŞI
            </small>

            <h2
              style={{
                marginBottom: 0,
              }}
            >
              {para(
                dukkanSatisToplami
              )}
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
                fontWeight: 800,
              }}
            >
              PLATFORM TAHSİLATI
            </small>

            <h2
              style={{
                marginBottom: 0,
                color: "#174d38",
              }}
            >
              {para(
                platformTahsilatToplami
              )}
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
                fontWeight: 800,
              }}
            >
              TOPLAM PARA GİRİŞİ
            </small>

            <h2
              style={{
                marginBottom: 0,
              }}
            >
              {para(
                toplamParaGirisi
              )}
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
                fontWeight: 800,
              }}
            >
              TOPLAM GİDER
            </small>

            <h2
              style={{
                marginBottom: 0,
                color: "#b91c1c",
              }}
            >
              {para(toplamGider)}
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
                fontWeight: 800,
              }}
            >
              NET KALAN
            </small>

            <h2
              style={{
                marginBottom: 0,
                color:
                  netKalan >= 0
                    ? "#15803d"
                    : "#b91c1c",
              }}
            >
              {para(netKalan)}
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
                fontWeight: 800,
              }}
            >
              ORTALAMA FİŞ
            </small>

            <h2
              style={{
                marginBottom: 0,
              }}
            >
              {para(ortalamaFis)}
            </h2>
          </div>
        </section>

        <section
          style={{
            ...kartStili,
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>
                📅 Gün Gün Satışlar
              </h2>

              <small
                style={{
                  display: "block",
                  marginTop: "5px",
                  color: "#6b7280",
                }}
              >
                Her günün satışları, ödeme şekilleri ve günlük toplamı ayrı gösterilir.
              </small>
            </div>

            <strong
              style={{
                color: "#174d38",
              }}
            >
              {satisGunleri.length} gün · {satisIslemleri.length} satış
            </strong>
          </div>

          {satisGunleri.length === 0 ? (
            <BosDurum metin="Bu dönemde satış yok." />
          ) : (
            <div
              style={{
                display: "grid",
                gap: "16px",
              }}
            >
              {satisGunleri.map((gun) => (
                <details
                  key={gun.gunAnahtari}
                  open={satisGunleri.length === 1}
                  style={{
                    border: "1px solid #dbe4df",
                    borderRadius: "15px",
                    background: "#ffffff",
                    overflow: "hidden",
                  }}
                >
                  <summary
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "14px",
                      padding: "16px",
                      cursor: "pointer",
                      background: "#f4f8f5",
                      listStyle: "none",
                    }}
                  >
                    <span>
                      <strong
                        style={{
                          display: "block",
                          color: "#174d38",
                          fontSize: "18px",
                        }}
                      >
                        {new Intl.DateTimeFormat("tr-TR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          weekday: "long",
                        }).format(gun.tarih)}
                      </strong>

                      <small
                        style={{
                          display: "block",
                          marginTop: "4px",
                          color: "#6b7280",
                        }}
                      >
                        {gun.satislar.length} satış
                      </small>
                    </span>

                    <strong
                      style={{
                        color: "#174d38",
                        fontSize: "20px",
                        textAlign: "right",
                      }}
                    >
                      {para(gun.toplam)}
                    </strong>
                  </summary>

                  <div
                    style={{
                      padding: "0 16px 16px",
                    }}
                  >
                    {gun.satislar.map((islem, index) => (
                      <div
                        key={islem.kimlik}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) auto",
                          gap: "14px",
                          padding: "15px 0",
                          borderBottom:
                            index === gun.satislar.length - 1
                              ? "none"
                              : "1px solid #e5e7eb",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "9px",
                              flexWrap: "wrap",
                            }}
                          >
                            <strong
                              style={{
                                color: "#1f2937",
                                fontSize: "17px",
                              }}
                            >
                              {islem.adisyon}
                            </strong>

                            <small
                              style={{
                                color: "#6b7280",
                                fontWeight: 800,
                              }}
                            >
                              {islem.tarih
                                ? new Intl.DateTimeFormat("tr-TR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }).format(islem.tarih)
                                : "Saat yok"}
                            </small>
                          </div>

                          <div
                            style={{
                              marginTop: "7px",
                              color: "#475569",
                              lineHeight: 1.55,
                            }}
                          >
                            {islem.urunler.join(" · ")}
                          </div>
                        </div>

                        <div
                          style={{
                            minWidth: "145px",
                            textAlign: "right",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              padding: "6px 9px",
                              borderRadius: "999px",
                              background: "#eef4ff",
                              color: "#294b8f",
                              fontSize: "12px",
                              fontWeight: 800,
                            }}
                          >
                            {islem.odemeTipi}
                          </span>

                          <strong
                            style={{
                              display: "block",
                              marginTop: "8px",
                              color: "#174d38",
                              fontSize: "19px",
                            }}
                          >
                            {para(islem.toplam)}
                          </strong>
                        </div>
                      </div>
                    ))}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(145px, 1fr))",
                        gap: "9px",
                        paddingTop: "15px",
                        marginTop: "4px",
                        borderTop: "2px solid #174d38",
                      }}
                    >
                      <GunOzetKart
                        baslik="SATIŞ SAYISI"
                        deger={`${gun.satislar.length}`}
                      />

                      <GunOzetKart
                        baslik="NAKİT"
                        deger={para(gun.nakit)}
                      />

                      <GunOzetKart
                        baslik="KART"
                        deger={para(gun.kart)}
                      />

                      {gun.diger > 0 && (
                        <GunOzetKart
                          baslik="KART + NAKİT / DİĞER"
                          deger={para(gun.diger)}
                        />
                      )}

                      <GunOzetKart
                        baslik="GÜNLÜK TOPLAM"
                        deger={para(gun.toplam)}
                        vurgu
                      />
                    </div>
                  </div>
                </details>
              ))}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "14px",
                  padding: "17px",
                  borderRadius: "14px",
                  background: "#174d38",
                  color: "#ffffff",
                  fontSize: "21px",
                }}
              >
                <strong>DÖNEM TOPLAMI</strong>
                <strong>{para(dukkanSatisToplami)}</strong>
              </div>
            </div>
          )}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "14px",
            marginBottom: "18px",
          }}
        >
          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              🕒 Saatlik Satış
            </h2>

            {saatlikSatislar.length === 0 ? (
              <BosDurum metin="Bu dönemde saatlik satış verisi yok." />
            ) : (
              <CubukGrafik
                veriler={saatlikSatislar.map(
                  (kayit) => ({
                    etiket: saatEtiketi(
                      kayit.saat
                    ),
                    deger: kayit.toplam,
                    altMetin: `${kayit.islemSayisi} işlem`,
                  })
                )}
                degerYaz={para}
              />
            )}
          </div>

          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              💳 Ödeme Dağılımı
            </h2>

            {odemeDagilimi.length === 0 ? (
              <BosDurum metin="Bu dönemde ödeme verisi yok." />
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {odemeDagilimi.map((kayit) => (
                  <div key={kayit.ad}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "7px",
                      }}
                    >
                      <strong>{kayit.ad}</strong>
                      <strong>{para(kayit.tutar)}</strong>
                    </div>

                    <div
                      style={{
                        height: "14px",
                        borderRadius: "999px",
                        background: "#e5e7eb",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${yuzde(
                            kayit.tutar,
                            dukkanSatisToplami
                          )}%`,
                          height: "100%",
                          borderRadius: "999px",
                          background: kayit.renk,
                        }}
                      />
                    </div>

                    <small
                      style={{
                        display: "block",
                        marginTop: "6px",
                        color: "#6b7280",
                      }}
                    >
                      %{yuzde(
                        kayit.tutar,
                        dukkanSatisToplami
                      ).toFixed(1)}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              🥪 Kategori Dağılımı
            </h2>

            {kategoriDagilimi.length === 0 ? (
              <BosDurum metin="Bu dönemde kategori verisi yok." />
            ) : (
              <CubukGrafik
                veriler={kategoriDagilimi.map(
                  (kayit) => ({
                    etiket: kayit.kategori,
                    deger: kayit.toplam,
                    altMetin: `${kayit.adet} adet`,
                  })
                )}
                degerYaz={para}
              />
            )}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <BilgiKart
            baslik="EN YOĞUN SAAT"
            deger={
              enYogunSaat
                ? saatEtiketi(
                    enYogunSaat.saat
                  )
                : "-"
            }
            aciklama={
              enYogunSaat
                ? `${para(
                    enYogunSaat.toplam
                  )} · ${enYogunSaat.islemSayisi} işlem`
                : "Satış verisi yok"
            }
            ikon="⏱️"
          />

          <BilgiKart
            baslik="EN ÇOK SATAN ÜRÜN"
            deger={
              enCokSatanUrun
                ? enCokSatanUrun.urun
                : "-"
            }
            aciklama={
              enCokSatanUrun
                ? `${enCokSatanUrun.adet} adet · ${para(
                    enCokSatanUrun.toplam
                  )}`
                : "Satış verisi yok"
            }
            ikon="🔥"
          />

          <BilgiKart
            baslik="İŞLEM SAYISI"
            deger={String(islemSayisi)}
            aciklama={`Ortalama fiş ${para(ortalamaFis)}`}
            ikon="🧾"
          />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(270px, 1fr))",
            gap: "14px",
            marginBottom: "18px",
          }}
        >
          <div style={kartStili}>
            <h2
              style={{
                marginTop: 0,
              }}
            >
              💵 Kasa
            </h2>

            <div style={satirStili}>
              <span>Nakit satış</span>
              <strong>
                {para(nakitSatis)}
              </strong>
            </div>

            <div style={satirStili}>
              <span>Nakit gider</span>
              <strong
                style={{
                  color: "#b91c1c",
                }}
              >
                -{para(nakitGider)}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: "14px",
                paddingTop: "14px",
                fontSize: "19px",
              }}
            >
              <strong>
                Kasada kalmalı
              </strong>

              <strong
                style={{
                  color:
                    kasadaKalmasiGereken >=
                    0
                      ? "#15803d"
                      : "#b91c1c",
                }}
              >
                {para(
                  kasadaKalmasiGereken
                )}
              </strong>
            </div>
          </div>

          <div style={kartStili}>
            <h2
              style={{
                marginTop: 0,
              }}
            >
              🏦 Banka / Kart
            </h2>

            <div style={satirStili}>
              <span>Kart satış</span>
              <strong>
                {para(kartSatis)}
              </strong>
            </div>

            <div style={satirStili}>
              <span>
                Platformdan net yatan
              </span>
              <strong>
                {para(
                  platformTahsilatToplami
                )}
              </strong>
            </div>

            <div style={satirStili}>
              <span>Kart gider</span>
              <strong
                style={{
                  color: "#b91c1c",
                }}
              >
                -{para(kartGider)}
              </strong>
            </div>

            <div style={satirStili}>
              <span>Banka gider</span>
              <strong
                style={{
                  color: "#b91c1c",
                }}
              >
                -{para(bankaGider)}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: "14px",
                paddingTop: "14px",
                fontSize: "19px",
              }}
            >
              <strong>
                Banka neti
              </strong>

              <strong
                style={{
                  color:
                    bankaNeti >= 0
                      ? "#15803d"
                      : "#b91c1c",
                }}
              >
                {para(bankaNeti)}
              </strong>
            </div>
          </div>

          <div style={kartStili}>
            <h2
              style={{
                marginTop: 0,
              }}
            >
              🏪 Dükkân Satışları
            </h2>

            <div style={satirStili}>
              <span>💵 Nakit</span>
              <strong>
                {para(nakitSatis)}
              </strong>
            </div>

            <div style={satirStili}>
              <span>💳 Kart</span>
              <strong>
                {para(kartSatis)}
              </strong>
            </div>

            <div style={satirStili}>
              <span>Satış işlemi</span>
              <strong>
                {islemSayisi}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: "14px",
                paddingTop: "14px",
                fontSize: "18px",
              }}
            >
              <strong>
                Dükkân toplamı
              </strong>

              <strong
                style={{
                  color: "#174d38",
                }}
              >
                {para(
                  dukkanSatisToplami
                )}
              </strong>
            </div>
          </div>

          <div style={kartStili}>
            <h2
              style={{
                marginTop: 0,
              }}
            >
              🌐 Platform Tahsilatları
            </h2>

            {platformGruplari.length ===
            0 ? (
              <p
                style={{
                  color: "#6b7280",
                }}
              >
                Bu dönemde platform
                tahsilatı yok.
              </p>
            ) : (
              platformGruplari.map(
                (kayit) => (
                  <div
                    key={
                      kayit.platform
                    }
                    style={satirStili}
                  >
                    <span>
                      {kayit.platform}
                    </span>

                    <strong>
                      {para(
                        kayit.toplam
                      )}
                    </strong>
                  </div>
                )
              )
            )}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: "14px",
                paddingTop: "14px",
                fontSize: "18px",
              }}
            >
              <strong>
                Net yatan toplam
              </strong>

              <strong
                style={{
                  color: "#174d38",
                }}
              >
                {para(
                  platformTahsilatToplami
                )}
              </strong>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(290px, 1fr))",
            gap: "14px",
          }}
        >
          <div style={kartStili}>
            <h2
              style={{
                marginTop: 0,
              }}
            >
              🍽️ Adisyon Dağılımı
            </h2>

            {adisyonGruplari.length ===
            0 ? (
              <p
                style={{
                  color: "#6b7280",
                }}
              >
                Bu dönemde dükkân
                satışı yok.
              </p>
            ) : (
              adisyonGruplari.map(
                (grup) => (
                  <div
                    key={grup.adisyon}
                    style={satirStili}
                  >
                    <span>
                      <strong>
                        {grup.adisyon}
                      </strong>

                      <small
                        style={{
                          display:
                            "block",
                          color:
                            "#6b7280",
                          marginTop:
                            "3px",
                        }}
                      >
                        {
                          grup.islemSayisi
                        }{" "}
                        işlem
                      </small>
                    </span>

                    <strong>
                      {para(
                        grup.toplam
                      )}
                    </strong>
                  </div>
                )
              )
            )}
          </div>

          <div style={kartStili}>
            <h2
              style={{
                marginTop: 0,
              }}
            >
              💸 Gider Detayı
            </h2>

            {giderGruplari.length ===
            0 ? (
              <p
                style={{
                  color: "#6b7280",
                }}
              >
                Bu dönemde gider
                kaydı yok.
              </p>
            ) : (
              giderGruplari.map(
                (grup) => (
                  <details
                    key={
                      grup.kategori
                    }
                    style={{
                      borderBottom:
                        "1px solid #e5e7eb",
                      padding:
                        "10px 0",
                    }}
                  >
                    <summary
                      style={{
                        cursor:
                          "pointer",
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap: "12px",
                        fontWeight:
                          800,
                      }}
                    >
                      <span>
                        {
                          grup.kategori
                        }
                      </span>

                      <span>
                        {para(
                          grup.toplam
                        )}
                      </span>
                    </summary>

                    <div
                      style={{
                        paddingTop:
                          "9px",
                      }}
                    >
                      {grup.kayitlar.map(
                        (
                          kayit,
                          index
                        ) => (
                          <div
                            key={`${kayit.id ?? index}-${index}`}
                            style={{
                              padding:
                                "9px 0",
                              borderTop:
                                "1px dashed #e5e7eb",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                justifyContent:
                                  "space-between",
                                gap:
                                  "12px",
                              }}
                            >
                              <strong>
                                {para(
                                  Number(
                                    kayit.tutar ||
                                      0
                                  )
                                )}
                              </strong>

                              <span
                                style={{
                                  color:
                                    "#174d38",
                                  fontWeight:
                                    800,
                                }}
                              >
                                {kayit.odemeTipi ||
                                  "Nakit"}
                              </span>
                            </div>

                            <small
                              style={{
                                color:
                                  "#6b7280",
                              }}
                            >
                              {kayit.aciklama ||
                                "Açıklama yok"}
                            </small>
                          </div>
                        )
                      )}
                    </div>
                  </details>
                )
              )
            )}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: "12px",
                paddingTop: "15px",
                fontSize: "18px",
              }}
            >
              <strong>
                Toplam gider
              </strong>

              <strong
                style={{
                  color: "#b91c1c",
                }}
              >
                {para(toplamGider)}
              </strong>
            </div>
          </div>

          <div style={kartStili}>
            <h2
              style={{
                marginTop: 0,
              }}
            >
              📌 Final Özet
            </h2>

            <div style={satirStili}>
              <span>
                Dükkân satışları
              </span>
              <strong>
                {para(
                  dukkanSatisToplami
                )}
              </strong>
            </div>

            <div style={satirStili}>
              <span>
                Platform net tahsilatı
              </span>
              <strong>
                {para(
                  platformTahsilatToplami
                )}
              </strong>
            </div>

            <div style={satirStili}>
              <span>
                Toplam para girişi
              </span>
              <strong>
                {para(
                  toplamParaGirisi
                )}
              </strong>
            </div>

            <div style={satirStili}>
              <span>
                Toplam gider
              </span>
              <strong
                style={{
                  color: "#b91c1c",
                }}
              >
                -{para(toplamGider)}
              </strong>
            </div>

            <div style={satirStili}>
              <span>
                Kasada kalmalı
              </span>
              <strong>
                {para(
                  kasadaKalmasiGereken
                )}
              </strong>
            </div>

            <div style={satirStili}>
              <span>
                Banka neti
              </span>
              <strong>
                {para(bankaNeti)}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: "12px",
                paddingTop: "15px",
                fontSize: "20px",
              }}
            >
              <strong>
                Net kalan
              </strong>

              <strong
                style={{
                  color:
                    netKalan >= 0
                      ? "#15803d"
                      : "#b91c1c",
                }}
              >
                {para(netKalan)}
              </strong>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function CubukGrafik({
  veriler,
  degerYaz,
}: {
  veriler: {
    etiket: string;
    deger: number;
    altMetin?: string;
  }[];
  degerYaz: (deger: number) => string;
}) {
  const enYuksek = Math.max(
    ...veriler.map((kayit) => kayit.deger),
    1
  );

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {veriler.map((kayit) => (
        <div key={kayit.etiket}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "6px",
            }}
          >
            <span>
              <strong>{kayit.etiket}</strong>

              {kayit.altMetin && (
                <small
                  style={{
                    display: "block",
                    marginTop: "2px",
                    color: "#6b7280",
                  }}
                >
                  {kayit.altMetin}
                </small>
              )}
            </span>

            <strong>{degerYaz(kayit.deger)}</strong>
          </div>

          <div
            style={{
              height: "13px",
              borderRadius: "999px",
              background: "#e5e7eb",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(
                  (kayit.deger / enYuksek) *
                  100
                ).toFixed(1)}%`,
                height: "100%",
                borderRadius: "999px",
                background:
                  "linear-gradient(90deg, #174d38 0%, #3c7c61 100%)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function BilgiKart({
  baslik,
  deger,
  aciklama,
  ikon,
}: {
  baslik: string;
  deger: string;
  aciklama: string;
  ikon: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e3e8e5",
        borderRadius: "17px",
        padding: "18px",
        boxShadow:
          "0 7px 20px rgba(23,77,56,0.06)",
      }}
    >
      <small
        style={{
          display: "block",
          color: "#6b7280",
          fontWeight: 800,
          marginBottom: "8px",
        }}
      >
        {ikon} {baslik}
      </small>

      <strong
        style={{
          display: "block",
          color: "#174d38",
          fontSize: "22px",
          lineHeight: 1.25,
        }}
      >
        {deger}
      </strong>

      <span
        style={{
          display: "block",
          marginTop: "7px",
          color: "#6b7280",
          lineHeight: 1.4,
        }}
      >
        {aciklama}
      </span>
    </div>
  );
}

function GunOzetKart({
  baslik,
  deger,
  vurgu = false,
}: {
  baslik: string;
  deger: string;
  vurgu?: boolean;
}) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "11px",
        background: vurgu ? "#e8f4ed" : "#f8faf9",
        border: vurgu
          ? "1px solid #86c7a3"
          : "1px solid #e5e7eb",
      }}
    >
      <small
        style={{
          display: "block",
          color: "#6b7280",
          fontWeight: 800,
          marginBottom: "5px",
        }}
      >
        {baslik}
      </small>

      <strong
        style={{
          color: vurgu ? "#174d38" : "#1f2937",
          fontSize: vurgu ? "19px" : "17px",
        }}
      >
        {deger}
      </strong>
    </div>
  );
}

function BosDurum({ metin }: { metin: string }) {
  return (
    <div
      style={{
        padding: "20px",
        borderRadius: "12px",
        background: "#f8faf9",
        color: "#6b7280",
        textAlign: "center",
      }}
    >
      {metin}
    </div>
  );
}

