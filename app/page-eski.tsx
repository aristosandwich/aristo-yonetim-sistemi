export default function Home() {
  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>🥪 Aristo Yönetim Sistemi</h1>
      <p>Hoş geldin Özkan 👋</p>

      <hr />

      <h2>📊 Günlük Özet</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "15px",
        }}
      >
        <div style={{ border: "1px solid #ccc", borderRadius: "10px", padding: "15px" }}>
          <h3>💰 Bugünkü Satış</h3>
          <h2>₺0</h2>
        </div>

        <div style={{ border: "1px solid #ccc", borderRadius: "10px", padding: "15px" }}>
          <h3>💸 Bugünkü Gider</h3>
          <h2>₺0</h2>
        </div>

        <div style={{ border: "1px solid #ccc", borderRadius: "10px", padding: "15px" }}>
          <h3>📈 Günlük Net</h3>
          <h2>₺0</h2>
        </div>

        <div style={{ border: "1px solid #ccc", borderRadius: "10px", padding: "15px" }}>
          <h3>🏢 Cari Durum</h3>
          <p>Mudo Toptan</p>
          <p>Bakiye: ₺0</p>
        </div>
      </div>

      <hr />

      <h2>⚡ Hızlı İşlemler</h2>

      <button>🥪 Satış Gir</button>

      <br />
      <br />

      <button>💸 Gider Gir</button>

      <br />
      <br />

      <button>💳 Tahsilat Gir</button>

      <br />
      <br />

      <button>📊 Raporlar</button>
    </main>
  );
}
