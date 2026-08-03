"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  not: string;
};

export default function Satislar() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [secilenUrunId, setSecilenUrunId] = useState<number | null>(null);
  const [adet, setAdet] = useState("1");

  const [sepet, setSepet] = useState<SepetUrunu[]>([]);
  const [platform, setPlatform] = useState("Dükkân");
  const [odemeTipi, setOdemeTipi] = useState("Kredi Kartı");
  const [indirim, setIndirim] = useState("0");
  const [not, setNot] = useState("");

  const [kayitlar, setKayitlar] = useState<SatisKaydi[]>([]);

  useEffect(() => {
    const kayitliUrunler: Urun[] = JSON.parse(
      localStorage.getItem("aristo-urunler") || "[]"
    );

    const aktifUrunler = kayitliUrunler.filter((urun) => urun.aktif);

    setUrunler(aktifUrunler);

    if (aktifUrunler.length > 0) {
      setSecilenUrunId(aktifUrunler[0].id);
    }

    const eskiSatislar: SatisKaydi[] = JSON.parse(
      localStorage.getItem("aristo-satislar") || "[]"
    );

    setKayitlar(eskiSatislar);
  }, []);

  const secilenUrun = urunler.find(
    (urun) => urun.id === secilenUrunId
  );

  const sepetAraToplam = useMemo(() => {
    return sepet.reduce(
      (toplam, urun) => toplam + urun.adet * urun.birimFiyat,
      0
    );
  }, [sepet]);

  const indirimTutari = Math.max(Number(indirim || 0), 0);

  const genelToplam = Math.max(
    sepetAraToplam - indirimTutari,
    0
  );

  const toplamAdet = sepet.reduce(
    (toplam, urun) => toplam + urun.adet,
    0
  );

  function sepeteEkle() {
    if (!secilenUrun) {
      alert("Ürün seç.");
      return;
    }

    const urunAdedi = Number(adet);

    if (urunAdedi <= 0) {
      alert("Geçerli adet gir.");
      return;
    }

    const urunSepette = sepet.find(
      (urun) => urun.urunId === secilenUrun.id
    );

    if (urunSepette) {
      setSepet(
        sepet.map((urun) =>
          urun.urunId === secilenUrun.id
            ? {
                ...urun,
                adet: urun.adet + urunAdedi,
              }
            : urun
        )
      );
    } else {
      setSepet([
        ...sepet,
        {
          urunId: secilenUrun.id,
          urun: secilenUrun.ad,
          kategori: secilenUrun.kategori,
          adet: urunAdedi,
          birimFiyat: secilenUrun.satisFiyati,
        },
      ]);
    }

    setAdet("1");
  }

  function adetDegistir(urunId: number, yeniAdet: number) {
    if (yeniAdet <= 0) {
      sepettenCikar(urunId);
      return;
    }

    setSepet(
      sepet.map((urun) =>
        urun.urunId === urunId
          ? {
              ...urun,
              adet: yeniAdet,
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

  function sepetiTemizle() {
    const onay = window.confirm("Sepet temizlensin mi?");

    if (!onay) return;

    setSepet([]);
    setIndirim("0");
    setNot("");
  }

  function satisiKaydet() {
    if (sepet.length === 0) {
      alert("Sepete ürün ekle.");
      return;
    }

    const islemId = Date.now();
    const tarih = new Date().toLocaleString("tr-TR");

    const yeniKayitlar: SatisKaydi[] = sepet.map(
      (sepetUrunu, sira) => {
        const urunAraToplam =
          sepetUrunu.adet * sepetUrunu.birimFiyat;

        const urunIndirimi =
          sepetAraToplam > 0
            ? (urunAraToplam / sepetAraToplam) *
              indirimTutari
            : 0;

        return {
          id: islemId + sira,
          islemId,
          tarih,
          urun: sepetUrunu.urun,
          kategori: sepetUrunu.kategori,
          platform,
          odemeTipi,
          adet: sepetUrunu.adet,
          birimFiyat: sepetUrunu.birimFiyat,
          indirim: urunIndirimi,
          toplam: Math.max(
            urunAraToplam - urunIndirimi,
            0
          ),
          not: not.trim(),
        };
      }
    );

    const tumKayitlar = [...yeniKayitlar, ...kayitlar];

    setKayitlar(tumKayitlar);

    localStorage.setItem(
      "aristo-satislar",
      JSON.stringify(tumKayitlar)
    );

    setSepet([]);
    setPlatform("Dükkân");
    setOdemeTipi("Kredi Kartı");
    setIndirim("0");
    setNot("");

    alert(`Satış kaydedildi: ${para(genelToplam)}`);
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
        platform: urunKayitlari[0]?.platform || "-",
        odemeTipi: urunKayitlari[0]?.odemeTipi || "-",
        not: urunKayitlari[0]?.not || "",
        urunler: urunKayitlari,
        toplam: urunKayitlari.reduce(
          (toplam, kayit) =>
            toplam + Number(kayit.toplam || 0),
          0
        ),
      }))
      .sort((a, b) => b.islemId - a.islemId);
  }, [kayitlar]);

  const genelSatisToplami = kayitlar.reduce(
    (toplam, kayit) =>
      toplam + Number(kayit.toplam || 0),
    0
  );

  const para = (tutar: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(tutar);

  const alanStili = {
    width: "100%",
    padding: "11px",
    boxSizing: "border-box" as const,
    border: "1px solid #d1d5db",
    borderRadius: "8px",
  };

  return (
    <main
      style={{
        maxWidth: "950px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Link href="/">← Ana Sayfaya Dön</Link>

      <h1>🥪 Satış Girişi</h1>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "18px",
        }}
      >
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "18px",
          }}
        >
          <h2>Ürün Ekle</h2>

          <label>Ürün</label>
          <br />

          <select
            value={secilenUrunId ?? ""}
            onChange={(event) =>
              setSecilenUrunId(Number(event.target.value))
            }
            style={alanStili}
          >
            {urunler.map((urun) => (
              <option key={urun.id} value={urun.id}>
                {urun.ad} — {para(urun.satisFiyati)}
              </option>
            ))}
          </select>

          <br />
          <br />

          <label>Adet</label>
          <br />

          <input
            type="number"
            min="1"
            value={adet}
            onChange={(event) => setAdet(event.target.value)}
            style={alanStili}
          />

          <br />
          <br />

          <button onClick={sepeteEkle}>
            ➕ Sepete Ekle
          </button>
        </div>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "18px",
          }}
        >
          <h2>Satış Bilgileri</h2>

          <label>Platform</label>
          <br />

          <select
            value={platform}
            onChange={(event) =>
              setPlatform(event.target.value)
            }
            style={alanStili}
          >
            <option>Dükkân</option>
            <option>GetirYemek</option>
            <option>Trendyol</option>
            <option>Yemeksepeti</option>
            <option>Telefon Siparişi</option>
          </select>

          <br />
          <br />

          <label>Ödeme Tipi</label>
          <br />

          <select
            value={odemeTipi}
            onChange={(event) =>
              setOdemeTipi(event.target.value)
            }
            style={alanStili}
          >
            <option>Kredi Kartı</option>
            <option>Nakit</option>
            <option>Online Ödeme</option>
            <option>Diğer</option>
          </select>

          <br />
          <br />

          <label>Toplam İndirim (₺)</label>
          <br />

          <input
            type="number"
            min="0"
            value={indirim}
            onChange={(event) =>
              setIndirim(event.target.value)
            }
            style={alanStili}
          />

          <br />
          <br />

          <label>Not</label>
          <br />

          <input
            type="text"
            value={not}
            onChange={(event) => setNot(event.target.value)}
            placeholder="İsteğe bağlı"
            style={alanStili}
          />
        </div>
      </section>

      <hr style={{ margin: "30px 0" }} />

      <h2>🛒 Sepet</h2>

      {sepet.length === 0 ? (
        <p>Sepet boş.</p>
      ) : (
        <>
          {sepet.map((urun) => (
            <div
              key={urun.urunId}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(180px, 1fr) 90px 130px 80px",
                gap: "10px",
                alignItems: "center",
                borderBottom: "1px solid #e5e7eb",
                padding: "12px 0",
              }}
            >
              <div>
                <strong>{urun.urun}</strong>
                <br />
                <small>{para(urun.birimFiyat)}</small>
              </div>

              <input
                type="number"
                min="1"
                value={urun.adet}
                onChange={(event) =>
                  adetDegistir(
                    urun.urunId,
                    Number(event.target.value)
                  )
                }
                style={{ width: "70px" }}
              />

              <strong>
                {para(urun.adet * urun.birimFiyat)}
              </strong>

              <button
                onClick={() => sepettenCikar(urun.urunId)}
              >
                Sil
              </button>
            </div>
          ))}

          <div
            style={{
              marginTop: "20px",
              textAlign: "right",
            }}
          >
            <p>Toplam ürün: {toplamAdet} adet</p>
            <p>Ara toplam: {para(sepetAraToplam)}</p>
            <p>İndirim: {para(indirimTutari)}</p>
            <h2>Ödenecek: {para(genelToplam)}</h2>

            <button onClick={satisiKaydet}>
              💾 Satışı Tamamla
            </button>

            {" "}

            <button onClick={sepetiTemizle}>
              Sepeti Temizle
            </button>
          </div>
        </>
      )}

      <hr style={{ margin: "30px 0" }} />

      <h2>
        Genel Satış Toplamı: {para(genelSatisToplami)}
      </h2>

      <h2>Son Satışlar</h2>

      {islemler.length === 0 ? (
        <p>Henüz satış yok.</p>
      ) : (
        islemler.map((islem) => (
          <div
            key={islem.islemId}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "14px",
              padding: "16px",
              marginBottom: "14px",
            }}
          >
            <strong>{islem.tarih}</strong>

            <br />

            {islem.platform} — {islem.odemeTipi}

            <ul>
              {islem.urunler.map((urun) => (
                <li key={urun.id}>
                  {urun.urun} x{urun.adet} —{" "}
                  {para(urun.toplam)}
                </li>
              ))}
            </ul>

            <strong>Toplam: {para(islem.toplam)}</strong>

            {islem.not && (
              <p>Not: {islem.not}</p>
            )}

            <button
              onClick={() => islemiSil(islem.islemId)}
            >
              🗑️ İşlemi Sil
            </button>
          </div>
        ))
      )}
    </main>
  );
}