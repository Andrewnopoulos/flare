// First, let's create a more comprehensive easing system

/**
 * Easing function interface
 */
export interface EasingFunction {
    (t: number): number;
}

/**
 * Collection of easing functions
 */
export class Easing {
    // Linear
    static linear: EasingFunction = (t) => t;

    // Quadratic
    static easeInQuad: EasingFunction = (t) => t * t;
    static easeOutQuad: EasingFunction = (t) => t * (2 - t);
    static easeInOutQuad: EasingFunction = (t) =>
        t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    // Cubic
    static easeInCubic: EasingFunction = (t) => t * t * t;
    static easeOutCubic: EasingFunction = (t) => (--t) * t * t + 1;
    static easeInOutCubic: EasingFunction = (t) =>
        t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

    // Quartic
    static easeInQuart: EasingFunction = (t) => t * t * t * t;
    static easeOutQuart: EasingFunction = (t) => 1 - (--t) * t * t * t;
    static easeInOutQuart: EasingFunction = (t) =>
        t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;

    // Quintic
    static easeInQuint: EasingFunction = (t) => t * t * t * t * t;
    static easeOutQuint: EasingFunction = (t) => 1 + (--t) * t * t * t * t;
    static easeInOutQuint: EasingFunction = (t) =>
        t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;

    // Sinusoidal
    static easeInSine: EasingFunction = (t) => 1 - Math.cos(t * Math.PI / 2);
    static easeOutSine: EasingFunction = (t) => Math.sin(t * Math.PI / 2);
    static easeInOutSine: EasingFunction = (t) =>
        -(Math.cos(Math.PI * t) - 1) / 2;

    // Exponential
    static easeInExpo: EasingFunction = (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
    static easeOutExpo: EasingFunction = (t) => t === 1 ? 1 : -Math.pow(2, -10 * t) + 1;
    static easeInOutExpo: EasingFunction = (t) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        if (t < 0.5) return Math.pow(2, 10 * (2 * t - 1)) / 2;
        return (-Math.pow(2, -10 * (2 * t - 1)) + 2) / 2;
    };

    // Circular
    static easeInCirc: EasingFunction = (t) => 1 - Math.sqrt(1 - t * t);
    static easeOutCirc: EasingFunction = (t) => Math.sqrt(1 - (--t) * t);
    static easeInOutCirc: EasingFunction = (t) => {
        t *= 2;
        if (t < 1) return -0.5 * (Math.sqrt(1 - t * t) - 1);
        t -= 2;
        return 0.5 * (Math.sqrt(1 - t * t) + 1);
    };

