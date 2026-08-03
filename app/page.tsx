"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import Kart from "./ui/Kart";

type TarihliKayit = {
  id?: number | string;
  islemId?: number | string;
  tarih?: string;
};

type SatisKaydi = TarihliKayit & {
  toplam?: number;
};

type TutarKaydi = TarihliKayit & {
  tutar?: number;
};

type MudoKaydi = {
  tutar?: number;
};

type CariKaydi = {
  tip?: "Borç" | "Alacak";
  tutar?: number;
};

const menu = [
  { href: "/dashboard", ikon: "📊", baslik: "Dashboard" },
  { href: "/satis", ikon: "🥪", baslik: "Satışlar" },
  { href: "/giderler", ikon: "💸", baslik: "Giderler" },
  { href: "/tahsilatlar", ikon: "💳", baslik: "Tahsilatlar" },
  { href: "/mudo", ikon: "🏢", baslik: "Mudo Toptan" },
  { href: "/cari", ikon: "👥", baslik: "Cari Hesaplar" },
  { href: "/rehber", ikon: "📒", baslik: "Rehber" },
  { href: "/urunler", ikon: "🧾", baslik: "Ürünler" },
  { href: "/malzemeler", ikon: "🥬", baslik: "Malzemeler" },
  { href: "/receteler", ikon: "📋", baslik: "Reçeteler" },
  { href: "/maliyet", ikon: "💰", baslik: "Maliyet ve Kalori" },
  { href: "/stok", ikon: "📦", baslik: "Stok" },
  { href: "/takvim", ikon: "📅", baslik: "Takvim" },
  { href: "/raporlar", ikon: "📑", baslik: "Raporlar" },
  { href: "/istatistik", ikon: "📈", baslik: "İstatistikler" },
  { href: "/kasa", ikon: "💵", baslik: "Kasa" },
  { href: "/notlar", ikon: "📝", baslik: "Notlar" },
  { href: "/yedek", ikon: "💾", baslik: "Yedekleme" },
  { href: "/ayarlar", ikon: "⚙️", baslik: "Ayarlar" },
];

function depodanOku<T>(anahtar: string): T[] {
  try {
    const veri = JSON.parse(localStorage.getItem(anahtar) || "[]");
    return Array.isArray(veri) ? (veri as T[]) : [];
  } catch {
    return [];
  }
}

function kayitTarihi(kayit: TarihliKayit) {
  const tarihDegeri = kayit.tarih ?? kayit.islemId ?? kayit.id;

  if (tarihDegeri === undefined || tarihDegeri === null) {
    return null;
  }

  const tarih = new Date(tarihDegeri);
  return Number.isNaN(tarih.getTime()) ? null : tarih;
}

function bugununKaydiMi(kayit: TarihliKayit, bugun: Date) {
  const tarih = kayitTarihi(kayit);

  if (!tarih) {
    return false;
  }

  return (
    tarih.getDate() === bugun.getDate() &&
    tarih.getMonth() === bugun.getMonth() &&
    tarih.getFullYear() === bugun.getFullYear()
  );
}

function para(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(tutar);
}

const menuStili: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "16px 18px",
  borderRadius: "12px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  textDecoration: "none",
  color: "#1f2937",
  fontWeight: 700,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
};

