"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Malzeme as TemelMalzeme,
} from "../data/malzemeler";
import { supabase } from "../lib/supabase";
import { tumKayitlariOku, hataMesaji } from "../lib/aristoIslemler";
import { malzemeSatirMaliyeti } from "../lib/maliyetHesabi";

type Malzeme = TemelMalzeme & {
  direktFiyat: number;
  fiyatTipi: "kg" | "adet" | "direkt";
};

function maliyetHesapla(malzeme: Malzeme) {
  return malzemeSatirMaliyeti(malzeme, malzeme.gramaj);
}

export default function Malzemeler() {
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);
  const [arama, setArama] = useState("");
  const [alan, setAlan] = useState<
    "Tümü" | "Sandviç" | "Salata"
  >("Tümü");
  const [hazir, setHazir] = useState(false);
  const [veriHatasi, setVeriHatasi] = useState("");
  const [kaydedilenId, setKaydedilenId] = useState<number | null>(null);
  const bulutKopyasi = useRef(new Map<number, Malzeme>());
  const islemKilidi = useRef(new Set<number>());

  useEffect(() => {
    let aktif = true;

    async function malzemeleriYukle() {
      setHazir(false);
      try {
        const data = await tumKayitlariOku("malzemeler", "id, ad, kullanim_alani, gramaj, birim_fiyat, direkt_fiyat, fiyat_tipi");
        if (!aktif) return;
        const bulutMalzemeleri: Malzeme[] = data.map((kayit) => ({
          id: Number(kayit.id),
          ad: String(kayit.ad ?? ""),
          kullanimAlani:
            kayit.kullanim_alani as TemelMalzeme["kullanimAlani"],
          gramaj: Number(kayit.gramaj || 0),
          birimFiyat: Number(kayit.birim_fiyat || 0),
          kalori100Gr: 0,
          direktFiyat: Number(kayit.direkt_fiyat || 0),
          fiyatTipi: (["kg", "adet", "direkt"].includes(String(kayit.fiyat_tipi))
            ? String(kayit.fiyat_tipi) : "kg") as Malzeme["fiyatTipi"],
        }));
        setMalzemeler(bulutMalzemeleri);
        bulutKopyasi.current = new Map(bulutMalzemeleri.map((m) => [m.id, { ...m }]));
        setVeriHatasi(""); setHazir(true);
      } catch (h) {
        if (aktif) setVeriHatasi("Malzemeler buluttan okunamadı: " + hataMesaji(h));
      }
    }

    malzemeleriYukle();

    return () => {
      aktif = false;
    };
  }, []);

  function guncelle(
    id: number,
    alanAdi: "gramaj" | "birimFiyat" | "direktFiyat" | "fiyatTipi",
    deger: number | Malzeme["fiyatTipi"]
  ) {
    setMalzemeler((mevcut) => mevcut.map((malzeme) =>
      malzeme.id === id
        ? {
            ...malzeme,
            [alanAdi]: typeof deger === "number" ? Math.max(deger, 0) : deger,
          }
        : malzeme
    ));
  }

  async function satiriKaydet(id: number) {
    if (!hazir || veriHatasi || islemKilidi.current.has(id)) return;
    const yeni = malzemeler.find((m) => m.id === id);
    const eski = bulutKopyasi.current.get(id);
    if (!yeni || !eski || JSON.stringify(yeni) === JSON.stringify(eski)) return;
    if (![yeni.gramaj, yeni.birimFiyat, yeni.direktFiyat].every(Number.isFinite)) {
      setVeriHatasi("Geçerli bir fiyat ve gramaj girin."); return;
    }
    islemKilidi.current.add(id); setKaydedilenId(id);
    try {
      const { data, error } = await supabase.from("malzemeler").update({
        gramaj: yeni.gramaj, birim_fiyat: yeni.birimFiyat,
        direkt_fiyat: yeni.direktFiyat, fiyat_tipi: yeni.fiyatTipi,
      }).eq("id", id).eq("gramaj", eski.gramaj).eq("birim_fiyat", eski.birimFiyat)
        .eq("direkt_fiyat", eski.direktFiyat).eq("fiyat_tipi", eski.fiyatTipi)
        .select("id").single();
      if (error) throw error;
      if (!data) throw new Error("Malzeme değişmiş veya silinmiş.");
      bulutKopyasi.current.set(id, { ...yeni }); setVeriHatasi("");
    } catch (h) {
      setMalzemeler((mevcut) => mevcut.map((m) => m.id === id ? { ...eski } : m));
      setVeriHatasi(hataMesaji(h) + " Güncel değer geri yüklendi.");
    } finally {
      islemKilidi.current.delete(id); setKaydedilenId(null);
    }
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
    (malzeme) =>
      Number(malzeme.birimFiyat || 0) > 0 ||
      Number(malzeme.direktFiyat || 0) > 0
  ).length;

  const ortalamaPorsiyonMaliyeti =
    malzemeler.length > 0
      ? malzemeler.reduce(
          (toplam, malzeme) =>
            toplam + maliyetHesapla(malzeme),
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
          maxWidth: "1250px",
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
          Gramaj ve kg fiyatından hesapla veya direkt porsiyon
          maliyeti gir. Direkt fiyat girilmişse hesaplamada o
          kullanılır. Kalori ayrı Kalori Hesabı ekranındadır.
        </p>

        <p role="status" style={{ color: veriHatasi ? "#b91c1c" : "#66736c", fontWeight: "bold" }}>
          {veriHatasi || (!hazir ? "Malzemeler buluttan okunuyor…" : kaydedilenId ? "Kaydediliyor…" : "")}
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
              onClick={() => window.location.reload()}
              disabled={!hazir || kaydedilenId !== null}
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
              ↻ Buluttan Yenile
            </button>
          </div>
        </section>

        <section style={kartStili}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "1050px",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={hucre}>Malzeme</th>
                  <th style={hucre}>Alan</th>
                  <th style={hucre}>Gramaj</th>
                  <th style={hucre}>Kg Fiyatı</th>
                  <th style={hucre}>Fiyat Tipi</th>
                  <th style={hucre}>Gram Maliyeti</th>
                  <th style={hucre}>Direkt Fiyat</th>
                  <th style={hucre}>Kullanılan Maliyet</th>
                </tr>
              </thead>

              <tbody>
                {filtrelenmisMalzemeler.map((malzeme) => {
                  const gramMaliyeti =
                    (Number(malzeme.birimFiyat || 0) / 1000) *
                    Number(malzeme.gramaj || 0);

                  const kullanilanMaliyet =
                    maliyetHesapla(malzeme);

                  return (
                    <tr key={malzeme.id}>
                      <td style={hucre}>
                        <strong>{malzeme.ad}</strong>
                      </td>

                      <td style={hucre}>
                        {malzeme.kullanimAlani}
                      </td>

                      <td style={hucre}>
                        <input
                          type="number"
                          min="0"
                          value={malzeme.gramaj}
                          disabled={!hazir || kaydedilenId !== null}
                          onChange={(event) =>
                            guncelle(
                              malzeme.id,
                              "gramaj",
                              Number(event.target.value)
                            )
                          }
                          onBlur={() => void satiriKaydet(malzeme.id)}
                          style={{
                            width: "90px",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                          }}
                        />{" "}
                        g
                      </td>

                      <td style={hucre}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={malzeme.birimFiyat}
                          disabled={!hazir || kaydedilenId !== null}
                          onChange={(event) =>
                            guncelle(
                              malzeme.id,
                              "birimFiyat",
                              Number(event.target.value)
                            )
                          }
                          onBlur={() => void satiriKaydet(malzeme.id)}
                          style={{
                            width: "110px",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                          }}
                        />
                      </td>

                      <td style={hucre}>
                        <select
                          value={malzeme.fiyatTipi}
                          disabled={!hazir || kaydedilenId !== null}
                          onChange={(event) =>
                            guncelle(malzeme.id, "fiyatTipi", event.target.value as Malzeme["fiyatTipi"])
                          }
                          onBlur={() => void satiriKaydet(malzeme.id)}
                          style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: "8px" }}
                        >
                          <option value="kg">Kg</option>
                          <option value="adet">Adet</option>
                          <option value="direkt">Direkt porsiyon</option>
                        </select>
                      </td>

                      <td style={hucre}>
                        {para(gramMaliyeti)}
                      </td>

                      <td style={hucre}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={malzeme.direktFiyat}
                          disabled={!hazir || kaydedilenId !== null}
                          onChange={(event) =>
                            guncelle(
                              malzeme.id,
                              "direktFiyat",
                              Number(event.target.value)
                            )
                          }
                          onBlur={() => void satiriKaydet(malzeme.id)}
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
                            kullanilanMaliyet > 0
                              ? "#174d38"
                              : "#6b7280",
                        }}
                      >
                        {para(kullanilanMaliyet)}
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
