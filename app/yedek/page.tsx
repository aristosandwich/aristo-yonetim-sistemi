"use client";

import Link from "next/link";
import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

const veriAnahtarlari = [
  "aristo-satislar",
  "aristo-giderler",
  "aristo-tahsilatlar",
  "aristo-mudo-faturalar",
  "aristo-mudo-odemeler",
  "aristo-cari",
  "aristo-rehber",
  "aristo-takvim",
  "aristo-kasa",
  "aristo-notlar",
  "aristo-ayarlar",
  "aristo-urunler",
  "aristo-malzemeler",
  "aristo-receteler",
  "aristo-stok",
];

type YedekDosyasi = {
  sistem?: string;
  surum?: number;
  olusturulmaTarihi?: string;
  veriler?: Record<string, unknown>;
  [anahtar: string]: unknown;
};

export default function Yedekleme() {
  const dosyaSecici = useRef<HTMLInputElement>(null);

  const [kayitliAlanSayisi, setKayitliAlanSayisi] =
    useState(0);

  const [tahminiBoyut, setTahminiBoyut] =
    useState("0 KB");

  const [sonYedekTarihi, setSonYedekTarihi] =
    useState<string>("Henüz yedek alınmadı");

  const [islemDurumu, setIslemDurumu] =
    useState("");

  useEffect(() => {
    bilgileriGuncelle();

    const sonYedek = localStorage.getItem(
      "aristo-son-yedek-tarihi"
    );

    if (sonYedek) {
      setSonYedekTarihi(sonYedek);
    }
  }, []);

  function bilgileriGuncelle() {
    let alanSayisi = 0;
    let toplamKarakter = 0;

    veriAnahtarlari.forEach((anahtar) => {
      const veri = localStorage.getItem(anahtar);

      if (veri !== null) {
        alanSayisi += 1;
        toplamKarakter += veri.length;
      }
    });

    setKayitliAlanSayisi(alanSayisi);

    const byte = new Blob([
      "a".repeat(toplamKarakter),
    ]).size;

    if (byte < 1024) {
      setTahminiBoyut(`${byte} B`);
    } else if (byte < 1024 * 1024) {
      setTahminiBoyut(
        `${(byte / 1024).toFixed(1)} KB`
      );
    } else {
      setTahminiBoyut(
        `${(byte / 1024 / 1024).toFixed(2)} MB`
      );
    }
  }

  function yedekOlustur() {
    const veriler: Record<string, unknown> = {};

    veriAnahtarlari.forEach((anahtar) => {
      const veri = localStorage.getItem(anahtar);

      if (veri === null) {
        veriler[anahtar] = null;
        return;
      }

      try {
        veriler[anahtar] = JSON.parse(veri);
      } catch {
        veriler[anahtar] = veri;
      }
    });

    return {
      sistem: "Aristo Yönetim Sistemi",
      surum: 1,
      olusturulmaTarihi: new Date().toISOString(),
      veriler,
    };
  }

  function yedekIndir() {
    try {
      const yedek = yedekOlustur();

      const dosya = new Blob(
        [JSON.stringify(yedek, null, 2)],
        {
          type: "application/json",
        }
      );

      const adres = URL.createObjectURL(dosya);
      const baglanti =
        document.createElement("a");

      const tarih = new Date()
        .toISOString()
        .slice(0, 10);

      baglanti.href = adres;
      baglanti.download =
        `aristo-tam-yedek-${tarih}.json`;

      document.body.appendChild(baglanti);
      baglanti.click();
      baglanti.remove();

      URL.revokeObjectURL(adres);

      const tarihMetni =
        new Date().toLocaleString("tr-TR");

      localStorage.setItem(
        "aristo-son-yedek-tarihi",
        tarihMetni
      );

      setSonYedekTarihi(tarihMetni);
      setIslemDurumu(
        "✅ Yedek dosyası başarıyla indirildi."
      );
    } catch {
      setIslemDurumu(
        "❌ Yedek oluşturulamadı."
      );
    }
  }

  function dosyaSec() {
    dosyaSecici.current?.click();
  }

  function yedekYukle(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const dosya = event.target.files?.[0];

    if (!dosya) return;

    const okuyucu = new FileReader();

    okuyucu.onload = () => {
      try {
        const okunanVeri = JSON.parse(
          String(okuyucu.result)
        ) as YedekDosyasi;

        const yedekVerileri =
          okunanVeri.veriler &&
          typeof okunanVeri.veriler === "object"
            ? okunanVeri.veriler
            : okunanVeri;

        const gecerliAnahtarSayisi =
          veriAnahtarlari.filter(
            (anahtar) =>
              yedekVerileri[anahtar] !== undefined
          ).length;

        if (gecerliAnahtarSayisi === 0) {
          throw new Error(
            "Geçerli veri bulunamadı."
          );
        }

        const onay = window.confirm(
          "Mevcut veriler yedek dosyasındaki verilerle değiştirilecek. Devam edilsin mi?"
        );

        if (!onay) {
          event.target.value = "";
          return;
        }

        veriAnahtarlari.forEach((anahtar) => {
          const veri = yedekVerileri[anahtar];

          if (
            veri === undefined ||
            veri === null
          ) {
            return;
          }

          if (typeof veri === "string") {
            localStorage.setItem(anahtar, veri);
          } else {
            localStorage.setItem(
              anahtar,
              JSON.stringify(veri)
            );
          }
        });

        bilgileriGuncelle();

        setIslemDurumu(
          "✅ Aristo verileri başarıyla geri yüklendi."
        );

        alert(
          "Bütün Aristo verileri geri yüklendi."
        );
      } catch {
        setIslemDurumu(
          "❌ Seçilen dosya geçerli bir Aristo yedeği değil."
        );

        alert(
          "Bu dosya geçerli bir Aristo yedeği değil."
        );
      }
    };

    okuyucu.onerror = () => {
      setIslemDurumu(
        "❌ Yedek dosyası okunamadı."
      );
    };

    okuyucu.readAsText(dosya);
    event.target.value = "";
  }

  const kartStili = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow:
      "0 8px 20px rgba(0,0,0,0.06)",
  };

  const yesilButon = {
    width: "100%",
    border: "none",
    borderRadius: "11px",
    padding: "14px 18px",
    background: "#174d38",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
  };

  const griButon = {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: "11px",
    padding: "14px 18px",
    background: "#ffffff",
    color: "#111827",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
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
          maxWidth: "950px",
          margin: "0 auto",
        }}
      >
        <Link href="/">
          ← Ana Sayfaya Dön
        </Link>

        <h1 style={{ marginBottom: "6px" }}>
          💾 Tam Yedekleme
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: "24px",
            color: "#6b7280",
          }}
        >
          Aristo verilerini tek dosyada yedekle
          veya daha önce alınmış bir yedeği geri
          yükle.
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
            <small
              style={{ color: "#6b7280" }}
            >
              Yedeklenen alan
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {kayitliAlanSayisi}
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{ color: "#6b7280" }}
            >
              Tahmini veri boyutu
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {tahminiBoyut}
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{ color: "#6b7280" }}
            >
              Son yedek
            </small>

            <h3
              style={{
                marginBottom: 0,
                lineHeight: 1.4,
              }}
            >
              {sonYedekTarihi}
            </h3>
          </div>
        </section>

        {islemDurumu && (
          <section
            style={{
              ...kartStili,
              marginBottom: "24px",
              borderColor: islemDurumu.startsWith(
                "✅"
              )
                ? "#86efac"
                : "#fca5a5",
              background:
                islemDurumu.startsWith("✅")
                  ? "#f0fdf4"
                  : "#fef2f2",
            }}
          >
            <strong>{islemDurumu}</strong>
          </section>
        )}

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
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "16px",
                display: "grid",
                placeItems: "center",
                background: "#dcfce7",
                fontSize: "28px",
                marginBottom: "16px",
              }}
            >
              ⬇️
            </div>

            <h2 style={{ marginTop: 0 }}>
              Yedeği İndir
            </h2>

            <p
              style={{
                color: "#6b7280",
                lineHeight: 1.6,
                minHeight: "76px",
              }}
            >
              Satış, gider, tahsilat, cari,
              ürün, malzeme, stok ve diğer tüm
              kayıtları tek JSON dosyasında
              bilgisayarına indir.
            </p>

            <button
              onClick={yedekIndir}
              style={yesilButon}
            >
              ⬇️ Tam Yedeği İndir
            </button>
          </div>

          <div style={kartStili}>
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "16px",
                display: "grid",
                placeItems: "center",
                background: "#e0f2fe",
                fontSize: "28px",
                marginBottom: "16px",
              }}
            >
              ⬆️
            </div>

            <h2 style={{ marginTop: 0 }}>
              Yedeği Geri Yükle
            </h2>

            <p
              style={{
                color: "#6b7280",
                lineHeight: 1.6,
                minHeight: "76px",
              }}
            >
              Daha önce indirdiğin Aristo yedek
              dosyasını seçerek kayıtlarını geri
              yükle.
            </p>

            <button
              onClick={dosyaSec}
              style={griButon}
            >
              ⬆️ Yedek Dosyası Seç
            </button>

            <input
              ref={dosyaSecici}
              type="file"
              accept=".json,application/json"
              onChange={yedekYukle}
              style={{ display: "none" }}
            />
          </div>
        </section>

        <section
          style={{
            ...kartStili,
            background: "#fffbeb",
            borderColor: "#fde68a",
          }}
        >
          <strong>⚠️ Önemli</strong>

          <p
            style={{
              marginBottom: 0,
              color: "#6b7280",
              lineHeight: 1.6,
            }}
          >
            Yedek geri yüklendiğinde mevcut
            kayıtların üzerine yazılır. Geri
            yükleme işleminden önce güncel bir
            yedek indir.
          </p>
        </section>
      </div>
    </main>
  );
}