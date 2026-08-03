"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Kategori = "Sandviç" | "Salata" | "İçecek" | "Ek Ürün";

type Urun = {
  id: number;
  ad: string;
  kategori: Kategori;
  satisFiyati: number;
  maliyet: number;
  aktif: boolean;
};

type Malzeme = {
  id: number;
  birimFiyat: number;
};

type ReceteSatiri = {
  malzemeId: number;
  gramaj: number;
};

type Recete = {
  urunId: number;
  malzemeler: ReceteSatiri[];
};

const varsayilanUrunler: Urun[] = [
  { id: 1, ad: "Thales", kategori: "Sandviç", satisFiyati: 250, maliyet: 0, aktif: true },
  { id: 2, ad: "Pisagor", kategori: "Sandviç", satisFiyati: 250, maliyet: 0, aktif: true },
  { id: 3, ad: "Heredot", kategori: "Sandviç", satisFiyati: 300, maliyet: 0, aktif: true },
  { id: 4, ad: "Demokritos", kategori: "Sandviç", satisFiyati: 300, maliyet: 0, aktif: true },
  { id: 5, ad: "Öklid", kategori: "Sandviç", satisFiyati: 250, maliyet: 0, aktif: true },
  { id: 6, ad: "Erasmus", kategori: "Sandviç", satisFiyati: 200, maliyet: 0, aktif: true },
  { id: 7, ad: "Diyojen", kategori: "Sandviç", satisFiyati: 300, maliyet: 0, aktif: true },
  { id: 8, ad: "Aristo", kategori: "Sandviç", satisFiyati: 325, maliyet: 0, aktif: true },
  { id: 9, ad: "Spinoza", kategori: "Sandviç", satisFiyati: 350, maliyet: 0, aktif: true },
  { id: 10, ad: "Sokrates", kategori: "Sandviç", satisFiyati: 300, maliyet: 0, aktif: true },
  { id: 11, ad: "Kopernik", kategori: "Sandviç", satisFiyati: 300, maliyet: 0, aktif: true },
  { id: 12, ad: "Platon", kategori: "Sandviç", satisFiyati: 400, maliyet: 0, aktif: true },
  { id: 13, ad: "Heraklitos", kategori: "Sandviç", satisFiyati: 250, maliyet: 0, aktif: true },

  { id: 14, ad: "Ton Balıklı Salata", kategori: "Salata", satisFiyati: 400, maliyet: 0, aktif: true },
  { id: 15, ad: "Tulum Peynirli & Cevizli Salata", kategori: "Salata", satisFiyati: 400, maliyet: 0, aktif: true },
  { id: 16, ad: "Hellim Salata", kategori: "Salata", satisFiyati: 400, maliyet: 0, aktif: true },
  { id: 17, ad: "Akdeniz Salata", kategori: "Salata", satisFiyati: 400, maliyet: 0, aktif: true },
  { id: 18, ad: "Aristo Club Salata", kategori: "Salata", satisFiyati: 400, maliyet: 0, aktif: true },

  { id: 19, ad: "Portakal Suyu %100", kategori: "İçecek", satisFiyati: 125, maliyet: 0, aktif: true },
  { id: 20, ad: "Ayran", kategori: "İçecek", satisFiyati: 75, maliyet: 0, aktif: true },
  { id: 21, ad: "Coca-Cola", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 22, ad: "Coca-Cola Zero", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 23, ad: "Cappy Karışık Meyve Suyu", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 24, ad: "Cappy Vişne Meyve Suyu", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 25, ad: "Fanta", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 26, ad: "Sprite", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 27, ad: "Fuse Tea Limon", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 28, ad: "Fuse Tea Şeftali", kategori: "İçecek", satisFiyati: 100, maliyet: 0, aktif: true },
  { id: 29, ad: "Sade Soda", kategori: "İçecek", satisFiyati: 30, maliyet: 0, aktif: true },
  { id: 30, ad: "Su", kategori: "İçecek", satisFiyati: 20, maliyet: 0, aktif: true },
  { id: 31, ad: "Filtre Kahve", kategori: "İçecek", satisFiyati: 125, maliyet: 0, aktif: true },

  { id: 32, ad: "Esmer Baget Farkı", kategori: "Ek Ürün", satisFiyati: 30, maliyet: 0, aktif: true },
];

