import { supabase } from "./supabase";

type Veri = Record<string, unknown>;
type IslemTuru = "adisyon" | "satis" | "satis_sil" | "gider" | "gider_sil" | "kasa";
type Bekleyen = { id: string; kullanici: string; tur: IslemTuru; veri: Veri };
export type IslemSonucu = {
  adisyon?: Veri; satislar?: Veri[]; gider?: Veri;
  kasa: { tutar: number; surum: number }; islemId?: number; silindi?: boolean;
};
const BEKLEYEN = "aristo-onayli-islem-v2";
let sira: Promise<unknown> = Promise.resolve();
let bellekBekleyen: Bekleyen | null = null;

function sirala<T>(is: () => Promise<T>): Promise<T> {
  const sonuc = sira.then(is);
  sira = sonuc.catch(() => undefined);
  return sonuc;
}

export function hataMesaji(hata: unknown): string {
  return hata && typeof hata === "object" && "message" in hata
    ? String(hata.message) : "İşlem doğrulanamadı. Sayfayı yenileyip kontrol edin.";
}

// Para girişinde boş, negatif, NaN/Infinity ve ikiden fazla ondalığı reddeder.
export function kurus(deger: string | number): number {
  const metin = String(deger).trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(metin)) throw new Error("Geçerli tutar girin; en fazla iki ondalık basamak kullanın.");
  const sonuc = Math.round(Number(metin) * 100);
  if (!Number.isSafeInteger(sonuc) || sonuc > 999999999999) throw new Error("Tutar sınırı aşıldı.");
  return sonuc;
}
export function tutarMetni(deger: string | number): string {
  return (kurus(deger) / 100).toFixed(2);
}

// Önbellek hiçbir zaman buluta otomatik aktarılmaz. Disk doluluğu, başarılı
// bir sunucu işlemini başarısızmış gibi gösterip tekrar kaydettirmemelidir.
export function onbellekYaz(anahtar: string, deger: unknown) {
  try {
    localStorage.setItem(anahtar, typeof deger === "string" ? deger : JSON.stringify(deger));
    window.dispatchEvent(new Event("storage"));
  } catch { /* Bulut asıl kaynaktır. */ }
}

async function kullaniciId() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.user.id) throw new Error("Oturum açmanız gerekiyor.");
  return data.session.user.id;
}

function bekleyeniOku(): Bekleyen | null {
  if (bellekBekleyen) return bellekBekleyen;
  const ham = sessionStorage.getItem(BEKLEYEN);
  if (!ham) return null;
  const veri = JSON.parse(ham) as Bekleyen;
  if (!veri.id || !veri.kullanici || !veri.tur || !veri.veri) throw new Error("Bekleyen işlem okunamadı. Yeni kayıt girmeden destek isteyin.");
  return veri;
}

function bekleyeniKaldir() {
  // Yazma engellense bile aynı sekmede başarılı işlemi yeniden göndermeyiz.
  bellekBekleyen = null;
  try { sessionStorage.removeItem(BEKLEYEN); } catch { /* Tekrar okuma aynı UUID ile güvenlidir. */ }
}

async function gonder(istek: Bekleyen): Promise<IslemSonucu> {
  if (istek.kullanici !== await kullaniciId()) throw new Error("Bekleyen işlem farklı oturuma ait. Önce o hesapla giriş yapın.");
  const { data, error } = await supabase.rpc("aristo_yaz_v2", {
    p_istek: istek.id, p_tur: istek.tur, p_veri: istek.veri,
  });
  if (error) {
    // Bu SQL hatalarında transaction kesin geri alınmıştır. Ağ hatasında
    // sonuç belirsizdir: UUID ve payload korunur, yeniden yüklemede sorgulanır.
    if (/^(22|23|40|42)/.test(error.code || "") || ["P0001", "PGRST202", "PGRST204"].includes(error.code)) bekleyeniKaldir();
    throw new Error(hataMesaji(error) + " İşlemi tekrar girmeden sayfayı yenileyin.");
  }
  if (!data || typeof data !== "object" || !data.kasa) {
    throw new Error("Sunucunun işlem sonucu doğrulanamadı. Sayfayı yenileyin; yeni kayıt girmeyin.");
  }
  bekleyeniKaldir();
  onbellekYaz("aristo-kasa", String(data.kasa.tutar));
  return data as IslemSonucu;
}

