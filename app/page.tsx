"use client";

import Link from "next/link";
import Header from "./ui/Header";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

const ARISTO_YESILI = "#174d38";
const CIVIT_MAVISI = "#294b8f";
const AY_CICEGI_SARISI = "#f6c945";
const YEMEKSEPETI_KIRMIZISI = "#ea004b";
const UBER_EATS_YESILI = "#06c167";

type TarihliKayit = {
  id?: number | string;
  islemId?: number | string;
  tarih?: string;
};

type SatisKaydi = TarihliKayit & {
  platform?: string;
  toplam?: number;
  adet?: number;
};

type GiderKaydi = TarihliKayit & {
  tutar?: number;
};

type KasaKapanisi = {
  gunAnahtari?: string;
  sayilanKasa?: number;
  beklenenKasa?: number;
};

const anaIslemler = [
  {
    href: "/satis",
    ikon: "🍽️",
    baslik: "Adisyonlar",
    aciklama:
      "Masa, dış ve paket siparişlerini yönet",
    arkaPlan:
      "linear-gradient(135deg, #f9db67 0%, #f6c945 55%, #edb927 100%)",
    kenar: "#dbaa17",
    yazi: "#473700",
    aciklamaRengi: "#6b5507",
    ikonArkaPlan:
      "rgba(255,255,255,.58)",
    tip: "normal",
  },
  {
    href: "/giderler",
    ikon: "💸",
    baslik: "Gider Gir",
    aciklama:
      "İşletme harcamalarını kaydet",
    arkaPlan:
      "linear-gradient(135deg, #294b8f 0%, #3b62aa 100%)",
    kenar: "#294b8f",
    yazi: "#ffffff",
    aciklamaRengi:
      "rgba(255,255,255,.88)",
    ikonArkaPlan:
      "rgba(255,255,255,.17)",
    tip: "normal",
  },
  {
    href: "/tahsilatlar",
    ikon: "",
    baslik: "Platform Tahsilatları",
    aciklama:
      "Hesaba net yatan tutarları gir",
    arkaPlan: "#ffffff",
    kenar: "#dedbd4",
    yazi: "#20252a",
    aciklamaRengi: "#626b66",
    ikonArkaPlan: "#ffffff",
    tip: "platform",
  },
  {
    href: "/raporlar",
    ikon: "📊",
    baslik: "Gün Sonu ve Raporlar",
    aciklama:
      "Satış, gider ve kalan parayı incele",
    arkaPlan:
      "linear-gradient(135deg, #174d38 0%, #286c51 100%)",
    kenar: "#174d38",
    yazi: "#ffffff",
    aciklamaRengi:
      "rgba(255,255,255,.88)",
    ikonArkaPlan:
      "rgba(255,255,255,.16)",
    tip: "normal",
  },
];

const yonetimBolumleri = [
  {
    href: "/urunler",
    ikon: "🏷️",
    baslik: "Ürünler ve Fiyatlar",
  },
  {
    href: "/malzemeler",
    ikon: "🥬",
    baslik: "Malzemeler",
  },
  {
    href: "/receteler",
    ikon: "📋",
    baslik: "Reçeteler",
  },
  {
    href: "/maliyet",
    ikon: "💰",
    baslik: "Maliyet ve Kârlılık",
  },
  {
    href: "/mudo",
    ikon: "🏢",
    baslik: "Mudo Toptan",
  },
  {
    href: "/cari",
    ikon: "👥",
    baslik: "Cari Hesaplar",
  },
  {
    href: "/kasa",
    ikon: "💵",
    baslik: "Kasa",
  },
  {
    href: "/takvim",
    ikon: "📅",
    baslik: "Takvim",
  },
  {
    href: "/notlar",
    ikon: "📝",
    baslik: "Notlar",
  },
  {
    href: "/rehber",
    ikon: "📒",
    baslik: "Rehber",
  },
  {
    href: "/yedek",
    ikon: "💾",
    baslik: "Yedekleme",
  },
  {
    href: "/ayarlar",
    ikon: "⚙️",
    baslik: "Ayarlar",
  },
];

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

function para(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(tutar);
}

function kayitTarihi(kayit: TarihliKayit) {
  const anaDeger =
    kayit.islemId ??
    kayit.id ??
    kayit.tarih;

  if (
    anaDeger === undefined ||
    anaDeger === null
  ) {
    return null;
  }

  const tarih = new Date(anaDeger);

  if (!Number.isNaN(tarih.getTime())) {
    return tarih;
  }

  if (!kayit.tarih) {
    return null;
  }

  const eslesme = kayit.tarih.match(
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/
  );

  if (!eslesme) {
    return null;
  }

  return new Date(
    Number(eslesme[3]),
    Number(eslesme[2]) - 1,
    Number(eslesme[1])
  );
}

