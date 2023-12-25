"use strict";

import { ChunkedVolume, DenseVolume } from "./VoxelVolume.js";

import {
    Generator,
    SphereGenerator, CuboidGenerator, ConeGenerator, CylinderGenerator,
    TriAxialEllipsoidGenerator, OctantElilipsoidGenerator,
    SphereAndCarveOctantEllipsoidGenerator,
    SimplexNoiseSphereGenerator, SimplexNoisePillarsGenerator,
    MinkowskiGenerator,
    CuboidCellularNoiseGenerator,
    MoundGenerator,
    EggGenerator,
    HangingSpikesGenerator
} from "./Generators.js";

class GeneratorRegistry {
    /**
     * @type {Map<String, Generator>}
     */
    static #GENERATORS = new Map();

    static {
        GeneratorRegistry.registerAll(
            new HangingSpikesGenerator(),
            new SimplexNoisePillarsGenerator(),
            new OctantElilipsoidGenerator(),
            new SphereAndCarveOctantEllipsoidGenerator(),
            new MoundGenerator(),
            new TriAxialEllipsoidGenerator(),
            new SimplexNoiseSphereGenerator(),
            new EggGenerator(),
            new CuboidCellularNoiseGenerator(),
            new CuboidGenerator(),
            new CylinderGenerator(),
            new ConeGenerator(),
            new SphereGenerator(),
            new MinkowskiGenerator()
        );
    }

    /**
     * @param {Generator[]} generators 
     */
    static registerAll(...generators) {
        for (const generator of generators) {
            const id = generator.constructor.name.replace("Generator", "");
            GeneratorRegistry.#GENERATORS.set(id, generator);
        }
    }

    /**
     * @param {String} id 
     * @returns {Generator}
     */
    static get(id) {
        return GeneratorRegistry.#GENERATORS.get(id);
    }

    /**
     * @param {String} id 
     * @returns {boolean}
     */
    static has(id) {
        return GeneratorRegistry.#GENERATORS.has(id);
    }

    /**
     * @returns {IterableIterator<string>}
     */
    static getIds() {
        return GeneratorRegistry.#GENERATORS.keys();
    }
}

class SimpleMeshWorkerPool {
    #workers = [];
    #counter = 0;

    /**
     * 
     * @param {number} size 
     * @param {(this: Worker, event: MessageEvent<any>) => any} onMessage 
     */
    constructor(size, onMessage) {
        for (let i = 0; i < size; i++) {
            const worker = new Worker("./MeshWorker.js", { type: 'module' });
            worker.name = "mesh_worker_" + i;
            worker.onmessage = onMessage;
            worker.onmessageerror = SimpleMeshWorkerPool.onMessageError;
            worker.onerror = SimpleMeshWorkerPool.onError;

            this.#workers.push(worker);
        }
    }

    /**
     * @param {Worker} worker 
     * @param {MessageEvent<any>} event 
     */
    static onMessageError = (worker, event) => {
        console.error(`Error receiving message from worker ${worker.name}`);
        console.log(event);
    };

    /**
     * @param {Worker} worker 
     * @param {MessageEvent<any>} event 
     */
    static onError = (worker, event) => {
        console.error(`There is an error with the worker ${worker.name}`);
        console.log(event);
    }

    /**
     * @returns {Worker}
     */
    nextWorker() {
        return this.#workers[this.#counter++ % this.#workers.length];
    }
}

/**
 * @param {MessageEvent<any>} event 
 */
const redirectMessage = event => {
    self.postMessage(
        {
            type: "geometry",
            worldPosition: event.data.worldPosition,
            rawGeometry: event.data.rawGeometry
        },
        [
            event.data.rawGeometry.indices,
            event.data.rawGeometry.vertices,
            event.data.rawGeometry.normals,
            event.data.rawGeometry.colors
        ]
    );
};

const MESH_WORKER_POOL = new SimpleMeshWorkerPool(2, redirectMessage);

