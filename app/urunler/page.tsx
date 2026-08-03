"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { receteler } from "../data/receteler";

type Kategori = "Sandviç" | "Salata" | "İçecek" | "Ek Ürün";

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
  {
    id: 1,
    ad: "Thales",
    kategori: "Sandviç",
    satisFiyati: 250,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 2,
    ad: "Pisagor",
    kategori: "Sandviç",
    satisFiyati: 250,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 3,
    ad: "Heredot",
    kategori: "Sandviç",
    satisFiyati: 300,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 4,
    ad: "Demokritos",
    kategori: "Sandviç",
    satisFiyati: 300,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 5,
    ad: "Öklid",
    kategori: "Sandviç",
    satisFiyati: 250,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 6,
    ad: "Erasmus",
    kategori: "Sandviç",
    satisFiyati: 200,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 7,
    ad: "Diyojen",
    kategori: "Sandviç",
    satisFiyati: 300,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 8,
    ad: "Aristo",
    kategori: "Sandviç",
    satisFiyati: 325,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 9,
    ad: "Spinoza",
    kategori: "Sandviç",
    satisFiyati: 350,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 10,
    ad: "Sokrates",
    kategori: "Sandviç",
    satisFiyati: 300,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 11,
    ad: "Kopernik",
    kategori: "Sandviç",
    satisFiyati: 300,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 12,
    ad: "Platon",
    kategori: "Sandviç",
    satisFiyati: 400,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 13,
    ad: "Heraklitos",
    kategori: "Sandviç",
    satisFiyati: 250,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 14,
    ad: "Ton Balıklı Salata",
    kategori: "Salata",
    satisFiyati: 400,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 15,
    ad: "Tulum Peynirli & Cevizli Salata",
    kategori: "Salata",
    satisFiyati: 400,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 16,
    ad: "Hellim Salata",
    kategori: "Salata",
    satisFiyati: 400,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 17,
    ad: "Akdeniz Salata",
    kategori: "Salata",
    satisFiyati: 400,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 18,
    ad: "Aristo Club Salata",
    kategori: "Salata",
    satisFiyati: 400,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 19,
    ad: "Portakal Suyu %100",
    kategori: "İçecek",
    satisFiyati: 125,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 20,
    ad: "Ayran",
    kategori: "İçecek",
    satisFiyati: 75,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 21,
    ad: "Coca-Cola",
    kategori: "İçecek",
    satisFiyati: 100,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 22,
    ad: "Coca-Cola Zero",
    kategori: "İçecek",
    satisFiyati: 100,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 23,
    ad: "Cappy Karışık Meyve Suyu",
    kategori: "İçecek",
    satisFiyati: 100,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 24,
    ad: "Cappy Vişne Meyve Suyu",
    kategori: "İçecek",
    satisFiyati: 100,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 25,
    ad: "Fanta",
    kategori: "İçecek",
    satisFiyati: 100,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 26,
    ad: "Sprite",
    kategori: "İçecek",
    satisFiyati: 100,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 27,
    ad: "Fuse Tea Limon",
    kategori: "İçecek",
    satisFiyati: 100,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 28,
    ad: "Fuse Tea Şeftali",
    kategori: "İçecek",
    satisFiyati: 100,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 29,
    ad: "Sade Soda",
    kategori: "İçecek",
    satisFiyati: 30,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 30,
    ad: "Su",
    kategori: "İçecek",
    satisFiyati: 20,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 31,
    ad: "Filtre Kahve",
    kategori: "İçecek",
    satisFiyati: 125,
    maliyet: 0,
    aktif: true,
  },
  {
    id: 32,
    ad: "Esmer Baget Farkı",
    kategori: "Ek Ürün",
    satisFiyati: 30,
    maliyet: 0,
    aktif: true,
  },
];

