"use strict";

import { ChunkedVolume, DenseVolume, VoxelVolume } from "./VoxelVolume.js";

import FastNoiseLite from "./lib/FastNoiseLite.js";
import { Vector3 } from "./lib/FastNoiseLite.js";

import {
    CompoundShape,
    SphereShape, ConeShape, CylinderShape, CuboidShape, EllipticShape, Shape,
    TriAxialEllipsoidShape, OctantEllipsoidShape,
    clamp, lerp, AxisAlignedBoundingBox, Vec3, randomInRange,
    easeInQuad, easeOutQuad, easeInOutQuad,
    easeInBack,
    countInscribedCircles, countCirclesOnCircumference
} from "./math.js";

import { ARGB } from "./color.js";

import BIOME_DATA from './data/biome_temperatures.js'


export class Generator {

    static IDENTITY_PREDICATE = { test: (x, y, z) => true };

    /**
     * @param {Object} config
     * @returns {ChunkedVolume}
     */
    generate(config) { }

    /**
     * @param {Shape} shape 
     * @param {ChunkedVolume} chunkedVolume 
     */
    static generateShape(shape, chunkedVolume, predicate = Generator.IDENTITY_PREDICATE) {
        const aabb = shape.getAABB().map(x => Math.round(x));
        const numColors = 6;

        for (let z = aabb.minZ; z < aabb.maxZ; z++) {
            for (let y = aabb.minY; y < aabb.maxY; y++) {
                const yPct = Math.abs(aabb.maxY - y) / Math.abs(aabb.maxY - aabb.minY);
                const ab = clamp(Math.floor(Math.floor((1 - yPct) * numColors) * (255 / numColors)), 0, 255);

                for (let x = aabb.minX; x < aabb.maxX; x++) {
                    if (!shape.contains(x, y, z)) continue;
                    if (!predicate.test(x, y, z)) continue;
                    const color = ARGB.color(255, 120, ab, 150);
                    chunkedVolume.set(x, y, z, color);
                }
            }
        }
    }

    /**
     * @param {Shape} shape 
     * @param {ChunkedVolume} chunkedVolume 
     */
    static carveShape(shape, chunkedVolume, predicate = Generator.IDENTITY_PREDICATE) {
        const aabb = shape.getAABB().map(x => Math.round(x));

        for (let z = aabb.minZ; z < aabb.maxZ; z++) {
            for (let y = aabb.minY; y < aabb.maxY; y++) {
                for (let x = aabb.minX; x < aabb.maxX; x++) {
                    if (!shape.contains(x, y, z)) continue;
                    if (!predicate.test(x, y, z)) continue;
                    chunkedVolume.set(x, y, z, 0);
                }
            }
        }
    }
}


export class CuboidGenerator extends Generator {

    generate(config) {
        const size = config.searchRadius;
        const shape = new CuboidShape(0, 0, 0, size, size, size);

        const chunkedVolume = new ChunkedVolume();
        Generator.generateShape(shape, chunkedVolume);
        return chunkedVolume;
    }
}

export class SphereGenerator extends Generator {

    generate(config) {
        const radius = config.searchRadius;
        const shape = new SphereShape(0, 0, 0, radius);

        const chunkedVolume = new ChunkedVolume();
        Generator.generateShape(shape, chunkedVolume);
        return chunkedVolume;
    }
}

export class TriAxialEllipsoidGenerator extends Generator {

    generate(config) {
        const radius = config.searchRadius;
        const shape = new TriAxialEllipsoidShape(0, 0, 0, radius, radius / 2, radius - 4);

        const chunkedVolume = new ChunkedVolume();
        Generator.generateShape(shape, chunkedVolume);
        return chunkedVolume;
    }
}

export class ConeGenerator extends Generator {

    generate(config) {
        const baseRadius = config.searchRadius;
        const size = Math.floor(baseRadius * 0.65);
        const shape = ConeShape.createFromBaseAndTip(-size, -size, -size, size, size, size, baseRadius);

        const chunkedVolume = new ChunkedVolume();
        Generator.generateShape(shape, chunkedVolume);
        return chunkedVolume;
    }
}

export class CylinderGenerator extends Generator {

    generate(config) {
        const radius = config.searchRadius;
        const size = Math.floor(radius * 0.65);
        const shape = CylinderShape.createFromBaseAndTip(-size, -size, -size, size, size, size, radius);

        const chunkedVolume = new ChunkedVolume();
        Generator.generateShape(shape, chunkedVolume);
        return chunkedVolume;
    }
}

