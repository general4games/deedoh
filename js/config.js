export const APP_CONFIG = Object.freeze({
  storageKey: "general.settings",
  firmwareStorageKey: "general.fw",
  shop: Object.freeze({
    name: "الجنرال للألعاب الإلكترونية",
    englishName: "General Gaming Shop",
    address: "درنة — شارع الرفاعي",
    phone: "0918846443",
    whatsapp: "218918846443",
  }),
  firmware: Object.freeze([
    "5.05", "6.72", "7.02", "7.55", "8.00", "9.00", "9.60",
    "10.00", "10.01", "10.50", "10.70", "11.00", "11.02",
    "11.50", "12.00", "12.50", "13.00",
  ]),
  paths: Object.freeze([
    Object.freeze({
      id: "505-960",
      label: "5.05 — 9.60",
      path: "./505_960/",
      description: "المسار الخاص بإصدارات 5.05 إلى 9.60",
    }),
    Object.freeze({
      id: "1000-1102",
      label: "10.00 — 11.02",
      path: "./1000_1102/",
      description: "المسار الخاص بإصدارات 10.00 إلى 11.02",
    }),
    Object.freeze({
      id: "1150-1300",
      label: "11.50 — 13.00",
      path: "./1150-1300/",
      description: "المسار الخاص بإصدارات 11.50 إلى 13.00",
    }),
  ]),
});