/**
 * @param {MessageEvent<any>} event 
 */
self.onmessage = event => {
    const type = event.data.type;

    if (type === "run_gen") {
        if (GeneratorRegistry.has(event.data.id)) {
            doWork(event.data.id, event.data.config);
        }
        else {
            self.postMessage({
                type: "error",
                errorType: "gen_error",
                errorMessage: `Invalid Generator Id: ${event.data.id}`
            });
        }
    }
    else if (type === "get_gen_ids") {
        self.postMessage({
            type: "gen_ids",
            generatorIds: [...GeneratorRegistry.getIds()]
        });
    }
    else {
        self.postMessage({
            type: "error",
            errorMessage: `Unknown Message Type: ${type}`
        });
    }
};

/**
 * @param {number} pct 
 */
function sendProgressPct(pct) {
    self.postMessage(
        {
            type: "progress",
            progress: pct
        }
    );
}

/**
 * @param {[number, number, number, number, number, number]} aabb 
 */
function sendBoundingBox(aabb) {
    self.postMessage(
        {
            type: "aabb",
            aabb
        }
    );
}

/**
 * @param {string} generatorId 
 * @param {Object} config 
 */
function doWork(generatorId, config) {
    sendProgressPct(-1.0);
    console.log(generatorId, "----------------------------");

    const generator = GeneratorRegistry.get(generatorId);
    const chunkedVolume = generateVoxels(generator, config);

    sendProgressPct(0.5);
    sendBoundingBox(chunkedVolume.getAABB());
    
    buildGeometry(chunkedVolume);
    sendProgressPct(1);
}

/**
 * @param {Generator} generator 
 * @param {Object} config 
 * @returns {ChunkedVolume}
 */
function generateVoxels(generator, config) {
    const t0 = performance.now();

    const chunkedVolume = generator.generate(config);

    const t1 = performance.now();
    console.log(`voxel generation took ${t1 - t0} ms`);

    return chunkedVolume;
}

/**
 * @param {ChunkedVolume} chunkedVolume 
 */
function copyVolumeInflated(chunkedVolume, x, y, z) {
    const size = chunkedVolume.chunkSize + 2;
    const inflatedVolume = new DenseVolume(size, size, size);

    for (let zi = 0; zi < size; zi++) {
        for (let yi = 0; yi < size; yi++) {
            for (let xi = 0; xi < size; xi++) {
                const voxel = chunkedVolume.get(x - 1 + xi, y - 1 + yi, z - 1 + zi);
                inflatedVolume.set(xi, yi, zi, voxel);
            }
        }
    }

    return inflatedVolume;
}

/**
 * @param {ChunkedVolume} chunkedVolume 
 */
function buildGeometry(chunkedVolume) {
    const chunks = [];
    let counter = 0;

    const t0 = performance.now();
    chunkedVolume.forEachChunk((x, y, z, volume) => {
        if (!volume.isEmpty()) {
            const inflatedVolume = copyVolumeInflated(chunkedVolume, x, y, z);
            chunks.push({ x, y, z, volume: inflatedVolume });
        }
        counter++;
    });
    const t1 = performance.now();
    console.log(`total volume copy took ${t1 - t0} ms`);
    
    sendProgressPct(0.75);

    console.log("chunks to mesh:", chunks.length);
    console.log("empty chunks to skip:", counter - chunks.length);

    const t2 = performance.now();
    chunks.map((chunk) => {
        const voxelBuffer = chunk.volume.toArrayBuffer();
        MESH_WORKER_POOL.nextWorker().postMessage(
            {
                worldPosition: [chunk.x, chunk.y, chunk.z],
                dimensions: [chunk.volume.sizeX, chunk.volume.sizeY, chunk.volume.sizeZ],
                voxelBuffer
            },
            [voxelBuffer]
        );
    });
    const t3 = performance.now();
    console.log(`mesh-worker distribution took ${t3 - t2} ms`);
}
