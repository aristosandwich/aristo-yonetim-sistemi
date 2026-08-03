"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SatisKaydi = {
  id: number;
  islemId?: number;
  tarih?: string;
  urun?: string;
  kategori?: string;
  platform?: string;
  odemeTipi?: string;
  adet?: number;
  toplam?: number;
};

type GiderKaydi = {
  id: number;
  tutar: number;
};

export default function Dashboard() {
  const [satislar, setSatislar] = useState<SatisKaydi[]>([]);
  const [giderler, setGiderler] = useState<GiderKaydi[]>([]);

  useEffect(() => {
    setSatislar(
      JSON.parse(localStorage.getItem("aristo-satislar") || "[]")
    );

    setGiderler(
      JSON.parse(localStorage.getItem("aristo-giderler") || "[]")
    );
  }, []);

  const bugun = new Date();

  function bugununKaydiMi(id: number) {
    const tarih = new Date(id);

    return (
      tarih.getDate() === bugun.getDate() &&
      tarih.getMonth() === bugun.getMonth() &&
      tarih.getFullYear() === bugun.getFullYear()
    );
  }

  function buAyinKaydiMi(id: number) {
    const tarih = new Date(id);

    return (
      tarih.getMonth() === bugun.getMonth() &&
      tarih.getFullYear() === bugun.getFullYear()
    );
  }

  const bugunkuSatislar = satislar.filter((kayit) =>
    bugununKaydiMi(kayit.id)
  );

  const bugunkuCiro = bugunkuSatislar.reduce(
    (toplam, kayit) => toplam + Number(kayit.toplam || 0),
    0
  );

  const bugunkuUrunAdedi = bugunkuSatislar.reduce(
    (toplam, kayit) => toplam + Number(kayit.adet || 1),
    0
  );

  const bugunkuGider = giderler
    .filter((kayit) => bugununKaydiMi(kayit.id))
    .reduce(
      (toplam, kayit) => toplam + Number(kayit.tutar || 0),
      0
    );

  const buAykiCiro = satislar
    .filter((kayit) => buAyinKaydiMi(kayit.id))
    .reduce(
      (toplam, kayit) => toplam + Number(kayit.toplam || 0),
      0
    );

  const buAykiGider = giderler
    .filter((kayit) => buAyinKaydiMi(kayit.id))
    .reduce(
      (toplam, kayit) => toplam + Number(kayit.tutar || 0),
      0
    );

  const bugunkuNet = bugunkuCiro - bugunkuGider;
  const buAykiNet = buAykiCiro - buAykiGider;

  const islemSayisi = new Set(
    bugunkuSatislar.map((kayit) => kayit.islemId || kayit.id)
  ).size;

  const ortalamaFis =
    islemSayisi > 0 ? bugunkuCiro / islemSayisi : 0;

  const urunSiralamasi = useMemo(() => {
    const sonuc: Record<string, number> = {};

    bugunkuSatislar.forEach((kayit) => {
      const urun = kayit.urun || "Eski Satış";
      const adet = Number(kayit.adet || 1);

      sonuc[urun] = (sonuc[urun] || 0) + adet;
    });

    return Object.entries(sonuc)
      .map(([urun, adet]) => ({ urun, adet }))
      .sort((a, b) => b.adet - a.adet);
  }, [bugunkuSatislar]);

  const platformSiralamasi = useMemo(() => {
    const sonuc: Record<string, number> = {};

    bugunkuSatislar.forEach((kayit) => {
      const platform = kayit.platform || "Belirtilmemiş";
      const tutar = Number(kayit.toplam || 0);

      sonuc[platform] = (sonuc[platform] || 0) + tutar;
    });

    return Object.entries(sonuc)
      .map(([platform, tutar]) => ({ platform, tutar }))
      .sort((a, b) => b.tutar - a.tutar);
  }, [bugunkuSatislar]);

  const odemeSiralamasi = useMemo(() => {
    const sonuc: Record<string, number> = {};

    bugunkuSatislar.forEach((kayit) => {
      const odeme = kayit.odemeTipi || "Belirtilmemiş";
      const tutar = Number(kayit.toplam || 0);

      sonuc[odeme] = (sonuc[odeme] || 0) + tutar;
    });

    return Object.entries(sonuc)
      .map(([odeme, tutar]) => ({ odeme, tutar }))
      .sort((a, b) => b.tutar - a.tutar);
  }, [bugunkuSatislar]);

  const sonSatislar = [...satislar]
    .sort((a, b) => b.id - a.id)
    .slice(0, 10);

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

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7f5",
        padding: "30px 18px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
        <Link href="/">← Ana Sayfaya Dön</Link>

        <h1>📊 Yönetim Paneli</h1>

        <p
          style={{
            color: "#6b7280",
            marginTop: "-10px",
            marginBottom: "25px",
          }}
        >
          Aristo Sandwich & Salad Bar • Canlı İşletme Özeti
        </p>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
            marginBottom: "30px",
          }}
        >
          <div style={kartStili}>
            <strong>Bugünkü Ciro</strong>
            <h2>{para(bugunkuCiro)}</h2>
          </div>

          <div style={kartStili}>
            <strong>Bugünkü Gider</strong>
            <h2>{para(bugunkuGider)}</h2>
          </div>

          <div style={kartStili}>
            <strong>Bugünkü Net</strong>
            <h2
              style={{
                color: bugunkuNet >= 0 ? "#15803d" : "#b91c1c",
              }}
            >
              {para(bugunkuNet)}
            </h2>
          </div>

          <div style={kartStili}>
            <strong>Satılan Ürün</strong>
            <h2>{bugunkuUrunAdedi} adet</h2>
          </div>

          <div style={kartStili}>
            <strong>İşlem Sayısı</strong>
            <h2>{islemSayisi}</h2>
          </div>

          <div style={kartStili}>
            <strong>Ortalama Fiş</strong>
            <h2>{para(ortalamaFis)}</h2>
          </div>

          <div style={kartStili}>
            <strong>Bu Ay Ciro</strong>
            <h2>{para(buAykiCiro)}</h2>
          </div>

          <div style={kartStili}>
            <strong>Bu Ay Net</strong>
            <h2
              style={{
                color: buAykiNet >= 0 ? "#15803d" : "#b91c1c",
              }}
            >
              {para(buAykiNet)}
            </h2>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
            marginBottom: "30px",
          }}
        >
          <div style={kartStili}>
            <h2>🥇 Bugünün En Çok Satanları</h2>

            {urunSiralamasi.length === 0 ? (
              <p>Satış yok.</p>
            ) : (
              <ol>
                {urunSiralamasi.slice(0, 5).map((kayit) => (
                  <li key={kayit.urun}>
                    {kayit.urun} — {kayit.adet} adet
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div style={kartStili}>
            <h2>🚚 Platformlar</h2>

            {platformSiralamasi.length === 0 ? (
              <p>Veri yok.</p>
            ) : (
              <ul>
                {platformSiralamasi.map((kayit) => (
                  <li key={kayit.platform}>
                    {kayit.platform} — {para(kayit.tutar)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={kartStili}>
            <h2>💳 Ödeme Tipleri</h2>

            {odemeSiralamasi.length === 0 ? (
              <p>Veri yok.</p>
            ) : (
              <ul>
                {odemeSiralamasi.map((kayit) => (
                  <li key={kayit.odeme}>
                    {kayit.odeme} — {para(kayit.tutar)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section style={kartStili}>
          <h2>🧾 Son 10 Satış</h2>

          {sonSatislar.length === 0 ? (
            <p>Henüz satış yok.</p>
          ) : (
            sonSatislar.map((kayit) => (
              <div
                key={kayit.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  borderBottom: "1px solid #e5e7eb",
                  padding: "10px 0",
                }}
              >
                <span>
                  <strong>{kayit.urun || "Eski Satış"}</strong>
                  {" — "}
                  {kayit.adet || 1} adet
                </span>

                <span>{para(Number(kayit.toplam || 0))}</span>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}