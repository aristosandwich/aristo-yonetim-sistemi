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
  kalori100Gr: number;
};

export default function Receteler() {
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);
  const [secilenUrun, setSecilenUrun] = useState(
    receteler[0]?.urun || ""
  );

  useEffect(() => {
    const kayitliMalzemeler: Malzeme[] = JSON.parse(
      localStorage.getItem("aristo-malzemeler") || "[]"
    );

    setMalzemeler(kayitliMalzemeler);
  }, []);

  const secilenRecete = useMemo(
    () => receteler.find((recete) => recete.urun === secilenUrun),
    [secilenUrun]
  );

  const hesaplananSatirlar = useMemo(() => {
    return (secilenRecete?.malzemeler || []).map((satir) => {
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

      const kalori = malzeme
        ? (Number(malzeme.kalori100Gr || 0) / 100) *
          Number(satir.gram || 0)
        : 0;

      return {
        ...satir,
        maliyet,
        kalori,
        eslesti: Boolean(malzeme),
      };
    });
  }, [secilenRecete, malzemeler, secilenUrun]);

  const toplamMaliyet = hesaplananSatirlar.reduce(
    (toplam, satir) => toplam + satir.maliyet,
    0
  );

  const toplamKalori = hesaplananSatirlar.reduce(
    (toplam, satir) => toplam + satir.kalori,
    0
  );

  const toplamGramaj = hesaplananSatirlar.reduce(
    (toplam, satir) => toplam + Number(satir.gram || 0),
    0
  );

  const para = (tutar: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(tutar);

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Link href="/">← Ana Sayfaya Dön</Link>

      <h1>📋 Reçeteler</h1>

      <label>Ürün</label>
      <br />

      <select
        value={secilenUrun}
        onChange={(event) => setSecilenUrun(event.target.value)}
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "10px",
        }}
      >
        {receteler.map((recete) => (
          <option key={recete.urun} value={recete.urun}>
            {recete.urun}
          </option>
        ))}
      </select>

      <hr style={{ margin: "30px 0" }} />

      <h2>{secilenUrun}</h2>

      {hesaplananSatirlar.map((satir, index) => (
        <div
          key={`${satir.malzeme}-${index}`}
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(180px, 1fr) 90px 140px 120px",
            gap: "12px",
            alignItems: "center",
            borderBottom: "1px solid #e5e7eb",
            padding: "12px 0",
          }}
        >
          <strong>{satir.malzeme}</strong>

          <span>{satir.gram} g</span>

          <span>{para(satir.maliyet)}</span>

          <span
            style={{
              color: satir.eslesti ? "#15803d" : "#b91c1c",
            }}
          >
            {satir.eslesti
              ? `${satir.kalori.toFixed(1)} kcal`
              : "Eşleşmedi"}
          </span>
        </div>
      ))}

      <hr style={{ margin: "30px 0" }} />

      <h2>Toplam Gramaj: {toplamGramaj} g</h2>
      <h2>Toplam Maliyet: {para(toplamMaliyet)}</h2>
      <h2>Toplam Kalori: {toplamKalori.toFixed(1)} kcal</h2>
    </main>
  );
}