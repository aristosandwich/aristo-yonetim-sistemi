"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Kart from "./ui/Kart";

type SatisKaydi = {
  id: number;
  toplam: number;
};

type TutarKaydi = {
  id: number;
  tutar: number;
};

type MudoKaydi = {
  tutar: number;
};

type CariKaydi = {
  tip: "Borç" | "Alacak";
  tutar: number;
};

export default function Home() {
  const [satis, setSatis] = useState(0);
  const [gider, setGider] = useState(0);
  const [tahsilat, setTahsilat] = useState(0);
  const [mudoBakiye, setMudoBakiye] = useState(0);
  const [cariBakiye, setCariBakiye] = useState(0);

  useEffect(() => {
    const satislar: SatisKaydi[] = JSON.parse(
      localStorage.getItem("aristo-satislar") || "[]"
    );

    const giderler: TutarKaydi[] = JSON.parse(
      localStorage.getItem("aristo-giderler") || "[]"
    );

    const tahsilatlar: TutarKaydi[] = JSON.parse(
      localStorage.getItem("aristo-tahsilatlar") || "[]"
    );

    const mudoFaturalar: MudoKaydi[] = JSON.parse(
      localStorage.getItem("aristo-mudo-faturalar") || "[]"
    );

    const mudoOdemeler: MudoKaydi[] = JSON.parse(
      localStorage.getItem("aristo-mudo-odemeler") || "[]"
    );

    const cariKayitlari: CariKaydi[] = JSON.parse(
      localStorage.getItem("aristo-cari") || "[]"
    );

    const bugun = new Date();

    function bugununKaydiMi(id: number) {
      const tarih = new Date(id);

      return (
        tarih.getDate() === bugun.getDate() &&
        tarih.getMonth() === bugun.getMonth() &&
        tarih.getFullYear() === bugun.getFullYear()
      );
    }

    setSatis(
      satislar
        .filter((kayit) => bugununKaydiMi(kayit.id))
        .reduce(
          (toplam, kayit) => toplam + Number(kayit.toplam || 0),
          0
        )
    );

    setGider(
      giderler
        .filter((kayit) => bugununKaydiMi(kayit.id))
        .reduce(
          (toplam, kayit) => toplam + Number(kayit.tutar || 0),
          0
        )
    );

    setTahsilat(
      tahsilatlar
        .filter((kayit) => bugununKaydiMi(kayit.id))
        .reduce(
          (toplam, kayit) => toplam + Number(kayit.tutar || 0),
          0
        )
    );

    const toplamFatura = mudoFaturalar.reduce(
      (toplam, kayit) => toplam + Number(kayit.tutar || 0),
      0
    );

    const toplamOdeme = mudoOdemeler.reduce(
      (toplam, kayit) => toplam + Number(kayit.tutar || 0),
      0
    );

    setMudoBakiye(toplamFatura - toplamOdeme);

    const toplamCariBorc = cariKayitlari
      .filter((kayit) => kayit.tip === "Borç")
      .reduce(
        (toplam, kayit) => toplam + Number(kayit.tutar || 0),
        0
      );

    const toplamCariAlacak = cariKayitlari
      .filter((kayit) => kayit.tip === "Alacak")
      .reduce(
        (toplam, kayit) => toplam + Number(kayit.tutar || 0),
        0
      );

    setCariBakiye(toplamCariBorc - toplamCariAlacak);
  }, []);

  const gunlukNet = satis - gider;

  const para = (tutar: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(tutar);

  const menuStili = {
    display: "block",
    padding: "16px 18px",
    borderRadius: "12px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    textDecoration: "none",
    color: "#1f2937",
    fontWeight: "bold",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
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
      <div style={{ maxWidth: "950px", margin: "0 auto" }}>
        <header
          style={{
            background: "#174d38",
            color: "white",
            padding: "26px",
            borderRadius: "18px",
            marginBottom: "24px",
          }}
        >
          <h1 style={{ margin: 0 }}>🥪 Aristo Yönetim Sistemi</h1>

          <p style={{ marginBottom: 0, opacity: 0.9 }}>
            Aristo Sandwich & Salad Bar
          </p>
        </header>

        <h2>📊 Bugünkü Durum</h2>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
            marginBottom: "30px",
          }}
        >
          <Kart baslik="💰 Bugünkü Satış" deger={para(satis)} />

          <Kart baslik="💸 Bugünkü Gider" deger={para(gider)} />

          <Kart
            baslik="📈 Günlük Net"
            deger={para(gunlukNet)}
            renk={gunlukNet < 0 ? "#b91c1c" : "#15803d"}
          />

          <Kart
            baslik="💳 Bugünkü Tahsilat"
            deger={para(tahsilat)}
          />

          <Kart
            baslik="🏢 Mudo Bakiyesi"
            deger={para(mudoBakiye)}
            aciklama={mudoBakiye > 0 ? "Borç var" : "Borç yok"}
            renk={mudoBakiye > 0 ? "#b91c1c" : "#15803d"}
          />

          <Kart
            baslik="👥 Cari Bakiye"
            deger={para(cariBakiye)}
            renk={cariBakiye > 0 ? "#b91c1c" : "#15803d"}
          />
        </section>

        <h2>📋 Menü</h2>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
          }}
        >
          <Link href="/dashboard" style={menuStili}>
            📊 Dashboard
          </Link>

          <Link href="/satis" style={menuStili}>
            🥪 Satışlar
          </Link>

          <Link href="/giderler" style={menuStili}>
            💸 Giderler
          </Link>

          <Link href="/tahsilatlar" style={menuStili}>
            💳 Tahsilatlar
          </Link>

          <Link href="/mudo" style={menuStili}>
            🏢 Mudo Toptan
          </Link>

          <Link href="/cari" style={menuStili}>
            👥 Cari Hesaplar
          </Link>

          <Link href="/rehber" style={menuStili}>
            📒 Rehber
          </Link>

          <Link href="/urunler" style={menuStili}>
            🧾 Ürünler
          </Link>

          <Link href="/malzemeler" style={menuStili}>
            🥬 Malzemeler
          </Link>

          <Link href="/receteler" style={menuStili}>
            📋 Reçeteler
          </Link>

          <Link href="/maliyet" style={menuStili}>
            💰 Maliyet ve Kalori
          </Link>

          <Link href="/stok" style={menuStili}>
            📦 Stok
          </Link>

          <Link href="/takvim" style={menuStili}>
            📅 Takvim
          </Link>

          <Link href="/raporlar" style={menuStili}>
            📊 Raporlar
          </Link>

          <Link href="/istatistik" style={menuStili}>
            📈 İstatistikler
          </Link>

          <Link href="/kasa" style={menuStili}>
            💵 Kasa
          </Link>

          <Link href="/notlar" style={menuStili}>
            📝 Notlar
          </Link>

          <Link href="/yedek" style={menuStili}>
            💾 Yedekleme
          </Link>

          <Link href="/ayarlar" style={menuStili}>
            ⚙️ Ayarlar
          </Link>
        </section>
      </div>
    </main>
  );
}