"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { aristoYaz, bekleyenIslemiTamamla, hataMesaji, kurus, tutarMetni, onbellekYaz, tumKayitlariOku } from "../lib/aristoIslemler";

function para(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(tutar);
}

function yerelKasaOnbelleginiGuncelle(tutar: number) { onbellekYaz("aristo-kasa", String(tutar)); }

export default function Kasa() {
  const [acilis, setAcilis] = useState("");
  const [kasadakiPara, setKasadakiPara] =
    useState(0);
  const [kaydediliyor, setKaydediliyor] =
    useState(false);

  const [surum, setSurum] = useState(0);
  const [hazir, setHazir] = useState(false);
  const [veriHatasi, setVeriHatasi] = useState("");
  const islemKilidi = useRef(false);
  useEffect(() => {
    let aktif = true;
    async function yukle() {
      try {
        await bekleyenIslemiTamamla();
        const {data, error} = await supabase.from("kasa").select("id,tutar,surum").eq("id",1).single();
        if (error) throw error;
        if (!aktif) return;
        setKasadakiPara(Number(data.tutar)); setSurum(Number(data.surum)); setHazir(true);
        yerelKasaOnbelleginiGuncelle(Number(data.tutar));
      } catch (h) { if (aktif) setVeriHatasi(hataMesaji(h)); }
    }
    void yukle();
    const ayrilma = (e: BeforeUnloadEvent) => { if (islemKilidi.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", ayrilma);
    return () => { aktif = false; window.removeEventListener("beforeunload", ayrilma); };
  }, []);
  async function kaydet(tip: "acilis" | "ekle" | "cikar", deger: string) {
    if (!hazir || veriHatasi || islemKilidi.current) return;
    let tutar: string;
    try { tutar = tutarMetni(deger); if (tip !== "acilis" && kurus(tutar) === 0) throw new Error("Tutar sıfırdan büyük olmalı."); }
    catch (h) { window.alert(hataMesaji(h)); return; }
    islemKilidi.current = true; setKaydediliyor(true);
    try {
      const sonuc = await aristoYaz("kasa", { tip, tutar, beklenenSurum: tip === "acilis" ? surum : undefined });
      setKasadakiPara(Number(sonuc.kasa.tutar)); setSurum(Number(sonuc.kasa.surum));
      yerelKasaOnbelleginiGuncelle(Number(sonuc.kasa.tutar)); setAcilis("");
    } catch (h) { setVeriHatasi(hataMesaji(h)); }
    finally { islemKilidi.current = false; setKaydediliyor(false); }
  }
  async function kasaAc() {
    try { tutarMetni(acilis); } catch(h) { window.alert(hataMesaji(h)); return; }
    if (!window.confirm("Kasayı saydınız mı? Mevcut bakiye, girdiğiniz toplam tutarla değiştirilecek.")) return;
    await kaydet("acilis", acilis);
  }
  async function paraEkle() {
    const deger = window.prompt("Kasaya eklenecek tutar (satışları burada tekrar eklemeyin)");
    if (deger !== null) await kaydet("ekle", deger);
  }
  async function paraCikar() {
    const deger = window.prompt("Kasadan çıkacak tutar (nakit giderleri burada tekrar çıkarmayın)");
    if (deger !== null) await kaydet("cikar", deger);
  }

  const kart = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 8px 20px rgba(0,0,0,.06)",
  };

  const input = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box" as const,
  };

  const yesil = {
    padding: "12px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#174d38",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const gri = {
    padding: "12px 18px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7f5",
        padding: "30px 18px",
        fontFamily: "Arial,sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        <Link href="/">← Ana Sayfaya Dön</Link>

        <h1>💵 Kasa</h1>
        <p>Nakit satış ve giderler otomatik işlenir. Kart/banka ödemeleri nakit kasayı değiştirmez.</p>
        <p role="status">{veriHatasi || (!hazir ? "Kasa buluttan okunuyor…" : "")}</p>
        {veriHatasi && <button onClick={() => window.location.reload()}>Güncel bakiyeyi yükle</button>}

        <div
          style={{
            ...kart,
            marginBottom: "22px",
          }}
        >
          <small style={{ color: "#6b7280" }}>
            Mevcut Kasa
          </small>

          <h1
            style={{
              margin: "8px 0 0",
              color: "#174d38",
              fontSize: "42px",
            }}
          >
            {para(kasadakiPara)}
          </h1>
        </div>

        <div style={kart}>
          <label>Sayım Sonrası Toplam Kasa Tutarı</label>

          <input
            type="number"
            value={acilis}
            onChange={(e) =>
              setAcilis(e.target.value)
            }
            style={{
              ...input,
              margin: "8px 0 18px",
            }}
          />

          <button
            onClick={kasaAc}
            disabled={!hazir || kaydediliyor || !!veriHatasi}
            style={{
              ...yesil,
              cursor: kaydediliyor
                ? "wait"
                : "pointer",
              opacity: kaydediliyor
                ? 0.75
                : 1,
            }}
          >
            {kaydediliyor
              ? "KAYDEDİLİYOR..."
              : "💾 Sayım Tutarını Kaydet"}
          </button>

          <hr style={{ margin: "28px 0" }} />

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={paraEkle}
              disabled={!hazir || kaydediliyor || !!veriHatasi}
              style={{
                ...yesil,
                opacity: kaydediliyor
                  ? 0.6
                  : 1,
              }}
            >
              ➕ Para Ekle
            </button>

            <button
              onClick={paraCikar}
              disabled={!hazir || kaydediliyor || !!veriHatasi}
              style={{
                ...gri,
                opacity: kaydediliyor
                  ? 0.6
                  : 1,
              }}
            >
              ➖ Para Çıkar
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}