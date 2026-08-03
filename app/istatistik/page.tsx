"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SatisKaydi = {
  id: number;
  tarih?: string;
  urun?: string;
  platform?: string;
  odemeTipi?: string;
  adet?: number;
  toplam?: number;
};

export default function Istatistik() {
  const [satislar, setSatislar] = useState<SatisKaydi[]>([]);

  useEffect(() => {
    const kayitliSatislar = JSON.parse(
      localStorage.getItem("aristo-satislar") || "[]"
    );

    setSatislar(kayitliSatislar);
  }, []);

  const toplamCiro = satislar.reduce(
    (toplam, kayit) => toplam + Number(kayit.toplam || 0),
    0
  );

  const toplamUrun = satislar.reduce(
    (toplam, kayit) => toplam + Number(kayit.adet || 1),
    0
  );

  const ortalamaFis =
    satislar.length > 0 ? toplamCiro / satislar.length : 0;

  const bugunkuCiro = satislar
    .filter((kayit) => {
      const kayitTarihi = new Date(kayit.id);
      const bugun = new Date();

      return (
        kayitTarihi.getDate() === bugun.getDate() &&
        kayitTarihi.getMonth() === bugun.getMonth() &&
        kayitTarihi.getFullYear() === bugun.getFullYear()
      );
    })
    .reduce(
      (toplam, kayit) => toplam + Number(kayit.toplam || 0),
      0
    );

  const buAykiCiro = satislar
    .filter((kayit) => {
      const kayitTarihi = new Date(kayit.id);
      const bugun = new Date();

      return (
        kayitTarihi.getMonth() === bugun.getMonth() &&
        kayitTarihi.getFullYear() === bugun.getFullYear()
      );
    })
    .reduce(
      (toplam, kayit) => toplam + Number(kayit.toplam || 0),
      0
    );

  const urunSiralamasi = useMemo(() => {
    const sonuc: Record<string, number> = {};

    satislar.forEach((kayit) => {
      const urun = kayit.urun || "Eski Satış Kaydı";
      const adet = Number(kayit.adet || 1);

      sonuc[urun] = (sonuc[urun] || 0) + adet;
    });

    return Object.entries(sonuc)
      .map(([urun, adet]) => ({ urun, adet }))
      .sort((a, b) => b.adet - a.adet);
  }, [satislar]);

  const platformSiralamasi = useMemo(() => {
    const sonuc: Record<string, number> = {};

    satislar.forEach((kayit) => {
      const platform = kayit.platform || "Belirtilmemiş";
      const tutar = Number(kayit.toplam || 0);

      sonuc[platform] = (sonuc[platform] || 0) + tutar;
    });

    return Object.entries(sonuc)
      .map(([platform, tutar]) => ({ platform, tutar }))
      .sort((a, b) => b.tutar - a.tutar);
  }, [satislar]);

  const odemeSiralamasi = useMemo(() => {
    const sonuc: Record<string, number> = {};

    satislar.forEach((kayit) => {
      const odeme = kayit.odemeTipi || "Belirtilmemiş";
      const tutar = Number(kayit.toplam || 0);

      sonuc[odeme] = (sonuc[odeme] || 0) + tutar;
    });

    return Object.entries(sonuc)
      .map(([odeme, tutar]) => ({ odeme, tutar }))
      .sort((a, b) => b.tutar - a.tutar);
  }, [satislar]);

  const saatSiralamasi = useMemo(() => {
    const sonuc: Record<string, number> = {};

    satislar.forEach((kayit) => {
      const saat = new Date(kayit.id).getHours();
      const saatMetni = `${String(saat).padStart(2, "0")}:00`;

      sonuc[saatMetni] =
        (sonuc[saatMetni] || 0) + Number(kayit.toplam || 0);
    });

    return Object.entries(sonuc)
      .map(([saat, tutar]) => ({ saat, tutar }))
      .sort((a, b) => a.saat.localeCompare(b.saat));
  }, [satislar]);

  const para = (tutar: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(tutar);

  const kart = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "18px",
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

      <h1>📈 Satış İstatistikleri</h1>

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
          <strong>Bugünkü Ciro</strong>
          <h2>{para(bugunkuCiro)}</h2>
        </div>

        <div style={kart}>
          <strong>Bu Ayki Ciro</strong>
          <h2>{para(buAykiCiro)}</h2>
        </div>

        <div style={kart}>
          <strong>Toplam Ciro</strong>
          <h2>{para(toplamCiro)}</h2>
        </div>

        <div style={kart}>
          <strong>Toplam Satılan Ürün</strong>
          <h2>{toplamUrun} adet</h2>
        </div>

        <div style={kart}>
          <strong>Ortalama Fiş</strong>
          <h2>{para(ortalamaFis)}</h2>
        </div>

        <div style={kart}>
          <strong>Toplam İşlem</strong>
          <h2>{satislar.length}</h2>
        </div>
      </section>

      <hr />

      <h2>🥇 En Çok Satan Ürünler</h2>

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
        <p>Veri yok.</p>
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

      <h2>💳 Ödeme Tipleri</h2>

      {odemeSiralamasi.length === 0 ? (
        <p>Veri yok.</p>
      ) : (
        <ul>
          {odemeSiralamasi.map((kayit) => (
            <li
              key={kayit.odeme}
              style={{ marginBottom: "10px" }}
            >
              <strong>{kayit.odeme}</strong> —{" "}
              {para(kayit.tutar)}
            </li>
          ))}
        </ul>
      )}

      <hr />

      <h2>🕒 Saatlik Ciro</h2>

      {saatSiralamasi.length === 0 ? (
        <p>Veri yok.</p>
      ) : (
        <div>
          {saatSiralamasi.map((kayit) => (
            <div
              key={kayit.saat}
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #e5e7eb",
                padding: "10px 0",
              }}
            >
              <strong>{kayit.saat}</strong>
              <span>{para(kayit.tutar)}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}