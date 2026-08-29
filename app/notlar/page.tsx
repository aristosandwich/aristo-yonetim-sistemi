"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { tumKayitlariOku, hataMesaji } from "../lib/aristoIslemler";
import { koruyarakOnbellekYaz } from "../lib/bulutOnbellegi";

type NotKaydi = {
  id: number;
  tarih: string;
  metin: string;
};

function tarihiIsoYap(tarih: string) {
  const temizTarih = tarih.trim();
  const standartTarih = Date.parse(temizTarih);

  if (!Number.isNaN(standartTarih)) {
    return new Date(standartTarih).toISOString();
  }

  const turkceTarih = temizTarih.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  );

  if (turkceTarih) {
    const [, gun, ay, yil, saat, dakika, saniye = "0"] =
      turkceTarih;

    return new Date(
      Number(yil),
      Number(ay) - 1,
      Number(gun),
      Number(saat),
      Number(dakika),
      Number(saniye)
    ).toISOString();
  }

  return new Date().toISOString();
}

function tarihiGoster(tarih: string) {
  const zaman = Date.parse(tarih);

  if (Number.isNaN(zaman)) {
    return tarih;
  }

  return new Date(zaman).toLocaleString("tr-TR");
}

function yerelNotOnbelleginiGuncelle(
  notlar: NotKaydi[]
) {
  koruyarakOnbellekYaz("aristo-notlar", notlar);
}

export default function Notlar() {
  const [not, setNot] = useState("");
  const [arama, setArama] = useState("");
  const [notlar, setNotlar] = useState<NotKaydi[]>([]);
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
        const bulutKayitlari = (await tumKayitlariOku("notlar", "id, tarih, metin"))
          .sort((a, b) => Number(b.id) - Number(a.id));
        if (!aktif || sira !== okumaNo.current) return;
      const yeniNotlar: NotKaydi[] =
        bulutKayitlari.map((kayit) => ({
          id: Number(kayit.id || 0),
          tarih: String(kayit.tarih ?? ""),
          metin: String(kayit.metin ?? ""),
        }));

      setNotlar(yeniNotlar);
      yerelNotOnbelleginiGuncelle(
        yeniNotlar
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

  async function kaydet() {
    if (!hazirRef.current || veriHatasi || islemKilidi.current) return;
    islemKilidi.current = true;
    ++okumaNo.current;
    setKaydediliyor(true);
    try {
    if (!not.trim()) {
      alert("Not boş olamaz.");
      return;
    }

    if (kaydediliyor) {
      return;
    }

    const yeniNot: NotKaydi = {
      id: Date.now(),
      tarih: new Date().toISOString(),
      metin: not.trim(),
    };

    setKaydediliyor(true);

    const { data: kaydedilen, error } = await supabase
      .from("notlar")
      .insert({
        id: yeniNot.id,
        tarih: yeniNot.tarih,
        metin: yeniNot.metin,
      }).select("id").single();

    if (error) throw error;
    if (!kaydedilen) throw new Error("Kayıt bulunamadı veya işlem sonucu doğrulanamadı. Sayfayı yenileyin.");

    const yeniListe = [yeniNot, ...notlar];

    setNotlar(yeniListe);
    yerelNotOnbelleginiGuncelle(
      yeniListe
    );
    setNot("");
    setKaydediliyor(false);
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
    if (!window.confirm("Not silinsin mi?")) return;

    const { data: kaydedilen, error } = await supabase
      .from("notlar")
      .delete()
      .eq("id", id).select("id").single();

    if (error) throw error;
    if (!kaydedilen) throw new Error("Kayıt bulunamadı veya işlem sonucu doğrulanamadı. Sayfayı yenileyin.");

    const yeniListe = notlar.filter(
      (not) => not.id !== id
    );

    setNotlar(yeniListe);
    yerelNotOnbelleginiGuncelle(
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

  const filtrelenmisNotlar = useMemo(() => {
    const aranan = arama
      .trim()
      .toLocaleLowerCase("tr-TR");

    if (!aranan) return notlar;

    return notlar.filter((not) =>
      not.metin
        .toLocaleLowerCase("tr-TR")
        .includes(aranan)
    );
  }, [notlar, arama]);

  const kart = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,.06)",
  };

  const alan = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box" as const,
    fontSize: "15px",
  };

  const yesil = {
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    background: "#174d38",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const kirmizi = {
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    background: "#b91c1c",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7f5",
        padding: "30px 18px",
        fontFamily: "Arial,sans-serif",
      }}
    >
      <div role="status" style={{ marginBottom: 12, color: veriHatasi ? "#b91c1c" : "#174d38" }}>
        {veriHatasi || (!hazir ? "Güncel kayıtlar buluttan okunuyor…" : "")}
        {veriHatasi && <button onClick={() => window.location.reload()}>Güncel kayıtları yükle</button>}
      </div>
      <fieldset disabled={!hazir || kaydediliyor || !!veriHatasi} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <Link href="/">← Ana Sayfaya Dön</Link>

        <h1>📝 Notlar</h1>

        <section
          style={{
            ...kart,
            marginBottom: "22px",
          }}
        >
          <textarea
            rows={6}
            value={not}
            onChange={(e) =>
              setNot(e.target.value)
            }
            placeholder="Bugünkü notunu yaz..."
            style={{
              ...alan,
              resize: "vertical",
              marginBottom: "14px",
            }}
          />

          <button
            onClick={kaydet}
            disabled={kaydediliyor}
            style={{
              ...yesil,
              opacity: kaydediliyor ? 0.65 : 1,
            }}
          >
            💾 Notu Kaydet
          </button>
        </section>

        <section
          style={{
            ...kart,
            marginBottom: "22px",
          }}
        >
          <input
            value={arama}
            onChange={(e) =>
              setArama(e.target.value)
            }
            placeholder="Not ara..."
            style={alan}
          />
        </section>

        <section style={kart}>
          <h2 style={{ marginTop: 0 }}>
            Kayıtlı Notlar ({filtrelenmisNotlar.length})
          </h2>

          {filtrelenmisNotlar.length === 0 ? (
            <p
              style={{
                color: "#6b7280",
              }}
            >
              Not bulunamadı.
            </p>
          ) : (
            filtrelenmisNotlar.map((not) => (
              <div
                key={not.id}
                style={{
                  borderBottom:
                    "1px solid #e5e7eb",
                  padding: "16px 0",
                }}
              >
                <small
                  style={{
                    color: "#6b7280",
                  }}
                >
                  {tarihiGoster(not.tarih)}
                </small>

                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    margin: "10px 0 16px",
                  }}
                >
                  {not.metin}
                </p>

                <button
                  onClick={() => sil(not.id)}
                  style={kirmizi}
                >
                  🗑️ Sil
                </button>
              </div>
            ))
          )}
        </section>
      </div>
      </fieldset>
    </main>
  );
}
