export type MaliyetMalzemesi = {
  ad: string;
  kullanimAlani: "Sandviç" | "Salata";
  birimFiyat: number;
  direktFiyat: number;
  fiyatTipi: "kg" | "adet" | "direkt";
};

export type MaliyetSatiri = { malzeme: string; gram: number };

export function maliyetMetniniNormallestir(deger: string) {
  return deger.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
}

export function malzemeBul(
  malzemeler: MaliyetMalzemesi[],
  satir: MaliyetSatiri,
  kullanimAlani: "Sandviç" | "Salata"
) {
  const ad = maliyetMetniniNormallestir(satir.malzeme);
  const adaylar = malzemeler.filter((m) => maliyetMetniniNormallestir(m.ad) === ad);
  return adaylar.find((m) => m.kullanimAlani === kullanimAlani) ?? adaylar[0];
}

export function malzemeSatirMaliyeti(malzeme: MaliyetMalzemesi, gram: number) {
  const direkt = Number(malzeme.direktFiyat || 0);
  const birim = Number(malzeme.birimFiyat || 0);
  const miktar = Number(gram || 0);
  if (direkt > 0 || malzeme.fiyatTipi === "direkt") {
    return Math.round((direkt || birim) * 100) / 100;
  }
  if (birim <= 0 || miktar < 0) return 0;
  if (malzeme.fiyatTipi === "adet") {
    return Math.round(birim * miktar * 100) / 100;
  }
  return Math.round((birim / 1000) * miktar * 100) / 100;
}

export function receteMaliyeti(
  satirlar: MaliyetSatiri[],
  malzemeler: MaliyetMalzemesi[],
  kullanimAlani: "Sandviç" | "Salata"
) {
  let kurus = 0;
  let eksik = 0;
  for (const satir of satirlar) {
    const malzeme = malzemeBul(malzemeler, satir, kullanimAlani);
    if (!malzeme || (Number(malzeme.direktFiyat || 0) <= 0 && Number(malzeme.birimFiyat || 0) <= 0)) {
      eksik += 1;
      continue;
    }
    kurus += Math.round(malzemeSatirMaliyeti(malzeme, satir.gram) * 100);
  }
  return { maliyet: kurus / 100, eksik };
}
