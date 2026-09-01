import { state } from "./state.js";
import { getElements, log, showAudioButton, setSoundButton } from "./ui.js";

let userGestureListenersInstalled = false;

export function initializeAudio() {
  const { music } = getElements();
  music.volume = 1;
  setSoundButton(state.settings.sound);
  if (state.settings.sound) {
    void startMusic();
  }
}

export async function startMusic() {
  const { music } = getElements();

  if (!state.settings.sound) {
    music.pause();
    return false;
  }

  try {
    await music.play();
    showAudioButton(false);
    log("Music started successfully", "ok");
    removeUserGestureListeners();
    return true;
  } catch {
    showAudioButton(true);
    installUserGestureListeners();
    log("Autoplay blocked: waiting for user interaction.", "warn");
    return false;
  }
}

export async function toggleMusic() {
  const { music } = getElements();

  if (music.paused) {
    state.settings.sound = true;
    const started = await startMusic();
    setSoundButton(state.settings.sound);
    return started;
  }

  music.pause();
  state.settings.sound = false;
  showAudioButton(false);
  setSoundButton(false);
  log("Music paused.", "ok");
  return true;
}

export async function playFromUserGesture() {
  state.settings.sound = true;
  const started = await startMusic();
  setSoundButton(state.settings.sound);
  return started;
}

function installUserGestureListeners() {
  if (userGestureListenersInstalled) return;

  userGestureListenersInstalled = true;
  const events = ["pointerdown", "keydown", "touchstart"];

  const handler = () => {
    void startMusic();
  };

  for (const eventName of events) {
    window.addEventListener(eventName, handler, { once: true, passive: true });
  }
}

function removeUserGestureListeners() {
  userGestureListenersInstalled = false;
}
