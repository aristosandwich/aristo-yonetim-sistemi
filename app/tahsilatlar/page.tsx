// app/tahsilatlar/page.tsx

"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import Header from "../ui/Header";

type Platform =
  | "GetirYemek"
  | "Trendyol"
  | "Yemeksepeti";

type TahsilatKaydi = {
  id: number;
  tarih: string;
  platform: Platform;
  donem: string;
  tutar: number;
};

const platformlar: Platform[] = [
  "GetirYemek",
  "Trendyol",
  "Yemeksepeti",
];

function para(deger: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(deger);
}

function tarihiYaz(tarihMetni: string) {
  const tarih = new Date(tarihMetni);

  if (Number.isNaN(tarih.getTime())) {
    return tarihMetni;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(tarih);
}

export default function Tahsilatlar() {
  const [platform, setPlatform] =
    useState<Platform>("GetirYemek");

  const [donem, setDonem] = useState("");
  const [tutar, setTutar] = useState("");

  const [kayitlar, setKayitlar] =
    useState<TahsilatKaydi[]>([]);

  const [duzenlenenId, setDuzenlenenId] =
    useState<number | null>(null);

  const [arama, setArama] = useState("");

  const [platformFiltresi, setPlatformFiltresi] =
    useState<"Tümü" | Platform>("Tümü");

  const [baslangicTarihi, setBaslangicTarihi] =
    useState("");

  const [bitisTarihi, setBitisTarihi] =
    useState("");

  const [mesaj, setMesaj] = useState("");

  useEffect(() => {
    try {
      const eskiKayitlar: TahsilatKaydi[] =
        JSON.parse(
          localStorage.getItem(
            "aristo-tahsilatlar"
          ) || "[]"
        );

      setKayitlar(
        Array.isArray(eskiKayitlar)
          ? eskiKayitlar
          : []
      );
    } catch {
      setKayitlar([]);
    }
  }, []);

  function bildirimGoster(metin: string) {
    setMesaj(metin);

    window.setTimeout(() => {
      setMesaj("");
    }, 2000);
  }

  function formuTemizle() {
    setPlatform("GetirYemek");
    setDonem("");
    setTutar("");
    setDuzenlenenId(null);
  }

  function kaydet() {
    const netTutar = Number(tutar);

    if (netTutar <= 0) {
      alert("Net yatan tutarı gir.");
      return;
    }

    if (duzenlenenId !== null) {
      const yeniKayitlar = kayitlar.map(
        (kayit) =>
          kayit.id === duzenlenenId
            ? {
                ...kayit,
                platform,
                donem: donem.trim(),
                tutar: netTutar,
              }
            : kayit
      );

      setKayitlar(yeniKayitlar);

      localStorage.setItem(
        "aristo-tahsilatlar",
        JSON.stringify(yeniKayitlar)
      );

      window.dispatchEvent(
        new Event("storage")
      );

      formuTemizle();

      bildirimGoster(
        "Tahsilat güncellendi."
      );

      return;
    }

    const yeniKayit: TahsilatKaydi = {
      id: Date.now(),
      tarih: new Date().toISOString(),
      platform,
      donem: donem.trim(),
      tutar: netTutar,
    };

    const yeniKayitlar = [
      yeniKayit,
      ...kayitlar,
    ];

    setKayitlar(yeniKayitlar);

    localStorage.setItem(
      "aristo-tahsilatlar",
      JSON.stringify(yeniKayitlar)
    );

    window.dispatchEvent(
      new Event("storage")
    );

    formuTemizle();

    bildirimGoster(
      "Net platform tahsilatı kaydedildi."
    );
  }

  function kaydiDuzenle(
    kayit: TahsilatKaydi
  ) {
    setPlatform(kayit.platform);
    setDonem(kayit.donem);
    setTutar(String(kayit.tutar));
    setDuzenlenenId(kayit.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function kaydiSil(id: number) {
    const onay = window.confirm(
      "Bu tahsilat kaydı silinsin mi?"
    );

    if (!onay) return;

    const ikinciOnay = window.confirm(
      "Emin misin? Bu tutar raporlardan da kaldırılacak."
    );

    if (!ikinciOnay) return;

    const yeniKayitlar = kayitlar.filter(
      (kayit) => kayit.id !== id
    );

    setKayitlar(yeniKayitlar);

    localStorage.setItem(
      "aristo-tahsilatlar",
      JSON.stringify(yeniKayitlar)
    );

    window.dispatchEvent(
      new Event("storage")
    );

    if (duzenlenenId === id) {
      formuTemizle();
    }

    bildirimGoster(
      "Tahsilat kaydı silindi."
    );
  }

  function filtreyiTemizle() {
    setArama("");
    setPlatformFiltresi("Tümü");
    setBaslangicTarihi("");
    setBitisTarihi("");
  }

  const filtrelenmisKayitlar =
    useMemo(() => {
      return kayitlar.filter((kayit) => {
        const kayitTarihi = new Date(
          kayit.id
        );

        if (baslangicTarihi) {
          const baslangic = new Date(
            `${baslangicTarihi}T00:00:00`
          );

          if (kayitTarihi < baslangic) {
            return false;
          }
        }

        if (bitisTarihi) {
          const bitis = new Date(
            `${bitisTarihi}T23:59:59`
          );

          if (kayitTarihi > bitis) {
            return false;
          }
        }

        if (
          platformFiltresi !== "Tümü" &&
          kayit.platform !==
            platformFiltresi
        ) {
          return false;
        }

        const aranan = arama
          .trim()
          .toLocaleLowerCase("tr-TR");

        if (aranan) {
          const metin =
            `${kayit.platform} ${kayit.donem}`
              .toLocaleLowerCase(
                "tr-TR"
              );

          if (!metin.includes(aranan)) {
            return false;
          }
        }

        return true;
      });
    }, [
      kayitlar,
      arama,
      platformFiltresi,
      baslangicTarihi,
      bitisTarihi,
    ]);

  const filtrelenmisToplam =
    filtrelenmisKayitlar.reduce(
      (toplam, kayit) =>
        toplam +
        Number(kayit.tutar || 0),
      0
    );

  const platformToplamlari =
    useMemo(() => {
      return platformlar.map(
        (platformAdi) => ({
          platform: platformAdi,
          toplam: filtrelenmisKayitlar
            .filter(
              (kayit) =>
                kayit.platform ===
                platformAdi
            )
            .reduce(
              (toplam, kayit) =>
                toplam +
                Number(
                  kayit.tutar || 0
                ),
              0
            ),
        })
      );
    }, [filtrelenmisKayitlar]);

  const kartStili: CSSProperties = {
    background: "#ffffff",
    border:
      "1px solid #e3e8e5",
    borderRadius: "18px",
    padding: "20px",
    boxShadow:
      "0 8px 24px rgba(23,77,56,0.07)",
  };

  const alanStili: CSSProperties = {
    width: "100%",
    padding: "12px 13px",
    boxSizing: "border-box",
    border:
      "1px solid #d1d5db",
    borderRadius: "11px",
    background: "#ffffff",
    fontSize: "16px",
  };

  const butonStili: CSSProperties = {
    border:
      "1px solid #d1d5db",
    borderRadius: "11px",
    padding: "11px 14px",
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
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "980px",
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
            💳 Platform Tahsilatları
          </h1>

          <p
            style={{
              margin: 0,
              color: "#66736c",
            }}
          >
            Platformların komisyonu
            kestikten sonra hesabına
            yatırdığı net tutarı gir.
          </p>
        </div>

        {duzenlenenId !== null && (
          <div
            style={{
              padding: "14px 17px",
              marginBottom: "18px",
              borderRadius: "12px",
              background: "#fff7ed",
              border:
                "1px solid #fdba74",
              color: "#9a3412",
              fontWeight: 800,
            }}
          >
            ✏️ Bir tahsilat kaydını
            düzenliyorsun.
          </div>
        )}

        <section
          style={{
            ...kartStili,
            marginBottom: "18px",
            border:
              "2px solid #174d38",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            Net Tahsilat Gir
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "15px",
            }}
          >
            <div>
              <label>
                <strong>Platform</strong>
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, minmax(0, 1fr))",
                  gap: "8px",
                  marginTop: "7px",
                }}
              >
                {platformlar.map(
                  (platformAdi) => (
                    <button
                      key={platformAdi}
                      type="button"
                      onClick={() =>
                        setPlatform(
                          platformAdi
                        )
                      }
                      style={{
                        ...butonStili,
                        minHeight: "58px",
                        padding: "8px",
                        background:
                          platform ===
                          platformAdi
                            ? "#174d38"
                            : "#ffffff",
                        color:
                          platform ===
                          platformAdi
                            ? "#ffffff"
                            : "#111827",
                        borderColor:
                          platform ===
                          platformAdi
                            ? "#174d38"
                            : "#d1d5db",
                      }}
                    >
                      {platformAdi ===
                      "GetirYemek"
                        ? "🟣 Getir"
                        : platformAdi ===
                            "Trendyol"
                          ? "🟠 Trendyol"
                          : "🔴 Yemeksepeti"}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label>
                <strong>Dönem</strong>
              </label>

              <input
                type="text"
                placeholder="Örneğin: 1–3 Ağustos"
                value={donem}
                onChange={(event) =>
                  setDonem(
                    event.target.value
                  )
                }
                style={{
                  ...alanStili,
                  marginTop: "7px",
                }}
              />
            </div>

            <div>
              <label>
                <strong>
                  Net Yatan Tutar (₺)
                </strong>
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={tutar}
                onChange={(event) =>
                  setTutar(
                    event.target.value
                  )
                }
                style={{
                  ...alanStili,
                  marginTop: "7px",
                  fontWeight: 800,
                  fontSize: "19px",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "9px",
              flexWrap: "wrap",
              marginTop: "17px",
            }}
          >
            <button
              onClick={kaydet}
              style={{
                border: "none",
                borderRadius: "11px",
                padding: "14px 19px",
                background: "#174d38",
                color: "#ffffff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {duzenlenenId !== null
                ? "💾 Değişiklikleri Kaydet"
                : "💾 Net Tahsilatı Kaydet"}
            </button>

            {duzenlenenId !== null && (
              <button
                onClick={formuTemizle}
                style={butonStili}
              >
                Vazgeç
              </button>
            )}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(185px, 1fr))",
            gap: "11px",
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
              TOPLAM NET TAHSİLAT
            </small>

            <h2
              style={{
                marginBottom: 0,
                color: "#174d38",
              }}
            >
              {para(filtrelenmisToplam)}
            </h2>
          </div>

          {platformToplamlari.map(
            (kayit) => (
              <div
                key={kayit.platform}
                style={kartStili}
              >
                <small
                  style={{
                    color: "#6b7280",
                    fontWeight: 800,
                  }}
                >
                  {kayit.platform ===
                  "GetirYemek"
                    ? "GETİR"
                    : kayit.platform.toLocaleUpperCase(
                        "tr-TR"
                      )}
                </small>

                <h2
                  style={{
                    marginBottom: 0,
                  }}
                >
                  {para(kayit.toplam)}
                </h2>
              </div>
            )
          )}
        </section>

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
            🔍 Tahsilatları Filtrele
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "12px",
            }}
          >
            <input
              type="text"
              placeholder="Platform veya dönem ara"
              value={arama}
              onChange={(event) =>
                setArama(
                  event.target.value
                )
              }
              style={alanStili}
            />

            <select
              value={platformFiltresi}
              onChange={(event) =>
                setPlatformFiltresi(
                  event.target
                    .value as
                    | "Tümü"
                    | Platform
                )
              }
              style={alanStili}
            >
              <option>Tümü</option>
              <option>GetirYemek</option>
              <option>Trendyol</option>
              <option>Yemeksepeti</option>
            </select>

            <input
              type="date"
              value={baslangicTarihi}
              onChange={(event) =>
                setBaslangicTarihi(
                  event.target.value
                )
              }
              style={alanStili}
            />

            <input
              type="date"
              value={bitisTarihi}
              onChange={(event) =>
                setBitisTarihi(
                  event.target.value
                )
              }
              style={alanStili}
            />
          </div>

          <button
            onClick={filtreyiTemizle}
            style={{
              ...butonStili,
              marginTop: "12px",
            }}
          >
            Filtreyi Temizle
          </button>
        </section>

        <section style={kartStili}>
          <h2
            style={{
              marginTop: 0,
            }}
          >
            Tahsilat Kayıtları
          </h2>

          {filtrelenmisKayitlar.length ===
          0 ? (
            <p
              style={{
                color: "#6b7280",
              }}
            >
              Bu filtrelere uygun tahsilat
              kaydı yok.
            </p>
          ) : (
            filtrelenmisKayitlar.map(
              (kayit) => (
                <div
                  key={kayit.id}
                  style={{
                    padding: "15px 0",
                    borderBottom:
                      "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "14px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          fontSize: "18px",
                        }}
                      >
                        {kayit.platform}
                      </strong>

                      <p
                        style={{
                          margin: "6px 0",
                          color: "#6b7280",
                        }}
                      >
                        {tarihiYaz(
                          kayit.tarih
                        )}
                      </p>

                      <span
                        style={{
                          display:
                            "inline-block",
                          padding: "5px 9px",
                          borderRadius:
                            "999px",
                          background:
                            "#edf7f1",
                          color: "#174d38",
                          fontWeight: 800,
                          fontSize: "13px",
                        }}
                      >
                        {kayit.donem ||
                          "Dönem belirtilmedi"}
                      </span>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                      }}
                    >
                      <small
                        style={{
                          display: "block",
                          color: "#6b7280",
                          marginBottom: "4px",
                        }}
                      >
                        Net yatan
                      </small>

                      <strong
                        style={{
                          color: "#15803d",
                          fontSize: "21px",
                        }}
                      >
                        {para(
                          kayit.tutar
                        )}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "9px",
                      flexWrap: "wrap",
                      marginTop: "13px",
                    }}
                  >
                    <button
                      onClick={() =>
                        kaydiDuzenle(
                          kayit
                        )
                      }
                      style={butonStili}
                    >
                      ✏️ Düzenle
                    </button>

                    <button
                      onClick={() =>
                        kaydiSil(
                          kayit.id
                        )
                      }
                      style={{
                        ...butonStili,
                        color: "#b91c1c",
                        borderColor:
                          "#fecaca",
                      }}
                    >
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </section>
      </div>

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