function bugunMu(tarih: Date | null) {
  if (!tarih) {
    return false;
  }

  const bugun = new Date();

  return (
    tarih.getDate() === bugun.getDate() &&
    tarih.getMonth() === bugun.getMonth() &&
    tarih.getFullYear() === bugun.getFullYear()
  );
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

function bugunAnahtari() {
  const tarih = new Date();

  return [
    tarih.getFullYear(),
    String(tarih.getMonth() + 1).padStart(2, "0"),
    String(tarih.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function Home() {
  const [yonetimAcik, setYonetimAcik] =
    useState(false);

  const [satislar, setSatislar] =
    useState<SatisKaydi[]>([]);

  const [giderler, setGiderler] =
    useState<GiderKaydi[]>([]);

  const [kasaKapanislari, setKasaKapanislari] =
    useState<KasaKapanisi[]>([]);

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
        )
      );

      setKasaKapanislari(
        depodanOku<KasaKapanisi>(
          "aristo-kasa-kapanislari"
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

    const zamanlayici =
      window.setInterval(
        verileriYukle,
        5000
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

      window.clearInterval(
        zamanlayici
      );
    };
  }, []);

  const bugunkuSatislar = useMemo(
    () =>
      satislar.filter(
        (kayit) =>
          !platformSatisKaydiMi(
            kayit.platform
          ) &&
          bugunMu(kayitTarihi(kayit))
      ),
    [satislar]
  );

  const bugunkuGiderler = useMemo(
    () =>
      giderler.filter((kayit) =>
        bugunMu(kayitTarihi(kayit))
      ),
    [giderler]
  );

  const bugunkuCiro =
    bugunkuSatislar.reduce(
      (toplam, kayit) =>
        toplam +
        Number(kayit.toplam || 0),
      0
    );

  const bugunkuGider =
    bugunkuGiderler.reduce(
      (toplam, kayit) =>
        toplam +
        Number(kayit.tutar || 0),
      0
    );

  const bugunkuNet =
    bugunkuCiro -
    bugunkuGider;

  const satisSayisi = new Set(
    bugunkuSatislar.map(
      (kayit) =>
        kayit.islemId ??
        kayit.id ??
        kayit.tarih
    )
  ).size;

  const satilanUrunAdedi =
    bugunkuSatislar.reduce(
      (toplam, kayit) =>
        toplam +
        Number(kayit.adet || 0),
      0
    );

  const bugunkuKapanis =
    kasaKapanislari.find(
      (kayit) =>
        kayit.gunAnahtari ===
        bugunAnahtari()
    );

  const kasadakiPara =
    bugunkuKapanis
      ? Number(
          bugunkuKapanis.sayilanKasa ??
            bugunkuKapanis.beklenenKasa ??
            0
        )
      : Number(
          localStorage.getItem(
            "aristo-kasa"
          ) || 0
        );

  const ozetKartlari = [
    {
      ikon: "💰",
      baslik: "Bugünkü Ciro",
      deger: para(bugunkuCiro),
      renk: "#174d38",
      arkaPlan: "#edf7f1",
    },
    {
      ikon: "🧾",
      baslik: "Satış Sayısı",
      deger: `${satisSayisi}`,
      altMetin: `${satilanUrunAdedi} ürün`,
      renk: "#294b8f",
      arkaPlan: "#eef3ff",
    },
    {
      ikon: "📈",
      baslik: "Bugünkü Net",
      deger: para(bugunkuNet),
      renk:
        bugunkuNet >= 0
          ? "#15803d"
          : "#b91c1c",
      arkaPlan:
        bugunkuNet >= 0
          ? "#f0fdf4"
          : "#fef2f2",
    },
    {
      ikon: "📉",
      baslik: "Bugünkü Gider",
      deger: para(bugunkuGider),
      renk: "#b91c1c",
      arkaPlan: "#fff1f2",
    },
    {
      ikon: "💵",
      baslik: "Kasadaki Para",
      deger: para(kasadakiPara),
      renk: "#7c5200",
      arkaPlan: "#fff8dc",
    },
  ];

  const yonetimKartStili: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minHeight: "62px",
    padding: "14px 16px",
    borderRadius: "13px",
    border: "1px solid #e5e2dc",
    background: "#ffffff",
    color: "#26352e",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: "16px",
    boxShadow:
      "0 5px 15px rgba(23,77,56,0.05)",
    transition:
      "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fffdf8",
        padding: "28px 14px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style jsx global>{`
        .ana-islem-karti {
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            filter 0.18s ease;
        }

        .ana-islem-karti:hover {
          transform: translateY(-4px);
          box-shadow:
            0 17px 35px
            rgba(23, 77, 56, 0.16) !important;
          filter: saturate(1.04);
        }

        .yonetim-karti:hover {
          transform: translateY(-2px);
          border-color: #8298c9 !important;
          box-shadow:
            0 10px 22px
            rgba(41, 75, 143, 0.11) !important;
        }

        .yonetim-dugmesi:hover {
          background: #f5f7fc !important;
        }

        @media (max-width: 1100px) {
          .ana-islemler {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 760px) {
          .bugun-ozet-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 620px) {
          .ana-islemler {
            grid-template-columns:
              1fr !important;
          }

          .bugun-ozet-grid {
            grid-template-columns:
              1fr !important;
          }

          .platform-karti {
            flex-direction:
              column !important;
            align-items:
              flex-start !important;
          }

          .platform-markalari {
            width: 100% !important;
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }

          .yonetim-basligi {
            align-items:
              flex-start !important;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
        }}
      >
        <Header />

        <section
          style={{
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#174d38",
                  fontSize:
                    "clamp(22px, 3vw, 29px)",
                }}
              >
                Bugünün Özeti
              </h2>

              <small
                style={{
                  display: "block",
                  marginTop: "5px",
                  color: "#6b7280",
                }}
              >
                Satış ve gider kayıtlarından otomatik hesaplanır.
              </small>
            </div>

            <span
              style={{
                padding: "7px 11px",
                borderRadius: "999px",
                background: "#edf7f1",
                color: "#174d38",
                fontWeight: 800,
                fontSize: "13px",
              }}
            >
              🟢 Canlı
            </span>
          </div>

          <div
            className="bugun-ozet-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(5, minmax(0, 1fr))",
              gap: "11px",
            }}
          >
            {ozetKartlari.map(
              (kart) => (
                <div
                  key={kart.baslik}
                  style={{
                    minHeight: "112px",
                    padding: "17px",
                    borderRadius: "17px",
                    background:
                      kart.arkaPlan,
                    border:
                      "1px solid rgba(0,0,0,.06)",
                    boxShadow:
                      "0 7px 18px rgba(23,77,56,.06)",
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
                    {kart.ikon} {kart.baslik}
                  </small>

                  <strong
                    style={{
                      display: "block",
                      color: kart.renk,
                      fontSize: "22px",
                      lineHeight: 1.2,
                    }}
                  >
                    {kart.deger}
                  </strong>

                  {kart.altMetin && (
                    <small
                      style={{
                        display: "block",
                        marginTop: "6px",
                        color: "#6b7280",
                        fontWeight: 700,
                      }}
                    >
                      {kart.altMetin}
                    </small>
                  )}
                </div>
              )
            )}
          </div>
        </section>

        <section
          className="ana-islemler"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "14px",
            marginBottom: "18px",
          }}
        >
          {anaIslemler.map((islem) => (
            <Link
              className={`ana-islem-karti ${
                islem.tip === "platform"
                  ? "platform-karti"
                  : ""
              }`}
              key={islem.href}
              href={islem.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                minHeight: "168px",
                padding: "22px",
                borderRadius: "20px",
                border: `2px solid ${islem.kenar}`,
                background: islem.arkaPlan,
                color: islem.yazi,
                textDecoration: "none",
                boxShadow:
                  "0 9px 24px rgba(23,77,56,0.09)",
                overflow: "hidden",
              }}
            >
              {islem.tip === "platform" ? (
                <span
                  className="platform-markalari"
                  style={{
                    width: "104px",
                    flexShrink: 0,
                    display: "grid",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      minHeight: "48px",
                      display: "grid",
                      placeItems: "center",
                      padding: "7px",
                      borderRadius: "11px",
                      background:
                        YEMEKSEPETI_KIRMIZISI,
                      color: "#ffffff",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      yemeksepeti
                    </strong>
                  </span>

                  <span
                    style={{
                      minHeight: "48px",
                      display: "grid",
                      placeItems: "center",
                      padding: "7px",
                      borderRadius: "11px",
                      background: "#101010",
                      borderBottom: `5px solid ${UBER_EATS_YESILI}`,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        gap: "4px",
                        alignItems: "baseline",
                      }}
                    >
                      <strong
                        style={{
                          color: "#ffffff",
                          fontSize: "15px",
                        }}
                      >
                        UBER
                      </strong>

                      <strong
                        style={{
                          color:
                            UBER_EATS_YESILI,
                          fontSize: "13px",
                        }}
                      >
                        EATS
                      </strong>
                    </span>
                  </span>
                </span>
              ) : (
                <span
                  style={{
                    width: "68px",
                    height: "68px",
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "17px",
                    background:
                      islem.ikonArkaPlan,
                    fontSize: "35px",
                  }}
                >
                  {islem.ikon}
                </span>
              )}

              <span>
                <strong
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: islem.yazi,
                    fontSize: "22px",
                    lineHeight: 1.2,
                  }}
                >
                  {islem.baslik}
                </strong>

                <small
                  style={{
                    color:
                      islem.aciklamaRengi,
                    fontSize: "15px",
                    lineHeight: 1.55,
                  }}
                >
                  {islem.aciklama}
                </small>
              </span>
            </Link>
          ))}
        </section>

        <section
          style={{
            borderRadius: "20px",
            border: "1px solid #dedbd4",
            background:
              "linear-gradient(135deg, #ffffff 0%, #f7f9ff 100%)",
            boxShadow:
              "0 9px 24px rgba(41,75,143,0.07)",
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            className="yonetim-dugmesi"
            onClick={() =>
              setYonetimAcik(
                (onceki) => !onceki
              )
            }
            aria-expanded={yonetimAcik}
            style={{
              width: "100%",
              minHeight: "96px",
              padding: "20px 22px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: "16px",
              textAlign: "left",
              transition:
                "background .18s ease",
            }}
          >
            <span
              className="yonetim-basligi"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <span
                style={{
                  width: "54px",
                  height: "54px",
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "14px",
                  background: "#edf1fa",
                  fontSize: "27px",
                }}
              >
                ⚙️
              </span>

              <span>
                <strong
                  style={{
                    display: "block",
                    color: CIVIT_MAVISI,
                    fontSize: "25px",
                  }}
                >
                  Yönetim Merkezi
                </strong>

                <small
                  style={{
                    display: "block",
                    marginTop: "5px",
                    color: "#6b7280",
                    fontSize: "16px",
                    lineHeight: 1.45,
                  }}
                >
                  Ürün, maliyet ve diğer
                  işletme bölümleri
                </small>
              </span>
            </span>

            <span
              aria-hidden="true"
              style={{
                width: "48px",
                height: "48px",
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: "999px",
                background: yonetimAcik
                  ? CIVIT_MAVISI
                  : "#edf1fa",
                color: yonetimAcik
                  ? "#ffffff"
                  : CIVIT_MAVISI,
                fontSize: "25px",
                fontWeight: 900,
                transform: yonetimAcik
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
                transition:
                  "transform .35s ease, background .25s ease, color .25s ease",
              }}
            >
              ▾
            </span>
          </button>

          <div
            style={{
              display: "grid",
              gridTemplateRows:
                yonetimAcik
                  ? "1fr"
                  : "0fr",
              opacity: yonetimAcik
                ? 1
                : 0,
              transition:
                "grid-template-rows .45s ease, opacity .28s ease",
            }}
          >
            <div
              style={{
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "0 22px 22px",
                }}
              >
                <div
                  style={{
                    height: "1px",
                    marginBottom: "17px",
                    background: "#e5e7eb",
                  }}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(205px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {yonetimBolumleri.map(
                    (bolum, index) => (
                      <Link
                        className="yonetim-karti"
                        key={bolum.href}
                        href={bolum.href}
                        style={{
                          ...yonetimKartStili,
                          borderLeft:
                            index % 3 === 0
                              ? `4px solid ${ARISTO_YESILI}`
                              : index % 3 ===
                                  1
                                ? `4px solid ${CIVIT_MAVISI}`
                                : `4px solid ${AY_CICEGI_SARISI}`,
                        }}
                      >
                        <span
                          style={{
                            width: "38px",
                            height: "38px",
                            display: "grid",
                            placeItems:
                              "center",
                            borderRadius:
                              "10px",
                            background:
                              index % 3 === 0
                                ? "#eaf4ee"
                                : index % 3 ===
                                    1
                                  ? "#edf2ff"
                                  : "#fff6cf",
                            fontSize: "20px",
                          }}
                        >
                          {bolum.ikon}
                        </span>

                        <span>
                          {bolum.baslik}
                        </span>
                      </Link>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}