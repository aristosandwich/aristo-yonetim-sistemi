"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SatisKaydi = {
  id: number;
  islemId?: number;
  tarih?: string;
  urun?: string;
  platform?: string;
  odemeTipi?: string;
  adet?: number;
  toplam?: number;
};

type Donem = "Bugün" | "Son 7 Gün" | "Bu Ay" | "Tümü";

function ayniGunMu(tarih1: Date, tarih2: Date) {
  return (
    tarih1.getDate() === tarih2.getDate() &&
    tarih1.getMonth() === tarih2.getMonth() &&
    tarih1.getFullYear() === tarih2.getFullYear()
  );
}

function kayitTarihi(kayit: SatisKaydi) {
  const tarih = new Date(kayit.islemId || kayit.id);

  return Number.isNaN(tarih.getTime()) ? null : tarih;
}

function donemeUygunMu(kayit: SatisKaydi, donem: Donem) {
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

  if (donem === "Bu Ay") {
    return (
      tarih.getMonth() === bugun.getMonth() &&
      tarih.getFullYear() === bugun.getFullYear()
    );
  }

  const baslangic = new Date();
  baslangic.setHours(0, 0, 0, 0);
  baslangic.setDate(baslangic.getDate() - 6);

  return tarih >= baslangic;
}

function para(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(tutar);
}

