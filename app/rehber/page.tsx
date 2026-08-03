"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RehberKaydi = {
  id: number;
  ad: string;
  tur: "Tedarikçi" | "Müşteri" | "Personel" | "Diğer";
  telefon: string;
  not: string;
};

export default function Rehber() {
  const [ad, setAd] = useState("");
  const [tur, setTur] = useState<RehberKaydi["tur"]>("Tedarikçi");
  const [telefon, setTelefon] = useState("");
  const [not, setNot] = useState("");
  const [kayitlar, setKayitlar] = useState<RehberKaydi[]>([]);
  const [arama, setArama] = useState("");

  useEffect(() => {
    const veri = localStorage.getItem("aristo-rehber");

    if (veri) {
      setKayitlar(JSON.parse(veri));
    }
  }, []);

  function kaydet() {
    if (!ad.trim()) {
      alert("Ad gir.");
      return;
    }

    const yeniKayit: RehberKaydi = {
      id: Date.now(),
      ad: ad.trim(),
      tur,
      telefon: telefon.trim(),
      not: not.trim(),
    };

    const yeniListe = [yeniKayit, ...kayitlar];

    setKayitlar(yeniListe);
    localStorage.setItem("aristo-rehber", JSON.stringify(yeniListe));

    setAd("");
    setTur("Tedarikçi");
    setTelefon("");
    setNot("");
  }

  function sil(id: number) {
    const onay = window.confirm("Bu rehber kaydı silinsin mi?");

    if (!onay) return;

    const yeniListe = kayitlar.filter((kayit) => kayit.id !== id);

    setKayitlar(yeniListe);
    localStorage.setItem("aristo-rehber", JSON.stringify(yeniListe));
  }

  const filtrelenmisKayitlar = kayitlar.filter((kayit) => {
    const aranan = arama.trim().toLocaleLowerCase("tr-TR");

    if (!aranan) return true;

    const metin = `${kayit.ad} ${kayit.tur} ${kayit.telefon} ${kayit.not}`
      .toLocaleLowerCase("tr-TR");

    return metin.includes(aranan);
  });

  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Link href="/">← Ana Sayfaya Dön</Link>

      <h1>📒 Müşteri ve Tedarikçi Rehberi</h1>

      <hr />

      <label>Ad / Firma</label>
      <br />
      <input
        value={ad}
        onChange={(event) => setAd(event.target.value)}
        placeholder="Örneğin: Coca-Cola"
      />

      <br />
      <br />

      <label>Tür</label>
      <br />
      <select
        value={tur}
        onChange={(event) =>
          setTur(event.target.value as RehberKaydi["tur"])
        }
      >
        <option>Tedarikçi</option>
        <option>Müşteri</option>
        <option>Personel</option>
        <option>Diğer</option>
      </select>

      <br />
      <br />

      <label>Telefon</label>
      <br />
      <input
        value={telefon}
        onChange={(event) => setTelefon(event.target.value)}
        placeholder="Telefon numarası"
      />

      <br />
      <br />

      <label>Not</label>
      <br />
      <input
        value={not}
        onChange={(event) => setNot(event.target.value)}
        placeholder="İsteğe bağlı"
      />

      <br />
      <br />

      <button onClick={kaydet}>💾 Kaydet</button>

      <hr />

      <h2>🔍 Ara</h2>

      <input
        value={arama}
        onChange={(event) => setArama(event.target.value)}
        placeholder="Firma, tür veya telefon ara"
        style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
      />

      <hr />

      <h2>Kayıtlar</h2>

      {filtrelenmisKayitlar.length === 0 ? (
        <p>Kayıt yok.</p>
      ) : (
        <ul>
          {filtrelenmisKayitlar.map((kayit) => (
            <li key={kayit.id} style={{ marginBottom: "22px" }}>
              <strong>{kayit.ad}</strong>
              <br />
              Tür: {kayit.tur}
              <br />
              Telefon: {kayit.telefon || "-"}
              <br />
              Not: {kayit.not || "-"}
              <br />
              <br />
              <button onClick={() => sil(kayit.id)}>🗑️ Sil</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}