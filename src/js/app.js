"use strict";

import { SceneHandler } from './SceneHandler.js';

export const DEBUG = false;

const APP_STATE = {
    delay: 8,
    paused: false
};

const UPDATE_QUEUE = [];

const GENERATOR_CONFIG = {
    searchRadius: 16,
    nearest: { x: -1, y: -1, z: -1, distSqr: Infinity }
};

const SCENE_HANDLER = new SceneHandler();

function renderLoop(time) {
    SCENE_HANDLER.renderScene(time);
    requestAnimationFrame(renderLoop);
}

function startApp() {
    requestAnimationFrame(renderLoop);
    updateGeneratorIds();
    processQueue();
}

function clearQueue() {
    UPDATE_QUEUE.length = 0;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function processQueue() {
    if (!APP_STATE.paused && UPDATE_QUEUE.length > 0) {
        let n = UPDATE_QUEUE.length;
        for (let i = 0; i < n; i++) {
            const data = UPDATE_QUEUE.shift();
            SCENE_HANDLER.updateScene(data, { aabb: false, wireframe: false, subAABB: false });
        }
    }

    setTimeout(processQueue, APP_STATE.delay);
}

/* App Stuff */

const GENERATOR_IDS = [];

let generator;

const worker = new Worker("./js/MainWorker.js", { type: 'module' });

worker.onmessage = event => {
    const type = event.data.type;

    if (type === "error") {
        if (event.data.errorType === "gen_error") {
            SCENE_HANDLER.clearScene();
        }

        console.error("MainWorker Error -> " + event.data.errorMessage);
        return;
    }

    if (type === "gen_ids") {
        GENERATOR_IDS.length = 0;
        GENERATOR_IDS.push(...event.data.generatorIds);
        updateSelectOptions();
        generator = GENERATOR_IDS[0];
        executeGenerator();
        return;
    }

    if (type === "progress") {
        showProgress(event.data.progress)
        return;
    }

    if (type === "aabb") {
        SCENE_HANDLER.centerCameraOnAABB(event.data.aabb);
        return;
    }

    if (type === "geometry") {
        UPDATE_QUEUE.push(event.data);
        return;
    }
};

worker.onmessageerror = event => {
    console.error(`Error receiving message from worker!`);
    console.log(event);
};

worker.onerror = event => {
    console.log("There is an error with the worker!");
    console.log(event);
};

function updateGeneratorIds() {
    worker.postMessage({
        type: "get_gen_ids",
    });
}

function executeGenerator() {
    worker.postMessage({
        type: "run_gen",
        config: GENERATOR_CONFIG, id: generator
    });
}

function resetAndExecute() {
    clearCanvasOverlay();

    clearQueue();

    GENERATOR_CONFIG.nearest = { x: -1, z: -1, distSqr: Infinity };

    APP_STATE.paused = false;
    updateStopBtnLabel();

    SCENE_HANDLER.clearScene();

    executeGenerator();
}

/* UI Stuff */

const generatorSelect = document.getElementById('generatorSelect');
const radiusInput = document.getElementById('radiusInput');
const canvasOverlay = document.getElementById('canvas-overlay');

const progressBar = document.getElementById('progressBar');

const replayButton = document.getElementById('replayButton');
const centerCameraButton = document.getElementById('centerCamera');
const clearButton = document.getElementById('clearButton');
const stopButton = document.getElementById('stopButton');

function updateSelectOptions() {
    const options = GENERATOR_IDS.map(id => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = id.split(/(?=[A-Z])/).join(" ");
        return option;
    });
    generatorSelect.replaceChildren(...options);
}

generatorSelect.addEventListener('change', () => {
    const selectedAlgorithm = generatorSelect.value;
    if (GENERATOR_IDS.includes(selectedAlgorithm)) {
        generator = selectedAlgorithm;
        resetAndExecute();
    }
});

if (radiusInput.value) {
    const radius = parseInt(radiusInput.value);
    GENERATOR_CONFIG.searchRadius = radius;
    //MEGA_VOLUME.clear();
}

radiusInput.addEventListener('change', () => {
    const radius = parseInt(radiusInput.value);
    GENERATOR_CONFIG.searchRadius = radius;
    resetAndExecute();
});

function showProgress(pct) {
    if (pct < 0) {
        progressBar.removeAttribute('value');
        progressBar.style.display = "";
        return;
    }

    const value = clamp(pct * 100, 0, 100);
    progressBar.value = value;
    progressBar.style.display = "";

    if (value === 100) {
        setTimeout(hideProgress, 1000);
    }
}

function hideProgress() {
    progressBar.value = "";
    progressBar.style.display = "none";
}

function addLineToCanvasOverlay(text) {
    const span = document.createElement("span");
    span.innerHTML = text;
    canvasOverlay.appendChild(span);
    canvasOverlay.style.display = "";
}

function clearCanvasOverlay() {
    canvasOverlay.replaceChildren();
    canvasOverlay.style.display = "none";
}

function updateStopBtnLabel() {
    stopButton.querySelector("span").innerHTML = APP_STATE.paused ? 'play_arrow' : 'stop';
}

centerCameraButton.addEventListener('click', event => {
    SCENE_HANDLER.centerCamera();
});

stopButton.addEventListener('click', event => {
    APP_STATE.paused = !APP_STATE.paused;
    updateStopBtnLabel();
});

replayButton.addEventListener('click', event => {
    resetAndExecute();
});

clearButton.addEventListener('click', event => {
    clearCanvasOverlay();
    SCENE_HANDLER.clearScene();
});

/* Run the App */

startApp();
