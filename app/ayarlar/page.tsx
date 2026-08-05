"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import Header from "../ui/Header";

type AyarlarVerisi = {
  isletmeAdi: string;
  altBaslik: string;
  telefon: string;
  adres: string;
  vergiDairesi: string;
  vergiNo: string;
  instagram: string;
  googleYorumLinki: string;
  tesekkurMesaji: string;
  fisAltMesaji: string;
  logoYolu: string;
  kdvOrani: number;
  paraBirimi: string;
  yaziciKagitBoyutu: string;
  fisLogosuGoster: boolean;
  fisTelefonGoster: boolean;
  fisAdresGoster: boolean;
  fisVergiBilgisiGoster: boolean;
  yoneticiSifresi: string;
};

const varsayilanAyarlar: AyarlarVerisi = {
  isletmeAdi: "ARISTO",
  altBaslik: "Sandwich & Salad Bar",
  telefon: "",
  adres: "",
  vergiDairesi: "",
  vergiNo: "",
  instagram: "",
  googleYorumLinki: "",
  tesekkurMesaji:
    "Bizi tercih ettiğiniz için teşekkür ederiz.",
  fisAltMesaji: "Afiyet olsun.",
  logoYolu: "/aristo-logo.png",
  kdvOrani: 10,
  paraBirimi: "TRY",
  yaziciKagitBoyutu: "80 mm",
  fisLogosuGoster: true,
  fisTelefonGoster: true,
  fisAdresGoster: true,
  fisVergiBilgisiGoster: false,
  yoneticiSifresi: "1234",
};

