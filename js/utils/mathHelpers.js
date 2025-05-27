// Math Helpers and Constants

export const CONSTANTS = {
    C: 299792458, // Speed of light in m/s
    PI: Math.PI,
    METER_TO_INCH: 39.3701,
    INCH_TO_METER: 0.0254,
    DEG_TO_RAD: Math.PI / 180,
    RAD_TO_DEG: 180 / Math.PI
};

export const MathHelpers = {
    // Angle conversions
    degToRad(degrees) {
        return degrees * CONSTANTS.DEG_TO_RAD;
    },

    radToDeg(radians) {
        return radians * CONSTANTS.RAD_TO_DEG;
    },

    // Polar to Cartesian conversion
    polarToCartesian(r, theta) {
        return {
            x: r * Math.cos(theta),
            y: r * Math.sin(theta)
        };
    },

    // Cartesian to Polar conversion
    cartesianToPolar(x, y) {
        return {
            r: Math.sqrt(x * x + y * y),
            theta: Math.atan2(y, x)
        };
    },

    // Distance between two points
    distance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // Linear interpolation
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    // Map value from one range to another
    mapRange(value, inMin, inMax, outMin, outMax) {
        return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
    },

    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    // Round to specified decimal places
    round(value, decimals) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    },

    // Format number with specified decimal places
    formatNumber(value, decimals = 2) {
        return value.toFixed(decimals);
    },

    // Format number with engineering notation
    formatEngineering(value) {
        const exponent = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
        const mantissa = value / Math.pow(10, exponent);
        
        const prefixes = {
            '-12': 'p',
            '-9': 'n',
            '-6': 'μ',
            '-3': 'm',
            '0': '',
            '3': 'k',
            '6': 'M',
            '9': 'G',
            '12': 'T'
        };
        
        const prefix = prefixes[exponent.toString()] || `e${exponent}`;
        return `${mantissa.toFixed(2)}${prefix}`;
    }
};