    // Elastic
    static easeInElastic: EasingFunction = (t) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
    };
    static easeOutElastic: EasingFunction = (t) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
    };
    static easeInOutElastic: EasingFunction = (t) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        t *= 2;
        if (t < 1) {
            return -0.5 * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
        }
        return 0.5 * Math.pow(2, -10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI) + 1;
    };

    // Back
    static easeInBack: EasingFunction = (t) => {
        const s = 1.70158;
        return t * t * ((s + 1) * t - s);
    };
    static easeOutBack: EasingFunction = (t) => {
        const s = 1.70158;
        return (--t) * t * ((s + 1) * t + s) + 1;
    };
    static easeInOutBack: EasingFunction = (t) => {
        const s = 1.70158 * 1.525;
        t *= 2;
        if (t < 1) return 0.5 * (t * t * ((s + 1) * t - s));
        t -= 2;
        return 0.5 * (t * t * ((s + 1) * t + s) + 2);
    };

    // Bounce
    static easeOutBounce: EasingFunction = (t) => {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            t -= 1.5 / 2.75;
            return 7.5625 * t * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            t -= 2.25 / 2.75;
            return 7.5625 * t * t + 0.9375;
        } else {
            t -= 2.625 / 2.75;
            return 7.5625 * t * t + 0.984375;
        }
    };
    static easeInBounce: EasingFunction = (t) => 1 - Easing.easeOutBounce(1 - t);
    static easeInOutBounce: EasingFunction = (t) =>
        t < 0.5
            ? Easing.easeInBounce(t * 2) * 0.5
            : Easing.easeOutBounce(t * 2 - 1) * 0.5 + 0.5;

    // Custom bezier curve easing
    static bezier(x1: number, y1: number, x2: number, y2: number): EasingFunction {
        // This is a simplified implementation of the cubic bezier function
        // A more accurate implementation would use Newton-Raphson iterations
        return function (t: number) {
            if (t === 0) return 0;
            if (t === 1) return 1;

            // Calculate the polynomial coefficients
            const cx = 3 * x1;
            const bx = 3 * (x2 - x1) - cx;
            const ax = 1 - cx - bx;

            const cy = 3 * y1;
            const by = 3 * (y2 - y1) - cy;
            const ay = 1 - cy - by;

            // Use parametric function of the form (at^3 + bt^2 + ct)
            const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
            const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;

            // Solve for t iteratively (simplified approximation)
            let t2 = t;
            for (let i = 0; i < 8; i++) {
                const x2 = sampleCurveX(t2) - t;
                if (Math.abs(x2) < 1e-6) {
                    return sampleCurveY(t2);
                }
                const d2 = (3 * ax * t2 + 2 * bx) * t2 + cx;
                if (Math.abs(d2) < 1e-6) break;
                t2 = t2 - x2 / d2;
            }

            // Fall back to bisection method
            let t0 = 0;
            let t1 = 1;
            t2 = t;

            while (t0 < t1) {
                const x2 = sampleCurveX(t2);
                if (Math.abs(x2 - t) < 1e-6) {
                    return sampleCurveY(t2);
                }
                if (t > x2) {
                    t0 = t2;
                } else {
                    t1 = t2;
                }
                t2 = (t1 - t0) * 0.5 + t0;
            }

            // Give up
            return sampleCurveY(t2);
        };
    }

    // Map string names to easing functions
    static getEasingFunction(name: string): EasingFunction {
        const easingMap: { [key: string]: EasingFunction } = {
            'linear': Easing.linear,

            'ease-in': Easing.easeInQuad,
            'ease-out': Easing.easeOutQuad,
            'ease-in-out': Easing.easeInOutQuad,

            'ease-in-quad': Easing.easeInQuad,
            'ease-out-quad': Easing.easeOutQuad,
            'ease-in-out-quad': Easing.easeInOutQuad,

            'ease-in-cubic': Easing.easeInCubic,
            'ease-out-cubic': Easing.easeOutCubic,
            'ease-in-out-cubic': Easing.easeInOutCubic,

            'ease-in-quart': Easing.easeInQuart,
            'ease-out-quart': Easing.easeOutQuart,
            'ease-in-out-quart': Easing.easeInOutQuart,

            'ease-in-quint': Easing.easeInQuint,
            'ease-out-quint': Easing.easeOutQuint,
            'ease-in-out-quint': Easing.easeInOutQuint,

            'ease-in-sine': Easing.easeInSine,
            'ease-out-sine': Easing.easeOutSine,
            'ease-in-out-sine': Easing.easeInOutSine,

            'ease-in-expo': Easing.easeInExpo,
            'ease-out-expo': Easing.easeOutExpo,
            'ease-in-out-expo': Easing.easeInOutExpo,

            'ease-in-circ': Easing.easeInCirc,
            'ease-out-circ': Easing.easeOutCirc,
            'ease-in-out-circ': Easing.easeInOutCirc,

            'ease-in-elastic': Easing.easeInElastic,
            'ease-out-elastic': Easing.easeOutElastic,
            'ease-in-out-elastic': Easing.easeInOutElastic,

            'ease-in-back': Easing.easeInBack,
            'ease-out-back': Easing.easeOutBack,
            'ease-in-out-back': Easing.easeInOutBack,

            'ease-in-bounce': Easing.easeInBounce,
            'ease-out-bounce': Easing.easeOutBounce,
            'ease-in-out-bounce': Easing.easeInOutBounce
        };

        return easingMap[name] || Easing.linear;
    }
}