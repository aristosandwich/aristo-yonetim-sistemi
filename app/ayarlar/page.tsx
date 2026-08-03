"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Ayarlar() {
  const [isletmeAdi, setIsletmeAdi] = useState("Aristo Sandwich & Salad Bar");
  const [telefon, setTelefon] = useState("");
  const [adres, setAdres] = useState("");
  const [kaydedildi, setKaydedildi] = useState(false);

  useEffect(() => {
    const veri = localStorage.getItem("aristo-ayarlar");

    if (veri) {
      const ayarlar = JSON.parse(veri);

      setIsletmeAdi(ayarlar.isletmeAdi || "");
      setTelefon(ayarlar.telefon || "");
      setAdres(ayarlar.adres || "");
    }
  }, []);

  function kaydet() {
    localStorage.setItem(
      "aristo-ayarlar",
      JSON.stringify({
        isletmeAdi,
        telefon,
        adres,
      })
    );

    setKaydedildi(true);

    setTimeout(() => {
      setKaydedildi(false);
    }, 2000);
  }

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

      <h1>⚙️ Ayarlar</h1>

      <hr />

      <label>İşletme Adı</label>

      <br />

      <input
        type="text"
        value={isletmeAdi}
        onChange={(e) => setIsletmeAdi(e.target.value)}
      />

      <br />
      <br />

      <label>Telefon</label>

      <br />

      <input
        type="text"
        value={telefon}
        onChange={(e) => setTelefon(e.target.value)}
      />

      <br />
      <br />

      <label>Adres</label>

      <br />

      <textarea
        rows={4}
        value={adres}
        onChange={(e) => setAdres(e.target.value)}
      />

      <br />
      <br />

      <button onClick={kaydet}>💾 Kaydet</button>

      {kaydedildi && (
        <p style={{ color: "green" }}>
          ✅ Ayarlar başarıyla kaydedildi.
        </p>
      )}
    </main>
  );
}