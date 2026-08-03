"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TakvimKaydi = {
  id: number;
  baslik: string;
  tarih: string;
  tur: string;
  aciklama: string;
  tamamlandi: boolean;
};

export default function Takvim() {
  const [baslik, setBaslik] = useState("");
  const [tarih, setTarih] = useState("");
  const [tur, setTur] = useState("Ödeme");
  const [aciklama, setAciklama] = useState("");
  const [kayitlar, setKayitlar] = useState<TakvimKaydi[]>([]);

  useEffect(() => {
    const veri = localStorage.getItem("aristo-takvim");

    if (veri) {
      setKayitlar(JSON.parse(veri));
    }
  }, []);

  function kaydet() {
    if (!baslik.trim() || !tarih) {
      alert("Başlık ve tarih gir.");
      return;
    }

    const yeniKayit: TakvimKaydi = {
      id: Date.now(),
      baslik: baslik.trim(),
      tarih,
      tur,
      aciklama: aciklama.trim(),
      tamamlandi: false,
    };

    const yeniListe = [...kayitlar, yeniKayit].sort((a, b) =>
      a.tarih.localeCompare(b.tarih)
    );

    setKayitlar(yeniListe);
    localStorage.setItem("aristo-takvim", JSON.stringify(yeniListe));

    setBaslik("");
    setTarih("");
    setTur("Ödeme");
    setAciklama("");
  }

  function tamamlandiDegistir(id: number) {
    const yeniListe = kayitlar.map((kayit) =>
      kayit.id === id
        ? { ...kayit, tamamlandi: !kayit.tamamlandi }
        : kayit
    );

    setKayitlar(yeniListe);
    localStorage.setItem("aristo-takvim", JSON.stringify(yeniListe));
  }

  function sil(id: number) {
    const onay = window.confirm("Bu kayıt silinsin mi?");

    if (!onay) return;

    const yeniListe = kayitlar.filter((kayit) => kayit.id !== id);

    setKayitlar(yeniListe);
    localStorage.setItem("aristo-takvim", JSON.stringify(yeniListe));
  }

  function tarihiYaz(tarihMetni: string) {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(`${tarihMetni}T12:00:00`));
  }

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

      <h1>📅 Takvim ve Hatırlatmalar</h1>

      <hr />

      <label>Başlık</label>
      <br />
      <input
        type="text"
        placeholder="Örneğin: Mudo ödemesi"
        value={baslik}
        onChange={(event) => setBaslik(event.target.value)}
      />

      <br />
      <br />

      <label>Tarih</label>
      <br />
      <input
        type="date"
        value={tarih}
        onChange={(event) => setTarih(event.target.value)}
      />

      <br />
      <br />

      <label>Tür</label>
      <br />
      <select
        value={tur}
        onChange={(event) => setTur(event.target.value)}
      >
        <option>Ödeme</option>
        <option>Fatura</option>
        <option>Vergi</option>
        <option>Personel</option>
        <option>Sipariş</option>
        <option>Toplantı</option>
        <option>Diğer</option>
      </select>

      <br />
      <br />

      <label>Açıklama</label>
      <br />
      <textarea
        rows={4}
        placeholder="İsteğe bağlı"
        value={aciklama}
        onChange={(event) => setAciklama(event.target.value)}
      />

      <br />
      <br />

      <button onClick={kaydet}>💾 Kaydet</button>

      <hr style={{ margin: "30px 0" }} />

      <h2>Yaklaşan Kayıtlar</h2>

      {kayitlar.length === 0 ? (
        <p>Henüz takvim kaydı yok.</p>
      ) : (
        <div>
          {kayitlar.map((kayit) => (
            <div
              key={kayit.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "14px",
                opacity: kayit.tamamlandi ? 0.55 : 1,
                textDecoration: kayit.tamamlandi
                  ? "line-through"
                  : "none",
              }}
            >
              <strong>{kayit.baslik}</strong>

              <br />

              📅 {tarihiYaz(kayit.tarih)}

              <br />

              Tür: {kayit.tur}

              <br />

              Açıklama: {kayit.aciklama || "-"}

              <br />
              <br />

              <button
                onClick={() => tamamlandiDegistir(kayit.id)}
              >
                {kayit.tamamlandi
                  ? "↩️ Tamamlanmadı Yap"
                  : "✅ Tamamlandı"}
              </button>

              {" "}

              <button onClick={() => sil(kayit.id)}>
                🗑️ Sil
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}