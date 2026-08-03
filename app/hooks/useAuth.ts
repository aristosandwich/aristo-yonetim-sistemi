"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [kontrolEdiliyor, setKontrolEdiliyor] = useState(true);

  useEffect(() => {
    const girisYapildi = localStorage.getItem("aristo-giris");

    if (pathname !== "/giris" && girisYapildi !== "tamam") {
      router.replace("/giris");
      return;
    }

    if (pathname === "/giris" && girisYapildi === "tamam") {
      router.replace("/");
      return;
    }

    setKontrolEdiliyor(false);
  }, [pathname, router]);

  return kontrolEdiliyor;
}