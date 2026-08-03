"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Malzeme = {
  id: number;
  ad: string;
  kullanimAlani: "Sandviç" | "Salata";
  gramaj: number;
  birimFiyat: number;
  kalori100Gr: number;
};

type StokKaydi = {
  malzemeId: number;
  miktarGr: number;
  kritikGr: number;
};

export default function Stok() {
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);
  const [stoklar, setStoklar] = useState<StokKaydi[]>([]);
  const [arama, setArama] = useState("");
  const [alan, setAlan] = useState<
    "Tümü" | "Sandviç" | "Salata"
  >("Tümü");

  useEffect(() => {
    const kayitliMalzemeler: Malzeme[] = JSON.parse(
      localStorage.getItem("aristo-malzemeler") || "[]"
    );

    const kayitliStoklar: StokKaydi[] = JSON.parse(
      localStorage.getItem("aristo-stok") || "[]"
    );

    const birlestirilmisStoklar = kayitliMalzemeler.map(
      (malzeme) => {
        const kayitliStok = kayitliStoklar.find(
          (stok) => stok.malzemeId === malzeme.id
        );

        return {
          malzemeId: malzeme.id,
          miktarGr: Number(kayitliStok?.miktarGr || 0),
          kritikGr: Number(
            kayitliStok?.kritikGr ??
              (malzeme.kullanimAlani === "Sandviç"
                ? 500
                : 1000)
          ),
        };
      }
    );

    setMalzemeler(kayitliMalzemeler);
    setStoklar(birlestirilmisStoklar);

    localStorage.setItem(
      "aristo-stok",
      JSON.stringify(birlestirilmisStoklar)
    );
  }, []);

  function kaydet(yeniListe: StokKaydi[]) {
    setStoklar(yeniListe);

    localStorage.setItem(
      "aristo-stok",
      JSON.stringify(yeniListe)
    );
  }

  function guncelle(
    malzemeId: number,
    alanAdi: "miktarGr" | "kritikGr",
    deger: number
  ) {
    const yeniListe = stoklar.map((stok) =>
      stok.malzemeId === malzemeId
        ? {
            ...stok,
            [alanAdi]: Math.max(deger, 0),
          }
        : stok
    );

    kaydet(yeniListe);
  }

  function stokEkle(malzemeId: number) {
    const miktar = Number(
      window.prompt("Eklenecek miktar (gram)") || 0
    );

    if (miktar <= 0) return;

    const yeniListe = stoklar.map((stok) =>
      stok.malzemeId === malzemeId
        ? {
            ...stok,
            miktarGr: stok.miktarGr + miktar,
          }
        : stok
    );

    kaydet(yeniListe);
  }

  function stokCikar(malzemeId: number) {
    const miktar = Number(
      window.prompt("Çıkarılacak miktar (gram)") || 0
    );

    if (miktar <= 0) return;

    const yeniListe = stoklar.map((stok) =>
      stok.malzemeId === malzemeId
        ? {
            ...stok,
            miktarGr: Math.max(stok.miktarGr - miktar, 0),
          }
        : stok
    );

    kaydet(yeniListe);
  }

  const liste = useMemo(() => {
    const aranan = arama
      .trim()
      .toLocaleLowerCase("tr-TR");

    return malzemeler
      .filter((malzeme) => {
        const aramaUygun =
          !aranan ||
          malzeme.ad
            .toLocaleLowerCase("tr-TR")
            .includes(aranan);

        const alanUygun =
          alan === "Tümü" ||
          malzeme.kullanimAlani === alan;

        return aramaUygun && alanUygun;
      })
      .map((malzeme) => {
        const stok = stoklar.find(
          (kayit) => kayit.malzemeId === malzeme.id
        );

        const miktarGr = Number(stok?.miktarGr || 0);
        const kritikGr = Number(stok?.kritikGr || 0);

        return {
          ...malzeme,
          miktarGr,
          kritikGr,
          kritik: miktarGr <= kritikGr,
          porsiyonSayisi:
            malzeme.gramaj > 0
              ? Math.floor(miktarGr / malzeme.gramaj)
              : 0,
          stokDegeri:
            (Number(malzeme.birimFiyat || 0) / 1000) *
            miktarGr,
        };
      });
  }, [malzemeler, stoklar, arama, alan]);

  const kritikSayisi = liste.filter(
    (malzeme) => malzeme.kritik
  ).length;

  const toplamStokGr = liste.reduce(
    (toplam, malzeme) => toplam + malzeme.miktarGr,
    0
  );

  const toplamStokDegeri = liste.reduce(
    (toplam, malzeme) => toplam + malzeme.stokDegeri,
    0
  );

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

  const butonStili = {
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "8px 10px",
    background: "#ffffff",
    cursor: "pointer",
    fontWeight: "bold",
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
      <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
        <Link href="/">← Ana Sayfaya Dön</Link>

        <h1 style={{ marginBottom: "6px" }}>
          📦 Stok Yönetimi
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: "24px",
            color: "#6b7280",
          }}
        >
          Malzeme stoklarını ve kritik seviyeleri yönet.
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
              Malzeme sayısı
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {liste.length}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Kritik stok
            </small>

            <h2
              style={{
                marginBottom: 0,
                color:
                  kritikSayisi > 0 ? "#b91c1c" : "#15803d",
              }}
            >
              {kritikSayisi}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Toplam stok
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {(toplamStokGr / 1000).toFixed(2)} kg
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Tahmini stok değeri
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {para(toplamStokDegeri)}
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
              type="text"
              placeholder="Örneğin: Rozbif"
              value={arama}
              onChange={(event) =>
                setArama(event.target.value)
              }
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
                  <th style={hucre}>Mevcut Stok</th>
                  <th style={hucre}>Kritik Seviye</th>
                  <th style={hucre}>Porsiyon</th>
                  <th style={hucre}>Stok Değeri</th>
                  <th style={hucre}>Durum</th>
                  <th style={hucre}>İşlem</th>
                </tr>
              </thead>

              <tbody>
                {liste.map((malzeme) => (
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
                        value={malzeme.miktarGr}
                        onChange={(event) =>
                          guncelle(
                            malzeme.id,
                            "miktarGr",
                            Number(event.target.value)
                          )
                        }
                        style={{
                          width: "110px",
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
                        value={malzeme.kritikGr}
                        onChange={(event) =>
                          guncelle(
                            malzeme.id,
                            "kritikGr",
                            Number(event.target.value)
                          )
                        }
                        style={{
                          width: "110px",
                          padding: "8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                        }}
                      />{" "}
                      g
                    </td>

                    <td style={hucre}>
                      {malzeme.porsiyonSayisi} porsiyon
                    </td>

                    <td style={hucre}>
                      {para(malzeme.stokDegeri)}
                    </td>

                    <td
                      style={{
                        ...hucre,
                        color: malzeme.kritik
                          ? "#b91c1c"
                          : "#15803d",
                        fontWeight: "bold",
                      }}
                    >
                      {malzeme.kritik
                        ? "⚠️ Kritik"
                        : "✅ Yeterli"}
                    </td>

                    <td style={hucre}>
                      <div
                        style={{
                          display: "flex",
                          gap: "7px",
                        }}
                      >
                        <button
                          onClick={() =>
                            stokEkle(malzeme.id)
                          }
                          style={butonStili}
                        >
                          ➕
                        </button>

                        <button
                          onClick={() =>
                            stokCikar(malzeme.id)
                          }
                          style={butonStili}
                        >
                          ➖
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {liste.length === 0 && (
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