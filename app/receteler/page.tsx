"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { tumKayitlariOku, hataMesaji } from "../lib/aristoIslemler";
import { malzemeBul, malzemeSatirMaliyeti } from "../lib/maliyetHesabi";
import { supabase } from "../lib/supabase";

type FiyatTipi = "kg" | "adet" | "direkt";
type Malzeme = { id: number; ad: string; kullanimAlani: "Sandviç" | "Salata"; gramaj: number; birimFiyat: number; direktFiyat: number; fiyatTipi: FiyatTipi };
type ReceteSatiri = { id: number; malzeme: string; netGram: number; maliyetMiktari: number; porsiyonKalori: number };
type Recete = { urun: string; malzemeler: ReceteSatiri[] };
type Urun = { ad: string; satisFiyati: number };
type Veri = Record<string, unknown>;

function para(tutar: number) { return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(tutar); }
function fiyat(malzeme: Malzeme) { return malzeme.fiyatTipi === "direkt" ? malzeme.direktFiyat : malzeme.birimFiyat; }
function miktarBirimi(tip: FiyatTipi) { return tip === "kg" ? "g" : tip === "adet" ? "adet" : "porsiyon"; }
function fiyatBirimi(tip: FiyatTipi) { return tip === "kg" ? "TL/kg" : tip === "adet" ? "TL/adet" : "TL/porsiyon"; }

