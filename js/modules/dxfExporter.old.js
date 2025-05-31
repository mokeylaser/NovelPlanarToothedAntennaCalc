// DXF Exporter for Planar Toothed Log-Periodic Antenna
// ------------------------------------------------------------
// Generates AutoCAD-compliant DXF files with proper formatting
// ------------------------------------------------------------

import { MathHelpers, CONSTANTS } from '../utils/mathHelpers.js';

export class DXFExporter {
    constructor() {
        this.lines = [];
        this.handleCounter = 100;
    }

    // Core method to write DXF lines with proper formatting
    write(code, value) {
        // Group codes are right-aligned in 3 characters
        this.lines.push(code.toString().padStart(3, ' '));
        this.lines.push(value.toString());
    }

    generateDXF(results, params) {
        this.lines = [];
        this.handleCounter = 100;
        
        // Initialize DXF structure
        this.writeHeader();
        this.writeTables();
        this.writeBlocks();
        this.writeEntities(results, params);
        
        // End of file
        this.write(0, 'EOF');
        
        // Join with CRLF for Windows compatibility
        return this.lines.join('\r\n');
    }

    writeHeader() {
        this.write(0, 'SECTION');
        this.write(2, 'HEADER');
        
        // AutoCAD version (R2007)
        this.write(9, '$ACADVER');
        this.write(1, 'AC1021');
        this.write(9, '$DWGCODEPAGE');
        this.write(1, 'ANSI_1252');
        
        // Drawing extents
        this.write(9, '$EXTMIN');
        this.write(10, -1000.0);
        this.write(20, -1000.0);
        this.write(30, 0.0);
        
        this.write(9, '$EXTMAX');
        this.write(10, 1000.0);
        this.write(20, 1000.0);
        this.write(30, 0.0);
        
        // Units (millimeters)
        this.write(9, '$INSUNITS');
        this.write(70, 4);
        
        // Limits
        this.write(9, '$LIMMIN');
        this.write(10, -1000.0);
        this.write(20, -1000.0);
        
        this.write(9, '$LIMMAX');
        this.write(10, 1000.0);
        this.write(20, 1000.0);
        
        this.write(0, 'ENDSEC');
    }

    writeTables() {
        this.write(0, 'SECTION');
        this.write(2, 'TABLES');
        
        // LTYPE table
        this.write(0, 'TABLE');
        this.write(0, 'LTYPE');
        this.write(5, '5');
        this.write(100, 'AcDbSymbolTable');
        this.write(70, 1);
        
        // Continuous line type
        this.write(0, 'LTYPE');
        this.write(5, this.getNextHandle());   // instead of 'CONTINUOUS'
        this.write(100, 'AcDbSymbolTableRecord');
        this.write(100, 'AcDbLinetypeTableRecord');
        this.write(2, 'CONTINUOUS');
        this.write(70, 0);
        this.write(3, 'Solid line');
        this.write(72, 65);
        this.write(73, 0);
        this.write(40, 0.0);
        
        this.write(0, 'ENDTAB');
        
        // LAYER table
        this.write(0, 'TABLE');
        this.write(2, 'LAYER');
        this.write(5, '2');
        this.write(100, 'AcDbSymbolTable');
        this.write(70, 5);
        
        // Default layer
        this.writeLayer('0', 7, 'CONTINUOUS');
        
        // Custom layers
        this.writeLayer('ANTENNA', 5, 'CONTINUOUS');
        this.writeLayer('BETA', 3, 'CONTINUOUS');
        this.writeLayer('DIMENSIONS', 1, 'CONTINUOUS');
        this.writeLayer('REFERENCE', 8, 'CONTINUOUS');
        
        this.write(0, 'ENDTAB');
        
        // STYLE table
        this.write(0, 'TABLE');
        this.write(2, 'STYLE');
        this.write(5, '3');
        this.write(100, 'AcDbSymbolTable');
        this.write(70, 1);
        
        // Standard text style
        this.write(0, 'STYLE');
        this.write(5, '11');
        this.write(100, 'AcDbSymbolTableRecord');
        this.write(100, 'AcDbTextStyleTableRecord');
        this.write(2, 'STANDARD');
        this.write(70, 0);
        this.write(40, 0.0);
        this.write(41, 1.0);
        this.write(50, 0.0);
        this.write(71, 0);
        this.write(42, 2.5);
        this.write(3, 'txt');
        this.write(4, '');
        
        this.write(0, 'ENDTAB');
        
        // End of TABLES section
        this.write(0, 'ENDSEC');
    }

