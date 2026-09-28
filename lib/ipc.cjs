"use strict";

const { ipcMain } = require("electron");

// IPC preload → main. Dos canales:
//   • notify          → toast nativo (window.desktop.notify)
//   • timer-widget:open / :close → abre/cierra la ventana flotante del cronómetro
//   • timer-widget:move → arrastra la ventana (frame:false) según el delta del rato
function registerIpc({ onNotify, timerWidget }) {
    ipcMain.on("notify", (_evt, payload) => onNotify(payload));

    ipcMain.on("timer-widget:open", () => timerWidget.open());
    ipcMain.on("timer-widget:close", () => timerWidget.close());
    ipcMain.on("timer-widget:move", (_evt, { dx = 0, dy = 0 } = {}) => timerWidget.moveBy(dx, dy));
}

module.exports = { registerIpc };
