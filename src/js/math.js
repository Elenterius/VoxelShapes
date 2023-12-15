import { VoxelVolume } from "./VoxelVolume.js";

export function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

export function lerp(delta, start, end) {
    return start + delta * (end - start);
}

//https://easings.net/
export function easeInQuad(x) {
    return x * x;
}

export function easeOutQuad(x) {
    return 1 - (1 - x) * (1 - x);
}

export function easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

}

//https://easings.net/
export function easeInBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * x * x * x - c1 * x * x;
}

/**
 * generates a pseudo-random number within a range
 * @param {number} min 
 * @param {number} max 
 * @returns {number} random number
 */
export function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function countInscribedCircles(radius, subCircleRadius) {
    if (subCircleRadius > radius) return 0;

    let ratio = subCircleRadius / (radius - subCircleRadius);

    if (radius < subCircleRadius * 2) {
        return 1;
    }
    else {
        const subCircleAngle = Math.abs(Math.asin(ratio) * 180) / Math.PI;
        return 360 / (2 * Math.floor(subCircleAngle));
    }
}

export function countCirclesOnCircumference(radius, subCircleRadius) {
    //https://stackoverflow.com/questions/56004326/calculate-the-number-of-circles-that-fit-on-the-circumference-of-another-circle
    if (subCircleRadius > radius) return 0;
    return Math.PI / Math.asin(subCircleRadius / radius);
}

export class Vec3 {
    static ZERO = new Vec3(0, 0, 0);
    static ONE = new Vec3(1, 1, 1);
    static UP = new Vec3(0, 1, 0);
    static DOWN = new Vec3(0, -1, 0);

    /**
     * @type {number}
     */
    #x;

    /**
     * @type {number}
     */
    #y;

    /**
     * @type {number}
     */
    #z;

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     */
    constructor(x, y, z) {
        this.#x = x;
        this.#y = y;
        this.#z = z;
    }

    get x() {
        return this.#x;
    }

    get y() {
        return this.#y;
    }

    get z() {
        return this.#z;
    }