    writeLayer(name, color, linetype) {
        this.write(0, 'LAYER');
        this.write(5, this.getNextHandle());
        this.write(100, 'AcDbSymbolTableRecord');
        this.write(100, 'AcDbLayerTableRecord');
        this.write(2, name);
        this.write(70, 0);
        this.write(62, color);
        this.write(6, linetype);
        this.write(290, 1);
        this.write(370, -3);
    }

    writeBlocks() {
        this.write(0, 'SECTION');
        this.write(2, 'BLOCKS');
        
        // Model space block
        this.write(0, 'BLOCK');
        this.write(5, '20');
        this.write(100, 'AcDbEntity');
        this.write(8, '0');
        this.write(100, 'AcDbBlockBegin');
        this.write(2, '*MODEL_SPACE');
        this.write(70, 0);
        this.write(10, 0.0);
        this.write(20, 0.0);
        this.write(30, 0.0);
        this.write(3, '*MODEL_SPACE');
        this.write(1, '');
        this.write(0, 'ENDBLK');
        this.write(5, '21');
        this.write(100, 'AcDbEntity');
        this.write(8, '0');
        this.write(100, 'AcDbBlockEnd');
        
        // Paper space block
        this.write(0, 'BLOCK');
        this.write(5, '1C');
        this.write(100, 'AcDbEntity');
        this.write(8, '0');
        this.write(100, 'AcDbBlockBegin');
        this.write(2, '*PAPER_SPACE');
        this.write(70, 0);
        this.write(10, 0.0);
        this.write(20, 0.0);
        this.write(30, 0.0);
        this.write(3, '*PAPER_SPACE');
        this.write(1, '');
        this.write(0, 'ENDBLK');
        this.write(5, '1D');
        this.write(100, 'AcDbEntity');
        this.write(8, '0');
        this.write(100, 'AcDbBlockEnd');
        
        this.write(0, 'ENDSEC');
    }

    writeEntities(results, params) {
        this.write(0, 'SECTION');
        this.write(2, 'ENTITIES');
        
        // Scale to millimeters
        const scaleFactor = 1000;
        
        // Draw antenna geometry
        this.writeAntennaGeometry(results, params, scaleFactor);
        
        // Add dimensions
        this.writeDimensions(results, params, scaleFactor);
        
        this.write(0, 'ENDSEC');
    }

    writeAntennaGeometry(results, params, scaleFactor) {
        // Draw alternating teeth
        results.forEach((result, index) => {
            if (index < results.length - 1) {
                const currentRn = result.rn * scaleFactor;
                const nextRn = results[index + 1].rn * scaleFactor;
                
                // Q1 teeth (even indices)
                if (index % 2 === 0) {
                    this.writeToothPolyline(currentRn, nextRn, 0, params.alpha, 'ANTENNA');
                    this.writeToothPolyline(currentRn, nextRn, 180, 180 + params.alpha, 'ANTENNA');
                }
                
                // Q3 teeth (odd indices)
                if (index % 2 === 1) {
                    this.writeToothPolyline(currentRn, nextRn, 90, 90 + params.alpha, 'ANTENNA');
                    this.writeToothPolyline(currentRn, nextRn, 270, 270 + params.alpha, 'ANTENNA');
                }
            }
        });
        
        // Draw beta sections
        if (results.length > 0) {
            const innerRadius = results[0].rn * scaleFactor;
            const outerRadius = results[results.length - 1].rn * scaleFactor * Math.sqrt(params.gamma);
            
            this.writeToothPolyline(innerRadius, outerRadius, params.alpha, 90, 'BETA');
            this.writeToothPolyline(innerRadius, outerRadius, 180 + params.alpha, 270, 'BETA');
        }
    }

