const elements = {
  boot: document.querySelector("#boot"),
  app: document.querySelector("#app"),
  bootBar: document.querySelector("#bootBar"),
  bootPct: document.querySelector("#bootPct"),
  bootText: document.querySelector("#bootText"),
  firmware: document.querySelector("#firmware"),
  cacheState: document.querySelector("#cacheState"),
  cachePercent: document.querySelector("#cachePercent"),
  versionState: document.querySelector("#versionState"),
  onlineState: document.querySelector("#onlineState"),
  paths: document.querySelector("#paths"),
  log: document.querySelector("#log"),
  toast: document.querySelector("#toast"),
  modal: document.querySelector("#modal"),
  modalBox: document.querySelector(".modal-box"),
  modalTitle: document.querySelector("#modalTitle"),
  modalBody: document.querySelector("#modalBody"),
  closeModal: document.querySelector("#closeModal"),
  audioStart: document.querySelector("#audioStart"),
  music: document.querySelector("#music"),
  soundBtn: document.querySelector("#soundBtn"),
};

let toastTimer = 0;
let previousFocus = null;
const MAX_LOG_ENTRIES = 200;

export function $(selector) {
  return document.querySelector(selector);
}

export function setBootProgress(percent, text) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  elements.bootBar.style.width = `${value}%`;
  elements.bootPct.textContent = `${value}%`;
  if (text) elements.bootText.textContent = text;
}

export function finishBoot() {
  elements.app.classList.remove("hidden");
  window.setTimeout(() => elements.boot.classList.add("hidden"), 300);
}

export function setFirmware(value) {
  elements.firmware.textContent = value || "غير محدد";
}

export function setCacheStatus(cached, total) {
  const percent = total ? Math.round((cached / total) * 100) : 0;
  elements.cacheState.textContent = `الكاش: ${cached}/${total} ملف`;
  elements.cachePercent.textContent = `${percent}%`;
}

export function setVersion(version) {
  elements.versionState.textContent = `الإصدار: ${version || "غير معروف"}`;
}

export function setOnlineState() {
  const update = () => {
    elements.onlineState.textContent = navigator.onLine ? "متصل" : "جاهز Offline";
    elements.onlineState.classList.toggle("ok", navigator.onLine);
  };
  update();
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
}

export function log(message, type = "") {
  const entry = document.createElement("div");
  entry.className = type;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  elements.log.appendChild(entry);

  while (elements.log.children.length > MAX_LOG_ENTRIES) {
    elements.log.firstElementChild.remove();
  }

  elements.log.scrollTop = elements.log.scrollHeight;
}

export function clearLog() {
  elements.log.replaceChildren();
}

export function toast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.remove("hidden");
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.add("hidden");
  }, 2400);
}

export function openModal(title, html) {
  previousFocus = document.activeElement;
  elements.modalTitle.textContent = title;
  elements.modalBody.innerHTML = html;
  elements.modal.classList.remove("hidden");
  elements.modalBox.focus();
}

export function closeModal() {
  elements.modal.classList.add("hidden");
  elements.modalBody.replaceChildren();
  if (previousFocus && typeof previousFocus.focus === "function") {
    previousFocus.focus();
  }
}

export function setupModal() {
  elements.closeModal.addEventListener("click", closeModal);
  elements.modal.addEventListener("click", (event) => {
    if (event.target === elements.modal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.modal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

export function renderShop(shop) {
  document.querySelectorAll("[data-shop-name]").forEach((node) => {
    node.textContent = shop.name;
  });
  document.querySelectorAll("[data-shop-full-name]").forEach((node) => {
    node.textContent = `${shop.name} — ${shop.englishName}`;
  });
  document.querySelectorAll("[data-shop-address]").forEach((node) => {
    node.textContent = shop.address;
  });
  document.querySelectorAll("[data-shop-phone]").forEach((node) => {
    node.textContent = shop.phone;
  });

  const whatsapp = document.querySelector("#whatsappLink");
  whatsapp.href = `https://wa.me/${shop.whatsapp}`;
}

export function renderPaths(paths, onOpen, onDefault) {
  elements.paths.replaceChildren();

  for (const item of paths) {
    const row = document.createElement("div");
    row.className = "row";

    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.label;
    const description = document.createElement("small");
    description.textContent = item.description;
    content.append(title, description);

    const actions = document.createElement("div");
    actions.className = "path-actions";

    const open = document.createElement("button");
    open.className = "btn primary";
    open.type = "button";
    open.textContent = "فتح المسار";
    open.addEventListener("click", () => onOpen(item));

    const setDefault = document.createElement("button");
    setDefault.className = "btn";
    setDefault.type = "button";
    setDefault.textContent = "تثبيت كافتراضي";
    setDefault.addEventListener("click", () => onDefault(item));

    actions.append(open, setDefault);
    row.append(content, actions);
    elements.paths.append(row);
  }
}

export function renderSettings(settings, onSound, onAuto) {
  openModal("الإعدادات", `
    <div class="setting">
      <div>
        <b>تشغيل الموسيقى</b>
        <small>التشغيل عند فتح الواجهة إذا سمح المتصفح بذلك.</small>
      </div>
      <button class="switch ${settings.sound ? "on" : ""}" id="swSound"
        type="button" role="switch" aria-checked="${settings.sound}">
        <i></i>
      </button>
    </div>
    <div class="setting">
      <div>
        <b>التشغيل التلقائي</b>
        <small>الدخول فورًا للمسار الافتراضي عند الفتح.</small>
      </div>
      <button class="switch ${settings.autoLaunch ? "on" : ""}" id="swAuto"
        type="button" role="switch" aria-checked="${settings.autoLaunch}">
        <i></i>
      </button>
    </div>
    <div class="setting">
      <div>
        <b>المسار الافتراضي</b>
        <small>${escapeHtml(settings.defaultPath || "غير محدد")}</small>
      </div>
    </div>
  `);

  document.querySelector("#swSound").addEventListener("click", onSound);
  document.querySelector("#swAuto").addEventListener("click", onAuto);
}

export function renderFirmwarePicker(firmwares, selected, onSelect, onSearch) {
  const rows = firmwares.map((version) => `
    <button class="row fw-opt" type="button" data-fw="${escapeHtml(version)}"
      style="width:100%; text-align:right; margin-bottom:8px;">
      <strong>${escapeHtml(version)}</strong>
      <span class="pill">${version === selected ? "محدد" : "اختيار"}</span>
    </button>
  `).join("");

  openModal("اختيار Firmware", `
    <input type="search" id="fwSearch" placeholder="ابحث عن رقم الإصدار..."
      aria-label="البحث عن Firmware" autocomplete="off">
    <div id="fwList">${rows}</div>
  `);

  document.querySelectorAll("[data-fw]").forEach((button) => {
    button.addEventListener("click", () => onSelect(button.dataset.fw));
  });

  const search = document.querySelector("#fwSearch");
  search.addEventListener("input", () => onSearch(search.value));
  search.focus();
}

export function filterFirmware(query) {
  const value = query.trim();
  document.querySelectorAll(".fw-opt").forEach((button) => {
    button.hidden = value !== "" && !button.dataset.fw.includes(value);
  });
}

export function showAudioButton(show) {
  elements.audioStart.classList.toggle("hidden", !show);
}

export function setSoundButton(enabled) {
  elements.soundBtn.textContent = enabled ? "الصوت: تشغيل" : "الصوت: إيقاف";
  elements.soundBtn.setAttribute("aria-pressed", String(enabled));
}

export function getElements() {
  return elements;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
