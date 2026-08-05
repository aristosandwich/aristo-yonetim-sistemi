"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import Header from "../ui/Header";
import { receteler } from "../data/receteler";

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

export default function Urunler() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);
  const [arama, setArama] = useState("");
  const [kategori, setKategori] = useState<TopluKategori>("Tümü");
  const [mesaj, setMesaj] = useState("");

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
    try {
      const kayitliUrunler: Urun[] = JSON.parse(
        localStorage.getItem("aristo-urunler") || "[]"
      );

      const birlestirilmisUrunler = varsayilanUrunler.map(
        (varsayilanUrun) => {
          const kayitliUrun = kayitliUrunler.find(
            (urun) => urun.id === varsayilanUrun.id
          );

          if (!kayitliUrun) {
            return varsayilanUrun;
          }

          return {
            ...varsayilanUrun,
            satisFiyati: Number(
              kayitliUrun.satisFiyati ??
                varsayilanUrun.satisFiyati
            ),
            aktif:
              kayitliUrun.aktif ??
              varsayilanUrun.aktif,
          };
        }
      );

      setUrunler(birlestirilmisUrunler);

      localStorage.setItem(
        "aristo-urunler",
        JSON.stringify(birlestirilmisUrunler)
      );
    } catch {
      setUrunler(varsayilanUrunler);
    }

    try {
      const kayitliMalzemeler: Malzeme[] = JSON.parse(
        localStorage.getItem("aristo-malzemeler") || "[]"
      );

      setMalzemeler(
        Array.isArray(kayitliMalzemeler)
          ? kayitliMalzemeler
          : []
      );
    } catch {
      setMalzemeler([]);
    }
  }, []);

  function bildirimGoster(metin: string) {
    setMesaj(metin);

    window.setTimeout(() => {
      setMesaj("");
    }, 1800);
  }

  function urunleriKaydet(
    yeniListe: Urun[],
    bildirim = true
  ) {
    setUrunler(yeniListe);

    localStorage.setItem(
      "aristo-urunler",
      JSON.stringify(yeniListe)
    );

    window.dispatchEvent(new Event("storage"));

    if (bildirim) {
      bildirimGoster("Ürün fiyatları kaydedildi.");
    }
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
      "Ürünler ilk menü fiyatlarına dönsün mü?"
    );

    if (!onay) return;

    urunleriKaydet(varsayilanUrunler);
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
    if (Number(degisimMiktari || 0) <= 0) {
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
          Tek tek veya toplu şekilde zam ve indirim uygula.
        </p>

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
                ✅ Onayla ve Uygula
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
            bottom: "24px",
            transform:
              "translateX(-50%)",
            zIndex: 9999,
            padding: "14px 20px",
            borderRadius: "12px",
            background: "#174d38",
            color: "#ffffff",
            fontWeight: 800,
            boxShadow:
              "0 12px 30px rgba(0,0,0,0.2)",
          }}
        >
          ✅ {mesaj}
        </div>
      )}
    </main>
  );
}