export class OctantElilipsoidGenerator extends Generator {

    generate(config) {
        const radius = config.searchRadius;
        const halfR = radius / 2;
        const shape = new OctantEllipsoidShape(0, 0, 0, halfR, radius, radius, radius, halfR, halfR);

        const chunkedVolume = new ChunkedVolume();
        Generator.generateShape(shape, chunkedVolume);
        return chunkedVolume;
    }
}

export class SphereAndCarveOctantEllipsoidGenerator extends Generator {

    generate(config) {
        const radius = config.searchRadius;
        const halfR = radius / 2;
        const halfR2 = halfR / 2;
        const p = radius / 4.25; // radius / 4.5

        const chunkedVolume = new ChunkedVolume();
        let shape;

        shape = new SphereShape(0, 0, 0, radius);
        Generator.generateShape(shape, chunkedVolume);

        const carve = Generator.carveShape;

        shape = new OctantEllipsoidShape(p, p, p, halfR, halfR, halfR, halfR2, halfR2, halfR2);
        carve(shape, chunkedVolume);

        shape = new OctantEllipsoidShape(-p, p, p, halfR2, halfR, halfR, halfR, halfR2, halfR2);
        carve(shape, chunkedVolume);

        shape = new OctantEllipsoidShape(p, p, -p, halfR, halfR, halfR2, halfR2, halfR2, halfR);
        carve(shape, chunkedVolume);

        shape = new OctantEllipsoidShape(-p, p, -p, halfR2, halfR, halfR2, halfR, halfR2, halfR);
        carve(shape, chunkedVolume);

        ///////////////////

        shape = new OctantEllipsoidShape(p, -p, p, halfR, halfR2, halfR, halfR2, halfR, halfR2);
        carve(shape, chunkedVolume);

        shape = new OctantEllipsoidShape(-p, -p, p, halfR2, halfR2, halfR, halfR, halfR, halfR2);
        carve(shape, chunkedVolume);

        shape = new OctantEllipsoidShape(p, -p, -p, halfR, halfR2, halfR2, halfR2, halfR, halfR);
        carve(shape, chunkedVolume);

        shape = new OctantEllipsoidShape(-p, -p, -p, halfR2, halfR2, halfR2, halfR, halfR, halfR);
        carve(shape, chunkedVolume);

        return chunkedVolume;
    }
}

export class SimplexNoiseSphereGenerator extends Generator {

    generate(config) {
        const radius = config.searchRadius;
        const shape = new SphereShape(0, 0, 0, radius);

        const chunkedVolume = new ChunkedVolume();

        const seed = Math.round(Math.random() * 2000000);

        const noise = new FastNoiseLite(seed);
        noise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2S);
        noise.SetFrequency(0.03);

        const sqrDistanceFunc = (dx, dy, dz) => dx * dx + dy * dy + dz * dz + (noise.GetNoise(dx, dy * 2, dz) * radius) ** 2;

        const aabb = shape.getAABB().map(x => Math.round(x));

        for (let z = aabb.minZ; z < aabb.maxZ; z++) {
            for (let y = aabb.minY; y < aabb.maxY; y++) {

                const t = (y - aabb.minY) / (aabb.maxY - aabb.minY); //min-max rescale
                const c = Math.round(lerp(t, 0, 10)) * 25;
                const color = ARGB.color(255, c, c, 255);

                for (let x = aabb.minX; x < aabb.maxX; x++) {
                    if (!shape.contains(x, y, z, sqrDistanceFunc)) continue;
                    chunkedVolume.set(x, y, z, color);
                }
            }
        }

        return chunkedVolume;
    }
}

export class EggGenerator extends Generator {

