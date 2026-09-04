const SW_MESSAGE = {
  CACHE_REFRESH: "CACHE_REFRESH",
  CLEAR_CACHE: "CLEAR_GENERAL_CACHE",
  GET_STATUS: "GET_CACHE_STATUS",
};

function hasServiceWorker() {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

// Return the active controller or null. Safe: does not read .controller if serviceWorker missing.
function getWorker() {
  if (!hasServiceWorker()) return null;
  return navigator.serviceWorker.controller || null;
}

// Wait up to `timeout` ms for a controller to appear (via controllerchange or ready).
function waitForController(timeout = 3000) {
  return new Promise((resolve) => {
    if (!hasServiceWorker()) return resolve(null);

    const existing = navigator.serviceWorker.controller || null;
    if (existing) return resolve(existing);

    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      resolve(navigator.serviceWorker.controller || null);
    };

    const onChange = () => finish();

    navigator.serviceWorker.addEventListener("controllerchange", onChange);

    // Also resolve when registration becomes ready (some browsers settle on ready)
    navigator.serviceWorker.ready
      .then(() => finish())
      .catch(() => { /* ignore */ });

    // Timeout fallback
    setTimeout(() => finish(), timeout);
  });
}

async function sendMessage(type) {
  return new Promise(async (resolve, reject) => {
    if (!hasServiceWorker()) {
      reject(new Error("Service Worker غير مدعوم في هذا المتصفح."));
      return;
    }

    let worker = getWorker();
    if (!worker) {
      // Wait briefly for the controller to appear (page may be controlled after registration)
      worker = await waitForController(3000);
    }

    if (!worker) {
      reject(new Error("Service Worker غير متصل حاليًا."));
      return;
    }

    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => {
      channel.port1.onmessage = null;
      reject(new Error("انتهت مهلة Service Worker."));
    }, 15000);

    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      resolve(event.data);
    };

    try {
      worker.postMessage({ type }, [channel.port2]);
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });
}

export async function registerServiceWorker(onUpdate) {
  if (!hasServiceWorker()) {
    throw new Error("Service Worker غير مدعوم في هذا المتصفح.");
  }

  const registration = await navigator.serviceWorker.register("./sw.js", {
    scope: "./",
    updateViaCache: "none",
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    onUpdate?.();
  });

  await navigator.serviceWorker.ready;
  return registration;
}

export async function refreshCache() {
  return sendMessage(SW_MESSAGE.CACHE_REFRESH);
}

export async function clearCache() {
  return sendMessage(SW_MESSAGE.CLEAR_CACHE);
}

export async function cacheStatus() {
  return sendMessage(SW_MESSAGE.GET_STATUS);
}
