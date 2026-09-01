import { APP_CONFIG } from "./config.js";
import { state, loadState } from "./state.js";
import { persistSettings, resetStorage } from "./storage.js";
import {
  clearLog,
  closeModal,
  finishBoot,
  getElements,
  log,
  openModal,
  renderPaths,
  renderSettings,
  renderShop,
  setBootProgress,
  setCacheStatus,
  setFirmware,
  setOnlineState,
  setSoundButton,
  setVersion,
  showAudioButton,
  toast,
} from "./ui.js";
import { detectFirmware, isSupportedPath, chooseFirmware, restoreFirmware } from "./firmware.js";
import { initializeAudio, playFromUserGesture, toggleMusic, startMusic } from "./audio.js";
import { cacheStatus, clearCache, refreshCache, registerServiceWorker } from "./cache-manager.js";

async function loadVersion() {
  try {
    const response = await fetch("./version.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    state.version = await response.json();
    setVersion(state.version.version || "غير معروف");
    return state.version;
  } catch (error) {
    log(`تعذر تحميل version.json: ${error.message}`, "warn");
    setVersion("غير معروف");
    return null;
  }
}

async function updateCacheStatus() {
  try {
    const status = await cacheStatus();
    state.cache = status;
    setCacheStatus(status.cached, status.total);
  } catch (error) {
    log(`تعذر قراءة حالة الكاش: ${error.message}`, "warn");
  }
}

async function handleRefreshCache() {
  const button = document.querySelector("#cacheBtn");
  button.disabled = true;
  button.textContent = "جارٍ التحديث...";

  try {
    const result = await refreshCache();
    state.cache = result;
    setCacheStatus(result.cached, result.total);
    log(`تم تحديث الكاش: ${result.cached}/${result.total}`, "ok");
    toast("تم تحديث الكاش بنجاح.");
  } catch (error) {
    log(`Cache refresh error: ${error.message}`, "err");
    toast("تعذر تحديث الكاش.");
  } finally {
    button.disabled = false;
    button.textContent = "تحديث الكاش";
  }
}

async function handleClearCache() {
  if (!window.confirm("مسح كاش التطبيق الخاص بهذا المشروع؟")) return;

  try {
    await clearCache();
    state.cache = { cached: 0, total: state.cache.total, percent: 0 };
    setCacheStatus(0, state.cache.total);
    log("تم مسح كاش التطبيق.", "warn");
    toast("تم مسح الكاش.");
  } catch (error) {
    log(`Cache clear error: ${error.message}`, "err");
    toast("تعذر مسح الكاش.");
  }
}

function setDefaultPath(item) {
  state.settings.defaultPath = item.path;

  try {
    persistSettings();
    log(`Default path set to: ${item.path}`, "ok");
    toast(`تم تعيين ${item.label} كمسار افتراضي.`);
  } catch (error) {
    log(error.message, "err");
    toast("تعذر حفظ المسار الافتراضي.");
  }
}

function openPath(item) {
  if (!isSupportedPath(item.path)) {
    log(`محاولة فتح مسار غير مسجل: ${item.path}`, "err");
    toast("المسار غير مسجل في إعدادات التطبيق.");
    return;
  }

  window.location.assign(item.path);
}

function showSettings() {
  renderSettings(state.settings, async () => {
    state.settings.sound = !state.settings.sound;

    try {
      persistSettings();
    } catch (error) {
      log(error.message, "err");
    }

    if (state.settings.sound) {
      await startMusic();
    } else {
      getElements().music.pause();
      showAudioButton(false);
    }

    setSoundButton(state.settings.sound);
    showSettings();
  }, () => {
    if (!state.settings.defaultPath && !state.settings.autoLaunch) {
      toast("اختر مسارًا افتراضيًا أولًا.");
      return;
    }

    state.settings.autoLaunch = !state.settings.autoLaunch;

    try {
      persistSettings();
    } catch (error) {
      log(error.message, "err");
    }

    showSettings();
    toast(state.settings.autoLaunch ? "تم تفعيل التوجيه التلقائي." : "تم إيقاف التوجيه التلقائي.");
  });
}

function showAbout() {
  const { shop } = APP_CONFIG;
  openModal("حول المحل", `
    <div class="modal-text">
      <p><b>${escapeHtml(shop.name)} / ${escapeHtml(shop.englishName)}</b></p>
      <p><b>العنوان:</b> ${escapeHtml(shop.address)}</p>
      <p><b>رقم التواصل / واتساب:</b>
        <a href="https://wa.me/${escapeHtml(shop.whatsapp)}"
           target="_blank" rel="noopener noreferrer">${escapeHtml(shop.phone)}</a>
      </p>
      <p>واجهة مخصصة للعمل المحلي بدون اعتماد على الاتصال المستمر بالإنترنت.</p>
      <p class="modal-note">
        ملاحظة: أي تعديل على جهاز العميل قد يؤثر على خدماته أو ضمانه الأصلي.
        تأكد من إبلاغ العميل قبل البدء.
      </p>
    </div>
  `);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setupEvents() {
  document.querySelector("#detectBtn").addEventListener("click", detectFirmware);
  document.querySelector("#chooseBtn").addEventListener("click", chooseFirmware);
  document.querySelector("#cacheBtn").addEventListener("click", handleRefreshCache);
  document.querySelector("#clearCacheBtn").addEventListener("click", handleClearCache);
  document.querySelector("#reloadBtn").addEventListener("click", () => window.location.reload());
  document.querySelector("#resetBtn").addEventListener("click", () => {
    if (!window.confirm("إعادة ضبط جميع الإعدادات؟ سيتم حذف Firmware والمسار الافتراضي.")) return;
    resetStorage();
    window.location.reload();
  });
  document.querySelector("#clearLog").addEventListener("click", clearLog);
  document.querySelector("#settingsBtn").addEventListener("click", showSettings);
  document.querySelector("#aboutBtn").addEventListener("click", showAbout);
  document.querySelector("#soundBtn").addEventListener("click", async () => {
    await toggleMusic();
    try {
      persistSettings();
    } catch (error) {
      log(error.message, "err");
    }
  });
  document.querySelector("#audioStart").addEventListener("click", async () => {
    if (await playFromUserGesture()) {
      try {
        persistSettings();
      } catch (error) {
        log(error.message, "err");
      }
      showAudioButton(false);
    }
  });

  window.addEventListener("offline", () => log("تم الانتقال إلى وضع Offline.", "warn"));
  window.addEventListener("online", () => log("تم اكتشاف اتصال بالشبكة.", "ok"));
}

async function boot() {
  loadState();
  renderShop(APP_CONFIG.shop);
  setOnlineState();
  restoreFirmware();
  setupEvents();
  getElements().modal.addEventListener("keydown", trapModalFocus);
  setupFallbackImages();

  setBootProgress(10, "تحميل الإعدادات...");
  await delay(60);

  setBootProgress(25, "فحص الإصدار...");
  await loadVersion();

  setBootProgress(45, "تشغيل Service Worker...");
  try {
    await registerServiceWorker(() => {
      log("تم تحديث Service Worker.", "ok");
    });
    log("Service Worker registered.", "ok");
  } catch (error) {
    log(error.message, "warn");
  }

  setBootProgress(65, "فحص الكاش...");
  await updateCacheStatus();

  setBootProgress(80, "تهيئة الواجهة...");
  renderPaths(APP_CONFIG.paths, openPath, setDefaultPath);

  const detected = detectFirmware();
  if (!detected) restoreFirmware();

  setBootProgress(90, "تهيئة الصوت...");
  initializeAudio();

  setBootProgress(100, "النظام جاهز للعمل Offline");
  await delay(100);

  if (state.settings.autoLaunch && state.settings.defaultPath) {
    getElements().bootText.textContent = "تحويل تلقائي للمسار الافتراضي...";
    window.setTimeout(() => window.location.assign(state.settings.defaultPath), 700);
    return;
  }

  finishBoot();
}

function trapModalFocus(event) {
  if (event.key !== "Tab") return;

  const modal = document.querySelector("#modal:not(.hidden) .modal-box");
  if (!modal) return;

  const focusable = [...modal.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
  )];

  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function setupFallbackImages() {
  document.querySelectorAll("img[data-fallback]").forEach((image) => {
    image.addEventListener("error", () => {
      image.style.display = "none";
      const fallback = image.nextElementSibling;
      if (fallback?.classList.contains("store-logo-fallback")) {
        fallback.style.display = "block";
      }
    }, { once: true });
  });
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

boot().catch((error) => {
  log(`Boot error: ${error.message}`, "err");
  getElements().bootText.textContent = "حدث خطأ أثناء التهيئة.";
  toast("تعذر تشغيل بعض مكونات التطبيق.");
});
