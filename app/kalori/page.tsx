"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Header from "../ui/Header";
import { receteler } from "../data/receteler";

type KaloriMalzemesi = { ad: string; kalori100Gr: number };

const VARSAYILAN_KALORI: KaloriMalzemesi[] = [
  { ad: "Baget Ekmek", kalori100Gr: 265 },
  { ad: "Beyaz Peynir", kalori100Gr: 260 },
  { ad: "Krem Peynir", kalori100Gr: 342 },
  { ad: "Kaşar Peyniri", kalori100Gr: 404 },
  { ad: "Hellim Peyniri", kalori100Gr: 321 },
  { ad: "Tulum Peyniri", kalori100Gr: 360 },
  { ad: "Zeytin Ezmesi", kalori100Gr: 250 },
  { ad: "Domates", kalori100Gr: 18 },
  { ad: "Salatalık", kalori100Gr: 15 },
  { ad: "Iceberg", kalori100Gr: 14 },
  { ad: "Roka", kalori100Gr: 25 },
  { ad: "Mısır", kalori100Gr: 96 },
  { ad: "Köz Biber", kalori100Gr: 31 },
  { ad: "Yeşil Biber", kalori100Gr: 20 },
  { ad: "Turşu", kalori100Gr: 12 },
  { ad: "Dilimli Siyah Zeytin", kalori100Gr: 115 },
  { ad: "Rozbif", kalori100Gr: 150 },
  { ad: "Dana Jambon", kalori100Gr: 120 },
  { ad: "Dana Salam", kalori100Gr: 310 },
  { ad: "Hindi Füme", kalori100Gr: 110 },
  { ad: "Hindi Salam", kalori100Gr: 180 },
  { ad: "Salam", kalori100Gr: 310 },
  { ad: "Kuzu Cotto", kalori100Gr: 170 },
  { ad: "Ton Balığı", kalori100Gr: 116 },
  { ad: "Amerikan Salatası", kalori100Gr: 220 },
  { ad: "Mayonez", kalori100Gr: 680 },
  { ad: "Trüf Mayonez", kalori100Gr: 650 },
  { ad: "Ketçap", kalori100Gr: 112 },
  { ad: "Hardal", kalori100Gr: 66 },
  { ad: "BBQ Sos", kalori100Gr: 172 },
  { ad: "Pesto", kalori100Gr: 460 },
  { ad: "Lutenitsa Sos", kalori100Gr: 95 },
  { ad: "Zeytinyağı", kalori100Gr: 884 },
  { ad: "Limon Suyu", kalori100Gr: 22 },
  { ad: "Nar Ekşisi", kalori100Gr: 260 },
  { ad: "Ceviz", kalori100Gr: 654 },
  { ad: "Nutella", kalori100Gr: 539 },
  { ad: "Muz", kalori100Gr: 89 },
  { ad: "Bal", kalori100Gr: 304 },
  { ad: "Tereyağı", kalori100Gr: 717 },
  { ad: "Yumurta", kalori100Gr: 155 },
  { ad: "Kuru Kekik", kalori100Gr: 265 },
  { ad: "Kuru Nane", kalori100Gr: 285 },
];

const ET_GRUBU = new Set(["Rozbif", "Dana Jambon", "Hindi Füme", "Salam", "Kuzu Cotto"]);

function kullanilanGram(malzeme: string, receteGrami: number) {
  if (ET_GRUBU.has(malzeme)) return 40;
  if (malzeme === "Ton Balığı") return 80;
  return Number(receteGrami || 0);
}

function kcal(kalori100Gr: number, gram: number) {
  return (Number(kalori100Gr || 0) * Number(gram || 0)) / 100;
}

