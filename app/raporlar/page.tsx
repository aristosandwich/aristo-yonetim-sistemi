"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SatisKaydi = {
  id: number;
  tarih: string;
  urun?: string;
  platform?: string;
  odemeTipi?: string;
  adet?: number;
  toplam: number;
};

type GiderKaydi = {
  id: number;
  tutar: number;
};

type TahsilatKaydi = {
  id: number;
  platform?: string;
  tutar: number;
};

export default function Raporlar() {
  const [satislar, setSatislar] = useState<SatisKaydi[]>([]);
  const [giderler, setGiderler] = useState<GiderKaydi[]>([]);
  const [tahsilatlar, setTahsilatlar] = useState<TahsilatKaydi[]>([]);

  useEffect(() => {
    setSatislar(
      JSON.parse(localStorage.getItem("aristo-satislar") || "[]")
    );

    setGiderler(
      JSON.parse(localStorage.getItem("aristo-giderler") || "[]")
    );

    setTahsilatlar(
      JSON.parse(localStorage.getItem("aristo-tahsilatlar") || "[]")
    );
  }, []);

  const toplamSatis = satislar.reduce(
    (toplam, kayit) => toplam + Number(kayit.toplam || 0),
    0
  );

  const toplamGider = giderler.reduce(
    (toplam, kayit) => toplam + Number(kayit.tutar || 0),
    0
  );

  const toplamTahsilat = tahsilatlar.reduce(
    (toplam, kayit) => toplam + Number(kayit.tutar || 0),
    0
  );

  const toplamAdet = satislar.reduce(
    (toplam, kayit) => toplam + Number(kayit.adet || 1),
    0
  );

  const net = toplamSatis - toplamGider;

  const ortalamaFis =
    satislar.length > 0 ? toplamSatis / satislar.length : 0;

  const urunSiralamasi = useMemo(() => {
    const sayilar: Record<string, number> = {};

    satislar.forEach((kayit) => {
      const urun = kayit.urun || "Eski Satış Kaydı";
      sayilar[urun] =
        (sayilar[urun] || 0) + Number(kayit.adet || 1);
    });

    return Object.entries(sayilar)
      .map(([urun, adet]) => ({ urun, adet }))
      .sort((a, b) => b.adet - a.adet);
  }, [satislar]);

  const platformSiralamasi = useMemo(() => {
    const sayilar: Record<string, number> = {};

    satislar.forEach((kayit) => {
      const platform = kayit.platform || "Belirtilmemiş";
      sayilar[platform] =
        (sayilar[platform] || 0) + Number(kayit.toplam || 0);
    });

    return Object.entries(sayilar)
      .map(([platform, tutar]) => ({ platform, tutar }))
      .sort((a, b) => b.tutar - a.tutar);
  }, [satislar]);

  const odemeSiralamasi = useMemo(() => {
    const sayilar: Record<string, number> = {};

    satislar.forEach((kayit) => {
      const odeme = kayit.odemeTipi || "Belirtilmemiş";
      sayilar[odeme] =
        (sayilar[odeme] || 0) + Number(kayit.toplam || 0);
    });

    return Object.entries(sayilar)
      .map(([odeme, tutar]) => ({ odeme, tutar }))
      .sort((a, b) => b.tutar - a.tutar);
  }, [satislar]);

  const para = (tutar: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(tutar);

  const kart = {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "18px",
    background: "#ffffff",
  };

  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Link href="/">← Ana Sayfaya Dön</Link>

      <h1>📊 Raporlar</h1>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <div style={kart}>
          <strong>Toplam Satış</strong>
          <h2>{para(toplamSatis)}</h2>
        </div>

        <div style={kart}>
          <strong>Toplam Gider</strong>
          <h2>{para(toplamGider)}</h2>
        </div>

        <div style={kart}>
          <strong>Net</strong>
          <h2 style={{ color: net >= 0 ? "#15803d" : "#b91c1c" }}>
            {para(net)}
          </h2>
        </div>

        <div style={kart}>
          <strong>Toplam Tahsilat</strong>
          <h2>{para(toplamTahsilat)}</h2>
        </div>

        <div style={kart}>
          <strong>Satılan Ürün</strong>
          <h2>{toplamAdet} adet</h2>
        </div>

        <div style={kart}>
          <strong>Ortalama Fiş</strong>
          <h2>{para(ortalamaFis)}</h2>
        </div>
      </section>

      <hr />

      <h2>🥪 En Çok Satan Ürünler</h2>

      {urunSiralamasi.length === 0 ? (
        <p>Henüz satış kaydı yok.</p>
      ) : (
        <ol>
          {urunSiralamasi.map((kayit) => (
            <li key={kayit.urun} style={{ marginBottom: "10px" }}>
              <strong>{kayit.urun}</strong> — {kayit.adet} adet
            </li>
          ))}
        </ol>
      )}

      <hr />

      <h2>🚚 Platform Dağılımı</h2>

      {platformSiralamasi.length === 0 ? (
        <p>Henüz platform verisi yok.</p>
      ) : (
        <ul>
          {platformSiralamasi.map((kayit) => (
            <li
              key={kayit.platform}
              style={{ marginBottom: "10px" }}
            >
              <strong>{kayit.platform}</strong> —{" "}
              {para(kayit.tutar)}
            </li>
          ))}
        </ul>
      )}

      <hr />

      <h2>💳 Ödeme Dağılımı</h2>

      {odemeSiralamasi.length === 0 ? (
        <p>Henüz ödeme verisi yok.</p>
      ) : (
        <ul>
          {odemeSiralamasi.map((kayit) => (
            <li
              key={kayit.odeme}
              style={{ marginBottom: "10px" }}
            >
              <strong>{kayit.odeme}</strong> — {para(kayit.tutar)}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}