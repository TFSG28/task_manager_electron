"use strict";

// Preload (mundo aislado): expone `window.desktop` a la app.
//
// Las NOTIFICACIONES nativas del desktop las sirve el Service Worker (Web Push)
// como único camino, igual que en el browser — ver front/public/sw.js. Antes
// había aquí un shim inyectado en el main world que escuchaba `kova:realtime`
// (SSE) y mostraba un toast nativo ADEMÁS del push, lo que duplicaba cada
// notificación. Se retiró: una sola fuente, sin duplicados.
//
// `notify` se mantiene porque lo usa el updater (avisos de actualización), no
// las notificaciones de negocio.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
    platform: process.platform,
    isDesktop: true,
    // Notificación nativa directa (usada por el updater; las de negocio van por push).
    notify: (payload) => ipcRenderer.send("notify", payload),
    // Copia texto al portapapeles vía main process (navigator.clipboard no es
    // fiable en Electron). No-op-safe: si el main no responde, no rompe.
    copyText: (text) => ipcRenderer.send("clipboard:write", text),
    // Ventana flotante del cronómetro (siempre encima). El estado se sincroniza
    // por BroadcastChannel, no por aquí: esto solo abre/cierra/arrastra.
    openTimerWidget: () => ipcRenderer.send("timer-widget:open"),
    closeTimerWidget: () => ipcRenderer.send("timer-widget:close"),
    setTimerWidgetExpanded: (expanded) => ipcRenderer.send("timer-widget:expand", expanded),
    moveTimerWidget: (dx, dy) => ipcRenderer.send("timer-widget:move", { dx, dy }),
});
