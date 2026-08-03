"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CariKaydi = {
  id: number;
  firma: string;
  tip: "Borç" | "Alacak";
  tutar: number;
  aciklama: string;
  tarih: string;
};

export default function Cari() {
  const [firma, setFirma] = useState("");
  const [tip, setTip] = useState<"Borç" | "Alacak">("Borç");
  const [tutar, setTutar] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [kayitlar, setKayitlar] = useState<CariKaydi[]>([]);
  const [arama, setArama] = useState("");
  const [tipFiltresi, setTipFiltresi] = useState<
    "Tümü" | "Borç" | "Alacak"
  >("Tümü");

  useEffect(() => {
    try {
      const veri: CariKaydi[] = JSON.parse(
        localStorage.getItem("aristo-cari") || "[]"
      );

      setKayitlar(Array.isArray(veri) ? veri : []);
    } catch {
      setKayitlar([]);
    }
  }, []);

  function kayitlariKaydet(yeniListe: CariKaydi[]) {
    setKayitlar(yeniListe);

    localStorage.setItem(
      "aristo-cari",
      JSON.stringify(yeniListe)
    );
  }

  function formuTemizle() {
    setFirma("");
    setTip("Borç");
    setTutar("");
    setAciklama("");
  }

  function kaydet() {
    const cariTutari = Number(tutar);

    if (!firma.trim()) {
      alert("Firma adını gir.");
      return;
    }

    if (!Number.isFinite(cariTutari) || cariTutari <= 0) {
      alert("Geçerli bir tutar gir.");
      return;
    }

    const yeniKayit: CariKaydi = {
      id: Date.now(),
      firma: firma.trim(),
      tip,
      tutar: cariTutari,
      aciklama: aciklama.trim(),
      tarih: new Date().toLocaleString("tr-TR"),
    };

    kayitlariKaydet([yeniKayit, ...kayitlar]);
    formuTemizle();

    alert("Cari kayıt eklendi.");
  }

  function sil(id: number) {
    const onay = window.confirm(
      "Bu cari hareketi silinsin mi?"
    );

    if (!onay) return;

    kayitlariKaydet(
      kayitlar.filter((kayit) => kayit.id !== id)
    );
  }

  const toplamBorc = kayitlar
    .filter((kayit) => kayit.tip === "Borç")
    .reduce(
      (toplam, kayit) =>
        toplam + Number(kayit.tutar || 0),
      0
    );

  const toplamAlacak = kayitlar
    .filter((kayit) => kayit.tip === "Alacak")
    .reduce(
      (toplam, kayit) =>
        toplam + Number(kayit.tutar || 0),
      0
    );

  const bakiye = toplamBorc - toplamAlacak;

  const filtrelenmisKayitlar = useMemo(() => {
    const aranan = arama
      .trim()
      .toLocaleLowerCase("tr-TR");

    return kayitlar.filter((kayit) => {
      const tipUygun =
        tipFiltresi === "Tümü" ||
        kayit.tip === tipFiltresi;

      const metin =
        `${kayit.firma} ${kayit.aciklama}`.toLocaleLowerCase(
          "tr-TR"
        );

      const aramaUygun =
        !aranan || metin.includes(aranan);

      return tipUygun && aramaUygun;
    });
  }, [kayitlar, arama, tipFiltresi]);

  const firmaBakiyeleri = useMemo(() => {
    const sonuc: Record<
      string,
      {
        borc: number;
        alacak: number;
      }
    > = {};

    kayitlar.forEach((kayit) => {
      if (!sonuc[kayit.firma]) {
        sonuc[kayit.firma] = {
          borc: 0,
          alacak: 0,
        };
      }

      if (kayit.tip === "Borç") {
        sonuc[kayit.firma].borc += Number(
          kayit.tutar || 0
        );
      } else {
        sonuc[kayit.firma].alacak += Number(
          kayit.tutar || 0
        );
      }
    });

    return Object.entries(sonuc)
      .map(([firmaAdi, degerler]) => ({
        firma: firmaAdi,
        borc: degerler.borc,
        alacak: degerler.alacak,
        bakiye: degerler.borc - degerler.alacak,
      }))
      .sort(
        (a, b) =>
          Math.abs(b.bakiye) - Math.abs(a.bakiye)
      );
  }, [kayitlar]);

  const para = (deger: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(deger);

  const kartStili = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  };

  const alanStili = {
    width: "100%",
    padding: "12px",
    boxSizing: "border-box" as const,
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    background: "#ffffff",
    fontSize: "15px",
  };

  const yesilButon = {
    border: "none",
    borderRadius: "10px",
    padding: "13px 18px",
    background: "#174d38",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const kirmiziButon = {
    border: "none",
    borderRadius: "9px",
    padding: "9px 12px",
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
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <Link href="/">← Ana Sayfaya Dön</Link>

        <h1 style={{ marginBottom: "6px" }}>
          👥 Cari Hesaplar
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: "24px",
            color: "#6b7280",
          }}
        >
          Firma borç ve alacak hareketlerini yönet.
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
              Toplam borç
            </small>

            <h2
              style={{
                marginBottom: 0,
                color: "#b91c1c",
              }}
            >
              {para(toplamBorc)}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Toplam alacak
            </small>

            <h2
              style={{
                marginBottom: 0,
                color: "#15803d",
              }}
            >
              {para(toplamAlacak)}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Net bakiye
            </small>

            <h2
              style={{
                marginBottom: 0,
                color:
                  bakiye > 0
                    ? "#b91c1c"
                    : "#15803d",
              }}
            >
              {para(bakiye)}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Firma sayısı
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {firmaBakiyeleri.length}
            </h2>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              ➕ Yeni Cari Hareket
            </h2>

            <label>
              <strong>Firma</strong>
            </label>

            <input
              value={firma}
              onChange={(event) =>
                setFirma(event.target.value)
              }
              placeholder="Örneğin: Coca-Cola"
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>İşlem Tipi</strong>
            </label>

            <select
              value={tip}
              onChange={(event) =>
                setTip(
                  event.target.value as
                    | "Borç"
                    | "Alacak"
                )
              }
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            >
              <option>Borç</option>
              <option>Alacak</option>
            </select>

            <label>
              <strong>Tutar</strong>
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={tutar}
              onChange={(event) =>
                setTutar(event.target.value)
              }
              placeholder="0"
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>Açıklama</strong>
            </label>

            <textarea
              value={aciklama}
              onChange={(event) =>
                setAciklama(event.target.value)
              }
              placeholder="İsteğe bağlı"
              rows={4}
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "16px",
                resize: "vertical",
              }}
            />

            <button
              onClick={kaydet}
              style={yesilButon}
            >
              💾 Kaydet
            </button>
          </div>

          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              🔍 Hareketleri Filtrele
            </h2>

            <label>
              <strong>Firma veya açıklama ara</strong>
            </label>

            <input
              value={arama}
              onChange={(event) =>
                setArama(event.target.value)
              }
              placeholder="Örneğin: Metro"
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>İşlem Tipi</strong>
            </label>

            <select
              value={tipFiltresi}
              onChange={(event) =>
                setTipFiltresi(
                  event.target.value as
                    | "Tümü"
                    | "Borç"
                    | "Alacak"
                )
              }
              style={{
                ...alanStili,
                marginTop: "7px",
              }}
            >
              <option>Tümü</option>
              <option>Borç</option>
              <option>Alacak</option>
            </select>
          </div>
        </section>

        {firmaBakiyeleri.length > 0 && (
          <section
            style={{
              ...kartStili,
              marginBottom: "24px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              🏢 Firma Bakiyeleri
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              {firmaBakiyeleri.map((kayit) => (
                <div
                  key={kayit.firma}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "15px",
                    background: "#f9fafb",
                  }}
                >
                  <strong>{kayit.firma}</strong>

                  <p
                    style={{
                      margin: "10px 0 4px",
                      color: "#b91c1c",
                    }}
                  >
                    Borç: {para(kayit.borc)}
                  </p>

                  <p
                    style={{
                      margin: "4px 0",
                      color: "#15803d",
                    }}
                  >
                    Alacak: {para(kayit.alacak)}
                  </p>

                  <p
                    style={{
                      marginBottom: 0,
                      fontWeight: "bold",
                    }}
                  >
                    Bakiye: {para(kayit.bakiye)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={kartStili}>
          <h2 style={{ marginTop: 0 }}>
            Cari Hareketleri
          </h2>

          {filtrelenmisKayitlar.length === 0 ? (
            <p style={{ color: "#6b7280" }}>
              Kayıt bulunamadı.
            </p>
          ) : (
            filtrelenmisKayitlar.map((kayit) => (
              <div
                key={kayit.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(180px, 1fr) auto",
                  gap: "18px",
                  borderBottom:
                    "1px solid #e5e7eb",
                  padding: "16px 0",
                }}
              >
                <div>
                  <strong>{kayit.firma}</strong>

                  <p
                    style={{
                      margin: "6px 0",
                      color: "#6b7280",
                    }}
                  >
                    {kayit.tarih}
                  </p>

                  <p style={{ margin: 0 }}>
                    {kayit.aciklama || "Açıklama yok"}
                  </p>
                </div>

                <div
                  style={{
                    textAlign: "right",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      marginBottom: "12px",
                      color:
                        kayit.tip === "Borç"
                          ? "#b91c1c"
                          : "#15803d",
                      fontSize: "18px",
                    }}
                  >
                    {kayit.tip === "Borç" ? "-" : "+"}
                    {para(kayit.tutar)}
                  </strong>

                  <small
                    style={{
                      display: "block",
                      marginBottom: "10px",
                      color: "#6b7280",
                    }}
                  >
                    {kayit.tip}
                  </small>

                  <button
                    onClick={() => sil(kayit.id)}
                    style={kirmiziButon}
                  >
                    🗑️ Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}