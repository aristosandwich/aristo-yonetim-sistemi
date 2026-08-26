"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type TakvimKaydi = {
  id: number;
  baslik: string;
  tarih: string;
  tur: string;
  aciklama: string;
  tamamlandi: boolean;
};

const turler = [
  "Ödeme",
  "Fatura",
  "Vergi",
  "Personel",
  "Sipariş",
  "Toplantı",
  "Diğer",
];

export default function Takvim() {
  const [baslik, setBaslik] = useState("");
  const [tarih, setTarih] = useState("");
  const [tur, setTur] = useState("Ödeme");
  const [aciklama, setAciklama] = useState("");
  const [kayitlar, setKayitlar] = useState<TakvimKaydi[]>([]);
  const [arama, setArama] = useState("");
  const [durum, setDurum] = useState<
    "Tümü" | "Bekleyen" | "Tamamlanan"
  >("Tümü");
  const [kaydediliyor, setKaydediliyor] =
    useState(false);

  useEffect(() => {
    let aktif = true;

    async function takvimKayitlariniYukle() {
      const { data, error } = await supabase
        .from("takvim")
        .select(
          "id, baslik, tarih, tur, aciklama, tamamlandi"
        )
        .order("tarih", { ascending: true })
        .order("id", { ascending: true });

      if (!aktif) {
        return;
      }

      if (error) {
        console.error(
          "Takvim kayıtları okunamadı:",
          error
        );
        window.alert(
          "Takvim kayıtları buluttan okunamadı."
        );
        return;
      }

      let bulutKayitlari = data || [];

      if (bulutKayitlari.length === 0) {
        try {
          const eskiKayitlar: TakvimKaydi[] =
            JSON.parse(
              localStorage.getItem(
                "aristo-takvim"
              ) || "[]"
            );

          if (
            Array.isArray(eskiKayitlar) &&
            eskiKayitlar.length > 0
          ) {
            const { data: aktarilanlar, error: aktarimHatasi } =
              await supabase
                .from("takvim")
                .upsert(
                  eskiKayitlar.map((kayit) => ({
                    id: Number(kayit.id),
                    baslik: kayit.baslik,
                    tarih: kayit.tarih,
                    tur: kayit.tur,
                    aciklama: kayit.aciklama,
                    tamamlandi: Boolean(
                      kayit.tamamlandi
                    ),
                  })),
                  { onConflict: "id" }
                )
                .select(
                  "id, baslik, tarih, tur, aciklama, tamamlandi"
                );

            if (!aktif) {
              return;
            }

            if (aktarimHatasi) {
              console.error(
                "Eski takvim kayıtları aktarılamadı:",
                aktarimHatasi
              );
              window.alert(
                "Eski takvim kayıtları buluta aktarılamadı."
              );
            } else {
              bulutKayitlari = aktarilanlar || [];
            }
          }
        } catch (hata) {
          console.error(
            "Eski takvim kayıtları okunamadı:",
            hata
          );
        }
      }

      const yeniKayitlar: TakvimKaydi[] =
        bulutKayitlari.map((kayit) => ({
          id: Number(kayit.id || 0),
          baslik: String(kayit.baslik ?? ""),
          tarih: String(kayit.tarih ?? ""),
          tur: String(kayit.tur ?? "Diğer"),
          aciklama: String(kayit.aciklama ?? ""),
          tamamlandi: Boolean(
            kayit.tamamlandi
          ),
        }));

      kayitlariGuncelle(yeniKayitlar);
    }

    function odaklaninca() {
      void takvimKayitlariniYukle();
    }

    void takvimKayitlariniYukle();
    window.addEventListener(
      "focus",
      odaklaninca
    );

    return () => {
      aktif = false;

      window.removeEventListener(
        "focus",
        odaklaninca
      );
    };
  }, []);

  function kayitlariGuncelle(yeniListe: TakvimKaydi[]) {
    const siraliListe = [...yeniListe].sort((a, b) =>
      a.tarih.localeCompare(b.tarih)
    );

    setKayitlar(siraliListe);

    localStorage.setItem(
      "aristo-takvim",
      JSON.stringify(siraliListe)
    );
  }

  function formuTemizle() {
    setBaslik("");
    setTarih("");
    setTur("Ödeme");
    setAciklama("");
  }

  async function kaydet() {
    if (!baslik.trim() || !tarih) {
      alert("Başlık ve tarih gir.");
      return;
    }

    const yeniKayit: TakvimKaydi = {
      id: Date.now(),
      baslik: baslik.trim(),
      tarih,
      tur,
      aciklama: aciklama.trim(),
      tamamlandi: false,
    };

    if (kaydediliyor) {
      return;
    }

    setKaydediliyor(true);

    const { error } = await supabase
      .from("takvim")
      .insert({
        id: yeniKayit.id,
        baslik: yeniKayit.baslik,
        tarih: yeniKayit.tarih,
        tur: yeniKayit.tur,
        aciklama: yeniKayit.aciklama,
        tamamlandi: yeniKayit.tamamlandi,
      });

    if (error) {
      console.error(
        "Takvim kaydı kaydedilemedi:",
        error
      );
      window.alert(
        "Takvim kaydı buluta kaydedilemedi."
      );
      setKaydediliyor(false);
      return;
    }

    kayitlariGuncelle([
      ...kayitlar,
      yeniKayit,
    ]);
    formuTemizle();
    setKaydediliyor(false);

    alert("Takvim kaydı eklendi.");
  }

  async function tamamlandiDegistir(id: number) {
    const bulunanKayit = kayitlar.find(
      (kayit) => kayit.id === id
    );

    if (!bulunanKayit) {
      return;
    }

    const yeniTamamlandi =
      !bulunanKayit.tamamlandi;

    const { error } = await supabase
      .from("takvim")
      .update({
        tamamlandi: yeniTamamlandi,
      })
      .eq("id", id);

    if (error) {
      console.error(
        "Takvim durumu güncellenemedi:",
        error
      );
      window.alert(
        "Takvim kaydı bulutta güncellenemedi."
      );
      return;
    }

    const yeniListe = kayitlar.map((kayit) =>
      kayit.id === id
        ? {
            ...kayit,
            tamamlandi: yeniTamamlandi,
          }
        : kayit
    );

    kayitlariGuncelle(yeniListe);
  }

  async function sil(id: number) {
    const onay = window.confirm("Bu kayıt silinsin mi?");

    if (!onay) return;

    const { error } = await supabase
      .from("takvim")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Takvim kaydı silinemedi:",
        error
      );
      window.alert(
        "Takvim kaydı buluttan silinemedi."
      );
      return;
    }

    kayitlariGuncelle(
      kayitlar.filter(
        (kayit) => kayit.id !== id
      )
    );
  }

  function tarihiYaz(tarihMetni: string) {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(`${tarihMetni}T12:00:00`));
  }

  function kalanGun(tarihMetni: string) {
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    const hedef = new Date(`${tarihMetni}T00:00:00`);
    hedef.setHours(0, 0, 0, 0);

    return Math.round(
      (hedef.getTime() - bugun.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  const filtrelenmisKayitlar = useMemo(() => {
    const aranan = arama
      .trim()
      .toLocaleLowerCase("tr-TR");

    return kayitlar.filter((kayit) => {
      const durumUygun =
        durum === "Tümü" ||
        (durum === "Bekleyen" && !kayit.tamamlandi) ||
        (durum === "Tamamlanan" && kayit.tamamlandi);

      const metin =
        `${kayit.baslik} ${kayit.tur} ${kayit.aciklama}`.toLocaleLowerCase(
          "tr-TR"
        );

      const aramaUygun =
        !aranan || metin.includes(aranan);

      return durumUygun && aramaUygun;
    });
  }, [kayitlar, arama, durum]);

  const bekleyenSayisi = kayitlar.filter(
    (kayit) => !kayit.tamamlandi
  ).length;

  const tamamlananSayisi = kayitlar.filter(
    (kayit) => kayit.tamamlandi
  ).length;

  const gecikenSayisi = kayitlar.filter(
    (kayit) =>
      !kayit.tamamlandi && kalanGun(kayit.tarih) < 0
  ).length;

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

  const griButon = {
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    padding: "9px 12px",
    background: "#ffffff",
    color: "#111827",
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
      <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
        <Link href="/">← Ana Sayfaya Dön</Link>

        <h1 style={{ marginBottom: "6px" }}>
          📅 Takvim ve Hatırlatmalar
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: "24px",
            color: "#6b7280",
          }}
        >
          Ödeme, fatura ve işletme hatırlatmalarını yönet.
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
              Toplam kayıt
            </small>

            <h2 style={{ marginBottom: 0 }}>
              {kayitlar.length}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Bekleyen
            </small>

            <h2
              style={{
                marginBottom: 0,
                color: "#b45309",
              }}
            >
              {bekleyenSayisi}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Tamamlanan
            </small>

            <h2
              style={{
                marginBottom: 0,
                color: "#15803d",
              }}
            >
              {tamamlananSayisi}
            </h2>
          </div>

          <div style={kartStili}>
            <small style={{ color: "#6b7280" }}>
              Geciken
            </small>

            <h2
              style={{
                marginBottom: 0,
                color:
                  gecikenSayisi > 0 ? "#b91c1c" : "#15803d",
              }}
            >
              {gecikenSayisi}
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
              ➕ Yeni Hatırlatma
            </h2>

            <label>
              <strong>Başlık</strong>
            </label>

            <input
              type="text"
              placeholder="Örneğin: Mudo ödemesi"
              value={baslik}
              onChange={(event) =>
                setBaslik(event.target.value)
              }
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>Tarih</strong>
            </label>

            <input
              type="date"
              value={tarih}
              onChange={(event) =>
                setTarih(event.target.value)
              }
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>Tür</strong>
            </label>

            <select
              value={tur}
              onChange={(event) =>
                setTur(event.target.value)
              }
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            >
              {turler.map((turAdi) => (
                <option key={turAdi} value={turAdi}>
                  {turAdi}
                </option>
              ))}
            </select>

            <label>
              <strong>Açıklama</strong>
            </label>

            <textarea
              rows={4}
              placeholder="İsteğe bağlı"
              value={aciklama}
              onChange={(event) =>
                setAciklama(event.target.value)
              }
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "16px",
                resize: "vertical",
              }}
            />

            <button
              onClick={kaydet}
              disabled={kaydediliyor}
              style={{
                ...yesilButon,
                opacity: kaydediliyor ? 0.65 : 1,
              }}
            >
              💾 Kaydet
            </button>
          </div>

          <div style={kartStili}>
            <h2 style={{ marginTop: 0 }}>
              🔍 Kayıtları Filtrele
            </h2>

            <label>
              <strong>Arama</strong>
            </label>

            <input
              type="text"
              placeholder="Başlık, tür veya açıklama ara"
              value={arama}
              onChange={(event) =>
                setArama(event.target.value)
              }
              style={{
                ...alanStili,
                marginTop: "7px",
                marginBottom: "14px",
              }}
            />

            <label>
              <strong>Durum</strong>
            </label>

            <select
              value={durum}
              onChange={(event) =>
                setDurum(
                  event.target.value as
                    | "Tümü"
                    | "Bekleyen"
                    | "Tamamlanan"
                )
              }
              style={{
                ...alanStili,
                marginTop: "7px",
              }}
            >
              <option>Tümü</option>
              <option>Bekleyen</option>
              <option>Tamamlanan</option>
            </select>
          </div>
        </section>

        <section style={kartStili}>
          <h2 style={{ marginTop: 0 }}>
            Takvim Kayıtları ({filtrelenmisKayitlar.length})
          </h2>

          {filtrelenmisKayitlar.length === 0 ? (
            <p style={{ color: "#6b7280" }}>
              Kayıt bulunamadı.
            </p>
          ) : (
            filtrelenmisKayitlar.map((kayit) => {
              const gun = kalanGun(kayit.tarih);
              const gecikmis =
                !kayit.tamamlandi && gun < 0;

              const gunMetni = kayit.tamamlandi
                ? "Tamamlandı"
                : gun === 0
                ? "Bugün"
                : gun === 1
                ? "Yarın"
                : gun > 1
                ? `${gun} gün kaldı`
                : `${Math.abs(gun)} gün gecikti`;

              return (
                <div
                  key={kayit.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(190px, 1fr) auto",
                    gap: "18px",
                    borderBottom:
                      "1px solid #e5e7eb",
                    padding: "17px 0",
                    opacity: kayit.tamamlandi ? 0.58 : 1,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong
                        style={{
                          textDecoration: kayit.tamamlandi
                            ? "line-through"
                            : "none",
                        }}
                      >
                        {kayit.baslik}
                      </strong>

                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: "999px",
                          background: gecikmis
                            ? "#fee2e2"
                            : kayit.tamamlandi
                            ? "#dcfce7"
                            : "#fef3c7",
                          color: gecikmis
                            ? "#b91c1c"
                            : kayit.tamamlandi
                            ? "#15803d"
                            : "#92400e",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {gunMetni}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: "8px 0 5px",
                        color: "#6b7280",
                      }}
                    >
                      📅 {tarihiYaz(kayit.tarih)} · {kayit.tur}
                    </p>

                    <p style={{ margin: 0 }}>
                      {kayit.aciklama || "Açıklama yok"}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      alignItems: "flex-end",
                    }}
                  >
                    <button
                      onClick={() =>
                        tamamlandiDegistir(kayit.id)
                      }
                      style={
                        kayit.tamamlandi
                          ? griButon
                          : yesilButon
                      }
                    >
                      {kayit.tamamlandi
                        ? "↩️ Geri Al"
                        : "✅ Tamamla"}
                    </button>

                    <button
                      onClick={() => sil(kayit.id)}
                      style={kirmiziButon}
                    >
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}