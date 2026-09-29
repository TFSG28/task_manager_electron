"use strict";

const { app, BrowserWindow, shell } = require("electron");
const { APP_URL, ICON_PATH, PRELOAD_PATH, isAppUrl } = require("./config.cjs");

// Ventana(s) de la app. Solo la primera es "la de casa" (main); las salas de
// llamada abren ventanas propias por window.open.
//
// Dos reglas que valen para cualquier ventana:
//   • la app nunca navega fuera de su origin — esos links salen al navegador;
//   • cerrar la ventana la OCULTA (close-to-tray); para salir de verdad está el
//     "Quit Omni" del tray, que marca app.isQuitting.

let mainWindow = null;

function createAppWindow(url = APP_URL) {
    const win = new BrowserWindow({
        width: 1360,
        height: 860,
        show: false,
        autoHideMenuBar: true,
        backgroundColor: "#0b0f14",
        // Ícono de ventana (Linux/Windows; macOS usa el .icns del DMG).
        icon: ICON_PATH,
        webPreferences: {
            preload: PRELOAD_PATH,
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    win.once("ready-to-show", () => win.show());

    // window.open (la sala abre en pestaña nueva hoy) → nueva ventana Electron;
    // cualquier otro origin → navegador del sistema.
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (isAppUrl(url)) {
            createAppWindow(url);
            return { action: "deny" };
        }
        shell.openExternal(url);
        return { action: "deny" };
    });

    win.webContents.on("will-navigate", (e, url) => {
        if (!isAppUrl(url)) {
            e.preventDefault();
            shell.openExternal(url);
        }
    });

    win.on("close", (e) => {
        if (!app.isQuitting) {
            e.preventDefault();
            win.hide();
        }
    });

    void win.loadURL(url);
    return win;
}

function createMainWindow() {
    // Si ya hay una principal viva, no crear otra (evita duplicados al
    // reabrir desde el dock/tray en macOS).
    if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;
    mainWindow = createAppWindow();
    return mainWindow;
}

// macOS: clic en el dock → si la ventana PRINCIPAL no existe (o fue destruida),
// se recrea. OJO: no vale contar `BrowserWindow.getAllWindows()` — la ventana
// del widget del cronómetro también cuenta, y entonces nunca se recreaba la
// principal (la app vivía en el tray con el widget abierto, sin forma de
// volver a abrir la ventana principal en macOS).
function ensureMainWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) mainWindow = createAppWindow();
    return mainWindow;
}

function showMainWindow() {
    // Si la principal fue cerrada/destruida (posible en macOS), la recreamos en
    // vez de salir sin hacer nada (el clic en dock/tray no hacía nada).
    if (!mainWindow || mainWindow.isDestroyed()) {
        mainWindow = createAppWindow();
        return;
    }
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
}

// Navegar la ventana principal (links de notificaciones: solo dentro de la app).
function navigateMainWindow(url) {
    void mainWindow?.loadURL(url);
}

module.exports = { createMainWindow, ensureMainWindow, showMainWindow, navigateMainWindow };
