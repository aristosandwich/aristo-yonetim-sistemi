"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type GiderKaydi = {
  id: number;
  tarih: string;
  kategori: string;
  tutar: number;
  aciklama: string;
};

export default function Giderler() {
  const [kategori, setKategori] = useState("Coca-Cola");
  const [tutar, setTutar] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [kayitlar, setKayitlar] = useState<GiderKaydi[]>([]);
  const [duzenlenenId, setDuzenlenenId] = useState<number | null>(null);

  const [baslangicTarihi, setBaslangicTarihi] = useState("");
  const [bitisTarihi, setBitisTarihi] = useState("");
  const [arama, setArama] = useState("");

  useEffect(() => {
    const eskiKayitlar = localStorage.getItem("aristo-giderler");

    if (eskiKayitlar) {
      setKayitlar(JSON.parse(eskiKayitlar));
    }
  }, []);

  function formuTemizle() {
    setKategori("Coca-Cola");
    setTutar("");
    setAciklama("");
    setDuzenlenenId(null);
  }

  function kaydet() {
    const giderTutari = Number(tutar);

    if (giderTutari <= 0) {
      alert("Lütfen gider tutarını gir.");
      return;
    }

    if (duzenlenenId !== null) {
      const yeniKayitlar = kayitlar.map((kayit) =>
        kayit.id === duzenlenenId
          ? {
              ...kayit,
              kategori,
              tutar: giderTutari,
              aciklama,
            }
          : kayit
      );

      setKayitlar(yeniKayitlar);
      localStorage.setItem(
        "aristo-giderler",
        JSON.stringify(yeniKayitlar)
      );

      formuTemizle();
      alert("Gider kaydı güncellendi.");
      return;
    }

    const yeniKayit: GiderKaydi = {
      id: Date.now(),
      tarih: new Date().toLocaleString("tr-TR"),
      kategori,
      tutar: giderTutari,
      aciklama,
    };

    const yeniKayitlar = [yeniKayit, ...kayitlar];

    setKayitlar(yeniKayitlar);
    localStorage.setItem(
      "aristo-giderler",
      JSON.stringify(yeniKayitlar)
    );

    formuTemizle();
    alert("Gider kaydedildi.");
  }

  function kaydiDuzenle(kayit: GiderKaydi) {
    setKategori(kayit.kategori);
    setTutar(String(kayit.tutar));
    setAciklama(kayit.aciklama);
    setDuzenlenenId(kayit.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function kaydiSil(id: number) {
    const onay = window.confirm(
      "Bu gider kaydını silmek istiyor musun?"
    );

    if (!onay) return;

    const yeniKayitlar = kayitlar.filter(
      (kayit) => kayit.id !== id
    );

    setKayitlar(yeniKayitlar);
    localStorage.setItem(
      "aristo-giderler",
      JSON.stringify(yeniKayitlar)
    );

    if (duzenlenenId === id) {
      formuTemizle();
    }
  }

  function filtreyiTemizle() {
    setBaslangicTarihi("");
    setBitisTarihi("");
    setArama("");
  }

  const filtrelenmisKayitlar = kayitlar.filter((kayit) => {
    const kayitTarihi = new Date(kayit.id);

    if (baslangicTarihi) {
      const baslangic = new Date(`${baslangicTarihi}T00:00:00`);

      if (kayitTarihi < baslangic) {
        return false;
      }
    }

    if (bitisTarihi) {
      const bitis = new Date(`${bitisTarihi}T23:59:59`);

      if (kayitTarihi > bitis) {
        return false;
      }
    }

    const aranan = arama.trim().toLocaleLowerCase("tr-TR");

    if (aranan) {
      const metin = `${kayit.kategori} ${kayit.aciklama}`
        .toLocaleLowerCase("tr-TR");

      if (!metin.includes(aranan)) {
        return false;
      }
    }

    return true;
  });

  const filtrelenmisToplam = filtrelenmisKayitlar.reduce(
    (toplam, kayit) => toplam + kayit.tutar,
    0
  );

  const para = (deger: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(deger);

  return (
    <main
      style={{
        maxWidth: "750px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Link href="/">← Ana Sayfaya Dön</Link>

      <h1>💸 Gider Girişi</h1>

      {duzenlenenId !== null && (
        <p style={{ color: "#b45309" }}>
          ✏️ Bir gider kaydını düzenliyorsun.
        </p>
      )}

      <hr />

      <label>Gider Yeri / Kategorisi</label>
      <br />

      <select
        value={kategori}
        onChange={(event) => setKategori(event.target.value)}
      >
        <option>Coca-Cola</option>
        <option>Metro Market</option>
        <option>Mudo Toptan</option>
        <option>Kira</option>
        <option>Elektrik</option>
        <option>Su</option>
        <option>Personel</option>
        <option>Diğer</option>
      </select>

      <br />
      <br />

      <label>Tutar (₺)</label>
      <br />

      <input
        type="number"
        placeholder="0"
        value={tutar}
        onChange={(event) => setTutar(event.target.value)}
      />

      <br />
      <br />

      <label>Açıklama</label>
      <br />

      <input
        type="text"
        placeholder="Örneğin: İçecek faturası"
        value={aciklama}
        onChange={(event) => setAciklama(event.target.value)}
      />

      <br />
      <br />

      <button onClick={kaydet}>
        {duzenlenenId !== null
          ? "💾 Değişiklikleri Kaydet"
          : "💾 Gideri Kaydet"}
      </button>

      {duzenlenenId !== null && (
        <>
          {" "}
          <button onClick={formuTemizle}>İptal</button>
        </>
      )}

      <hr style={{ margin: "30px 0" }} />

      <h2>🔍 Giderleri Filtrele</h2>

      <label>Arama</label>
      <br />

      <input
        type="text"
        placeholder="Örneğin: Coca-Cola"
        value={arama}
        onChange={(event) => setArama(event.target.value)}
      />

      <br />
      <br />

      <label>Başlangıç Tarihi</label>
      <br />

      <input
        type="date"
        value={baslangicTarihi}
        onChange={(event) => setBaslangicTarihi(event.target.value)}
      />

      <br />
      <br />

      <label>Bitiş Tarihi</label>
      <br />

      <input
        type="date"
        value={bitisTarihi}
        onChange={(event) => setBitisTarihi(event.target.value)}
      />

      <br />
      <br />

      <button onClick={filtreyiTemizle}>
        Filtreyi Temizle
      </button>

      <h2>Gösterilen Gider Toplamı: {para(filtrelenmisToplam)}</h2>

      <h2>Gider Kayıtları</h2>

      {filtrelenmisKayitlar.length === 0 ? (
        <p>Bu filtrelere uygun gider kaydı yok.</p>
      ) : (
        <ul>
          {filtrelenmisKayitlar.map((kayit) => (
            <li
              key={kayit.id}
              style={{ marginBottom: "22px" }}
            >
              <strong>{kayit.kategori}</strong>
              <br />
              {kayit.tarih}
              <br />
              Tutar: {para(kayit.tutar)}
              <br />
              Açıklama: {kayit.aciklama || "-"}
              <br />
              <br />

              <button onClick={() => kaydiDuzenle(kayit)}>
                ✏️ Düzenle
              </button>

              {" "}

              <button onClick={() => kaydiSil(kayit.id)}>
                🗑️ Sil
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}