    generate(config) {
        const radius = config.searchRadius;
        const shape = EllipticShape.createFromBaseAndTip(0, radius * 2, 0, 0, -radius, 0, radius);

        const seed = Math.round(Math.random() * 2000000);
        const frequency = 0.35;
        const borderThreshold = 0.28;

        const cellularNoise = new FastNoiseLite(seed);
        cellularNoise.SetNoiseType(FastNoiseLite.NoiseType.Cellular);
        cellularNoise.SetRotationType3D(FastNoiseLite.RotationType3D.ImproveXZPlanes);
        cellularNoise.SetFrequency(frequency);
        cellularNoise.SetCellularReturnType(FastNoiseLite.CellularReturnType.Distance);

        const domainWarp = new FastNoiseLite(seed);
        domainWarp.SetDomainWarpType(FastNoiseLite.DomainWarpType.OpenSimplex2Reduced);
        domainWarp.SetRotationType3D(FastNoiseLite.RotationType3D.ImproveXZPlanes);
        domainWarp.SetDomainWarpAmp(50);
        domainWarp.SetFrequency(0.005);

        const cursor = new Vector3(0, 0, 0);
        const getNoise = (x, y, z) => {
            cursor.set(x, y, z);
            //domainWarp.DomainWarp(cursor);
            const { dist, closestHash, specialHash } = cellularNoise.GetNoise(cursor.x, cursor.y, cursor.z);
            return dist + 1;
        };
        const predicate = { test: (x, y, z) => getNoise(x, y, z) > borderThreshold };

        const chunkedVolume = new ChunkedVolume();
        Generator.generateShape(shape, chunkedVolume, predicate);
        return chunkedVolume;
    }
}

export class MinkowskiGenerator extends Generator {

    generate(config) {
        const chunkedVolume = new ChunkedVolume();

        const searchDist = config.searchRadius;
        const searchDistSqr = searchDist * searchDist;

        const minkowskiDistance = (x, y, z, maxDist, maxDistSqr) => {
            const p = 2.3; // 0.707, 1.507, 2.3, 4
            const dist = Math.pow(Math.pow(Math.abs(x), p) + Math.pow(Math.abs(y), p) + Math.pow(Math.abs(z), p), 1 / p);
            return dist < maxDist; /*&& dist >= maxDist - 2*/
        };

        const sqrDistance = (x, y, z, maxDist, maxDistSqr) => {
            const distSqr = x * x + y * y + z * z;
            return distSqr < maxDistSqr && distSqr >= (maxDist - 1) * (maxDist - 1);
        };

        let distance = minkowskiDistance;

        const d = searchDist * 2 - 1;

        const chunkMin = -Math.ceil(searchDist / 16);
        const chunkMax = Math.ceil(searchDist / 16);

        for (let cy = chunkMin; cy < chunkMax; cy++) {
            for (let cx = chunkMin; cx < chunkMax; cx++) {
                for (let cz = chunkMin; cz < chunkMax; cz++) {

                    const minX = cx * 16;
                    const maxX = cx * 16 + 15 + 1;
                    const minY = cy * 16;
                    const maxY = cy * 16 + 15 + 1;
                    const minZ = cz * 16;
                    const maxZ = cz * 16 + 15 + 1;

                    for (let y = minY; y < maxY; y++) {
                        for (let x = minX; x < maxX; x++) {
                            for (let z = minZ; z < maxZ; z++) {
                                if (distance(x, y, z, searchDist, searchDistSqr)) {
                                    const grey = clamp(((y + searchDist / 2 * (y % 4)) / d) * 255, 0, 255);
                                    const color = ARGB.color(255, 255, grey, grey);
                                    chunkedVolume.set(x, y, z, color);
                                }
                            }
                        }
                    }
                }
            }
        }

        /*
        for (let y = -searchDist; y < searchDist; y++) {
            for (let x = -searchDist; x < searchDist; x++) {
                for (let z = -searchDist; z < searchDist; z++) {
                    if (distance(x, y, z, searchDist, searchDistSqr)) {
                        const distSqr = x * x + y * y + z * z;
                        const value = ((distSqr / searchDistSqr));
                        //const color = convertToColor(value);
    
                        const blue = clamp(((y + searchDist / 2 * (y % 4)) / d) * 255, 0, 255);
                        const color = ARGB.color(0, 255, blue, blue);
                        //chunkedVolume.set(x, y, z, color);
                    }
                }
            }
        }
        */

        return chunkedVolume;
    }
}

export class CuboidCellularNoiseGenerator extends Generator {