export default function Istatistik() {
  const [satislar, setSatislar] = useState<SatisKaydi[]>([]);
  const [donem, setDonem] = useState<Donem>("Bu Ay");

  useEffect(() => {
    try {
      const kayitliSatislar: SatisKaydi[] = JSON.parse(
        localStorage.getItem("aristo-satislar") || "[]"
      );

      setSatislar(
        Array.isArray(kayitliSatislar)
          ? kayitliSatislar
          : []
      );
    } catch {
      setSatislar([]);
    }
  }, []);

  const filtreliSatislar = useMemo(
    () =>
      satislar.filter((kayit) =>
        donemeUygunMu(kayit, donem)
      ),
    [satislar, donem]
  );

  const toplamCiro = filtreliSatislar.reduce(
    (toplam, kayit) =>
      toplam + Number(kayit.toplam || 0),
    0
  );

  const toplamUrun = filtreliSatislar.reduce(
    (toplam, kayit) =>
      toplam + Number(kayit.adet || 1),
    0
  );

  const islemSayisi = new Set(
    filtreliSatislar.map(
      (kayit) => kayit.islemId || kayit.id
    )
  ).size;

  const ortalamaFis =
    islemSayisi > 0 ? toplamCiro / islemSayisi : 0;

  const urunSiralamasi = useMemo(() => {
    const sonuc: Record<string, number> = {};

    filtreliSatislar.forEach((kayit) => {
      const urun = kayit.urun || "Eski Satış Kaydı";
      const adet = Number(kayit.adet || 1);

      sonuc[urun] = (sonuc[urun] || 0) + adet;
    });

    return Object.entries(sonuc)
      .map(([urun, adet]) => ({ urun, adet }))
      .sort((a, b) => b.adet - a.adet);
  }, [filtreliSatislar]);

  const platformSiralamasi = useMemo(() => {
    const sonuc: Record<string, number> = {};

    filtreliSatislar.forEach((kayit) => {
      const platform =
        kayit.platform || "Belirtilmemiş";

      sonuc[platform] =
        (sonuc[platform] || 0) +
        Number(kayit.toplam || 0);
    });

    return Object.entries(sonuc)
      .map(([platform, tutar]) => ({
        platform,
        tutar,
      }))
      .sort((a, b) => b.tutar - a.tutar);
  }, [filtreliSatislar]);

  const odemeSiralamasi = useMemo(() => {
    const sonuc: Record<string, number> = {};

    filtreliSatislar.forEach((kayit) => {
      const odeme =
        kayit.odemeTipi || "Belirtilmemiş";

      sonuc[odeme] =
        (sonuc[odeme] || 0) +
        Number(kayit.toplam || 0);
    });

    return Object.entries(sonuc)
      .map(([odeme, tutar]) => ({
        odeme,
        tutar,
      }))
      .sort((a, b) => b.tutar - a.tutar);
  }, [filtreliSatislar]);

  const saatSiralamasi = useMemo(() => {
    const sonuc: Record<string, number> = {};

    filtreliSatislar.forEach((kayit) => {
      const tarih = kayitTarihi(kayit);

      if (!tarih) return;

      const saatMetni = `${String(
        tarih.getHours()
      ).padStart(2, "0")}:00`;

      sonuc[saatMetni] =
        (sonuc[saatMetni] || 0) +
        Number(kayit.toplam || 0);
    });

    return Object.entries(sonuc)
      .map(([saat, tutar]) => ({
        saat,
        tutar,
      }))
      .sort((a, b) =>
        a.saat.localeCompare(b.saat)
      );
  }, [filtreliSatislar]);

  const gunlukGrafik = useMemo(() => {
    const gunSayisi =
      donem === "Bugün"
        ? 1
        : donem === "Bu Ay"
        ? 30
        : 7;

    return Array.from(
      { length: gunSayisi },
      (_, index) => {
        const tarih = new Date();

        tarih.setHours(0, 0, 0, 0);
        tarih.setDate(
          tarih.getDate() -
            (gunSayisi - 1 - index)
        );

        const gunlukKayitlar = satislar.filter(
          (kayit) => {
            const kayitTarih = kayitTarihi(kayit);

            return kayitTarih
              ? ayniGunMu(kayitTarih, tarih)
              : false;
          }
        );

        const ciro = gunlukKayitlar.reduce(
          (toplam, kayit) =>
            toplam +
            Number(kayit.toplam || 0),
          0
        );

        const adet = gunlukKayitlar.reduce(
          (toplam, kayit) =>
            toplam + Number(kayit.adet || 1),
          0
        );

        return {
          tarih: tarih.toLocaleDateString(
            "tr-TR",
            {
              day: "2-digit",
              month: "2-digit",
            }
          ),
          ciro,
          adet,
        };
      }
    );
  }, [satislar, donem]);

  const enCokSatan =
    urunSiralamasi[0]?.urun || "-";

  const enGucluPlatform =
    platformSiralamasi[0]?.platform || "-";

  const enYogunSaat =
    [...saatSiralamasi].sort(
      (a, b) => b.tutar - a.tutar
    )[0]?.saat || "-";

  const kartStili = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow:
      "0 8px 20px rgba(0,0,0,0.06)",
  };

  const secimStili = {
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    fontWeight: "bold",
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
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <Link href="/">
          ← Ana Sayfaya Dön
        </Link>

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "flex-end",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1
              style={{
                marginBottom: "6px",
              }}
            >
              📈 Satış İstatistikleri
            </h1>

            <p
              style={{
                margin: 0,
                color: "#6b7280",
              }}
            >
              Satış performansını ve müşteri
              davranışlarını incele.
            </p>
          </div>

          <select
            value={donem}
            onChange={(event) =>
              setDonem(
                event.target.value as Donem
              )
            }
            style={secimStili}
          >
            <option>Bugün</option>
            <option>Son 7 Gün</option>
            <option>Bu Ay</option>
            <option>Tümü</option>
          </select>
        </div>

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
            <small
              style={{
                color: "#6b7280",
              }}
            >
              Toplam ciro
            </small>

            <h2
              style={{
                marginBottom: 0,
                color: "#174d38",
              }}
            >
              {para(toplamCiro)}
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
              }}
            >
              Satılan ürün
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {toplamUrun} adet
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
              }}
            >
              İşlem sayısı
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {islemSayisi}
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
              }}
            >
              Ortalama fiş
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {para(ortalamaFis)}
            </h2>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
              }}
            >
              En çok satan ürün
            </small>

            <h3 style={{ marginBottom: 0 }}>
              {enCokSatan}
            </h3>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
              }}
            >
              En güçlü platform
            </small>

            <h3 style={{ marginBottom: 0 }}>
              {enGucluPlatform}
            </h3>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
              }}
            >
              En yoğun saat
            </small>

            <h3 style={{ marginBottom: 0 }}>
              {enYogunSaat}
            </h3>
          </div>
        </section>

        <section
          style={{
            ...kartStili,
            marginBottom: "24px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            📊 Günlük Ciro
          </h2>

          <div
            style={{
              width: "100%",
              height: "330px",
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart data={gunlukGrafik}>
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis dataKey="tarih" />

                <YAxis />

                <Tooltip
                  formatter={(deger) =>
                    para(Number(deger || 0))
                  }
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="ciro"
                  name="Ciro"
                  stroke="#174d38"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section
          style={{
            ...kartStili,
            marginBottom: "24px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            🕒 Saatlik Ciro
          </h2>

          <div
            style={{
              width: "100%",
              height: "320px",
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={saatSiralamasi}>
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis dataKey="saat" />

                <YAxis />

                <Tooltip
                  formatter={(deger) =>
                    para(Number(deger || 0))
                  }
                />

                <Bar
                  dataKey="tutar"
                  name="Ciro"
                  fill="#174d38"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
          }}
        >
          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              🥇 En Çok Satan Ürünler
            </h2>

            {urunSiralamasi.length === 0 ? (
              <p
                style={{
                  color: "#6b7280",
                }}
              >
                Henüz satış kaydı yok.
              </p>
            ) : (
              urunSiralamasi
                .slice(0, 10)
                .map((kayit, index) => (
                  <div
                    key={kayit.urun}
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "12px",
                      borderBottom:
                        "1px solid #e5e7eb",
                      padding: "11px 0",
                    }}
                  >
                    <strong>
                      {index + 1}. {kayit.urun}
                    </strong>

                    <span>
                      {kayit.adet} adet
                    </span>
                  </div>
                ))
            )}
          </div>

          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              🚚 Platform Dağılımı
            </h2>

            {platformSiralamasi.length ===
            0 ? (
              <p
                style={{
                  color: "#6b7280",
                }}
              >
                Veri yok.
              </p>
            ) : (
              platformSiralamasi.map(
                (kayit) => (
                  <div
                    key={kayit.platform}
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "12px",
                      borderBottom:
                        "1px solid #e5e7eb",
                      padding: "11px 0",
                    }}
                  >
                    <strong>
                      {kayit.platform}
                    </strong>

                    <span>
                      {para(kayit.tutar)}
                    </span>
                  </div>
                )
              )
            )}
          </div>

          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              💳 Ödeme Tipleri
            </h2>

            {odemeSiralamasi.length ===
            0 ? (
              <p
                style={{
                  color: "#6b7280",
                }}
              >
                Veri yok.
              </p>
            ) : (
              odemeSiralamasi.map(
                (kayit) => (
                  <div
                    key={kayit.odeme}
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "12px",
                      borderBottom:
                        "1px solid #e5e7eb",
                      padding: "11px 0",
                    }}
                  >
                    <strong>
                      {kayit.odeme}
                    </strong>

                    <span>
                      {para(kayit.tutar)}
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}