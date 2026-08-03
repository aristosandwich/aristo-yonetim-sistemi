"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type NotKaydi = {
  id: number;
  tarih: string;
  metin: string;
};

export default function Notlar() {
  const [not, setNot] = useState("");
  const [notlar, setNotlar] = useState<NotKaydi[]>([]);

  useEffect(() => {
    const veri = localStorage.getItem("aristo-notlar");

    if (veri) {
      setNotlar(JSON.parse(veri));
    }
  }, []);

  function kaydet() {
    if (not.trim() === "") {
      alert("Not boş olamaz.");
      return;
    }

    const yeniNot: NotKaydi = {
      id: Date.now(),
      tarih: new Date().toLocaleString("tr-TR"),
      metin: not,
    };

    const yeniListe = [yeniNot, ...notlar];

    setNotlar(yeniListe);
    localStorage.setItem(
      "aristo-notlar",
      JSON.stringify(yeniListe)
    );

    setNot("");
  }

  function sil(id: number) {
    if (!confirm("Not silinsin mi?")) return;

    const yeniListe = notlar.filter((n) => n.id !== id);

    setNotlar(yeniListe);

    localStorage.setItem(
      "aristo-notlar",
      JSON.stringify(yeniListe)
    );
  }

  return (
    <main
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial",
      }}
    >
      <Link href="/">← Ana Sayfaya Dön</Link>

      <h1>📝 Notlar</h1>

      <textarea
        rows={5}
        style={{ width: "100%" }}
        value={not}
        onChange={(e) => setNot(e.target.value)}
        placeholder="Bugünkü notunu yaz..."
      />

      <br />
      <br />

      <button onClick={kaydet}>
        💾 Notu Kaydet
      </button>

      <hr />

      <h2>Kayıtlı Notlar</h2>

      {notlar.length === 0 ? (
        <p>Henüz not yok.</p>
      ) : (
        <ul>
          {notlar.map((n) => (
            <li
              key={n.id}
              style={{
                marginBottom: "20px",
              }}
            >
              <strong>{n.tarih}</strong>

              <br />

              {n.metin}

              <br />
              <br />

              <button
                onClick={() => sil(n.id)}
              >
                🗑️ Sil
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}