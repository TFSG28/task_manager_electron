"use strict";

const { ipcMain } = require("electron");

// IPC preload → main. Canales:
//   • notify                → toast nativo (window.desktop.notify)
//   • timer-widget:open / :close → abre/cierra la ventana flotante
//   • timer-widget:expand   → expande/colapsa (caja ↔ botón redondo)
//   • timer-widget:move     → arrastra la ventana según el delta del rato
function registerIpc({ onNotify, timerWidget }) {
    ipcMain.on("notify", (_evt, payload) => onNotify(payload));

    ipcMain.on("timer-widget:open", () => timerWidget.open());
    ipcMain.on("timer-widget:close", () => timerWidget.close());
    ipcMain.on("timer-widget:expand", (_evt, value) => timerWidget.setExpanded(value));
    ipcMain.on("timer-widget:move", (_evt, { dx = 0, dy = 0 } = {}) => timerWidget.moveBy(dx, dy));
}

module.exports = { registerIpc };
