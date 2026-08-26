"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

const GIRIS_SAYFASI = "/giris";

export default function AuthGuard({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [kontrolEdiliyor, setKontrolEdiliyor] =
    useState(true);
  const [oturumVar, setOturumVar] = useState(false);

  useEffect(() => {
    let aktif = true;

    function yonlendir(girisYapildi: boolean) {
      if (girisYapildi && pathname === GIRIS_SAYFASI) {
        window.location.replace("/");
        return;
      }

      if (!girisYapildi && pathname !== GIRIS_SAYFASI) {
        window.location.replace(GIRIS_SAYFASI);
      }
    }

    async function oturumuKontrolEt() {
      const { data, error } = await supabase.auth.getSession();

      if (!aktif) return;

      if (error) {
        console.error("Oturum kontrol edilemedi:", error);
      }

      const girisYapildi = Boolean(data.session);
      setOturumVar(girisYapildi);
      setKontrolEdiliyor(false);
      yonlendir(girisYapildi);
    }

    void oturumuKontrolEt();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_olay, session) => {
      if (!aktif) return;

      const girisYapildi = Boolean(session);
      setOturumVar(girisYapildi);
      setKontrolEdiliyor(false);
      yonlendir(girisYapildi);
    });

    return () => {
      aktif = false;
      subscription.unsubscribe();
    };
  }, [pathname]);

  if (pathname === GIRIS_SAYFASI) {
    return children;
  }

  if (kontrolEdiliyor || !oturumVar) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f4f7f5",
          padding: "24px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 12px 30px rgba(0,0,0,.08)",
            color: "#174d38",
            fontWeight: 800,
          }}
        >
          Oturum kontrol ediliyor…
        </div>
      </main>
    );
  }

  return children;
}