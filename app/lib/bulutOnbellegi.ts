// Eski tarayıcı verisini korur ama hiçbir koşulda buluta göndermez.
// Sadece okuma amaçlı bu kopyalar, yeni ekranların veri kaynağı değildir.
export function koruyarakOnbellekYaz(anahtar: string, veri: unknown) {
  try {
    const arsiv = anahtar + "-eski-kopya-v2";
    const eski = localStorage.getItem(anahtar);
    if (eski !== null && localStorage.getItem(arsiv) === null) {
      // Arşivlenemiyorsa eski kopyayı ezmeyelim. Bulut işlemi yine geçerlidir.
      localStorage.setItem(arsiv, eski);
    }
    localStorage.setItem(anahtar, JSON.stringify(veri));
    window.dispatchEvent(new Event("storage"));
  } catch {
    // Disk doluluğu / kapalı depolama, başarılı bulut kaydını başarısız yapmaz.
  }
}
