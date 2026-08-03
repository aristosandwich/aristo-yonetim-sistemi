"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TarihliKayit = {
  id?: number | string;
  islemId?: number | string;
  tarih?: string;
};

type SatisKaydi = TarihliKayit & {
  urun?: string;
  platform?: string;
  odemeTipi?: string;
  adet?: number;
  toplam?: number;
};

type GiderKaydi = TarihliKayit & {
  tutar?: number;
};

type TahsilatKaydi = TarihliKayit & {
  platform?: string;
  tutar?: number;
};

type Donem = "Bugün" | "Son 7 Gün" | "Bu Ay" | "Tümü";

function depodanOku<T>(anahtar: string): T[] {
  try {
    const veri = JSON.parse(localStorage.getItem(anahtar) || "[]");
    return Array.isArray(veri) ? (veri as T[]) : [];
  } catch {
    return [];
  }
}

function kayitTarihi(kayit: TarihliKayit) {
  const tarihDegeri = kayit.tarih ?? kayit.islemId ?? kayit.id;

  if (tarihDegeri === undefined || tarihDegeri === null) {
    return null;
  }

  const tarih = new Date(tarihDegeri);

  return Number.isNaN(tarih.getTime()) ? null : tarih;
}

function ayniGunMu(tarih1: Date, tarih2: Date) {
  return (
    tarih1.getDate() === tarih2.getDate() &&
    tarih1.getMonth() === tarih2.getMonth() &&
    tarih1.getFullYear() === tarih2.getFullYear()
  );
}