export default function Home() {
  const [satis, setSatis] = useState(0);
  const [gider, setGider] = useState(0);
  const [tahsilat, setTahsilat] = useState(0);
  const [mudoBakiye, setMudoBakiye] = useState(0);
  const [cariBakiye, setCariBakiye] = useState(0);

  useEffect(() => {
    function verileriYukle() {
      const satislar = depodanOku<SatisKaydi>("aristo-satislar");
      const giderler = depodanOku<TutarKaydi>("aristo-giderler");
      const tahsilatlar = depodanOku<TutarKaydi>("aristo-tahsilatlar");
      const mudoFaturalar = depodanOku<MudoKaydi>("aristo-mudo-faturalar");
      const mudoOdemeler = depodanOku<MudoKaydi>("aristo-mudo-odemeler");
      const cariKayitlari = depodanOku<CariKaydi>("aristo-cari");

      const bugun = new Date();

      const bugunkuSatis = satislar
        .filter((kayit) => bugununKaydiMi(kayit, bugun))
        .reduce((toplam, kayit) => toplam + Number(kayit.toplam || 0), 0);

      const bugunkuGider = giderler
        .filter((kayit) => bugununKaydiMi(kayit, bugun))
        .reduce((toplam, kayit) => toplam + Number(kayit.tutar || 0), 0);

      const bugunkuTahsilat = tahsilatlar
        .filter((kayit) => bugununKaydiMi(kayit, bugun))
        .reduce((toplam, kayit) => toplam + Number(kayit.tutar || 0), 0);

      const toplamFatura = mudoFaturalar.reduce(
        (toplam, kayit) => toplam + Number(kayit.tutar || 0),
        0,
      );

      const toplamOdeme = mudoOdemeler.reduce(
        (toplam, kayit) => toplam + Number(kayit.tutar || 0),
        0,
      );

      const toplamCariBorc = cariKayitlari
        .filter((kayit) => kayit.tip === "Borç")
        .reduce((toplam, kayit) => toplam + Number(kayit.tutar || 0), 0);

      const toplamCariAlacak = cariKayitlari
        .filter((kayit) => kayit.tip === "Alacak")
        .reduce((toplam, kayit) => toplam + Number(kayit.tutar || 0), 0);

      setSatis(bugunkuSatis);
      setGider(bugunkuGider);
      setTahsilat(bugunkuTahsilat);
      setMudoBakiye(toplamFatura - toplamOdeme);
      setCariBakiye(toplamCariBorc - toplamCariAlacak);
    }

    verileriYukle();

    window.addEventListener("focus", verileriYukle);
    window.addEventListener("storage", verileriYukle);

    return () => {
      window.removeEventListener("focus", verileriYukle);
      window.removeEventListener("storage", verileriYukle);
    };
  }, []);

  const gunlukNet = satis - gider;

  const mudoAciklama =
    mudoBakiye > 0 ? "Borç var" : mudoBakiye < 0 ? "Alacak var" : "Borç yok";

  const cariAciklama =
    cariBakiye > 0
      ? "Borç bakiyesi"
      : cariBakiye < 0
        ? "Alacak bakiyesi"
        : "Bakiye kapalı";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7f5",
        padding: "30px 18px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
        <header
          style={{
            background: "linear-gradient(135deg, #174d38, #246b50)",
            color: "white",
            padding: "28px",
            borderRadius: "18px",
            marginBottom: "24px",
            boxShadow: "0 10px 28px rgba(23, 77, 56, 0.2)",
          }}
        >
          <h1 style={{ margin: 0 }}>🥪 Aristo Yönetim Sistemi</h1>

          <p style={{ margin: "8px 0 0", opacity: 0.9 }}>
            Aristo Sandwich &amp; Salad Bar
          </p>
        </header>

        <h2>📊 Bugünkü Durum</h2>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <Kart baslik="💰 Bugünkü Satış" deger={para(satis)} />

          <Kart baslik="💸 Bugünkü Gider" deger={para(gider)} />

          <Kart
            baslik="📈 Günlük Net"
            deger={para(gunlukNet)}
            renk={gunlukNet < 0 ? "#b91c1c" : "#15803d"}
          />

          <Kart baslik="💳 Bugünkü Tahsilat" deger={para(tahsilat)} />

          <Kart
            baslik="🏢 Mudo Bakiyesi"
            deger={para(mudoBakiye)}
            aciklama={mudoAciklama}
            renk={mudoBakiye > 0 ? "#b91c1c" : "#15803d"}
          />

          <Kart
            baslik="👥 Cari Bakiye"
            deger={para(cariBakiye)}
            aciklama={cariAciklama}
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
          {menu.map((menuOgesi) => (
            <Link key={menuOgesi.href} href={menuOgesi.href} style={menuStili}>
              <span aria-hidden="true">{menuOgesi.ikon}</span>
              <span>{menuOgesi.baslik}</span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}