export default function Ayarlar() {
  const [ayarlar, setAyarlar] =
    useState<AyarlarVerisi>(
      varsayilanAyarlar
    );

  const [kaydedildi, setKaydedildi] =
    useState(false);

  const [sifreTekrar, setSifreTekrar] =
    useState("1234");

  const [sifreGoster, setSifreGoster] =
    useState(false);

  useEffect(() => {
    try {
      const kayitliVeri =
        localStorage.getItem(
          "aristo-ayarlar"
        );

      if (!kayitliVeri) {
        return;
      }

      const kayitliAyarlar =
        JSON.parse(kayitliVeri);

      setAyarlar({
        ...varsayilanAyarlar,
        ...kayitliAyarlar,
        kdvOrani: Number(
          kayitliAyarlar.kdvOrani ??
            varsayilanAyarlar.kdvOrani
        ),
      });

      setSifreTekrar(
        String(
          kayitliAyarlar.yoneticiSifresi ||
            varsayilanAyarlar.yoneticiSifresi
        )
      );
    } catch {
      setAyarlar(
        varsayilanAyarlar
      );
    }
  }, []);

  function alanDegistir<
    K extends keyof AyarlarVerisi
  >(
    alan: K,
    deger: AyarlarVerisi[K]
  ) {
    setAyarlar((onceki) => ({
      ...onceki,
      [alan]: deger,
    }));
  }

  function kaydet() {
    if (
      !ayarlar.isletmeAdi.trim()
    ) {
      alert(
        "İşletme adını gir."
      );
      return;
    }

    if (!/^\d{4,8}$/.test(ayarlar.yoneticiSifresi)) {
      alert("Yönetici şifresi 4-8 rakam olmalı.");
      return;
    }

    if (ayarlar.yoneticiSifresi !== sifreTekrar) {
      alert("Yönetici şifreleri aynı değil.");
      return;
    }

    localStorage.setItem(
      "aristo-ayarlar",
      JSON.stringify(ayarlar)
    );

    window.dispatchEvent(
      new Event("storage")
    );

    setKaydedildi(true);

    window.setTimeout(() => {
      setKaydedildi(false);
    }, 2500);
  }

  function varsayilanaDon() {
    const onay =
      window.confirm(
        "Ayarlar varsayılan değerlere döndürülsün mü?"
      );

    if (!onay) {
      return;
    }

    setAyarlar(
      varsayilanAyarlar
    );

    setSifreTekrar(
      varsayilanAyarlar.yoneticiSifresi
    );

    localStorage.setItem(
      "aristo-ayarlar",
      JSON.stringify(
        varsayilanAyarlar
      )
    );

    window.dispatchEvent(
      new Event("storage")
    );
  }

  const kartStili: CSSProperties = {
    background: "#ffffff",
    border:
      "1px solid #e3e8e5",
    borderRadius: "18px",
    padding: "22px",
    boxShadow:
      "0 8px 24px rgba(23,77,56,0.07)",
  };

  const alanStili: CSSProperties = {
    width: "100%",
    padding: "12px 13px",
    border:
      "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "16px",
    boxSizing: "border-box",
    marginTop: "7px",
    background: "#ffffff",
  };

  const etiketStili: CSSProperties = {
    display: "block",
    fontWeight: 800,
    color: "#374151",
  };

  const yesilButon: CSSProperties = {
    width: "100%",
    border: "none",
    borderRadius: "11px",
    padding: "14px 18px",
    background: "#174d38",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "16px",
  };

  const griButon: CSSProperties = {
    width: "100%",
    border:
      "1px solid #d1d5db",
    borderRadius: "11px",
    padding: "13px 18px",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "15px",
  };

  const secenekSatiri: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "14px",
    padding: "13px 0",
    borderBottom:
      "1px solid #e5e7eb",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f7faf8 0%, #eef4f0 100%)",
        padding:
          "28px 14px 60px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1050px",
          margin: "0 auto",
        }}
      >
        <Header />

        <div
          style={{
            marginBottom: "22px",
          }}
        >
          <h1
            style={{
              margin: "0 0 7px",
              color: "#153f30",
              fontSize:
                "clamp(30px, 5vw, 42px)",
            }}
          >
            ⚙️ Ayarlar
          </h1>

          <p
            style={{
              margin: 0,
              color: "#66736c",
              lineHeight: 1.55,
            }}
          >
            İşletme ve fiş
            bilgilerini buradan
            düzenle.
          </p>
        </div>

        {kaydedildi && (
          <div
            style={{
              marginBottom: "18px",
              padding: "14px 17px",
              borderRadius: "12px",
              background: "#dcfce7",
              border:
                "1px solid #86efac",
              color: "#166534",
              fontWeight: 800,
            }}
          >
            ✅ Ayarlar başarıyla
            kaydedildi.
          </div>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "18px",
            alignItems: "start",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "18px",
            }}
          >
            <div style={kartStili}>
              <h2
                style={{
                  marginTop: 0,
                  color: "#174d38",
                }}
              >
                🏪 İşletme Bilgileri
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: "17px",
                }}
              >
                <div>
                  <label
                    style={
                      etiketStili
                    }
                  >
                    İşletme Adı
                  </label>

                  <input
                    value={
                      ayarlar.isletmeAdi
                    }
                    onChange={(event) =>
                      alanDegistir(
                        "isletmeAdi",
                        event.target.value
                      )
                    }
                    style={alanStili}
                  />
                </div>

                <div>
                  <label
                    style={
                      etiketStili
                    }
                  >
                    Alt Başlık
                  </label>

                  <input
                    value={
                      ayarlar.altBaslik
                    }
                    onChange={(event) =>
                      alanDegistir(
                        "altBaslik",
                        event.target.value
                      )
                    }
                    placeholder="Sandwich & Salad Bar"
                    style={alanStili}
                  />
                </div>

                <div>
                  <label
                    style={
                      etiketStili
                    }
                  >
                    Telefon
                  </label>

                  <input
                    value={
                      ayarlar.telefon
                    }
                    onChange={(event) =>
                      alanDegistir(
                        "telefon",
                        event.target.value
                      )
                    }
                    placeholder="05xx xxx xx xx"
                    style={alanStili}
                  />
                </div>

                <div>
                  <label
                    style={
                      etiketStili
                    }
                  >
                    Adres
                  </label>

                  <textarea
                    rows={4}
                    value={
                      ayarlar.adres
                    }
                    onChange={(event) =>
                      alanDegistir(
                        "adres",
                        event.target.value
                      )
                    }
                    style={{
                      ...alanStili,
                      resize: "vertical",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      style={
                        etiketStili
                      }
                    >
                      Vergi Dairesi
                    </label>

                    <input
                      value={
                        ayarlar.vergiDairesi
                      }
                      onChange={(event) =>
                        alanDegistir(
                          "vergiDairesi",
                          event.target.value
                        )
                      }
                      style={alanStili}
                    />
                  </div>

                  <div>
                    <label
                      style={
                        etiketStili
                      }
                    >
                      Vergi No
                    </label>

                    <input
                      value={
                        ayarlar.vergiNo
                      }
                      onChange={(event) =>
                        alanDegistir(
                          "vergiNo",
                          event.target.value
                        )
                      }
                      style={alanStili}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={kartStili}>
              <h2
                style={{
                  marginTop: 0,
                  color: "#294b8f",
                }}
              >
                🌐 Sosyal Medya
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: "17px",
                }}
              >
                <div>
                  <label
                    style={
                      etiketStili
                    }
                  >
                    Instagram
                  </label>

                  <input
                    value={
                      ayarlar.instagram
                    }
                    onChange={(event) =>
                      alanDegistir(
                        "instagram",
                        event.target.value
                      )
                    }
                    placeholder="@aristosandwich"
                    style={alanStili}
                  />
                </div>

                <div>
                  <label
                    style={
                      etiketStili
                    }
                  >
                    Google Yorum
                    Bağlantısı
                  </label>

                  <input
                    value={
                      ayarlar.googleYorumLinki
                    }
                    onChange={(event) =>
                      alanDegistir(
                        "googleYorumLinki",
                        event.target.value
                      )
                    }
                    placeholder="Google yorum bağlantısı"
                    style={alanStili}
                  />
                </div>
              </div>
            </div>

            <div style={kartStili}>
              <h2
                style={{
                  marginTop: 0,
                  color: "#b45309",
                }}
              >
                🔒 Yönetici Şifresi
              </h2>

              <p
                style={{
                  marginTop: 0,
                  color: "#6b7280",
                  lineHeight: 1.55,
                }}
              >
                Ödeme alınmış satışları düzenlemek veya iptal etmek için kullanılır.
              </p>

              <div
                style={{
                  display: "grid",
                  gap: "16px",
                }}
              >
                <div>
                  <label style={etiketStili}>
                    Yeni Yönetici Şifresi
                  </label>

                  <input
                    type={sifreGoster ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={8}
                    value={ayarlar.yoneticiSifresi}
                    onChange={(event) =>
                      alanDegistir(
                        "yoneticiSifresi",
                        event.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="4-8 rakam"
                    style={alanStili}
                  />
                </div>

                <div>
                  <label style={etiketStili}>
                    Şifreyi Tekrar Gir
                  </label>

                  <input
                    type={sifreGoster ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={8}
                    value={sifreTekrar}
                    onChange={(event) =>
                      setSifreTekrar(
                        event.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="Şifreyi tekrar yaz"
                    style={alanStili}
                  />
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: "#374151",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={sifreGoster}
                    onChange={(event) =>
                      setSifreGoster(event.target.checked)
                    }
                    style={{
                      width: "19px",
                      height: "19px",
                      accentColor: "#174d38",
                    }}
                  />
                  Şifreyi göster
                </label>

                <div
                  style={{
                    padding: "11px 13px",
                    borderRadius: "10px",
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    color: "#9a3412",
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  Varsayılan şifre: <strong>1234</strong>. Değiştirdikten sonra
                  “Ayarları Kaydet” butonuna bas.
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "18px",
            }}
          >
            <div style={kartStili}>
              <h2
                style={{
                  marginTop: 0,
                  color: "#174d38",
                }}
              >
                🧾 Fiş Ayarları
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: "17px",
                }}
              >
                <div>
                  <label
                    style={
                      etiketStili
                    }
                  >
                    Logo Yolu
                  </label>

                  <input
                    value={
                      ayarlar.logoYolu
                    }
                    onChange={(event) =>
                      alanDegistir(
                        "logoYolu",
                        event.target.value
                      )
                    }
                    placeholder="/aristo-logo.png"
                    style={alanStili}
                  />

                  <small
                    style={{
                      display: "block",
                      marginTop: "6px",
                      color: "#6b7280",
                    }}
                  >
                    Public klasöründeki
                    logo yolu.
                  </small>
                </div>

                <div>
                  <label
                    style={
                      etiketStili
                    }
                  >
                    Teşekkür Mesajı
                  </label>

                  <textarea
                    rows={3}
                    value={
                      ayarlar.tesekkurMesaji
                    }
                    onChange={(event) =>
                      alanDegistir(
                        "tesekkurMesaji",
                        event.target.value
                      )
                    }
                    style={{
                      ...alanStili,
                      resize: "vertical",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={
                      etiketStili
                    }
                  >
                    Fiş Alt Mesajı
                  </label>

                  <input
                    value={
                      ayarlar.fisAltMesaji
                    }
                    onChange={(event) =>
                      alanDegistir(
                        "fisAltMesaji",
                        event.target.value
                      )
                    }
                    placeholder="Afiyet olsun."
                    style={alanStili}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      style={
                        etiketStili
                      }
                    >
                      KDV Oranı
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={
                        ayarlar.kdvOrani
                      }
                      onChange={(event) =>
                        alanDegistir(
                          "kdvOrani",
                          Number(
                            event.target
                              .value || 0
                          )
                        )
                      }
                      style={alanStili}
                    />
                  </div>

                  <div>
                    <label
                      style={
                        etiketStili
                      }
                    >
                      Para Birimi
                    </label>

                    <select
                      value={
                        ayarlar.paraBirimi
                      }
                      onChange={(event) =>
                        alanDegistir(
                          "paraBirimi",
                          event.target.value
                        )
                      }
                      style={alanStili}
                    >
                      <option value="TRY">
                        Türk Lirası
                      </option>

                      <option value="USD">
                        Amerikan Doları
                      </option>

                      <option value="EUR">
                        Euro
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    style={
                      etiketStili
                    }
                  >
                    Yazıcı Kâğıt Boyutu
                  </label>

                  <select
                    value={
                      ayarlar.yaziciKagitBoyutu
                    }
                    onChange={(event) =>
                      alanDegistir(
                        "yaziciKagitBoyutu",
                        event.target.value
                      )
                    }
                    style={alanStili}
                  >
                    <option>
                      80 mm
                    </option>

                    <option>
                      58 mm
                    </option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  borderTop:
                    "1px solid #e5e7eb",
                }}
              >
                <AyarSecenegi
                  baslik="Fişte logo göster"
                  aciklama="Aristo logosunu fişin üst kısmına ekler."
                  secili={
                    ayarlar.fisLogosuGoster
                  }
                  onChange={(deger) =>
                    alanDegistir(
                      "fisLogosuGoster",
                      deger
                    )
                  }
                  stil={
                    secenekSatiri
                  }
                />

                <AyarSecenegi
                  baslik="Telefonu göster"
                  aciklama="Telefon numarası fişte görünür."
                  secili={
                    ayarlar.fisTelefonGoster
                  }
                  onChange={(deger) =>
                    alanDegistir(
                      "fisTelefonGoster",
                      deger
                    )
                  }
                  stil={
                    secenekSatiri
                  }
                />

                <AyarSecenegi
                  baslik="Adresi göster"
                  aciklama="İşletme adresi fişte görünür."
                  secili={
                    ayarlar.fisAdresGoster
                  }
                  onChange={(deger) =>
                    alanDegistir(
                      "fisAdresGoster",
                      deger
                    )
                  }
                  stil={
                    secenekSatiri
                  }
                />

                <AyarSecenegi
                  baslik="Vergi bilgilerini göster"
                  aciklama="Vergi dairesi ve vergi numarası fişe eklenir."
                  secili={
                    ayarlar.fisVergiBilgisiGoster
                  }
                  onChange={(deger) =>
                    alanDegistir(
                      "fisVergiBilgisiGoster",
                      deger
                    )
                  }
                  stil={{
                    ...secenekSatiri,
                    borderBottom:
                      "none",
                  }}
                />
              </div>
            </div>

            <div style={kartStili}>
              <h2
                style={{
                  marginTop: 0,
                  color: "#294b8f",
                }}
              >
                👁️ Fiş Önizleme
              </h2>

              <div
                style={{
                  width: "100%",
                  maxWidth: "310px",
                  margin: "0 auto",
                  padding: "22px 17px",
                  background: "#ffffff",
                  border:
                    "1px dashed #9ca3af",
                  fontFamily:
                    "monospace",
                  textAlign: "center",
                }}
              >
                {ayarlar.fisLogosuGoster &&
                  ayarlar.logoYolu && (
                    <img
                      src={
                        ayarlar.logoYolu
                      }
                      alt="Aristo"
                      style={{
                        width: "68px",
                        height: "68px",
                        objectFit:
                          "contain",
                        marginBottom:
                          "8px",
                      }}
                    />
                  )}

                <strong
                  style={{
                    display: "block",
                    fontSize: "21px",
                  }}
                >
                  {ayarlar.isletmeAdi ||
                    "ARISTO"}
                </strong>

                <span
                  style={{
                    display: "block",
                    marginTop: "4px",
                  }}
                >
                  {ayarlar.altBaslik}
                </span>

                {ayarlar.fisTelefonGoster &&
                  ayarlar.telefon && (
                    <small
                      style={{
                        display:
                          "block",
                        marginTop: "8px",
                      }}
                    >
                      {ayarlar.telefon}
                    </small>
                  )}

                {ayarlar.fisAdresGoster &&
                  ayarlar.adres && (
                    <small
                      style={{
                        display:
                          "block",
                        marginTop: "5px",
                        whiteSpace:
                          "pre-wrap",
                      }}
                    >
                      {ayarlar.adres}
                    </small>
                  )}

                {ayarlar.fisVergiBilgisiGoster &&
                  (ayarlar.vergiDairesi ||
                    ayarlar.vergiNo) && (
                    <small
                      style={{
                        display:
                          "block",
                        marginTop: "7px",
                      }}
                    >
                      {ayarlar.vergiDairesi}
                      {ayarlar.vergiDairesi &&
                      ayarlar.vergiNo
                        ? " · "
                        : ""}
                      {ayarlar.vergiNo}
                    </small>
                  )}

                <div
                  style={{
                    margin: "14px 0",
                    borderTop:
                      "1px dashed #111827",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "10px",
                  }}
                >
                  <span>
                    1 x Aristo
                  </span>

                  <strong>
                    295 ₺
                  </strong>
                </div>

                <div
                  style={{
                    margin: "14px 0",
                    borderTop:
                      "1px dashed #111827",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    fontSize: "18px",
                  }}
                >
                  <strong>
                    TOPLAM
                  </strong>

                  <strong>
                    295 ₺
                  </strong>
                </div>

                <p
                  style={{
                    margin:
                      "17px 0 4px",
                    fontSize: "12px",
                  }}
                >
                  {
                    ayarlar.tesekkurMesaji
                  }
                </p>

                <strong
                  style={{
                    fontSize: "12px",
                  }}
                >
                  {
                    ayarlar.fisAltMesaji
                  }
                </strong>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={kaydet}
                style={yesilButon}
              >
                💾 Ayarları Kaydet
              </button>

              <button
                type="button"
                onClick={
                  varsayilanaDon
                }
                style={griButon}
              >
                ↩️ Varsayılan Ayarlara
                Dön
              </button>
            </div>
          </div>
        </section>

        <div
          style={{
            marginTop: "20px",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#174d38",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </main>
  );
}

function AyarSecenegi({
  baslik,
  aciklama,
  secili,
  onChange,
  stil,
}: {
  baslik: string;
  aciklama: string;
  secili: boolean;
  onChange: (
    deger: boolean
  ) => void;
  stil: CSSProperties;
}) {
  return (
    <label
      style={{
        ...stil,
        cursor: "pointer",
      }}
    >
      <span>
        <strong
          style={{
            display: "block",
            color: "#374151",
          }}
        >
          {baslik}
        </strong>

        <small
          style={{
            display: "block",
            marginTop: "4px",
            color: "#6b7280",
            lineHeight: 1.4,
          }}
        >
          {aciklama}
        </small>
      </span>

      <input
        type="checkbox"
        checked={secili}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        style={{
          width: "22px",
          height: "22px",
          accentColor: "#174d38",
          flexShrink: 0,
        }}
      />
    </label>
  );
}