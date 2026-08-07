"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import Header from "../ui/Header";

type YedekDosyasi = {
  uygulama: "Aristo Yönetim";
  surum: string;
  olusturmaZamani: string;
  kayitSayisi: number;
  veriler: Record<string, string>;
};

type YuklenenYedek = {
  dosyaAdi: string;
  yedek: YedekDosyasi;
};

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
    !!aday.veriler &&
    typeof aday.veriler === "object" &&
    !Array.isArray(aday.veriler)
  );
}

function yoneticiSifresiniOku() {
  try {
    const kayitli = localStorage.getItem("aristo-ayarlar");

    if (!kayitli) {
      return "1234";
    }

    const ayarlar = JSON.parse(kayitli);

    return String(ayarlar.yoneticiSifresi || "1234");
  } catch {
    return "1234";
  }
}

function yoneticiOnayiAl() {
  const girilenSifre = window.prompt(
    "🔒 Yönetici şifresini gir:"
  );

  if (girilenSifre === null) {
    return false;
  }

  const dogruSifre = yoneticiSifresiniOku();

  if (girilenSifre !== dogruSifre) {
    window.alert("❌ Hatalı yönetici şifresi.");
    return false;
  }

  return true;
}

export default function Yedekleme() {
  const dosyaSecici = useRef<HTMLInputElement>(null);

  const [yuklenen, setYuklenen] = useState<YuklenenYedek | null>(null);
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");
  const [geriYukleniyor, setGeriYukleniyor] = useState(false);

  const mevcutOzet = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        kayitSayisi: 0,
        boyut: 0,
      };
    }

    const veriler = aristoVerileriniOku();
    const metin = JSON.stringify(veriler);

    return {
      kayitSayisi: Object.keys(veriler).length,
      boyut: new Blob([metin]).size,
    };
  }, [mesaj]);

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

  function yedekIndir() {
    try {
      const veriler = aristoVerileriniOku();

      if (Object.keys(veriler).length === 0) {
        const devam = window.confirm(
          "Kaydedilmiş Aristo verisi bulunamadı. Yine de boş yedek indirilsin mi?"
        );

        if (!devam) {
          return;
        }
      }

      const yedek: YedekDosyasi = {
        uygulama: "Aristo Yönetim",
        surum: "3.0",
        olusturmaZamani: new Date().toISOString(),
        kayitSayisi: Object.keys(veriler).length,
        veriler,
      };

      const blob = new Blob([JSON.stringify(yedek, null, 2)], {
        type: "application/json;charset=utf-8",
      });

      const adres = URL.createObjectURL(blob);
      const baglanti = document.createElement("a");

      baglanti.href = adres;
      baglanti.download = `aristo-yedek_${tarihDosyaAdi()}.json`;
      document.body.appendChild(baglanti);
      baglanti.click();
      baglanti.remove();

      URL.revokeObjectURL(adres);

      bildirimGoster("Tam yedek bilgisayara indirildi.");
    } catch {
      hataGoster("Yedek oluşturulamadı.");
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

      const hataliKayit = Object.entries(veri.veriler).some(
        ([anahtar, deger]) =>
          !anahtar.startsWith(ARISTO_ON_EKI) || typeof deger !== "string"
      );

      if (hataliKayit) {
        hataGoster("Yedek dosyasındaki bazı kayıtlar geçersiz.");
        setYuklenen(null);
        return;
      }

      setYuklenen({
        dosyaAdi: dosya.name,
        yedek: veri,
      });

      bildirimGoster("Yedek dosyası okundu. Geri yüklemeden önce özeti kontrol et.");
    } catch {
      hataGoster("Dosya okunamadı veya JSON yapısı bozuk.");
      setYuklenen(null);
    }
  }

  function geriYukle() {
    if (!yuklenen) {
      return;
    }

    if (!yoneticiOnayiAl()) {
      return;
    }

    const ilkOnay = window.confirm(
      "Bu işlem mevcut Aristo verilerini seçtiğin yedekle değiştirecek. Devam edilsin mi?"
    );

    if (!ilkOnay) {
      return;
    }

    const ikinciOnay = window.confirm(
      "Son onay: Mevcut satış, gider, ürün ve diğer kayıtların üzerine yazılacak. Emin misin?"
    );

    if (!ikinciOnay) {
      return;
    }

    try {
      setGeriYukleniyor(true);

      const silinecekAnahtarlar: string[] = [];

      for (let index = 0; index < localStorage.length; index += 1) {
        const anahtar = localStorage.key(index);

        if (anahtar?.startsWith(ARISTO_ON_EKI)) {
          silinecekAnahtarlar.push(anahtar);
        }
      }

      silinecekAnahtarlar.forEach((anahtar) => {
        localStorage.removeItem(anahtar);
      });

      Object.entries(yuklenen.yedek.veriler).forEach(([anahtar, deger]) => {
        localStorage.setItem(anahtar, deger);
      });

      window.dispatchEvent(new Event("storage"));

      setYuklenen(null);
      bildirimGoster("Yedek başarıyla geri yüklendi. Sayfa yenileniyor.");

      window.setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch {
      hataGoster("Yedek geri yüklenirken hata oluştu.");
      setGeriYukleniyor(false);
    }
  }

  function demoVerileriniTemizle() {
    if (!yoneticiOnayiAl()) {
      return;
    }

    const onay = window.confirm(
      "Demo satış, gider, tahsilat, kasa ve açık adisyon kayıtları silinecek. Ürünler, fiyatlar, malzemeler, reçeteler ve ayarlar korunacak. Devam edilsin mi?"
    );

    if (!onay) {
      return;
    }

    const sonOnay = window.confirm(
      "SON ONAY: Bu işlem geri alınamaz. Gerçek kayıt girdiysen onlar da silinir. Emin misin?"
    );

    if (!sonOnay) {
      return;
    }

    try {
      const silinecekAnahtarlar = [
        "aristo-satislar",
        "aristo-giderler",
        "aristo-tahsilatlar",
        "aristo-kasa",
        "aristo-kasa-kapanislari",
        "aristo-acik-adisyonlar",
      ];

      silinecekAnahtarlar.forEach((anahtar) => {
        localStorage.removeItem(anahtar);
      });

      window.dispatchEvent(new Event("storage"));
      bildirimGoster(
        "Demo işlem kayıtları temizlendi. Ürünler, malzemeler, reçeteler ve ayarlar korundu."
      );

      window.setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch {
      hataGoster("Demo verileri temizlenirken hata oluştu.");
    }
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
            Aristo verilerini bilgisayarına indir veya daha önce alınmış bir
            yedeği geri yükle.
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
                tüm Aristo kayıtları tek JSON dosyasına alınır.
              </p>

              <div style={satir}>
                <span>Yerel kayıt grubu</span>
                <strong>{mevcutOzet.kayitSayisi}</strong>
              </div>

              <div
                style={{
                  ...satir,
                  borderBottom: "none",
                  marginBottom: "14px",
                }}
              >
                <span>Tahmini boyut</span>
                <strong>{byteYaz(mevcutOzet.boyut)}</strong>
              </div>

              <button type="button" onClick={yedekIndir} style={anaButon}>
                ⬇️ Tam Yedeği İndir
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
                Daha önce indirdiğin Aristo JSON dosyasını seç. Dosya önce
                kontrol edilir; doğrudan verilerin üzerine yazılmaz.
              </p>

              <input
                ref={dosyaSecici}
                type="file"
                accept=".json,application/json"
                onChange={dosyaOku}
                style={{ display: "none" }}
              />

              <button type="button" onClick={dosyaSec} style={ikincilButon}>
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
                  style={{
                    ...satir,
                    borderBottom: "none",
                    marginBottom: "14px",
                  }}
                >
                  <span>Kayıt grubu</span>
                  <strong>{Object.keys(yuklenen.yedek.veriler).length}</strong>
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
                  Geri yükleme mevcut Aristo kayıtlarının üzerine yazacaktır.
                </div>

                <button
                  type="button"
                  onClick={geriYukle}
                  disabled={geriYukleniyor}
                  style={{
                    ...anaButon,
                    background: "#294b8f",
                    opacity: geriYukleniyor ? 0.55 : 1,
                  }}
                >
                  {geriYukleniyor
                    ? "Yedek Geri Yükleniyor..."
                    : "♻️ Seçili Yedeği Geri Yükle"}
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
            style={{
              ...anaButon,
              background: "#b91c1c",
            }}
          >
            🗑️ Demo İşlem Verilerini Temizle
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
            Her gün iş bitiminde bir yedek indir. Dosyayı Aristo için açacağın
            Google Drive klasöründe veya işletme e-postasında sakla. Bilgisayar
            değişirse Vercel sitesini yeni bilgisayarda açıp bu sayfadan son
            yedeği geri yükleyebilirsin. Yedek geri yükleme işlemi yönetici
            şifresi olmadan çalışmaz.
          </p>
        </div>
      </div>
    </main>
  );
}