export default function Kalori() {
  const [kaloriler, setKaloriler] = useState<KaloriMalzemesi[]>([]);
  const [arama, setArama] = useState("");
  const [secilenUrun, setSecilenUrun] = useState(receteler[0]?.urun || "");
  const [mesaj, setMesaj] = useState("");

  useEffect(() => {
    try {
      const kayitli = JSON.parse(localStorage.getItem("aristo-kalori-malzemeleri") || "[]") as KaloriMalzemesi[];
      if (Array.isArray(kayitli) && kayitli.length > 0) {
        const birlesik = VARSAYILAN_KALORI.map((varsayilan) => {
          const bulunan = kayitli.find((x) => x.ad === varsayilan.ad);
          return bulunan ? { ...varsayilan, kalori100Gr: Number(bulunan.kalori100Gr || 0) } : varsayilan;
        });
        const fazladan = kayitli.filter((x) => !VARSAYILAN_KALORI.some((v) => v.ad === x.ad));
        setKaloriler([...birlesik, ...fazladan]);
      } else {
        setKaloriler(VARSAYILAN_KALORI);
        localStorage.setItem("aristo-kalori-malzemeleri", JSON.stringify(VARSAYILAN_KALORI));
      }
    } catch {
      setKaloriler(VARSAYILAN_KALORI);
    }
  }, []);

  function kaloriGuncelle(ad: string, deger: number) {
    const yeni = kaloriler.map((x) => x.ad === ad ? { ...x, kalori100Gr: Math.max(0, deger) } : x);
    setKaloriler(yeni);
    localStorage.setItem("aristo-kalori-malzemeleri", JSON.stringify(yeni));
    setMesaj("Kalori verisi kaydedildi.");
    window.setTimeout(() => setMesaj(""), 1600);
  }

  const secilenRecete = useMemo(() => receteler.find((r) => r.urun === secilenUrun), [secilenUrun]);

  const hesaplanan = useMemo(() => {
    return (secilenRecete?.malzemeler || []).map((satir) => {
      const veri = kaloriler.find((x) => x.ad === satir.malzeme);
      const gram = kullanilanGram(satir.malzeme, satir.gram);
      return {
        malzeme: satir.malzeme,
        gram,
        kalori100Gr: Number(veri?.kalori100Gr || 0),
        kalori: kcal(Number(veri?.kalori100Gr || 0), gram),
        veriVar: Boolean(veri),
      };
    });
  }, [secilenRecete, kaloriler]);

  const toplamKalori = hesaplanan.reduce((t, x) => t + x.kalori, 0);
  const eksikSayisi = hesaplanan.filter((x) => !x.veriVar || x.kalori100Gr <= 0).length;
  const filtreliKaloriler = kaloriler.filter((x) => x.ad.toLocaleLowerCase("tr-TR").includes(arama.trim().toLocaleLowerCase("tr-TR")));

  const kart: CSSProperties = { background: "#fff", border: "1px solid #e2e8e5", borderRadius: 18, padding: 20, boxShadow: "0 8px 22px rgba(23,77,56,.06)" };
  const input: CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 15 };

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f7faf8 0%,#eef4f0 100%)", padding: "28px 14px 60px", fontFamily: "Arial, sans-serif" }}>
      <style jsx global>{`@media (max-width:760px){.kalori-grid{grid-template-columns:1fr!important}.kalori-satir{grid-template-columns:minmax(0,1fr) 70px 90px 90px!important}}`}</style>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Header />
        <h1 style={{ margin: "0 0 6px", color: "#153f30", fontSize: "clamp(30px,5vw,42px)" }}>🔥 Kalori Hesabı</h1>
        <p style={{ marginTop: 0, color: "#66736c", lineHeight: 1.6 }}>Bu bölüm yalnızca gram ve kalori içindir. Fiyat ve maliyet verisi burada kullanılmaz. Dana jambon, dana salam, hindi füme, hindi salam, rozbif, kuzu cotto ve diğer et grubu ürünleri 40 g; ton balığı 80 g kabul edilir.</p>

        {mesaj && <div style={{ marginBottom: 14, padding: "11px 14px", borderRadius: 10, background: "#dcfce7", color: "#166534", fontWeight: 800 }}>✅ {mesaj}</div>}

        <section className="kalori-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(360px,.9fr)", gap: 16, alignItems: "start" }}>
          <div style={kart}>
            <h2 style={{ marginTop: 0, color: "#174d38" }}>Malzeme Kalori Verileri</h2>
            <p style={{ color: "#6b7280", lineHeight: 1.5 }}>Değerler 100 gram içindir. Marka etiketin farklıysa buradan değiştir; sistem kaydeder.</p>
            <input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Malzeme ara..." style={{ ...input, marginBottom: 14 }} />
            <div style={{ display: "grid", gap: 8 }}>
              {filtreliKaloriler.map((malzeme) => (
                <div key={malzeme.ad} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 125px", gap: 10, alignItems: "center", padding: "9px 0", borderBottom: "1px solid #eef2f0" }}>
                  <strong>{malzeme.ad}</strong>
                  <label>
                    <input type="number" min={0} value={malzeme.kalori100Gr} onChange={(e) => kaloriGuncelle(malzeme.ad, Number(e.target.value))} style={input} />
                    <small style={{ color: "#6b7280" }}>kcal / 100 g</small>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div style={kart}>
            <h2 style={{ marginTop: 0, color: "#174d38" }}>Ürün Kalorisi</h2>
            <select value={secilenUrun} onChange={(e) => setSecilenUrun(e.target.value)} style={{ ...input, fontWeight: 800, marginBottom: 16 }}>
              {receteler.map((r) => <option key={r.urun} value={r.urun}>{r.urun}</option>)}
            </select>

            <div style={{ padding: 18, borderRadius: 14, background: eksikSayisi > 0 ? "#fff7ed" : "#eaf4ee", border: eksikSayisi > 0 ? "1px solid #fdba74" : "1px solid #86c7a3", marginBottom: 14 }}>
              <small style={{ color: "#6b7280", fontWeight: 900 }}>TAHMİNİ TOPLAM KALORİ</small>
              <strong style={{ display: "block", marginTop: 6, color: "#174d38", fontSize: 34 }}>{Math.round(toplamKalori)} kcal</strong>
              {eksikSayisi > 0 && <small style={{ display: "block", marginTop: 7, color: "#9a3412", fontWeight: 800 }}>{eksikSayisi} malzemede kalori verisi eksik.</small>}
            </div>

            <div className="kalori-satir" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 70px 95px 95px", gap: 8, paddingBottom: 8, borderBottom: "2px solid #174d38", color: "#6b7280", fontSize: 11, fontWeight: 900 }}>
              <span>MALZEME</span><span style={{ textAlign: "right" }}>GRAM</span><span style={{ textAlign: "right" }}>100 G</span><span style={{ textAlign: "right" }}>KCAL</span>
            </div>

            {hesaplanan.map((x, index) => (
              <div className="kalori-satir" key={`${x.malzeme}-${index}`} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 70px 95px 95px", gap: 8, padding: "11px 0", borderBottom: "1px solid #e5e7eb" }}>
                <strong>{x.malzeme}</strong><span style={{ textAlign: "right" }}>{x.gram} g</span><span style={{ textAlign: "right" }}>{x.kalori100Gr}</span><strong style={{ textAlign: "right", color: "#174d38" }}>{Math.round(x.kalori)}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}