    generate(config) {
        const chunkedVolume = new ChunkedVolume();

        const distance = config.searchRadius;
        const seed = 1337;
        const frequency = 0.2;
        const borderThreshold = 0.1;

        // addLineToCanvasOverlay("Seed: " + seed);
        // addLineToCanvasOverlay("Frequency: " + frequency);
        // addLineToCanvasOverlay("Border Threshold: " + borderThreshold);

        const cellularNoise = new FastNoiseLite(seed);
        cellularNoise.SetNoiseType(FastNoiseLite.NoiseType.Cellular);
        cellularNoise.SetRotationType3D(FastNoiseLite.RotationType3D.ImproveXZPlanes);
        cellularNoise.SetFrequency(frequency);
        cellularNoise.SetCellularReturnType(FastNoiseLite.CellularReturnType.Distance);

        const domainWarp = new FastNoiseLite(seed);
        domainWarp.SetDomainWarpType(FastNoiseLite.DomainWarpType.OpenSimplex2Reduced);
        domainWarp.SetRotationType3D(FastNoiseLite.RotationType3D.ImproveXZPlanes);
        domainWarp.SetDomainWarpAmp(50);
        domainWarp.SetFrequency(0.005);

        const cursor = new Vector3(0, 0, 0);
        const getNoise = (x, y, z) => {
            cursor.set(x, y, z);
            domainWarp.DomainWarp(cursor);
            return cellularNoise.GetNoise(cursor.x, cursor.y, cursor.z);
        };

        for (let y = -distance; y < distance; y++) {
            for (let x = -distance; x < distance; x++) {
                for (let z = -distance; z < distance; z++) {
                    const { dist, closestHash, specialHash } = getNoise(x, y, z);
                    const noiseValue = dist + 1;
                    if (noiseValue > borderThreshold) {
                        const t = clamp(noiseValue, 0, 1);
                        const g = Math.round(lerp(t, 0, 255));
                        const color = ARGB.color(255, g, g, g);
                        chunkedVolume.set(x, y, z, color);
                    }
                }
            }
        }

        return chunkedVolume;
    }
}

export class SimplexNoisePillarsGenerator extends Generator {

    generate(config) {
        const chunkedVolume = new ChunkedVolume();

        const halfSize = config.searchRadius;
        const size = halfSize * 2;

        const seed = Math.round(Math.random() * 2000000);

        const noise = new FastNoiseLite(seed);
        noise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2S);
        noise.SetFrequency(0.10);

        const aabb = new AxisAlignedBoundingBox(0, 0, 0, size, size, size);
        const originX = halfSize;
        const originY = halfSize;
        const originZ = halfSize;

        for (let y = aabb.minY; y < aabb.maxY; y++) {
            const pctY = (y - aabb.minY) / (aabb.maxY - aabb.minY); //min-max rescale

            for (let x = aabb.minX; x < aabb.maxX; x++) {
                for (let z = aabb.minZ; z < aabb.maxZ; z++) {

                    const fx = x => ((x - 0.5) ** 2 * 4) * -1 + 1;

                    const noiseValue = noise.GetNoise(originX - x, 0, originZ - z);

                    if (noiseValue < 0.42 + fx(pctY) * 0.2) continue;

                    const c = Math.round(lerp(pctY, 0, 10)) * 25;
                    const color = ARGB.color(255, c, c, 255);

                    chunkedVolume.set(x, y, z, color);
                }
            }
        }

        return chunkedVolume;
    }
}

export class HangingSpikesGenerator extends Generator {

    easeInExpo(x) {
        return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
    }

    generate(config) {
        const chunkedVolume = new ChunkedVolume();

        const halfSize = config.searchRadius;
        const size = halfSize * 2;

        const seed = Math.round(Math.random() * 2000000);

        const noise = new FastNoiseLite(seed);
        noise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2S);
        noise.SetFrequency(0.10);

        const aabb = new AxisAlignedBoundingBox(0, 0, 0, size, size, size);
        const originX = halfSize;
        const originY = halfSize;
        const originZ = halfSize;

        const shape = new SphereShape(halfSize, halfSize, halfSize, halfSize);

        for (let y = aabb.minY; y < aabb.maxY; y++) {
            const pctY = (y - aabb.minY) / (aabb.maxY - aabb.minY); //min-max rescale

            for (let x = aabb.minX; x < aabb.maxX; x++) {
                for (let z = aabb.minZ; z < aabb.maxZ; z++) {

                    if (!shape.contains(x, y, z)) continue;

                    const noiseValue = noise.GetNoise(originX - x, 0, originZ - z);

                    const fx = x => ((x - 0.5) ** 2 * 4) * -1 + 1;

                    if (noiseValue < 0.5 + this.easeInExpo(1 - pctY) * 10) continue;

                    const c = Math.round(lerp(pctY, 0, 10)) * 25;
                    const color = ARGB.color(255, 0, 255, c);

                    chunkedVolume.set(x, y, z, color);
                }
            }
        }

