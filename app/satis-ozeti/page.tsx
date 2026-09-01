"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Header from "../ui/Header";
import { hataMesaji, tumKayitlariOku } from "../lib/aristoIslemler";

type SatisSatiri = {
  id: number;
  islemId: number;
  urun: string;
  adet: number;
  toplam: number;
  nakit: number;
  kart: number;
  odemeTipi: string;
  adisyon: string;
  platform: string;
};

type SatisIslemi = {
  islemId: number;
  adisyon: string;
  platform: string;
  odemeTipi: string;
  urunler: SatisSatiri[];
  toplam: number;
  nakit: number;
  kart: number;
};

function para(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(tutar);
}

function platformTahsilatiMi(platform: string) {
  return [
    "Getir",
    "GetirYemek",
    "Trendyol",
    "Trendyol / Uber",
    "Uber",
    "Yemeksepeti",
  ].includes(platform);
}

function bugunMu(islemId: number) {
  const tarih = new Date(islemId);
  const bugun = new Date();

  return (
    tarih.getDate() === bugun.getDate() &&
    tarih.getMonth() === bugun.getMonth() &&
    tarih.getFullYear() === bugun.getFullYear()
  );
}

export default function SatisOzeti() {
  const [satirlar, setSatirlar] = useState<SatisSatiri[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");

  useEffect(() => {
    let aktif = true;

    async function yukle() {
      try {
        const kayitlar = await tumKayitlariOku("satislar", "*");
        if (!aktif) return;

        setSatirlar(
          kayitlar.map((kayit) => ({
            id: Number(kayit.id || 0),
            islemId: Number(kayit.islem_id || kayit.id || 0),
            urun: String(kayit.urun || "Ürün"),
            adet: Number(kayit.adet || 0),
            toplam: Number(kayit.toplam || 0),
            nakit: Number(kayit.nakit_tutari || 0),
            kart: Number(kayit.kart_tutari || 0),
            odemeTipi: String(kayit.odeme_tipi || "-"),
            adisyon: String(kayit.adisyon || ""),
            platform: String(kayit.platform || "-"),
          }))
        );
      } catch (neden) {
        if (aktif) setHata(hataMesaji(neden));
      } finally {
        if (aktif) setYukleniyor(false);
      }
    }

    void yukle();
    return () => {
      aktif = false;
    };
  }, []);

  const islemler = useMemo(() => {
    const gruplar = new Map<number, SatisSatiri[]>();

    satirlar.forEach((satir) => {
      if (platformTahsilatiMi(satir.platform) || !bugunMu(satir.islemId)) {
        return;
      }

      gruplar.set(satir.islemId, [
        ...(gruplar.get(satir.islemId) || []),
        satir,
      ]);
    });

    return Array.from(gruplar.entries())
      .map(([islemId, urunler]): SatisIslemi => ({
        islemId,
        adisyon: urunler[0]?.adisyon || "",
        platform: urunler[0]?.platform || "-",
        odemeTipi: urunler[0]?.odemeTipi || "-",
        urunler,
        toplam: urunler.reduce((toplam, urun) => toplam + urun.toplam, 0),
        nakit: urunler.reduce((toplam, urun) => toplam + urun.nakit, 0),
        kart: urunler.reduce((toplam, urun) => toplam + urun.kart, 0),
      }))
      .sort((a, b) => b.islemId - a.islemId);
  }, [satirlar]);

  const ozet = useMemo(
    () =>
      islemler.reduce(
        (sonuc, islem) => {
          sonuc.ciro += islem.toplam;
          sonuc.nakit += islem.nakit;
          sonuc.kart += islem.kart;
          sonuc.urun += islem.urunler.reduce(
            (adet, satir) => adet + satir.adet,
            0
          );
          return sonuc;
        },
        { ciro: 0, nakit: 0, kart: 0, urun: 0 }
      ),
    [islemler]
  );

  const kartStili: CSSProperties = {
    padding: "18px",
    borderRadius: "16px",
    background: "#ffffff",
    border: "1px solid #e1e7e3",
    boxShadow: "0 7px 20px rgba(23,77,56,.07)",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px 16px 60px",
        background: "linear-gradient(180deg, #f7faf8, #eef4f0)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <Header />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            margin: "18px 0",
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 5px", color: "#174d38" }}>
              Bugünkü Satış Özeti
            </h1>
            <span style={{ color: "#6b7280" }}>
              Bu pano yalnızca görüntüleme içindir.
            </span>
          </div>
          <Link
            href="/"
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              color: "#174d38",
              background: "#ffffff",
              border: "1px solid #cfd8d3",
              textDecoration: "none",
              fontWeight: 800,
            }}
          >
            ← Ana Sayfa
          </Link>
        </div>

        {yukleniyor ? (
          <div style={kartStili}>Güncel satışlar buluttan okunuyor…</div>
        ) : hata ? (
          <div style={{ ...kartStili, color: "#b91c1c" }}>
            Satışlar okunamadı: {hata}
          </div>
        ) : (
          <>
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "11px",
                marginBottom: "18px",
              }}
            >
              {[
                ["Toplam Ciro", para(ozet.ciro)],
                ["Satış Sayısı", String(islemler.length)],
                ["Ürün Adedi", String(ozet.urun)],
                ["Kart", para(ozet.kart)],
                ["Nakit", para(ozet.nakit)],
              ].map(([baslik, deger]) => (
                <div key={baslik} style={kartStili}>
                  <small style={{ color: "#6b7280", fontWeight: 700 }}>
                    {baslik}
                  </small>
                  <strong
                    style={{
                      display: "block",
                      marginTop: "7px",
                      color: "#174d38",
                      fontSize: "22px",
                    }}
                  >
                    {deger}
                  </strong>
                </div>
              ))}
            </section>

            <section style={kartStili}>
              <h2 style={{ margin: "0 0 12px", color: "#174d38" }}>
                Satışlar
              </h2>

              {islemler.length === 0 ? (
                <p style={{ color: "#6b7280" }}>Bugün henüz satış yok.</p>
              ) : (
                islemler.map((islem) => (
                  <div
                    key={islem.islemId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "14px",
                      padding: "14px 0",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <div>
                      <strong>
                        {new Intl.DateTimeFormat("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(islem.islemId))}
                        {islem.adisyon ? ` · ${islem.adisyon}` : ""}
                      </strong>
                      <small
                        style={{
                          display: "block",
                          marginTop: "5px",
                          color: "#6b7280",
                          lineHeight: 1.5,
                        }}
                      >
                        {islem.urunler
                          .map((urun) => `${urun.urun} x${urun.adet}`)
                          .join(" · ")}
                        {` · ${islem.odemeTipi}`}
                      </small>
                    </div>
                    <strong style={{ color: "#174d38", flexShrink: 0 }}>
                      {para(islem.toplam)}
                    </strong>
                  </div>
                ))
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
