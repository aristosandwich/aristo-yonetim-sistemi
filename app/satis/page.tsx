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
  const [secilenUrunId, setSecilenUrunId] = useState<number | null>(
    null
  );
  const [adet, setAdet] = useState("1");
  const [arama, setArama] = useState("");

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

    const aktifUrunler = kayitliUrunler.filter(
      (urun) => urun.aktif
    );

    setUrunler(aktifUrunler);

    if (aktifUrunler.length > 0) {
      setSecilenUrunId(aktifUrunler[0].id);
    }

    const eskiSatislar: SatisKaydi[] = JSON.parse(
      localStorage.getItem("aristo-satislar") || "[]"
    );

    setKayitlar(eskiSatislar);
  }, []);

  const filtrelenmisUrunler = useMemo(() => {
    const aranan = arama.trim().toLocaleLowerCase("tr-TR");

    if (!aranan) {
      return urunler;
    }

    return urunler.filter((urun) =>
      urun.ad.toLocaleLowerCase("tr-TR").includes(aranan)
    );
  }, [urunler, arama]);

  const secilenUrun = urunler.find(
    (urun) => urun.id === secilenUrunId
  );

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

  function sepeteEkle(urun?: Urun) {
    const eklenecekUrun = urun || secilenUrun;

    if (!eklenecekUrun) {
      alert("Ürün seç.");
      return;
    }

    const urunAdedi = Number(adet);

    if (urunAdedi <= 0) {
      alert("Geçerli adet gir.");
      return;
    }

    const urunSepette = sepet.find(
      (sepetUrunu) =>
        sepetUrunu.urunId === eklenecekUrun.id
    );

    if (urunSepette) {
      setSepet(
        sepet.map((sepetUrunu) =>
          sepetUrunu.urunId === eklenecekUrun.id
            ? {
                ...sepetUrunu,
                adet: sepetUrunu.adet + urunAdedi,
              }
            : sepetUrunu
        )
      );
    } else {
      setSepet([
        ...sepet,
        {
          urunId: eklenecekUrun.id,
          urun: eklenecekUrun.ad,
          kategori: eklenecekUrun.kategori,
          adet: urunAdedi,
          birimFiyat: Number(
            eklenecekUrun.satisFiyati || 0
          ),
        },
      ]);
    }

    setAdet("1");
  }

  function adetDegistir(
    urunId: number,
    yeniAdet: number
  ) {
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
    const urun = sepet.find(
      (sepetUrunu) => sepetUrunu.urunId === urunId
    );

    if (!urun) return;

    adetDegistir(urunId, urun.adet - 1);
  }

  function sepettenCikar(urunId: number) {
    setSepet(
      sepet.filter((urun) => urun.urunId !== urunId)
    );
  }

  function sepetiTemizle() {
    const onay = window.confirm(
      "Sepet temizlensin mi?"
    );

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

    if (indirimTutari > sepetAraToplam) {
      alert("İndirim ara toplamdan fazla olamaz.");
      return;
    }

    const islemId = Date.now();
    const tarih = new Date().toLocaleString("tr-TR");

    const yeniKayitlar: SatisKaydi[] = sepet.map(
      (sepetUrunu, sira) => {
        const urunAraToplam =
          sepetUrunu.adet *
          sepetUrunu.birimFiyat;

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
    setPlatform("Dükkân");
    setOdemeTipi("Kredi Kartı");
    setIndirim("0");
    setNot("");

    alert(
      `Satış kaydedildi: ${para(genelToplam)}`
    );
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
    const gruplar: Record<number, SatisKaydi[]> =
      {};

    kayitlar.forEach((kayit) => {
      const grupId =
        kayit.islemId || kayit.id;

      if (!gruplar[grupId]) {
        gruplar[grupId] = [];
      }

      gruplar[grupId].push(kayit);
    });

    return Object.entries(gruplar)
      .map(([islemId, urunKayitlari]) => ({
        islemId: Number(islemId),
        tarih:
          urunKayitlari[0]?.tarih || "-",
        platform:
          urunKayitlari[0]?.platform || "-",
        odemeTipi:
          urunKayitlari[0]?.odemeTipi || "-",
        not: urunKayitlari[0]?.not || "",
        urunler: urunKayitlari,
        toplam: urunKayitlari.reduce(
          (toplam, kayit) =>
            toplam +
            Number(kayit.toplam || 0),
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
        tarih.getFullYear() ===
          bugun.getFullYear()
      );
    })
    .reduce(
      (toplam, kayit) =>
        toplam + Number(kayit.toplam || 0),
      0
    );

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
    padding: "12px",
    boxSizing: "border-box" as const,
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "15px",
    background: "#ffffff",
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
    borderRadius: "10px",
    padding: "13px 18px",
    background: "#b91c1c",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const griButon = {
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    padding: "8px 12px",
    background: "#ffffff",
    color: "#111827",
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
        <Link href="/">
          ← Ana Sayfaya Dön
        </Link>

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

            <p
              style={{
                margin: 0,
                color: "#6b7280",
              }}
            >
              Ürünleri sepete ekle ve satışı tamamla.
            </p>
          </div>

          <div
            style={{
              ...kartStili,
              minWidth: "220px",
              padding: "16px 20px",
            }}
          >
            <small
              style={{
                color: "#6b7280",
              }}
            >
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

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "18px",
            marginBottom: "22px",
          }}
        >
          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              Ürün Ekle
            </h2>

            <label>Ürün ara</label>

            <input
              type="text"
              value={arama}
              onChange={(event) =>
                setArama(event.target.value)
              }
              placeholder="Örneğin: Aristo"
              style={{
                ...alanStili,
                marginTop: "6px",
                marginBottom: "14px",
              }}
            />

            <label>Ürün</label>

            <select
              value={secilenUrunId ?? ""}
              onChange={(event) =>
                setSecilenUrunId(
                  Number(event.target.value)
                )
              }
              style={{
                ...alanStili,
                marginTop: "6px",
                marginBottom: "14px",
              }}
            >
              {filtrelenmisUrunler.length ===
              0 ? (
                <option value="">
                  Ürün bulunamadı
                </option>
              ) : (
                filtrelenmisUrunler.map(
                  (urun) => (
                    <option
                      key={urun.id}
                      value={urun.id}
                    >
                      {urun.ad} —{" "}
                      {para(
                        Number(
                          urun.satisFiyati || 0
                        )
                      )}
                    </option>
                  )
                )
              )}
            </select>

            <label>Adet</label>

            <input
              type="number"
              min="1"
              value={adet}
              onChange={(event) =>
                setAdet(event.target.value)
              }
              style={{
                ...alanStili,
                marginTop: "6px",
                marginBottom: "16px",
              }}
            />

            <button
              onClick={() => sepeteEkle()}
              style={{
                ...yesilButon,
                width: "100%",
              }}
            >
              ➕ Sepete Ekle
            </button>

            {filtrelenmisUrunler.length >
              0 && (
              <>
                <h3
                  style={{
                    marginTop: "24px",
                  }}
                >
                  Hızlı seçim
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {filtrelenmisUrunler
                    .slice(0, 8)
                    .map((urun) => (
                      <button
                        key={urun.id}
                        onClick={() =>
                          sepeteEkle(urun)
                        }
                        style={{
                          ...griButon,
                          textAlign: "left",
                        }}
                      >
                        {urun.ad}
                        <br />
                        <small>
                          {para(
                            Number(
                              urun.satisFiyati ||
                                0
                            )
                          )}
                        </small>
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>

          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              Satış Bilgileri
            </h2>

            <label>Platform</label>

            <select
              value={platform}
              onChange={(event) =>
                setPlatform(event.target.value)
              }
              style={{
                ...alanStili,
                marginTop: "6px",
                marginBottom: "14px",
              }}
            >
              <option>Dükkân</option>
              <option>GetirYemek</option>
              <option>Trendyol</option>
              <option>Yemeksepeti</option>
              <option>Telefon Siparişi</option>
            </select>

            <label>Ödeme Tipi</label>

            <select
              value={odemeTipi}
              onChange={(event) =>
                setOdemeTipi(event.target.value)
              }
              style={{
                ...alanStili,
                marginTop: "6px",
                marginBottom: "14px",
              }}
            >
              <option>Kredi Kartı</option>
              <option>Nakit</option>
              <option>Online Ödeme</option>
              <option>Diğer</option>
            </select>

            <label>Toplam İndirim (₺)</label>

            <input
              type="number"
              min="0"
              value={indirim}
              onChange={(event) =>
                setIndirim(event.target.value)
              }
              style={{
                ...alanStili,
                marginTop: "6px",
                marginBottom: "14px",
              }}
            />

            <label>Not</label>

            <textarea
              value={not}
              onChange={(event) =>
                setNot(event.target.value)
              }
              placeholder="İsteğe bağlı"
              rows={4}
              style={{
                ...alanStili,
                marginTop: "6px",
                resize: "vertical",
              }}
            />
          </div>
        </section>

        <section
          style={{
            ...kartStili,
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "16px",
              marginBottom: "10px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 5px",
                }}
              >
                🛒 Sepet
              </h2>

              <small
                style={{
                  color: "#6b7280",
                }}
              >
                {toplamAdet} ürün
              </small>
            </div>

            <div
              style={{
                textAlign: "right",
              }}
            >
              <small
                style={{
                  color: "#6b7280",
                }}
              >
                Ödenecek
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
                color: "#6b7280",
                padding: "20px 0",
              }}
            >
              Sepet boş.
            </p>
          ) : (
            <>
              {sepet.map((urun) => (
                <div
                  key={urun.urunId}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(160px, 1fr) auto auto",
                    gap: "14px",
                    alignItems: "center",
                    borderBottom:
                      "1px solid #e5e7eb",
                    padding: "14px 0",
                  }}
                >
                  <div>
                    <strong>{urun.urun}</strong>

                    <br />

                    <small
                      style={{
                        color: "#6b7280",
                      }}
                    >
                      {para(
                        urun.birimFiyat
                      )}{" "}
                      / adet
                    </small>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() =>
                        adetAzalt(
                          urun.urunId
                        )
                      }
                      style={griButon}
                    >
                      −
                    </button>

                    <input
                      type="number"
                      min="1"
                      value={urun.adet}
                      onChange={(event) =>
                        adetDegistir(
                          urun.urunId,
                          Number(
                            event.target.value
                          )
                        )
                      }
                      style={{
                        width: "58px",
                        padding: "8px",
                        textAlign: "center",
                        border:
                          "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />

                    <button
                      onClick={() =>
                        adetArtir(
                          urun.urunId
                        )
                      }
                      style={griButon}
                    >
                      +
                    </button>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >
                    <strong>
                      {para(
                        urun.adet *
                          urun.birimFiyat
                      )}
                    </strong>

                    <br />

                    <button
                      onClick={() =>
                        sepettenCikar(
                          urun.urunId
                        )
                      }
                      style={{
                        border: "none",
                        background:
                          "transparent",
                        color: "#b91c1c",
                        cursor: "pointer",
                        marginTop: "6px",
                      }}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}

              <div
                style={{
                  marginTop: "20px",
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: "12px",
                }}
              >
                <div>
                  <p>
                    Ara toplam:{" "}
                    <strong>
                      {para(
                        sepetAraToplam
                      )}
                    </strong>
                  </p>

                  <p>
                    İndirim:{" "}
                    <strong>
                      {para(
                        indirimTutari
                      )}
                    </strong>
                  </p>

                  <h2>
                    Toplam:{" "}
                    {para(genelToplam)}
                  </h2>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    justifyContent:
                      "flex-end",
                  }}
                >
                  <button
                    onClick={satisiKaydet}
                    style={{
                      ...yesilButon,
                      width: "100%",
                      fontSize: "17px",
                    }}
                  >
                    💾 Satışı Tamamla
                  </button>

                  <button
                    onClick={sepetiTemizle}
                    style={{
                      ...kirmiziButon,
                      width: "100%",
                    }}
                  >
                    🗑️ Sepeti Temizle
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <section style={kartStili}>
          <h2 style={{ marginTop: 0 }}>
            Son Satışlar
          </h2>

          {islemler.length === 0 ? (
            <p>Henüz satış yok.</p>
          ) : (
            islemler.slice(0, 10).map((islem) => (
              <div
                key={islem.islemId}
                style={{
                  borderBottom:
                    "1px solid #e5e7eb",
                  padding: "16px 0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "flex-start",
                    gap: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>
                      {islem.tarih}
                    </strong>

                    <br />

                    <small
                      style={{
                        color: "#6b7280",
                      }}
                    >
                      {islem.platform} —{" "}
                      {islem.odemeTipi}
                    </small>
                  </div>

                  <strong
                    style={{
                      color: "#174d38",
                    }}
                  >
                    {para(islem.toplam)}
                  </strong>
                </div>

                <ul>
                  {islem.urunler.map(
                    (urun) => (
                      <li key={urun.id}>
                        {urun.urun} x
                        {urun.adet} —{" "}
                        {para(
                          urun.toplam
                        )}
                      </li>
                    )
                  )}
                </ul>

                {islem.not && (
                  <p>
                    Not: {islem.not}
                  </p>
                )}

                <button
                  onClick={() =>
                    islemiSil(
                      islem.islemId
                    )
                  }
                  style={kirmiziButon}
                >
                  🗑️ İşlemi Sil
                </button>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}