"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { receteler } from "../data/receteler";

type Kategori = "Sandviç" | "Salata" | "İçecek" | "Ek Ürün";

type Urun = {
  id: number;
  ad: string;
  kategori: Kategori;
  satisFiyati: number;
  maliyet?: number;
  aktif: boolean;
};

type Malzeme = {
  id: number;
  ad: string;
  kullanimAlani: "Sandviç" | "Salata";
  gramaj: number;
  birimFiyat: number;
};

function para(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(tutar);
}

export default function MaliyetVeKarlilik() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);
  const [arama, setArama] = useState("");
  const [kategori, setKategori] = useState<"Tümü" | Kategori>("Tümü");

  useEffect(() => {
    function yukle() {
      try {
        const urunVerisi = JSON.parse(localStorage.getItem("aristo-urunler") || "[]");
        const malzemeVerisi = JSON.parse(localStorage.getItem("aristo-malzemeler") || "[]");
        setUrunler(Array.isArray(urunVerisi) ? urunVerisi : []);
        setMalzemeler(Array.isArray(malzemeVerisi) ? malzemeVerisi : []);
      } catch {
        setUrunler([]);
        setMalzemeler([]);
      }
    }

    yukle();
    window.addEventListener("focus", yukle);
    window.addEventListener("storage", yukle);
    return () => {
      window.removeEventListener("focus", yukle);
      window.removeEventListener("storage", yukle);
    };
  }, []);

  function maliyetHesapla(urun: Urun) {
    const recete = receteler.find((kayit) => kayit.urun === urun.ad);

    if (!recete) {
      return {
        maliyet: Number(urun.maliyet || 0),
        receteVar: false,
        eksik: 0,
      };
    }

    const kullanimAlani = urun.kategori === "Salata" ? "Salata" : "Sandviç";
    let maliyet = 0;
    let eksik = 0;

    recete.malzemeler.forEach((satir) => {
      const adaylar = malzemeler.filter((m) => m.ad === satir.malzeme);
      const malzeme = adaylar.find((m) => m.kullanimAlani === kullanimAlani) || adaylar[0];

      if (!malzeme || Number(malzeme.birimFiyat || 0) <= 0) {
        eksik += 1;
        return;
      }

      maliyet += (Number(malzeme.birimFiyat || 0) / 1000) * Number(satir.gram || 0);
    });

    return { maliyet, receteVar: true, eksik };
  }

  const hesaplanan = useMemo(() => {
    return urunler.map((urun) => {
      const sonuc = maliyetHesapla(urun);
      const satis = Number(urun.satisFiyati || 0);
      const kar = satis - sonuc.maliyet;
      const karMarji = satis > 0 ? (kar / satis) * 100 : 0;
      const maliyetOrani = satis > 0 ? (sonuc.maliyet / satis) * 100 : 0;

      return {
        ...urun,
        hesaplananMaliyet: sonuc.maliyet,
        receteVar: sonuc.receteVar,
        eksik: sonuc.eksik,
        kar,
        karMarji,
        maliyetOrani,
      };
    });
  }, [urunler, malzemeler]);

  const filtreli = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr-TR");
    return hesaplanan.filter((urun) => {
      const kategoriUygun = kategori === "Tümü" || urun.kategori === kategori;
      const aramaUygun = !q || urun.ad.toLocaleLowerCase("tr-TR").includes(q);
      return kategoriUygun && aramaUygun;
    });
  }, [hesaplanan, arama, kategori]);

  const receteli = hesaplanan.filter((u) => u.receteVar);
  const ortMaliyet = receteli.length ? receteli.reduce((t, u) => t + u.hesaplananMaliyet, 0) / receteli.length : 0;
  const ortKar = receteli.length ? receteli.reduce((t, u) => t + u.kar, 0) / receteli.length : 0;
  const ortMarj = receteli.length ? receteli.reduce((t, u) => t + u.karMarji, 0) / receteli.length : 0;
  const eksikUrun = receteli.filter((u) => u.eksik > 0).length;

  const kart = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f4f7f5", padding: "30px 18px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
        <Link href="/">← Ana Sayfaya Dön</Link>
        <h1 style={{ marginBottom: "6px", color: "#153f30" }}>💰 Maliyet & Kârlılık</h1>
        <p style={{ marginTop: 0, color: "#6b7280" }}>
          Reçete gramajı + Malzemeler ekranındaki alış fiyatı kullanılır. Kalori bu ekranda yoktur.
        </p>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "14px", margin: "24px 0" }}>
          <Ozet baslik="Ortalama Maliyet" deger={para(ortMaliyet)} />
          <Ozet baslik="Ortalama Birim Kâr" deger={para(ortKar)} />
          <Ozet baslik="Ortalama Kâr Marjı" deger={`%${ortMarj.toFixed(1)}`} />
          <Ozet baslik="Fiyatı Eksik Reçete" deger={String(eksikUrun)} uyari={eksikUrun > 0} />
        </section>

        <section style={{ ...kart, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "16px", marginBottom: "24px" }}>
          <input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Ürün ara..." style={alan} />
          <select value={kategori} onChange={(e) => setKategori(e.target.value as "Tümü" | Kategori)} style={alan}>
            <option>Tümü</option>
            <option>Sandviç</option>
            <option>Salata</option>
            <option>İçecek</option>
            <option>Ek Ürün</option>
          </select>
        </section>

        <section style={kart}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: "950px", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={hucre}>Ürün</th>
                  <th style={hucre}>Kategori</th>
                  <th style={hucre}>Satış Fiyatı</th>
                  <th style={hucre}>Ürün Maliyeti</th>
                  <th style={hucre}>Birim Kâr</th>
                  <th style={hucre}>Kâr Marjı</th>
                  <th style={hucre}>Maliyet Oranı</th>
                  <th style={hucre}>Durum</th>
                </tr>
              </thead>
              <tbody>
                {filtreli.map((urun) => (
                  <tr key={urun.id}>
                    <td style={hucre}><strong>{urun.ad}</strong></td>
                    <td style={hucre}>{urun.kategori}</td>
                    <td style={hucre}>{para(Number(urun.satisFiyati || 0))}</td>
                    <td style={hucre}>{urun.receteVar || urun.hesaplananMaliyet > 0 ? para(urun.hesaplananMaliyet) : "—"}</td>
                    <td style={{ ...hucre, fontWeight: "bold", color: urun.kar >= 0 ? "#15803d" : "#b91c1c" }}>
                      {urun.receteVar || urun.hesaplananMaliyet > 0 ? para(urun.kar) : "—"}
                    </td>
                    <td style={hucre}>{urun.receteVar || urun.hesaplananMaliyet > 0 ? `%${urun.karMarji.toFixed(1)}` : "—"}</td>
                    <td style={hucre}>{urun.receteVar || urun.hesaplananMaliyet > 0 ? `%${urun.maliyetOrani.toFixed(1)}` : "—"}</td>
                    <td style={hucre}>
                      {!urun.receteVar ? (
                        <span style={{ color: "#6b7280", fontWeight: "bold" }}>Reçete yok</span>
                      ) : urun.eksik > 0 ? (
                        <span style={{ color: "#b45309", fontWeight: "bold" }}>⚠️ {urun.eksik} fiyat eksik</span>
                      ) : (
                        <span style={{ color: "#15803d", fontWeight: "bold" }}>✅ Hazır</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Ozet({ baslik, deger, uyari = false }: { baslik: string; deger: string; uyari?: boolean }) {
  return (
    <div style={{ background: uyari ? "#fff7ed" : "#fff", border: uyari ? "1px solid #fdba74" : "1px solid #e5e7eb", borderRadius: "18px", padding: "18px" }}>
      <small style={{ color: "#6b7280", fontWeight: "bold" }}>{baslik}</small>
      <strong style={{ display: "block", marginTop: "8px", fontSize: "24px", color: uyari ? "#b45309" : "#174d38" }}>{deger}</strong>
    </div>
  );
}

const alan = {
  width: "100%",
  padding: "11px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  boxSizing: "border-box" as const,
  background: "#ffffff",
};

const hucre = {
  borderBottom: "1px solid #e5e7eb",
  padding: "13px 10px",
  textAlign: "left" as const,
};