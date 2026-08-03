"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

type Urun = {
  id: number;
  ad: string;
  kategori: string;
  satisFiyati: number;
  aktif: boolean;
};

type SepetUrunu = {
  urunId: number;
  urun: string;
  kategori: string;
  adet: number;
  birimFiyat: number;
};

type SatisKaydi = {
  id: number;
  islemId: number;
  tarih: string;
  urun: string;
  kategori: string;
  platform: string;
  odemeTipi: string;
  adet: number;
  birimFiyat: number;
  indirim: number;
  toplam: number;
  nakitTutari?: number;
  kartTutari?: number;
  onlineTutari?: number;
  not: string;
};

type SokakOdemeTipi =
  | "Kredi Kartı"
  | "Nakit"
  | "Bölünmüş Ödeme";

const platformlar = [
  "Sokak Satışı",
  "GetirYemek",
  "Trendyol",
  "Yemeksepeti",
];

const kategoriSirasi = [
  "Sandviç",
  "Salata",
  "İçecek",
  "Ek Ürün",
];

function para(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(tutar);
}

function yuvarla(tutar: number) {
  return Math.round((tutar + Number.EPSILON) * 100) / 100;
}

export default function Satislar() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [kategori, setKategori] = useState("Sandviç");

  const [sepet, setSepet] = useState<SepetUrunu[]>([]);
  const [platform, setPlatform] = useState("Sokak Satışı");

  const [odemeTipi, setOdemeTipi] =
    useState<SokakOdemeTipi>("Kredi Kartı");

  const [nakitTutari, setNakitTutari] = useState("0");
  const [kartTutari, setKartTutari] = useState("0");

  const [indirim, setIndirim] = useState("0");
  const [not, setNot] = useState("");

  const [kayitlar, setKayitlar] = useState<SatisKaydi[]>([]);
  const [satisMesaji, setSatisMesaji] = useState("");

  useEffect(() => {
    try {
      const kayitliUrunler: Urun[] = JSON.parse(
        localStorage.getItem("aristo-urunler") || "[]"
      );

      const aktifUrunler = Array.isArray(kayitliUrunler)
        ? kayitliUrunler.filter((urun) => urun.aktif)
        : [];

      setUrunler(aktifUrunler);

      const bulunanIlkKategori = kategoriSirasi.find(
        (kategoriAdi) =>
          aktifUrunler.some(
            (urun) => urun.kategori === kategoriAdi
          )
      );

      if (bulunanIlkKategori) {
        setKategori(bulunanIlkKategori);
      }
    } catch {
      setUrunler([]);
    }

    try {
      const eskiSatislar: SatisKaydi[] = JSON.parse(
        localStorage.getItem("aristo-satislar") || "[]"
      );

      setKayitlar(
        Array.isArray(eskiSatislar) ? eskiSatislar : []
      );
    } catch {
      setKayitlar([]);
    }
  }, []);

  const onlinePlatform = platform !== "Sokak Satışı";

  useEffect(() => {
    if (onlinePlatform) {
      setNakitTutari("0");
      setKartTutari("0");
    }
  }, [onlinePlatform]);

  const sepetAraToplam = useMemo(() => {
    return sepet.reduce(
      (toplam, urun) =>
        toplam + urun.adet * urun.birimFiyat,
      0
    );
  }, [sepet]);

  const indirimTutari = Math.max(
    Number(indirim || 0),
    0
  );

  const genelToplam = Math.max(
    sepetAraToplam - indirimTutari,
    0
  );

  const toplamAdet = sepet.reduce(
    (toplam, urun) => toplam + urun.adet,
    0
  );

  const nakitDegeri = Math.max(
    Number(nakitTutari || 0),
    0
  );

  const kartDegeri = Math.max(
    Number(kartTutari || 0),
    0
  );

  const bolunmusToplam = nakitDegeri + kartDegeri;

  const kalanOdeme = yuvarla(
    genelToplam - bolunmusToplam
  );

  const gorunenKategoriler = useMemo(() => {
    return kategoriSirasi.filter((kategoriAdi) =>
      urunler.some(
        (urun) => urun.kategori === kategoriAdi
      )
    );
  }, [urunler]);

  const filtrelenmisUrunler = useMemo(() => {
    return urunler.filter(
      (urun) => urun.kategori === kategori
    );
  }, [urunler, kategori]);

  function sepeteEkle(urun: Urun) {
    const urunSepette = sepet.find(
      (sepetUrunu) => sepetUrunu.urunId === urun.id
    );

    if (urunSepette) {
      setSepet(
        sepet.map((sepetUrunu) =>
          sepetUrunu.urunId === urun.id
            ? {
                ...sepetUrunu,
                adet: sepetUrunu.adet + 1,
              }
            : sepetUrunu
        )
      );

      return;
    }

    setSepet([
      ...sepet,
      {
        urunId: urun.id,
        urun: urun.ad,
        kategori: urun.kategori,
        adet: 1,
        birimFiyat: Number(urun.satisFiyati || 0),
      },
    ]);
  }

  function adetArtir(urunId: number) {
    setSepet(
      sepet.map((urun) =>
        urun.urunId === urunId
          ? {
              ...urun,
              adet: urun.adet + 1,
            }
          : urun
      )
    );
  }

  function adetAzalt(urunId: number) {
    const bulunanUrun = sepet.find(
      (urun) => urun.urunId === urunId
    );

    if (!bulunanUrun) return;

    if (bulunanUrun.adet <= 1) {
      sepettenCikar(urunId);
      return;
    }

    setSepet(
      sepet.map((urun) =>
        urun.urunId === urunId
          ? {
              ...urun,
              adet: urun.adet - 1,
            }
          : urun
      )
    );
  }

  function sepettenCikar(urunId: number) {
    setSepet(
      sepet.filter((urun) => urun.urunId !== urunId)
    );
  }

  function platformDegistir(yeniPlatform: string) {
    setPlatform(yeniPlatform);

    if (yeniPlatform !== "Sokak Satışı") {
      setNakitTutari("0");
      setKartTutari("0");
    }
  }

  function odemeTipiDegistir(
    yeniOdemeTipi: SokakOdemeTipi
  ) {
    setOdemeTipi(yeniOdemeTipi);

    if (yeniOdemeTipi === "Bölünmüş Ödeme") {
      const yarisi = yuvarla(genelToplam / 2);
      const kalani = yuvarla(genelToplam - yarisi);

      setNakitTutari(String(yarisi));
      setKartTutari(String(kalani));
    } else {
      setNakitTutari("0");
      setKartTutari("0");
    }
  }

  function tamamenNakitYap() {
    setNakitTutari(String(genelToplam));
    setKartTutari("0");
  }

  function tamamenKartYap() {
    setNakitTutari("0");
    setKartTutari(String(genelToplam));
  }

  function sepetiTemizle() {
    const onay = window.confirm(
      "Sepet temizlensin mi?"
    );

    if (!onay) return;

    setSepet([]);
    setIndirim("0");
    setNot("");
    setNakitTutari("0");
    setKartTutari("0");
  }

  function satisiKaydet() {
    if (sepet.length === 0) {
      alert("Sepete ürün ekle.");
      return;
    }

    if (indirimTutari > sepetAraToplam) {
      alert("İndirim ara toplamdan fazla olamaz.");
      return;
    }

    let kayitOdemeTipi = "Online Ödeme";
    let toplamNakit = 0;
    let toplamKart = 0;
    let toplamOnline = 0;

    if (onlinePlatform) {
      toplamOnline = genelToplam;
    } else if (odemeTipi === "Nakit") {
      kayitOdemeTipi = "Nakit";
      toplamNakit = genelToplam;
    } else if (odemeTipi === "Kredi Kartı") {
      kayitOdemeTipi = "Kredi Kartı";
      toplamKart = genelToplam;
    } else {
      if (Math.abs(kalanOdeme) > 0.01) {
        alert(
          kalanOdeme > 0
            ? `${para(kalanOdeme)} ödeme eksik.`
            : `${para(
                Math.abs(kalanOdeme)
              )} fazla ödeme girildi.`
        );

        return;
      }

      kayitOdemeTipi = "Nakit + Kredi Kartı";
      toplamNakit = nakitDegeri;
      toplamKart = kartDegeri;
    }

    const islemId = Date.now();
    const tarih = new Date().toLocaleString("tr-TR");

    let dagitilanNakit = 0;
    let dagitilanKart = 0;
    let dagitilanOnline = 0;

    const yeniKayitlar: SatisKaydi[] = sepet.map(
      (sepetUrunu, sira) => {
        const urunAraToplam =
          sepetUrunu.adet * sepetUrunu.birimFiyat;

        const urunIndirimi =
          sepetAraToplam > 0
            ? (urunAraToplam / sepetAraToplam) *
              indirimTutari
            : 0;

        const urunToplami = yuvarla(
          Math.max(
            urunAraToplam - urunIndirimi,
            0
          )
        );

        const sonSatir = sira === sepet.length - 1;

        const oran =
          genelToplam > 0
            ? urunToplami / genelToplam
            : 0;

        const satirNakit = sonSatir
          ? yuvarla(toplamNakit - dagitilanNakit)
          : yuvarla(toplamNakit * oran);

        const satirKart = sonSatir
          ? yuvarla(toplamKart - dagitilanKart)
          : yuvarla(toplamKart * oran);

        const satirOnline = sonSatir
          ? yuvarla(toplamOnline - dagitilanOnline)
          : yuvarla(toplamOnline * oran);

        dagitilanNakit += satirNakit;
        dagitilanKart += satirKart;
        dagitilanOnline += satirOnline;

        return {
          id: islemId + sira,
          islemId,
          tarih,
          urun: sepetUrunu.urun,
          kategori: sepetUrunu.kategori,
          platform,
          odemeTipi: kayitOdemeTipi,
          adet: sepetUrunu.adet,
          birimFiyat: sepetUrunu.birimFiyat,
          indirim: yuvarla(urunIndirimi),
          toplam: urunToplami,
          nakitTutari: satirNakit,
          kartTutari: satirKart,
          onlineTutari: satirOnline,
          not: not.trim(),
        };
      }
    );

    const tumKayitlar = [
      ...yeniKayitlar,
      ...kayitlar,
    ];

    setKayitlar(tumKayitlar);

    localStorage.setItem(
      "aristo-satislar",
      JSON.stringify(tumKayitlar)
    );

    setSepet([]);
    setPlatform("Sokak Satışı");
    setOdemeTipi("Kredi Kartı");
    setIndirim("0");
    setNot("");
    setNakitTutari("0");
    setKartTutari("0");

    setSatisMesaji(
      `✅ Satış tamamlandı: ${para(genelToplam)}`
    );

    window.setTimeout(() => {
      setSatisMesaji("");
    }, 2500);
  }

  function islemiSil(islemId: number) {
    const onay = window.confirm(
      "Bu satış işleminin tamamı silinsin mi?"
    );

    if (!onay) return;

    const yeniKayitlar = kayitlar.filter(
      (kayit) => kayit.islemId !== islemId
    );

    setKayitlar(yeniKayitlar);

    localStorage.setItem(
      "aristo-satislar",
      JSON.stringify(yeniKayitlar)
    );
  }

  const islemler = useMemo(() => {
    const gruplar: Record<number, SatisKaydi[]> = {};

    kayitlar.forEach((kayit) => {
      const grupId = kayit.islemId || kayit.id;

      if (!gruplar[grupId]) {
        gruplar[grupId] = [];
      }

      gruplar[grupId].push(kayit);
    });

    return Object.entries(gruplar)
      .map(([islemId, urunKayitlari]) => ({
        islemId: Number(islemId),
        tarih: urunKayitlari[0]?.tarih || "-",
        platform:
          urunKayitlari[0]?.platform || "-",
        odemeTipi:
          urunKayitlari[0]?.odemeTipi || "-",
        not: urunKayitlari[0]?.not || "",
        urunler: urunKayitlari,

        toplam: urunKayitlari.reduce(
          (toplam, kayit) =>
            toplam + Number(kayit.toplam || 0),
          0
        ),

        nakit: urunKayitlari.reduce(
          (toplam, kayit) =>
            toplam +
            Number(kayit.nakitTutari || 0),
          0
        ),

        kart: urunKayitlari.reduce(
          (toplam, kayit) =>
            toplam +
            Number(kayit.kartTutari || 0),
          0
        ),

        online: urunKayitlari.reduce(
          (toplam, kayit) =>
            toplam +
            Number(kayit.onlineTutari || 0),
          0
        ),
      }))
      .sort((a, b) => b.islemId - a.islemId);
  }, [kayitlar]);

  const bugun = new Date();

  const bugunkuSatisToplami = kayitlar
    .filter((kayit) => {
      const tarih = new Date(kayit.id);

      return (
        tarih.getDate() === bugun.getDate() &&
        tarih.getMonth() === bugun.getMonth() &&
        tarih.getFullYear() === bugun.getFullYear()
      );
    })
    .reduce(
      (toplam, kayit) =>
        toplam + Number(kayit.toplam || 0),
      0
    );

  const kartStili: CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  };

  const alanStili: CSSProperties = {
    width: "100%",
    padding: "12px",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "15px",
    background: "#ffffff",
  };

  const yesilButon: CSSProperties = {
    border: "none",
    borderRadius: "10px",
    padding: "13px 18px",
    background: "#174d38",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const griButon: CSSProperties = {
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "10px 13px",
    background: "#ffffff",
    color: "#111827",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const kirmiziButon: CSSProperties = {
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    background: "#b91c1c",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
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
      <div style={{ maxWidth: "1250px", margin: "0 auto" }}>
        <Link href="/">← Ana Sayfaya Dön</Link>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ marginBottom: "6px" }}>
              🥪 Satış Girişi
            </h1>

            <p style={{ margin: 0, color: "#6b7280" }}>
              Ürüne dokun, adedi belirle ve ödemeyi al.
            </p>
          </div>

          <div
            style={{
              ...kartStili,
              minWidth: "220px",
              padding: "16px 20px",
            }}
          >
            <small style={{ color: "#6b7280" }}>
              Bugünkü satış
            </small>

            <h2
              style={{
                margin: "6px 0 0",
                color: "#174d38",
              }}
            >
              {para(bugunkuSatisToplami)}
            </h2>
          </div>
        </div>

        {satisMesaji && (
          <div
            style={{
              ...kartStili,
              marginBottom: "20px",
              background: "#dcfce7",
              borderColor: "#86efac",
              color: "#166534",
              fontSize: "18px",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            {satisMesaji}
          </div>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1.55fr) minmax(330px, 0.85fr)",
            gap: "18px",
            alignItems: "start",
          }}
        >
          <div>
            <section
              style={{
                ...kartStili,
                marginBottom: "18px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                Menü
              </h2>

              <div
                style={{
                  display: "flex",
                  gap: "9px",
                  flexWrap: "wrap",
                  marginBottom: "18px",
                }}
              >
                {gorunenKategoriler.map(
                  (kategoriAdi) => (
                    <button
                      key={kategoriAdi}
                      onClick={() =>
                        setKategori(kategoriAdi)
                      }
                      style={{
                        ...griButon,
                        background:
                          kategori === kategoriAdi
                            ? "#174d38"
                            : "#ffffff",
                        color:
                          kategori === kategoriAdi
                            ? "#ffffff"
                            : "#111827",
                        borderColor:
                          kategori === kategoriAdi
                            ? "#174d38"
                            : "#d1d5db",
                      }}
                    >
                      {kategoriAdi === "Sandviç"
                        ? "🥪"
                        : kategoriAdi === "Salata"
                        ? "🥗"
                        : kategoriAdi === "İçecek"
                        ? "🥤"
                        : "➕"}{" "}
                      {kategoriAdi}
                    </button>
                  )
                )}
              </div>

              {filtrelenmisUrunler.length === 0 ? (
                <p style={{ color: "#6b7280" }}>
                  Bu kategoride aktif ürün yok.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {filtrelenmisUrunler.map((urun) => {
                    const sepettekiUrun = sepet.find(
                      (sepetUrunu) =>
                        sepetUrunu.urunId === urun.id
                    );

                    return (
                      <button
                        key={urun.id}
                        onClick={() => sepeteEkle(urun)}
                        style={{
                          position: "relative",
                          minHeight: "112px",
                          padding: "16px",
                          border: sepettekiUrun
                            ? "2px solid #174d38"
                            : "1px solid #d1d5db",
                          borderRadius: "15px",
                          background: sepettekiUrun
                            ? "#edf7f1"
                            : "#ffffff",
                          cursor: "pointer",
                          textAlign: "left",
                          boxShadow:
                            "0 4px 12px rgba(0,0,0,0.04)",
                        }}
                      >
                        {sepettekiUrun && (
                          <span
                            style={{
                              position: "absolute",
                              top: "9px",
                              right: "9px",
                              minWidth: "25px",
                              height: "25px",
                              borderRadius: "999px",
                              background: "#174d38",
                              color: "#ffffff",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: "bold",
                              fontSize: "13px",
                            }}
                          >
                            {sepettekiUrun.adet}
                          </span>
                        )}

                        <strong
                          style={{
                            display: "block",
                            paddingRight: "25px",
                            marginBottom: "14px",
                            fontSize: "16px",
                          }}
                        >
                          {urun.ad}
                        </strong>

                        <span
                          style={{
                            color: "#174d38",
                            fontWeight: "bold",
                            fontSize: "17px",
                          }}
                        >
                          {para(
                            Number(
                              urun.satisFiyati || 0
                            )
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section style={kartStili}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "14px",
                  alignItems: "center",
                  flexWrap: "wrap",
                  borderBottom: "1px solid #e5e7eb",
                  paddingBottom: "15px",
                }}
              >
                <div>
                  <h2 style={{ margin: "0 0 5px" }}>
                    🛒 Sepet
                  </h2>

                  <small style={{ color: "#6b7280" }}>
                    {toplamAdet} ürün
                  </small>
                </div>

                <div style={{ textAlign: "right" }}>
                  <small style={{ color: "#6b7280" }}>
                    Toplam
                  </small>

                  <h2
                    style={{
                      margin: "5px 0 0",
                      color: "#174d38",
                    }}
                  >
                    {para(genelToplam)}
                  </h2>
                </div>
              </div>

              {sepet.length === 0 ? (
                <p
                  style={{
                    padding: "25px 0",
                    color: "#6b7280",
                  }}
                >
                  Menüden ürün seç.
                </p>
              ) : (
                sepet.map((urun) => (
                  <div
                    key={urun.urunId}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(150px, 1fr) auto auto",
                      gap: "12px",
                      alignItems: "center",
                      borderBottom:
                        "1px solid #e5e7eb",
                      padding: "14px 0",
                    }}
                  >
                    <div>
                      <strong>{urun.urun}</strong>

                      <br />

                      <small style={{ color: "#6b7280" }}>
                        {para(urun.birimFiyat)} / adet
                      </small>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px",
                      }}
                    >
                      <button
                        onClick={() =>
                          adetAzalt(urun.urunId)
                        }
                        style={{
                          ...griButon,
                          minWidth: "42px",
                          fontSize: "19px",
                        }}
                      >
                        −
                      </button>

                      <strong
                        style={{
                          minWidth: "25px",
                          textAlign: "center",
                          fontSize: "18px",
                        }}
                      >
                        {urun.adet}
                      </strong>

                      <button
                        onClick={() =>
                          adetArtir(urun.urunId)
                        }
                        style={{
                          ...griButon,
                          minWidth: "42px",
                          fontSize: "19px",
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <strong>
                        {para(
                          urun.adet * urun.birimFiyat
                        )}
                      </strong>

                      <br />

                      <button
                        onClick={() =>
                          sepettenCikar(urun.urunId)
                        }
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#b91c1c",
                          cursor: "pointer",
                          marginTop: "7px",
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          <div
            style={{
              position: "sticky",
              top: "18px",
            }}
          >
            <section
              style={{
                ...kartStili,
                marginBottom: "18px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                Satış ve Ödeme
              </h2>

              <label>
                <strong>Satış Kanalı</strong>
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: "9px",
                  marginTop: "8px",
                  marginBottom: "18px",
                }}
              >
                {platformlar.map((platformAdi) => (
                  <button
                    key={platformAdi}
                    onClick={() =>
                      platformDegistir(platformAdi)
                    }
                    style={{
                      ...griButon,
                      background:
                        platform === platformAdi
                          ? "#174d38"
                          : "#ffffff",
                      color:
                        platform === platformAdi
                          ? "#ffffff"
                          : "#111827",
                      borderColor:
                        platform === platformAdi
                          ? "#174d38"
                          : "#d1d5db",
                    }}
                  >
                    {platformAdi}
                  </button>
                ))}
              </div>

              {onlinePlatform ? (
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "13px",
                    background: "#e0f2fe",
                    border: "1px solid #bae6fd",
                    marginBottom: "18px",
                  }}
                >
                  <strong>🌐 Online Ödeme</strong>

                  <p
                    style={{
                      margin: "7px 0 0",
                      color: "#475569",
                    }}
                  >
                    {platform} satışları otomatik
                    olarak online ödeme kaydedilir.
                  </p>
                </div>
              ) : (
                <>
                  <label>
                    <strong>Ödeme Tipi</strong>
                  </label>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(3, minmax(0, 1fr))",
                      gap: "8px",
                      marginTop: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    {(
                      [
                        "Kredi Kartı",
                        "Nakit",
                        "Bölünmüş Ödeme",
                      ] as SokakOdemeTipi[]
                    ).map((odeme) => (
                      <button
                        key={odeme}
                        onClick={() =>
                          odemeTipiDegistir(odeme)
                        }
                        style={{
                          ...griButon,
                          padding: "11px 7px",
                          background:
                            odemeTipi === odeme
                              ? "#174d38"
                              : "#ffffff",
                          color:
                            odemeTipi === odeme
                              ? "#ffffff"
                              : "#111827",
                          borderColor:
                            odemeTipi === odeme
                              ? "#174d38"
                              : "#d1d5db",
                        }}
                      >
                        {odeme === "Kredi Kartı"
                          ? "💳 Kart"
                          : odeme === "Nakit"
                          ? "💵 Nakit"
                          : "➗ Böl"}
                      </button>
                    ))}
                  </div>

                  {odemeTipi === "Bölünmüş Ödeme" && (
                    <div
                      style={{
                        padding: "15px",
                        borderRadius: "13px",
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        marginBottom: "18px",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(2, minmax(0, 1fr))",
                          gap: "11px",
                        }}
                      >
                        <div>
                          <label>
                            <strong>Nakit</strong>
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={nakitTutari}
                            onChange={(event) =>
                              setNakitTutari(
                                event.target.value
                              )
                            }
                            style={{
                              ...alanStili,
                              marginTop: "7px",
                            }}
                          />
                        </div>

                        <div>
                          <label>
                            <strong>Kart</strong>
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={kartTutari}
                            onChange={(event) =>
                              setKartTutari(
                                event.target.value
                              )
                            }
                            style={{
                              ...alanStili,
                              marginTop: "7px",
                            }}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginTop: "11px",
                        }}
                      >
                        <button
                          onClick={tamamenNakitYap}
                          style={griButon}
                        >
                          Tamamı nakit
                        </button>

                        <button
                          onClick={tamamenKartYap}
                          style={griButon}
                        >
                          Tamamı kart
                        </button>
                      </div>

                      <p
                        style={{
                          margin: "13px 0 0",
                          color:
                            Math.abs(kalanOdeme) <= 0.01
                              ? "#15803d"
                              : "#b91c1c",
                          fontWeight: "bold",
                        }}
                      >
                        {Math.abs(kalanOdeme) <= 0.01
                          ? "✅ Ödeme tamam"
                          : kalanOdeme > 0
                          ? `Eksik: ${para(kalanOdeme)}`
                          : `Fazla: ${para(
                              Math.abs(kalanOdeme)
                            )}`}
                      </p>
                    </div>
                  )}
                </>
              )}

              <label>
                <strong>İndirim</strong>
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={indirim}
                onChange={(event) =>
                  setIndirim(event.target.value)
                }
                style={{
                  ...alanStili,
                  marginTop: "7px",
                  marginBottom: "14px",
                }}
              />

              <label>
                <strong>Not</strong>
              </label>

              <textarea
                value={not}
                onChange={(event) =>
                  setNot(event.target.value)
                }
                rows={3}
                placeholder="İsteğe bağlı"
                style={{
                  ...alanStili,
                  marginTop: "7px",
                  resize: "vertical",
                }}
              />
            </section>

            <section style={kartStili}>
              <small style={{ color: "#6b7280" }}>
                ÖDENECEK TOPLAM
              </small>

              <h1
                style={{
                  margin: "8px 0 18px",
                  color: "#174d38",
                  fontSize: "clamp(36px, 6vw, 52px)",
                }}
              >
                {para(genelToplam)}
              </h1>

              <div
                style={{
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "12px",
                  marginBottom: "17px",
                }}
              >
                <p
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    margin: "7px 0",
                  }}
                >
                  <span>Ara toplam</span>
                  <strong>
                    {para(sepetAraToplam)}
                  </strong>
                </p>

                <p
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    margin: "7px 0",
                  }}
                >
                  <span>İndirim</span>
                  <strong>
                    {para(indirimTutari)}
                  </strong>
                </p>
              </div>

              <button
                onClick={satisiKaydet}
                disabled={sepet.length === 0}
                style={{
                  ...yesilButon,
                  width: "100%",
                  padding: "16px",
                  fontSize: "18px",
                  opacity: sepet.length === 0 ? 0.5 : 1,
                }}
              >
                ✅ Satışı Tamamla
              </button>

              <button
                onClick={sepetiTemizle}
                disabled={sepet.length === 0}
                style={{
                  ...kirmiziButon,
                  width: "100%",
                  marginTop: "10px",
                  opacity: sepet.length === 0 ? 0.5 : 1,
                }}
              >
                🗑️ Sepeti Temizle
              </button>
            </section>
          </div>
        </section>

        <section
          style={{
            ...kartStili,
            marginTop: "24px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Son Satışlar
          </h2>

          {islemler.length === 0 ? (
            <p style={{ color: "#6b7280" }}>
              Henüz satış yok.
            </p>
          ) : (
            islemler.slice(0, 10).map((islem) => (
              <details
                key={islem.islemId}
                style={{
                  borderBottom:
                    "1px solid #e5e7eb",
                  padding: "14px 0",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {islem.tarih} — {islem.platform} —{" "}
                  {para(islem.toplam)}
                </summary>

                <div style={{ paddingTop: "12px" }}>
                  <p>
                    Ödeme:{" "}
                    <strong>{islem.odemeTipi}</strong>
                  </p>

                  {islem.nakit > 0 && (
                    <p>
                      Nakit: {para(islem.nakit)}
                    </p>
                  )}

                  {islem.kart > 0 && (
                    <p>
                      Kart: {para(islem.kart)}
                    </p>
                  )}

                  {islem.online > 0 && (
                    <p>
                      Online: {para(islem.online)}
                    </p>
                  )}

                  <ul>
                    {islem.urunler.map((urun) => (
                      <li key={urun.id}>
                        {urun.urun} x{urun.adet} —{" "}
                        {para(urun.toplam)}
                      </li>
                    ))}
                  </ul>

                  {islem.not && (
                    <p>Not: {islem.not}</p>
                  )}

                  <button
                    onClick={() =>
                      islemiSil(islem.islemId)
                    }
                    style={kirmiziButon}
                  >
                    🗑️ İşlemi Sil
                  </button>
                </div>
              </details>
            ))
          )}
        </section>
      </div>
    </main>
  );
}