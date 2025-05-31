// DXF Exporter for Planar Toothed Log-Periodic Antenna
// ------------------------------------------------------------
// Why this rewrite?
// 1. Single source of truth for output: `this.lines` (array of strings)
// 2. Only ONE helper (`write`) that pads group‑codes & adds CRLF
// 3. No duplicate `getNextHandle`, no mix‑ups between `dxfContent` / `dxf`
// 4. Sections ordered per DXF R2007 (AC1024) spec
// 5. Utility methods kept minimal; geometry generation isolated
// ------------------------------------------------------------

// DXF Exporter Module
import { MathHelpers, CONSTANTS } from '../utils/mathHelpers.js';

export class DXFExporter {
    constructor() {
        this.dxf = [];
        this.handleCounter = 100;
    }

addLine(code, val) {
  this.dxf.push(code.toString().padStart(3, ' '));
  this.dxf.push(val.toString());
}

    generateDXF(results, params) {
        this.dxf = [];
        this.handleCounter = 100;
        
        // Initialize DXF
        this.addHeader();
        this.addTables();
        this.addBlocks();
        
        // Start entities section
        this.addSection('ENTITIES');
        
        // Generate antenna geometry
        this.addAntennaGeometry(results, params);
        
        // End entities section
        this.addLine(0, 'ENDSEC');
        
        // End of file
        this.addLine(0, 'EOF');
        
        return this.dxf.join('\r\n');
    }

    addHeader() {
        this.addSection('HEADER');
        
        // AutoCAD version
        this.addVariable('$ACADVER', '1', 'AC1024');
        this.addVariable('$DWGCODEPAGE', '3', 'ANSI_1252');
        this.addVariable('$INSBASE', '10,20,30', '0,0,0'); // Insertion base point
        
        // Drawing limits
        this.addVariable('$EXTMIN', '10,20,30', '-1000,-1000,0');
        this.addVariable('$EXTMAX', '10,20,30', '1000,1000,0');
        
        // Units
        this.addVariable('$INSUNITS', '70', '4'); // Millimeters
        
        this.addLine(0, 'ENDSEC');
    }

    addTables() {
        this.addSection('TABLES');
        
        // Layer table
        this.addTable('LAYER', 5);
        
        // Add layers
        this.addLayer('0', 7, 'CONTINUOUS'); // Default layer
        this.addLayer('ANTENNA', 5, 'CONTINUOUS'); // Blue
        this.addLayer('BETA', 3, 'CONTINUOUS'); // Green
        this.addLayer('DIMENSIONS', 1, 'CONTINUOUS'); // Red
        this.addLayer('REFERENCE', 8, 'CONTINUOUS'); // Dark gray
        
        this.addLine(0, 'ENDTAB');
        this.addLine(0, 'ENDSEC');
    }

    addBlocks() {
        this.addSection('BLOCKS');
        this.addLine(0, 'ENDSEC');
    }

    addAntennaGeometry(results, params) {
        // Convert to mm
        const scaleFactor = 1000;
        
        // Calculate angles
        const alphaRad = MathHelpers.degToRad(params.alpha);
        const betaStartRad = MathHelpers.degToRad(params.alpha);
        const betaEndRad = MathHelpers.degToRad(90);
        const q3StartRad = MathHelpers.degToRad(90);
        const q3EndRad = MathHelpers.degToRad(90 + params.alpha);
        
        // Draw alternating teeth
        results.forEach((result, index) => {
            if (index < results.length - 1) {
                const currentRn = result.rn * scaleFactor;
                const nextRn = results[index + 1].rn * scaleFactor;
                
                // Q1 teeth (even indices)
                if (index % 2 === 0) {
                    this.addToothPolyline(currentRn, nextRn, 0, params.alpha, 'ANTENNA');
                    // Mirror
                    this.addToothPolyline(currentRn, nextRn, 180, 180 + params.alpha, 'ANTENNA');
                }
                
                // Q3 teeth (odd indices)
                if (index % 2 === 1) {
                    this.addToothPolyline(currentRn, nextRn, 90, 90 + params.alpha, 'ANTENNA');
                    // Mirror
                    this.addToothPolyline(currentRn, nextRn, 270, 270 + params.alpha, 'ANTENNA');
                }
            }
        });
        
        // Draw beta sections
        if (results.length > 0) {
            const innerRadius = results[0].rn * scaleFactor;
            const outerRadius = results[results.length - 1].rn * scaleFactor * Math.sqrt(params.gamma);
            
            // Beta section 1
            this.addToothPolyline(innerRadius, outerRadius, params.alpha, 90, 'BETA');
            // Beta section 2 (mirror)
            this.addToothPolyline(innerRadius, outerRadius, 180 + params.alpha, 270, 'BETA');
        }
        
        // Add dimension text
        this.addDimensions(results, params, scaleFactor);
    }

