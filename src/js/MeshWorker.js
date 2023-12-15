"use strict";

import { Mesher } from "./Mesher.js";
import { DenseVolume } from "./VoxelVolume.js";

const MESHER = new Mesher();

self.onmessage = event => {
    doWork(event.data);
};

/**
 * @param {Object} data 
 */
function doWork(data) {
    const volume = getVolume(data.voxelBuffer, data.dimensions);
    const rawGeometry = buildRawGeometry(volume);

    if (rawGeometry != null) {
        self.postMessage(
            {
                worldPosition: data.worldPosition,
                rawGeometry
            },
            [rawGeometry.indices, rawGeometry.vertices, rawGeometry.normals, rawGeometry.colors]
        );
    }
    else {
        //console.log("discarded empty geometry");
    }
}

/**
 * @param {ArrayBuffer} rawVolume 
 * @param {[number, number, number]} dimensions 
 * @returns {DenseVolume}
 */
function getVolume(buffer, dimensions) {
    return DenseVolume.fromArrayBuffer(buffer, dimensions[0], dimensions[1], dimensions[2]);
}

/**
 * @param {DenseVolume} volume 
 * @returns 
 */
function buildRawGeometry(volume) {
    return MESHER.buildGeometry(volume);
}
