import { APP_CONFIG } from "./config.js";

const DEFAULT_SETTINGS = Object.freeze({
  sound: true,
  autoLaunch: false,
  defaultPath: "",
});

export const state = {
  settings: { ...DEFAULT_SETTINGS },
  firmware: "",
  version: null,
  cache: {
    checked: false,
    cached: 0,
    total: 0,
    percent: 0,
  },
};

function normalizeSettings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    sound: typeof value.sound === "boolean" ? value.sound : DEFAULT_SETTINGS.sound,
    autoLaunch: typeof value.autoLaunch === "boolean" ? value.autoLaunch : DEFAULT_SETTINGS.autoLaunch,
    defaultPath: typeof value.defaultPath === "string" ? value.defaultPath : DEFAULT_SETTINGS.defaultPath,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(APP_CONFIG.storageKey);
    state.settings = normalizeSettings(raw ? JSON.parse(raw) : null);
  } catch {
    state.settings = { ...DEFAULT_SETTINGS };
  }

  try {
    const firmware = localStorage.getItem(APP_CONFIG.firmwareStorageKey);
    state.firmware = typeof firmware === "string" ? firmware : "";
  } catch {
    state.firmware = "";
  }
}

export function saveSettings() {
  try {
    localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(state.settings));
    return true;
  } catch {
    return false;
  }
}

export function saveFirmware(version) {
  try {
    localStorage.setItem(APP_CONFIG.firmwareStorageKey, version);
    state.firmware = version;
    return true;
  } catch {
    state.firmware = version;
    return false;
  }
}

export function resetState() {
  try {
    localStorage.removeItem(APP_CONFIG.storageKey);
    localStorage.removeItem(APP_CONFIG.firmwareStorageKey);
  } finally {
    state.settings = { ...DEFAULT_SETTINGS };
    state.firmware = "";
  }
}