export default function Receteler() {
  const [receteler, setReceteler] = useState<Recete[]>([]);
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [arama, setArama] = useState("");
  const [secilenUrun, setSecilenUrun] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [kaydedilenId, setKaydedilenId] = useState<number | null>(null);
  const receteKopyasi = useRef(new Map<number, { netGram: number; maliyetMiktari: number; kalori: number }>());
  const malzemeKopyasi = useRef(new Map<number, Malzeme>());
  const kilit = useRef(new Set<number>());

  useEffect(() => {
    let aktif = true;
    async function yukle() {
      setYukleniyor(true); setHata("");
      try {
        const [receteData, malzemeData, urunData] = await Promise.all([
          tumKayitlariOku("receteler", "id, urun, malzeme, gram, maliyet_miktari, porsiyon_kalori"),
          tumKayitlariOku("malzemeler", "id, ad, kullanim_alani, gramaj, birim_fiyat, direkt_fiyat, fiyat_tipi"),
          tumKayitlariOku("urunler", "id, ad, satis_fiyati, aktif"),
        ]);
        if (!aktif) return;
        const yeniMalzemeler: Malzeme[] = malzemeData.map((k) => ({
          id: Number(k.id), ad: String(k.ad ?? ""), kullanimAlani: k.kullanim_alani === "Salata" ? "Salata" : "Sandviç",
          gramaj: Number(k.gramaj || 0), birimFiyat: Number(k.birim_fiyat || 0), direktFiyat: Number(k.direkt_fiyat || 0),
          fiyatTipi: (["kg", "adet", "direkt"].includes(String(k.fiyat_tipi)) ? String(k.fiyat_tipi) : "kg") as FiyatTipi,
        }));
        const harita = new Map<string, ReceteSatiri[]>();
        for (const k of receteData) {
          const urun = String(k.urun ?? ""); if (!urun) continue;
          const mevcut = harita.get(urun) || [];
          mevcut.push({ id: Number(k.id), malzeme: String(k.malzeme ?? ""), netGram: Number(k.gram || 0), maliyetMiktari: Number(k.maliyet_miktari || 1), porsiyonKalori: Number(k.porsiyon_kalori || 0) });
          harita.set(urun, mevcut);
        }
        const yeniReceteler = Array.from(harita, ([urun, satirlar]) => ({ urun, malzemeler: satirlar }));
        setMalzemeler(yeniMalzemeler); setReceteler(yeniReceteler);
        setUrunler(urunData.filter((k) => k.aktif !== false).map((k) => ({ ad: String(k.ad ?? ""), satisFiyati: Number(k.satis_fiyati || 0) })));
        receteKopyasi.current = new Map(yeniReceteler.flatMap((r) => r.malzemeler.map((s) => [s.id, { netGram: s.netGram, maliyetMiktari: s.maliyetMiktari, kalori: s.porsiyonKalori }] as const)));
        malzemeKopyasi.current = new Map(yeniMalzemeler.map((m) => [m.id, { ...m }]));
        setSecilenUrun((onceki) => yeniReceteler.some((r) => r.urun === onceki) ? onceki : yeniReceteler[0]?.urun || "");
        setYukleniyor(false);
      } catch (e) { if (aktif) { setHata("Reçete verileri yüklenemedi: " + hataMesaji(e)); setYukleniyor(false); } }
    }
    void yukle(); return () => { aktif = false; };
  }, []);

  function receteDegistir(id: number, alan: "netGram" | "maliyetMiktari" | "porsiyonKalori", deger: number) {
    setReceteler((liste) => liste.map((r) => ({ ...r, malzemeler: r.malzemeler.map((s) => s.id === id ? { ...s, [alan]: deger } : s) })));
  }
  function malzemeDegistir(id: number, alan: "fiyat" | "fiyatTipi", deger: number | FiyatTipi) {
    setMalzemeler((liste) => liste.map((m) => {
      if (m.id !== id) return m;
      if (alan === "fiyatTipi") return { ...m, fiyatTipi: deger as FiyatTipi };
      return m.fiyatTipi === "direkt" ? { ...m, direktFiyat: Number(deger) } : { ...m, birimFiyat: Number(deger) };
    }));
  }

  async function satiriKaydet(satir: ReceteSatiri, malzeme: Malzeme) {
    if (kilit.current.has(satir.id)) return;
    const eskiR = receteKopyasi.current.get(satir.id); const eskiM = malzemeKopyasi.current.get(malzeme.id);
    if (!eskiR || !eskiM) return;
    const yeniFiyat = fiyat(malzeme);
    if (![satir.netGram, satir.maliyetMiktari, satir.porsiyonKalori, yeniFiyat].every(Number.isFinite) || satir.netGram <= 0 || satir.maliyetMiktari <= 0 || satir.porsiyonKalori < 0 || yeniFiyat < 0) {
      setHata("Net gram ve maliyet miktarı sıfırdan büyük; fiyat ve kalori sıfır veya daha büyük olmalı."); return;
    }
    kilit.current.add(satir.id); setKaydedilenId(satir.id); setHata(""); setMesaj("");
    try {
      const { data, error } = await supabase.rpc("aristo_recete_satiri_guncelle_v2", {
        p_recete_id: satir.id, p_malzeme_id: malzeme.id, p_eski_net_gram: eskiR.netGram, p_eski_maliyet_miktari: eskiR.maliyetMiktari, p_eski_kalori: eskiR.kalori,
        p_eski_birim_fiyat: eskiM.birimFiyat, p_eski_direkt_fiyat: eskiM.direktFiyat, p_eski_fiyat_tipi: eskiM.fiyatTipi,
        p_yeni_net_gram: satir.netGram, p_yeni_maliyet_miktari: satir.maliyetMiktari, p_yeni_kalori: satir.porsiyonKalori, p_yeni_fiyat: yeniFiyat, p_yeni_fiyat_tipi: malzeme.fiyatTipi,
      });
      if (error) throw error;
      const sonuc = data as { recete?: Veri; malzeme?: Veri } | null;
      if (!sonuc?.recete || !sonuc.malzeme) throw new Error("Kayıt sonucu doğrulanamadı.");
      const kayitliNetGram = Number(sonuc.recete.gram); const kayitliMaliyetMiktari = Number(sonuc.recete.maliyet_miktari); const kayitliKalori = Number(sonuc.recete.porsiyon_kalori);
      const kayitliMalzeme: Malzeme = { ...malzeme, birimFiyat: Number(sonuc.malzeme.birim_fiyat), direktFiyat: Number(sonuc.malzeme.direkt_fiyat), fiyatTipi: String(sonuc.malzeme.fiyat_tipi) as FiyatTipi };
      receteDegistir(satir.id, "netGram", kayitliNetGram); receteDegistir(satir.id, "maliyetMiktari", kayitliMaliyetMiktari); receteDegistir(satir.id, "porsiyonKalori", kayitliKalori);
      setMalzemeler((liste) => liste.map((m) => m.id === kayitliMalzeme.id ? kayitliMalzeme : m));
      receteKopyasi.current.set(satir.id, { netGram: kayitliNetGram, maliyetMiktari: kayitliMaliyetMiktari, kalori: kayitliKalori }); malzemeKopyasi.current.set(kayitliMalzeme.id, { ...kayitliMalzeme });
      setMesaj("Satır buluta kaydedildi; maliyetler güncellendi.");
    } catch (e) {
      receteDegistir(satir.id, "netGram", eskiR.netGram); receteDegistir(satir.id, "maliyetMiktari", eskiR.maliyetMiktari); receteDegistir(satir.id, "porsiyonKalori", eskiR.kalori);
      setMalzemeler((liste) => liste.map((m) => m.id === eskiM.id ? { ...eskiM } : m)); setHata(hataMesaji(e) + " Eski değerler geri yüklendi.");
    } finally { kilit.current.delete(satir.id); setKaydedilenId(null); }
  }

  const filtreli = useMemo(() => { const a = arama.trim().toLocaleLowerCase("tr-TR"); return receteler.filter((r) => !a || r.urun.toLocaleLowerCase("tr-TR").includes(a)); }, [arama, receteler]);
  const recete = receteler.find((r) => r.urun === secilenUrun);
  const satirlar = (recete?.malzemeler || []).map((s) => {
    const m = malzemeBul(malzemeler, { malzeme: s.malzeme, gram: s.netGram }, secilenUrun.includes("Salata") ? "Salata" : "Sandviç") as Malzeme | undefined;
    return { ...s, malzemeKaydi: m, maliyet: m ? malzemeSatirMaliyeti(m, s.netGram, s.maliyetMiktari) : 0 };
  });
  const toplamMaliyet = satirlar.reduce((t, s) => t + s.maliyet, 0);
  const toplamKalori = satirlar.reduce((t, s) => t + s.porsiyonKalori, 0);
  const toplamGram = satirlar.reduce((t, s) => t + s.netGram, 0);
  const satisFiyati = urunler.find((u) => u.ad === secilenUrun)?.satisFiyati || 0;
  const kar = satisFiyati - toplamMaliyet; const karOrani = satisFiyati > 0 ? (kar / satisFiyati) * 100 : 0;
  const kart: CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 20, boxShadow: "0 8px 20px rgba(0,0,0,.06)" };
  const input: CSSProperties = { width: "100%", padding: 9, border: "1px solid #d1d5db", borderRadius: 9, boxSizing: "border-box", background: "#fff" };

  return <main style={{ minHeight: "100vh", background: "#f4f7f5", padding: "30px 18px", fontFamily: "Arial,sans-serif" }}><div style={{ maxWidth: 1250, margin: "0 auto" }}>
    <Link href="/">← Ana Sayfaya Dön</Link><h1>📋 Reçeteler</h1>
    <p style={{ color: "#66736c" }}>Net gram müşteri ve kalori bilgisidir. Maliyet miktarı ise satın alma şekline göre kullanılan gram, adet veya porsiyondur.</p>
    {hata && <p role="alert" style={{ color: "#b91c1c", fontWeight: 800 }}>{hata}</p>}{mesaj && <p role="status" style={{ color: "#15803d", fontWeight: 800 }}>{mesaj}</p>}
    {yukleniyor ? <section style={kart}>Reçeteler buluttan yükleniyor…</section> : <>
      <section style={{ ...kart, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginBottom: 20 }}>
        <label><strong>Ürün ara</strong><input value={arama} onChange={(e) => setArama(e.target.value)} style={{ ...input, marginTop: 7 }} /></label>
        <label><strong>Ürün seç</strong><select value={secilenUrun} onChange={(e) => setSecilenUrun(e.target.value)} style={{ ...input, marginTop: 7 }}>{filtreli.map((r) => <option key={r.urun}>{r.urun}</option>)}</select></label>
      </section>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 12, marginBottom: 20 }}>
        {[["Gramaj", `${toplamGram.toLocaleString("tr-TR")} g`], ["Maliyet", para(toplamMaliyet)], ["Kalori", `${toplamKalori.toLocaleString("tr-TR")} kcal`], ["Satış fiyatı", para(satisFiyati)], ["Kâr", `${para(kar)} (%${karOrani.toFixed(1)})`]].map(([b,d]) => <div key={b} style={kart}><small style={{ color: "#6b7280" }}>{b}</small><h2 style={{ marginBottom: 0, color: b === "Kâr" && kar < 0 ? "#b91c1c" : "#174d38" }}>{d}</h2></div>)}
      </section>
      <section style={kart}><h2 style={{ marginTop: 0 }}>{secilenUrun}</h2><p style={{ color: "#66736c" }}>Alış fiyatı malzemeye aittir; burada değiştirirsen o malzemenin kullanıldığı bütün ürünlerde güncellenir. Kalori bu porsiyon için elle girilebilir.</p>
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 1160, borderCollapse: "collapse" }}><thead><tr>{["Malzeme","Net gram","Maliyet miktarı","Birim","Alış fiyatı","Fiyat birimi","Porsiyon maliyeti","Porsiyon kalorisi","İşlem"].map((h) => <th key={h} style={hucre}>{h}</th>)}</tr></thead><tbody>
          {satirlar.map((s) => { const m = s.malzemeKaydi; const eskiR = receteKopyasi.current.get(s.id); const eskiM = m ? malzemeKopyasi.current.get(m.id) : undefined; const kirli = !!m && !!eskiR && !!eskiM && (s.netGram !== eskiR.netGram || s.maliyetMiktari !== eskiR.maliyetMiktari || s.porsiyonKalori !== eskiR.kalori || m.birimFiyat !== eskiM.birimFiyat || m.direktFiyat !== eskiM.direktFiyat || m.fiyatTipi !== eskiM.fiyatTipi);
            return <tr key={s.id}><td style={hucre}><strong>{s.malzeme}</strong>{!m && <small style={{ color: "#b91c1c", display: "block" }}>Malzeme eşleşmedi</small>}</td>
              <td style={hucre}><input type="number" min="0.01" step="0.01" value={s.netGram} onChange={(e) => receteDegistir(s.id, "netGram", Number(e.target.value))} style={{ ...input, width: 100 }} /></td>
              <td style={hucre}><input type="number" min="0.0001" step="0.01" value={m?.fiyatTipi === "kg" ? s.netGram : s.maliyetMiktari} disabled={m?.fiyatTipi === "kg"} onChange={(e) => receteDegistir(s.id, "maliyetMiktari", Number(e.target.value))} style={{ ...input, width: 105, background: m?.fiyatTipi === "kg" ? "#f1f5f9" : "#fff" }} /></td>
              <td style={hucre}>{m ? <select value={m.fiyatTipi} onChange={(e) => malzemeDegistir(m.id, "fiyatTipi", e.target.value as FiyatTipi)} style={{ ...input, width: 115 }}><option value="kg">Gram</option><option value="adet">Adet</option><option value="direkt">Porsiyon</option></select> : "—"}</td>
              <td style={hucre}>{m ? <input type="number" min="0" step="0.01" value={fiyat(m)} onChange={(e) => malzemeDegistir(m.id, "fiyat", Number(e.target.value))} style={{ ...input, width: 120 }} /> : "—"}</td>
              <td style={hucre}>{m ? fiyatBirimi(m.fiyatTipi) : "—"}<small style={{ display: "block", color: "#6b7280" }}>Miktar: {m ? miktarBirimi(m.fiyatTipi) : "—"}</small></td>
              <td style={hucre}><strong>{m ? para(s.maliyet) : "—"}</strong></td>
              <td style={hucre}><input type="number" min="0" step="0.1" value={s.porsiyonKalori} onChange={(e) => receteDegistir(s.id, "porsiyonKalori", Number(e.target.value))} style={{ ...input, width: 110 }} /></td>
              <td style={hucre}><button disabled={!m || !kirli || kaydedilenId === s.id} onClick={() => m && void satiriKaydet(s, m)} style={{ border: 0, borderRadius: 9, padding: "10px 13px", background: kirli ? "#174d38" : "#cbd5e1", color: "#fff", fontWeight: 800 }}>{kaydedilenId === s.id ? "Kaydediliyor…" : "Kaydet"}</button></td></tr>; })}
        </tbody></table></div>
      </section>
    </>}
  </div></main>;
}

const hucre: CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 9px", textAlign: "left", verticalAlign: "middle" };
