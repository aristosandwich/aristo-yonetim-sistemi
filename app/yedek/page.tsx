"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import Header from "../ui/Header";
import { supabase } from "../lib/supabase";

const YEDEK_TABLOLARI = [
  "urunler",
  "malzemeler",
  "receteler",
  "acik_adisyonlar",
  "satislar",
  "giderler",
  "tahsilatlar",
  "kasa",
  "mudo",
  "cari",
  "takvim",
  "notlar",
  "rehber",
  "ayarlar",
  "aristo_islem_sonuclari_v2",
] as const;

type TabloAdi = (typeof YEDEK_TABLOLARI)[number];
type TabloKaydi = Record<string, unknown>;

type YedekDosyasi = {
  uygulama: "Aristo Yönetim";
  surum: string;
  olusturmaZamani: string;
  kayitSayisi: number;
  tablolar: Record<TabloAdi, TabloKaydi[]>;
  yerelVeriler: Record<string, string>;
};

type YuklenenYedek = {
  dosyaAdi: string;
  yedek: YedekDosyasi;
};

type GuvenlikYedegi = { karsilastirma: string };

const ARISTO_ON_EKI = "aristo-";

function tarihDosyaAdi() {
  const tarih = new Date();

  const yil = tarih.getFullYear();
  const ay = String(tarih.getMonth() + 1).padStart(2, "0");
  const gun = String(tarih.getDate()).padStart(2, "0");
  const saat = String(tarih.getHours()).padStart(2, "0");
  const dakika = String(tarih.getMinutes()).padStart(2, "0");

  return `${yil}-${ay}-${gun}_${saat}-${dakika}`;
}

