"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Kategori = "Sandviç" | "Salata" | "İçecek" | "Ek Ürün";

type Urun = {
  id: number;
  ad: string;
  kategori: Kategori;
  satisFiyati: number;
  maliyet?: number;
  aktif: boolean;
};

type Malzeme = {
  id: number;
  ad: string;
  kullanimAlani: "Sandviç" | "Salata";
  gramaj: number;
  birimFiyat: number;
  direktFiyat: number;
  fiyatTipi: "kg" | "adet" | "direkt";
};

type Recete = {
  urun: string;
  malzemeler: {
    malzeme: string;
    gram: number;
  }[];
};

type SupabaseKaydi = Record<string, unknown>;

function para(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(tutar);
}

function metin(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sayi(value: unknown) {
  const sonuc = Number(value || 0);
  return Number.isFinite(sonuc) ? sonuc : 0;
}

function diziyeCevir(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function urunleriDonustur(kayitlar: SupabaseKaydi[]) {
  return kayitlar
    .map((kayit) => ({
      id: sayi(kayit.id),
      ad: metin(kayit.ad),
      kategori: metin(kayit.kategori) as Kategori,
      satisFiyati: sayi(kayit.satis_fiyati ?? kayit.satisFiyati),
      maliyet: sayi(kayit.maliyet),
      aktif: kayit.aktif !== false,
    }))
    .filter((urun) => urun.ad)
    .sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}

function malzemeleriDonustur(kayitlar: SupabaseKaydi[]) {
  return kayitlar
    .map((kayit) => ({
      id: sayi(kayit.id),
      ad: metin(kayit.ad),
      kullanimAlani: metin(
        kayit.kullanim_alani ?? kayit.kullanimAlani
      ) as "Sandviç" | "Salata",
      gramaj: sayi(kayit.gramaj),
      birimFiyat: sayi(kayit.birim_fiyat ?? kayit.birimFiyat),
      direktFiyat: sayi(kayit.direkt_fiyat ?? kayit.direktFiyat),
      fiyatTipi: (["kg", "adet", "direkt"].includes(
        metin(kayit.fiyat_tipi ?? kayit.fiyatTipi)
      )
        ? metin(kayit.fiyat_tipi ?? kayit.fiyatTipi)
        : "kg") as "kg" | "adet" | "direkt",
    }))
    .filter((malzeme) => malzeme.ad)
    .sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}

function receteleriDonustur(
  kayitlar: SupabaseKaydi[],
  urunler: Urun[],
  malzemeler: Malzeme[]
) {
  const urunAdlari = new Map(urunler.map((urun) => [String(urun.id), urun.ad]));
  const malzemeAdlari = new Map(
    malzemeler.map((malzeme) => [String(malzeme.id), malzeme.ad])
  );
  const gruplanmis = new Map<string, Recete["malzemeler"]>();

  kayitlar.forEach((kayit) => {
    const receteNesnesi =
      kayit.recete && typeof kayit.recete === "object" && !Array.isArray(kayit.recete)
        ? (kayit.recete as SupabaseKaydi)
        : undefined;

    const urunAdi =
      metin(kayit.urun ?? kayit.urun_adi ?? kayit.urun_ad ?? kayit.ad) ||
      metin(receteNesnesi?.urun) ||
      urunAdlari.get(String(kayit.urun_id ?? kayit.urunId ?? "")) ||
      "";

    if (!urunAdi) return;

    const hamMalzemeler =
      kayit.malzemeler ??
      kayit.icerikler ??
      receteNesnesi?.malzemeler ??
      receteNesnesi?.icerikler ??
      kayit.recete;
    const satirlar = diziyeCevir(hamMalzemeler);

    const eklenecekSatirlar = (satirlar.length ? satirlar : [kayit])
      .map((satir) => {
        if (!satir || typeof satir !== "object" || Array.isArray(satir)) {
          return null;
        }

        const veri = satir as SupabaseKaydi;
        const malzemeAdi =
          metin(veri.malzeme ?? veri.malzeme_adi ?? veri.malzeme_ad ?? veri.ad) ||
          malzemeAdlari.get(
            String(veri.malzeme_id ?? veri.malzemeId ?? kayit.malzeme_id ?? "")
          ) ||
          "";

        if (!malzemeAdi) return null;

        return {
          malzeme: malzemeAdi,
          gram: sayi(veri.gram ?? veri.gramaj ?? veri.miktar),
        };
      })
      .filter((satir): satir is Recete["malzemeler"][number] => satir !== null);

    if (!eklenecekSatirlar.length) return;

    const mevcut = gruplanmis.get(urunAdi) || [];
    gruplanmis.set(urunAdi, [...mevcut, ...eklenecekSatirlar]);
  });

  return Array.from(gruplanmis, ([urun, receteMalzemeleri]) => ({
    urun,
    malzemeler: receteMalzemeleri,
  }));
}

export default function MaliyetVeKarlilik() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);
  const [receteler, setReceteler] = useState<Recete[]>([]);
  const [arama, setArama] = useState("");
  const [kategori, setKategori] = useState<"Tümü" | Kategori>("Tümü");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");

  useEffect(() => {
    let aktif = true;

    async function yukle() {
      setYukleniyor(true);
      setHata("");

      const [urunSonucu, malzemeSonucu, receteSonucu] = await Promise.all([
        supabase.from("urunler").select("*"),
        supabase.from("malzemeler").select("*"),
        supabase.from("receteler").select("*"),
      ]);

      if (!aktif) return;

      const ilkHata = urunSonucu.error || malzemeSonucu.error || receteSonucu.error;

      if (ilkHata) {
        setHata(`Veriler yüklenemedi: ${ilkHata.message}`);
        setYukleniyor(false);
        return;
      }

      const yeniUrunler = urunleriDonustur(
        (urunSonucu.data || []) as SupabaseKaydi[]
      );
      const yeniMalzemeler = malzemeleriDonustur(
        (malzemeSonucu.data || []) as SupabaseKaydi[]
      );
      const yeniReceteler = receteleriDonustur(
        (receteSonucu.data || []) as SupabaseKaydi[],
        yeniUrunler,
        yeniMalzemeler
      );

      setUrunler(yeniUrunler);
      setMalzemeler(yeniMalzemeler);
      setReceteler(yeniReceteler);
      setYukleniyor(false);
    }

    void yukle();
    window.addEventListener("focus", yukle);

    return () => {
      aktif = false;
      window.removeEventListener("focus", yukle);
    };
  }, []);

  function maliyetHesapla(urun: Urun) {
    const recete = receteler.find((kayit) => kayit.urun === urun.ad);

    if (!recete) {
      return {
        maliyet: Number(urun.maliyet || 0),
        receteVar: false,
        eksik: 0,
      };
    }

    const kullanimAlani = urun.kategori === "Salata" ? "Salata" : "Sandviç";
    let maliyet = 0;
    let eksik = 0;

    recete.malzemeler.forEach((satir) => {
      const adaylar = malzemeler.filter((m) => m.ad === satir.malzeme);
      const fiyatiVar = (kayit: Malzeme) =>
        Number(kayit.direktFiyat || 0) > 0 ||
        Number(kayit.birimFiyat || 0) > 0;
      const malzeme =
        adaylar.find(
          (m) => m.kullanimAlani === kullanimAlani && fiyatiVar(m)
        ) ||
        adaylar.find(fiyatiVar) ||
        adaylar.find((m) => m.kullanimAlani === kullanimAlani) ||
        adaylar[0];

      if (!malzeme || !fiyatiVar(malzeme)) {
        eksik += 1;
        return;
      }

      const direktFiyat = Number(malzeme.direktFiyat || 0);
      const birimFiyat = Number(malzeme.birimFiyat || 0);

      if (direktFiyat > 0) {
        maliyet += direktFiyat;
      } else if (
        malzeme.fiyatTipi === "adet" ||
        malzeme.fiyatTipi === "direkt"
      ) {
        maliyet += birimFiyat;
      } else {
        maliyet += (birimFiyat / 1000) * Number(satir.gram || 0);
      }
    });

    return { maliyet, receteVar: true, eksik };
  }

  const hesaplanan = useMemo(() => {
    return urunler.map((urun) => {
      const sonuc = maliyetHesapla(urun);
      const satis = Number(urun.satisFiyati || 0);
      const kar = satis - sonuc.maliyet;
      const karMarji = satis > 0 ? (kar / satis) * 100 : 0;
      const maliyetOrani = satis > 0 ? (sonuc.maliyet / satis) * 100 : 0;

      return {
        ...urun,
        hesaplananMaliyet: sonuc.maliyet,
        receteVar: sonuc.receteVar,
        eksik: sonuc.eksik,
        kar,
        karMarji,
        maliyetOrani,
      };
    });
  }, [urunler, malzemeler, receteler]);

  const filtreli = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr-TR");
    return hesaplanan.filter((urun) => {
      const kategoriUygun = kategori === "Tümü" || urun.kategori === kategori;
      const aramaUygun = !q || urun.ad.toLocaleLowerCase("tr-TR").includes(q);
      return kategoriUygun && aramaUygun;
    });
  }, [hesaplanan, arama, kategori]);

  const receteli = hesaplanan.filter((u) => u.receteVar);
  const ortMaliyet = receteli.length
    ? receteli.reduce((t, u) => t + u.hesaplananMaliyet, 0) / receteli.length
    : 0;
  const ortKar = receteli.length
    ? receteli.reduce((t, u) => t + u.kar, 0) / receteli.length
    : 0;
  const ortMarj = receteli.length
    ? receteli.reduce((t, u) => t + u.karMarji, 0) / receteli.length
    : 0;
  const eksikUrun = receteli.filter((u) => u.eksik > 0).length;

  const kart = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
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
        <h1 style={{ marginBottom: "6px", color: "#153f30" }}>
          💰 Maliyet & Kârlılık
        </h1>
        <p style={{ marginTop: 0, color: "#6b7280" }}>
          Reçete ile Malzemeler ekranındaki kg, adet veya direkt fiyat bilgisi
          kullanılır. Kalori bu ekranda yoktur.
        </p>

        {hata && (
          <p
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: "#fef2f2",
              color: "#b91c1c",
              fontWeight: "bold",
            }}
          >
            {hata}
          </p>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: "14px",
            margin: "24px 0",
          }}
        >
          <Ozet baslik="Ortalama Maliyet" deger={para(ortMaliyet)} />
          <Ozet baslik="Ortalama Birim Kâr" deger={para(ortKar)} />
          <Ozet baslik="Ortalama Kâr Marjı" deger={`%${ortMarj.toFixed(1)}`} />
          <Ozet
            baslik="Fiyatı Eksik Reçete"
            deger={String(eksikUrun)}
            uyari={eksikUrun > 0}
          />
        </section>

        <section
          style={{
            ...kart,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Ürün ara..."
            style={alan}
          />
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value as "Tümü" | Kategori)}
            style={alan}
          >
            <option>Tümü</option>
            <option>Sandviç</option>
            <option>Salata</option>
            <option>İçecek</option>
            <option>Ek Ürün</option>
          </select>
        </section>

        <section style={kart}>
          {yukleniyor ? (
            <p style={{ color: "#6b7280" }}>Veriler yükleniyor...</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "950px",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={hucre}>Ürün</th>
                    <th style={hucre}>Kategori</th>
                    <th style={hucre}>Satış Fiyatı</th>
                    <th style={hucre}>Ürün Maliyeti</th>
                    <th style={hucre}>Birim Kâr</th>
                    <th style={hucre}>Kâr Marjı</th>
                    <th style={hucre}>Maliyet Oranı</th>
                    <th style={hucre}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {filtreli.map((urun) => (
                    <tr key={urun.id}>
                      <td style={hucre}>
                        <strong>{urun.ad}</strong>
                      </td>
                      <td style={hucre}>{urun.kategori}</td>
                      <td style={hucre}>{para(Number(urun.satisFiyati || 0))}</td>
                      <td style={hucre}>
                        {urun.receteVar || urun.hesaplananMaliyet > 0
                          ? para(urun.hesaplananMaliyet)
                          : "—"}
                      </td>
                      <td
                        style={{
                          ...hucre,
                          fontWeight: "bold",
                          color: urun.kar >= 0 ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {urun.receteVar || urun.hesaplananMaliyet > 0
                          ? para(urun.kar)
                          : "—"}
                      </td>
                      <td style={hucre}>
                        {urun.receteVar || urun.hesaplananMaliyet > 0
                          ? `%${urun.karMarji.toFixed(1)}`
                          : "—"}
                      </td>
                      <td style={hucre}>
                        {urun.receteVar || urun.hesaplananMaliyet > 0
                          ? `%${urun.maliyetOrani.toFixed(1)}`
                          : "—"}
                      </td>
                      <td style={hucre}>
                        {!urun.receteVar ? (
                          <span style={{ color: "#6b7280", fontWeight: "bold" }}>
                            Reçete yok
                          </span>
                        ) : urun.eksik > 0 ? (
                          <span style={{ color: "#b45309", fontWeight: "bold" }}>
                            ⚠️ {urun.eksik} fiyat eksik
                          </span>
                        ) : (
                          <span style={{ color: "#15803d", fontWeight: "bold" }}>
                            ✅ Hazır
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Ozet({
  baslik,
  deger,
  uyari = false,
}: {
  baslik: string;
  deger: string;
  uyari?: boolean;
}) {
  return (
    <div
      style={{
        background: uyari ? "#fff7ed" : "#fff",
        border: uyari ? "1px solid #fdba74" : "1px solid #e5e7eb",
        borderRadius: "18px",
        padding: "18px",
      }}
    >
      <small style={{ color: "#6b7280", fontWeight: "bold" }}>{baslik}</small>
      <strong
        style={{
          display: "block",
          marginTop: "8px",
          fontSize: "24px",
          color: uyari ? "#b45309" : "#174d38",
        }}
      >
        {deger}
      </strong>
    </div>
  );
}

const alan = {
  width: "100%",
  padding: "11px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  boxSizing: "border-box" as const,
  background: "#ffffff",
};

const hucre = {
  borderBottom: "1px solid #e5e7eb",
  padding: "13px 10px",
  textAlign: "left" as const,
};