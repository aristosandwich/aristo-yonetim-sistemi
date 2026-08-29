"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Header from "../ui/Header";
import { tumKayitlariOku, hataMesaji } from "../lib/aristoIslemler";

type TarihliKayit = {
  id?: number | string;
  islemId?: number | string;
  tarih?: string;
};

type SatisKaydi = TarihliKayit & {
  platform?: string;
  toplam?: number;
};

type GiderKaydi = TarihliKayit & {
  tutar?: number;
};

type TahsilatKaydi = TarihliKayit & {
  platform?: string;
  tutar?: number;
};

type KasaKaydi = { tutar?: number };

type KanalAdi =
  | "Dükkân Satışları"
  | "Getir"
  | "Yemeksepeti"
  | "Trendyol / Uber";

function kurus(tutar: unknown) {
  const sayi = Number(tutar);
  return Number.isFinite(sayi) ? Math.round(sayi * 100) : 0;
}

function kurusTopla<T>(kayitlar: T[], sec: (kayit: T) => unknown) {
  return kayitlar.reduce((toplam, kayit) => toplam + kurus(sec(kayit)), 0);
}

function para(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(tutar);
}

function kayitTarihi(kayit: TarihliKayit) {
  const tarihMetni = String(kayit.tarih ?? "").trim();
  const eslesme = tarihMetni.match(
      /(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/
    );
  if (eslesme) {
    const tarih = new Date(Number(eslesme[3]), Number(eslesme[2]) - 1,
      Number(eslesme[1]), Number(eslesme[4] || 0), Number(eslesme[5] || 0));
    return Number.isNaN(tarih.getTime()) ? null : tarih;
  }
  if (tarihMetni) {
    const dogrudan = new Date(tarihMetni);
    if (!Number.isNaN(dogrudan.getTime())) return dogrudan;
  }
  // Yalnızca tarih alanı bulunmayan eski kayıtlarda milisaniyelik kimlik yedektir.
  const yedek = Number(kayit.islemId ?? kayit.id);
  if (!Number.isFinite(yedek) || yedek < 946684800000) return null;
  const tarih = new Date(yedek);
  return Number.isNaN(tarih.getTime()) ? null : tarih;
}

function buAyMi(
  kayit: TarihliKayit
) {
  const tarih =
    kayitTarihi(kayit);

  if (!tarih) {
    return false;
  }

  const bugun = new Date();

  return (
    tarih.getMonth() ===
      bugun.getMonth() &&
    tarih.getFullYear() ===
      bugun.getFullYear()
  );
}

function kanalBul(
  platform?: string
): KanalAdi | null {
  const deger = (
    platform || ""
  ).toLocaleLowerCase("tr-TR");

  if (
    deger.includes(
      "yemeksepeti"
    )
  ) {
    return "Yemeksepeti";
  }

  if (
    deger.includes(
      "trendyol"
    ) || deger.includes("uber")
  ) {
    return "Trendyol / Uber";
  }

  if (
    deger.includes("getir")
  ) {
    return "Getir";
  }

  return "Dükkân Satışları";
}

function ayBasligi() {
  const bugun = new Date();

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      month: "long",
      year: "numeric",
    }
  ).format(bugun);
}

function yuzde(
  deger: number,
  toplam: number
) {
  if (toplam <= 0) {
    return 0;
  }

  return (
    (deger / toplam) *
    100
  );
}

