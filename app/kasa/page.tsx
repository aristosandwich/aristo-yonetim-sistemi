"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function para(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(tutar);
}

export default function Kasa() {
  const [acilis, setAcilis] = useState("");
  const [kasadakiPara, setKasadakiPara] = useState(0);

  useEffect(() => {
    const veri = localStorage.getItem("aristo-kasa");

    if (veri) {
      setKasadakiPara(Number(veri));
    }
  }, []);

  function kaydet(yeniTutar: number) {
    setKasadakiPara(yeniTutar);
    localStorage.setItem("aristo-kasa", String(yeniTutar));
  }

  function kasaAc() {
    const tutar = Number(acilis);

    if (tutar < 0) {
      alert("Geçerli tutar gir.");
      return;
    }

    kaydet(tutar);
    alert("Kasa açılışı kaydedildi.");
  }

  function paraEkle() {
    const miktar = Number(prompt("Kasaya eklenecek tutar"));

    if (!miktar || miktar <= 0) return;

    kaydet(kasadakiPara + miktar);
  }

  function paraCikar() {
    const miktar = Number(prompt("Kasadan çıkacak tutar"));

    if (!miktar || miktar <= 0) return;

    kaydet(kasadakiPara - miktar);
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
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <Link href="/">← Ana Sayfaya Dön</Link>

        <h1>💵 Kasa</h1>

        <div style={{ ...kart, marginBottom: "22px" }}>
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
            onChange={(e) => setAcilis(e.target.value)}
            style={{ ...input, margin: "8px 0 18px" }}
          />

          <button
            onClick={kasaAc}
            style={yesil}
          >
            💾 Açılışı Kaydet
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
              style={yesil}
            >
              ➕ Para Ekle
            </button>

            <button
              onClick={paraCikar}
              style={gri}
            >
              ➖ Para Çıkar
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}