"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Giris() {
  const router = useRouter();

  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");

  function girisYap() {
    if (sifre === "1234") {
      localStorage.setItem("aristo-giris", "tamam");
      router.push("/");
      return;
    }

    setHata("Şifre yanlış.");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f4f7f5",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "18px",
          padding: "28px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1>🔒 Aristo Giriş</h1>

        <p>Yönetim sistemine giriş yap.</p>

        <input
          type="password"
          placeholder="Şifre"
          value={sifre}
          onChange={(event) => {
            setSifre(event.target.value);
            setHata("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              girisYap();
            }
          }}
          style={{
            width: "100%",
            padding: "12px",
            boxSizing: "border-box",
            marginBottom: "14px",
          }}
        />

        <button
          onClick={girisYap}
          style={{
            width: "100%",
            padding: "12px",
            background: "#174d38",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Giriş Yap
        </button>

        {hata && (
          <p style={{ color: "#b91c1c", marginBottom: 0 }}>
            {hata}
          </p>
        )}

        <p
          style={{
            marginTop: "18px",
            marginBottom: 0,
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          Geçici şifre: 1234
        </p>
      </div>
    </main>
  );
}