    /**
     * @param {Direction} direction 
     * @returns {Vec3}
     */
    addRelative(direction, steps = 1) {
        return new Vec3(this.#x + direction.normal.x * steps, this.#y + direction.normal.y * steps, this.#z + direction.normal.z * steps);
    }

    /**
     * @param {number} n 
     * @returns {Vec3}
     */
    addScalar(n) {
        return new Vec3(this.#x + n, this.#y + n, this.#z + n);
    }

    /**
     * @param {Vec3} other 
     * @returns {Vec3}
     */
    add(other) {
        return Vec3.add(this, other);
    }

    /**
     * @param {Vec3} other 
     * @returns {Vec3}
     */
    subtract(other) {
        return Vec3.subtract(this, other);
    }

    /**
     * multiply the vector by n
     * @param {number} n 
     * @returns {Vec3}
     */
    scale(n) {
        return new Vec3(this.#x * n, this.#y * n, this.#z * n);
    }

    /**
     * divide the vector by n
     * @param {number} n 
     * @returns {Vec3}
     */
    div(n) {
        return new Vec3(this.#x / n, this.#y / n, this.#z / n);
    }

    /**
     * @param {Vec3} other 
     */
    dot(other) {
        return Vec3.dot(this, other);
    }

    normalize() {
        var magnitude = this.length();
        if (magnitude > 0) {
            return this.div(magnitude);
        }
        return this;
    }

    /**
     * @returns magnitude squared
     */
    lengthSqr() {
        return this.#x * this.#x + this.#y * this.#y + this.#z * this.#z;
    }

    /**
     * @returns magnitude
     */
    length() {
        return Math.sqrt(this.#x * this.#x + this.#y * this.#y + this.#z * this.#z);
    }

    /**
     * @param {(v: number) => number} unaryOperator element-wise operator
     * @returns {Vec3}
     */
    map(unaryOperator) {
        return new Vec3(unaryOperator(this.#x), unaryOperator(this.#y), unaryOperator(this.#z));
    }

    /**
     * @param {Vec3} a 
     * @param {Vec3} b 
     * @returns {number} dot product
     */
    static dot(a, b) {
        return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
    }

    /**
     * @param {Vec3} a 
     * @param {Vec3} b 
     * @returns {Vec3} element-wise product
     */
    static scale(a, b) {
        return new Vec3(a.x * b.x, a.y * b.y, a.z * b.z);
    }

    /**
     * @param {Vec3} a 
     * @param {Vec3} b 
     * @returns {Vec3} element-wise division
     */
    static divScale(a, b) {
        return new Vec3(a.x / b.x, a.y / b.y, a.z / b.z);
    }

    /**
     * @param {Vec3} a 
     * @param {Vec3} b 
     * @returns {Vec3} element-wise min
     */
    static min(a, b) {
        return new Vec3(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
    }

    /**
     * @param {Vec3} a 
     * @param {Vec3} b 
     * @returns {Vec3} element-wise max
     */
    static max(a, b) {
        return new Vec3(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
    }

    /**
     * @param {Vec3} a 
     * @param {Vec3} b 
     * @returns {Vec3}
     */
    static add(a, b) {
        return new Vec3(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    /**
     * @param {Vec3} a 
     * @param {Vec3} b 
     * @returns {Vec3}
     */
    static subtract(a, b) {
        return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z);
    }
}

export class Direction {
    static NORTH = new Direction(0, new Vec3(0, 0, -1));
    static EAST = new Direction(1, new Vec3(1, 0, 0));
    static SOUTH = new Direction(2, new Vec3(0, 0, 1));
    static WEST = new Direction(3, new Vec3(-1, 0, 0));
    static UP = new Direction(4, new Vec3(0, 1, 0));
    static DOWN = new Direction(5, new Vec3(0, -1, 0));

    static VALUES = [Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST, Direction.UP, Direction.DOWN];

    static random() {
        return Direction.VALUES[Math.floor(Math.random() * Direction.VALUES.length)];
    }

    /**
     * @type {Vec3}
     */
    normal;

    /**
     * @param {number} ordinal 
     * @param {Vec3} normal 
     */
    constructor(ordinal, normal) {
        this.ordinal = ordinal;
        this.normal = normal;
    }

    isVertical() {
        return this.normal.y !== 0;
    }

    isHorizontal() {
        return this.normal.y === 0;
    }

    clockwiseY() {
        if (this.isVertical) return this;

        const len = Direction.VALUES.length;
        const index = (this.ordinal + 1) % len;
        return Direction.VALUES[index];
    }

    counterClockwiseY() {
        if (this.isVertical) return this;

        const len = Direction.VALUES.length;
        const index = (len + (this.ordinal - 1)) % len;
        return Direction.VALUES[index];
    }
}

export class AxisAlignedBoundingBox {
    minX;
    minY;
    minZ;
    maxX;
    maxY;
    maxZ;

    constructor(x1, y1, z1, x2, y2, z2) {
        this.minX = Math.min(x1, x2);
        this.minY = Math.min(y1, y2);
        this.minZ = Math.min(z1, z2);
        this.maxX = Math.max(x1, x2);
        this.maxY = Math.max(y1, y2);
        this.maxZ = Math.max(z1, z2);
    }

    /**
     * @param {VoxelVolume} volume 
     */
    static fromVolume(volume) {
        const [minX, minY, minZ, sizeX, sizeY, sizeZ] = volume.getAABB();
        return new AxisAlignedBoundingBox(minX, minY, minZ, minX + sizeX, minY + sizeY, minZ + sizeZ);
    }

    /**
     * @param {Vec3} vec 
     * @returns 
     */
    contains(vec) {
        return this.contains(vec.x, vec.y, vec.z);
    }

    contains(x, y, z) {
        return x >= this.minX && x < this.maxX && y >= this.minY && y < this.maxY && z >= this.minZ && z < this.maxZ;
    }

    getSize() {
        return [this.getXsize(), this.getYsize(), this.getZsize()];
    }

    getXsize() {
        return this.maxX - this.minX;
    }

    getYsize() {
        return this.maxY - this.minY;
    }

    getZsize() {
        return this.maxZ - this.minZ;
    }

    /**
     * @param {(v: number) => number} unaryOperator element-wise operator
     * @returns {AxisAlignedBoundingBox}
     */
    map(unaryOperator) {
        return new AxisAlignedBoundingBox(
            unaryOperator(this.minX), unaryOperator(this.minY), unaryOperator(this.minZ),
            unaryOperator(this.maxX), unaryOperator(this.maxY), unaryOperator(this.maxZ)
        );
    }

    /**
     * @param {AxisAlignedBoundingBox} aabb 
     * @returns 
     */
    intersects(aabb) {
        return this.intersects(aabb.minX, aabb.minY, aabb.minZ, aabb.maxX, aabb.maxY, aabb.maxZ);
    }

    intersects(minX, minY, minZ, maxX, maxY, maxZ) {
        return this.minX < maxX && this.maxX > minX && this.minY < maxY && this.maxY > minY && this.minZ < maxZ && this.maxZ > minZ;
    }

    static union(a, b) {
        const minX = Math.min(a.minX, b.minX);
        const minY = Math.min(a.minY, b.minY);
        const minZ = Math.min(a.minZ, b.minZ);
        const maxX = Math.max(a.maxX, b.maxX);
        const maxY = Math.max(a.maxY, b.maxY);
        const maxZ = Math.max(a.maxZ, b.maxZ);
        return new AxisAlignedBoundingBox(minX, minY, minZ, maxX, maxY, maxZ);
    }
}

export class Shape {

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {boolean}
     */
    contains(x, y, z) {
        return this.getAABB().contains(x, y, z);
    }

    /**
     * @returns {AxisAlignedBoundingBox}
     */
    getAABB() {
        return null;
    }
}

export class CuboidShape extends Shape {
    #aabb;

    constructor(x1, y1, z1, x2, y2, z2) {
        super();
        this.#aabb = new AxisAlignedBoundingBox(x1, y1, z1, x2, y2, z2);
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {boolean}
     */
    contains(x, y, z) {
        return this.#aabb.contains(x, y, z);
    }

    /**
     * @returns {AxisAlignedBoundingBox}
     */
    getAABB() {
        return this.#aabb;
    }
}

export class SphereShape extends Shape {
    #aabb;
    #origin;
    #radius;

    constructor(x, y, z, radius) {
        super();
        this.#origin = new Vec3(x, y, z);
        this.#radius = radius;
        this.#aabb = new AxisAlignedBoundingBox(x - radius, y - radius, z - radius, x + radius, y + radius, z + radius);
    }

    getRadius() {
        return this.#radius;
    }

    setRadius(radius) {
        this.#radius = radius;
        this.#aabb = new AxisAlignedBoundingBox(this.#origin.x - radius, this.#origin.y - radius, this.#origin.z - radius, this.#origin.x + radius, this.#origin.y + radius, this.#origin.z + radius);
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {boolean}
     */
    contains(x, y, z, sqrDistanceFunc = (dx, dy, dz) => dx * dx + dy * dy + dz * dz) {
        if (!this.#aabb.contains(x, y, z)) return;
        const dx = this.#origin.x - x;
        const dy = this.#origin.y - y;
        const dz = this.#origin.z - z;
        const distSqr = sqrDistanceFunc(dx, dy, dz);

        const radiusSqr = this.#radius * this.#radius;
        return distSqr < radiusSqr;
    }

    /**
     * @returns {AxisAlignedBoundingBox}
     */
    getAABB() {
        return this.#aabb;
    }
}

export class ConeShape extends Shape {
    #base;
    #tip;
    #baseRadius;
    #height;
    #aabb;

    /**
     * @param {Vec3} base 
     * @param {Vec3} tip apex
     * @param {number} baseRadius 
     */
    constructor(base, tip, baseRadius) {
        super();
        this.#base = base;
        this.#tip = tip;
        this.#baseRadius = baseRadius;

        const diff = tip.subtract(base);
        this.#height = diff.length();

        //https://iquilezles.org/articles/diskbbox/
        const hadamardProduct = Vec3.scale(diff, diff);
        const dotProduct = Vec3.dot(diff, diff);
        const hadamardDivision = hadamardProduct.map(v => v / dotProduct);
        const e = hadamardDivision.map(v => Math.sqrt(1.0 - v));
        const baseOffset = e.scale(baseRadius);
        const min = Vec3.min(base.subtract(baseOffset), tip);
        const max = Vec3.max(base.add(baseOffset), tip);

        this.#aabb = new AxisAlignedBoundingBox(min.x, min.y, min.z, max.x, max.y, max.z);
    }

    static createFromBaseAndHeight(x, y, z, height, baseRadius) {
        const base = new Vec3(x, y, z);
        const tip = new Vec3(x, y + height, z);
        return new ConeShape(base, tip, baseRadius);
    }

    static createFromBaseAndTip(x1, y1, z1, x2, y2, z2, baseRadius) {
        const base = new Vec3(x1, y1, z1);
        const tip = new Vec3(x2, y2, z2);
        return new ConeShape(base, tip, baseRadius);
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {boolean}
     */
    contains(x, y, z) {
        if (!this.#aabb.contains(x, y, z)) return false;

        const pos = new Vec3(x, y, z);
        const dir = this.#base.subtract(this.#tip).normalize();

        const diff = pos.subtract(this.#tip);
        const coneDist = diff.dot(dir);

        if (coneDist < 0) return false;
        if (coneDist > this.#height) return false;

        const coneRadius = (coneDist / this.#height) * this.#baseRadius;
        const coneRadiusSqr = coneRadius * coneRadius;

        const orthDiff = diff.subtract(dir.scale(coneDist));
        const orthogonalDistSqr = orthDiff.lengthSqr();

        return orthogonalDistSqr < coneRadiusSqr;
    }

    /**
     * @returns {AxisAlignedBoundingBox}
     */
    getAABB() {
        return this.#aabb;
    }
}

export class CylinderShape extends Shape {
    #base;
    #tip;
    #radius;
    #height;
    #aabb;

    /**
     * @param {Vec3} base 
     * @param {Vec3} tip apex
     * @param {number} radius 
     */
    constructor(base, tip, radius) {
        super();
        this.#base = base;
        this.#tip = tip;
        this.#radius = radius;

        const diff = tip.subtract(base);
        this.#height = diff.length();

        //https://iquilezles.org/articles/diskbbox/
        const hadamardProduct = Vec3.scale(diff, diff);
        const dotProduct = Vec3.dot(diff, diff);
        const hadamardDivision = hadamardProduct.map(v => v / dotProduct);
        const e = hadamardDivision.map(v => radius * Math.sqrt(1.0 - v));

        const min = Vec3.min(base.subtract(e), tip.subtract(e));
        const max = Vec3.max(base.add(e), tip.add(e));

        this.#aabb = new AxisAlignedBoundingBox(min.x, min.y, min.z, max.x, max.y, max.z);
    }

    static createFromBaseAndHeight(x, y, z, height, radius) {
        const base = new Vec3(x, y, z);
        const tip = new Vec3(x, y + height, z);
        return new CylinderShape(base, tip, radius);
    }

    static createFromBaseAndTip(x1, y1, z1, x2, y2, z2, radius) {
        const base = new Vec3(x1, y1, z1);
        const tip = new Vec3(x2, y2, z2);
        return new CylinderShape(base, tip, radius);
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {boolean}
     */
    contains(x, y, z) {
        if (!this.#aabb.contains(x, y, z)) return false;

        const pos = new Vec3(x, y, z);
        const dir = this.#base.subtract(this.#tip).normalize();

        const diff = pos.subtract(this.#tip);
        const coneDist = diff.dot(dir);

        if (coneDist < 0) return false;
        if (coneDist > this.#height) return false;

        const radiusSqr = this.#radius * this.#radius;

        const orthDiff = diff.subtract(dir.scale(coneDist));
        const orthogonalDistSqr = orthDiff.lengthSqr();

        return orthogonalDistSqr < radiusSqr;
    }

    /**
     * @returns {AxisAlignedBoundingBox}
     */
    getAABB() {
        return this.#aabb;
    }
}

export class EllipticShape extends Shape {
    #base;
    #tip;
    #baseRadius;
    #height;
    #aabb;

    /**
     * @param {Vec3} base 
     * @param {Vec3} tip apex
     * @param {number} baseRadius 
     */
    constructor(base, tip, baseRadius) {
        super();
        this.#base = base;
        this.#tip = tip;
        this.#baseRadius = baseRadius;

        const diff = tip.subtract(base);
        this.#height = diff.length();

        const mid = base.add(diff.normalize().scale(this.#height / 2));
        const offset = baseRadius + this.#height / 2;

        this.#aabb = new AxisAlignedBoundingBox(mid.x - offset, mid.y - offset, mid.z - offset, mid.x + offset, mid.y + offset, mid.z + offset);
    }

    static createFromBaseAndHeight(x, y, z, height, baseRadius) {
        const base = new Vec3(x, y, z);
        const tip = new Vec3(x, y + height, z);
        return new EllipticShape(base, tip, baseRadius);
    }

    static createFromBaseAndTip(x1, y1, z1, x2, y2, z2, baseRadius) {
        const base = new Vec3(x1, y1, z1);
        const tip = new Vec3(x2, y2, z2);
        return new EllipticShape(base, tip, baseRadius);
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {boolean}
     */
    contains(x, y, z) {
        if (!this.#aabb.contains(x, y, z)) return false;

        const pos = new Vec3(x, y, z);
        const dir = this.#base.subtract(this.#tip).normalize();

        const diff = pos.subtract(this.#tip);
        const dist = diff.dot(dir);

        if (dist < 0) return false;
        if (dist > this.#height) return false;

        //https://www.mathematische-basteleien.de/eggcurves.htm
        //const f = x => Math.sqrt(Math.abs(Math.sin(x*Math.PI)+0.1*Math.sin(2*x*Math.PI)));

        const f = x => {
            x = x * 2.767 - 0.767;
            return Math.sqrt(2 ** x - x ** 2) / 0.767;
        };

        const t = dist / this.#height;
        const radius = lerp(f(t), 0, this.#baseRadius);
        const maxRadiusSqr = radius ** 2;
        const minRadiusSqr = (radius - 2) ** 2;

        const orthDiff = diff.subtract(dir.scale(dist));
        const orthogonalDistSqr = orthDiff.lengthSqr();

        return orthogonalDistSqr < maxRadiusSqr && orthogonalDistSqr > minRadiusSqr;
    }

    /**
     * @returns {AxisAlignedBoundingBox}
     */
    getAABB() {
        return this.#aabb;
    }
}

export class TriAxialEllipsoidShape extends Shape {
    #aabb;
    #origin;
    #a;
    #b;
    #c;

    constructor(x, y, z, a, b, c) {
        super();
        this.#origin = new Vec3(x, y, z);
        this.#a = a;
        this.#b = b;
        this.#c = c;
        this.#aabb = new AxisAlignedBoundingBox(x - a, y - b, z - c, x + a, y + b, z + c);
    }

    getRadius() {
        return 1;
    }

    setRadius(a, b, c) {
        this.#a = a;
        this.#b = b;
        this.#c = c;
        this.#aabb = new AxisAlignedBoundingBox(this.#origin.x - a, this.#origin.y - b, this.#origin.z - c, this.#origin.x + a, this.#origin.y + b, this.#origin.z + c);
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {boolean}
     */
    contains(x, y, z, sqrDistanceFunc = (dx, dy, dz) => dx * dx + dy * dy + dz * dz) {
        if (!this.#aabb.contains(x, y, z)) return false;

        const dx = this.#origin.x - x;
        const dy = this.#origin.y - y;
        const dz = this.#origin.z - z;

        const a = this.#a;
        const b = this.#b;
        const c = this.#c;

        const distSqr = sqrDistanceFunc(dx / a, dy / b, dz / c); // (x**2/a**2) + (d**2/b**2) + (d**2/c**2) = 1

        const radiusSqr = 1;
        return distSqr < radiusSqr;
    }

    /**
     * @returns {AxisAlignedBoundingBox}
     */
    getAABB() {
        return this.#aabb;
    }
}

export class OctantEllipsoidShape extends Shape {
    #aabb;
    #origin;
    #aPos;
    #bPos;
    #cPos;
    #aNeg;
    #bNeg;
    #cNeg;

    constructor(x, y, z, aPos, bPos, cPos, aNeg, bNeg, cNeg) {
        super();
        this.#origin = new Vec3(x, y, z);
        this.#aPos = aPos;
        this.#bPos = bPos;
        this.#cPos = cPos;
        this.#aNeg = aNeg;
        this.#bNeg = bNeg;
        this.#cNeg = cNeg;
        this.#aabb = new AxisAlignedBoundingBox(x - aNeg, y - bNeg, z - cNeg, x + aPos, y + bPos, z + cPos);
    }

    getRadius() {
        return 1;
    }

    setRadius(aP, bP, cP, aN, bN, cN) {
        this.#aPos = aP;
        this.#bPos = bP;
        this.#cPos = cP;
        this.#aNeg = aN;
        this.#bNeg = bN;
        this.#cNeg = cN;
        this.#aabb = new AxisAlignedBoundingBox(this.#origin.x - aN, this.#origin.y - bN, this.#origin.z - cN, this.#origin.x + aP, this.#origin.y + bP, this.#origin.z + cP);
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {boolean}
     */
    contains(x, y, z, sqrDistanceFunc = (dx, dy, dz) => dx * dx + dy * dy + dz * dz) {
        if (!this.#aabb.contains(x, y, z)) return false;

        const dx = this.#origin.x - x;
        const dy = this.#origin.y - y;
        const dz = this.#origin.z - z;

        const a = dx <= 0 ? this.#aPos : this.#aNeg;
        const b = dy <= 0 ? this.#bPos : this.#bNeg;
        const c = dz <= 0 ? this.#cPos : this.#cNeg;

        const distSqr = sqrDistanceFunc(dx / a, dy / b, dz / c); // (x**2/a**2) + (d**2/b**2) + (d**2/c**2) = 1

        const radiusSqr = 1;
        return distSqr < radiusSqr;
    }

    /**
     * @returns {AxisAlignedBoundingBox}
     */
    getAABB() {
        return this.#aabb;
    }
}

export class CompoundShape extends Shape {
    #aabb;
    #shapes;

    /**
     * @param {Shape[]} shapes 
     */
    constructor(shapes) {
        super();
        const min = { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY, z: Number.POSITIVE_INFINITY };
        const max = { x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY, z: Number.NEGATIVE_INFINITY };

        for (const shape of shapes) {
            const aabb = shape.getAABB();
            if (aabb.minX < min.x) min.x = aabb.minX;
            if (aabb.minY < min.y) min.y = aabb.minY;
            if (aabb.minZ < min.z) min.z = aabb.minZ;
            if (aabb.maxX > max.x) max.x = aabb.maxX;
            if (aabb.maxY > max.y) max.y = aabb.maxY;
            if (aabb.maxZ > max.z) max.z = aabb.maxZ;
        }
        this.#aabb = new AxisAlignedBoundingBox(min.x, min.y, min.z, max.x, max.y, max.z);

        this.#shapes = shapes;
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {boolean}
     */
    contains(x, y, z /*, sqrDistanceFunc = (dx, dy, dz) => dx * dx + dy * dy + dz * dz */) {
        if (!this.#aabb.contains(x, y, z)) return false;

        for (const shape of this.#shapes) {
            if (shape.contains(x, y, z)) {
                return true;
            }
        }

        return false;
    }

    insideSphereBounds(x, y, z) {
        const a = this.#aabb.getXsize() / 2;
        const b = this.#aabb.getYsize() / 2;
        const c = this.#aabb.getZsize() / 2;

        const ox = this.#aabb.minX + a;
        const oy = this.#aabb.minY + b;
        const oz = this.#aabb.minZ + c;

        let dx = (ox - x) / a;
        let dy = (oy - y) / b;
        let dz = (oz - z) / c;

        return (dx * dx + dy * dy + dz * dz) < 1;
    }

    /**
     * @returns {AxisAlignedBoundingBox}
     */
    getAABB() {
        return this.#aabb;
    }
}