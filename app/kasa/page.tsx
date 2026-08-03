"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Kasa() {
  const [acilis, setAcilis] = useState("");
  const [kasadakiPara, setKasadakiPara] = useState(0);

  useEffect(() => {
    const veri = localStorage.getItem("aristo-kasa");

    if (veri) {
      setKasadakiPara(Number(veri));
    }
  }, []);

  function kasaAc() {
    const tutar = Number(acilis);

    if (tutar < 0) {
      alert("Geçerli tutar gir.");
      return;
    }

    setKasadakiPara(tutar);
    localStorage.setItem("aristo-kasa", String(tutar));

    alert("Kasa açılışı kaydedildi.");
  }

  function paraEkle() {
    const miktar = Number(prompt("Kasaya eklenecek tutar"));

    if (!miktar) return;

    const yeni = kasadakiPara + miktar;

    setKasadakiPara(yeni);
    localStorage.setItem("aristo-kasa", String(yeni));
  }

  function paraCikar() {
    const miktar = Number(prompt("Kasadan çıkacak tutar"));

    if (!miktar) return;

    const yeni = kasadakiPara - miktar;

    setKasadakiPara(yeni);
    localStorage.setItem("aristo-kasa", String(yeni));
  }

  const para = (tutar: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(tutar);

  return (
    <main
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Link href="/">← Ana Sayfaya Dön</Link>

      <h1>💵 Kasa</h1>

      <hr />

      <label>Kasa Açılış Tutarı</label>

      <br />

      <input
        type="number"
        value={acilis}
        onChange={(e) => setAcilis(e.target.value)}
      />

      <br />
      <br />

      <button onClick={kasaAc}>💾 Kasa Açılışı Kaydet</button>

      <hr />

      <h2>Kasadaki Para</h2>

      <h1>{para(kasadakiPara)}</h1>

      <button onClick={paraEkle}>➕ Para Ekle</button>

      {" "}

      <button onClick={paraCikar}>➖ Para Çıkar</button>
    </main>
  );
}