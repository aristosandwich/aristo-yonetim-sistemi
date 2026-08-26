"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type NotKaydi = {
  id: number;
  tarih: string;
  metin: string;
};

function yerelNotOnbelleginiGuncelle(
  notlar: NotKaydi[]
) {
  localStorage.setItem(
    "aristo-notlar",
    JSON.stringify(notlar)
  );
}

export default function Notlar() {
  const [not, setNot] = useState("");
  const [arama, setArama] = useState("");
  const [notlar, setNotlar] = useState<NotKaydi[]>([]);
  const [kaydediliyor, setKaydediliyor] =
    useState(false);

  useEffect(() => {
    let aktif = true;

    async function notlariYukle() {
      const { data, error } = await supabase
        .from("notlar")
        .select("id, tarih, metin")
        .order("id", { ascending: false });

      if (!aktif) {
        return;
      }

      if (error) {
        console.error(
          "Notlar okunamadı:",
          error
        );
        window.alert(
          "Notlar buluttan okunamadı."
        );
        return;
      }

      let bulutNotlari = data || [];

      if (bulutNotlari.length === 0) {
        try {
          const eskiNotlar: NotKaydi[] =
            JSON.parse(
              localStorage.getItem(
                "aristo-notlar"
              ) || "[]"
            );

          if (
            Array.isArray(eskiNotlar) &&
            eskiNotlar.length > 0
          ) {
            const { data: aktarilanlar, error: aktarimHatasi } =
              await supabase
                .from("notlar")
                .upsert(
                  eskiNotlar.map((kayit) => ({
                    id: Number(kayit.id),
                    tarih: kayit.tarih,
                    metin: kayit.metin,
                  })),
                  { onConflict: "id" }
                )
                .select("id, tarih, metin");

            if (!aktif) {
              return;
            }

            if (aktarimHatasi) {
              console.error(
                "Eski notlar aktarılamadı:",
                aktarimHatasi
              );
              window.alert(
                "Eski notlar buluta aktarılamadı."
              );
            } else {
              bulutNotlari = aktarilanlar || [];
            }
          }
        } catch (hata) {
          console.error(
            "Eski notlar okunamadı:",
            hata
          );
        }
      }

      const yeniNotlar: NotKaydi[] =
        bulutNotlari.map((kayit) => ({
          id: Number(kayit.id || 0),
          tarih: String(kayit.tarih ?? ""),
          metin: String(kayit.metin ?? ""),
        }));

      setNotlar(yeniNotlar);
      yerelNotOnbelleginiGuncelle(
        yeniNotlar
      );
    }

    function odaklaninca() {
      void notlariYukle();
    }

    void notlariYukle();
    window.addEventListener(
      "focus",
      odaklaninca
    );

    return () => {
      aktif = false;

      window.removeEventListener(
        "focus",
        odaklaninca
      );
    };
  }, []);

  async function kaydet() {
    if (!not.trim()) {
      alert("Not boş olamaz.");
      return;
    }

    if (kaydediliyor) {
      return;
    }

    const yeniNot: NotKaydi = {
      id: Date.now(),
      tarih: new Date().toLocaleString("tr-TR"),
      metin: not.trim(),
    };

    setKaydediliyor(true);

    const { error } = await supabase
      .from("notlar")
      .insert({
        id: yeniNot.id,
        tarih: yeniNot.tarih,
        metin: yeniNot.metin,
      });

    if (error) {
      console.error(
        "Not kaydedilemedi:",
        error
      );
      window.alert(
        "Not buluta kaydedilemedi."
      );
      setKaydediliyor(false);
      return;
    }

    const yeniListe = [yeniNot, ...notlar];

    setNotlar(yeniListe);
    yerelNotOnbelleginiGuncelle(
      yeniListe
    );
    setNot("");
    setKaydediliyor(false);
  }

  async function sil(id: number) {
    if (!window.confirm("Not silinsin mi?")) return;

    const { error } = await supabase
      .from("notlar")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Not silinemedi:",
        error
      );
      window.alert(
        "Not buluttan silinemedi."
      );
      return;
    }

    const yeniListe = notlar.filter(
      (not) => not.id !== id
    );

    setNotlar(yeniListe);
    yerelNotOnbelleginiGuncelle(
      yeniListe
    );
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
                  {not.tarih}
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
    </main>
  );
}