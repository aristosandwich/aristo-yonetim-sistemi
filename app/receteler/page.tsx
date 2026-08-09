"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { receteler } from "../data/receteler";

type Malzeme = {
  id: number;
  ad: string;
  kullanimAlani: "Sandviç" | "Salata";
  gramaj: number;
  birimFiyat: number;
};

export default function Receteler() {
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);
  const [arama, setArama] = useState("");
  const [secilenUrun, setSecilenUrun] = useState(
    receteler[0]?.urun || ""
  );

  useEffect(() => {
    const kayitliMalzemeler: Malzeme[] = JSON.parse(
      localStorage.getItem("aristo-malzemeler") || "[]"
    );

    setMalzemeler(kayitliMalzemeler);
  }, []);

  const filtrelenmisReceteler = useMemo(() => {
    const aranan = arama.trim().toLocaleLowerCase("tr-TR");

    if (!aranan) {
      return receteler;
    }

    return receteler.filter((recete) =>
      recete.urun.toLocaleLowerCase("tr-TR").includes(aranan)
    );
  }, [arama]);

  const secilenRecete = useMemo(
    () =>
      receteler.find(
        (recete) => recete.urun === secilenUrun
      ),
    [secilenUrun]
  );

  const hesaplananSatirlar = useMemo(() => {
    return (secilenRecete?.malzemeler || []).map(
      (satir) => {
        const bulunanMalzemeler = malzemeler.filter(
          (malzeme) => malzeme.ad === satir.malzeme
        );

        const malzeme =
          bulunanMalzemeler.find((kayit) =>
            secilenUrun.includes("Salata")
              ? kayit.kullanimAlani === "Salata"
              : kayit.kullanimAlani === "Sandviç"
          ) || bulunanMalzemeler[0];

        const maliyet = malzeme
          ? (Number(malzeme.birimFiyat || 0) / 1000) *
            Number(satir.gram || 0)
          : 0;

        return {
          ...satir,
          maliyet,
          eslesti: Boolean(malzeme),
          fiyatGirildi:
            Boolean(malzeme) &&
            Number(malzeme?.birimFiyat || 0) > 0,
        };
      }
    );
  }, [secilenRecete, malzemeler, secilenUrun]);

  const toplamMaliyet = hesaplananSatirlar.reduce(
    (toplam, satir) => toplam + satir.maliyet,
    0
  );

  const toplamGramaj = hesaplananSatirlar.reduce(
    (toplam, satir) =>
      toplam + Number(satir.gram || 0),
    0
  );

  const eslesmeyenSayisi = hesaplananSatirlar.filter(
    (satir) => !satir.eslesti
  ).length;

  const fiyatEksikSayisi = hesaplananSatirlar.filter(
    (satir) => satir.eslesti && !satir.fiyatGirildi
  ).length;

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
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <Link href="/">← Ana Sayfaya Dön</Link>

        <h1 style={{ marginBottom: "6px" }}>
          📋 Reçeteler
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: "24px",
            color: "#6b7280",
          }}
        >
          Ürün içeriklerini ve maliyetlerini görüntüle.
        </p>

        <section
          style={{
            ...kartStili,
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <label>
              <strong>Ürün Ara</strong>
            </label>

            <input
              value={arama}
              onChange={(event) =>
                setArama(event.target.value)
              }
              placeholder="Örneğin: Aristo"
              style={{
                ...alanStili,
                marginTop: "7px",
              }}
            />
          </div>

          <div>
            <label>
              <strong>Ürün Seç</strong>
            </label>

            <select
              value={secilenUrun}
              onChange={(event) =>
                setSecilenUrun(event.target.value)
              }
              style={{
                ...alanStili,
                marginTop: "7px",
              }}
            >
              {filtrelenmisReceteler.map((recete) => (
                <option
                  key={recete.urun}
                  value={recete.urun}
                >
                  {recete.urun}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Toplam gramaj
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {toplamGramaj} g
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Toplam maliyet
            </small>

            <h2
              style={{
                marginBottom: 0,
                color: "#174d38",
              }}
            >
              {para(toplamMaliyet)}
            </h2>
          </div>


          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Malzeme sayısı
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {hesaplananSatirlar.length}
            </h2>
          </div>
        </section>

        {(eslesmeyenSayisi > 0 ||
          fiyatEksikSayisi > 0) && (
          <section
            style={{
              ...kartStili,
              borderColor: "#f59e0b",
              background: "#fffbeb",
              marginBottom: "24px",
            }}
          >
            <strong>⚠️ Eksik bilgiler</strong>

            <p style={{ marginBottom: 0 }}>
              Eşleşmeyen: {eslesmeyenSayisi} · Fiyatı eksik:{" "}
              {fiyatEksikSayisi}
            </p>
          </section>
        )}

        <section style={kartStili}>
          <h2 style={{ marginTop: 0 }}>
            {secilenUrun}
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "620px",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={hucre}>Malzeme</th>
                  <th style={hucre}>Gramaj</th>
                  <th style={hucre}>Maliyet</th>
                  <th style={hucre}>Durum</th>
                </tr>
              </thead>

              <tbody>
                {hesaplananSatirlar.map(
                  (satir, index) => (
                    <tr
                      key={`${satir.malzeme}-${index}`}
                    >
                      <td style={hucre}>
                        <strong>{satir.malzeme}</strong>
                      </td>

                      <td style={hucre}>
                        {satir.gram} g
                      </td>

                      <td style={hucre}>
                        {satir.fiyatGirildi
                          ? para(satir.maliyet)
                          : "—"}
                      </td>

                      <td
                        style={{
                          ...hucre,
                          color: !satir.eslesti
                            ? "#b91c1c"
                            : satir.fiyatGirildi
                            ? "#15803d"
                            : "#b45309",
                          fontWeight: "bold",
                        }}
                      >
                        {!satir.eslesti
                          ? "Eşleşmedi"
                          : satir.fiyatGirildi
                          ? "Hazır"
                          : "Eksik bilgi"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {hesaplananSatirlar.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#6b7280",
                padding: "25px",
              }}
            >
              Bu ürünün reçetesi bulunamadı.
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