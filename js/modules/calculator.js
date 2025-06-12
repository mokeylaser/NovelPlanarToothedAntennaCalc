// Antenna Calculator Module
import { CONSTANTS } from '../utils/mathHelpers.js';

// ───────── FEED-GAP Rule-of-Thumb ─────────
export function calcFeedGapMeters({ epsilonEff, freqHz, C = CONSTANTS.C }) {
    // λ0 in meters
    const lambda0 = C / freqHz;
    return 0.02066 * lambda0 / Math.sqrt(epsilonEff);
}
// ──────────────────────────────────────────
// Antenna Calculator Module

export class AntennaCalculator {
    constructor() {
        this.C = CONSTANTS.C; // Speed of light
        this.PI = CONSTANTS.PI;
        this.METER_TO_INCH = CONSTANTS.METER_TO_INCH;
    }

    calculate(params, inputMode) {
        let r1;
        
        if (inputMode === 'r1') {
            r1 = params.r1;
        } else {
            // Calculate r1 from f1
            r1 = this.calculateR1FromF1(params);
        }
        
        // Calculate results for all tooth pairs
        const results = [];
        let rn = r1;
        
        for (let n = 1; n <= params.toothPairs; n++) {
            const fn = this.calculateFrequency(rn, params);
            
            results.push({
                n: n,
                rn: rn,
                rnInches: rn * this.METER_TO_INCH,
                fn: fn,
                fnDisplay: this.convertFrequency(fn, params.outputUnit)
            });
            
            // Update rn for next tooth pair
            rn = rn * params.gamma;
        }
        const feedGap = calcFeedGapMeters({
            epsilonEff: params.Eeff,
             freqHz: results[0].fn, // Should already be in Hz
        });
       return { results, feedGap: Number(feedGap) };        // <── wrapped object now
    }
    
    // Calculate r1 from f1 and other parameters
    calculateR1FromF1(params) {
        // Convert f1 to Hz
        const f1Hz = this.convertToHz(params.f1, params.f1Unit);
        
        // Convert angle to radians
        const alphaRad = params.alpha * (this.PI / 180);
        
        // Calculate square roots
        const sqrtGamma = Math.sqrt(params.gamma);
        const sqrtEeff = Math.sqrt(params.Eeff);
        
        // Calculate denominator constant
        const denomConst = (1 + sqrtGamma) * alphaRad + (sqrtGamma - 1);
        
        // Calculate r1
        const r1 = this.C / (2 * f1Hz * denomConst * sqrtEeff);
        
        return r1;
    }

    calculateFrequency(rn, params) {
        // Convert angle to radians
        const alphaRad = params.alpha * (this.PI / 180);
        
        // Calculate square roots
        const sqrtGamma = Math.sqrt(params.gamma);
        const sqrtEeff = Math.sqrt(params.Eeff);
        
        // Calculate denominator
        const denominator = 2 * (rn * (1 + sqrtGamma) * alphaRad + rn * (sqrtGamma - 1)) * sqrtEeff;
        
        // Calculate frequency in Hz
        const fn = this.C / denominator;
        
        return fn;
    }

    convertToHz(frequency, unit) {
        switch (unit) {
            case 'Hz':
                return frequency;
            case 'kHz':
                return frequency * 1e3;
            case 'MHz':
                return frequency * 1e6;
            case 'GHz':
                return frequency * 1e9;
            default:
                return frequency;
        }
    }

    convertFrequency(frequencyHz, unit) {
        switch (unit) {
            case 'Hz':
                return frequencyHz;
            case 'kHz':
                return frequencyHz / 1e3;
            case 'MHz':
                return frequencyHz / 1e6;
            case 'GHz':
                return frequencyHz / 1e9;
            default:
                return frequencyHz;
        }
    }

    // Additional calculation methods for future enhancements
    calculateBandwidth(f1, fn) {
        return fn / f1;
    }

    calculateLogPeriod(gamma) {
        return Math.log(gamma);
    }

    calculateToothOuterRadius(rn, gamma) {
        return rn * Math.sqrt(gamma);
    }

    calculateToothCoordinates(rn, alpha, gamma, toothIndex) {
        const alphaRad = alpha * (this.PI / 180);
        const outerRadius = this.calculateToothOuterRadius(rn, gamma);
        
        // Calculate tooth coordinates
        const innerX1 = rn * Math.cos(-alphaRad / 2);
        const innerY1 = rn * Math.sin(-alphaRad / 2);
        const innerX2 = rn * Math.cos(alphaRad / 2);
        const innerY2 = rn * Math.sin(alphaRad / 2);
        
        const outerX1 = outerRadius * Math.cos(-alphaRad / 2);
        const outerY1 = outerRadius * Math.sin(-alphaRad / 2);
        const outerX2 = outerRadius * Math.cos(alphaRad / 2);
        const outerY2 = outerRadius * Math.sin(alphaRad / 2);
        
        return {
            inner: [
                { x: innerX1, y: innerY1 },
                { x: innerX2, y: innerY2 }
            ],
            outer: [
                { x: outerX1, y: outerY1 },
                { x: outerX2, y: outerY2 }
            ]
        };
    }
}
