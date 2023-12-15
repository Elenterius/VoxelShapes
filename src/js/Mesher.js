"use strict";

import { ARGB } from './color.js';
import { DenseVolume, VoxelVolume } from './VoxelVolume.js';

class VoxelVisibility {
    static EMPTY = new VoxelVisibility();
    static OPAQUE = new VoxelVisibility();
    static TRANSPARENT = new VoxelVisibility();

    isVisible() {
        return this !== VoxelVisibility.EMPTY;
    }

    isOpaque() {
        return this === VoxelVisibility.OPAQUE;
    }

    isTransparent() {
        return this === VoxelVisibility.TRANSPARENT;
    }

    isEmpty() {
        return this === VoxelVisibility.EMPTY;
    }

    /**
     * @param {int} voxel 
     * @returns {VoxelVisibility}
     */
    static get(voxel) {
        if (voxel === 0) return VoxelVisibility.EMPTY;
        if (ARGB.alpha(voxel) < 255) return VoxelVisibility.TRANSPARENT;
        return VoxelVisibility.OPAQUE;
    }
}

export class NeigborCache {

    #r;
    #size;
    #cache;

    #chunkOffsetX;
    #chunkOffsetY;
    #chunkOffsetZ;

    /**
     * @param {Function} getNeighbor 
     */
    constructor(chunkOffsetX, chunkOffsetY, chunkOffsetZ, getNeighbor) {
        this.getNeighbor = getNeighbor;

        this.#chunkOffsetX = chunkOffsetX;
        this.#chunkOffsetY = chunkOffsetY;
        this.#chunkOffsetZ = chunkOffsetZ;

        this.#r = 1;
        this.#size = 1 + this.#r * 2;
        this.#cache = new Array(this.#size * this.#size * this.#size);
    }

