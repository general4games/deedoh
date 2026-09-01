const SW_MESSAGE = {
  CACHE_REFRESH: "CACHE_REFRESH",
  CLEAR_CACHE: "CLEAR_GENERAL_CACHE",
  GET_STATUS: "GET_CACHE_STATUS",
};

function getWorker() {
  return navigator.serviceWorker.controller || null;
}

function sendMessage(type) {
  return new Promise((resolve, reject) => {
    const worker = getWorker();

    if (!worker) {
      reject(new Error("Service Worker غير متصل حاليًا."));
      return;
    }

    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => {
      reject(new Error("انتهت مهلة Service Worker."));
    }, 15000);

    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      resolve(event.data);
    };

    worker.postMessage({ type }, [channel.port2]);
  });
}

export async function registerServiceWorker(onUpdate) {
  if (!("serviceWorker" in navigator)) {
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
