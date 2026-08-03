"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { receteler } from "../data/receteler";

type Urun = {
  id: number;
  ad: string;
  kategori: string;
  satisFiyati: number;
  aktif: boolean;
};

type Malzeme = {
  id: number;
  ad: string;
  birimFiyat: number;
  kalori100Gr: number;
};

export default function Maliyet() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);

  useEffect(() => {
    setUrunler(
      JSON.parse(localStorage.getItem("aristo-urunler") || "[]")
    );

    setMalzemeler(
      JSON.parse(localStorage.getItem("aristo-malzemeler") || "[]")
    );
  }, []);

  const hesaplananUrunler = useMemo(() => {
    return urunler.map((urun) => {
      const recete = receteler.find(
        (kayit) => kayit.urun === urun.ad
      );

      const satirlar = recete?.malzemeler || [];

      const maliyet = satirlar.reduce((toplam, satir) => {
        const malzeme = malzemeler.find(
          (kayit) => kayit.ad === satir.malzeme
        );

        if (!malzeme) return toplam;

        return (
          toplam +
          (Number(malzeme.birimFiyat || 0) / 1000) *
            Number(satir.gram || 0)
        );
      }, 0);

      const kalori = satirlar.reduce((toplam, satir) => {
        const malzeme = malzemeler.find(
          (kayit) => kayit.ad === satir.malzeme
        );

        if (!malzeme) return toplam;

        return (
          toplam +
          (Number(malzeme.kalori100Gr || 0) / 100) *
            Number(satir.gram || 0)
        );
      }, 0);

      const satisFiyati = Number(urun.satisFiyati || 0);
      const kar = satisFiyati - maliyet;

      const karOrani =
        satisFiyati > 0 ? (kar / satisFiyati) * 100 : 0;

      const eksikMalzemeler = satirlar.filter(
        (satir) =>
          !malzemeler.some(
            (malzeme) => malzeme.ad === satir.malzeme
          )
      );

      return {
        ...urun,
        maliyet,
        kalori,
        kar,
        karOrani,
        malzemeSayisi: satirlar.length,
        eksikMalzemeSayisi: eksikMalzemeler.length,
      };
    });
  }, [urunler, malzemeler]);

  const para = (tutar: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(tutar);

  return (
    <main
      style={{
        maxWidth: "1150px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Link href="/">← Ana Sayfaya Dön</Link>

      <h1>💰 Maliyet ve Kalori</h1>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            minWidth: "950px",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={hucre}>Ürün</th>
              <th style={hucre}>Kategori</th>
              <th style={hucre}>Satış Fiyatı</th>
              <th style={hucre}>Maliyet</th>
              <th style={hucre}>Birim Kâr</th>
              <th style={hucre}>Kâr Oranı</th>
              <th style={hucre}>Kalori</th>
              <th style={hucre}>Reçete</th>
              <th style={hucre}>Durum</th>
            </tr>
          </thead>

          <tbody>
            {hesaplananUrunler.map((urun) => (
              <tr key={urun.id}>
                <td style={hucre}>
                  <strong>{urun.ad}</strong>
                </td>

                <td style={hucre}>{urun.kategori}</td>

                <td style={hucre}>
                  {para(urun.satisFiyati)}
                </td>

                <td style={hucre}>
                  {para(urun.maliyet)}
                </td>

                <td
                  style={{
                    ...hucre,
                    color:
                      urun.kar >= 0 ? "#15803d" : "#b91c1c",
                    fontWeight: "bold",
                  }}
                >
                  {para(urun.kar)}
                </td>

                <td style={hucre}>
                  %{urun.karOrani.toFixed(1)}
                </td>

                <td style={hucre}>
                  {urun.kalori.toFixed(1)} kcal
                </td>

                <td style={hucre}>
                  {urun.malzemeSayisi > 0
                    ? `${urun.malzemeSayisi} malzeme`
                    : "Yok"}
                </td>

                <td style={hucre}>
                  {urun.malzemeSayisi === 0
                    ? "⚠️ Reçete yok"
                    : urun.eksikMalzemeSayisi > 0
                    ? `⚠️ ${urun.eksikMalzemeSayisi} malzeme eşleşmedi`
                    : "✅ Hazır"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const hucre = {
  border: "1px solid #e5e7eb",
  padding: "10px",
  textAlign: "left" as const,
};