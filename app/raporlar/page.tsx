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

type DetayDonem = "Bugün" | "Dün" | "Tarih Seç";

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
    /(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/
  );

  if (!eslesme) {
    return null;
  }

  return new Date(
    Number(eslesme[3]),
    Number(eslesme[2]) - 1,
    Number(eslesme[1]),
    Number(eslesme[4] || 0),
    Number(eslesme[5] || 0)
  );
}

function ayniGunMu(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function buAyMi(tarih: Date | null) {
  if (!tarih) {
    return false;
  }

  const bugun = new Date();

  return (
    tarih.getMonth() === bugun.getMonth() &&
    tarih.getFullYear() === bugun.getFullYear()
  );
}

function detayTarihi(
  donem: DetayDonem,
  seciliTarih: string
) {
  const bugun = new Date();

  if (donem === "Bugün") {
    return bugun;
  }

  if (donem === "Dün") {
    const dun = new Date(bugun);
    dun.setDate(dun.getDate() - 1);
    return dun;
  }

  return secilenTarihiOlustur(seciliTarih);
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

function ayBasligi() {
  const bugun = new Date();

  const baslangic = new Date(
    bugun.getFullYear(),
    bugun.getMonth(),
    1
  );

  const baslangicMetni =
    new Intl.DateTimeFormat(
      "tr-TR",
      {
        day: "numeric",
      }
    ).format(baslangic);

  const bitisMetni =
    new Intl.DateTimeFormat(
      "tr-TR",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(bugun);

  return `${baslangicMetni} – ${bitisMetni}`;
}

function gunBasligi(
  donem: DetayDonem,
  seciliTarih: string
) {
  const tarih =
    detayTarihi(donem, seciliTarih);

  if (!tarih) {
    return "Tarih seçilmedi";
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
    }
  ).format(tarih);
}

export default function Raporlar() {
  const [satislar, setSatislar] =
    useState<SatisKaydi[]>([]);

  const [giderler, setGiderler] =
    useState<GiderKaydi[]>([]);

  const [tahsilatlar, setTahsilatlar] =
    useState<TahsilatKaydi[]>([]);

  const [detayAcik, setDetayAcik] =
    useState(false);

  const [detayDonem, setDetayDonem] =
    useState<DetayDonem>("Bugün");

  const [seciliTarih, setSeciliTarih] =
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

  const aylikDukkanSatislari =
    useMemo(
      () =>
        satislar.filter(
          (kayit) =>
            !platformSatisKaydiMi(
              kayit.platform
            ) &&
            buAyMi(kayitTarihi(kayit))
        ),
      [satislar]
    );

  const aylikGiderler =
    useMemo(
      () =>
        giderler.filter((kayit) =>
          buAyMi(kayitTarihi(kayit))
        ),
      [giderler]
    );

  const aylikTahsilatlar =
    useMemo(
      () =>
        tahsilatlar.filter((kayit) =>
          buAyMi(kayitTarihi(kayit))
        ),
      [tahsilatlar]
    );

  const aylikDukkanSatisToplami =
    aylikDukkanSatislari.reduce(
      (toplam, kayit) =>
        toplam +
        Number(kayit.toplam || 0),
      0
    );

  const aylikPlatformTahsilati =
    aylikTahsilatlar.reduce(
      (toplam, kayit) =>
        toplam +
        Number(kayit.tutar || 0),
      0
    );

  const aylikToplamParaGirisi =
    aylikDukkanSatisToplami +
    aylikPlatformTahsilati;

  const aylikToplamGider =
    aylikGiderler.reduce(
      (toplam, kayit) =>
        toplam +
        Number(kayit.tutar || 0),
      0
    );

  const aylikNetKalan =
    aylikToplamParaGirisi -
    aylikToplamGider;

  const aylikIslemSayisi =
    new Set(
      aylikDukkanSatislari.map(
        (kayit) =>
          kayit.islemId ??
          kayit.id ??
          kayit.tarih
      )
    ).size;

  const aylikUrunAdedi =
    aylikDukkanSatislari.reduce(
      (toplam, kayit) =>
        toplam +
        Number(kayit.adet || 0),
      0
    );

  const aylikOrtalamaFis =
    aylikIslemSayisi > 0
      ? aylikDukkanSatisToplami /
        aylikIslemSayisi
      : 0;

  const seciliGun =
    detayTarihi(
      detayDonem,
      seciliTarih
    );

  const gunlukDukkanSatislari =
    useMemo(
      () =>
        satislar.filter(
          (kayit) => {
            if (
              platformSatisKaydiMi(
                kayit.platform
              )
            ) {
              return false;
            }

            const tarih =
              kayitTarihi(kayit);

            return Boolean(
              tarih &&
                seciliGun &&
                ayniGunMu(
                  tarih,
                  seciliGun
                )
            );
          }
        ),
      [
        satislar,
        seciliGun,
      ]
    );

  const gunlukGiderler =
    useMemo(
      () =>
        giderler.filter(
          (kayit) => {
            const tarih =
              kayitTarihi(kayit);

            return Boolean(
              tarih &&
                seciliGun &&
                ayniGunMu(
                  tarih,
                  seciliGun
                )
            );
          }
        ),
      [
        giderler,
        seciliGun,
      ]
    );

  const gunlukTahsilatlar =
    useMemo(
      () =>
        tahsilatlar.filter(
          (kayit) => {
            const tarih =
              kayitTarihi(kayit);

            return Boolean(
              tarih &&
                seciliGun &&
                ayniGunMu(
                  tarih,
                  seciliGun
                )
            );
          }
        ),
      [
        tahsilatlar,
        seciliGun,
      ]
    );

  const gunlukSatisIslemleri =
    useMemo(() => {
      const gruplar: Record<
        string,
        {
          kimlik: string;
          tarih: Date | null;
          adisyon: string;
          odemeTipi: string;
          toplam: number;
          nakit: number;
          kart: number;
          urunler: string[];
        }
      > = {};

      gunlukDukkanSatislari.forEach(
        (kayit) => {
          const kimlik = String(
            kayit.islemId ??
              kayit.id ??
              kayit.tarih ??
              Math.random()
          );

          if (!gruplar[kimlik]) {
            gruplar[kimlik] = {
              kimlik,
              tarih:
                kayitTarihi(kayit),
              adisyon:
                kayit.adisyon ||
                kayit.platform ||
                "Dükkân",
              odemeTipi:
                kayit.odemeTipi ||
                "Belirtilmemiş",
              toplam: 0,
              nakit: 0,
              kart: 0,
              urunler: [],
            };
          }

          gruplar[kimlik].toplam +=
            Number(
              kayit.toplam || 0
            );

          gruplar[kimlik].nakit +=
            Number(
              kayit.nakitTutari || 0
            );

          gruplar[kimlik].kart +=
            Number(
              kayit.kartTutari || 0
            );

          gruplar[
            kimlik
          ].urunler.push(
            `${Number(
              kayit.adet || 0
            )} x ${
              kayit.urun || "Ürün"
            }`
          );
        }
      );

      return Object.values(
        gruplar
      ).sort((a, b) => {
        const aZaman =
          a.tarih?.getTime() || 0;

        const bZaman =
          b.tarih?.getTime() || 0;

        return aZaman - bZaman;
      });
    }, [gunlukDukkanSatislari]);

  const gunlukDukkanSatisToplami =
    gunlukDukkanSatislari.reduce(
      (toplam, kayit) =>
        toplam +
        Number(kayit.toplam || 0),
      0
    );

  const gunlukPlatformTahsilati =
    gunlukTahsilatlar.reduce(
      (toplam, kayit) =>
        toplam +
        Number(kayit.tutar || 0),
      0
    );

  const gunlukToplamGider =
    gunlukGiderler.reduce(
      (toplam, kayit) =>
        toplam +
        Number(kayit.tutar || 0),
      0
    );

  const gunlukNet =
    gunlukDukkanSatisToplami +
    gunlukPlatformTahsilati -
    gunlukToplamGider;

  const gunlukNakit =
    gunlukDukkanSatislari.reduce(
      (toplam, kayit) =>
        toplam +
        Number(
          kayit.nakitTutari || 0
        ),
      0
    );

  const gunlukKart =
    gunlukDukkanSatislari.reduce(
      (toplam, kayit) =>
        toplam +
        Number(
          kayit.kartTutari || 0
        ),
      0
    );

  const kart: CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e2e8e5",
    borderRadius: "18px",
    padding: "20px",
    boxShadow:
      "0 8px 22px rgba(23,77,56,.06)",
  };

  const secimButonu: CSSProperties = {
    border: "1px solid #d1d5db",
    borderRadius: "11px",
    padding: "11px 16px",
    fontWeight: 800,
    cursor: "pointer",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f7faf8 0%, #eef4f0 100%)",
        padding: "28px 14px 60px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <style jsx global>{`
        @media (max-width: 700px) {
          .aylik-ozet-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }

          .gunluk-ozet-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }

          .satis-satiri {
            grid-template-columns:
              1fr !important;
          }

          .satis-sag {
            text-align:
              left !important;
          }
        }

        @media (max-width: 430px) {
          .aylik-ozet-grid,
          .gunluk-ozet-grid {
            grid-template-columns:
              1fr !important;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: "1040px",
          margin: "0 auto",
        }}
      >
        <Header />

        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <h1
            style={{
              margin: "0 0 5px",
              color: "#153f30",
              fontSize:
                "clamp(30px, 5vw, 42px)",
            }}
          >
            📊 Gün Sonu ve Raporlar
          </h1>

          <p
            style={{
              margin: 0,
              color: "#66736c",
            }}
          >
            Önce ayın genel durumunu gör,
            gerektiğinde günlük detaya in.
          </p>
        </div>

        <section
          style={{
            ...kart,
            marginBottom: "18px",
            background:
              "linear-gradient(135deg, #174d38 0%, #286c51 100%)",
            color: "#ffffff",
            border: "none",
          }}
        >
          <small
            style={{
              display: "block",
              opacity: 0.82,
              fontWeight: 800,
              marginBottom: "6px",
            }}
          >
            BU AY · BUGÜNE KADAR
          </small>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize:
                    "clamp(25px, 4vw, 34px)",
                }}
              >
                {ayBasligi()}
              </h2>

              <p
                style={{
                  margin:
                    "7px 0 0",
                  opacity: 0.86,
                }}
              >
                Ayın 1’inden bugüne kadar
                gerçekleşen işlemler.
              </p>
            </div>

            <div
              style={{
                textAlign: "right",
              }}
            >
              <small
                style={{
                  display: "block",
                  opacity: 0.82,
                  marginBottom: "4px",
                }}
              >
                NET KALAN
              </small>

              <strong
                style={{
                  fontSize:
                    "clamp(27px, 4vw, 38px)",
                }}
              >
                {para(
                  aylikNetKalan
                )}
              </strong>
            </div>
          </div>
        </section>

        <section
          className="aylik-ozet-grid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <OzetKart
            baslik="DÜKKÂN SATIŞI"
            deger={para(
              aylikDukkanSatisToplami
            )}
            ikon="🥪"
          />

          <OzetKart
            baslik="PLATFORM TAHSİLATI"
            deger={para(
              aylikPlatformTahsilati
            )}
            ikon="🌐"
          />

          <OzetKart
            baslik="TOPLAM PARA GİRİŞİ"
            deger={para(
              aylikToplamParaGirisi
            )}
            ikon="💰"
          />

          <OzetKart
            baslik="TOPLAM GİDER"
            deger={para(
              aylikToplamGider
            )}
            ikon="💸"
            kirmizi
          />

          <OzetKart
            baslik="SATIŞ İŞLEMİ"
            deger={String(
              aylikIslemSayisi
            )}
            alt={`${aylikUrunAdedi} ürün`}
            ikon="🧾"
          />

          <OzetKart
            baslik="ORTALAMA FİŞ"
            deger={para(
              aylikOrtalamaFis
            )}
            ikon="📌"
          />
        </section>

        <button
          type="button"
          onClick={() =>
            setDetayAcik(
              (onceki) => !onceki
            )
          }
          style={{
            width: "100%",
            border: "none",
            borderRadius: "14px",
            padding: "15px 18px",
            marginBottom:
              detayAcik
                ? "16px"
                : "0",
            background: detayAcik
              ? "#e9eef9"
              : "#294b8f",
            color: detayAcik
              ? "#294b8f"
              : "#ffffff",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: 900,
          }}
        >
          {detayAcik
            ? "▲ Detayı Kapat"
            : "▼ Günlük Detayı Gör"}
        </button>

        {detayAcik && (
          <>
            <section
              style={{
                ...kart,
                marginBottom:
                  "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-end",
                  gap: "14px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <small
                    style={{
                      color:
                        "#6b7280",
                      fontWeight: 800,
                    }}
                  >
                    DETAY
                  </small>

                  <h2
                    style={{
                      margin:
                        "5px 0 0",
                      color:
                        "#174d38",
                    }}
                  >
                    {gunBasligi(
                      detayDonem,
                      seciliTarih
                    )}
                  </h2>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {(
                    [
                      "Bugün",
                      "Dün",
                      "Tarih Seç",
                    ] as DetayDonem[]
                  ).map((secenek) => (
                    <button
                      key={secenek}
                      type="button"
                      onClick={() =>
                        setDetayDonem(
                          secenek
                        )
                      }
                      style={{
                        ...secimButonu,
                        background:
                          detayDonem ===
                          secenek
                            ? "#174d38"
                            : "#ffffff",
                        color:
                          detayDonem ===
                          secenek
                            ? "#ffffff"
                            : "#1f2937",
                        borderColor:
                          detayDonem ===
                          secenek
                            ? "#174d38"
                            : "#d1d5db",
                      }}
                    >
                      {secenek ===
                      "Tarih Seç"
                        ? "Özel Tarih"
                        : secenek}
                    </button>
                  ))}

                  {detayDonem ===
                    "Tarih Seç" && (
                    <input
                      type="date"
                      value={
                        seciliTarih
                      }
                      onChange={(
                        event
                      ) =>
                        setSeciliTarih(
                          event.target
                            .value
                        )
                      }
                      style={{
                        ...secimButonu,
                        background:
                          "#ffffff",
                        color:
                          "#111827",
                      }}
                    />
                  )}
                </div>
              </div>
            </section>

            <section
              className="gunluk-ozet-grid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4, minmax(0, 1fr))",
                gap: "10px",
                marginBottom:
                  "14px",
              }}
            >
              <MiniKart
                baslik="Satış"
                deger={para(
                  gunlukDukkanSatisToplami
                )}
              />

              <MiniKart
                baslik="Platform"
                deger={para(
                  gunlukPlatformTahsilati
                )}
              />

              <MiniKart
                baslik="Gider"
                deger={para(
                  gunlukToplamGider
                )}
                kirmizi
              />

              <MiniKart
                baslik="Net"
                deger={para(
                  gunlukNet
                )}
                yesil={
                  gunlukNet >= 0
                }
                kirmizi={
                  gunlukNet < 0
                }
              />
            </section>

            <section
              style={{
                ...kart,
                marginBottom:
                  "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                  alignItems: "center",
                  marginBottom:
                    "13px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                    }}
                  >
                    🧾 Satışlar
                  </h2>

                  <small
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color:
                        "#6b7280",
                    }}
                  >
                    Her satış tek satırda.
                  </small>
                </div>

                <strong
                  style={{
                    color:
                      "#174d38",
                  }}
                >
                  {
                    gunlukSatisIslemleri.length
                  }{" "}
                  satış
                </strong>
              </div>

              {gunlukSatisIslemleri.length ===
              0 ? (
                <BosDurum metin="Bu tarihte satış kaydı yok." />
              ) : (
                <div>
                  {gunlukSatisIslemleri.map(
                    (
                      islem,
                      index
                    ) => (
                      <div
                        className="satis-satiri"
                        key={
                          islem.kimlik
                        }
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "minmax(0, 1fr) auto",
                          gap: "16px",
                          padding:
                            "15px 0",
                          borderBottom:
                            index ===
                            gunlukSatisIslemleri.length -
                              1
                              ? "none"
                              : "1px solid #e5e7eb",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display:
                                "flex",
                              gap: "9px",
                              flexWrap:
                                "wrap",
                              alignItems:
                                "center",
                            }}
                          >
                            <strong
                              style={{
                                fontSize:
                                  "17px",
                                color:
                                  "#1f2937",
                              }}
                            >
                              {
                                islem.adisyon
                              }
                            </strong>

                            <small
                              style={{
                                color:
                                  "#6b7280",
                                fontWeight:
                                  800,
                              }}
                            >
                              {islem.tarih
                                ? new Intl.DateTimeFormat(
                                    "tr-TR",
                                    {
                                      hour:
                                        "2-digit",
                                      minute:
                                        "2-digit",
                                    }
                                  ).format(
                                    islem.tarih
                                  )
                                : "Saat yok"}
                            </small>
                          </div>

                          <div
                            style={{
                              marginTop:
                                "6px",
                              color:
                                "#64748b",
                              lineHeight:
                                1.5,
                            }}
                          >
                            {islem.urunler.join(
                              " · "
                            )}
                          </div>
                        </div>

                        <div
                          className="satis-sag"
                          style={{
                            minWidth:
                              "150px",
                            textAlign:
                              "right",
                          }}
                        >
                          <span
                            style={{
                              display:
                                "inline-block",
                              padding:
                                "6px 9px",
                              borderRadius:
                                "999px",
                              background:
                                "#eef4ff",
                              color:
                                "#294b8f",
                              fontSize:
                                "12px",
                              fontWeight:
                                800,
                            }}
                          >
                            {
                              islem.odemeTipi
                            }
                          </span>

                          <strong
                            style={{
                              display:
                                "block",
                              marginTop:
                                "7px",
                              color:
                                "#174d38",
                              fontSize:
                                "19px",
                            }}
                          >
                            {para(
                              islem.toplam
                            )}
                          </strong>
                        </div>
                      </div>
                    )
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: "9px",
                      paddingTop:
                        "14px",
                      marginTop: "5px",
                      borderTop:
                        "2px solid #174d38",
                    }}
                  >
                    <MiniOzet
                      baslik="NAKİT"
                      deger={para(
                        gunlukNakit
                      )}
                    />

                    <MiniOzet
                      baslik="KART"
                      deger={para(
                        gunlukKart
                      )}
                    />

                    <MiniOzet
                      baslik="TOPLAM"
                      deger={para(
                        gunlukDukkanSatisToplami
                      )}
                      vurgu
                    />
                  </div>
                </div>
              )}
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "14px",
              }}
            >
              <div style={kart}>
                <h2
                  style={{
                    marginTop: 0,
                  }}
                >
                  💸 Giderler
                </h2>

                {gunlukGiderler.length ===
                0 ? (
                  <BosDurum metin="Bu tarihte gider kaydı yok." />
                ) : (
                  <>
                    {gunlukGiderler.map(
                      (
                        kayit,
                        index
                      ) => (
                        <div
                          key={`${kayit.id ?? index}-${index}`}
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            gap: "12px",
                            padding:
                              "11px 0",
                            borderBottom:
                              "1px solid #e5e7eb",
                          }}
                        >
                          <span>
                            <strong>
                              {kayit.kategori ||
                                "Diğer"}
                            </strong>

                            <small
                              style={{
                                display:
                                  "block",
                                marginTop:
                                  "3px",
                                color:
                                  "#6b7280",
                              }}
                            >
                              {kayit.aciklama ||
                                kayit.odemeTipi ||
                                ""}
                            </small>
                          </span>

                          <strong
                            style={{
                              color:
                                "#b91c1c",
                            }}
                          >
                            {para(
                              Number(
                                kayit.tutar ||
                                  0
                              )
                            )}
                          </strong>
                        </div>
                      )
                    )}

                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap: "12px",
                        paddingTop:
                          "13px",
                      }}
                    >
                      <strong>
                        Toplam
                      </strong>

                      <strong
                        style={{
                          color:
                            "#b91c1c",
                        }}
                      >
                        {para(
                          gunlukToplamGider
                        )}
                      </strong>
                    </div>
                  </>
                )}
              </div>

              <div style={kart}>
                <h2
                  style={{
                    marginTop: 0,
                  }}
                >
                  🌐 Platform Tahsilatları
                </h2>

                {gunlukTahsilatlar.length ===
                0 ? (
                  <BosDurum metin="Bu tarihte platform tahsilatı yok." />
                ) : (
                  <>
                    {gunlukTahsilatlar.map(
                      (
                        kayit,
                        index
                      ) => (
                        <div
                          key={`${kayit.id ?? index}-${index}`}
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            gap: "12px",
                            padding:
                              "11px 0",
                            borderBottom:
                              "1px solid #e5e7eb",
                          }}
                        >
                          <span>
                            <strong>
                              {kayit.platform ||
                                "Platform"}
                            </strong>

                            {kayit.donem && (
                              <small
                                style={{
                                  display:
                                    "block",
                                  marginTop:
                                    "3px",
                                  color:
                                    "#6b7280",
                                }}
                              >
                                {
                                  kayit.donem
                                }
                              </small>
                            )}
                          </span>

                          <strong
                            style={{
                              color:
                                "#174d38",
                            }}
                          >
                            {para(
                              Number(
                                kayit.tutar ||
                                  0
                              )
                            )}
                          </strong>
                        </div>
                      )
                    )}

                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap: "12px",
                        paddingTop:
                          "13px",
                      }}
                    >
                      <strong>
                        Toplam
                      </strong>

                      <strong
                        style={{
                          color:
                            "#174d38",
                        }}
                      >
                        {para(
                          gunlukPlatformTahsilati
                        )}
                      </strong>
                    </div>
                  </>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function OzetKart({
  baslik,
  deger,
  ikon,
  alt,
  kirmizi = false,
}: {
  baslik: string;
  deger: string;
  ikon: string;
  alt?: string;
  kirmizi?: boolean;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border:
          "1px solid #e2e8e5",
        borderRadius: "17px",
        padding: "18px",
        boxShadow:
          "0 7px 18px rgba(23,77,56,.05)",
      }}
    >
      <small
        style={{
          display: "block",
          color: "#6b7280",
          fontWeight: 900,
          marginBottom: "8px",
        }}
      >
        {ikon} {baslik}
      </small>

      <strong
        style={{
          display: "block",
          fontSize: "23px",
          color: kirmizi
            ? "#b91c1c"
            : "#174d38",
        }}
      >
        {deger}
      </strong>

      {alt && (
        <small
          style={{
            display: "block",
            marginTop: "6px",
            color: "#6b7280",
          }}
        >
          {alt}
        </small>
      )}
    </div>
  );
}

