import { APP_CONFIG } from "./config.js";
import { state } from "./state.js";
import { persistFirmware } from "./storage.js";
import { closeModal, filterFirmware, log, openModal, renderFirmwarePicker, setFirmware, toast } from "./ui.js";

function parseFirmware(userAgent) {
  const match = userAgent.match(/(?:PlayStation\s*4|PS4)[\s\/]?([0-9]+\.[0-9]+)/i);
  return match?.[1] || "";
}

export function detectFirmware() {
  const userAgent = navigator.userAgent || "";
  const version = parseFirmware(userAgent);

  if (version) {
    try {
      persistFirmware(version);
    } catch (error) {
      log(error.message, "warn");
    }

    setFirmware(version);
    log(`تم الكشف التلقائي عن نظام PS4: ${version}`, "ok");
    toast(`تم الكشف التلقائي عن النظام: ${version}`);
    return version;
  }

  if (/PlayStation\s*4/i.test(userAgent)) {
    log("متصفح PS4 مكتشف، لكن رقم Firmware غير ظاهر في User-Agent.", "warn");
  } else {
    log("الصفحة تعمل خارج جهاز PS4.", "warn");
  }

  setFirmware(state.firmware || "غير معروف");
  toast("يمكنك تحديد الإصدار يدويًا من زر تحديد يدوي.");
  return "";
}

export function restoreFirmware() {
  setFirmware(state.firmware || "غير محدد");
}

export function chooseFirmware() {
  renderFirmwarePicker(
    APP_CONFIG.firmware,
    state.firmware,
    selectFirmware,
    filterFirmware,
  );
}

function selectFirmware(version) {
  try {
    persistFirmware(version);
    setFirmware(version);
    closeModal();
    log(`Firmware selected: ${version}`, "ok");
    toast(`تم تحديد الإصدار ${version}`);
  } catch (error) {
    log(error.message, "err");
    toast("تعذر حفظ الإصدار.");
  }
}

export function isSupportedPath(path) {
  return APP_CONFIG.paths.some((item) => item.path === path);
}
