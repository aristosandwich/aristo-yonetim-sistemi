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

  useEffect(() => {
    const kayitliMalzemeler: Malzeme[] = JSON.parse(
      localStorage.getItem("aristo-malzemeler") || "[]"
    );

    const kayitliStoklar: StokKaydi[] = JSON.parse(
      localStorage.getItem("aristo-stok") || "[]"
    );

    setMalzemeler(kayitliMalzemeler);

    if (kayitliStoklar.length > 0) {
      setStoklar(kayitliStoklar);
    } else {
      const ilkStoklar = kayitliMalzemeler.map((malzeme) => ({
        malzemeId: malzeme.id,
        miktarGr: 0,
        kritikGr: malzeme.kullanimAlani === "Sandviç" ? 500 : 1000,
      }));

      setStoklar(ilkStoklar);

      localStorage.setItem(
        "aristo-stok",
        JSON.stringify(ilkStoklar)
      );
    }
  }, []);

  function guncelle(
    malzemeId: number,
    alan: "miktarGr" | "kritikGr",
    deger: number
  ) {
    const yeniListe = stoklar.map((stok) =>
      stok.malzemeId === malzemeId
        ? {
            ...stok,
            [alan]: deger,
          }
        : stok
    );

    setStoklar(yeniListe);

    localStorage.setItem(
      "aristo-stok",
      JSON.stringify(yeniListe)
    );
  }

  const liste = useMemo(() => {
    const aranan = arama.trim().toLocaleLowerCase("tr-TR");

    return malzemeler
      .filter((malzeme) =>
        !aranan
          ? true
          : malzeme.ad
              .toLocaleLowerCase("tr-TR")
              .includes(aranan)
      )
      .map((malzeme) => {
        const stok = stoklar.find(
          (kayit) => kayit.malzemeId === malzeme.id
        );

        return {
          ...malzeme,
          miktarGr: stok?.miktarGr || 0,
          kritikGr: stok?.kritikGr || 0,
        };
      });
  }, [malzemeler, stoklar, arama]);

  return (
    <main
      style={{
        maxWidth: "1050px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Link href="/">← Ana Sayfaya Dön</Link>

      <h1>📦 Stok Yönetimi</h1>

      <input
        type="text"
        placeholder="Malzeme ara"
        value={arama}
        onChange={(event) => setArama(event.target.value)}
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "10px",
          boxSizing: "border-box",
        }}
      />

      <hr style={{ margin: "30px 0" }} />

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            minWidth: "760px",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={hucre}>Malzeme</th>
              <th style={hucre}>Alan</th>
              <th style={hucre}>Mevcut Stok</th>
              <th style={hucre}>Kritik Seviye</th>
              <th style={hucre}>Durum</th>
            </tr>
          </thead>

          <tbody>
            {liste.map((malzeme) => {
              const kritik =
                malzeme.miktarGr <= malzeme.kritikGr;

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
                      value={malzeme.miktarGr}
                      onChange={(event) =>
                        guncelle(
                          malzeme.id,
                          "miktarGr",
                          Number(event.target.value)
                        )
                      }
                      style={{ width: "110px" }}
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
                      style={{ width: "110px" }}
                    />{" "}
                    g
                  </td>

                  <td
                    style={{
                      ...hucre,
                      color: kritik ? "#b91c1c" : "#15803d",
                      fontWeight: "bold",
                    }}
                  >
                    {kritik ? "⚠️ Kritik" : "✅ Yeterli"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const hucre = {
  border: "1px solid #e5e7eb",
  padding: "10px",
  textAlign: "left" as const,
};