function MiniKart({
  baslik,
  deger,
  yesil = false,
  kirmizi = false,
}: {
  baslik: string;
  deger: string;
  yesil?: boolean;
  kirmizi?: boolean;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border:
          "1px solid #e2e8e5",
        borderRadius: "14px",
        padding: "14px",
      }}
    >
      <small
        style={{
          display: "block",
          color: "#6b7280",
          fontWeight: 800,
          marginBottom: "6px",
        }}
      >
        {baslik}
      </small>

      <strong
        style={{
          fontSize: "19px",
          color: kirmizi
            ? "#b91c1c"
            : yesil
              ? "#15803d"
              : "#174d38",
        }}
      >
        {deger}
      </strong>
    </div>
  );
}

function MiniOzet({
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
        padding: "11px",
        borderRadius: "11px",
        background: vurgu
          ? "#e8f4ed"
          : "#f8faf9",
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
          marginBottom: "4px",
        }}
      >
        {baslik}
      </small>

      <strong
        style={{
          color: vurgu
            ? "#174d38"
            : "#1f2937",
          fontSize: vurgu
            ? "18px"
            : "16px",
        }}
      >
        {deger}
      </strong>
    </div>
  );
}

function BosDurum({
  metin,
}: {
  metin: string;
}) {
  return (
    <div
      style={{
        padding: "18px",
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