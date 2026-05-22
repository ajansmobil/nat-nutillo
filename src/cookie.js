
function checkCookie(name) {
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(name + "="));
}
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}
function showCookieNotice() {
  if (!checkCookie("cookieConsent")) {
    const banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.innerHTML = `
            <div>Bu web sitesi, 6698 sayılı KVKK ve GDPR kapsamında size daha iyi bir deneyim sunmak için çerezler kullanmaktadır.</div>
            <div class="cookie-banner-buttons">
                <button onclick="acceptCookies()" class="accept-btn">Kabul Et</button>
                <button onclick="showCookieDetails()" class="details-btn">Detaylı Bilgi</button>
            </div>
        `;
    document.body.appendChild(banner);
    const modal = document.createElement("div");
    modal.className = "cookie-modal";
    modal.innerHTML = `
            <h2>Çerez ve Gizlilik Politikası</h2>
            <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve Genel Veri Koruma Yönetmeliği (GDPR) uyarınca, web sitemizde aşağıdaki amaçlar için çerezler kullanılmaktadır:</p>
            <ul>
                <li><strong>Zorunlu Çerezler:</strong> Sitenin temel işlevlerini yerine getirebilmesi için kesinlikle gerekli olan çerezlerdir. Bu çerezler olmadan web sitesinin çalışması mümkün değildir.</li>
                <li><strong>Performans ve Analitik Çerezleri:</strong> Sitemizin performansını ölçmek ve iyileştirmek için kullanılır. Ziyaretçilerin siteyi nasıl kullandığı hakkında anonim istatistiksel veriler toplar.</li>
                <li><strong>İşlevsellik Çerezleri:</strong> Size daha gelişmiş ve kişiselleştirilmiş bir deneyim sunmak için kullanılır. Tercihlerinizi hatırlamak için kullanılır.</li>
                <li><strong>Hedefleme/Reklam Çerezleri:</strong> Size ve ilgi alanlarınıza uygun reklamlar göstermek için kullanılır.</li>
            </ul>
            <p>Çerezleri kabul etmek istemiyorsanız, tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz. Ancak bu durumda site işlevlerinin bir kısmı düzgün çalışmayabilir.</p>
            <p>Daha detaylı bilgi için Gizlilik Politikamızı inceleyebilirsiniz.</p>

            <div style="text-align: right; margin-top: 20px;">
                <button onclick="acceptCookies()" class="accept-btn" style="font-size: 16px;">Anladım ve Kabul Ediyorum</button>
            </div>
        `;
    document.body.appendChild(modal);
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    document.body.appendChild(overlay);
  }
}
function showCookieDetails() {
  document.querySelector(".cookie-modal").classList.add("active");
  document.querySelector(".modal-overlay").classList.add("active");
}
function acceptCookies() {
  setCookie("cookieConsent", "true", 365);
  document.querySelector(".cookie-banner")?.remove();
  document.querySelector(".cookie-modal")?.remove();
  document.querySelector(".modal-overlay")?.remove();
}
window.addEventListener("load", showCookieNotice);