    set(centerX, centerY, centerZ) {
        for (let z = 0; z < this.#size; z++) {
            for (let y = 0; y < this.#size; y++) {
                for (let x = 0; x < this.#size; x++) {

                    if (x === this.#r && y === this.#r && z === this.#r) {
                        continue;
                    }

                    const voxel = this.getNeighbor(
                        centerX + (x - this.#r) + this.#chunkOffsetX,
                        centerY + (y - this.#r) + this.#chunkOffsetY,
                        centerZ + (z - this.#r) + this.#chunkOffsetZ
                    );
                    this.#set(x, y, z, voxel);
                }
            }
        }
    }

    get(relativeX, relativeY, relativeZ) {
        return this.#cache[this.#linearize(relativeX + this.#r, relativeY + this.#r, relativeZ + this.#r)];
    }

    #set(x, y, z, voxel) {
        this.#cache[this.#linearize(x, y, z)] = voxel;
    }

    #linearize(x, y, z) {
        return x + (y * this.#size) + (z * this.#size * this.#size);
    }
}

export class Cursor {

    x = 0;
    y = 0;
    z = 0;
    volume;

    /**
     * @param {DenseVolume} volume 
     */
    constructor(volume) {
        this.volume = volume;
    }

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    get(relativeX, relativeY, relativeZ) {
        return this.volume.get(this.x + relativeX, this.y + relativeY, this.z + relativeZ);
    }

}

/**
 * Voxel Mesher with Ambient Occlusion,
 * based on https://playspacefarer.com/ambient-occlusion/
 */
export class Mesher {

    /**
     * @param {VoxelVolume} volume 
     * @returns {Map<String, ArrayBuffer>}
     */
    buildGeometry(volume) {
        return this.#buildGeometry(volume);
    }

    /**
     * @param {VoxelVolume} volume 
     * @returns {Map<String, number[]}
     */
    #buildGeometry(volume) {

        const cursor = new Cursor(volume);
        
        /**
         * @type {number[]}
         */
        const vertices = [];
        /**
         * @type {number[]}
         */
        const indices = [];
        /**
         * @type {number[]}
         */
        const normals = [];
        /**
         * @type {number[]}
         */
        const colors = [];

        for (let i = 0; i < volume.size(); i++) {
            let [x, y, z] = volume.delinearize(i);

            //ignore the edges because they are not part of the original chunk
            if (x === 0 || y === 0 || z === 0) continue;
            if (x === volume.sizeX - 1 || y === volume.sizeY - 1 || z === volume.sizeZ - 1) continue;

            const voxel = volume.get(x, y, z);
            const voxelVisibility = VoxelVisibility.get(voxel);

            if (voxelVisibility.isEmpty()) continue; //not visible

            cursor.set(x, y, z);

            const neighbors = [
                cursor.get(- 1, 0, 0),
                cursor.get(+ 1, 0, 0),
                cursor.get(0, - 1, 0),
                cursor.get(0, + 1, 0),
                cursor.get(0, 0, - 1),
                cursor.get(0, 0, + 1)
            ];

            for (const [index, neighbor] of neighbors.entries()) {
                const otherVisibility = VoxelVisibility.get(neighbor);

                let generate = false;

                if (voxelVisibility.isTransparent() && otherVisibility.isTransparent()) {
                    generate = voxel !== neighbor;
                }
                else if (!voxelVisibility.isEmpty() && !otherVisibility.isOpaque()) {
                    generate = true;
                }

                if (!generate) continue

                const positions = Face.POSITIONS[index].map(position => [
                    (x - 1 - 1) + position[0],
                    (y - 1 - 1) + position[1],
                    (z - 1 - 1) + position[2],
                ]);

                const vertexIndex = vertices.length / 3;
                vertices.push(
                    positions[0][0], positions[0][1], positions[0][2],
                    positions[1][0], positions[1][1], positions[1][2],
                    positions[2][0], positions[2][1], positions[2][2],
                    positions[3][0], positions[3][1], positions[3][2]
                );

                const side = Side.from(index);
                const aos = AO.faceAos(side, cursor);

                if ((aos[1] + aos[2]) > (aos[0] + aos[3])) {
                    indices.push(
                        vertexIndex, vertexIndex + 2, vertexIndex + 1,
                        vertexIndex + 1, vertexIndex + 2, vertexIndex + 3
                    );
                }
                else {
                    indices.push(
                        vertexIndex, vertexIndex + 3, vertexIndex + 1,
                        vertexIndex, vertexIndex + 2, vertexIndex + 3
                    );
                }

                const normal = side.normal;
                normals.push(
                    normal[0], normal[1], normal[2],
                    normal[0], normal[1], normal[2],
                    normal[0], normal[1], normal[2],
                    normal[0], normal[1], normal[2]
                );

                const red = ARGB.red(voxel) / 255;
                const green = ARGB.green(voxel) / 255;
                const blue = ARGB.blue(voxel) / 255;

                const ao0 = AO.COLORS[aos[0]];
                const ao1 = AO.COLORS[aos[1]];
                const ao2 = AO.COLORS[aos[2]];
                const ao3 = AO.COLORS[aos[3]];

                colors.push(
                    red * ao0, green * ao0, blue * ao0,
                    red * ao1, green * ao1, blue * ao1,
                    red * ao2, green * ao2, blue * ao2,
                    red * ao3, green * ao3, blue * ao3
                );

            }
        }

        if (indices.length === 0) return null;

        return {
            indices: new Uint16Array(indices).buffer,
            vertices: new Float32Array(vertices).buffer,
            normals: new Float32Array(normals).buffer,
            colors: new Float32Array(colors).buffer
        };
    }
}

const Axis = Object.freeze({
    X: 'X',
    Y: 'Y',
    Z: 'Z',
});

class Side {
    static X_NEG = new Side(0, Axis.X, true, [-1.0, 0.0, 0.0]);
    static X_POS = new Side(1, Axis.X, false, [1.0, 0.0, 0.0]);
    static Y_NEG = new Side(2, Axis.Y, false, [0.0, -1.0, 0.0]);
    static Y_POS = new Side(3, Axis.Y, true, [0.0, 1.0, 0.0]);
    static Z_NEG = new Side(4, Axis.Z, false, [0.0, 0.0, -1.0]);
    static Z_POS = new Side(5, Axis.Z, true, [0.0, 0.0, 1.0]);

    static VALUES = [Side.X_NEG, Side.X_POS, Side.Y_NEG, Side.Y_POS, Side.Z_NEG, Side.Z_POS];

    /**
     * @param {Axis} axis 
     * @param {boolean} positive 
     * @param {[number, number, number]} normal 
     */
    constructor(index, axis, positive, normal) {
        this.index = index;
        this.axis = axis;
        this.positive = positive;
        this.normal = normal;
    }

    normals() {
        return [this.normal, this.normal, this.normal, this.normal];
    }

