"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CariKaydi = {
  id: number;
  firma: string;
  tip: "Borç" | "Alacak";
  tutar: number;
  aciklama: string;
  tarih: string;
};

export default function Cari() {
  const [firma, setFirma] = useState("");
  const [tip, setTip] = useState<"Borç" | "Alacak">("Borç");
  const [tutar, setTutar] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [kayitlar, setKayitlar] = useState<CariKaydi[]>([]);

  useEffect(() => {
    const veri = localStorage.getItem("aristo-cari");

    if (veri) {
      setKayitlar(JSON.parse(veri));
    }
  }, []);

  function kaydet() {
    if (!firma || Number(tutar) <= 0) {
      alert("Firma ve tutar giriniz.");
      return;
    }

    const yeniKayit: CariKaydi = {
      id: Date.now(),
      firma,
      tip,
      tutar: Number(tutar),
      aciklama,
      tarih: new Date().toLocaleString("tr-TR"),
    };

    const yeniListe = [yeniKayit, ...kayitlar];

    setKayitlar(yeniListe);
    localStorage.setItem("aristo-cari", JSON.stringify(yeniListe));

    setFirma("");
    setTutar("");
    setAciklama("");

    alert("Cari kayıt eklendi.");
  }

  function sil(id: number) {
    const yeniListe = kayitlar.filter((k) => k.id !== id);

    setKayitlar(yeniListe);
    localStorage.setItem("aristo-cari", JSON.stringify(yeniListe));
  }

  const toplamBorc = kayitlar
    .filter((k) => k.tip === "Borç")
    .reduce((t, k) => t + k.tutar, 0);

  const toplamAlacak = kayitlar
    .filter((k) => k.tip === "Alacak")
    .reduce((t, k) => t + k.tutar, 0);

  const bakiye = toplamBorc - toplamAlacak;

  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Link href="/">← Ana Sayfa</Link>

      <h1>👥 Cari Hesaplar</h1>

      <hr />

      <label>Firma</label>

      <br />

      <input
        value={firma}
        onChange={(e) => setFirma(e.target.value)}
        placeholder="Örneğin: Coca-Cola"
      />

      <br />
      <br />

      <label>İşlem Tipi</label>

      <br />

      <select
        value={tip}
        onChange={(e) =>
          setTip(e.target.value as "Borç" | "Alacak")
        }
      >
        <option>Borç</option>
        <option>Alacak</option>
      </select>

      <br />
      <br />

      <label>Tutar</label>

      <br />

      <input
        type="number"
        value={tutar}
        onChange={(e) => setTutar(e.target.value)}
        placeholder="0"
      />

      <br />
      <br />

      <label>Açıklama</label>

      <br />

      <input
        value={aciklama}
        onChange={(e) => setAciklama(e.target.value)}
        placeholder="İsteğe bağlı"
      />

      <br />
      <br />

      <button onClick={kaydet}>
        💾 Kaydet
      </button>

      <hr />

      <h2>Toplam Borç : ₺{toplamBorc}</h2>
      <h2>Toplam Alacak : ₺{toplamAlacak}</h2>
      <h2>Net Bakiye : ₺{bakiye}</h2>

      <hr />

      <h2>Cari Hareketleri</h2>

      {kayitlar.length === 0 ? (
        <p>Kayıt yok.</p>
      ) : (
        <ul>
          {kayitlar.map((k) => (
            <li
              key={k.id}
              style={{
                marginBottom: "20px",
                borderBottom: "1px solid #ddd",
                paddingBottom: "10px",
              }}
            >
              <strong>{k.firma}</strong>

              <br />

              {k.tip} - ₺{k.tutar}

              <br />

              {k.aciklama}

              <br />

              <small>{k.tarih}</small>

              <br />
              <br />

              <button onClick={() => sil(k.id)}>
                🗑️ Sil
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}