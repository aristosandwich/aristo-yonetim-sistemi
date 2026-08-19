"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  malzemeler as varsayilanMalzemeler,
  type Malzeme as TemelMalzeme,
} from "../data/malzemeler";
import { supabase } from "../lib/supabase";

type FiyatTipi = "kg" | "adet" | "direkt";
type Malzeme = TemelMalzeme & { fiyatTipi: FiyatTipi };

export default function Malzemeler() {
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);
  const [arama, setArama] = useState("");
  const [alan, setAlan] = useState<
    "Tümü" | "Sandviç" | "Salata"
  >("Tümü");

  useEffect(() => {
    let aktif = true;

    async function malzemeleriYukle() {
      const { data, error } = await supabase
        .from("malzemeler")
        .select("*")
        .order("id", { ascending: true });

      if (!aktif) return;

      if (error) {
        console.error("Malzemeler okunamadı:", error);
        setMalzemeler([]);
        return;
      }

      if (!data || data.length === 0) {
        const ilkKayitlar = varsayilanMalzemeler.map((malzeme) => ({
          id: malzeme.id,
          ad: malzeme.ad,
          kullanim_alani: malzeme.kullanimAlani,
          gramaj: Number(malzeme.gramaj || 0),
          birim_fiyat: Number(malzeme.birimFiyat || 0),
          fiyat_tipi: "kg",
        }));

        const { error: eklemeHatasi } = await supabase
          .from("malzemeler")
          .upsert(ilkKayitlar, { onConflict: "id" });

        if (eklemeHatasi) {
          console.error("Varsayılan malzemeler eklenemedi:", eklemeHatasi);
          setMalzemeler(
            varsayilanMalzemeler.map((malzeme) => ({
              ...malzeme,
              fiyatTipi: "kg" as FiyatTipi,
            }))
          );
          return;
        }

        setMalzemeler(
            varsayilanMalzemeler.map((malzeme) => ({
              ...malzeme,
              fiyatTipi: "kg" as FiyatTipi,
            }))
          );
        return;
      }

      const bulutMalzemeleri: Malzeme[] = data.map((kayit) => {
        const varsayilan = varsayilanMalzemeler.find(
          (malzeme) =>
            malzeme.ad === String(kayit.ad ?? "") &&
            malzeme.kullanimAlani ===
              (kayit.kullanim_alani as Malzeme["kullanimAlani"])
        );

        return {
          id: Number(kayit.id),
          ad: String(kayit.ad ?? ""),
          kullanimAlani:
            kayit.kullanim_alani as Malzeme["kullanimAlani"],
          gramaj: Number(kayit.gramaj || 0),
          birimFiyat: Number(kayit.birim_fiyat || 0),
          kalori100Gr: Number(varsayilan?.kalori100Gr || 0),
          fiyatTipi: (["kg", "adet", "direkt"].includes(String(kayit.fiyat_tipi))
            ? String(kayit.fiyat_tipi)
            : "kg") as FiyatTipi,
        };
      });

      setMalzemeler(bulutMalzemeleri);
    }

    malzemeleriYukle();

    return () => {
      aktif = false;
    };
  }, []);

  async function kaydet(yeniListe: Malzeme[]) {
    setMalzemeler(yeniListe);

    const bulutKayitlari = yeniListe.map((malzeme) => ({
      id: malzeme.id,
      ad: malzeme.ad,
      kullanim_alani: malzeme.kullanimAlani,
      gramaj: Number(malzeme.gramaj || 0),
      birim_fiyat: Number(malzeme.birimFiyat || 0),
      fiyat_tipi: malzeme.fiyatTipi,
    }));

    const { error } = await supabase
      .from("malzemeler")
      .upsert(bulutKayitlari, { onConflict: "id" });

    if (error) {
      console.error("Malzemeler kaydedilemedi:", error);
      window.alert("Malzemeler buluta kaydedilemedi.");
    }
  }

  function guncelle(
    id: number,
    alanAdi: "gramaj" | "birimFiyat",
    deger: number
  ) {
    const yeniListe = malzemeler.map((malzeme) =>
      malzeme.id === id
        ? {
            ...malzeme,
            [alanAdi]: Math.max(deger, 0),
          }
        : malzeme
    );

    kaydet(yeniListe);
  }

  function fiyatTipiGuncelle(id: number, fiyatTipi: FiyatTipi) {
    kaydet(
      malzemeler.map((malzeme) =>
        malzeme.id === id ? { ...malzeme, fiyatTipi } : malzeme
      )
    );
  }

  function varsayilanaDon() {
    const onay = window.confirm(
      "Bütün gramaj ve fiyat bilgileri varsayılana dönsün mü?"
    );

    if (!onay) return;

    kaydet(
      varsayilanMalzemeler.map((malzeme) => ({
        ...malzeme,
        fiyatTipi: "kg" as FiyatTipi,
      }))
    );
  }

  const filtrelenmisMalzemeler = useMemo(() => {
    const aranan = arama.trim().toLocaleLowerCase("tr-TR");

    return malzemeler.filter((malzeme) => {
      const alanUygun =
        alan === "Tümü" || malzeme.kullanimAlani === alan;

      const aramaUygun =
        !aranan ||
        malzeme.ad
          .toLocaleLowerCase("tr-TR")
          .includes(aranan);

      return alanUygun && aramaUygun;
    });
  }, [malzemeler, arama, alan]);

  const toplamMalzeme = malzemeler.length;

  const fiyatGirilenMalzeme = malzemeler.filter(
    (malzeme) => Number(malzeme.birimFiyat || 0) > 0
  ).length;

  const ortalamaPorsiyonMaliyeti =
    malzemeler.length > 0
      ? malzemeler.reduce(
          (toplam, malzeme) =>
            toplam +
            malzeme.fiyatTipi === "kg"
              ? (Number(malzeme.birimFiyat || 0) / 1000) * Number(malzeme.gramaj || 0)
              : malzeme.fiyatTipi === "adet"
              ? Number(malzeme.birimFiyat || 0) * Number(malzeme.gramaj || 0)
              : Number(malzeme.birimFiyat || 0),
          0
        ) / malzemeler.length
      : 0;

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
    padding: "11px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    boxSizing: "border-box" as const,
    background: "#ffffff",
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
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <Link href="/">← Ana Sayfaya Dön</Link>

        <h1 style={{ marginBottom: "6px" }}>
          🥬 Malzemeler
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: "24px",
            color: "#6b7280",
          }}
        >
          Gramaj ve alış fiyatı bilgilerini yönet.
          Kalori bilgileri ayrı Kalori Hesabı ekranındadır.
        </p>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Toplam malzeme
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {toplamMalzeme}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Fiyat girilen
            </small>

            <h2
              style={{
                marginBottom: 0,
                color: "#15803d",
              }}
            >
              {fiyatGirilenMalzeme}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Ortalama porsiyon maliyeti
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {para(ortalamaPorsiyonMaliyeti)}
            </h2>
          </div>
        </section>

        <section
          style={{
            ...kartStili,
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <label>
              <strong>Malzeme Ara</strong>
            </label>

            <input
              value={arama}
              onChange={(event) =>
                setArama(event.target.value)
              }
              placeholder="Örneğin: Rozbif"
              style={{
                ...alanStili,
                marginTop: "7px",
              }}
            />
          </div>

          <div>
            <label>
              <strong>Kullanım Alanı</strong>
            </label>

            <select
              value={alan}
              onChange={(event) =>
                setAlan(
                  event.target.value as
                    | "Tümü"
                    | "Sandviç"
                    | "Salata"
                )
              }
              style={{
                ...alanStili,
                marginTop: "7px",
              }}
            >
              <option>Tümü</option>
              <option>Sandviç</option>
              <option>Salata</option>
            </select>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <button
              onClick={varsayilanaDon}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                background: "#ffffff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ↩️ Gramaj ve Fiyatları Sıfırla
            </button>
          </div>
        </section>

        <section style={kartStili}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "900px",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={hucre}>Malzeme</th>
                  <th style={hucre}>Alan</th>
                  <th style={hucre}>Fiyat Tipi</th>
                  <th style={hucre}>Miktar</th>
                  <th style={hucre}>Alış Fiyatı</th>
                  <th style={hucre}>Porsiyon Maliyeti</th>
                </tr>
              </thead>

              <tbody>
                {filtrelenmisMalzemeler.map((malzeme) => {
                  const porsiyonMaliyeti =
                    malzeme.fiyatTipi === "kg"
                      ? (Number(malzeme.birimFiyat || 0) / 1000) * Number(malzeme.gramaj || 0)
                      : malzeme.fiyatTipi === "adet"
                      ? Number(malzeme.birimFiyat || 0) * Number(malzeme.gramaj || 0)
                      : Number(malzeme.birimFiyat || 0);

                  return (
                    <tr key={malzeme.id}>
                      <td style={hucre}>
                        <strong>{malzeme.ad}</strong>
                      </td>

                      <td style={hucre}>
                        {malzeme.kullanimAlani}
                      </td>

                      <td style={hucre}>
                        <select
                          value={malzeme.fiyatTipi}
                          onChange={(event) =>
                            fiyatTipiGuncelle(malzeme.id, event.target.value as FiyatTipi)
                          }
                          style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: "8px" }}
                        >
                          <option value="kg">Kg</option>
                          <option value="adet">Adet</option>
                          <option value="direkt">Direkt Fiyat</option>
                        </select>
                      </td>

                      <td style={hucre}>
                        <input
                          type="number"
                          min="0"
                          disabled={malzeme.fiyatTipi === "direkt"}
                          value={malzeme.fiyatTipi === "direkt" ? 0 : malzeme.gramaj}
                          onChange={(event) =>
                            guncelle(
                              malzeme.id,
                              "gramaj",
                              Number(event.target.value)
                            )
                          }
                          style={{
                            width: "90px",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                          }}
                        />{" "}
                        {malzeme.fiyatTipi === "kg" ? "g" : malzeme.fiyatTipi === "adet" ? "adet" : "—"}
                      </td>

                      <td style={hucre}>
                        <input
                          type="number"
                          min="0"
                          value={malzeme.birimFiyat}
                          onChange={(event) =>
                            guncelle(
                              malzeme.id,
                              "birimFiyat",
                              Number(event.target.value)
                            )
                          }
                          style={{
                            width: "110px",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                          }}
                        />
                      </td>

                      <td
                        style={{
                          ...hucre,
                          fontWeight: "bold",
                          color:
                            porsiyonMaliyeti > 0
                              ? "#174d38"
                              : "#6b7280",
                        }}
                      >
                        {para(porsiyonMaliyeti)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtrelenmisMalzemeler.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#6b7280",
                padding: "25px",
              }}
            >
              Malzeme bulunamadı.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

const hucre = {
  borderBottom: "1px solid #e5e7eb",
  padding: "13px 10px",
  textAlign: "left" as const,
};