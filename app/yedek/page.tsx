"use client";

import Link from "next/link";
import { ChangeEvent, useRef } from "react";

const veriAnahtarlari = [
  "aristo-satislar",
  "aristo-giderler",
  "aristo-tahsilatlar",
  "aristo-mudo-faturalar",
  "aristo-mudo-odemeler",
  "aristo-cari",
  "aristo-rehber",
  "aristo-takvim",
  "aristo-kasa",
  "aristo-notlar",
  "aristo-ayarlar",
  "aristo-urunler",
  "aristo-malzemeler",
  "aristo-receteler",
];

export default function Yedekleme() {
  const dosyaSecici = useRef<HTMLInputElement>(null);

  function yedekIndir() {
    const yedek: Record<string, unknown> = {};

    veriAnahtarlari.forEach((anahtar) => {
      const veri = localStorage.getItem(anahtar);

      if (veri === null) {
        yedek[anahtar] = null;
        return;
      }

      try {
        yedek[anahtar] = JSON.parse(veri);
      } catch {
        yedek[anahtar] = veri;
      }
    });

    const dosya = new Blob([JSON.stringify(yedek, null, 2)], {
      type: "application/json",
    });

    const adres = URL.createObjectURL(dosya);
    const baglanti = document.createElement("a");
    const tarih = new Date().toISOString().slice(0, 10);

    baglanti.href = adres;
    baglanti.download = `aristo-tam-yedek-${tarih}.json`;
    baglanti.click();

    URL.revokeObjectURL(adres);
  }

  function dosyaSec() {
    dosyaSecici.current?.click();
  }

  function yedekYukle(event: ChangeEvent<HTMLInputElement>) {
    const dosya = event.target.files?.[0];

    if (!dosya) return;

    const okuyucu = new FileReader();

    okuyucu.onload = () => {
      try {
        const yedek = JSON.parse(String(okuyucu.result));

        veriAnahtarlari.forEach((anahtar) => {
          const veri = yedek[anahtar];

          if (veri === undefined || veri === null) return;

          if (typeof veri === "string") {
            localStorage.setItem(anahtar, veri);
          } else {
            localStorage.setItem(anahtar, JSON.stringify(veri));
          }
        });

        alert("Bütün Aristo verileri geri yüklendi.");
      } catch {
        alert("Bu dosya geçerli bir Aristo yedeği değil.");
      }
    };

    okuyucu.readAsText(dosya);
    event.target.value = "";
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

      <h1>💾 Tam Yedekleme</h1>

      <p>
        Satış, gider, tahsilat, cari, ürün, malzeme, reçete ve diğer tüm
        kayıtları tek dosyada yedekler.
      </p>

      <button onClick={yedekIndir}>⬇️ Tam Yedeği İndir</button>

      <hr style={{ margin: "30px 0" }} />

      <h2>Yedeği Geri Yükle</h2>

      <button onClick={dosyaSec}>⬆️ Yedek Dosyası Seç</button>

      <input
        ref={dosyaSecici}
        type="file"
        accept=".json,application/json"
        onChange={yedekYukle}
        style={{ display: "none" }}
      />
    </main>
  );
}