export function bekleyenIslemiTamamla(): Promise<IslemSonucu | null> {
  return sirala(async () => {
    const istek = bekleyeniOku();
    return istek ? gonder(istek) : null;
  });
}

export function aristoYaz(tur: IslemTuru, veri: Veri): Promise<IslemSonucu> {
  // Çağrıldığı anda dondur; kuyruktayken form değişse bile onay değişmez.
  const kopya = JSON.parse(JSON.stringify(veri)) as Veri;
  return sirala(async () => {
    const onceki = bekleyeniOku();
    if (onceki) {
      if (onceki.tur !== tur || JSON.stringify(onceki.veri) !== JSON.stringify(kopya)) {
        throw new Error("Önceki işlemin sonucu bekleniyor. Yeni işlem girmeden sayfayı yenileyin.");
      }
      return gonder(onceki);
    }
    const istek: Bekleyen = { id: crypto.randomUUID(), kullanici: await kullaniciId(), tur, veri: kopya };
    // Dayanıklı istek kimliği yazılamıyorsa sunucuya hiçbir şey gönderme.
    sessionStorage.setItem(BEKLEYEN, JSON.stringify(istek));
    bellekBekleyen = istek;
    return gonder(istek);
  });
}

export async function tumKayitlariOku(tablo: string, kolonlar = "*"): Promise<Veri[]> {
  const sonuc: Veri[] = [];
  // 500: Supabase'in varsayılan 1000 satır sınırının altında, sabit sıralı.
  for (let baslangic = 0; ; baslangic += 500) {
    const { data, error } = await supabase.from(tablo).select(kolonlar)
      .order("id", { ascending: true }).range(baslangic, baslangic + 499);
    if (error) throw error;
    const sayfa = (data || []) as unknown as Veri[];
    sonuc.push(...sayfa);
    if (sayfa.length < 500) return sonuc;
  }
}

// Yalnızca değişen masa yazılır; bir isteğin cevabı gelmeden sonraki sürüm
// gönderilmez. Sunucu 40001 döndürürse taslak korunur ve otomatik tekrar durur.
export class SurumluKuyruk<T extends { id: string; surum: number }> {
  private bekleyen = new Map<string, T>();
  private surumler = new Map<string, number>();
  private calisan: Promise<void> | null = null;
  private hata: unknown = null;
  constructor(
    private gonder: (kayit: T) => Promise<T>,
    private kaydedildi: (gonderilen: T, sunucu: T, dahaYeniTaslakVar: boolean) => void,
  ) {}
  baslat(kayitlar: T[]) { kayitlar.forEach(k => this.surumler.set(k.id, k.surum)); }
  ekle(kayit: T) { this.bekleyen.set(kayit.id, kayit); }
  surum(id: string) { return this.surumler.get(id) ?? 0; }
  onayla(kayit: T) { this.surumler.set(kayit.id, kayit.surum); }
  get kirli() { return this.bekleyen.size > 0 || !!this.calisan; }
  kaydet(): Promise<void> {
    if (this.hata) return Promise.reject(this.hata);
    if (this.calisan) return this.calisan;
    this.calisan = this.bosalt().catch(h => { this.hata = h; throw h; }).finally(() => { this.calisan = null; });
    return this.calisan;
  }
  private async bosalt() {
    while (this.bekleyen.size) {
      const kayit = this.bekleyen.values().next().value!;
      const sonuc = await this.gonder({ ...kayit, surum: this.surum(kayit.id) });
      this.surumler.set(kayit.id, sonuc.surum);
      const dahaYeni = this.bekleyen.get(kayit.id) !== kayit;
      if (!dahaYeni) this.bekleyen.delete(kayit.id);
      this.kaydedildi(kayit, sonuc, dahaYeni);
    }
  }
}
