import { APP_CONFIG } from "./config.js";
import { state, saveSettings, saveFirmware, resetState } from "./state.js";

export function persistSettings() {
  if (!saveSettings()) {
    throw new Error("تعذر حفظ الإعدادات في التخزين المحلي.");
  }
}

export function persistFirmware(version) {
  if (!saveFirmware(version)) {
    throw new Error("تعذر حفظ Firmware في التخزين المحلي.");
  }
}

export function resetStorage() {
  resetState();
}

export function getStateSnapshot() {
  return {
    settings: { ...state.settings },
    firmware: state.firmware,
    storageKey: APP_CONFIG.storageKey,
  };
}
