"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { tumKayitlariOku, hataMesaji } from "../lib/aristoIslemler";
import { koruyarakOnbellekYaz } from "../lib/bulutOnbellegi";

type RehberKaydi = {
  id: number;
  ad: string;
  tur: "Tedarikçi" | "Müşteri" | "Personel" | "Diğer";
  telefon: string;
  not: string;
};

function yerelRehberOnbelleginiGuncelle(
  kayitlar: RehberKaydi[]
) {
  koruyarakOnbellekYaz("aristo-rehber", kayitlar);
}

export default function Rehber() {
  const [ad, setAd] = useState("");
  const [tur, setTur] =
    useState<RehberKaydi["tur"]>("Tedarikçi");
  const [telefon, setTelefon] = useState("");
  const [not, setNot] = useState("");
  const [kayitlar, setKayitlar] = useState<RehberKaydi[]>([]);
  const [arama, setArama] = useState("");
  const [turFiltresi, setTurFiltresi] = useState<
    "Tümü" | RehberKaydi["tur"]
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
        const bulutKayitlari = (await tumKayitlariOku("rehber", "id, ad, tur, telefon, not"))
          .sort((a, b) => Number(b.id) - Number(a.id));
        if (!aktif || sira !== okumaNo.current) return;
      const yeniKayitlar: RehberKaydi[] =
        bulutKayitlari.map((kayit) => {
          const kayitTuru = [
            "Tedarikçi",
            "Müşteri",
            "Personel",
            "Diğer",
          ].includes(String(kayit.tur))
            ? (String(kayit.tur) as RehberKaydi["tur"])
            : "Diğer";

          return {
            id: Number(kayit.id || 0),
            ad: String(kayit.ad ?? ""),
            tur: kayitTuru,
            telefon: String(kayit.telefon ?? ""),
            not: String(kayit.not ?? ""),
          };
        });

      setKayitlar(yeniKayitlar);
      yerelRehberOnbelleginiGuncelle(
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
    setAd("");
    setTur("Tedarikçi");
    setTelefon("");
    setNot("");
  }

  async function kaydet() {
    if (!hazirRef.current || veriHatasi || islemKilidi.current) return;
    islemKilidi.current = true;
    ++okumaNo.current;
    setKaydediliyor(true);
    try {
    if (!ad.trim()) {
      alert("Ad veya firma gir.");
      return;
    }

    const yeniKayit: RehberKaydi = {
      id: Date.now(),
      ad: ad.trim(),
      tur,
      telefon: telefon.trim(),
      not: not.trim(),
    };

    if (kaydediliyor) {
      return;
    }

    setKaydediliyor(true);

    const { data: kaydedilen, error } = await supabase
      .from("rehber")
      .insert({
        id: yeniKayit.id,
        ad: yeniKayit.ad,
        tur: yeniKayit.tur,
        telefon: yeniKayit.telefon,
        not: yeniKayit.not,
      }).select("id").single();

    if (error) throw error;
    if (!kaydedilen) throw new Error("Kayıt bulunamadı veya işlem sonucu doğrulanamadı. Sayfayı yenileyin.");

    const yeniListe = [yeniKayit, ...kayitlar];

    setKayitlar(yeniListe);
    yerelRehberOnbelleginiGuncelle(
      yeniListe
    );
    formuTemizle();
    setKaydediliyor(false);

    alert("Rehber kaydı eklendi.");
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
      "Bu rehber kaydı silinsin mi?"
    );

    if (!onay) return;

    const { data: kaydedilen, error } = await supabase
      .from("rehber")
      .delete()
      .eq("id", id).select("id").single();

    if (error) throw error;
    if (!kaydedilen) throw new Error("Kayıt bulunamadı veya işlem sonucu doğrulanamadı. Sayfayı yenileyin.");

    const yeniListe = kayitlar.filter(
      (kayit) => kayit.id !== id
    );

    setKayitlar(yeniListe);
    yerelRehberOnbelleginiGuncelle(
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

  const filtrelenmisKayitlar = useMemo(() => {
    const aranan = arama
      .trim()
      .toLocaleLowerCase("tr-TR");

    return kayitlar.filter((kayit) => {
      const turUygun =
        turFiltresi === "Tümü" ||
        kayit.tur === turFiltresi;

      const metin =
        `${kayit.ad} ${kayit.tur} ${kayit.telefon} ${kayit.not}`.toLocaleLowerCase(
          "tr-TR"
        );

      const aramaUygun =
        !aranan || metin.includes(aranan);

      return turUygun && aramaUygun;
    });
  }, [kayitlar, arama, turFiltresi]);

  const tedarikciSayisi = kayitlar.filter(
    (kayit) => kayit.tur === "Tedarikçi"
  ).length;

  const musteriSayisi = kayitlar.filter(
    (kayit) => kayit.tur === "Müşteri"
  ).length;

  const personelSayisi = kayitlar.filter(
    (kayit) => kayit.tur === "Personel"
  ).length;

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
          maxWidth: "1050px",
          margin: "0 auto",
        }}
      >
        <Link href="/">← Ana Sayfaya Dön</Link>

        <h1 style={{ marginBottom: "6px" }}>
          📒 Müşteri ve Tedarikçi Rehberi
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: "24px",
            color: "#6b7280",
          }}
        >
          Firma, müşteri ve personel bilgilerini yönet.
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
              Toplam kayıt
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {kayitlar.length}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Tedarikçi
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {tedarikciSayisi}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Müşteri
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {musteriSayisi}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Personel
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {personelSayisi}
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
              ➕ Yeni Rehber Kaydı
            </h2>

            <label>
              <strong>Ad / Firma</strong>
            </label>

            <input
              value={ad}
              onChange={(event) =>
                setAd(event.target.value)
              }
              placeholder="Örneğin: Coca-Cola"
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>Tür</strong>
            </label>

            <select
              value={tur}
              onChange={(event) =>
                setTur(
                  event.target.value as RehberKaydi["tur"]
                )
              }
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            >
              <option>Tedarikçi</option>
              <option>Müşteri</option>
              <option>Personel</option>
              <option>Diğer</option>
            </select>

            <label>
              <strong>Telefon</strong>
            </label>

            <input
              value={telefon}
              onChange={(event) =>
                setTelefon(event.target.value)
              }
              placeholder="Telefon numarası"
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>Not</strong>
            </label>

            <textarea
              value={not}
              onChange={(event) =>
                setNot(event.target.value)
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
              🔍 Rehberi Filtrele
            </h2>

            <label>
              <strong>Arama</strong>
            </label>

            <input
              value={arama}
              onChange={(event) =>
                setArama(event.target.value)
              }
              placeholder="Firma, tür veya telefon ara"
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>Tür</strong>
            </label>

            <select
              value={turFiltresi}
              onChange={(event) =>
                setTurFiltresi(
                  event.target.value as
                    | "Tümü"
                    | RehberKaydi["tur"]
                )
              }
              style={{
                ...alanStili,
                marginTop: "7px",
              }}
            >
              <option>Tümü</option>
              <option>Tedarikçi</option>
              <option>Müşteri</option>
              <option>Personel</option>
              <option>Diğer</option>
            </select>
          </div>
        </section>

        <section style={kartStili}>
          <h2 style={{ marginTop: 0 }}>
            Kayıtlar ({filtrelenmisKayitlar.length})
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
                  <strong>{kayit.ad}</strong>

                  <p
                    style={{
                      margin: "6px 0",
                      color: "#6b7280",
                    }}
                  >
                    {kayit.tur}
                  </p>

                  <p style={{ margin: "6px 0" }}>
                    Telefon: {kayit.telefon || "-"}
                  </p>

                  <p style={{ margin: 0 }}>
                    Not: {kayit.not || "-"}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    alignItems: "flex-end",
                  }}
                >
                  {kayit.telefon && (
                    <a
                      href={`tel:${kayit.telefon}`}
                      style={{
                        color: "#174d38",
                        fontWeight: "bold",
                        textDecoration: "none",
                      }}
                    >
                      📞 Ara
                    </a>
                  )}

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
