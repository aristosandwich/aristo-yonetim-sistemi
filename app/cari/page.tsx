"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { tumKayitlariOku, hataMesaji } from "../lib/aristoIslemler";
import { koruyarakOnbellekYaz } from "../lib/bulutOnbellegi";

type CariKaydi = {
  id: number;
  firma: string;
  tip: "Borç" | "Alacak";
  tutar: number;
  aciklama: string;
  tarih: string;
};

function yerelCariOnbelleginiGuncelle(
  kayitlar: CariKaydi[]
) {
  koruyarakOnbellekYaz("aristo-cari", kayitlar);
}

export default function Cari() {
  const [firma, setFirma] = useState("");
  const [tip, setTip] = useState<"Borç" | "Alacak">("Borç");
  const [tutar, setTutar] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [kayitlar, setKayitlar] = useState<CariKaydi[]>([]);
  const [arama, setArama] = useState("");
  const [tipFiltresi, setTipFiltresi] = useState<
    "Tümü" | "Borç" | "Alacak"
  >("Tümü");
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
        const bulutKayitlari = (await tumKayitlariOku("cari", "id, firma, tip, tutar, aciklama, tarih"))
          .sort((a, b) => Number(b.id) - Number(a.id));
        if (!aktif || sira !== okumaNo.current) return;
      const yeniKayitlar: CariKaydi[] =
        bulutKayitlari.map((kayit) => ({
          id: Number(kayit.id || 0),
          firma: String(kayit.firma ?? ""),
          tip:
            kayit.tip === "Alacak"
              ? "Alacak"
              : "Borç",
          tutar: Number(kayit.tutar || 0),
          aciklama: String(kayit.aciklama ?? ""),
          tarih: String(kayit.tarih ?? ""),
        }));

      setKayitlar(yeniKayitlar);
      yerelCariOnbelleginiGuncelle(
        yeniKayitlar
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

  function formuTemizle() {
    setFirma("");
    setTip("Borç");
    setTutar("");
    setAciklama("");
  }

  async function kaydet() {
    if (!hazirRef.current || veriHatasi || islemKilidi.current) return;
    islemKilidi.current = true;
    ++okumaNo.current;
    setKaydediliyor(true);
    try {
    const cariTutari = Number(tutar);

    if (!firma.trim()) {
      alert("Firma adını gir.");
      return;
    }

    if (!Number.isFinite(cariTutari) || cariTutari <= 0) {
      alert("Geçerli bir tutar gir.");
      return;
    }

    const yeniKayit: CariKaydi = {
      id: Date.now(),
      firma: firma.trim(),
      tip,
      tutar: cariTutari,
      aciklama: aciklama.trim(),
      tarih: new Date().toLocaleString("tr-TR"),
    };

    if (kaydediliyor) {
      return;
    }

    setKaydediliyor(true);

    const { data: kaydedilen, error } = await supabase
      .from("cari")
      .insert({
        id: yeniKayit.id,
        firma: yeniKayit.firma,
        tip: yeniKayit.tip,
        tutar: yeniKayit.tutar,
        aciklama: yeniKayit.aciklama,
        tarih: yeniKayit.tarih,
      }).select("id").single();

    if (error) throw error;
    if (!kaydedilen) throw new Error("Kayıt bulunamadı veya işlem sonucu doğrulanamadı. Sayfayı yenileyin.");

    const yeniListe = [yeniKayit, ...kayitlar];

    setKayitlar(yeniListe);
    yerelCariOnbelleginiGuncelle(
      yeniListe
    );
    formuTemizle();
    setKaydediliyor(false);

    alert("Cari kayıt eklendi.");
    } catch (h) {
      hazirRef.current = false;
      setHazir(false);
      setVeriHatasi(hataMesaji(h) + " İşlemi yeniden girmeden sayfayı yenileyin.");
    } finally {
      islemKilidi.current = false;
      setKaydediliyor(false);
    }
  }

  async function sil(id: number) {
    if (!hazirRef.current || veriHatasi || islemKilidi.current) return;
    islemKilidi.current = true;
    ++okumaNo.current;
    setKaydediliyor(true);
    try {
    const onay = window.confirm(
      "Bu cari hareketi silinsin mi?"
    );

    if (!onay) return;

    const { data: kaydedilen, error } = await supabase
      .from("cari")
      .delete()
      .eq("id", id).select("id").single();

    if (error) throw error;
    if (!kaydedilen) throw new Error("Kayıt bulunamadı veya işlem sonucu doğrulanamadı. Sayfayı yenileyin.");

    const yeniListe = kayitlar.filter(
      (kayit) => kayit.id !== id
    );

    setKayitlar(yeniListe);
    yerelCariOnbelleginiGuncelle(
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

  const toplamBorc = kayitlar
    .filter((kayit) => kayit.tip === "Borç")
    .reduce(
      (toplam, kayit) =>
        toplam + Number(kayit.tutar || 0),
      0
    );

  const toplamAlacak = kayitlar
    .filter((kayit) => kayit.tip === "Alacak")
    .reduce(
      (toplam, kayit) =>
        toplam + Number(kayit.tutar || 0),
      0
    );

  const bakiye = toplamBorc - toplamAlacak;

  const filtrelenmisKayitlar = useMemo(() => {
    const aranan = arama
      .trim()
      .toLocaleLowerCase("tr-TR");

    return kayitlar.filter((kayit) => {
      const tipUygun =
        tipFiltresi === "Tümü" ||
        kayit.tip === tipFiltresi;

      const metin =
        `${kayit.firma} ${kayit.aciklama}`.toLocaleLowerCase(
          "tr-TR"
        );

      const aramaUygun =
        !aranan || metin.includes(aranan);

      return tipUygun && aramaUygun;
    });
  }, [kayitlar, arama, tipFiltresi]);

  const firmaBakiyeleri = useMemo(() => {
    const sonuc: Record<
      string,
      {
        borc: number;
        alacak: number;
      }
    > = {};

    kayitlar.forEach((kayit) => {
      if (!sonuc[kayit.firma]) {
        sonuc[kayit.firma] = {
          borc: 0,
          alacak: 0,
        };
      }

      if (kayit.tip === "Borç") {
        sonuc[kayit.firma].borc += Number(
          kayit.tutar || 0
        );
      } else {
        sonuc[kayit.firma].alacak += Number(
          kayit.tutar || 0
        );
      }
    });

    return Object.entries(sonuc)
      .map(([firmaAdi, degerler]) => ({
        firma: firmaAdi,
        borc: degerler.borc,
        alacak: degerler.alacak,
        bakiye: degerler.borc - degerler.alacak,
      }))
      .sort(
        (a, b) =>
          Math.abs(b.bakiye) - Math.abs(a.bakiye)
      );
  }, [kayitlar]);

  const para = (deger: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(deger);

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

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <Link href="/">← Ana Sayfaya Dön</Link>

        <h1 style={{ marginBottom: "6px" }}>
          👥 Cari Hesaplar
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: "24px",
            color: "#6b7280",
          }}
        >
          Firma borç ve alacak hareketlerini yönet.
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
              Toplam borç
            </small>

            <h2
              style={{
                marginBottom: 0,
                color: "#b91c1c",
              }}
            >
              {para(toplamBorc)}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Toplam alacak
            </small>

            <h2
              style={{
                marginBottom: 0,
                color: "#15803d",
              }}
            >
              {para(toplamAlacak)}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Net bakiye
            </small>

            <h2
              style={{
                marginBottom: 0,
                color:
                  bakiye > 0
                    ? "#b91c1c"
                    : "#15803d",
              }}
            >
              {para(bakiye)}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Firma sayısı
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {firmaBakiyeleri.length}
            </h2>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              ➕ Yeni Cari Hareket
            </h2>

            <label>
              <strong>Firma</strong>
            </label>

            <input
              value={firma}
              onChange={(event) =>
                setFirma(event.target.value)
              }
              placeholder="Örneğin: Coca-Cola"
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>İşlem Tipi</strong>
            </label>

            <select
              value={tip}
              onChange={(event) =>
                setTip(
                  event.target.value as
                    | "Borç"
                    | "Alacak"
                )
              }
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            >
              <option>Borç</option>
              <option>Alacak</option>
            </select>

            <label>
              <strong>Tutar</strong>
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={tutar}
              onChange={(event) =>
                setTutar(event.target.value)
              }
              placeholder="0"
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
              value={aciklama}
              onChange={(event) =>
                setAciklama(event.target.value)
              }
              placeholder="İsteğe bağlı"
              rows={4}
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "16px",
                resize: "vertical",
              }}
            />

            <button
              onClick={kaydet}
              disabled={kaydediliyor}
              style={{
                ...yesilButon,
                opacity: kaydediliyor ? 0.65 : 1,
              }}
            >
              💾 Kaydet
            </button>
          </div>

          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              🔍 Hareketleri Filtrele
            </h2>

            <label>
              <strong>Firma veya açıklama ara</strong>
            </label>

            <input
              value={arama}
              onChange={(event) =>
                setArama(event.target.value)
              }
              placeholder="Örneğin: Metro"
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>İşlem Tipi</strong>
            </label>

            <select
              value={tipFiltresi}
              onChange={(event) =>
                setTipFiltresi(
                  event.target.value as
                    | "Tümü"
                    | "Borç"
                    | "Alacak"
                )
              }
              style={{
                ...alanStili,
                marginTop: "7px",
              }}
            >
              <option>Tümü</option>
              <option>Borç</option>
              <option>Alacak</option>
            </select>
          </div>
        </section>

        {firmaBakiyeleri.length > 0 && (
          <section
            style={{
              ...kartStili,
              marginBottom: "24px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              🏢 Firma Bakiyeleri
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              {firmaBakiyeleri.map((kayit) => (
                <div
                  key={kayit.firma}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "15px",
                    background: "#f9fafb",
                  }}
                >
                  <strong>{kayit.firma}</strong>

                  <p
                    style={{
                      margin: "10px 0 4px",
                      color: "#b91c1c",
                    }}
                  >
                    Borç: {para(kayit.borc)}
                  </p>

                  <p
                    style={{
                      margin: "4px 0",
                      color: "#15803d",
                    }}
                  >
                    Alacak: {para(kayit.alacak)}
                  </p>

                  <p
                    style={{
                      marginBottom: 0,
                      fontWeight: "bold",
                    }}
                  >
                    Bakiye: {para(kayit.bakiye)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={kartStili}>
          <h2 style={{ marginTop: 0 }}>
            Cari Hareketleri
          </h2>

          {filtrelenmisKayitlar.length === 0 ? (
            <p style={{ color: "#6b7280" }}>
              Kayıt bulunamadı.
            </p>
          ) : (
            filtrelenmisKayitlar.map((kayit) => (
              <div
                key={kayit.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(180px, 1fr) auto",
                  gap: "18px",
                  borderBottom:
                    "1px solid #e5e7eb",
                  padding: "16px 0",
                }}
              >
                <div>
                  <strong>{kayit.firma}</strong>

                  <p
                    style={{
                      margin: "6px 0",
                      color: "#6b7280",
                    }}
                  >
                    {kayit.tarih}
                  </p>

                  <p style={{ margin: 0 }}>
                    {kayit.aciklama || "Açıklama yok"}
                  </p>
                </div>

                <div
                  style={{
                    textAlign: "right",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      marginBottom: "12px",
                      color:
                        kayit.tip === "Borç"
                          ? "#b91c1c"
                          : "#15803d",
                      fontSize: "18px",
                    }}
                  >
                    {kayit.tip === "Borç" ? "-" : "+"}
                    {para(kayit.tutar)}
                  </strong>

                  <small
                    style={{
                      display: "block",
                      marginBottom: "10px",
                      color: "#6b7280",
                    }}
                  >
                    {kayit.tip}
                  </small>

                  <button
                    onClick={() => sil(kayit.id)}
                    style={kirmiziButon}
                  >
                    🗑️ Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
      </fieldset>
    </main>
  );
}