function donemeUygunMu(kayit: TarihliKayit, donem: Donem) {
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

export default function Raporlar() {
  const [satislar, setSatislar] = useState<SatisKaydi[]>([]);
  const [giderler, setGiderler] = useState<GiderKaydi[]>([]);
  const [tahsilatlar, setTahsilatlar] = useState<TahsilatKaydi[]>([]);
  const [donem, setDonem] = useState<Donem>("Bu Ay");

  useEffect(() => {
    setSatislar(depodanOku<SatisKaydi>("aristo-satislar"));
    setGiderler(depodanOku<GiderKaydi>("aristo-giderler"));
    setTahsilatlar(
      depodanOku<TahsilatKaydi>("aristo-tahsilatlar")
    );
  }, []);

  const filtreliSatislar = useMemo(
    () => satislar.filter((kayit) => donemeUygunMu(kayit, donem)),
    [satislar, donem]
  );

  const filtreliGiderler = useMemo(
    () => giderler.filter((kayit) => donemeUygunMu(kayit, donem)),
    [giderler, donem]
  );

  const filtreliTahsilatlar = useMemo(
    () =>
      tahsilatlar.filter((kayit) => donemeUygunMu(kayit, donem)),
    [tahsilatlar, donem]
  );

  const toplamSatis = filtreliSatislar.reduce(
    (toplam, kayit) => toplam + Number(kayit.toplam || 0),
    0
  );

  const toplamGider = filtreliGiderler.reduce(
    (toplam, kayit) => toplam + Number(kayit.tutar || 0),
    0
  );

  const toplamTahsilat = filtreliTahsilatlar.reduce(
    (toplam, kayit) => toplam + Number(kayit.tutar || 0),
    0
  );

  const toplamAdet = filtreliSatislar.reduce(
    (toplam, kayit) => toplam + Number(kayit.adet || 1),
    0
  );

  const islemSayisi = new Set(
    filtreliSatislar.map(
      (kayit) => kayit.islemId ?? kayit.id ?? kayit.tarih
    )
  ).size;

  const net = toplamSatis - toplamGider;

  const ortalamaFis =
    islemSayisi > 0 ? toplamSatis / islemSayisi : 0;

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
      const platform = kayit.platform || "Belirtilmemiş";
      const tutar = Number(kayit.toplam || 0);

      sonuc[platform] = (sonuc[platform] || 0) + tutar;
    });

    return Object.entries(sonuc)
      .map(([platform, tutar]) => ({ platform, tutar }))
      .sort((a, b) => b.tutar - a.tutar);
  }, [filtreliSatislar]);

  const odemeSiralamasi = useMemo(() => {
    const sonuc: Record<string, number> = {};

    filtreliSatislar.forEach((kayit) => {
      const odeme = kayit.odemeTipi || "Belirtilmemiş";
      const tutar = Number(kayit.toplam || 0);

      sonuc[odeme] = (sonuc[odeme] || 0) + tutar;
    });

    return Object.entries(sonuc)
      .map(([odeme, tutar]) => ({ odeme, tutar }))
      .sort((a, b) => b.tutar - a.tutar);
  }, [filtreliSatislar]);

  const grafikVerisi = useMemo(() => {
    const gunSayisi = donem === "Bugün" ? 1 : donem === "Bu Ay" ? 30 : 7;

    return Array.from({ length: gunSayisi }, (_, index) => {
      const tarih = new Date();
      tarih.setHours(0, 0, 0, 0);
      tarih.setDate(tarih.getDate() - (gunSayisi - 1 - index));

      const ciro = satislar
        .filter((kayit) => {
          const kayitTarih = kayitTarihi(kayit);
          return kayitTarih ? ayniGunMu(kayitTarih, tarih) : false;
        })
        .reduce(
          (toplam, kayit) => toplam + Number(kayit.toplam || 0),
          0
        );

      const gider = giderler
        .filter((kayit) => {
          const kayitTarih = kayitTarihi(kayit);
          return kayitTarih ? ayniGunMu(kayitTarih, tarih) : false;
        })
        .reduce(
          (toplam, kayit) => toplam + Number(kayit.tutar || 0),
          0
        );

      return {
        tarih: tarih.toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
        }),
        ciro,
        gider,
      };
    });
  }, [satislar, giderler, donem]);

  const kartStili = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
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
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <Link href="/">← Ana Sayfaya Dön</Link>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ marginBottom: "6px" }}>📊 Raporlar</h1>

            <p style={{ margin: 0, color: "#6b7280" }}>
              Satış, gider ve tahsilat performansını incele.
            </p>
          </div>

          <select
            value={donem}
            onChange={(event) =>
              setDonem(event.target.value as Donem)
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
            <small style={{ color: "#6b7280" }}>
              Toplam satış
            </small>
            <h2 style={{ marginBottom: 0 }}>
              {para(toplamSatis)}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Toplam gider
            </small>
            <h2 style={{ marginBottom: 0 }}>
              {para(toplamGider)}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>Net</small>
            <h2
              style={{
                marginBottom: 0,
                color: net >= 0 ? "#15803d" : "#b91c1c",
              }}
            >
              {para(net)}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Toplam tahsilat
            </small>
            <h2 style={{ marginBottom: 0 }}>
              {para(toplamTahsilat)}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Satılan ürün
            </small>
            <h2 style={{ marginBottom: 0 }}>
              {toplamAdet} adet
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Ortalama fiş
            </small>
            <h2 style={{ marginBottom: 0 }}>
              {para(ortalamaFis)}
            </h2>
          </div>
        </section>

        <section
          style={{
            ...kartStili,
            marginBottom: "24px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            📈 Ciro ve Gider Grafiği
          </h2>

          <div style={{ width: "100%", height: "330px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grafikVerisi}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tarih" />
                <YAxis />
                <Tooltip
                  formatter={(deger) =>
                    para(Number(deger || 0))
                  }
                />
                <Legend />
                <Bar
                  dataKey="ciro"
                  name="Ciro"
                  fill="#15803d"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="gider"
                  name="Gider"
                  fill="#b91c1c"
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
              🥪 En Çok Satan Ürünler
            </h2>

            {urunSiralamasi.length === 0 ? (
              <p>Henüz satış kaydı yok.</p>
            ) : (
              <ol style={{ paddingLeft: "22px" }}>
                {urunSiralamasi.slice(0, 10).map((kayit) => (
                  <li
                    key={kayit.urun}
                    style={{ marginBottom: "10px" }}
                  >
                    <strong>{kayit.urun}</strong> — {kayit.adet} adet
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              🚚 Platform Dağılımı
            </h2>

            {platformSiralamasi.length === 0 ? (
              <p>Henüz platform verisi yok.</p>
            ) : (
              platformSiralamasi.map((kayit) => (
                <div
                  key={kayit.platform}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    borderBottom: "1px solid #e5e7eb",
                    padding: "11px 0",
                  }}
                >
                  <strong>{kayit.platform}</strong>
                  <span>{para(kayit.tutar)}</span>
                </div>
              ))
            )}
          </div>

          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              💳 Ödeme Dağılımı
            </h2>

            {odemeSiralamasi.length === 0 ? (
              <p>Henüz ödeme verisi yok.</p>
            ) : (
              odemeSiralamasi.map((kayit) => (
                <div
                  key={kayit.odeme}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    borderBottom: "1px solid #e5e7eb",
                    padding: "11px 0",
                  }}
                >
                  <strong>{kayit.odeme}</strong>
                  <span>{para(kayit.tutar)}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}