    writeToothPolyline(innerRadius, outerRadius, startAngleDeg, endAngleDeg, layer) {
        this.write(0, 'LWPOLYLINE');
        this.write(5, this.getNextHandle());
        this.write(100, 'AcDbEntity');
        this.write(8, layer);
        this.write(100, 'AcDbPolyline');
        this.write(90, 4); // Number of vertices
        this.write(70, 1); // Closed polyline
        this.write(43, 0.0); // Constant width
        
        // Convert angles to radians
        const startRad = MathHelpers.degToRad(startAngleDeg);
        const endRad = MathHelpers.degToRad(endAngleDeg);
        
        // Calculate vertices
        const innerStart = MathHelpers.polarToCartesian(innerRadius, -Math.PI/2 + startRad);
        const outerStart = MathHelpers.polarToCartesian(outerRadius, -Math.PI/2 + startRad);
        const outerEnd = MathHelpers.polarToCartesian(outerRadius, -Math.PI/2 + endRad);
        const innerEnd = MathHelpers.polarToCartesian(innerRadius, -Math.PI/2 + endRad);
        
        // Write vertices with bulge values for arcs
        // Vertex 1: Inner start
        this.write(10, innerStart.x);
        this.write(20, innerStart.y);
        this.write(42, 0.0); // No bulge for straight line
        
        // Vertex 2: Outer start
        this.write(10, outerStart.x);
        this.write(20, outerStart.y);
        
        // Calculate bulge for outer arc
        const angleDiff = endRad - startRad;
        const bulge = Math.tan(angleDiff / 4);
        this.write(42, bulge);
        
        // Vertex 3: Outer end
        this.write(10, outerEnd.x);
        this.write(20, outerEnd.y);
        this.write(42, 0.0); // No bulge for straight line
        
        // Vertex 4: Inner end
        this.write(10, innerEnd.x);
        this.write(20, innerEnd.y);
        this.write(42, -bulge); // Negative bulge for inner arc
    }

    writeDimensions(results, params, scaleFactor) {
        // Title
        const titleY = -results[results.length - 1].rn * scaleFactor * 1.2;
        this.writeText('PLANAR TOOTHED LOG-PERIODIC ANTENNA', 0, titleY, 20, 'DIMENSIONS');
        
        // Parameters
        const paramY = titleY + 30;
        const paramText = `Gamma=${params.gamma}  Alpha=${params.alpha}°  Pairs=${params.toothPairs}`;
        this.writeText(paramText, 0, paramY, 10, 'DIMENSIONS');
        
        // Radius labels
        results.forEach((result, index) => {
            const radius = result.rn * scaleFactor;
            const angle = index * 15;
            const pos = MathHelpers.polarToCartesian(radius * 1.1, MathHelpers.degToRad(angle));
            
            this.writeText(
                `r${result.n}=${result.rn.toFixed(4)}m`,
                pos.x,
                pos.y,
                8,
                'DIMENSIONS'
            );
        });
    }

    writeText(text, x, y, height, layer) {
        this.write(0, 'TEXT');
        this.write(5, this.getNextHandle());
        this.write(100, 'AcDbEntity');
        this.write(8, layer);
        this.write(100, 'AcDbText');
        this.write(10, x);
        this.write(20, y);
        this.write(30, 0.0);
        this.write(40, height);
        this.write(1, text);
        this.write(50, 0.0);
        this.write(41, 1.0);
        this.write(51, 0.0);
        this.write(7, 'STANDARD');
        this.write(71, 0);
        this.write(72, 1);
        this.write(11, x);
        this.write(21, y);
        this.write(31, 0.0);
        this.write(100, 'AcDbText');
        this.write(73, 2);
    }

    getNextHandle() {
        return (this.handleCounter++).toString(16).toUpperCase();
    }
}