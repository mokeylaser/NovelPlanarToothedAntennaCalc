// DXF Exporter Module
import { MathHelpers, CONSTANTS } from '../utils/mathHelpers.js';

export class DXFExporter {
    constructor() {
        this.dxfContent = '';
        this.handleCounter = 100;
    }

    generateDXF(results, params) {
        this.dxfContent = '';
        this.handleCounter = 100;
        
        // Write DXF header
        this.writeHeader();
        
        // Start entities section
        this.writeLine('0', 'SECTION');
        this.writeLine('2', 'ENTITIES');
        
        // Add antenna geometry
        this.writeAntennaGeometry(results, params);
        
        // Add dimension annotations
        this.writeDimensions(results, params);
        
        // End entities section
        this.writeLine('0', 'ENDSEC');
        
        // Write DXF footer
        this.writeFooter();
        
        return this.dxfContent;
    }

    writeHeader() {
        // Minimal DXF header
        this.writeLine('0', 'SECTION');
        this.writeLine('2', 'HEADER');
        this.writeLine('9', '$ACADVER');
        this.writeLine('1', 'AC1024'); // AutoCAD 2010 format
        this.writeLine('9', '$INSBASE');
        this.writeLine('10', '0.0');
        this.writeLine('20', '0.0');
        this.writeLine('30', '0.0');
        this.writeLine('9', '$EXTMIN');
        this.writeLine('10', '-1000.0');
        this.writeLine('20', '-1000.0');
        this.writeLine('30', '0.0');
        this.writeLine('9', '$EXTMAX');
        this.writeLine('10', '1000.0');
        this.writeLine('20', '1000.0');
        this.writeLine('30', '0.0');
        this.writeLine('0', 'ENDSEC');
        
        // Tables section
        this.writeLine('0', 'SECTION');
        this.writeLine('2', 'TABLES');
        
        // Layer table
        this.writeLine('0', 'TABLE');
        this.writeLine('2', 'LAYER');
        this.writeLine('5', '2');
        this.writeLine('70', '2');
        
        // Antenna layer
        this.writeLine('0', 'LAYER');
        this.writeLine('5', '10');
        this.writeLine('2', 'ANTENNA');
        this.writeLine('70', '0');
        this.writeLine('62', '7'); // White/black
        this.writeLine('6', 'CONTINUOUS');
        
        // Dimensions layer
        this.writeLine('0', 'LAYER');
        this.writeLine('5', '11');
        this.writeLine('2', 'DIMENSIONS');
        this.writeLine('70', '0');
        this.writeLine('62', '3'); // Green
        this.writeLine('6', 'CONTINUOUS');
        
        this.writeLine('0', 'ENDTAB');
        this.writeLine('0', 'ENDSEC');
    }

    writeAntennaGeometry(results, params) {
        results.forEach((result, index) => {
            const rn = result.rn * 1000; // Convert to mm
            const outerRadius = rn * Math.sqrt(params.gamma);
            const alphaRad = MathHelpers.degToRad(params.alpha);
            const rotationAngle = index * 360 / params.toothPairs;
            const rotationRad = MathHelpers.degToRad(rotationAngle);
            
            // Draw both teeth of the pair
            for (let i = 0; i < 2; i++) {
                const baseAngle = rotationRad + (i * Math.PI);
                
                // Calculate tooth vertices
                const innerLeft = MathHelpers.polarToCartesian(rn, baseAngle - alphaRad / 2);
                const innerRight = MathHelpers.polarToCartesian(rn, baseAngle + alphaRad / 2);
                const outerLeft = MathHelpers.polarToCartesian(outerRadius, baseAngle - alphaRad / 2);
                const outerRight = MathHelpers.polarToCartesian(outerRadius, baseAngle + alphaRad / 2);
                
                // Draw tooth as closed polyline
                this.writePolyline([
                    innerLeft,
                    outerLeft,
                    outerRight,
                    innerRight,
                    innerLeft // Close the shape
                ], 'ANTENNA');
            }
        });
    }

    writeDimensions(results, params) {
        // Add radial dimensions for each tooth pair
        results.forEach((result, index) => {
            const rn = result.rn * 1000; // Convert to mm
            const rotationAngle = index * 360 / params.toothPairs;
            const rotationRad = MathHelpers.degToRad(rotationAngle);
            
            // Position for dimension text
            const textPos = MathHelpers.polarToCartesian(rn * 1.2, rotationRad);
            
            // Write dimension text
            this.writeText(
                `n=${result.n} r=${MathHelpers.formatNumber(result.rn, 4)}m`,
                textPos.x,
                textPos.y,
                5, // Text height
                'DIMENSIONS'
            );
        });
        
        // Add title block
        this.writeText(
            'PLANAR TOOTHED ANTENNA',
            0,
            -900,
            20,
            'DIMENSIONS'
        );
        
        // Add parameters
        const paramText = [
            `Gamma: ${params.gamma}`,
            `Alpha: ${params.alpha}°`,
            `Epsilon_eff: ${params.Eeff}`,
            `Tooth Pairs: ${params.toothPairs}`
        ];
        
        paramText.forEach((text, index) => {
            this.writeText(
                text,
                -800,
                -850 + (index * 30),
                10,
                'DIMENSIONS'
            );
        });
    }

    writePolyline(points, layer) {
        this.writeLine('0', 'LWPOLYLINE');
        this.writeLine('5', this.getNextHandle());
        this.writeLine('8', layer);
        this.writeLine('90', points.length.toString()); // Number of vertices
        this.writeLine('70', '1'); // Closed polyline
        
        points.forEach(point => {
            this.writeLine('10', point.x.toFixed(4));
            this.writeLine('20', point.y.toFixed(4));
        });
    }

    writeText(text, x, y, height, layer) {
        this.writeLine('0', 'TEXT');
        this.writeLine('5', this.getNextHandle());
        this.writeLine('8', layer);
        this.writeLine('10', x.toFixed(4));
        this.writeLine('20', y.toFixed(4));
        this.writeLine('30', '0.0');
        this.writeLine('40', height.toFixed(4)); // Text height
        this.writeLine('1', text);
    }

    writeFooter() {
        this.writeLine('0', 'EOF');
    }

    writeLine(code, value) {
        this.dxfContent += `${code}\n${value}\n`;
    }

    getNextHandle() {
        return (this.handleCounter++).toString(16).toUpperCase();
    }

    // Alternative method to generate DXF with antenna geometry
    generateGeometryDXF(geometry) {
        this.dxfContent = '';
        this.handleCounter = 100;
        
        this.writeHeader();
        
        this.writeLine('0', 'SECTION');
        this.writeLine('2', 'ENTITIES');
        
        geometry.forEach(item => {
            if (item.type === 'tooth') {
                this.writePolyline(item.vertices, 'ANTENNA');
            }
        });
        
        this.writeLine('0', 'ENDSEC');
        this.writeFooter();
        
        return this.dxfContent;
    }
}