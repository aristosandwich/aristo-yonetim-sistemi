"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Fatura = {
  id: number;
  tarih: string;
  faturaNo: string;
  tutar: number;
  aciklama: string;
};

type Odeme = {
  id: number;
  tarih: string;
  tutar: number;
  aciklama: string;
};

export default function Mudo() {
  const [faturalar, setFaturalar] = useState<Fatura[]>([]);
  const [odemeler, setOdemeler] = useState<Odeme[]>([]);

  const [faturaTarihi, setFaturaTarihi] = useState("");
  const [faturaNo, setFaturaNo] = useState("");
  const [faturaTutari, setFaturaTutari] = useState("");
  const [faturaAciklama, setFaturaAciklama] = useState("");

  const [odemeTarihi, setOdemeTarihi] = useState("");
  const [odemeTutari, setOdemeTutari] = useState("");
  const [odemeAciklama, setOdemeAciklama] = useState("");

  useEffect(() => {
    const eskiFaturalar = localStorage.getItem("aristo-mudo-faturalar");
    const eskiOdemeler = localStorage.getItem("aristo-mudo-odemeler");

    if (eskiFaturalar) {
      setFaturalar(JSON.parse(eskiFaturalar));
    }

    if (eskiOdemeler) {
      setOdemeler(JSON.parse(eskiOdemeler));
    }
  }, []);

  const toplamFatura = faturalar.reduce(
    (toplam, fatura) => toplam + fatura.tutar,
    0
  );

  const toplamOdeme = odemeler.reduce(
    (toplam, odeme) => toplam + odeme.tutar,
    0
  );

  const kalanBakiye = toplamFatura - toplamOdeme;

  function faturaKaydet() {
    const tutar = Number(faturaTutari);

    if (!faturaTarihi || tutar <= 0) {
      alert("Fatura tarihi ve tutarını gir.");
      return;
    }

    const yeniFatura: Fatura = {
      id: Date.now(),
      tarih: faturaTarihi,
      faturaNo,
      tutar,
      aciklama: faturaAciklama,
    };

    const yeniFaturalar = [yeniFatura, ...faturalar];

    setFaturalar(yeniFaturalar);
    localStorage.setItem(
      "aristo-mudo-faturalar",
      JSON.stringify(yeniFaturalar)
    );

    setFaturaTarihi("");
    setFaturaNo("");
    setFaturaTutari("");
    setFaturaAciklama("");
  }

  function odemeKaydet() {
    const tutar = Number(odemeTutari);

    if (!odemeTarihi || tutar <= 0) {
      alert("Ödeme tarihi ve tutarını gir.");
      return;
    }

    const yeniOdeme: Odeme = {
      id: Date.now(),
      tarih: odemeTarihi,
      tutar,
      aciklama: odemeAciklama,
    };

    const yeniOdemeler = [yeniOdeme, ...odemeler];

    setOdemeler(yeniOdemeler);
    localStorage.setItem(
      "aristo-mudo-odemeler",
      JSON.stringify(yeniOdemeler)
    );

    setOdemeTarihi("");
    setOdemeTutari("");
    setOdemeAciklama("");
  }

  function faturaSil(id: number) {
    const yeniFaturalar = faturalar.filter((fatura) => fatura.id !== id);

    setFaturalar(yeniFaturalar);
    localStorage.setItem(
      "aristo-mudo-faturalar",
      JSON.stringify(yeniFaturalar)
    );
  }

  function odemeSil(id: number) {
    const yeniOdemeler = odemeler.filter((odeme) => odeme.id !== id);

    setOdemeler(yeniOdemeler);
    localStorage.setItem(
      "aristo-mudo-odemeler",
      JSON.stringify(yeniOdemeler)
    );
  }

  const para = (tutar: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(tutar);

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Link href="/">← Ana Sayfaya Dön</Link>

      <h1>🏢 Mudo Toptan Cari Hesabı</h1>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "30px",
        }}
      >
        <p>Toplam Fatura: {para(toplamFatura)}</p>
        <p>Toplam Ödeme: {para(toplamOdeme)}</p>
        <h2>Kalan Bakiye: {para(kalanBakiye)}</h2>
      </div>

      <h2>📄 Yeni Fatura</h2>

      <input
        type="date"
        value={faturaTarihi}
        onChange={(event) => setFaturaTarihi(event.target.value)}
      />

      <br />
      <br />

      <input
        type="text"
        placeholder="Fatura numarası"
        value={faturaNo}
        onChange={(event) => setFaturaNo(event.target.value)}
      />

      <br />
      <br />

      <input
        type="number"
        placeholder="Fatura tutarı"
        value={faturaTutari}
        onChange={(event) => setFaturaTutari(event.target.value)}
      />

      <br />
      <br />

      <input
        type="text"
        placeholder="Açıklama"
        value={faturaAciklama}
        onChange={(event) => setFaturaAciklama(event.target.value)}
      />

      <br />
      <br />

      <button onClick={faturaKaydet}>💾 Faturayı Kaydet</button>

      <hr />

      <h2>💳 Yeni Ödeme</h2>

      <input
        type="date"
        value={odemeTarihi}
        onChange={(event) => setOdemeTarihi(event.target.value)}
      />

      <br />
      <br />

      <input
        type="number"
        placeholder="Ödeme tutarı"
        value={odemeTutari}
        onChange={(event) => setOdemeTutari(event.target.value)}
      />

      <br />
      <br />

      <input
        type="text"
        placeholder="Açıklama"
        value={odemeAciklama}
        onChange={(event) => setOdemeAciklama(event.target.value)}
      />

      <br />
      <br />

      <button onClick={odemeKaydet}>💾 Ödemeyi Kaydet</button>

      <hr />

      <h2>📄 Faturalar</h2>

      {faturalar.length === 0 ? (
        <p>Henüz fatura yok.</p>
      ) : (
        <ul>
          {faturalar.map((fatura) => (
            <li key={fatura.id} style={{ marginBottom: "18px" }}>
              <strong>{fatura.tarih}</strong>
              <br />
              No: {fatura.faturaNo || "-"}
              <br />
              Tutar: {para(fatura.tutar)}
              <br />
              Açıklama: {fatura.aciklama || "-"}
              <br />
              <button onClick={() => faturaSil(fatura.id)}>🗑️ Sil</button>
            </li>
          ))}
        </ul>
      )}

      <hr />

      <h2>💳 Ödemeler</h2>

      {odemeler.length === 0 ? (
        <p>Henüz ödeme yok.</p>
      ) : (
        <ul>
          {odemeler.map((odeme) => (
            <li key={odeme.id} style={{ marginBottom: "18px" }}>
              <strong>{odeme.tarih}</strong>
              <br />
              Tutar: {para(odeme.tutar)}
              <br />
              Açıklama: {odeme.aciklama || "-"}
              <br />
              <button onClick={() => odemeSil(odeme.id)}>🗑️ Sil</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}