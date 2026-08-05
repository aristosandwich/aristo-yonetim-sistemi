"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { receteler } from "../data/receteler";
import Header from "../ui/Header";

type Urun = {
  id: number;
  ad: string;
  kategori: string;
  satisFiyati: number;
  aktif: boolean;
};

type Malzeme = {
  id: number;
  ad: string;
  birimFiyat: number;
  kalori100Gr: number;
};

type HesapSatiri = {
  malzeme: string;
  gram: number;
  maliyet: number;
  kalori: number;
};

type HesapSonucu = {
  urun: Urun;
  satirlar: HesapSatiri[];
  maliyet: number;
  kalori: number;
};

function para(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(tutar);
}

function yuzde(deger: number) {
  return `%${deger.toFixed(1)}`;
}

export default function Maliyet() {
  const [urunler, setUrunler] =
    useState<Urun[]>([]);

  const [malzemeler, setMalzemeler] =
    useState<Malzeme[]>([]);

  const [secilenUrun, setSecilenUrun] =
    useState("");

  useEffect(() => {
    try {
      const kayitliUrunler: Urun[] =
        JSON.parse(
          localStorage.getItem(
            "aristo-urunler"
          ) || "[]"
        );

      const kayitliMalzemeler: Malzeme[] =
        JSON.parse(
          localStorage.getItem(
            "aristo-malzemeler"
          ) || "[]"
        );

      const urunListesi =
        Array.isArray(kayitliUrunler)
          ? kayitliUrunler
          : [];

      const malzemeListesi =
        Array.isArray(
          kayitliMalzemeler
        )
          ? kayitliMalzemeler
          : [];

      setUrunler(urunListesi);
      setMalzemeler(
        malzemeListesi
      );

      if (urunListesi.length > 0) {
        setSecilenUrun(
          urunListesi[0].ad
        );
      }
    } catch {
      setUrunler([]);
      setMalzemeler([]);
    }
  }, []);

  const hesap = useMemo<
    HesapSonucu | null
  >(() => {
    const urun = urunler.find(
      (kayit) =>
        kayit.ad === secilenUrun
    );

    if (!urun) {
      return null;
    }

    const recete = receteler.find(
      (kayit) =>
        kayit.urun === urun.ad
    );

    if (!recete) {
      return {
        urun,
        satirlar: [],
        maliyet: 0,
        kalori: 0,
      };
    }

    let toplamMaliyet = 0;
    let toplamKalori = 0;

    const satirlar =
      recete.malzemeler.map(
        (satir) => {
          const malzeme =
            malzemeler.find(
              (kayit) =>
                kayit.ad ===
                satir.malzeme
            );

          const maliyet = malzeme
            ? (Number(
                malzeme.birimFiyat ||
                  0
              ) /
                1000) *
              Number(satir.gram || 0)
            : 0;

          const kalori = malzeme
            ? (Number(
                malzeme.kalori100Gr ||
                  0
              ) /
                100) *
              Number(satir.gram || 0)
            : 0;

          toplamMaliyet += maliyet;
          toplamKalori += kalori;

          return {
            ...satir,
            maliyet,
            kalori,
          };
        }
      );

    return {
      urun,
      satirlar,
      maliyet: toplamMaliyet,
      kalori: toplamKalori,
    };
  }, [
    urunler,
    malzemeler,
    secilenUrun,
  ]);

  const kartStili: CSSProperties = {
    border: "1px solid #e2e8e4",
    borderRadius: "17px",
    padding: "19px",
    background: "#ffffff",
    boxShadow:
      "0 8px 22px rgba(23,77,56,0.07)",
  };

  const tabloHucreStili: CSSProperties = {
    borderBottom:
      "1px solid #e5e7eb",
    padding: "13px 11px",
    textAlign: "left",
  };

  if (urunler.length === 0) {
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
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          <Header />

          <section
            style={{
              ...kartStili,
              textAlign: "center",
              padding: "40px 20px",
            }}
          >
            <h1>
              💰 Maliyet ve Kârlılık
            </h1>

            <p
              style={{
                color: "#6b7280",
              }}
            >
              Henüz ürün kaydı yok.
              Önce ürünlerini eklemelisin.
            </p>

            <Link
              href="/urunler"
              style={{
                display:
                  "inline-block",
                marginTop: "10px",
                padding:
                  "13px 18px",
                borderRadius: "11px",
                background: "#174d38",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 800,
              }}
            >
              Ürünlere Git
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (!hesap) {
    return null;
  }

  const satisFiyati = Number(
    hesap.urun.satisFiyati || 0
  );

  const maliyet = Number(
    hesap.maliyet || 0
  );

  const kar = satisFiyati - maliyet;

  const karMarji =
    satisFiyati > 0
      ? (kar / satisFiyati) * 100
      : 0;

  const maliyetOrani =
    satisFiyati > 0
      ? (maliyet / satisFiyati) *
        100
      : 0;

  const maliyetCarpani =
    maliyet > 0
      ? satisFiyati / maliyet
      : 0;

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
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <Header />

        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <h1
            style={{
              margin: "0 0 7px",
              color: "#153f30",
              fontSize:
                "clamp(30px, 5vw, 42px)",
            }}
          >
            💰 Maliyet ve Kârlılık
          </h1>

          <p
            style={{
              margin: 0,
              color: "#66736c",
              lineHeight: 1.5,
            }}
          >
            Ürünün satış fiyatını,
            reçete maliyetini, brüt
            kârını ve kâr yüzdesini
            incele.
          </p>
        </div>

        <section
          style={{
            ...kartStili,
            marginBottom: "18px",
          }}
        >
          <label
            htmlFor="urun-secimi"
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#374151",
              fontWeight: 800,
            }}
          >
            Ürün Seç
          </label>

          <select
            id="urun-secimi"
            value={secilenUrun}
            onChange={(event) =>
              setSecilenUrun(
                event.target.value
              )
            }
            style={{
              width: "100%",
              padding: "13px 14px",
              border:
                "1px solid #d1d5db",
              borderRadius: "11px",
              background: "#ffffff",
              fontSize: "17px",
              fontWeight: 800,
              boxSizing: "border-box",
            }}
          >
            {urunler.map((urun) => (
              <option
                key={urun.id}
                value={urun.ad}
              >
                {urun.ad}
                {!urun.aktif
                  ? " — Pasif"
                  : ""}
              </option>
            ))}
          </select>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(165px, 1fr))",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <Kart
            baslik="SATIŞ FİYATI"
            deger={para(satisFiyati)}
            renk="#111827"
          />

          <Kart
            baslik="ÜRÜN MALİYETİ"
            deger={para(maliyet)}
            renk="#b45309"
          />

          <Kart
            baslik="BRÜT KÂR"
            deger={para(kar)}
            renk={
              kar >= 0
                ? "#15803d"
                : "#b91c1c"
            }
          />

          <Kart
            baslik="KÂR MARJI"
            deger={yuzde(karMarji)}
            renk={
              karMarji >= 60
                ? "#15803d"
                : karMarji >= 40
                  ? "#b45309"
                  : "#b91c1c"
            }
          />

          <Kart
            baslik="MALİYET ORANI"
            deger={yuzde(
              maliyetOrani
            )}
            renk="#294b8f"
          />

          <Kart
            baslik="SATIŞ / MALİYET"
            deger={
              maliyetCarpani > 0
                ? `${maliyetCarpani.toFixed(
                    2
                  )} kat`
                : "-"
            }
            renk="#294b8f"
          />

          <Kart
            baslik="KALORİ"
            deger={`${hesap.kalori.toFixed(
              0
            )} kcal`}
            renk="#374151"
          />
        </section>

        <section
          style={{
            ...kartStili,
            marginBottom: "18px",
            background:
              karMarji >= 60
                ? "#f0fdf4"
                : karMarji >= 40
                  ? "#fffbeb"
                  : "#fef2f2",
            borderColor:
              karMarji >= 60
                ? "#86efac"
                : karMarji >= 40
                  ? "#fde68a"
                  : "#fecaca",
          }}
        >
          <strong
            style={{
              display: "block",
              marginBottom: "7px",
              fontSize: "18px",
              color:
                karMarji >= 60
                  ? "#166534"
                  : karMarji >= 40
                    ? "#92400e"
                    : "#991b1b",
            }}
          >
            {karMarji >= 60
              ? "✅ Kâr marjı güçlü"
              : karMarji >= 40
                ? "⚠️ Kâr marjı orta seviyede"
                : "❗ Kâr marjı düşük"}
          </strong>

          <span
            style={{
              color: "#4b5563",
              lineHeight: 1.55,
            }}
          >
            Her {para(satisFiyati)}
            satışın yaklaşık{" "}
            <strong>{para(maliyet)}</strong>
            ’si ürün maliyeti,{" "}
            <strong>{para(kar)}</strong>
            ’si brüt kârdır. Bu hesap
            kira, personel, komisyon,
            vergi ve diğer işletme
            giderlerini içermez.
          </span>
        </section>

        <section style={kartStili}>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "14px",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#174d38",
              }}
            >
              📋 Reçete Detayı
            </h2>

            <strong
              style={{
                color: "#174d38",
              }}
            >
              Toplam: {para(maliyet)}
            </strong>
          </div>

          {hesap.satirlar.length ===
          0 ? (
            <div
              style={{
                padding: "22px",
                borderRadius: "12px",
                background: "#fff7ed",
                color: "#9a3412",
              }}
            >
              Bu ürün için reçete
              bulunamadı.
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "620px",
                  borderCollapse:
                    "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        "#edf7f1",
                      color: "#174d38",
                    }}
                  >
                    <th
                      style={
                        tabloHucreStili
                      }
                    >
                      Malzeme
                    </th>

                    <th
                      style={
                        tabloHucreStili
                      }
                    >
                      Gram
                    </th>

                    <th
                      style={
                        tabloHucreStili
                      }
                    >
                      Maliyet
                    </th>

                    <th
                      style={
                        tabloHucreStili
                      }
                    >
                      Maliyet Payı
                    </th>

                    <th
                      style={
                        tabloHucreStili
                      }
                    >
                      Kalori
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {hesap.satirlar.map(
                    (satir, index) => {
                      const maliyetPayi =
                        maliyet > 0
                          ? (satir.maliyet /
                              maliyet) *
                            100
                          : 0;

                      return (
                        <tr
                          key={`${satir.malzeme}-${index}`}
                        >
                          <td
                            style={
                              tabloHucreStili
                            }
                          >
                            <strong>
                              {
                                satir.malzeme
                              }
                            </strong>
                          </td>

                          <td
                            style={
                              tabloHucreStili
                            }
                          >
                            {satir.gram} g
                          </td>

                          <td
                            style={
                              tabloHucreStili
                            }
                          >
                            {para(
                              satir.maliyet
                            )}
                          </td>

                          <td
                            style={
                              tabloHucreStili
                            }
                          >
                            {yuzde(
                              maliyetPayi
                            )}
                          </td>

                          <td
                            style={
                              tabloHucreStili
                            }
                          >
                            {satir.kalori.toFixed(
                              0
                            )}{" "}
                            kcal
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>

                <tfoot>
                  <tr
                    style={{
                      background:
                        "#f8faf9",
                    }}
                  >
                    <td
                      style={
                        tabloHucreStili
                      }
                    >
                      <strong>
                        TOPLAM
                      </strong>
                    </td>

                    <td
                      style={
                        tabloHucreStili
                      }
                    >
                      <strong>
                        {hesap.satirlar.reduce(
                          (
                            toplam,
                            satir
                          ) =>
                            toplam +
                            Number(
                              satir.gram ||
                                0
                            ),
                          0
                        )}{" "}
                        g
                      </strong>
                    </td>

                    <td
                      style={
                        tabloHucreStili
                      }
                    >
                      <strong>
                        {para(maliyet)}
                      </strong>
                    </td>

                    <td
                      style={
                        tabloHucreStili
                      }
                    >
                      <strong>
                        %100
                      </strong>
                    </td>

                    <td
                      style={
                        tabloHucreStili
                      }
                    >
                      <strong>
                        {hesap.kalori.toFixed(
                          0
                        )}{" "}
                        kcal
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Kart({
  baslik,
  deger,
  renk,
}: {
  baslik: string;
  deger: string;
  renk: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e2e8e4",
        borderRadius: "16px",
        padding: "18px",
        background: "#ffffff",
        boxShadow:
          "0 7px 19px rgba(23,77,56,0.06)",
      }}
    >
      <small
        style={{
          display: "block",
          color: "#6b7280",
          fontWeight: 800,
          marginBottom: "9px",
          lineHeight: 1.35,
        }}
      >
        {baslik}
      </small>

      <h2
        style={{
          margin: 0,
          color: renk,
          fontSize: "25px",
        }}
      >
        {deger}
      </h2>
    </div>
  );
}