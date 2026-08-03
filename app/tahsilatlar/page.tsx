"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TahsilatKaydi = {
  id: number;
  tarih: string;
  platform: string;
  donem: string;
  tutar: number;
};

export default function Tahsilatlar() {
  const [platform, setPlatform] = useState("GetirYemek");
  const [donem, setDonem] = useState("");
  const [tutar, setTutar] = useState("");
  const [kayitlar, setKayitlar] = useState<TahsilatKaydi[]>([]);
  const [duzenlenenId, setDuzenlenenId] = useState<number | null>(null);

  const [arama, setArama] = useState("");
  const [baslangicTarihi, setBaslangicTarihi] = useState("");
  const [bitisTarihi, setBitisTarihi] = useState("");

  useEffect(() => {
    const eskiKayitlar = localStorage.getItem("aristo-tahsilatlar");

    if (eskiKayitlar) {
      setKayitlar(JSON.parse(eskiKayitlar));
    }
  }, []);

  function formuTemizle() {
    setPlatform("GetirYemek");
    setDonem("");
    setTutar("");
    setDuzenlenenId(null);
  }

  function kaydet() {
    const netTutar = Number(tutar);

    if (netTutar <= 0) {
      alert("Lütfen net yatan tutarı gir.");
      return;
    }

    if (duzenlenenId !== null) {
      const yeniKayitlar = kayitlar.map((kayit) =>
        kayit.id === duzenlenenId
          ? {
              ...kayit,
              platform,
              donem,
              tutar: netTutar,
            }
          : kayit
      );

      setKayitlar(yeniKayitlar);
      localStorage.setItem(
        "aristo-tahsilatlar",
        JSON.stringify(yeniKayitlar)
      );

      formuTemizle();
      alert("Tahsilat kaydı güncellendi.");
      return;
    }

    const yeniKayit: TahsilatKaydi = {
      id: Date.now(),
      tarih: new Date().toLocaleString("tr-TR"),
      platform,
      donem,
      tutar: netTutar,
    };

    const yeniKayitlar = [yeniKayit, ...kayitlar];

    setKayitlar(yeniKayitlar);
    localStorage.setItem(
      "aristo-tahsilatlar",
      JSON.stringify(yeniKayitlar)
    );

    formuTemizle();
    alert("Tahsilat kaydedildi.");
  }

  function kaydiDuzenle(kayit: TahsilatKaydi) {
    setPlatform(kayit.platform);
    setDonem(kayit.donem);
    setTutar(String(kayit.tutar));
    setDuzenlenenId(kayit.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function kaydiSil(id: number) {
    const onay = window.confirm(
      "Bu tahsilat kaydını silmek istiyor musun?"
    );

    if (!onay) return;

    const yeniKayitlar = kayitlar.filter(
      (kayit) => kayit.id !== id
    );

    setKayitlar(yeniKayitlar);
    localStorage.setItem(
      "aristo-tahsilatlar",
      JSON.stringify(yeniKayitlar)
    );

    if (duzenlenenId === id) {
      formuTemizle();
    }
  }

  function filtreyiTemizle() {
    setArama("");
    setBaslangicTarihi("");
    setBitisTarihi("");
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
      const metin = `${kayit.platform} ${kayit.donem}`
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

      <h1>💳 Tahsilat Girişi</h1>

      {duzenlenenId !== null && (
        <p style={{ color: "#b45309" }}>
          ✏️ Bir tahsilat kaydını düzenliyorsun.
        </p>
      )}

      <hr />

      <label>Platform</label>
      <br />

      <select
        value={platform}
        onChange={(event) => setPlatform(event.target.value)}
      >
        <option>GetirYemek</option>
        <option>Trendyol</option>
        <option>Yemeksepeti</option>
      </select>

      <br />
      <br />

      <label>Dönem</label>
      <br />

      <input
        type="text"
        placeholder="Örneğin: 1-3 Ağustos"
        value={donem}
        onChange={(event) => setDonem(event.target.value)}
      />

      <br />
      <br />

      <label>Net Yatan Tutar (₺)</label>
      <br />

      <input
        type="number"
        placeholder="0"
        value={tutar}
        onChange={(event) => setTutar(event.target.value)}
      />

      <br />
      <br />

      <button onClick={kaydet}>
        {duzenlenenId !== null
          ? "💾 Değişiklikleri Kaydet"
          : "💾 Tahsilatı Kaydet"}
      </button>

      {duzenlenenId !== null && (
        <>
          {" "}
          <button onClick={formuTemizle}>İptal</button>
        </>
      )}

      <hr style={{ margin: "30px 0" }} />

      <h2>🔍 Tahsilatları Filtrele</h2>

      <label>Platform veya Dönem Ara</label>
      <br />

      <input
        type="text"
        placeholder="Örneğin: Trendyol"
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

      <h2>
        Gösterilen Tahsilat Toplamı: {para(filtrelenmisToplam)}
      </h2>

      <h2>Tahsilat Kayıtları</h2>

      {filtrelenmisKayitlar.length === 0 ? (
        <p>Bu filtrelere uygun tahsilat kaydı yok.</p>
      ) : (
        <ul>
          {filtrelenmisKayitlar.map((kayit) => (
            <li key={kayit.id} style={{ marginBottom: "22px" }}>
              <strong>{kayit.platform}</strong>
              <br />
              Kayıt tarihi: {kayit.tarih}
              <br />
              Dönem: {kayit.donem || "-"}
              <br />
              Net yatan: {para(kayit.tutar)}
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