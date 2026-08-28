"use client";

import {
  useEffect,
  useMemo,
  useState,
  useRef,
  type CSSProperties,
} from "react";
import Header from "../ui/Header";
import { aristoYaz, bekleyenIslemiTamamla, hataMesaji, kurus, tutarMetni, onbellekYaz, tumKayitlariOku } from "../lib/aristoIslemler";

type OdemeTipi = "Nakit" | "Kart" | "Banka";

type GiderKaydi = {
  surum: number;
  id: number;
  tarih: string;
  kategori: string;
  odemeTipi?: OdemeTipi;
  tutar: number;
  aciklama: string;
};

const giderKategorileri = [
  {
    grup: "Tedarik",
    secenekler: [
      "Coca-Cola",
      "Metro Market",
      "Mudo Toptan",
      "Diğer Tedarikçi",
    ],
  },
  {
    grup: "İşletme",
    secenekler: [
      "Kira",
      "Elektrik",
      "Su",
      "İnternet",
      "Telefon",
      "Aidat",
      "Temizlik",
      "Bakım / Onarım",
    ],
  },
  {
    grup: "Personel",
    secenekler: [
      "Personel Maaşı",
      "Personel Avansı",
      "Yemek / Yol",
    ],
  },
  {
    grup: "Banka / Finans",
    secenekler: [
      "POS Paketi",
      "POS Komisyonu",
      "Banka Masrafı",
      "EFT / Havale Masrafı",
      "Kredi Ödemesi",
    ],
  },
  {
    grup: "Resmî Ödemeler",
    secenekler: [
      "Muhasebeci",
      "Vergi",
      "SGK",
      "Stopaj",
      "Ruhsat / Harç",
    ],
  },
  {
    grup: "Diğer",
    secenekler: ["Diğer Gider"],
  },
];

function para(deger: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(deger);
}

