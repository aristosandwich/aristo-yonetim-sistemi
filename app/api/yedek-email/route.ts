import { createClient } from "@supabase/supabase-js";

const YEDEK_ALICISI = "aristosandwichsaladbar@gmail.com";
const MAKSIMUM_BOYUT = 10 * 1024 * 1024;

type YedekGovdesi = {
  uygulama?: unknown;
  surum?: unknown;
  olusturmaZamani?: unknown;
  kayitSayisi?: unknown;
  tablolar?: unknown;
};

function dosyaZamani(tarihMetni: string) {
  const tarih = new Date(tarihMetni);

  if (Number.isNaN(tarih.getTime())) {
    return "tarihsiz";
  }

  const parca = (sayi: number) => String(sayi).padStart(2, "0");

  return `${tarih.getFullYear()}-${parca(tarih.getMonth() + 1)}-${parca(
    tarih.getDate()
  )}_${parca(tarih.getHours())}-${parca(tarih.getMinutes())}`;
}

export async function POST(istek: Request) {
  try {
    const yetki = istek.headers.get("authorization");
    const erisimAnahtari = yetki?.startsWith("Bearer ")
      ? yetki.slice(7)
      : "";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const resendAnahtari = process.env.RESEND_API_KEY;
    const gonderen =
      process.env.RESEND_FROM_EMAIL || "Aristo Yedek <onboarding@resend.dev>";

    if (!supabaseUrl || !supabaseKey || !resendAnahtari) {
      return Response.json(
        { hata: "E-posta servisi henüz kurulmamış." },
        { status: 503 }
      );
    }

    if (!erisimAnahtari) {
      return Response.json({ hata: "Oturum bulunamadı." }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${erisimAnahtari}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: kullanici, error: kullaniciHatasi } =
      await supabase.auth.getUser(erisimAnahtari);

    if (kullaniciHatasi || !kullanici.user) {
      return Response.json({ hata: "Oturum doğrulanamadı." }, { status: 401 });
    }

    const { data: yoneticiMi, error: yetkiHatasi } = await supabase.rpc(
      "aristo_yonetici_mi"
    );

    if (yetkiHatasi || yoneticiMi !== true) {
      return Response.json(
        { hata: "Yedek gönderme yetkisi bulunamadı." },
        { status: 403 }
      );
    }

    const yedek = (await istek.json()) as YedekGovdesi;

    if (
      yedek.uygulama !== "Aristo Yönetim" ||
      typeof yedek.surum !== "string" ||
      typeof yedek.olusturmaZamani !== "string" ||
      typeof yedek.kayitSayisi !== "number" ||
      !yedek.tablolar ||
      typeof yedek.tablolar !== "object"
    ) {
      return Response.json({ hata: "Yedek yapısı geçersiz." }, { status: 400 });
    }

    const yedekMetni = JSON.stringify(yedek, null, 2);
    const yedekBoyutu = Buffer.byteLength(yedekMetni, "utf8");

    if (yedekBoyutu > MAKSIMUM_BOYUT) {
      return Response.json(
        { hata: "Yedek e-posta için çok büyük." },
        { status: 413 }
      );
    }

    const dosyaAdi = `aristo-yedek_${dosyaZamani(
      yedek.olusturmaZamani
    )}.json`;

    const resendYaniti = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendAnahtari}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: gonderen,
        to: [YEDEK_ALICISI],
        subject: `Aristo haftalık yedeği — ${dosyaZamani(
          yedek.olusturmaZamani
        )}`,
        html: `<p>Aristo Yönetim Sistemi tam yedeği ektedir.</p><p><strong>Kayıt sayısı:</strong> ${yedek.kayitSayisi}</p><p>Son dört haftalık e-postayı saklayın.</p>`,
        attachments: [
          {
            filename: dosyaAdi,
            content: Buffer.from(yedekMetni, "utf8").toString("base64"),
          },
        ],
      }),
    });

    if (!resendYaniti.ok) {
      console.error("Resend yedek gönderme hatası:", await resendYaniti.text());
      return Response.json(
        { hata: "Yedek bilgisayara indi ancak e-posta gönderilemedi." },
        { status: 502 }
      );
    }

    return Response.json({ basarili: true });
  } catch (hata) {
    console.error("Yedek e-posta hatası:", hata);
    return Response.json(
      { hata: "Yedek bilgisayara indi ancak e-posta gönderilemedi." },
      { status: 500 }
    );
  }
}