    static from(index) {
        return Side.VALUES[index];
    }
}

class Face {
    static POSITIONS = [
        [[0.0, 0.0, 1.0], [0.0, 0.0, 0.0], [0.0, 1.0, 1.0], [0.0, 1.0, 0.0]], //X_NEG
        [[1.0, 0.0, 0.0], [1.0, 0.0, 1.0], [1.0, 1.0, 0.0], [1.0, 1.0, 1.0]], //X_POS
        [[0.0, 0.0, 1.0], [1.0, 0.0, 1.0], [0.0, 0.0, 0.0], [1.0, 0.0, 0.0]], //Y_NEG
        [[0.0, 1.0, 1.0], [0.0, 1.0, 0.0], [1.0, 1.0, 1.0], [1.0, 1.0, 0.0]], //Y_POS
        [[0.0, 0.0, 0.0], [1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [1.0, 1.0, 0.0]], //Z_NEG
        [[1.0, 0.0, 1.0], [0.0, 0.0, 1.0], [1.0, 1.0, 1.0], [0.0, 1.0, 1.0]], //Z_POS
    ];
}

class AO {
    static COLORS = [0.25, 0.5, 0.75, 1.0];
    static EMPTY_SIDE_AOS = [0, 0, 0, 0];

    /**
     * @param {boolean} side1 
     * @param {boolean} corner 
     * @param {boolean} side2 
     * @returns {number}
     */
    static value(side1, corner, side2) {
        if (side1 && side2) {
            return 0;
        }

        if ((side1 && corner) || (!side1 && corner && side2)) {
            return 1;
        }

        if (!side1 && !corner && !side2) {
            return 3;
        }

        return 2;
    }


    /**
     * @param {[number, number, number, number, number, number, number, number]} neighbors 
     * @returns {[number, number, number, number]}
     */
    static sideAos(neighbors) {
        const ns = neighbors.map(neighbor => VoxelVisibility.get(neighbor).isOpaque())

        return [
            AO.value(ns[0], ns[1], ns[2]),
            AO.value(ns[2], ns[3], ns[4]),
            AO.value(ns[6], ns[7], ns[0]),
            AO.value(ns[4], ns[5], ns[6])
        ];
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @param {Side} side 
     * @param {Cursor} cursor 
     * @returns 
     */
    static faceAos(side, cursor) {
        switch (side) {
            case Side.X_NEG:
                return AO.sideAos([
                    cursor.get(-1, 0, 1),
                    cursor.get(-1, -1, 1),
                    cursor.get(-1, -1, 0),
                    cursor.get(-1, -1, -1),
                    cursor.get(-1, 0, -1),
                    cursor.get(-1, 1, -1),
                    cursor.get(-1, 1, 0),
                    cursor.get(-1, 1, 1),
                ]);
            case Side.X_POS:
                return AO.sideAos([
                    cursor.get(1, 0, -1),
                    cursor.get(1, -1, -1),
                    cursor.get(1, -1, 0),
                    cursor.get(1, -1, 1),
                    cursor.get(1, 0, 1),
                    cursor.get(1, 1, 1),
                    cursor.get(1, 1, 0),
                    cursor.get(1, 1, -1),
                ]);
            case Side.Y_NEG:
                return AO.sideAos([
                    cursor.get(-1, -1, 0),
                    cursor.get(-1, -1, 1),
                    cursor.get(0, -1, 1),
                    cursor.get(1, -1, 1),
                    cursor.get(1, -1, 0),
                    cursor.get(1, -1, -1),
                    cursor.get(0, -1, -1),
                    cursor.get(-1, -1, -1),
                ]);
            case Side.Y_POS:
                return AO.sideAos([
                    cursor.get(0, 1, 1),
                    cursor.get(-1, 1, 1),
                    cursor.get(-1, 1, 0),
                    cursor.get(-1, 1, -1),
                    cursor.get(0, 1, -1),
                    cursor.get(1, 1, -1),
                    cursor.get(1, 1, 0),
                    cursor.get(1, 1, 1),
                ]);
            case Side.Z_NEG:
                return AO.sideAos([
                    cursor.get(-1, 0, -1),
                    cursor.get(-1, -1, -1),
                    cursor.get(0, -1, -1),
                    cursor.get(1, -1, -1),
                    cursor.get(1, 0, -1),
                    cursor.get(1, 1, -1),
                    cursor.get(0, 1, -1),
                    cursor.get(-1, 1, -1),
                ]);
            case Side.Z_POS:
                return AO.sideAos([
                    cursor.get(1, 0, 1),
                    cursor.get(1, -1, 1),
                    cursor.get(0, -1, 1),
                    cursor.get(-1, -1, 1),
                    cursor.get(-1, 0, 1),
                    cursor.get(-1, 1, 1),
                    cursor.get(0, 1, 1),
                    cursor.get(1, 1, 1),
                ]);
            default:
                return AO.EMPTY_SIDE_AOS;
        }
    }
}
