// Antenna Geometry Module
import { MathHelpers, CONSTANTS } from '../utils/mathHelpers.js';

export class AntennaGeometry {
    constructor() {
        this.geometry = [];
    }

    generateCompleteGeometry(results, params) {
        this.geometry = [];
        
        // Generate tooth pairs
        const teeth = this.generateTeeth(results, params);
        
        // Generate connecting elements (future enhancement)
        const connections = this.generateConnections(results, params);
        
        // Generate feed structure (future enhancement)
        const feed = this.generateFeedStructure(results, params);
        
        return {
            teeth,
            connections,
            feed,
            bounds: this.calculateBounds(teeth)
        };
    }

    generateTeeth(results, params) {
        const teeth = [];
        
        results.forEach((result, index) => {
            const toothPair = this.generateToothPair(result, params, index);
            teeth.push(...toothPair);
        });
        
        return teeth;
    }

    generateToothPair(result, params, pairIndex) {
        const teeth = [];
        const rn = result.rn * 1000; // Convert to mm
        const outerRadius = rn * Math.sqrt(params.gamma);
        const alphaRad = MathHelpers.degToRad(params.alpha);
        const rotationAngle = pairIndex * 360 / params.toothPairs;
        const rotationRad = MathHelpers.degToRad(rotationAngle);
        
        // Generate both teeth of the pair (180 degrees apart)
        for (let i = 0; i < 2; i++) {
            const baseAngle = rotationRad + (i * Math.PI);
            
            // Calculate tooth vertices
            const tooth = {
                type: 'tooth',
                pairIndex: pairIndex,
                toothIndex: i,
                n: result.n,
                frequency: result.fn,
                innerRadius: rn,
                outerRadius: outerRadius,
                angle: MathHelpers.radToDeg(baseAngle),
                vertices: this.calculateToothVertices(rn, outerRadius, baseAngle, alphaRad),
                center: MathHelpers.polarToCartesian((rn + outerRadius) / 2, baseAngle)
            };
            
            teeth.push(tooth);
        }
        
        return teeth;
    }

    calculateToothVertices(innerRadius, outerRadius, baseAngle, alphaRad) {
        const innerLeft = MathHelpers.polarToCartesian(innerRadius, baseAngle - alphaRad / 2);
        const innerRight = MathHelpers.polarToCartesian(innerRadius, baseAngle + alphaRad / 2);
        const outerLeft = MathHelpers.polarToCartesian(outerRadius, baseAngle - alphaRad / 2);
        const outerRight = MathHelpers.polarToCartesian(outerRadius, baseAngle + alphaRad / 2);
        
        return [innerLeft, outerLeft, outerRight, innerRight];
    }

    generateConnections(results, params) {
        // Placeholder for future enhancement
        // Could generate transmission lines between teeth
        return [];
    }

    generateFeedStructure(results, params) {
        // Placeholder for future enhancement
        // Could generate feed point geometry
        return {
            type: 'feed',
            position: { x: 0, y: 0 },
            radius: 5
        };
    }

    calculateBounds(teeth) {
        if (teeth.length === 0) return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        teeth.forEach(tooth => {
            tooth.vertices.forEach(vertex => {
                minX = Math.min(minX, vertex.x);
                minY = Math.min(minY, vertex.y);
                maxX = Math.max(maxX, vertex.x);
                maxY = Math.max(maxY, vertex.y);
            });
        });
        
        return {
            min: { x: minX, y: minY },
            max: { x: maxX, y: maxY },
            width: maxX - minX,
            height: maxY - minY,
            center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
        };
    }

    // Utility methods for geometry analysis
    calculateToothArea(tooth) {
        // Calculate area using shoelace formula
        const vertices = tooth.vertices;
        let area = 0;
        
        for (let i = 0; i < vertices.length; i++) {
            const j = (i + 1) % vertices.length;
            area += vertices[i].x * vertices[j].y;
            area -= vertices[j].x * vertices[i].y;
        }
        
        return Math.abs(area) / 2;
    }

    calculateTotalArea(teeth) {
        return teeth.reduce((sum, tooth) => sum + this.calculateToothArea(tooth), 0);
    }

    calculatePerimeter(vertices) {
        let perimeter = 0;
        
        for (let i = 0; i < vertices.length; i++) {
            const j = (i + 1) % vertices.length;
            perimeter += MathHelpers.distance(vertices[i], vertices[j]);
        }
        
        return perimeter;
    }

    // Export methods for different formats
    toJSON() {
        return JSON.stringify(this.geometry, null, 2);
    }

    toSVGPath(tooth) {
        const vertices = tooth.vertices;
        let path = `M ${vertices[0].x} ${vertices[0].y}`;
        
        for (let i = 1; i < vertices.length; i++) {
            path += ` L ${vertices[i].x} ${vertices[i].y}`;
        }
        
        path += ' Z';
        return path;
    }

    // Method to generate mesh for 3D visualization (future enhancement)
    generateMesh(thickness = 1.6) {
        // Placeholder for 3D mesh generation
        // Could be used with Three.js in future
        return {
            vertices: [],
            faces: [],
            normals: []
        };
    }
}