    addToothPolyline(innerRadius, outerRadius, startAngleDeg, endAngleDeg, layer) {
        // Start polyline
        this.addLine(0, 'LWPOLYLINE');
        this.addLine(5, this.getNextHandle());
        this.addLine(8, layer);
        this.addLine(100, 'AcDbEntity');
        this.addLine(100, 'AcDbPolyline');
        this.addLine(90, '4'); // 4 vertices
        this.addLine(70, '1'); // Closed polyline
        
        // Convert angles to radians
        const startRad = MathHelpers.degToRad(startAngleDeg);
        const endRad = MathHelpers.degToRad(endAngleDeg);
        
        // Calculate vertices
        const innerStart = MathHelpers.polarToCartesian(innerRadius, -Math.PI/2 + startRad);
        const innerEnd = MathHelpers.polarToCartesian(innerRadius, -Math.PI/2 + endRad);
        const outerStart = MathHelpers.polarToCartesian(outerRadius, -Math.PI/2 + startRad);
        const outerEnd = MathHelpers.polarToCartesian(outerRadius, -Math.PI/2 + endRad);
        
        // Add vertices
        this.addVertex(innerStart.x, innerStart.y);
        this.addVertex(outerStart.x, outerStart.y);
        
        // Add arc bulge for outer arc
        const angleDiff = endRad - startRad;
        const bulge = Math.tan(angleDiff / 4);
        this.addLine(42, bulge.toFixed(6));
        
        this.addVertex(outerEnd.x, outerEnd.y);
        this.addVertex(innerEnd.x, innerEnd.y);
        
        // Add arc bulge for inner arc (negative for opposite direction)
        this.addLine(42, (-bulge).toFixed(6));
    }

    addDimensions(results, params, scaleFactor) {
        // Add title text
        this.addText('PLANAR TOOTHED LOG-PERIODIC ANTENNA', 0, -results[results.length - 1].rn * scaleFactor * 1.2, 20, 'DIMENSIONS');
        
        // Add parameter text
        const yOffset = -results[results.length - 1].rn * scaleFactor * 1.1;
        this.addText(`Parameters: Gamma=${params.gamma}, Alpha=${params.alpha}°, Pairs=${params.toothPairs}`, 0, yOffset, 10, 'DIMENSIONS');
        
        // Add radius labels
        results.forEach((result, index) => {
            const radius = result.rn * scaleFactor;
            const angle = index * 15; // Spread labels around circle
            const pos = MathHelpers.polarToCartesian(radius * 1.1, MathHelpers.degToRad(angle));
            
            this.addText(
                `r${result.n}=${result.rn.toFixed(4)}m`,
                pos.x,
                pos.y,
                8,
                'DIMENSIONS'
            );
        });
    }

    addText(text, x, y, height, layer) {
        this.addLine(0, 'TEXT');
        this.addLine(5, this.getNextHandle());
        this.addLine(8, layer);
        this.addLine(100, 'AcDbEntity');
        this.addLine(100, 'AcDbText');
        this.addLine(10, x.toFixed(4));
        this.addLine(20, y.toFixed(4));
        this.addLine(30, '0.0');
        this.addLine(40, height.toFixed(4));
        this.addLine(1, text);
        this.addLine(50, '0'); // Rotation angle
        this.addLine(41, '1.0'); // Width factor
        this.addLine(51, '0'); // Oblique angle
        this.addLine(7, 'STANDARD'); // Text style
        this.addLine(71, '0'); // Text generation flags
        this.addLine(72, '1'); // Horizontal justification (center)
        this.addLine(11, x.toFixed(4)); // Second alignment point
        this.addLine(21, y.toFixed(4));
        this.addLine(31, '0.0');
        this.addLine(73, '2'); // Vertical justification (middle)
    }

    addVertex(x, y) {
        this.addLine(10, x.toFixed(4));
        this.addLine(20, y.toFixed(4));
    }

    addSection(name) {
        this.addLine(0, 'SECTION');
        this.addLine(2, name);
    }

    addTable(name, flags) {
        this.addLine(0, 'TABLE');
        this.addLine(2, name);
        this.addLine(5, this.getNextHandle());
        this.addLine(100, 'AcDbSymbolTable');
        this.addLine(70, flags.toString());
    }

    addLayer(name, color, linetype) {
        this.addLine(0, 'LAYER');
        this.addLine(5, this.getNextHandle());
        this.addLine(100, 'AcDbSymbolTableRecord');
        this.addLine(100, 'AcDbLayerTableRecord');
        this.addLine(2, name);
        this.addLine(70, '0'); // Layer flags
        this.addLine(62, color.toString());
        this.addLine(6, linetype);
        this.addLine(290, '1'); // Plotting flag
        this.addLine(370, '-3'); // Lineweight
    }

    addVariable(name, groupCode, value) {
        this.addLine(9, name);
        const codes = groupCode.split(',');
        const values = value.split(',');
        codes.forEach((code, i) => {
            this.addLine(parseInt(code), values[i]);
        });
    }

    addLine(groupCode, value) {
        this.dxf.push(groupCode.toString());
        this.dxf.push(value.toString());
    }

    getNextHandle() {
        return (this.handleCounter++).toString(16).toUpperCase();
    }

    // Alternative method using the geometry from visualization
    generateFromGeometry(visualizer) {
        const geometry = visualizer.getAntennaGeometry();
        if (!geometry) return null;
        
        this.dxf = [];
        this.handleCounter = 100;
        
        this.addHeader();
        this.addTables();
        this.addBlocks();
        this.addSection('ENTITIES');
        
        // Add each tooth as a polyline
        geometry.forEach(item => {
            if (item.type === 'tooth') {
                this.addPolylineFromVertices(item.vertices, 'ANTENNA');
            }
        });
        
        this.addLine(0, 'ENDSEC');
        this.addLine(0, 'EOF');
        
        return this.dxf.join('\r\n');
    }

    addPolylineFromVertices(vertices, layer) {
        this.addLine(0, 'LWPOLYLINE');
        this.addLine(5, this.getNextHandle());
        this.addLine(8, layer);
        this.addLine(100, 'AcDbEntity');
        this.addLine(100, 'AcDbPolyline');
        this.addLine(90, vertices.length.toString());
        this.addLine(70, '1'); // Closed
        
        vertices.forEach(vertex => {
            this.addVertex(vertex.x, vertex.y);
        });
    }
}