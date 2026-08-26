"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Giris() {
  const router = useRouter();
  const [eposta, setEposta] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [girisYapiliyor, setGirisYapiliyor] =
    useState(false);

  async function girisYap(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const temizEposta = eposta.trim();

    if (!temizEposta || !sifre) {
      setHata("E-posta ve şifre alanlarını doldur.");
      return;
    }

    setHata("");
    setGirisYapiliyor(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: temizEposta,
      password: sifre,
    });

    if (error) {
      console.error("Giriş yapılamadı:", error);
      setHata("E-posta veya şifre hatalı.");
      setGirisYapiliyor(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "linear-gradient(145deg, #edf5f0 0%, #f8faf9 55%, #fff8dd 100%)",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderTop: "4px solid #111111",
          borderRadius: "24px",
          padding: "30px",
          boxShadow: "0 18px 45px rgba(0,0,0,.10)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            marginBottom: "26px",
          }}
        >
          <Image
            src="/aristo-logo.png"
            alt="Aristo"
            width={86}
            height={86}
            priority
            style={{
              width: "86px",
              height: "86px",
              objectFit: "contain",
              borderRadius: "50%",
              boxShadow: "0 7px 18px rgba(0,0,0,.12)",
            }}
          />

          <div>
            <h1
              style={{
                margin: 0,
                color: "#111111",
                fontSize: "34px",
                lineHeight: 1,
                fontWeight: 900,
              }}
            >
              ARISTO
            </h1>
            <p
              style={{
                margin: "8px 0 0",
                color: "#174d38",
                fontWeight: 800,
              }}
            >
              Yönetim Sistemi
            </p>
          </div>
        </div>

        <h2
          style={{
            margin: "0 0 8px",
            color: "#153f30",
            fontSize: "24px",
          }}
        >
          Giriş Yap
        </h2>

        <p
          style={{
            margin: "0 0 22px",
            color: "#6b7280",
            lineHeight: 1.5,
          }}
        >
          Yönetim paneline devam etmek için bilgilerini gir.
        </p>

        <form onSubmit={girisYap}>
          <label
            htmlFor="eposta"
            style={{
              display: "block",
              marginBottom: "7px",
              color: "#374151",
              fontWeight: 700,
            }}
          >
            E-posta
          </label>

          <input
            id="eposta"
            type="email"
            value={eposta}
            onChange={(e) => setEposta(e.target.value)}
            autoComplete="email"
            autoFocus
            disabled={girisYapiliyor}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "11px",
              background: "#ffffff",
              fontSize: "16px",
              marginBottom: "16px",
            }}
          />

          <label
            htmlFor="sifre"
            style={{
              display: "block",
              marginBottom: "7px",
              color: "#374151",
              fontWeight: 700,
            }}
          >
            Şifre
          </label>

          <input
            id="sifre"
            type="password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            autoComplete="current-password"
            disabled={girisYapiliyor}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "11px",
              background: "#ffffff",
              fontSize: "16px",
            }}
          />

          {hata && (
            <div
              role="alert"
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontWeight: 700,
              }}
            >
              {hata}
            </div>
          )}

          <button
            type="submit"
            disabled={girisYapiliyor}
            style={{
              width: "100%",
              minHeight: "50px",
              marginTop: "20px",
              border: "none",
              borderRadius: "12px",
              background: girisYapiliyor ? "#6b8b7d" : "#174d38",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 800,
              cursor: girisYapiliyor ? "wait" : "pointer",
              boxShadow: "0 8px 18px rgba(23,77,56,.22)",
            }}
          >
            {girisYapiliyor ? "Giriş yapılıyor…" : "🔐 Giriş Yap"}
          </button>
        </form>
      </section>
    </main>
  );
}