export default function Raporlar() {
  const [satislar, setSatislar] =
    useState<SatisKaydi[]>([]);

  const [giderler, setGiderler] =
    useState<GiderKaydi[]>([]);

  const [tahsilatlar, setTahsilatlar] =
    useState<TahsilatKaydi[]>([]);

  const [kasa, setKasa] = useState<KasaKaydi>({ tutar: 0 });
  const [hazir, setHazir] = useState(false);
  const [veriHatasi, setVeriHatasi] = useState("");
  const okumaNo = useRef(0);

  useEffect(() => {
    let aktif = true;

    async function verileriYukle() {
      const sira = ++okumaNo.current;
      setHazir(false);
      try {
        const [satisSonucu, giderSonucu, tahsilatSonucu, kasaSonucu] = await Promise.all([
          tumKayitlariOku("satislar", "id, islem_id, tarih, platform, toplam"),
          tumKayitlariOku("giderler", "id, tarih, tutar"),
          tumKayitlariOku("tahsilatlar", "id, tarih, platform, tutar"),
          tumKayitlariOku("kasa", "id, tutar"),
        ]);
        if (!aktif || sira !== okumaNo.current) return;
        setSatislar(
          satisSonucu.map(
            (kayit) => ({
              id: Number(kayit.id || 0),
              islemId: Number(
                kayit.islem_id ||
                  kayit.id ||
                  0
              ),
              tarih: String(
                kayit.tarih ?? ""
              ),
              platform: String(
                kayit.platform ?? ""
              ),
              toplam: Number(
                kayit.toplam || 0
              ),
            })
          )
        );
        setGiderler(
          giderSonucu.map(
            (kayit) => ({
              id: Number(kayit.id || 0),
              tarih: String(
                kayit.tarih ?? ""
              ),
              tutar: Number(
                kayit.tutar || 0
              ),
            })
          )
        );
        setTahsilatlar(
          tahsilatSonucu.map(
            (kayit) => ({
              id: Number(kayit.id || 0),
              tarih: String(
                kayit.tarih ?? ""
              ),
              platform: String(
                kayit.platform ?? ""
              ),
              tutar: Number(
                kayit.tutar || 0
              ),
            })
          )
        );
        const kasaSatiri = kasaSonucu.find((kayit) => Number(kayit.id) === 1) ?? kasaSonucu[0];
        setKasa({ tutar: Number(kasaSatiri?.tutar || 0) });
        setVeriHatasi("");
        setHazir(true);
      } catch (h) {
        if (aktif && sira === okumaNo.current) {
          setVeriHatasi("Rapor verileri buluttan okunamadı: " + hataMesaji(h));
        }
      }
    }

    function odaklaninca() {
      void verileriYukle();
    }

    void verileriYukle();

    window.addEventListener(
      "focus",
      odaklaninca
    );

    return () => {
      aktif = false;

      window.removeEventListener(
        "focus",
        odaklaninca
      );
    };
  }, []);

  const aylikSatislar =
    useMemo(
      () =>
        satislar.filter(
          buAyMi
        ),
      [satislar]
    );

  const aylikGiderler =
    useMemo(
      () =>
        giderler.filter(
          buAyMi
        ),
      [giderler]
    );

  const aylikTahsilatlar =
    useMemo(
      () =>
        tahsilatlar.filter(
          buAyMi
        ),
      [tahsilatlar]
    );

  const toplamSatis = kurusTopla(aylikSatislar, (kayit) => kayit.toplam) / 100;

  const platformTahsilatlari = kurusTopla(aylikTahsilatlar, (kayit) => kayit.tutar) / 100;

  const dukkanSatislari =
    aylikSatislar
      .filter(
        (kayit) =>
          kanalBul(
            kayit.platform
          ) ===
          "Dükkân Satışları"
      )
      .reduce((toplam, kayit) => toplam + kurus(kayit.toplam), 0) / 100;

  /*
    Platform satışları satış kayıtlarında tutuluyorsa
    aşağıdaki dağılıma otomatik girer.

    Toplam Gelir = dükkânda anında tahsil edilen satış
    + platformlardan hesaba net yatan tahsilat.
    Böylece platform satışı ve daha sonra yatan tahsilat
    aynı anda iki kez gelir sayılmaz.
  */
  const toplamGelir = (kurus(dukkanSatislari) + kurus(platformTahsilatlari)) / 100;

  const toplamGider = kurusTopla(aylikGiderler, (kayit) => kayit.tutar) / 100;

  const netKalan = (kurus(toplamGelir) - kurus(toplamGider)) / 100;

  const kanalToplamlari =
    useMemo(() => {
      const sonuc: Record<
        KanalAdi,
        number
      > = {
        "Dükkân Satışları": 0,
        Getir: 0,
        Yemeksepeti: 0,
        "Trendyol / Uber": 0,
      };

      aylikSatislar.forEach(
        (kayit) => {
          const kanal =
            kanalBul(
              kayit.platform
            );

          if (!kanal) {
            return;
          }

          sonuc[kanal] = (kurus(sonuc[kanal]) + kurus(kayit.toplam)) / 100;
        }
      );

      return sonuc;
    }, [aylikSatislar]);

  const gosterilenKanalToplami =
    Object.values(
      kanalToplamlari
    ).reduce(
      (toplam, tutar) =>
        toplam + tutar,
      0
    );

  const satisDagilimi = (
    [
      "Dükkân Satışları",
      "Getir",
      "Yemeksepeti",
      "Trendyol / Uber",
    ] as KanalAdi[]
  ).map((kanal) => ({
    kanal,
    tutar:
      kanalToplamlari[
        kanal
      ],
    oran: yuzde(
      kanalToplamlari[
        kanal
      ],
      gosterilenKanalToplami
    ),
  }));

  const kart: CSSProperties = {
    background: "#ffffff",
    border:
      "1px solid #e2e8e5",
    borderRadius: "18px",
    padding: "20px",
    boxShadow:
      "0 8px 22px rgba(23,77,56,.06)",
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
      <style jsx global>{`
        @media (max-width: 760px) {
          .rapor-ozet-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 480px) {
          .rapor-ozet-grid {
            grid-template-columns:
              1fr !important;
          }

          .dagilim-baslik,
          .dagilim-satir {
            grid-template-columns:
              minmax(0, 1fr) 105px 55px !important;
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
            marginBottom: "20px",
          }}
        >
          <h1
            style={{
              margin: "0 0 6px",
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
              textTransform:
                "capitalize",
            }}
          >
            {ayBasligi()}
          </p>
        </div>

        <div role="status" style={{ marginBottom: "14px", color: veriHatasi ? "#b91c1c" : "#66736c", fontWeight: 800 }}>
          {veriHatasi || (!hazir ? "Rapor verileri buluttan okunuyor…" : "")}
          {veriHatasi && (
            <button type="button" onClick={() => window.location.reload()} style={{ marginLeft: "10px" }}>
              Yenile
            </button>
          )}
        </div>

        <section
          style={{
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              margin: "0 0 12px",
              color: "#174d38",
            }}
          >
            📊 Ay Özeti
          </h2>

          <div
            className="rapor-ozet-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(5, minmax(0, 1fr))",
              gap: "11px",
            }}
          >
            <OzetKart
              baslik="Toplam Satış"
              deger={para(
                toplamSatis
              )}
            />

            <OzetKart
              baslik="Platform Tahsilatları"
              deger={para(
                platformTahsilatlari
              )}
            />

            <OzetKart
              baslik="Toplam Gelir"
              deger={para(
                toplamGelir
              )}
            />

            <OzetKart
              baslik="Toplam Gider"
              deger={para(
                toplamGider
              )}
              tur="gider"
            />

            <OzetKart
              baslik="Net Kalan"
              deger={para(
                netKalan
              )}
              tur={
                netKalan < 0
                  ? "gider"
                  : "net"
              }
            />
          </div>
        </section>

        <section
          style={{
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              margin: "0 0 12px",
              color: "#174d38",
            }}
          >
            💵 Kasa ve İşletme Durumu
          </h2>

          <div
            className="rapor-ozet-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: "11px",
            }}
          >
            <OzetKart
              baslik="Kasadaki Gerçek Para"
              deger={para(
                Number(kasa.tutar || 0)
              )}
              tur={
                Number(kasa.tutar || 0) < 0
                  ? "gider"
                  : "net"
              }
            />

            <OzetKart
              baslik="Bu Ay İşletme Geliri"
              deger={para(
                toplamGelir
              )}
            />

            <OzetKart
              baslik="Bu Ay İşletme Neti"
              deger={para(
                netKalan
              )}
              tur={netKalan < 0 ? "gider" : "net"}
            />
          </div>
        </section>

        <section
          style={kart}
        >
          <h2
            style={{
              margin: "0 0 16px",
              color: "#174d38",
            }}
          >
            🍽️ Satış Dağılımı
          </h2>

          <div
            className="dagilim-baslik"
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1fr) 150px 70px",
              gap: "12px",
              padding:
                "0 0 9px",
              borderBottom:
                "2px solid #174d38",
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 900,
            }}
          >
            <span>KANAL</span>

            <span
              style={{
                textAlign: "right",
              }}
            >
              TUTAR
            </span>

            <span
              style={{
                textAlign: "right",
              }}
            >
              %
            </span>
          </div>

          {satisDagilimi.map(
            (kayit) => (
              <div
                className="dagilim-satir"
                key={
                  kayit.kanal
                }
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0, 1fr) 150px 70px",
                  gap: "12px",
                  alignItems:
                    "center",
                  padding:
                    "15px 0",
                  borderBottom:
                    "1px solid #e5e7eb",
                }}
              >
                <strong
                  style={{
                    color:
                      "#1f2937",
                  }}
                >
                  {kayit.kanal}
                </strong>

                <strong
                  style={{
                    textAlign:
                      "right",
                    color:
                      "#174d38",
                  }}
                >
                  {para(
                    kayit.tutar
                  )}
                </strong>

                <strong
                  style={{
                    textAlign:
                      "right",
                    color:
                      "#294b8f",
                  }}
                >
                  %
                  {kayit.oran.toFixed(
                    1
                  )}
                </strong>
              </div>
            )
          )}
        </section>
      </div>
    </main>
  );
}

function OzetKart({
  baslik,
  deger,
  tur = "normal",
}: {
  baslik: string;
  deger: string;
  tur?:
    | "normal"
    | "gider"
    | "net";
}) {
  const renk =
    tur === "gider"
      ? "#b91c1c"
      : tur === "net"
        ? "#15803d"
        : "#174d38";

  const arkaPlan =
    tur === "gider"
      ? "#fff5f5"
      : tur === "net"
        ? "#f0fdf4"
        : "#ffffff";

  return (
    <div
      style={{
        minHeight: "110px",
        padding: "17px",
        borderRadius: "16px",
        background:
          arkaPlan,
        border:
          "1px solid #e2e8e5",
        boxShadow:
          "0 6px 17px rgba(23,77,56,.05)",
      }}
    >
      <small
        style={{
          display: "block",
          minHeight: "32px",
          color: "#6b7280",
          fontWeight: 900,
          lineHeight: 1.35,
        }}
      >
        {baslik}
      </small>

      <strong
        style={{
          display: "block",
          marginTop: "8px",
          color: renk,
          fontSize:
            "clamp(19px, 2.4vw, 24px)",
          lineHeight: 1.2,
          overflowWrap:
            "anywhere",
        }}
      >
        {deger}
      </strong>
    </div>
  );
}
