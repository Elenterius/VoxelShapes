export class ARGB {
    /**
     * @param {int} color 
     * @returns {int} 
     */
    static alpha(color) {
        return color >>> 24;
    }

    /**
     * @param {int} color 
     * @returns {int} 
     */
    static red(color) {
        return color >> 16 & 255;
    }

    /**
     * @param {int} color 
     * @returns {int} 
     */
    static green(color) {
        return color >> 8 & 255;
    }

    /**
     * @param {int} color 
     * @returns {int} 
     */
    static blue(color) {
        return color & 255;
    }

    /**
     * @param {int} alpha 
     * @param {int} red 
     * @param {int} green 
     * @param {int} blue 
     * @returns {int} 
     */
    static color(alpha, red, green, blue) {
        return alpha << 24 | red << 16 | green << 8 | blue;
    }

    /**
     * @param {int} color 
     * @returns {int} 
     */
    static removeAlpha(color) {
        return 0 << 24 | ARGB.red(color) << 16 | ARGB.green(color) << 8 | ARGB.blue(color);
    }

    /**
     * @param {int} colorA 
     * @param {int} colorB 
     * @returns 
     */
    static multiply(colorA, colorB) {
        const alpha = Math.floor(ARGB.alpha(colorA) * ARGB.alpha(colorB) / 255);
        const red = Math.floor(ARGB.red(colorA) * ARGB.red(colorB) / 255);
        const green = Math.floor(ARGB.green(colorA) * ARGB.green(colorB) / 255);
        const blue = Math.floor(ARGB.blue(colorA) * ARGB.blue(colorB) / 255);
        return ARGB.color(alpha, red, green, blue);
    }
}