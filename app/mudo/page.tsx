"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { tumKayitlariOku, hataMesaji } from "../lib/aristoIslemler";
import { koruyarakOnbellekYaz } from "../lib/bulutOnbellegi";

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

function yerelMudoOnbelleginiGuncelle(
  faturalar: Fatura[],
  odemeler: Odeme[]
) {
  koruyarakOnbellekYaz("aristo-mudo-faturalar", faturalar);

  koruyarakOnbellekYaz("aristo-mudo-odemeler", odemeler);
}

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

  const [arama, setArama] = useState("");
  const [kaydediliyor, setKaydediliyor] =
    useState(false);

  const [hazir, setHazir] = useState(false);
  const [veriHatasi, setVeriHatasi] = useState("");
  const hazirRef = useRef(false);
  const islemKilidi = useRef(false);
  const okumaNo = useRef(0);

  useEffect(() => {
    let aktif = true;
    async function buluttanYukle() {
      if (islemKilidi.current) return;
      const sira = ++okumaNo.current;
      hazirRef.current = false;
      setHazir(false);
      try {
        const bulutKayitlari = (await tumKayitlariOku("mudo", "id, tarih, tip, fatura_no, tutar, aciklama"))
          .sort((a, b) => String(b.tarih ?? "").localeCompare(String(a.tarih ?? "")) || Number(b.id) - Number(a.id));
        if (!aktif || sira !== okumaNo.current) return;
      const yeniFaturalar: Fatura[] =
        bulutKayitlari
          .filter((kayit) => kayit.tip === "Fatura")
          .map((kayit) => ({
            id: Number(kayit.id || 0),
            tarih: String(kayit.tarih ?? ""),
            faturaNo: String(kayit.fatura_no ?? ""),
            tutar: Number(kayit.tutar || 0),
            aciklama: String(kayit.aciklama ?? ""),
          }));

      const yeniOdemeler: Odeme[] =
        bulutKayitlari
          .filter((kayit) => kayit.tip === "Ödeme")
          .map((kayit) => ({
            id: Number(kayit.id || 0),
            tarih: String(kayit.tarih ?? ""),
            tutar: Number(kayit.tutar || 0),
            aciklama: String(kayit.aciklama ?? ""),
          }));

      setFaturalar(yeniFaturalar);
      setOdemeler(yeniOdemeler);
      yerelMudoOnbelleginiGuncelle(
        yeniFaturalar,
        yeniOdemeler
      );
        hazirRef.current = true;
        setHazir(true);
        setVeriHatasi("");
      } catch (h) {
        if (aktif && sira === okumaNo.current) {
          setVeriHatasi("Bulut kayıtları okunamadı: " + hataMesaji(h));
        }
      }
    }
    void buluttanYukle();
    const odaklaninca = () => { void buluttanYukle(); };
    window.addEventListener("focus", odaklaninca);
    return () => { aktif = false; window.removeEventListener("focus", odaklaninca); };
  }, []);

  const toplamFatura = faturalar.reduce(
    (toplam, fatura) => toplam + Number(fatura.tutar || 0),
    0
  );

  const toplamOdeme = odemeler.reduce(
    (toplam, odeme) => toplam + Number(odeme.tutar || 0),
    0
  );

  const kalanBakiye = toplamFatura - toplamOdeme;

  const buAy = new Date();

  const buAyFatura = faturalar
    .filter((fatura) => {
      const tarih = new Date(`${fatura.tarih}T00:00:00`);

      return (
        tarih.getMonth() === buAy.getMonth() &&
        tarih.getFullYear() === buAy.getFullYear()
      );
    })
    .reduce(
      (toplam, fatura) => toplam + Number(fatura.tutar || 0),
      0
    );

  const buAyOdeme = odemeler
    .filter((odeme) => {
      const tarih = new Date(`${odeme.tarih}T00:00:00`);

      return (
        tarih.getMonth() === buAy.getMonth() &&
        tarih.getFullYear() === buAy.getFullYear()
      );
    })
    .reduce(
      (toplam, odeme) => toplam + Number(odeme.tutar || 0),
      0
    );

  async function faturaKaydet() {
    if (!hazirRef.current || veriHatasi || islemKilidi.current) return;
    islemKilidi.current = true;
    ++okumaNo.current;
    setKaydediliyor(true);
    try {
    const tutar = Number(faturaTutari);

    if (!faturaTarihi || !Number.isFinite(tutar) || tutar <= 0) {
      alert("Fatura tarihi ve geçerli tutar gir.");
      return;
    }

    const yeniFatura: Fatura = {
      id: Date.now(),
      tarih: faturaTarihi,
      faturaNo: faturaNo.trim(),
      tutar,
      aciklama: faturaAciklama.trim(),
    };

    if (kaydediliyor) {
      return;
    }

    setKaydediliyor(true);

    const { data: kaydedilen, error } = await supabase
      .from("mudo")
      .insert({
        id: yeniFatura.id,
        tarih: yeniFatura.tarih,
        tip: "Fatura",
        fatura_no: yeniFatura.faturaNo,
        tutar: yeniFatura.tutar,
        aciklama: yeniFatura.aciklama,
      }).select("id").single();

    if (error) throw error;
    if (!kaydedilen) throw new Error("Kayıt bulunamadı veya işlem sonucu doğrulanamadı. Sayfayı yenileyin.");

    const yeniListe = [yeniFatura, ...faturalar];

    setFaturalar(yeniListe);
    yerelMudoOnbelleginiGuncelle(
      yeniListe,
      odemeler
    );

    setFaturaTarihi("");
    setFaturaNo("");
    setFaturaTutari("");
    setFaturaAciklama("");
    setKaydediliyor(false);

    alert("Fatura kaydedildi.");
    } catch (h) {
      hazirRef.current = false;
      setHazir(false);
      setVeriHatasi(hataMesaji(h) + " İşlemi yeniden girmeden sayfayı yenileyin.");
    } finally {
      islemKilidi.current = false;
      setKaydediliyor(false);
    }
  }

  async function odemeKaydet() {
    if (!hazirRef.current || veriHatasi || islemKilidi.current) return;
    islemKilidi.current = true;
    ++okumaNo.current;
    setKaydediliyor(true);
    try {
    const tutar = Number(odemeTutari);

    if (!odemeTarihi || !Number.isFinite(tutar) || tutar <= 0) {
      alert("Ödeme tarihi ve geçerli tutar gir.");
      return;
    }

    const yeniOdeme: Odeme = {
      id: Date.now(),
      tarih: odemeTarihi,
      tutar,
      aciklama: odemeAciklama.trim(),
    };

    if (kaydediliyor) {
      return;
    }

    setKaydediliyor(true);

    const { data: kaydedilen, error } = await supabase
      .from("mudo")
      .insert({
        id: yeniOdeme.id,
        tarih: yeniOdeme.tarih,
        tip: "Ödeme",
        fatura_no: "",
        tutar: yeniOdeme.tutar,
        aciklama: yeniOdeme.aciklama,
      }).select("id").single();

    if (error) throw error;
    if (!kaydedilen) throw new Error("Kayıt bulunamadı veya işlem sonucu doğrulanamadı. Sayfayı yenileyin.");

    const yeniListe = [yeniOdeme, ...odemeler];

    setOdemeler(yeniListe);
    yerelMudoOnbelleginiGuncelle(
      faturalar,
      yeniListe
    );

    setOdemeTarihi("");
    setOdemeTutari("");
    setOdemeAciklama("");
    setKaydediliyor(false);

    alert("Ödeme kaydedildi.");
    } catch (h) {
      hazirRef.current = false;
      setHazir(false);
      setVeriHatasi(hataMesaji(h) + " İşlemi yeniden girmeden sayfayı yenileyin.");
    } finally {
      islemKilidi.current = false;
      setKaydediliyor(false);
    }
  }

  async function faturaSil(id: number) {
    if (!hazirRef.current || veriHatasi || islemKilidi.current) return;
    islemKilidi.current = true;
    ++okumaNo.current;
    setKaydediliyor(true);
    try {
    const onay = window.confirm("Bu fatura silinsin mi?");

    if (!onay) return;

    const { data: kaydedilen, error } = await supabase
      .from("mudo")
      .delete()
      .eq("id", id).select("id").single();

    if (error) throw error;
    if (!kaydedilen) throw new Error("Kayıt bulunamadı veya işlem sonucu doğrulanamadı. Sayfayı yenileyin.");

    const yeniListe = faturalar.filter(
      (fatura) => fatura.id !== id
    );

    setFaturalar(yeniListe);
    yerelMudoOnbelleginiGuncelle(
      yeniListe,
      odemeler
    );
    } catch (h) {
      hazirRef.current = false;
      setHazir(false);
      setVeriHatasi(hataMesaji(h) + " İşlemi yeniden girmeden sayfayı yenileyin.");
    } finally {
      islemKilidi.current = false;
      setKaydediliyor(false);
    }
  }

  async function odemeSil(id: number) {
    if (!hazirRef.current || veriHatasi || islemKilidi.current) return;
    islemKilidi.current = true;
    ++okumaNo.current;
    setKaydediliyor(true);
    try {
    const onay = window.confirm("Bu ödeme silinsin mi?");

    if (!onay) return;

    const { data: kaydedilen, error } = await supabase
      .from("mudo")
      .delete()
      .eq("id", id).select("id").single();

    if (error) throw error;
    if (!kaydedilen) throw new Error("Kayıt bulunamadı veya işlem sonucu doğrulanamadı. Sayfayı yenileyin.");

    const yeniListe = odemeler.filter(
      (odeme) => odeme.id !== id
    );

    setOdemeler(yeniListe);
    yerelMudoOnbelleginiGuncelle(
      faturalar,
      yeniListe
    );
    } catch (h) {
      hazirRef.current = false;
      setHazir(false);
      setVeriHatasi(hataMesaji(h) + " İşlemi yeniden girmeden sayfayı yenileyin.");
    } finally {
      islemKilidi.current = false;
      setKaydediliyor(false);
    }
  }

  const filtreliFaturalar = useMemo(() => {
    const aranan = arama.trim().toLocaleLowerCase("tr-TR");

    if (!aranan) {
      return faturalar;
    }

    return faturalar.filter((fatura) => {
      const metin =
        `${fatura.faturaNo} ${fatura.aciklama}`.toLocaleLowerCase(
          "tr-TR"
        );

      return metin.includes(aranan);
    });
  }, [faturalar, arama]);

  const filtreliOdemeler = useMemo(() => {
    const aranan = arama.trim().toLocaleLowerCase("tr-TR");

    if (!aranan) {
      return odemeler;
    }

    return odemeler.filter((odeme) =>
      odeme.aciklama
        .toLocaleLowerCase("tr-TR")
        .includes(aranan)
    );
  }, [odemeler, arama]);

  const hareketler = useMemo(() => {
    const faturaHareketleri = faturalar.map((fatura) => ({
      id: `fatura-${fatura.id}`,
      tarih: fatura.tarih,
      tip: "Fatura",
      aciklama: fatura.faturaNo || fatura.aciklama || "Fatura",
      tutar: fatura.tutar,
    }));

    const odemeHareketleri = odemeler.map((odeme) => ({
      id: `odeme-${odeme.id}`,
      tarih: odeme.tarih,
      tip: "Ödeme",
      aciklama: odeme.aciklama || "Ödeme",
      tutar: odeme.tutar,
    }));

    return [...faturaHareketleri, ...odemeHareketleri]
      .sort(
        (a, b) =>
          new Date(b.tarih).getTime() -
          new Date(a.tarih).getTime()
      )
      .slice(0, 8);
  }, [faturalar, odemeler]);

  const para = (tutar: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(tutar);

  const kartStili = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  };

  const alanStili = {
    width: "100%",
    padding: "12px",
    boxSizing: "border-box" as const,
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    background: "#ffffff",
    fontSize: "15px",
  };

  const yesilButon = {
    border: "none",
    borderRadius: "10px",
    padding: "13px 18px",
    background: "#174d38",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const kirmiziButon = {
    border: "none",
    borderRadius: "9px",
    padding: "9px 12px",
    background: "#b91c1c",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7f5",
        padding: "30px 18px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div role="status" style={{ marginBottom: 12, color: veriHatasi ? "#b91c1c" : "#174d38" }}>
        {veriHatasi || (!hazir ? "Güncel kayıtlar buluttan okunuyor…" : "")}
        {veriHatasi && <button onClick={() => window.location.reload()}>Güncel kayıtları yükle</button>}
      </div>
      <fieldset disabled={!hazir || kaydediliyor || !!veriHatasi} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <Link href="/">← Ana Sayfaya Dön</Link>

        <h1 style={{ marginBottom: "6px" }}>
          🏢 Mudo Toptan Cari Hesabı
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: "24px",
            color: "#6b7280",
          }}
        >
          Fatura, ödeme ve cari bakiyeyi takip et.
        </p>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Toplam fatura
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {para(toplamFatura)}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Toplam ödeme
            </small>

            <h2
              style={{
                marginBottom: 0,
                color: "#15803d",
              }}
            >
              {para(toplamOdeme)}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Kalan bakiye
            </small>

            <h2
              style={{
                marginBottom: 0,
                color:
                  kalanBakiye > 0 ? "#b91c1c" : "#15803d",
              }}
            >
              {para(kalanBakiye)}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Bu ay fatura / ödeme
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {para(buAyFatura)} / {para(buAyOdeme)}
            </h2>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              📄 Yeni Fatura
            </h2>

            <label>
              <strong>Fatura Tarihi</strong>
            </label>

            <input
              type="date"
              value={faturaTarihi}
              onChange={(event) =>
                setFaturaTarihi(event.target.value)
              }
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>Fatura Numarası</strong>
            </label>

            <input
              type="text"
              placeholder="Fatura numarası"
              value={faturaNo}
              onChange={(event) =>
                setFaturaNo(event.target.value)
              }
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>Fatura Tutarı</strong>
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={faturaTutari}
              onChange={(event) =>
                setFaturaTutari(event.target.value)
              }
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>Açıklama</strong>
            </label>

            <textarea
              placeholder="Açıklama"
              value={faturaAciklama}
              onChange={(event) =>
                setFaturaAciklama(event.target.value)
              }
              rows={3}
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "16px",
                resize: "vertical",
              }}
            />

            <button
              onClick={faturaKaydet}
              disabled={kaydediliyor}
              style={{
                ...yesilButon,
                opacity: kaydediliyor ? 0.65 : 1,
              }}
            >
              💾 Faturayı Kaydet
            </button>
          </div>

          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              💳 Yeni Ödeme
            </h2>

            <label>
              <strong>Ödeme Tarihi</strong>
            </label>

            <input
              type="date"
              value={odemeTarihi}
              onChange={(event) =>
                setOdemeTarihi(event.target.value)
              }
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>Ödeme Tutarı</strong>
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={odemeTutari}
              onChange={(event) =>
                setOdemeTutari(event.target.value)
              }
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>Açıklama</strong>
            </label>

            <textarea
              placeholder="Açıklama"
              value={odemeAciklama}
              onChange={(event) =>
                setOdemeAciklama(event.target.value)
              }
              rows={3}
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "16px",
                resize: "vertical",
              }}
            />

            <button
              onClick={odemeKaydet}
              disabled={kaydediliyor}
              style={{
                ...yesilButon,
                opacity: kaydediliyor ? 0.65 : 1,
              }}
            >
              💾 Ödemeyi Kaydet
            </button>
          </div>
        </section>

        <section
          style={{
            ...kartStili,
            marginBottom: "24px",
          }}
        >
          <label>
            <strong>Fatura veya açıklama ara</strong>
          </label>

          <input
            type="text"
            value={arama}
            onChange={(event) =>
              setArama(event.target.value)
            }
            placeholder="Örneğin: Ağustos"
            style={{
              ...alanStili,
              marginTop: "7px",
            }}
          />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              📄 Faturalar
            </h2>

            {filtreliFaturalar.length === 0 ? (
              <p style={{ color: "#6b7280" }}>
                Fatura bulunamadı.
              </p>
            ) : (
              filtreliFaturalar.map((fatura) => (
                <div
                  key={fatura.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(160px, 1fr) auto",
                    gap: "14px",
                    borderBottom:
                      "1px solid #e5e7eb",
                    padding: "14px 0",
                  }}
                >
                  <div>
                    <strong>{fatura.tarih}</strong>

                    <p
                      style={{
                        margin: "6px 0",
                        color: "#6b7280",
                      }}
                    >
                      No: {fatura.faturaNo || "-"}
                    </p>

                    <p style={{ margin: 0 }}>
                      {fatura.aciklama || "Açıklama yok"}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <strong
                      style={{
                        display: "block",
                        color: "#b91c1c",
                        marginBottom: "10px",
                      }}
                    >
                      {para(fatura.tutar)}
                    </strong>

                    <button
                      onClick={() => faturaSil(fatura.id)}
                      style={kirmiziButon}
                    >
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              💳 Ödemeler
            </h2>

            {filtreliOdemeler.length === 0 ? (
              <p style={{ color: "#6b7280" }}>
                Ödeme bulunamadı.
              </p>
            ) : (
              filtreliOdemeler.map((odeme) => (
                <div
                  key={odeme.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(160px, 1fr) auto",
                    gap: "14px",
                    borderBottom:
                      "1px solid #e5e7eb",
                    padding: "14px 0",
                  }}
                >
                  <div>
                    <strong>{odeme.tarih}</strong>

                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#6b7280",
                      }}
                    >
                      {odeme.aciklama || "Açıklama yok"}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <strong
                      style={{
                        display: "block",
                        color: "#15803d",
                        marginBottom: "10px",
                      }}
                    >
                      {para(odeme.tutar)}
                    </strong>

                    <button
                      onClick={() => odemeSil(odeme.id)}
                      style={kirmiziButon}
                    >
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section style={kartStili}>
          <h2 style={{ marginTop: 0 }}>
            🧾 Son Hareketler
          </h2>

          {hareketler.length === 0 ? (
            <p style={{ color: "#6b7280" }}>
              Henüz hareket yok.
            </p>
          ) : (
            hareketler.map((hareket) => (
              <div
                key={hareket.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px",
                  borderBottom: "1px solid #e5e7eb",
                  padding: "12px 0",
                }}
              >
                <div>
                  <strong>{hareket.tip}</strong>

                  <br />

                  <small style={{ color: "#6b7280" }}>
                    {hareket.tarih} — {hareket.aciklama}
                  </small>
                </div>

                <strong
                  style={{
                    color:
                      hareket.tip === "Fatura"
                        ? "#b91c1c"
                        : "#15803d",
                  }}
                >
                  {hareket.tip === "Fatura" ? "-" : "+"}
                  {para(hareket.tutar)}
                </strong>
              </div>
            ))
          )}
        </section>
      </div>
      </fieldset>
    </main>
  );
}
