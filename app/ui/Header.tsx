"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const TAM_YAZI = "Sandwich & Salad Bar";

export default function Header() {
  const pathname = usePathname();

  const [yazi, setYazi] = useState("");
  const [siliniyor, setSiliniyor] = useState(false);

  useEffect(() => {
    let beklemeSuresi = siliniyor ? 14 : 90;

    if (!siliniyor && yazi === TAM_YAZI) {
      beklemeSuresi = 1800;
    }

    if (siliniyor && yazi === "") {
      beklemeSuresi = 450;
    }

    const zamanlayici = window.setTimeout(() => {
      if (!siliniyor) {
        if (yazi.length < TAM_YAZI.length) {
          setYazi(
            TAM_YAZI.slice(0, yazi.length + 1)
          );
        } else {
          setSiliniyor(true);
        }
      } else if (yazi.length > 0) {
        setYazi(
          TAM_YAZI.slice(
            0,
            Math.max(yazi.length - 4, 0)
          )
        );
      } else {
        setSiliniyor(false);
      }
    }, beklemeSuresi);

    return () => {
      window.clearTimeout(zamanlayici);
    };
  }, [yazi, siliniyor]);

  return (
    <header
      className="aristo-header"
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#ffffff",
        borderRadius: "24px",
        padding: "24px 30px",
        marginBottom: "22px",
        display: "flex",
        alignItems: "center",
        gap: "22px",
        flexWrap: "wrap",
        border: "1px solid #e7e7e7",
        boxShadow:
          "0 11px 30px rgba(0,0,0,.085)",
      }}
    >
      <style jsx>{`
        @keyframes imlecYanipSonme {
          0%,
          45% {
            opacity: 1;
          }

          46%,
          100% {
            opacity: 0;
          }
        }

        .aristo-imlec {
          animation: imlecYanipSonme 0.8s
            steps(1) infinite;
        }

        .aristo-ana-sayfa {
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .aristo-ana-sayfa:hover {
          transform: translateY(-2px);
          box-shadow:
            0 9px 22px rgba(246, 201, 69, 0.4) !important;
        }

        @media (max-width: 700px) {
          .aristo-header {
            padding: 20px !important;
            gap: 16px !important;
          }

          .aristo-logo {
            width: 124px !important;
            height: 124px !important;
          }

          .aristo-marka-alani {
            min-width: 190px !important;
          }

          .aristo-ana-sayfa {
            width: 100%;
          }
        }

        @media (max-width: 430px) {
          .aristo-logo {
            width: 104px !important;
            height: 104px !important;
          }
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "#111111",
        }}
      />

      <Image
        className="aristo-logo"
        src="/aristo-logo.png"
        alt="Aristo"
        width={144}
        height={144}
        priority
        style={{
          width: "144px",
          height: "144px",
          objectFit: "contain",
          borderRadius: "50%",
          background: "#ffffff",
          padding: "2px",
          boxShadow:
            "0 8px 19px rgba(0,0,0,.12)",
          flexShrink: 0,
        }}
      />

      <div
        className="aristo-marka-alani"
        style={{
          flex: 1,
          minWidth: "255px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            color: "#111111",
            fontSize:
              "clamp(40px, 4.8vw, 54px)",
            fontWeight: 900,
            letterSpacing: "-1.4px",
            lineHeight: 1,
          }}
        >
          ARISTO
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: "10px",
            minHeight: "36px",
            color: "#111111",
            fontSize:
              "clamp(22px, 2.7vw, 29px)",
            fontWeight: 800,
            letterSpacing: "-0.15px",
            whiteSpace: "nowrap",
          }}
        >
          <span>{yazi}</span>

          <span
            className="aristo-imlec"
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: "2px",
              height: "29px",
              marginLeft: "4px",
              borderRadius: "99px",
              background: "#111111",
            }}
          />
        </div>
      </div>

      {pathname !== "/" && (
        <Link
          className="aristo-ana-sayfa"
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50px",
            padding: "13px 19px",
            borderRadius: "14px",
            background: "#f6c945",
            color: "#3f3100",
            textDecoration: "none",
            fontWeight: 800,
            border: "1px solid #dbae17",
            boxShadow:
              "0 6px 16px rgba(246,201,69,.28)",
            whiteSpace: "nowrap",
          }}
        >
          🏠 Ana Sayfa
        </Link>
      )}
    </header>
  );
}