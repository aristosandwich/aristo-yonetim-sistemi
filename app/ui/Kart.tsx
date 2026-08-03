type KartProps = {
  baslik: string;
  deger: string;
  aciklama?: string;
  renk?: string;
};

export default function Kart({
  baslik,
  deger,
  aciklama,
  renk = "#1f2937",
}: KartProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 5px 18px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ marginBottom: "8px" }}>{baslik}</div>

      <h2
        style={{
          margin: "0 0 8px",
          color: renk,
        }}
      >
        {deger}
      </h2>

      {aciklama && (
        <div
          style={{
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          {aciklama}
        </div>
      )}
    </div>
  );
}