function tarihiYaz(tarihMetni: string) {
  const tarih = new Date(tarihMetni);

  if (Number.isNaN(tarih.getTime())) {
    return tarihMetni;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(tarih);
}

function varsayilanOdemeTipi(
  kategori: string
): OdemeTipi {
  const bankaKategorileri = [
    "Kira",
    "İnternet",
    "Telefon",
    "Aidat",
    "POS Paketi",
    "POS Komisyonu",
    "Banka Masrafı",
    "EFT / Havale Masrafı",
    "Kredi Ödemesi",
    "Muhasebeci",
    "Vergi",
    "SGK",
    "Stopaj",
    "Ruhsat / Harç",
  ];

  if (bankaKategorileri.includes(kategori)) {
    return "Banka";
  }

  return "Nakit";
}

function supabaseKaydiniGiderKaydinaCevir(
  kayit: Record<string, unknown>
): GiderKaydi {
  const odemeTipi = [
    "Nakit",
    "Kart",
    "Banka",
  ].includes(String(kayit.odeme_tipi))
    ? (String(kayit.odeme_tipi) as OdemeTipi)
    : "Nakit";

  return {
    surum: Number(kayit.surum ?? 1),
    id: Number(kayit.id || 0),
    tarih: String(
      kayit.tarih ||
        new Date(
          Number(kayit.id || Date.now())
        ).toISOString()
    ),
    kategori: String(kayit.kategori ?? ""),
    odemeTipi,
    tutar: Number(kayit.tutar || 0),
    aciklama: String(kayit.aciklama ?? ""),
  };
}

function yerelGiderOnbelleginiGuncelle(giderler: GiderKaydi[]) { onbellekYaz("aristo-giderler", giderler); }

export default function Giderler() {
  const [kategori, setKategori] =
    useState("Coca-Cola");

  const [odemeTipi, setOdemeTipi] =
    useState<OdemeTipi>("Nakit");

  const [tutar, setTutar] = useState("");
  const [aciklama, setAciklama] =
    useState("");

  const [kayitlar, setKayitlar] =
    useState<GiderKaydi[]>([]);

  const [duzenlenenId, setDuzenlenenId] =
    useState<number | null>(null);

  const [kaydediliyor, setKaydediliyor] =
    useState(false);

  const [mesaj, setMesaj] = useState("");
  const [arama, setArama] = useState("");

  const [odemeFiltresi, setOdemeFiltresi] =
    useState<"Tümü" | OdemeTipi>("Tümü");

  const [
    baslangicTarihi,
    setBaslangicTarihi,
  ] = useState("");

  const [bitisTarihi, setBitisTarihi] =
    useState("");

  const [hazir, setHazir] = useState(false);
  const [veriHatasi, setVeriHatasi] = useState("");
  const islemKilidi = useRef(false);
  const duzenlenenSurum = useRef<number | undefined>(undefined);
  useEffect(() => {
    let aktif = true;
    async function yukle() {
      try {
        await bekleyenIslemiTamamla();
        const veri = await tumKayitlariOku("giderler", "id, tarih, kategori, odeme_tipi, tutar, aciklama, surum");
        if (!aktif) return;
        const kayitlar = veri.map(supabaseKaydiniGiderKaydinaCevir).sort((a,b) => b.id-a.id);
        setKayitlar(kayitlar); yerelGiderOnbelleginiGuncelle(kayitlar); setHazir(true);
      } catch (h) { if (aktif) setVeriHatasi(hataMesaji(h)); }
    }
    void yukle();
    const ayrilma = (e: BeforeUnloadEvent) => { if (islemKilidi.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", ayrilma);
    return () => { aktif = false; window.removeEventListener("beforeunload", ayrilma); };
  }, []);

  function bildirimGoster(metin: string) {
    setMesaj(metin);

    window.setTimeout(() => {
      setMesaj("");
    }, 2000);
  }

  function kategoriDegistir(
    yeniKategori: string
  ) {
    setKategori(yeniKategori);

    if (duzenlenenId === null) {
      setOdemeTipi(
        varsayilanOdemeTipi(yeniKategori)
      );
    }
  }

  function formuTemizle() {
    setKategori("Coca-Cola");
    setOdemeTipi("Nakit");
    setTutar("");
    setAciklama("");
    setDuzenlenenId(null);
    duzenlenenSurum.current = undefined;
  }

  async function kaydet() {
    if (!hazir || veriHatasi || islemKilidi.current) return;
    let miktar: string;
    try { miktar = tutarMetni(tutar); if (kurus(miktar) === 0) throw new Error("Tutar sıfırdan büyük olmalı."); }
    catch (h) { window.alert(hataMesaji(h)); return; }
    islemKilidi.current = true; setKaydediliyor(true);
    try {
      const sonuc = await aristoYaz("gider", { id: duzenlenenId ?? undefined, beklenenSurum: duzenlenenSurum.current,
        kategori, odeme_tipi: odemeTipi, tutar: miktar, aciklama: aciklama.trim() });
      if (!sonuc.gider) throw new Error("Gider sonucu eksik. Yeni kayıt girmeden sayfayı yenileyin.");
      const gider = supabaseKaydiniGiderKaydinaCevir(sonuc.gider);
      const yeni = [gider, ...kayitlar.filter(k => k.id !== gider.id)].sort((a,b) => b.id-a.id);
      setKayitlar(yeni); yerelGiderOnbelleginiGuncelle(yeni); formuTemizle();
      bildirimGoster("Gider kaydedildi; nakit payı kasaya işlendi.");
    } catch (h) { setVeriHatasi(hataMesaji(h)); }
    finally { islemKilidi.current = false; setKaydediliyor(false); }
  }

  function kaydiDuzenle(
    kayit: GiderKaydi
  ) {
    setKategori(kayit.kategori);
    setOdemeTipi(
      kayit.odemeTipi || "Nakit"
    );
    setTutar(String(kayit.tutar));
    setAciklama(kayit.aciklama || "");
    setDuzenlenenId(kayit.id);
    duzenlenenSurum.current = kayit.surum;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function kaydiSil(id: number) {
    if (!hazir || veriHatasi || islemKilidi.current) return;
    if (!window.confirm("Gider silinsin mi? Nakit giderse tutarı kasaya geri eklenecek.")) return;
    if (!window.confirm("Emin misin? Gider raporlardan da kaldırılacak.")) return;
    const kayit = kayitlar.find(k => k.id === id); if (!kayit) return;
    islemKilidi.current = true; setKaydediliyor(true);
    try {
      await aristoYaz("gider_sil", { id, beklenenSurum: kayit.surum });
      const yeni = kayitlar.filter(k => k.id !== id);
      setKayitlar(yeni); yerelGiderOnbelleginiGuncelle(yeni);
      if (duzenlenenId === id) formuTemizle();
      bildirimGoster("Gider silindi; kasa düzeltildi.");
    } catch (h) { setVeriHatasi(hataMesaji(h)); }
    finally { islemKilidi.current = false; setKaydediliyor(false); }
  }

  function filtreyiTemizle() {
    setArama("");
    setOdemeFiltresi("Tümü");
    setBaslangicTarihi("");
    setBitisTarihi("");
  }

  const filtrelenmisKayitlar =
    useMemo(() => {
      return kayitlar.filter((kayit) => {
        const kayitTarihi = new Date(kayit.tarih);

        if (baslangicTarihi) {
          const baslangic = new Date(
            `${baslangicTarihi}T00:00:00`
          );

          if (kayitTarihi < baslangic) {
            return false;
          }
        }

        if (bitisTarihi) {
          const bitis = new Date(
            `${bitisTarihi}T23:59:59`
          );

          if (kayitTarihi > bitis) {
            return false;
          }
        }

        if (
          odemeFiltresi !== "Tümü" &&
          (kayit.odemeTipi || "Nakit") !==
            odemeFiltresi
        ) {
          return false;
        }

        const aranan = arama
          .trim()
          .toLocaleLowerCase("tr-TR");

        if (aranan) {
          const metin =
            `${kayit.kategori} ${
              kayit.aciklama
            } ${
              kayit.odemeTipi || "Nakit"
            }`.toLocaleLowerCase("tr-TR");

          if (!metin.includes(aranan)) {
            return false;
          }
        }

        return true;
      });
    }, [
      kayitlar,
      arama,
      odemeFiltresi,
      baslangicTarihi,
      bitisTarihi,
    ]);

  const toplamGider =
    filtrelenmisKayitlar.reduce(
      (toplam, kayit) =>
        toplam +
        Number(kayit.tutar || 0),
      0
    );

  const nakitGider =
    filtrelenmisKayitlar
      .filter(
        (kayit) =>
          (kayit.odemeTipi ||
            "Nakit") === "Nakit"
      )
      .reduce(
        (toplam, kayit) =>
          toplam +
          Number(kayit.tutar || 0),
        0
      );

  const kartGider =
    filtrelenmisKayitlar
      .filter(
        (kayit) =>
          kayit.odemeTipi === "Kart"
      )
      .reduce(
        (toplam, kayit) =>
          toplam +
          Number(kayit.tutar || 0),
        0
      );

  const bankaGider =
    filtrelenmisKayitlar
      .filter(
        (kayit) =>
          kayit.odemeTipi === "Banka"
      )
      .reduce(
        (toplam, kayit) =>
          toplam +
          Number(kayit.tutar || 0),
        0
      );

  const kartStili: CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e3e8e5",
    borderRadius: "18px",
    padding: "20px",
    boxShadow:
      "0 8px 24px rgba(23,77,56,0.07)",
  };

  const alanStili: CSSProperties = {
    width: "100%",
    padding: "12px 13px",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "11px",
    background: "#ffffff",
    fontSize: "16px",
  };

  const butonStili: CSSProperties = {
    border: "1px solid #d1d5db",
    borderRadius: "11px",
    padding: "11px 14px",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 750,
    cursor: "pointer",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f7faf8 0%, #eef4f0 100%)",
        padding: "28px 14px 60px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div role="status">{veriHatasi || (!hazir ? "Giderler buluttan okunuyor…" : "Nakit giderler kasayı otomatik günceller.")}
        {veriHatasi && <button onClick={() => window.location.reload()}>Güncel kayıtları yükle</button>}
      </div>
      <fieldset disabled={!hazir || kaydediliyor || !!veriHatasi} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <Header />

        <div
          style={{
            marginBottom: "20px",
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
            💸 Gider Girişi
          </h1>

          <p
            style={{
              margin: 0,
              color: "#66736c",
            }}
          >
            Gerçekten ödediğin giderleri
            kısa ve kolay şekilde kaydet.
          </p>
        </div>

        {duzenlenenId !== null && (
          <div
            style={{
              padding: "14px 17px",
              marginBottom: "18px",
              borderRadius: "12px",
              background: "#fff7ed",
              border:
                "1px solid #fdba74",
              color: "#9a3412",
              fontWeight: 800,
            }}
          >
            ✏️ Bir gider kaydını
            düzenliyorsun.
          </div>
        )}

        <section
          style={{
            ...kartStili,
            marginBottom: "18px",
            border:
              "2px solid #174d38",
          }}
        >
          <h2
            style={{
              margin: "0 0 16px",
            }}
          >
            Yeni Gider
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "15px",
            }}
          >
            <div>
              <label>
                <strong>
                  Gider Kategorisi
                </strong>
              </label>

              <select
                value={kategori}
                onChange={(event) =>
                  kategoriDegistir(
                    event.target.value
                  )
                }
                style={{
                  ...alanStili,
                  marginTop: "7px",
                }}
              >
                {giderKategorileri.map(
                  (grup) => (
                    <optgroup
                      key={grup.grup}
                      label={grup.grup}
                    >
                      {grup.secenekler.map(
                        (secenek) => (
                          <option
                            key={secenek}
                          >
                            {secenek}
                          </option>
                        )
                      )}
                    </optgroup>
                  )
                )}
              </select>
            </div>

            <div>
              <label>
                <strong>Tutar (₺)</strong>
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={tutar}
                onChange={(event) =>
                  setTutar(
                    event.target.value
                  )
                }
                style={{
                  ...alanStili,
                  marginTop: "7px",
                  fontWeight: 800,
                  fontSize: "19px",
                }}
              />
            </div>

            <div>
              <label>
                <strong>Açıklama</strong>
              </label>

              <input
                type="text"
                placeholder="Örneğin: 6 aylık POS paketi"
                value={aciklama}
                onChange={(event) =>
                  setAciklama(
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
              marginTop: "16px",
            }}
          >
            <strong>
              Ödeme Nereden Yapıldı?
            </strong>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              {(
                [
                  "Nakit",
                  "Kart",
                  "Banka",
                ] as OdemeTipi[]
              ).map((tip) => (
                <button
                  key={tip}
                  type="button"
                  onClick={() =>
                    setOdemeTipi(tip)
                  }
                  style={{
                    ...butonStili,
                    minHeight: "58px",
                    background:
                      odemeTipi === tip
                        ? "#174d38"
                        : "#ffffff",
                    color:
                      odemeTipi === tip
                        ? "#ffffff"
                        : "#111827",
                    borderColor:
                      odemeTipi === tip
                        ? "#174d38"
                        : "#d1d5db",
                  }}
                >
                  {tip === "Nakit"
                    ? "💵 Nakit"
                    : tip === "Kart"
                      ? "💳 Kart"
                      : "🏦 Banka"}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "9px",
              flexWrap: "wrap",
              marginTop: "18px",
            }}
          >
            <button
              onClick={kaydet}
              disabled={kaydediliyor}
              style={{
                border: "none",
                borderRadius: "11px",
                padding: "14px 19px",
                background: "#174d38",
                color: "#ffffff",
                fontWeight: 800,
                cursor: kaydediliyor
                  ? "wait"
                  : "pointer",
                opacity: kaydediliyor
                  ? 0.75
                  : 1,
              }}
            >
              {kaydediliyor
                ? "KAYDEDİLİYOR..."
                : duzenlenenId !== null
                  ? "💾 Değişiklikleri Kaydet"
                  : "💾 Gideri Kaydet"}
            </button>

            {duzenlenenId !== null && (
              <button
                onClick={formuTemizle}
                style={butonStili}
              >
                Vazgeç
              </button>
            )}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(185px, 1fr))",
            gap: "11px",
            marginBottom: "18px",
          }}
        >
          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
                fontWeight: 800,
              }}
            >
              TOPLAM GİDER
            </small>

            <h2
              style={{
                marginBottom: 0,
                color: "#b91c1c",
              }}
            >
              {para(toplamGider)}
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
                fontWeight: 800,
              }}
            >
              NAKİT
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {para(nakitGider)}
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
                fontWeight: 800,
              }}
            >
              KART
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {para(kartGider)}
            </h2>
          </div>

          <div style={kartStili}>
            <small
              style={{
                color: "#6b7280",
                fontWeight: 800,
              }}
            >
              BANKA
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {para(bankaGider)}
            </h2>
          </div>
        </section>

        <section
          style={{
            ...kartStili,
            marginBottom: "18px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            🔍 Giderleri Filtrele
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "12px",
            }}
          >
            <input
              type="text"
              placeholder="Kategori veya açıklama ara"
              value={arama}
              onChange={(event) =>
                setArama(
                  event.target.value
                )
              }
              style={alanStili}
            />

            <select
              value={odemeFiltresi}
              onChange={(event) =>
                setOdemeFiltresi(
                  event.target.value as
                    | "Tümü"
                    | OdemeTipi
                )
              }
              style={alanStili}
            >
              <option>Tümü</option>
              <option>Nakit</option>
              <option>Kart</option>
              <option>Banka</option>
            </select>

            <input
              type="date"
              value={baslangicTarihi}
              onChange={(event) =>
                setBaslangicTarihi(
                  event.target.value
                )
              }
              style={alanStili}
            />

            <input
              type="date"
              value={bitisTarihi}
              onChange={(event) =>
                setBitisTarihi(
                  event.target.value
                )
              }
              style={alanStili}
            />
          </div>

          <button
            onClick={filtreyiTemizle}
            style={{
              ...butonStili,
              marginTop: "12px",
            }}
          >
            Filtreyi Temizle
          </button>
        </section>

        <section style={kartStili}>
          <h2 style={{ marginTop: 0 }}>
            Gider Kayıtları
          </h2>

          {filtrelenmisKayitlar.length ===
          0 ? (
            <p
              style={{
                color: "#6b7280",
              }}
            >
              Bu filtrelere uygun gider
              kaydı yok.
            </p>
          ) : (
            filtrelenmisKayitlar.map(
              (kayit) => (
                <div
                  key={kayit.id}
                  style={{
                    padding: "15px 0",
                    borderBottom:
                      "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "14px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          fontSize: "18px",
                        }}
                      >
                        {kayit.kategori}
                      </strong>

                      <p
                        style={{
                          margin: "6px 0",
                          color: "#6b7280",
                        }}
                      >
                        {tarihiYaz(
                          kayit.tarih
                        )}
                      </p>

                      <span
                        style={{
                          display:
                            "inline-block",
                          padding: "5px 9px",
                          borderRadius:
                            "999px",
                          background:
                            "#edf7f1",
                          color: "#174d38",
                          fontWeight: 800,
                          fontSize: "13px",
                        }}
                      >
                        {kayit.odemeTipi ||
                          "Nakit"}
                      </span>
                    </div>

                    <strong
                      style={{
                        color: "#b91c1c",
                        fontSize: "21px",
                      }}
                    >
                      {para(kayit.tutar)}
                    </strong>
                  </div>

                  <p
                    style={{
                      margin: "12px 0",
                    }}
                  >
                    {kayit.aciklama ||
                      "Açıklama yok"}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "9px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() =>
                        kaydiDuzenle(
                          kayit
                        )
                      }
                      style={butonStili}
                    >
                      ✏️ Düzenle
                    </button>

                    <button
                      onClick={() =>
                        kaydiSil(kayit.id)
                      }
                      style={{
                        ...butonStili,
                        color: "#b91c1c",
                        borderColor:
                          "#fecaca",
                      }}
                    >
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </section>
      </div>

      {mesaj && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: "24px",
            transform:
              "translateX(-50%)",
            zIndex: 9999,
            padding: "14px 20px",
            borderRadius: "12px",
            background: "#174d38",
            color: "#ffffff",
            fontWeight: 800,
            boxShadow:
              "0 12px 30px rgba(0,0,0,0.2)",
          }}
        >
          ✅ {mesaj}
        </div>
      )}
      </fieldset>
    </main>
  );
}