        return chunkedVolume;
    }
}

export class MoundGenerator extends Generator {

    constructor() {
        super();
    }

    generate(config) {
        const chunkedVolume = new ChunkedVolume();

        ///////////////////////////////////// World Settings
        const MAX_WORLD_HEIGHT = 256 + 64;
        const CLOUD_LEVEL = 191;
        const SEA_LEVEL = 62;
        const MIN_WORLD_HEIGHT = -64;

        ///////////////////////////////////// Mound Origin
        const x = 0;
        const y = SEA_LEVEL;
        const z = 0;

        ///////////////////////////////////// Mound Modifiers influenced by Player
        const heightMultiplier = 0.0; // 0 - 1
        const spireCountModifier = 4;
        const radiusMultiplier = 0;

        const radius = config.searchRadius * (1 + radiusMultiplier);

        ///////////////////////////////////// Mound Modifiers influenced by Biome
        const MIN_TEMP = -0.7; //frozen peaks
        const MAX_TEMP = 2; //desert
        const TEMP_DIFF = MAX_TEMP - MIN_TEMP;

        //const biomeData = BIOME_DATA.find(x => x.biome === "minecraft:savanna_plateau");
        //const biomeData = BIOME_DATA.find(x => x.biome === "minecraft:frozen_peaks");
        const biomeData = BIOME_DATA[Math.floor(Math.random() * BIOME_DATA.length)];
        const biomeTemperature = biomeData.temperature;
        const biomeHumidity = biomeData.downfall;

        function rescaleTemperature(t) {
            return (t - MIN_TEMP) / TEMP_DIFF;
        }

        function isFreezingTemp(mcTemperature) {
            return mcTemperature < 0.15;
        }

        function convertTemperatureMCToCelsius(mcTemperature) {
            return 27.8 * mcTemperature - 4.17;
        }

        const heatMultiplier = rescaleTemperature(biomeTemperature) * 0.5 + biomeTemperature / MAX_TEMP * 0.5;
        const coldMultiplier = isFreezingTemp(biomeTemperature) ? 0.1 : 1;
        const erosionMultiplier = 0.1 + biomeHumidity * coldMultiplier;
        const erosionMultiplierInv = 1 - erosionMultiplier;

        /////////////////////////////////////
        const spikiness = clamp(heightMultiplier + heatMultiplier, 0, 1);
        const slantinessMultiplier = 0.1 + Math.random() + heatMultiplier * 2;
        const relativeWallThickness = clamp((1 - heatMultiplier) * 32, 2.25, 32);

        const minMoundRadius = 3 + erosionMultiplier * 3;
        const baseMoundRadius = radius + (radius / 2) * erosionMultiplierInv;
        const maxMoundRadius = baseMoundRadius + minMoundRadius;

        const subSpireRadius = maxMoundRadius / 2;
        const extraSpires = clamp(spireCountModifier, 0, countCirclesOnCircumference(maxMoundRadius, subSpireRadius));

        const maxMoundHeight = clamp(MAX_WORLD_HEIGHT * spikiness, 0, MAX_WORLD_HEIGHT - y);

        /*
        addLineToCanvasOverlay("---World-Influence--------");
        addLineToCanvasOverlay("Biome: " + biomeData.biome.replace("minecraft:", "").split("_").map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(" "));
        addLineToCanvasOverlay("Temperature: " + biomeData.temperature.toPrecision(3) + " (" + convertTemperatureMCToCelsius(biomeData.temperature).toPrecision(2) + "°C)");
        addLineToCanvasOverlay("Donwfall: " + biomeData.downfall.toPrecision(3));
        addLineToCanvasOverlay("Heat Multiplier: " + heatMultiplier.toPrecision(3));
        addLineToCanvasOverlay("Erosion Multiplier: " + erosionMultiplier.toPrecision(3));
        addLineToCanvasOverlay("---Player-Influence-------");
        addLineToCanvasOverlay("Spikiness Multiplier: " + heightMultiplier.toPrecision(3));
        addLineToCanvasOverlay("Spire Count Modifier: " + spireCountModifier.toPrecision(3));
        addLineToCanvasOverlay("Radius Multiplier: " + radiusMultiplier.toPrecision(3));
        addLineToCanvasOverlay("---Result--------------");
        addLineToCanvasOverlay("Spikiness: " + spikiness.toPrecision(3));
        addLineToCanvasOverlay("Wall Thickness (Rel. Growth Radius): " + relativeWallThickness.toPrecision(3));
        addLineToCanvasOverlay("Extra Spires: " + extraSpires.toPrecision(3));
        addLineToCanvasOverlay("Min Mound Radius: " + minMoundRadius.toPrecision(3));
        addLineToCanvasOverlay("Base Mound Radius: " + baseMoundRadius.toPrecision(3));
        addLineToCanvasOverlay("Max Mound Radius: " + maxMoundRadius.toPrecision(3));
        addLineToCanvasOverlay("Max Height: " + maxMoundHeight.toPrecision(3));
        /*
    
        ///////////////////// Spires
        /**
         * @type {SphereShape}
         */
        const additiveShapes = [];
        const subtractiveShapes = [];

        function createCarverShape(x, y, z, radius) {
            if (radius < 8) {
                return new SphereShape(x, y, z, radius);
            }

            const halfR = radius / 2;
            const halfR2 = halfR / 2;
            const p = radius / 3.8; // radius / 4.25

            return new CompoundShape([
                new OctantEllipsoidShape(x + p, y + p, z + p, halfR, halfR, halfR, halfR2, halfR2, halfR2),
                new OctantEllipsoidShape(x - p, y + p, z + p, halfR2, halfR, halfR, halfR, halfR2, halfR2),
                new OctantEllipsoidShape(x + p, y + p, z - p, halfR, halfR, halfR2, halfR2, halfR2, halfR),
                new OctantEllipsoidShape(x - p, y + p, z - p, halfR2, halfR, halfR2, halfR, halfR2, halfR),

                new OctantEllipsoidShape(x + p, y - p, z + p, halfR, halfR2, halfR, halfR2, halfR, halfR2),
                new OctantEllipsoidShape(x - p, y - p, z + p, halfR2, halfR2, halfR, halfR, halfR, halfR2),
                new OctantEllipsoidShape(x + p, y - p, z - p, halfR, halfR2, halfR2, halfR2, halfR, halfR),
                new OctantEllipsoidShape(x - p, y - p, z - p, halfR2, halfR2, halfR2, halfR, halfR, halfR)
            ]);
        }

        function genSpire(x, y, z, maxHeight, baseRadius, dirLean) {
            const maxLean = dirLean.scale(2);
            let prevLean = Vec3.ZERO;
            let prevRadius = baseRadius + relativeWallThickness;
            let totalHeight = 0;

            additiveShapes.push(new SphereShape(x, y, z, prevRadius));
            subtractiveShapes.push(createCarverShape(x, y, z, prevRadius - relativeWallThickness / 2));

            const fh = t => t;

            while (totalHeight < maxHeight) {
                const t = totalHeight / maxHeight;

                const coldRadius = lerp(easeInQuad(t), baseRadius, minMoundRadius);
                const warmRadius = lerp(easeOutQuad(t), baseRadius, minMoundRadius);
                const radius = clamp(lerp(spikiness, coldRadius, warmRadius), minMoundRadius, maxMoundRadius) + relativeWallThickness;
                const height = totalHeight + radius / 2 + lerp(fh(t), 0, radius / 2.5);

                if (height >= maxHeight) break;

                const leanOffset = dirLean.scale((Math.random() - 1) * slantinessMultiplier);
                let leanX = prevLean.x + leanOffset.x;
                if (Math.abs(leanX) >= maxLean.x) {
                    leanX = prevLean.x - leanOffset.z;
                }
                let leanZ = prevLean.z + leanOffset.z;
                if (Math.abs(leanZ) >= maxLean.z) {
                    leanZ = prevLean.z - leanOffset.z;
                }

                additiveShapes.push(new SphereShape(x + leanX, y + height, z + leanZ, radius));
                subtractiveShapes.push(createCarverShape(x + leanX, y + height, z + leanZ, radius - relativeWallThickness / 2));

                prevLean = new Vec3(leanX, 0, leanZ);
                prevRadius = radius;
                totalHeight = height;
            }
            //addLineToCanvasOverlay("Final Height: " + totalHeight.toPrecision(3));

            const endShape = createCarverShape(x + prevLean.x, y + totalHeight + (prevRadius / 2) * 1.5, z + prevLean.z, prevRadius / 2);
            subtractiveShapes.push(endShape);
        }

        const dirLean = new Vec3(Math.random() - Math.random(), 0, Math.random() - Math.random()).normalize();
        genSpire(x, y, z, maxMoundHeight, baseMoundRadius, dirLean);

        const subRadius = (baseMoundRadius + relativeWallThickness) * Math.sin(Math.PI / extraSpires);
        const r = lerp(spikiness, subSpireRadius, baseMoundRadius) + relativeWallThickness;
        const startAngle = Math.random() * (Math.PI * 2);
        const angle = (Math.PI * 2) / extraSpires;

        for (let n = 0; n < extraSpires; n++) {
            const arc = startAngle + angle * n;
            const xn = x + Math.sin(arc) * r;
            const zn = z + Math.cos(arc) * r;
            genSpire(xn, y, zn, maxMoundHeight / (1.5 + Math.random() * 1.5), subRadius, dirLean);
        }

        //Cellular Noise////////////////////////////////////////
        const seed = 1337;
        const frequency = 0.05;
        const borderThreshold = 0.16;

        const cellularNoise = new FastNoiseLite(seed);
        cellularNoise.SetNoiseType(FastNoiseLite.NoiseType.Cellular);
        cellularNoise.SetRotationType3D(FastNoiseLite.RotationType3D.ImproveXZPlanes);
        cellularNoise.SetFrequency(frequency);
        cellularNoise.SetCellularReturnType(FastNoiseLite.CellularReturnType.Distance);

        const domainWarp = new FastNoiseLite(seed);
        domainWarp.SetDomainWarpType(FastNoiseLite.DomainWarpType.OpenSimplex2Reduced);
        domainWarp.SetRotationType3D(FastNoiseLite.RotationType3D.ImproveXZPlanes);
        domainWarp.SetDomainWarpAmp(50);
        domainWarp.SetFrequency(0.005);

        const cursor = new Vector3(0, 0, 0);
        const getNoise = (x, y, z) => {
            cursor.set(x, y, z);
            domainWarp.DomainWarp(cursor);
            return cellularNoise.GetNoise(cursor.x, cursor.y, cursor.z);
        };

        //Voxelize ////////////////////////////////////////////
        const aabbA = additiveShapes[0].getAABB();
        const aabbB = additiveShapes[additiveShapes.length - 1].getAABB();
        const maxY = Math.max(aabbA.maxY, aabbB.maxY) - 1;

        for (const shape of additiveShapes) {
            var aabb = shape.getAABB().map(x => Math.round(x));

            //const intersectingShapes = subtractiveShapes.filter(subShape => subShape.getAABB().intersects(aabb));

            for (let z = aabb.minZ; z < aabb.maxZ; z++) {
                for (let y = aabb.minY; y < aabb.maxY; y++) {

                    const color = ARGB.color(255, 220, clamp(y / maxY * 255, 0, 255), 100);

                    for (let x = aabb.minX; x < aabb.maxX; x++) {
                        if (!shape.contains(x, y, z)) continue;
                        chunkedVolume.set(x, y, z, color);

                        /*
                        let skip = false;
                        for (const intersectingShape of intersectingShapes) {
                            if (intersectingShape.insideSphereBounds(x, y, z)) {
                                skip = true;
                                break;
                            }
                        }
                        
                        if (skip) {
                            const color = ARGB.color(255, 220, clamp(y / maxY * 255, 0, 255), 100);
                            MEGA_VOLUME.set(x, y, z, color);
                        }
                        */
                        //else {
                        //  const { dist, closestHash, specialHash } = getNoise(x, y, z);
                        // const noiseValue = dist + 1;
                        // if (noiseValue >= borderThreshold) {
                        //    const color = ARGB.color(255, 220, clamp(y / maxY * 255, 0, 255), 100);
                        //    chunkedVolume.set(x, y, z, color);
                        // }
                        //}
                    }
                }
            }
        }

        //subtractiveShapes.length = 0;
        for (const shape of subtractiveShapes) {
            var aabb = shape.getAABB().map(x => Math.round(x));
            for (let z = aabb.minZ; z < aabb.maxZ; z++) {
                for (let y = aabb.minY; y < aabb.maxY; y++) {
                    for (let x = aabb.minX; x < aabb.maxX; x++) {
                        if (!shape.contains(x, y, z)) continue;
                        chunkedVolume.set(x, y, z, 0);
                    }
                }
            }
        }

        return chunkedVolume;
    }
}
