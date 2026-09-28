"use strict";

const { BrowserWindow, screen } = require("electron");
const { APP_URL, ICON_PATH, isAppUrl } = require("./config.cjs");

// Ventana flotante del cronómetro: pequeña, sin marco, SIEMPRE encima de todo
// (alwaysOnTop) — para seguir viendo los timers aunque el usuario esté en otra
// app (Photoshop, etc.). Carga la ruta /timer-widget de la web en una ventana
// Electron propia; el estado se sincroniza entre ventanas por BroadcastChannel
// (mismo origin), no por IPC.
//
// Solo una instancia: si ya está abierta, se enfoca; si no, se crea.

let widgetWindow = null;

const WIDTH = 340;
const HEIGHT = 420;
const MARGIN = 16;

function create() {
    // Esquina inferior derecha del área de trabajo de la pantalla principal.
    const { workArea } = screen.getPrimaryDisplay();
    const x = workArea.x + workArea.width - WIDTH - MARGIN;
    const y = workArea.y + workArea.height - HEIGHT - MARGIN;

    widgetWindow = new BrowserWindow({
        width: WIDTH,
        height: HEIGHT,
        x,
        y,
        show: false,
        frame: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        backgroundColor: "#0b0f14",
        icon: ICON_PATH,
        webPreferences: {
            preload: require("./config.cjs").PRELOAD_PATH,
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // "screen-saver" mantém a janela acima de apps em fullscreen.
    widgetWindow.setAlwaysOnTop(true, "screen-saver");
    widgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    widgetWindow.once("ready-to-show", () => widgetWindow.show());

    // La navegación interna se permite; cualquier otro origin sale al navegador.
    widgetWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (!isAppUrl(url)) require("electron").shell.openExternal(url);
        return { action: "deny" };
    });

    // Al cerrarse (por el usuario o por la app), limpia la referencia.
    widgetWindow.on("closed", () => {
        widgetWindow = null;
    });

    void widgetWindow.loadURL(`${APP_URL}timer-widget`);
    return widgetWindow;
}

function open() {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
        widgetWindow.show();
        return;
    }
    create();
}

function close() {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
        widgetWindow.close();
    }
    widgetWindow = null;
}

function isOpen() {
    return Boolean(widgetWindow && !widgetWindow.isDestroyed());
}

// Arrastar a janela (frame:false não tem barra): o renderer envia o delta do
// rato e o main move a janela. Simples e fiável em todas as plataformas.
function moveBy(dx, dy) {
    if (!widgetWindow || widgetWindow.isDestroyed()) return;
    const [x, y] = widgetWindow.getPosition();
    widgetWindow.setPosition(Math.round(x + dx), Math.round(y + dy));
}

module.exports = { open, close, isOpen, moveBy };
