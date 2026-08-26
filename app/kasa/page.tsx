"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function para(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(tutar);
}

function yerelKasaOnbelleginiGuncelle(
  tutar: number
) {
  localStorage.setItem(
    "aristo-kasa",
    String(tutar)
  );

  window.dispatchEvent(new Event("storage"));
}

export default function Kasa() {
  const [acilis, setAcilis] = useState("");
  const [kasadakiPara, setKasadakiPara] =
    useState(0);
  const [kaydediliyor, setKaydediliyor] =
    useState(false);

  useEffect(() => {
    let aktif = true;

    async function kasayiYukle() {
      const { data, error } = await supabase
        .from("kasa")
        .select("id, tutar")
        .eq("id", 1)
        .maybeSingle();

      if (!aktif) {
        return;
      }

      if (error) {
        console.error("Kasa okunamadı:", error);
        window.alert(
          "Kasa buluttan okunamadı."
        );
        return;
      }

      if (data) {
        const bulutTutari = Number(
          data.tutar || 0
        );

        setKasadakiPara(bulutTutari);
        yerelKasaOnbelleginiGuncelle(
          bulutTutari
        );
        return;
      }

      const yerelVeri =
        localStorage.getItem("aristo-kasa");

      const ilkTutar =
        yerelVeri === null
          ? 0
          : Number(yerelVeri || 0);

      const { error: aktarimHatasi } =
        await supabase.from("kasa").upsert(
          {
            id: 1,
            tutar: ilkTutar,
            updated_at:
              new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (!aktif) {
        return;
      }

      if (aktarimHatasi) {
        console.error(
          "Eski kasa tutarı buluta aktarılamadı:",
          aktarimHatasi
        );
        window.alert(
          "Eski kasa tutarı buluta aktarılamadı."
        );
        return;
      }

      setKasadakiPara(ilkTutar);
      yerelKasaOnbelleginiGuncelle(
        ilkTutar
      );
    }

    kasayiYukle();

    return () => {
      aktif = false;
    };
  }, []);

  async function kaydet(
    yeniTutar: number
  ): Promise<boolean> {
    if (kaydediliyor) {
      return false;
    }

    setKaydediliyor(true);

    const { error } = await supabase
      .from("kasa")
      .upsert(
        {
          id: 1,
          tutar: yeniTutar,
          updated_at:
            new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error(
        "Kasa kaydedilemedi:",
        error
      );
      window.alert(
        "Kasa buluta kaydedilemedi. Mevcut bakiye korunuyor."
      );
      setKaydediliyor(false);
      return false;
    }

    setKasadakiPara(yeniTutar);
    yerelKasaOnbelleginiGuncelle(
      yeniTutar
    );
    setKaydediliyor(false);
    return true;
  }

  async function kasaAc() {
    const tutar = Number(acilis);

    if (tutar < 0) {
      alert("Geçerli tutar gir.");
      return;
    }

    const kaydedildi = await kaydet(tutar);

    if (kaydedildi) {
      alert("Kasa açılışı kaydedildi.");
    }
  }

  async function paraEkle() {
    const miktar = Number(
      prompt("Kasaya eklenecek tutar")
    );

    if (!miktar || miktar <= 0) return;

    await kaydet(kasadakiPara + miktar);
  }

  async function paraCikar() {
    const miktar = Number(
      prompt("Kasadan çıkacak tutar")
    );

    if (!miktar || miktar <= 0) return;

    await kaydet(kasadakiPara - miktar);
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
          <label>Kasa Açılış Tutarı</label>

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
            disabled={kaydediliyor}
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
              : "💾 Açılışı Kaydet"}
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
              disabled={kaydediliyor}
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
              disabled={kaydediliyor}
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