export default function Urunler() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);
  const [arama, setArama] = useState("");
  const [kategori, setKategori] = useState<"Tümü" | Kategori>(
    "Tümü"
  );

  useEffect(() => {
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
          aktif: kayitliUrun.aktif ?? varsayilanUrun.aktif,
        };
      }
    );

    setUrunler(birlestirilmisUrunler);

    localStorage.setItem(
      "aristo-urunler",
      JSON.stringify(birlestirilmisUrunler)
    );

    const kayitliMalzemeler: Malzeme[] = JSON.parse(
      localStorage.getItem("aristo-malzemeler") || "[]"
    );

    setMalzemeler(kayitliMalzemeler);
  }, []);

  function urunleriKaydet(yeniListe: Urun[]) {
    setUrunler(yeniListe);

    localStorage.setItem(
      "aristo-urunler",
      JSON.stringify(yeniListe)
    );
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

  function maliyetHesapla(urun: Urun) {
    const recete = receteler.find(
      (kayit) => kayit.urun === urun.ad
    );

    if (!recete) {
      return 0;
    }

    const kullanimAlani =
      urun.kategori === "Salata" ? "Salata" : "Sandviç";

    return recete.malzemeler.reduce((toplam, satir) => {
      const ayniIsimliMalzemeler = malzemeler.filter(
        (malzeme) => malzeme.ad === satir.malzeme
      );

      const malzeme =
        ayniIsimliMalzemeler.find(
          (kayit) =>
            kayit.kullanimAlani === kullanimAlani
        ) || ayniIsimliMalzemeler[0];

      if (!malzeme) {
        return toplam;
      }

      return (
        toplam +
        (Number(malzeme.birimFiyat || 0) / 1000) *
          Number(satir.gram || 0)
      );
    }, 0);
  }

  const hesaplananUrunler = useMemo(() => {
    return urunler.map((urun) => {
      const maliyet = maliyetHesapla(urun);
      const kar = Number(urun.satisFiyati || 0) - maliyet;

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
    const aranan = arama.trim().toLocaleLowerCase("tr-TR");

    return hesaplananUrunler.filter((urun) => {
      const kategoriUygun =
        kategori === "Tümü" || urun.kategori === kategori;

      const aramaUygun =
        !aranan ||
        urun.ad.toLocaleLowerCase("tr-TR").includes(aranan);

      return kategoriUygun && aramaUygun;
    });
  }, [hesaplananUrunler, arama, kategori]);

  const aktifUrunSayisi = urunler.filter(
    (urun) => urun.aktif
  ).length;

  const ortalamaFiyat =
    urunler.length > 0
      ? urunler.reduce(
          (toplam, urun) =>
            toplam + Number(urun.satisFiyati || 0),
          0
        ) / urunler.length
      : 0;

  const ortalamaKarOrani =
    hesaplananUrunler.length > 0
      ? hesaplananUrunler.reduce(
          (toplam, urun) => toplam + urun.karOrani,
          0
        ) / hesaplananUrunler.length
      : 0;

  const para = (tutar: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(tutar);

  const kartStili = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  };

  const alanStili = {
    width: "100%",
    padding: "11px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    boxSizing: "border-box" as const,
    background: "#ffffff",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7f5",
        padding: "30px 18px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
        <Link href="/">← Ana Sayfaya Dön</Link>

        <h1 style={{ marginBottom: "6px" }}>🧾 Ürünler</h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: "24px",
            color: "#6b7280",
          }}
        >
          Ürün fiyatlarını ve satış durumlarını yönet.
        </p>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Toplam ürün
            </small>
            <h2 style={{ marginBottom: 0 }}>
              {urunler.length}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Aktif ürün
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
            <small style={{ color: "#6b7280" }}>
              Ortalama fiyat
            </small>
            <h2 style={{ marginBottom: 0 }}>
              {para(ortalamaFiyat)}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Ortalama kâr oranı
            </small>
            <h2 style={{ marginBottom: 0 }}>
              %{ortalamaKarOrani.toFixed(1)}
            </h2>
          </div>
        </section>

        <section
          style={{
            ...kartStili,
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
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
                  event.target.value as
                    | "Tümü"
                    | Kategori
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
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                background: "#ffffff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ↩️ Menü Fiyatlarına Dön
            </button>
          </div>
        </section>

        <section style={kartStili}>
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: "900px",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={hucre}>Ürün</th>
                  <th style={hucre}>Kategori</th>
                  <th style={hucre}>Satış Fiyatı</th>
                  <th style={hucre}>Maliyet</th>
                  <th style={hucre}>Birim Kâr</th>
                  <th style={hucre}>Kâr Oranı</th>
                  <th style={hucre}>Durum</th>
                </tr>
              </thead>

              <tbody>
                {filtrelenmisUrunler.map((urun) => (
                  <tr
                    key={urun.id}
                    style={{
                      opacity: urun.aktif ? 1 : 0.5,
                    }}
                  >
                    <td style={hucre}>
                      <strong>{urun.ad}</strong>
                    </td>

                    <td style={hucre}>{urun.kategori}</td>

                    <td style={hucre}>
                      <input
                        type="number"
                        min="0"
                        value={urun.satisFiyati}
                        onChange={(event) =>
                          fiyatGuncelle(
                            urun.id,
                            Number(event.target.value)
                          )
                        }
                        style={{
                          width: "105px",
                          padding: "8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                        }}
                      />
                    </td>

                    <td style={hucre}>
                      {urun.maliyet > 0
                        ? para(urun.maliyet)
                        : "—"}
                    </td>

                    <td
                      style={{
                        ...hucre,
                        color:
                          urun.kar >= 0
                            ? "#15803d"
                            : "#b91c1c",
                        fontWeight: "bold",
                      }}
                    >
                      {para(urun.kar)}
                    </td>

                    <td
                      style={{
                        ...hucre,
                        color:
                          urun.karOrani >= 50
                            ? "#15803d"
                            : urun.karOrani >= 0
                            ? "#b45309"
                            : "#b91c1c",
                        fontWeight: "bold",
                      }}
                    >
                      %{urun.karOrani.toFixed(1)}
                    </td>

                    <td style={hucre}>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={urun.aktif}
                          onChange={(event) =>
                            aktiflikGuncelle(
                              urun.id,
                              event.target.checked
                            )
                          }
                        />

                        {urun.aktif ? "Aktif" : "Pasif"}
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtrelenmisUrunler.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#6b7280",
                padding: "25px",
              }}
            >
              Ürün bulunamadı.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

const hucre = {
  borderBottom: "1px solid #e5e7eb",
  padding: "13px 10px",
  textAlign: "left" as const,
};