export default function Urunler() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);
  const [receteler, setReceteler] = useState<Recete[]>([]);
  const [arama, setArama] = useState("");
  const [kategori, setKategori] = useState<"Tümü" | Kategori>("Tümü");

  useEffect(() => {
    const kayitliUrunler = localStorage.getItem("aristo-urunler");

    if (kayitliUrunler) {
      setUrunler(JSON.parse(kayitliUrunler));
    } else {
      setUrunler(varsayilanUrunler);
      localStorage.setItem(
        "aristo-urunler",
        JSON.stringify(varsayilanUrunler)
      );
    }

    setMalzemeler(
      JSON.parse(localStorage.getItem("aristo-malzemeler") || "[]")
    );

    setReceteler(
      JSON.parse(localStorage.getItem("aristo-receteler") || "[]")
    );
  }, []);

  function guncelle(
    id: number,
    alan: "satisFiyati" | "aktif",
    deger: number | boolean
  ) {
    const yeniListe = urunler.map((urun) =>
      urun.id === id ? { ...urun, [alan]: deger } : urun
    );

    setUrunler(yeniListe);
    localStorage.setItem("aristo-urunler", JSON.stringify(yeniListe));
  }

  function varsayilanaDon() {
    const onay = window.confirm(
      "Ürünler ilk menü fiyatlarına dönsün mü?"
    );

    if (!onay) return;

    setUrunler(varsayilanUrunler);
    localStorage.setItem(
      "aristo-urunler",
      JSON.stringify(varsayilanUrunler)
    );
  }

  function maliyetHesapla(urunId: number) {
    const recete = receteler.find(
      (kayit) => kayit.urunId === urunId
    );

    if (!recete) return 0;

    return recete.malzemeler.reduce((toplam, satir) => {
      const malzeme = malzemeler.find(
        (kayit) => kayit.id === satir.malzemeId
      );

      if (!malzeme) return toplam;

      return (
        toplam +
        (Number(malzeme.birimFiyat || 0) / 1000) *
          Number(satir.gramaj || 0)
      );
    }, 0);
  }

  const filtrelenmisUrunler = useMemo(() => {
    const aranan = arama.trim().toLocaleLowerCase("tr-TR");

    return urunler.filter((urun) => {
      const kategoriUygun =
        kategori === "Tümü" || urun.kategori === kategori;

      const aramaUygun =
        !aranan ||
        urun.ad.toLocaleLowerCase("tr-TR").includes(aranan);

      return kategoriUygun && aramaUygun;
    });
  }, [urunler, arama, kategori]);

  const para = (tutar: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(tutar);

  return (
    <main
      style={{
        maxWidth: "1050px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Link href="/">← Ana Sayfaya Dön</Link>

      <h1>🧾 Ürünler</h1>

      <label>Ürün Ara</label>
      <br />

      <input
        value={arama}
        onChange={(event) => setArama(event.target.value)}
        placeholder="Örneğin: Aristo"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "10px",
          boxSizing: "border-box",
        }}
      />

      <br />
      <br />

      <label>Kategori</label>
      <br />

      <select
        value={kategori}
        onChange={(event) =>
          setKategori(event.target.value as "Tümü" | Kategori)
        }
      >
        <option>Tümü</option>
        <option>Sandviç</option>
        <option>Salata</option>
        <option>İçecek</option>
        <option>Ek Ürün</option>
      </select>

      <br />
      <br />

      <button onClick={varsayilanaDon}>
        ↩️ Menü Fiyatlarına Dön
      </button>

      <hr style={{ margin: "30px 0" }} />

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "800px",
          }}
        >
          <thead>
            <tr>
              <th style={hucre}>Ürün</th>
              <th style={hucre}>Kategori</th>
              <th style={hucre}>Satış Fiyatı</th>
              <th style={hucre}>Otomatik Maliyet</th>
              <th style={hucre}>Birim Kâr</th>
              <th style={hucre}>Kâr Oranı</th>
              <th style={hucre}>Aktif</th>
            </tr>
          </thead>

          <tbody>
            {filtrelenmisUrunler.map((urun) => {
              const maliyet = maliyetHesapla(urun.id);
              const kar = urun.satisFiyati - maliyet;

              const karOrani =
                urun.satisFiyati > 0
                  ? (kar / urun.satisFiyati) * 100
                  : 0;

              return (
                <tr key={urun.id}>
                  <td style={hucre}>
                    <strong>{urun.ad}</strong>
                  </td>

                  <td style={hucre}>{urun.kategori}</td>

                  <td style={hucre}>
                    <input
                      type="number"
                      min="0"
                      value={urun.satisFiyati}
                      onChange={(event) =>
                        guncelle(
                          urun.id,
                          "satisFiyati",
                          Number(event.target.value)
                        )
                      }
                      style={{ width: "90px" }}
                    />
                  </td>

                  <td style={hucre}>{para(maliyet)}</td>

                  <td
                    style={{
                      ...hucre,
                      color: kar >= 0 ? "#15803d" : "#b91c1c",
                    }}
                  >
                    {para(kar)}
                  </td>

                  <td style={hucre}>%{karOrani.toFixed(1)}</td>

                  <td style={hucre}>
                    <input
                      type="checkbox"
                      checked={urun.aktif}
                      onChange={(event) =>
                        guncelle(
                          urun.id,
                          "aktif",
                          event.target.checked
                        )
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const hucre = {
  border: "1px solid #e5e7eb",
  padding: "10px",
  textAlign: "left" as const,
};