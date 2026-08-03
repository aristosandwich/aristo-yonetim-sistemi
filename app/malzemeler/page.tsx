"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  malzemeler as varsayilanMalzemeler,
  type Malzeme,
} from "../data/malzemeler";

export default function Malzemeler() {
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);
  const [arama, setArama] = useState("");
  const [alan, setAlan] = useState<"Tümü" | "Sandviç" | "Salata">(
    "Tümü"
  );

  useEffect(() => {
    const kayitliVeri = localStorage.getItem("aristo-malzemeler");

    if (!kayitliVeri) {
      setMalzemeler(varsayilanMalzemeler);

      localStorage.setItem(
        "aristo-malzemeler",
        JSON.stringify(varsayilanMalzemeler)
      );

      return;
    }

    const eskiMalzemeler: Malzeme[] = JSON.parse(kayitliVeri);

    const birlestirilmisMalzemeler = varsayilanMalzemeler.map(
      (varsayilan) => {
        const eski = eskiMalzemeler.find(
          (kayit) =>
            kayit.ad === varsayilan.ad &&
            kayit.kullanimAlani === varsayilan.kullanimAlani
        );

        if (!eski) {
          return varsayilan;
        }

        return {
          ...varsayilan,
          gramaj: eski.gramaj,
          birimFiyat: eski.birimFiyat,
          kalori100Gr: eski.kalori100Gr,
        };
      }
    );

    setMalzemeler(birlestirilmisMalzemeler);

    localStorage.setItem(
      "aristo-malzemeler",
      JSON.stringify(birlestirilmisMalzemeler)
    );
  }, []);

  function guncelle(
    id: number,
    alanAdi: "gramaj" | "birimFiyat" | "kalori100Gr",
    deger: number
  ) {
    const yeniListe = malzemeler.map((malzeme) =>
      malzeme.id === id
        ? {
            ...malzeme,
            [alanAdi]: deger,
          }
        : malzeme
    );

    setMalzemeler(yeniListe);

    localStorage.setItem(
      "aristo-malzemeler",
      JSON.stringify(yeniListe)
    );
  }

  function varsayilanaDon() {
    const onay = window.confirm(
      "Bütün gramaj, fiyat ve kalori bilgileri sıfırlansın mı?"
    );

    if (!onay) return;

    setMalzemeler(varsayilanMalzemeler);

    localStorage.setItem(
      "aristo-malzemeler",
      JSON.stringify(varsayilanMalzemeler)
    );
  }

  const filtrelenmisMalzemeler = useMemo(() => {
    const aranan = arama.trim().toLocaleLowerCase("tr-TR");

    return malzemeler.filter((malzeme) => {
      const alanUygun =
        alan === "Tümü" || malzeme.kullanimAlani === alan;

      const aramaUygun =
        !aranan ||
        malzeme.ad.toLocaleLowerCase("tr-TR").includes(aranan);

      return alanUygun && aramaUygun;
    });
  }, [malzemeler, arama, alan]);

  const para = (tutar: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(tutar);

  return (
    <main
      style={{
        maxWidth: "1150px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Link href="/">← Ana Sayfaya Dön</Link>

      <h1>🥬 Malzemeler</h1>

      <label>Malzeme Ara</label>
      <br />

      <input
        value={arama}
        onChange={(event) => setArama(event.target.value)}
        placeholder="Örneğin: Rozbif"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "10px",
          boxSizing: "border-box",
        }}
      />

      <br />
      <br />

      <label>Kullanım Alanı</label>
      <br />

      <select
        value={alan}
        onChange={(event) =>
          setAlan(
            event.target.value as "Tümü" | "Sandviç" | "Salata"
          )
        }
      >
        <option>Tümü</option>
        <option>Sandviç</option>
        <option>Salata</option>
      </select>

      <br />
      <br />

      <button onClick={varsayilanaDon}>
        ↩️ Bütün Bilgileri Sıfırla
      </button>

      <hr style={{ margin: "30px 0" }} />

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "900px",
          }}
        >
          <thead>
            <tr>
              <th style={hucre}>Malzeme</th>
              <th style={hucre}>Alan</th>
              <th style={hucre}>Gramaj</th>
              <th style={hucre}>Alış Fiyatı (₺/kg)</th>
              <th style={hucre}>Porsiyon Maliyeti</th>
              <th style={hucre}>Kalori / 100 g</th>
              <th style={hucre}>Porsiyon Kalorisi</th>
            </tr>
          </thead>

          <tbody>
            {filtrelenmisMalzemeler.map((malzeme) => {
              const porsiyonMaliyeti =
                (Number(malzeme.birimFiyat || 0) / 1000) *
                Number(malzeme.gramaj || 0);

              const porsiyonKalorisi =
                (Number(malzeme.kalori100Gr || 0) / 100) *
                Number(malzeme.gramaj || 0);

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
                      onChange={(event) =>
                        guncelle(
                          malzeme.id,
                          "gramaj",
                          Number(event.target.value)
                        )
                      }
                      style={{ width: "90px" }}
                    />{" "}
                    g
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
                      style={{ width: "110px" }}
                    />
                  </td>

                  <td style={hucre}>
                    {para(porsiyonMaliyeti)}
                  </td>

                  <td style={hucre}>
                    <input
                      type="number"
                      min="0"
                      value={malzeme.kalori100Gr}
                      onChange={(event) =>
                        guncelle(
                          malzeme.id,
                          "kalori100Gr",
                          Number(event.target.value)
                        )
                      }
                      style={{ width: "100px" }}
                    />
                  </td>

                  <td style={hucre}>
                    {porsiyonKalorisi.toFixed(1)} kcal
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