export class VoxelVolume {
    isDirty = true;
    #fillCount = 0;
    #sizeX;
    #sizeY;
    #sizeZ;

    constructor(sizeX, sizeY, sizeZ) {
        this.#sizeX = sizeX;
        this.#sizeY = sizeY;
        this.#sizeZ = sizeZ;
    }

    get sizeX() {
        return this.#sizeX;
    }

    get sizeY() {
        return this.#sizeY;
    }

    get sizeZ() {
        return this.#sizeZ;
    }

    /**
     * @returns {int}
     */
    size() {
        return this.#sizeX * this.#sizeY * this.#sizeZ;
    }

    /**
     * @param {int} x 
     * @param {int} y 
     * @param {int} z 
     * @return {int}
     */
    linearize(x, y, z) {
        return x + (y * this.#sizeX) + (z * this.#sizeX * this.#sizeY);
    }

    /**
     * @param {int} index 
     * @return {[int, int, int]}
     */
    delinearize(index) {
        const z = ~~(index / (this.#sizeX * this.#sizeY)); //truncate float to 32 bit integer
        index -= z * (this.#sizeX * this.#sizeY);

        const y = ~~(index / this.#sizeX); //truncate float to 32 bit integer
        index -= y * this.#sizeX;

        const x = index;

        return [x, y, z];
    }

    /**
     * @return {boolean}
     */
    isEmpty() {
        return this.#fillCount <= 0;
    }

    updateFillCounter(prevValue, value) {
        if (value === 0) {

            if (prevValue !== 0) {
                this.#fillCount -= 1;

                if (this.#fillCount < 0) {
                    this.#fillCount = 0;
                }
            }
            return;
        }

        if (prevValue === 0) {
            this.#fillCount += 1;
        }
    }

    unsafeSetFillCount(count) {
        this.#fillCount = count;
    }

    clear() {
        this.#fillCount = 0;
    }

    /**
     * @param {int} x 
     * @param {int} y 
     * @param {int} z 
     * @return {*}
     */
    get(x, y, z) { }

    /**
     * @param {int} x 
     * @param {int} y 
     * @param {int} z 
     * @param {*} value 
     */
    set(x, y, z, value) { }

    /**
     * @return {int[]}
     */
    getAABB() { }

    /**
     * @return {int[]}
     */
    toArray() { }

}

export class SparseVolume extends VoxelVolume {
    /**
     * @type {Map<string,any>}
     */
    #dataMap = new Map();

    #aabb = undefined;

    constructor() {
        super();
    }

    get(x, y, z) {
        if (this.isEmpty()) return 0;

        const key = [x, y, z].join(",");
        const value = this.#dataMap.get(key);
        return !value ? 0 : value;
    }

    set(x, y, z, value) {
        const key = [x, y, z].join(",");

        const prevValue = this.#dataMap.get(key);
        this.#dataMap.set(key, value);
        
        this.#aabb = undefined;
        this.isDirty = true;

        this.updateFillCounter(prevValue, value);
    }

    clear() {
        super.clear();
        this.#dataMap = new Map();
        this.#aabb = undefined;
        this.isDirty = true;
    }

    getAABB() {
        if (this.#aabb === undefined) {
            this.#aabb = this.#computeAxisAlignedBoundingBox();
        }
        return this.#aabb;
    }

    #computeAxisAlignedBoundingBox() {
        let minX = 0;
        let maxX = 0;
        let minY = 0;
        let maxY = 0;
        let minZ = 0;
        let maxZ = 0;

        for (const [key, value] of this.#dataMap) {
            let [x, y, z] = key.split(",");
            x = parseInt(x);
            y = parseInt(y);
            z = parseInt(z);

            if (x > maxX) {
                maxX = x;
            }
            if (y > maxY) {
                maxY = y;
            }
            if (z > maxZ) {
                maxZ = z;
            }
            if (x < minX) {
                minX = x;
            }
            if (y < minY) {
                minY = y;
            }
            if (z < minZ) {
                minZ = z;
            }
        }

        const sizeX = maxX - minX + 1;
        const sizeY = maxY - minY + 1;
        const sizeZ = maxZ - minZ + 1;

        return [minX, minY, minZ, sizeX, sizeY, sizeZ]
    }

    /**
     * @returns {DenseVolume}
     */
    toDenseVolume() {
        const [minX, minY, minZ, sizeX, sizeY, sizeZ] = this.getAABB();
        const denseVolume = new DenseVolume(sizeX, sizeY, sizeZ);

        for (const [key, value] of this.#dataMap) {
            let [x, y, z] = key.split(",");
            x = parseInt(x) + -minX;
            y = parseInt(y) + -minY;
            z = parseInt(z) + -minZ;
            denseVolume.set(x, y, z, value);
        }

        return denseVolume;
    }

    toArray() {
        return this.toDenseVolume.toArray();
    }
}

export class DenseVolume extends VoxelVolume {

    /**
     * @type {Array<Number>}
     */
    #voxels;

    constructor(sizeX, sizeY, sizeZ) {
        super(sizeX, sizeY, sizeZ);
        this.#voxels = new Int32Array(sizeX * sizeY * sizeZ).fill(0);
    }

    get(x, y, z) {
        if (this.isEmpty()) return 0;

        const index = this.linearize(x, y, z);
        const value = this.#voxels[index];
        return !value ? 0 : value;
    }

    set(x, y, z, value) {
        const index = this.linearize(x, y, z);

        const prevValue = this.#voxels[index];
        this.#voxels[index] = value;

        this.isDirty = true;
        this.updateFillCounter(prevValue, value);
    }

    getAABB() {
        return [0, 0, 0, this.sizeX, this.sizeY, this.sizeZ];
    }

    clear() {
        super.clear();
        this.#voxels = new Array(this.sizeX * this.sizeY * this.sizeZ).fill(0);
        this.isDirty = true;
    }

    toArray() {
        return this.#voxels;
    }

    toArrayBuffer() {
        return new Int32Array(this.#voxels).buffer;
    }

    /**
     * @param {ArrayBuffer} buffer 
     */
    static fromArrayBuffer(buffer, sizeX, sizeY, sizeZ) {
        const voxels = Array.from(new Int32Array(buffer));
        const fillCount = voxels.reduce((total, voxel) => voxel !== 0 ? total + 1 : total, 0);

        const volume = new DenseVolume(sizeX, sizeY, sizeZ);
        volume.#voxels = voxels;
        volume.unsafeSetFillCount(fillCount);
        
        return volume;
    }
}

export class ChunkedVolume extends VoxelVolume {

    #chunkSize = 16;

    /**
     * @type {Map<number,VoxelVolume>}
     */
    #chunks = new Map();

    /**
     * @type {number[]}
     */
    #aabb = undefined;

    constructor() {
        super();
    }

    get chunkSize() {
        return this.#chunkSize;
    }

    toChunkPos(x, y, z) {
        const math = Math;
        
        return [
            math.floor(x / this.#chunkSize),
            math.floor(y / this.#chunkSize),
            math.floor(z / this.#chunkSize),
        ];
    }

    #getChunkKey(x, y, z) {
        const math = Math;

        x = math.floor(x / this.#chunkSize);
        y = math.floor(y / this.#chunkSize);
        z = math.floor(z / this.#chunkSize);

        return this.#linearize(x, y, z);
    }

    #fastFloor(v) {
        return ~~(v + 10240) - 10240;
    }

    #chunkPosFromKey(key) {
        return this.#delinearize(key);
    }

    #linearize(x, y, z) {
        const size = 1024;
        const halfSize = 512;
        return (x + halfSize) + ((y + halfSize) * size) + ((z + halfSize) * size * size);
    }

    #delinearize(index) {
        const size = 1024;
        const halfSize = 512;

        const z = ~~(index / (size * size)); //truncate float to 32 bit integer
        index -= z * (size * size);

        const y = ~~(index / size); //truncate float to 32 bit integer
        index -= y * size;

        const x = index;

        return [x - halfSize, y - halfSize, z - halfSize];
    }

    /**
     * @param {int} x 
     * @param {int} y 
     * @param {int} z 
     * @returns {VoxelVolume}
     */
    #getOrCreateChunkAtPos(x, y, z) {
        const key = this.#getChunkKey(x, y, z);

        let chunk = this.#chunks.get(key);
        if (chunk === undefined) {
            chunk = new DenseVolume(this.#chunkSize, this.#chunkSize, this.#chunkSize);
            this.#chunks.set(key, chunk);
            this.#aabb = undefined;
        }
        return chunk;
    }

    #getChunkAtPos(x, y, z) {
        const key = this.#getChunkKey(x, y, z);
        return this.#chunks.get(key);
    }

    set(x, y, z, value) {
        const chunk = this.#getOrCreateChunkAtPos(x, y, z);
        x = x & (this.#chunkSize - 1);
        y = y & (this.#chunkSize - 1);
        z = z & (this.#chunkSize - 1);
        chunk.set(x, y, z, value);
        
        this.isDirty = true;
    }

    get(x, y, z) {
        const chunk = this.#getChunkAtPos(x, y, z);

        if (chunk === undefined) return 0;

        x = x & (this.#chunkSize - 1);
        y = y & (this.#chunkSize - 1);
        z = z & (this.#chunkSize - 1);
        return chunk.get(x, y, z);
    }

    clear() {
        super.clear();
        this.#chunks = new Map();
        this.#aabb = undefined;
        this.isDirty = true;
    }

    getAABB() {
        if (!this.#aabb) {
            this.#aabb = this.#computeAxisAlignedBoundingBox();
        }
        return this.#aabb;
    }

    #computeAxisAlignedBoundingBox() {
        let minX = 0;
        let maxX = 0;
        let minY = 0;
        let maxY = 0;
        let minZ = 0;
        let maxZ = 0;

        for (const [key, value] of this.#chunks) {
            let [x, y, z] = this.#chunkPosFromKey(key);
            x = x * this.#chunkSize;
            y = y * this.#chunkSize;
            z = z * this.#chunkSize;

            if (x < minX) {
                minX = x;
            }
            if (y < minY) {
                minY = y;
            }
            if (z < minZ) {
                minZ = z;
            }

            x += (this.#chunkSize - 1);
            y += (this.#chunkSize - 1);
            z += (this.#chunkSize - 1);

            if (x > maxX) {
                maxX = x;
            }
            if (y > maxY) {
                maxY = y;
            }
            if (z > maxZ) {
                maxZ = z;
            }
        }

        const sizeX = maxX - minX + 1;
        const sizeY = maxY - minY + 1;
        const sizeZ = maxZ - minZ + 1;

        return [minX, minY, minZ, sizeX, sizeY, sizeZ]
    }

    /**
     * @param {([x, y, z]: [number, number, number], volume: VoxelVolume) => void} consumer 
     */
    forEachChunk(consumer) {
        for (const [key, chunk] of this.#chunks) {
            let [x, y, z] = this.#chunkPosFromKey(key);

            //convert to world pos
            x = x * this.#chunkSize;
            y = y * this.#chunkSize;
            z = z * this.#chunkSize;

            consumer(x, y, z, chunk);
        }
    }
}