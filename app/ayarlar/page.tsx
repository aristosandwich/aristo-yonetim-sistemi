"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Ayarlar() {
  const [isletmeAdi, setIsletmeAdi] = useState(
    "Aristo Sandwich & Salad Bar"
  );
  const [telefon, setTelefon] = useState("");
  const [adres, setAdres] = useState("");
  const [kaydedildi, setKaydedildi] = useState(false);

  useEffect(() => {
    const veri = localStorage.getItem("aristo-ayarlar");

    if (!veri) return;

    try {
      const ayarlar = JSON.parse(veri);

      setIsletmeAdi(ayarlar.isletmeAdi || "");
      setTelefon(ayarlar.telefon || "");
      setAdres(ayarlar.adres || "");
    } catch {}
  }, []);

  function kaydet() {
    localStorage.setItem(
      "aristo-ayarlar",
      JSON.stringify({
        isletmeAdi,
        telefon,
        adres,
      })
    );

    setKaydedildi(true);

    setTimeout(() => {
      setKaydedildi(false);
    }, 2500);
  }

  const kart = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 8px 20px rgba(0,0,0,.06)",
  };

  const alan = {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "15px",
    boxSizing: "border-box" as const,
    marginTop: "6px",
  };

  const buton = {
    border: "none",
    borderRadius: "10px",
    padding: "14px 18px",
    background: "#174d38",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
    fontSize: "15px",
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
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <Link href="/">← Ana Sayfaya Dön</Link>

        <h1 style={{ marginBottom: "6px" }}>
          ⚙️ Ayarlar
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: "24px",
            color: "#6b7280",
          }}
        >
          İşletme bilgilerini güncelle.
        </p>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(260px,1fr))",
            gap: "18px",
          }}
        >
          <div style={kart}>
            <h2 style={{ marginTop: 0 }}>
              İşletme Bilgileri
            </h2>

            <label>
              <strong>İşletme Adı</strong>
            </label>

            <input
              style={alan}
              value={isletmeAdi}
              onChange={(e) =>
                setIsletmeAdi(e.target.value)
              }
            />

            <br />
            <br />

            <label>
              <strong>Telefon</strong>
            </label>

            <input
              style={alan}
              value={telefon}
              onChange={(e) =>
                setTelefon(e.target.value)
              }
            />

            <br />
            <br />

            <label>
              <strong>Adres</strong>
            </label>

            <textarea
              rows={5}
              style={{
                ...alan,
                resize: "vertical",
              }}
              value={adres}
              onChange={(e) =>
                setAdres(e.target.value)
              }
            />

            <br />
            <br />

            <button
              style={buton}
              onClick={kaydet}
            >
              💾 Ayarları Kaydet
            </button>

            {kaydedildi && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  borderRadius: "10px",
                  background: "#dcfce7",
                  color: "#166534",
                  fontWeight: "bold",
                }}
              >
                ✅ Ayarlar başarıyla kaydedildi.
              </div>
            )}
          </div>

          <div style={kart}>
            <h2 style={{ marginTop: 0 }}>
              Sistem Bilgisi
            </h2>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px 0",
                    }}
                  >
                    Program
                  </td>

                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: "bold",
                    }}
                  >
                    Aristo Yönetim
                  </td>
                </tr>

                <tr>
                  <td
                    style={{
                      padding: "10px 0",
                    }}
                  >
                    Sürüm
                  </td>

                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: "bold",
                    }}
                  >
                    2.0
                  </td>
                </tr>

                <tr>
                  <td
                    style={{
                      padding: "10px 0",
                    }}
                  >
                    Veri
                  </td>

                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: "bold",
                      color: "#15803d",
                    }}
                  >
                    Local Storage
                  </td>
                </tr>

                <tr>
                  <td
                    style={{
                      padding: "10px 0",
                    }}
                  >
                    Durum
                  </td>

                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: "bold",
                      color: "#15803d",
                    }}
                  >
                    Hazır
                  </td>
                </tr>
              </tbody>
            </table>

            <hr
              style={{
                margin: "22px 0",
              }}
            />

            <p
              style={{
                color: "#6b7280",
                lineHeight: 1.7,
              }}
            >
              Bu ekrandan işletme bilgilerini
              değiştirebilirsin. Bu bilgiler
              ileride PDF raporlarında ve
              yazdırılabilir çıktılarda
              kullanılacak.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}