function tarihYaz(tarihMetni: string) {
  const tarih = new Date(tarihMetni);

  if (Number.isNaN(tarih.getTime())) {
    return tarihMetni;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(tarih);
}

function byteYaz(byte: number) {
  if (byte < 1024) {
    return `${byte} B`;
  }

  if (byte < 1024 * 1024) {
    return `${(byte / 1024).toFixed(1)} KB`;
  }

  return `${(byte / (1024 * 1024)).toFixed(1)} MB`;
}

function aristoVerileriniOku() {
  const veriler: Record<string, string> = {};

  for (let index = 0; index < localStorage.length; index += 1) {
    const anahtar = localStorage.key(index);

    if (!anahtar || !anahtar.startsWith(ARISTO_ON_EKI)) {
      continue;
    }

    const deger = localStorage.getItem(anahtar);

    if (deger !== null) {
      veriler[anahtar] = deger;
    }
  }

  return veriler;
}

async function tabloyuOku(
  tablo: TabloAdi
): Promise<TabloKaydi[]> {
  const tumKayitlar: TabloKaydi[] = [];
  const sayfaBoyutu = 1000;
  let baslangic = 0;

  while (true) {
    const { data, error } = await supabase
      .from(tablo)
      .select("*")
      .order("id", { ascending: true })
      .range(
        baslangic,
        baslangic + sayfaBoyutu - 1
      );

    if (error) {
      throw new Error(
        `${tablo}: ${error.message}`
      );
    }

    const sayfa = (data || []) as TabloKaydi[];
    tumKayitlar.push(...sayfa);

    if (sayfa.length < sayfaBoyutu) {
      break;
    }

    baslangic += sayfaBoyutu;
  }

  return tumKayitlar;
}

async function bulutVerileriniOku() {
  const sonuclar = await Promise.all(
    YEDEK_TABLOLARI.map(async (tablo) => ({
      tablo,
      kayitlar: await tabloyuOku(tablo),
    }))
  );

  const tablolar = {} as Record<
    TabloAdi,
    TabloKaydi[]
  >;

  sonuclar.forEach(({ tablo, kayitlar }) => {
    tablolar[tablo] = kayitlar;
  });

  return tablolar;
}

function yedekGecerliMi(deger: unknown): deger is YedekDosyasi {
  if (!deger || typeof deger !== "object") {
    return false;
  }

  const aday = deger as Partial<YedekDosyasi>;

  return (
    aday.uygulama === "Aristo Yönetim" &&
    typeof aday.surum === "string" &&
    typeof aday.olusturmaZamani === "string" &&
    typeof aday.kayitSayisi === "number" &&
    !!aday.tablolar &&
    typeof aday.tablolar === "object" &&
    !Array.isArray(aday.tablolar) &&
    !!aday.yerelVeriler &&
    typeof aday.yerelVeriler === "object" &&
    !Array.isArray(aday.yerelVeriler)
  );
}

function kayitToplami(tablolar: Record<TabloAdi, TabloKaydi[]>) {
  return Object.values(tablolar).reduce((toplam, kayitlar) => toplam + kayitlar.length, 0);
}

function yedekIndirmeBaglantisi(yedek: YedekDosyasi, onEk: string) {
  const blob = new Blob([JSON.stringify(yedek, null, 2)], { type: "application/json;charset=utf-8" });
  const adres = URL.createObjectURL(blob);
  const baglanti = document.createElement("a");
  baglanti.href = adres;
  baglanti.download = `${onEk}_${tarihDosyaAdi()}.json`;
  document.body.appendChild(baglanti); baglanti.click(); baglanti.remove();
  URL.revokeObjectURL(adres);
  return blob.size;
}

export default function Yedekleme() {
  const dosyaSecici = useRef<HTMLInputElement>(null);

  const [yuklenen, setYuklenen] = useState<YuklenenYedek | null>(null);
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");
  const [geriYukleniyor, setGeriYukleniyor] = useState(false);
  const [guvenlikYedegi, setGuvenlikYedegi] = useState<GuvenlikYedegi | null>(null);
  const [yedekHazirlaniyor, setYedekHazirlaniyor] =
    useState(false);
  const [temizleniyor, setTemizleniyor] =
    useState(false);
  const [mevcutOzet, setMevcutOzet] = useState({
    tabloSayisi: YEDEK_TABLOLARI.length,
    kayitSayisi: 0,
    boyut: 0,
    yukleniyor: true,
  });

  useEffect(() => {
    let aktif = true;

    async function ozetiYukle() {
      try {
        const tablolar =
          await bulutVerileriniOku();

        if (!aktif) {
          return;
        }

        const yerelVeriler =
          aristoVerileriniOku();

        const kayitSayisi = kayitToplami(tablolar);

        const metin = JSON.stringify({
          tablolar,
          yerelVeriler,
        });

        setMevcutOzet({
          tabloSayisi:
            YEDEK_TABLOLARI.length,
          kayitSayisi,
          boyut: new Blob([metin]).size,
          yukleniyor: false,
        });
      } catch (hata) {
        console.error(
          "Yedek özeti hazırlanamadı:",
          hata
        );

        if (aktif) {
          setMevcutOzet((onceki) => ({
            ...onceki,
            yukleniyor: false,
          }));
          hataGoster(
            "Bulut verileri okunamadığı için yedek özeti hazırlanamadı."
          );
        }
      }
    }

    void ozetiYukle();

    return () => {
      aktif = false;
    };
  }, []);

  function bildirimGoster(metin: string) {
    setHata("");
    setMesaj(metin);

    window.setTimeout(() => {
      setMesaj("");
    }, 2800);
  }

  function hataGoster(metin: string) {
    setMesaj("");
    setHata(metin);
  }

  async function yedekIndir() {
    if (yedekHazirlaniyor) {
      return;
    }

    try {
      setYedekHazirlaniyor(true);
      setHata("");

      const tablolar =
        await bulutVerileriniOku();

      const yerelVeriler =
        aristoVerileriniOku();

      const kayitSayisi = kayitToplami(tablolar);

      if (kayitSayisi === 0) {
        const devam = window.confirm(
          "Bulutta kaydedilmiş Aristo verisi bulunamadı. Yine de boş yedek indirilsin mi?"
        );

        if (!devam) {
          setYedekHazirlaniyor(false);
          return;
        }
      }

      const yedek: YedekDosyasi = {
        uygulama: "Aristo Yönetim",
        surum: "4.3-supabase",
        olusturmaZamani: new Date().toISOString(),
        kayitSayisi,
        tablolar,
        yerelVeriler,
      };

      const boyut = yedekIndirmeBaglantisi(yedek, "aristo-yedek");

      setMevcutOzet({
        tabloSayisi: YEDEK_TABLOLARI.length,
        kayitSayisi,
        boyut,
        yukleniyor: false,
      });

      bildirimGoster(
        "Supabase tam yedeği bilgisayara indirildi."
      );
    } catch (hata) {
      console.error(
        "Yedek oluşturulamadı:",
        hata
      );
      hataGoster(
        "Bulut yedeği oluşturulamadı."
      );
    } finally {
      setYedekHazirlaniyor(false);
    }
  }

  function dosyaSec() {
    setHata("");
    dosyaSecici.current?.click();
  }

  async function dosyaOku(event: ChangeEvent<HTMLInputElement>) {
    const dosya = event.target.files?.[0];

    event.target.value = "";

    if (!dosya) {
      return;
    }

    if (!dosya.name.toLowerCase().endsWith(".json")) {
      hataGoster("Lütfen .json uzantılı bir Aristo yedek dosyası seç.");
      return;
    }

    try {
      const metin = await dosya.text();
      const veri = JSON.parse(metin) as unknown;

      if (!yedekGecerliMi(veri)) {
        hataGoster("Bu dosya geçerli bir Aristo yedeği değil.");
        setYuklenen(null);
        return;
      }

      if (dosya.size > 20 * 1024 * 1024 || !Number.isFinite(Date.parse(veri.olusturmaZamani))) {
        hataGoster("Yedek dosyası çok büyük veya oluşturulma tarihi geçersiz.");
        setYuklenen(null); return;
      }

      if (!Array.isArray(veri.tablolar.acik_adisyonlar)) {
        veri.tablolar.acik_adisyonlar = [];
      }

      const eksikVeyaHataliTablo =
        YEDEK_TABLOLARI.some(
          (tablo) =>
            !Array.isArray(
              veri.tablolar[tablo]
            ) ||
            veri.tablolar[tablo].some(
              (kayit) =>
                !kayit ||
                typeof kayit !== "object" ||
                Array.isArray(kayit)
            )
        );

      const hataliYerelKayit = Object.entries(
        veri.yerelVeriler
      ).some(
        ([anahtar, deger]) =>
          !anahtar.startsWith(ARISTO_ON_EKI) ||
          typeof deger !== "string"
      );

      if (
        eksikVeyaHataliTablo ||
        hataliYerelKayit
      ) {
        hataGoster(
          "Yedek dosyasındaki bazı bulut veya yerel kayıtlar geçersiz."
        );
        setYuklenen(null);
        return;
      }


      const gercekToplam = kayitToplami(veri.tablolar);
      const kimlikSorunu = YEDEK_TABLOLARI.some((tablo) => {
        const kimlikler = new Set<string>();
        return veri.tablolar[tablo].some((kayit) => {
          const id = String(kayit.id ?? "");
          if (!id || kimlikler.has(id)) return true;
          kimlikler.add(id); return false;
        });
      });
      if (gercekToplam !== veri.kayitSayisi || kimlikSorunu) {
        hataGoster("Yedekteki kayıt toplamı veya kayıt numaraları doğrulanamadı.");
        setYuklenen(null); return;
      }

      setYuklenen({
        dosyaAdi: dosya.name,
        yedek: veri,
      });
      setGuvenlikYedegi(null);

      bildirimGoster("Yedek dosyası okundu. Geri yüklemeden önce özeti kontrol et.");
    } catch {
      hataGoster("Dosya okunamadı veya JSON yapısı bozuk.");
      setYuklenen(null);
    }
  }

  async function geriYukle() {
    if (!yuklenen || !guvenlikYedegi || geriYukleniyor) return;
    const onay = window.prompt('Devam etmek için GERI YUKLE yaz:');
    if (onay !== "GERI YUKLE") { hataGoster("Geri yükleme iptal edildi."); return; }
    setGeriYukleniyor(true); setHata("");
    try {
      const guncelTablolar = await bulutVerileriniOku();
      if (JSON.stringify(guncelTablolar) !== guvenlikYedegi.karsilastirma) {
        throw new Error("Güvenlik yedeğinden sonra bulut verileri değişti. Yeniden güvenlik yedeği alın.");
      }
      const { data, error } = await supabase.rpc("aristo_yedek_geri_yukle_v1", { p_yedek: yuklenen.yedek.tablolar });
      if (error) throw error;
      if (!data || data.basarili !== true || !Number.isFinite(Number(data.toplam))) {
        throw new Error("Sunucunun geri yükleme sonucu doğrulanamadı.");
      }
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const anahtar = localStorage.key(i);
        if (anahtar?.startsWith(ARISTO_ON_EKI)) localStorage.removeItem(anahtar);
      }
      setYuklenen(null); setGuvenlikYedegi(null);
      bildirimGoster(`${Number(data.toplam)} kayıt güvenli şekilde birleştirildi. Sayfa yenileniyor.`);
      window.setTimeout(() => window.location.reload(), 1200);
    } catch (h) {
      hataGoster((h instanceof Error ? h.message : "Geri yükleme tamamlanamadı.") + " Hiçbir işlemi tekrar etmeden kontrol edin.");
    } finally { setGeriYukleniyor(false); }
  }

  async function guvenlikYedegiIndir() {
    if (!yuklenen || geriYukleniyor) return;
    setGeriYukleniyor(true); setHata("");
    try {
      const tablolar = await bulutVerileriniOku();
      const yedek: YedekDosyasi = {
        uygulama: "Aristo Yönetim", surum: "4.3-geri-yukleme-oncesi",
        olusturmaZamani: new Date().toISOString(), kayitSayisi: kayitToplami(tablolar),
        tablolar, yerelVeriler: aristoVerileriniOku(),
      };
      yedekIndirmeBaglantisi(yedek, "aristo-geri-yukleme-oncesi");
      setGuvenlikYedegi({ karsilastirma: JSON.stringify(tablolar) });
      bildirimGoster("Güncel güvenlik yedeği indirildi. Şimdi geri yüklemeyi onaylayabilirsin.");
    } catch { hataGoster("Güncel güvenlik yedeği alınamadı; geri yükleme açılmadı."); }
    finally { setGeriYukleniyor(false); }
  }

  async function demoVerileriniTemizle() {
    hataGoster("Toplu temizlik güvenlik kontrolü tamamlanana kadar kapalı. Tekil test kayıtlarını ilgili ekrandan silin.");
  }

  const kart: CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e3e8e5",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 8px 24px rgba(23,77,56,0.07)",
  };

  const anaButon: CSSProperties = {
    width: "100%",
    minHeight: "52px",
    border: "none",
    borderRadius: "11px",
    padding: "13px 17px",
    background: "#174d38",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "16px",
    cursor: "pointer",
  };

  const ikincilButon: CSSProperties = {
    ...anaButon,
    background: "#ffffff",
    color: "#294b8f",
    border: "1px solid #9fb0d5",
  };

  const satir: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    padding: "11px 0",
    borderBottom: "1px solid #e5e7eb",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f7faf8 0%, #eef4f0 100%)",
        padding: "28px 14px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <p role="status" style={{ padding: 16, color: "#174d38" }}>Yedek indirme ve silmeden birleştiren kontrollü geri yükleme açıktır. Toplu demo temizliği kapalıdır.</p>

      <style jsx global>{`
        @media (max-width: 680px) {
          .yedek-grid {
            grid-template-columns: 1fr !important;
          }

          .yedek-baslik {
            font-size: 31px !important;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
        }}
      >
        <Header />

        <div style={{ marginBottom: "22px" }}>
          <h1
            className="yedek-baslik"
            style={{
              margin: "0 0 7px",
              color: "#153f30",
              fontSize: "clamp(30px, 5vw, 42px)",
            }}
          >
            💾 Yedekleme
          </h1>

          <p
            style={{
              margin: 0,
              color: "#66736c",
              lineHeight: 1.55,
            }}
          >
            Supabase’deki Aristo verilerini bilgisayarına indir veya daha önce
            alınmış bir bulut yedeğini geri yükle.
          </p>
        </div>

        {mesaj && (
          <div
            style={{
              marginBottom: "17px",
              padding: "14px 17px",
              borderRadius: "12px",
              background: "#dcfce7",
              border: "1px solid #86efac",
              color: "#166534",
              fontWeight: 800,
            }}
          >
            ✅ {mesaj}
          </div>
        )}

        {hata && (
          <div
            style={{
              marginBottom: "17px",
              padding: "14px 17px",
              borderRadius: "12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontWeight: 800,
            }}
          >
            ❌ {hata}
          </div>
        )}

        <section
          className="yedek-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "18px",
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: "18px" }}>
            <div style={kart}>
              <h2
                style={{
                  marginTop: 0,
                  color: "#174d38",
                }}
              >
                📤 Yedeği İndir
              </h2>

              <p
                style={{
                  color: "#6b7280",
                  lineHeight: 1.65,
                }}
              >
                Satışlar, giderler, tahsilatlar, ürünler, ayarlar, kasa ve diğer
                tüm Supabase kayıtları tek JSON dosyasına alınır.
              </p>

              <div style={satir}>
                <span>Bulut tablosu</span>
                <strong>
                  {mevcutOzet.yukleniyor
                    ? "..."
                    : mevcutOzet.tabloSayisi}
                </strong>
              </div>

              <div style={satir}>
                <span>Toplam kayıt</span>
                <strong>
                  {mevcutOzet.yukleniyor
                    ? "..."
                    : mevcutOzet.kayitSayisi}
                </strong>
              </div>

              <div
                style={{
                  ...satir,
                  borderBottom: "none",
                  marginBottom: "14px",
                }}
              >
                <span>Tahmini boyut</span>
                <strong>
                  {mevcutOzet.yukleniyor
                    ? "..."
                    : byteYaz(mevcutOzet.boyut)}
                </strong>
              </div>

              <button
                type="button"
                onClick={yedekIndir}
                disabled={yedekHazirlaniyor}
                style={{
                  ...anaButon,
                  opacity: yedekHazirlaniyor ? 0.55 : 1,
                }}
              >
                {yedekHazirlaniyor
                  ? "Yedek Hazırlanıyor..."
                  : "⬇️ Tam Yedeği İndir"}
              </button>
            </div>

            <div style={kart}>
              <h2
                style={{
                  marginTop: 0,
                  color: "#294b8f",
                }}
              >
                📥 Yedeği Seç
              </h2>

              <p
                style={{
                  color: "#6b7280",
                  lineHeight: 1.65,
                }}
              >
                Daha önce indirdiğin Supabase Aristo JSON dosyasını seç. Dosya
                önce kontrol edilir; doğrudan verilerin üzerine yazılmaz.
              </p>

              <input
                ref={dosyaSecici}
                type="file"
                accept=".json,application/json"
                onChange={dosyaOku}
                style={{ display: "none" }}
              />

              <button type="button" onClick={dosyaSec} disabled={geriYukleniyor} style={ikincilButon}>
                📂 Yedek Dosyası Seç
              </button>
            </div>
          </div>

          <div style={kart}>
            <h2
              style={{
                marginTop: 0,
                color: "#174d38",
              }}
            >
              🔍 Yedek Önizleme
            </h2>

            {!yuklenen ? (
              <div
                style={{
                  padding: "28px 16px",
                  borderRadius: "13px",
                  background: "#f8faf9",
                  color: "#6b7280",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                Henüz yedek dosyası seçilmedi.
              </div>
            ) : (
              <>
                <div style={satir}>
                  <span>Dosya</span>
                  <strong
                    style={{
                      maxWidth: "220px",
                      textAlign: "right",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {yuklenen.dosyaAdi}
                  </strong>
                </div>

                <div style={satir}>
                  <span>Uygulama</span>
                  <strong>{yuklenen.yedek.uygulama}</strong>
                </div>

                <div style={satir}>
                  <span>Sürüm</span>
                  <strong>{yuklenen.yedek.surum}</strong>
                </div>

                <div style={satir}>
                  <span>Oluşturulma</span>
                  <strong style={{ textAlign: "right" }}>
                    {tarihYaz(yuklenen.yedek.olusturmaZamani)}
                  </strong>
                </div>

                <div
                  style={satir}
                >
                  <span>Bulut tablosu</span>
                  <strong>
                    {Object.keys(
                      yuklenen.yedek.tablolar
                    ).length}
                  </strong>
                </div>

                <div
                  style={{
                    ...satir,
                    borderBottom: "none",
                    marginBottom: "14px",
                  }}
                >
                  <span>Toplam kayıt</span>
                  <strong>
                    {yuklenen.yedek.kayitSayisi}
                  </strong>
                </div>

                <div
                  style={{
                    padding: "12px 14px",
                    marginBottom: "14px",
                    borderRadius: "11px",
                    background: "#fff7ed",
                    border: "1px solid #fdba74",
                    color: "#9a3412",
                    lineHeight: 1.55,
                    fontWeight: 700,
                  }}
                >
                  Güvenli birleştirme aynı numaralı kayıtları yedekteki hâliyle günceller ve eksikleri ekler. Yedekte olmayan mevcut kayıtları silmez.
                </div>

                <button type="button" onClick={guvenlikYedegiIndir}
                  disabled={geriYukleniyor}
                  style={{ ...ikincilButon, marginBottom: "9px" }}>
                  {guvenlikYedegi ? "✅ Güncel Güvenlik Yedeği Alındı" : "1. Güncel Güvenlik Yedeğini İndir"}
                </button>

                <button
                  type="button"
                  onClick={geriYukle}
                  disabled={geriYukleniyor || !guvenlikYedegi}
                  style={{
                    ...anaButon,
                    background: "#294b8f",
                    opacity: geriYukleniyor || !guvenlikYedegi ? 0.55 : 1,
                  }}
                >
                  {geriYukleniyor
                    ? "Yedek Geri Yükleniyor..."
                    : "2. Seçili Yedeği Güvenli Birleştir"}
                </button>

                <button
                  type="button"
                  onClick={() => setYuklenen(null)}
                  disabled={geriYukleniyor}
                  style={{
                    ...ikincilButon,
                    marginTop: "9px",
                    color: "#b91c1c",
                    borderColor: "#fecaca",
                  }}
                >
                  Seçimi İptal Et
                </button>
              </>
            )}
          </div>
        </section>

        <div
          style={{
            ...kart,
            marginTop: "18px",
            border: "1px solid #fecaca",
            background: "#fffafa",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#b91c1c",
            }}
          >
            🧹 Gerçek Kullanıma Geçiş
          </h2>

          <p
            style={{
              color: "#6b7280",
              lineHeight: 1.7,
            }}
          >
            Demo satışları, giderleri, tahsilatları, kasa kayıtlarını ve açık
            adisyonları temizler. Ürünler, fiyatlar, malzemeler, reçeteler ve
            işletme ayarları korunur. Gerçek kayıt girmeye başladıysan bu
            butonu kullanma.
          </p>

          <button
            type="button"
            onClick={demoVerileriniTemizle}
            disabled={true}
            style={{
              ...anaButon,
              background: "#b91c1c",
              opacity: temizleniyor ? 0.55 : 1,
            }}
          >
            {temizleniyor
              ? "Demo Verileri Temizleniyor..."
              : "🗑️ Demo İşlem Verilerini Temizle"}
          </button>
        </div>

        <div
          style={{
            ...kart,
            marginTop: "18px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#174d38",
            }}
          >
            ℹ️ Güvenli Kullanım
          </h2>

          <p
            style={{
              marginBottom: 0,
              color: "#6b7280",
              lineHeight: 1.7,
            }}
          >
            Veriler artık Supabase’de bulutta tutulur. Ek güvenlik için düzenli
            olarak tam JSON yedeği indirip Google Drive’da veya işletme
            e-postasında sakla. Gerektiğinde bu sayfadan seçerek tabloları
            silmeden birleştirebilirsin. İşlem güncel güvenlik yedeği ve yazılı
            onay olmadan çalışmaz; bir tabloda hata olursa sunucu hepsini geri alır.
          </p>
        </div>
      </div>
    </main>
  );
}
