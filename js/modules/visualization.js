// Antenna Visualization Module
import { MathHelpers, CONSTANTS } from '../utils/mathHelpers.js';

export class AntennaVisualizer {
    constructor() {
        this.container = document.getElementById('antenna-visualization');
        this.svg = null;
        this.viewBox = { x: -500, y: -500, width: 1000, height: 1000 };
        this.scale = 1;
        this.currentData = null;
    }

    drawAntenna(results, params) {
        this.currentData = { results, params };
        this.clearVisualization();
        this.createSVG();
        this.drawGrid();
        this.drawAntennaGeometry(results, params);
        this.addZoomControls();
        this.setupInteractions();
    }

    clearVisualization() {
        this.container.innerHTML = '';
    }

    createSVG() {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('class', 'antenna-svg');
        this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
        this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        this.container.appendChild(this.svg);
    }

    drawGrid() {
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gridGroup.setAttribute('class', 'grid-group');
        
        // Grid spacing
        const minorSpacing = 50;
        const majorSpacing = 250;
        
        // Draw minor grid lines
        for (let x = this.viewBox.x; x <= this.viewBox.x + this.viewBox.width; x += minorSpacing) {
            const line = this.createLine(x, this.viewBox.y, x, this.viewBox.y + this.viewBox.height);
            line.setAttribute('class', 'grid-line');
            gridGroup.appendChild(line);
        }
        
        for (let y = this.viewBox.y; y <= this.viewBox.y + this.viewBox.height; y += minorSpacing) {
            const line = this.createLine(this.viewBox.x, y, this.viewBox.x + this.viewBox.width, y);
            line.setAttribute('class', 'grid-line');
            gridGroup.appendChild(line);
        }
        
        // Draw major grid lines
        for (let x = this.viewBox.x; x <= this.viewBox.x + this.viewBox.width; x += majorSpacing) {
            const line = this.createLine(x, this.viewBox.y, x, this.viewBox.y + this.viewBox.height);
            line.setAttribute('class', 'grid-line grid-major');
            gridGroup.appendChild(line);
        }
        
        for (let y = this.viewBox.y; y <= this.viewBox.y + this.viewBox.height; y += majorSpacing) {
            const line = this.createLine(this.viewBox.x, y, this.viewBox.x + this.viewBox.width, y);
            line.setAttribute('class', 'grid-line grid-major');
            gridGroup.appendChild(line);
        }
        
        // Draw axes
        const xAxis = this.createLine(this.viewBox.x, 0, this.viewBox.x + this.viewBox.width, 0);
        xAxis.setAttribute('class', 'grid-line grid-major');
        xAxis.setAttribute('stroke-width', '2');
        gridGroup.appendChild(xAxis);
        
        const yAxis = this.createLine(0, this.viewBox.y, 0, this.viewBox.y + this.viewBox.height);
        yAxis.setAttribute('class', 'grid-line grid-major');
        yAxis.setAttribute('stroke-width', '2');
        gridGroup.appendChild(yAxis);
        
        this.svg.appendChild(gridGroup);
    }

    drawAntennaGeometry(results, params) {
        const antennaGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        antennaGroup.setAttribute('class', 'antenna-group');
        
        // Calculate scale factor to fit antenna in viewport
        const maxRadius = results[results.length - 1].rn * 1000; // Convert to mm
        const outerRadiusMax = maxRadius * Math.sqrt(params.gamma);
        const scaleFactor = 400 / outerRadiusMax; // Scale to fit in viewport
        
        // Calculate angles
        const alphaRad = MathHelpers.degToRad(params.alpha);
        const betaRad = MathHelpers.degToRad(90);
        
        // Draw the antenna teeth with alternating pattern
        results.forEach((result, index) => {
            if (index < results.length - 1) { // Don't draw tooth for the last radius
                const currentRn = result.rn * 1000 * scaleFactor;
                const nextRn = results[index + 1].rn * 1000 * scaleFactor;
                
                // Determine which quadrants to draw based on index
                // Even indices (0, 2, 4...) draw in first quadrant (alpha to beta)
                // Odd indices (1, 3, 5...) draw in third quadrant (opposite side)
                if (index % 2 === 0) {
                    // First quadrant tooth (between alpha and beta)
                    const tooth1Path = this.createToothPath(currentRn, nextRn, -Math.PI/2 + alphaRad, -Math.PI/2 + betaRad);
                    const tooth1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    tooth1.setAttribute('d', tooth1Path);
                    tooth1.setAttribute('class', 'antenna-tooth-filled quadrant-1');
                    tooth1.setAttribute('data-tooth-index', index);
                    tooth1.setAttribute('data-tooth-pair', `${result.n}-${results[index + 1].n}`);
                    tooth1.setAttribute('data-frequency', `${result.fnDisplay.toFixed(3)}-${results[index + 1].fnDisplay.toFixed(3)}`);
                    tooth1.setAttribute('data-radius', `${result.rn.toFixed(6)}-${results[index + 1].rn.toFixed(6)}`);
                    antennaGroup.appendChild(tooth1);
                } else {
                    // Third quadrant tooth (180 degrees rotated)
                    const tooth2Path = this.createToothPath(currentRn, nextRn, -Math.PI/2 + alphaRad + Math.PI, -Math.PI/2 + betaRad + Math.PI);
                    const tooth2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    tooth2.setAttribute('d', tooth2Path);
                    tooth2.setAttribute('class', 'antenna-tooth-filled quadrant-3');
                    tooth2.setAttribute('data-tooth-index', index);
                    tooth2.setAttribute('data-tooth-pair', `${result.n}-${results[index + 1].n}`);
                    tooth2.setAttribute('data-frequency', `${result.fnDisplay.toFixed(3)}-${results[index + 1].fnDisplay.toFixed(3)}`);
                    tooth2.setAttribute('data-radius', `${result.rn.toFixed(6)}-${results[index + 1].rn.toFixed(6)}`);
                    antennaGroup.appendChild(tooth2);
                }
            }
        });
        
        // Draw reference lines (optional - can be toggled)
        const showReferenceLines = true; // Can make this a parameter later
        
        if (showReferenceLines) {
            const outermostRadius = results[results.length - 1].rn * 1000 * scaleFactor;
            
            // Draw reference line at 0 degrees (top)
            const refLine = this.createLine(0, 0, 0, -outermostRadius);
            refLine.setAttribute('class', 'reference-line');
            refLine.setAttribute('stroke-width', '1');
            refLine.setAttribute('stroke', '#666');
            refLine.setAttribute('stroke-dasharray', '2, 2');
            antennaGroup.appendChild(refLine);
            
            // Draw alpha line
            const alphaEnd = MathHelpers.polarToCartesian(outermostRadius, -Math.PI/2 + alphaRad);
            const alphaLine = this.createLine(0, 0, alphaEnd.x, alphaEnd.y);
            alphaLine.setAttribute('class', 'reference-line');
            alphaLine.setAttribute('stroke', '#e11d48');
            alphaLine.setAttribute('stroke-width', '1');
            alphaLine.setAttribute('stroke-dasharray', '2, 2');
            antennaGroup.appendChild(alphaLine);
            
            // Draw beta line
            const betaEnd = MathHelpers.polarToCartesian(outermostRadius, -Math.PI/2 + betaRad);
            const betaLine = this.createLine(0, 0, betaEnd.x, betaEnd.y);
            betaLine.setAttribute('class', 'reference-line');
            betaLine.setAttribute('stroke', '#059669');
            betaLine.setAttribute('stroke-width', '1');
            betaLine.setAttribute('stroke-dasharray', '2, 2');
            antennaGroup.appendChild(betaLine);
            
            // Draw 180 degree line
            const line180 = this.createLine(0, 0, 0, outermostRadius);
            line180.setAttribute('class', 'reference-line');
            line180.setAttribute('stroke', '#666');
            line180.setAttribute('stroke-width', '1');
            line180.setAttribute('stroke-dasharray', '2, 2');
            antennaGroup.appendChild(line180);
            
            // Draw mirrored alpha and beta lines in third quadrant
            const alphaEnd2 = MathHelpers.polarToCartesian(outermostRadius, Math.PI/2 - alphaRad);
            const alphaLine2 = this.createLine(0, 0, alphaEnd2.x, alphaEnd2.y);
            alphaLine2.setAttribute('class', 'reference-line');
            alphaLine2.setAttribute('stroke', '#e11d48');
            alphaLine2.setAttribute('stroke-width', '1');
            alphaLine2.setAttribute('stroke-dasharray', '2, 2');
            antennaGroup.appendChild(alphaLine2);
            
            const betaEnd2 = MathHelpers.polarToCartesian(outermostRadius, Math.PI/2 - betaRad);
            const betaLine2 = this.createLine(0, 0, betaEnd2.x, betaEnd2.y);
            betaLine2.setAttribute('class', 'reference-line');
            betaLine2.setAttribute('stroke', '#059669');
            betaLine2.setAttribute('stroke-width', '1');
            betaLine2.setAttribute('stroke-dasharray', '2, 2');
            antennaGroup.appendChild(betaLine2);
            
            // Add angle labels
            this.addAngleLabels(antennaGroup, outermostRadius, params.alpha);
        }
        
        this.svg.appendChild(antennaGroup);
    }

    createToothPath(innerRadius, outerRadius, startAngle, endAngle) {
        // Create a path for a tooth segment
        const innerStart = MathHelpers.polarToCartesian(innerRadius, startAngle);
        const innerEnd = MathHelpers.polarToCartesian(innerRadius, endAngle);
        const outerStart = MathHelpers.polarToCartesian(outerRadius, startAngle);
        const outerEnd = MathHelpers.polarToCartesian(outerRadius, endAngle);
        
        // Determine if we need the large arc flag
        const angleDiff = endAngle - startAngle;
        const largeArcFlag = Math.abs(angleDiff) > Math.PI ? 1 : 0;
        
        // Build the path
        const path = `
            M ${innerStart.x} ${innerStart.y}
            L ${outerStart.x} ${outerStart.y}
            A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}
            L ${innerEnd.x} ${innerEnd.y}
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}
            Z
        `;
        
        return path;
    }

    addAngleLabels(group, radius, alpha) {
        const beta = 90 - alpha;
        const labelOffset = 20;
        
        // 0° label
        const zeroLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        zeroLabel.setAttribute('x', '0');
        zeroLabel.setAttribute('y', -radius - labelOffset);
        zeroLabel.setAttribute('class', 'dimension-text');
        zeroLabel.setAttribute('text-anchor', 'middle');
        zeroLabel.setAttribute('fill', '#666');
        zeroLabel.textContent = '0°';
        group.appendChild(zeroLabel);
        
        // Alpha label
        const alphaPos = MathHelpers.polarToCartesian(radius + labelOffset, -Math.PI/2 + MathHelpers.degToRad(alpha));
        const alphaLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        alphaLabel.setAttribute('x', alphaPos.x);
        alphaLabel.setAttribute('y', alphaPos.y);
        alphaLabel.setAttribute('class', 'dimension-text');
        alphaLabel.setAttribute('text-anchor', 'middle');
        alphaLabel.setAttribute('fill', '#e11d48');
        alphaLabel.textContent = `α=${alpha}°`;
        group.appendChild(alphaLabel);
        
        // Beta label
        const betaPos = MathHelpers.polarToCartesian(radius + labelOffset, 0);
        const betaLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        betaLabel.setAttribute('x', betaPos.x);
        betaLabel.setAttribute('y', betaPos.y);
        betaLabel.setAttribute('class', 'dimension-text');
        betaLabel.setAttribute('text-anchor', 'middle');
        betaLabel.setAttribute('fill', '#059669');
        betaLabel.textContent = `β=${beta}°`;
        group.appendChild(betaLabel);
        
        // 180° label
        const label180 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label180.setAttribute('x', '0');
        label180.setAttribute('y', radius + labelOffset + 10);
        label180.setAttribute('class', 'dimension-text');
        label180.setAttribute('text-anchor', 'middle');
        label180.setAttribute('fill', '#666');
        label180.textContent = '180°';
        group.appendChild(label180);
    }

    createArc(cx, cy, r, startAngle, endAngle) {
        const start = MathHelpers.polarToCartesian(r, startAngle);
        const end = MathHelpers.polarToCartesian(r, endAngle);
        const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
        const sweepFlag = endAngle > startAngle ? 1 : 0;
        
        return `M ${cx + start.x} ${cy + start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${cx + end.x} ${cy + end.y}`;
    }

    createLine(x1, y1, x2, y2) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        return line;
    }

    addZoomControls() {
        const controls = document.createElement('div');
        controls.className = 'zoom-controls';
        
        const zoomInBtn = document.createElement('button');
        zoomInBtn.className = 'zoom-btn';
        zoomInBtn.innerHTML = '+';
        zoomInBtn.addEventListener('click', () => this.zoom(1.2));
        
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.className = 'zoom-btn';
        zoomOutBtn.innerHTML = '−';
        zoomOutBtn.addEventListener('click', () => this.zoom(0.8));
        
        const resetBtn = document.createElement('button');
        resetBtn.className = 'zoom-btn';
        resetBtn.innerHTML = '⟲';
        resetBtn.addEventListener('click', () => this.resetZoom());
        
        controls.appendChild(zoomInBtn);
        controls.appendChild(zoomOutBtn);
        controls.appendChild(resetBtn);
        
        this.container.appendChild(controls);
    }

    zoom(factor) {
        this.scale *= factor;
        const newWidth = this.viewBox.width / factor;
        const newHeight = this.viewBox.height / factor;
        const newX = this.viewBox.x + (this.viewBox.width - newWidth) / 2;
        const newY = this.viewBox.y + (this.viewBox.height - newHeight) / 2;
        
        this.viewBox = {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight
        };
        
        this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
    }

    resetZoom() {
        this.scale = 1;
        this.viewBox = { x: -500, y: -500, width: 1000, height: 1000 };
        this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
    }

    setupInteractions() {
        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'antenna-tooltip';
        this.container.appendChild(tooltip);
        
        // Handle tooth hover (now for filled paths)
        const teeth = this.svg.querySelectorAll('.antenna-tooth-filled');
        teeth.forEach(tooth => {
            tooth.addEventListener('mouseenter', (e) => this.showTooltip(e, tooltip));
            tooth.addEventListener('mousemove', (e) => this.updateTooltipPosition(e, tooltip));
            tooth.addEventListener('mouseleave', () => this.hideTooltip(tooltip));
        });
        
        // Pan functionality
        this.setupPanning();
    }

    showTooltip(event, tooltip) {
        const element = event.target;
        const toothPair = element.getAttribute('data-tooth-pair');
        const frequency = element.getAttribute('data-frequency');
        const radius = element.getAttribute('data-radius');
        const quadrant = element.classList.contains('quadrant-1') ? 'Q1' : 'Q3';
        
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <div><span class="tooltip-label">Tooth:</span> ${toothPair} (${quadrant})</div>
                <div><span class="tooltip-label">Frequency Range:</span> ${frequency} ${this.currentData.params.outputUnit}</div>
                <div><span class="tooltip-label">Radius Range:</span> ${radius} m</div>
            </div>
        `;
        
        tooltip.classList.add('visible');
        this.updateTooltipPosition(event, tooltip);
    }

    updateTooltipPosition(event, tooltip) {
        const containerRect = this.container.getBoundingClientRect();
        const x = event.clientX - containerRect.left + 10;
        const y = event.clientY - containerRect.top - 10;
        
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }

    hideTooltip(tooltip) {
        tooltip.classList.remove('visible');
    }

    setupPanning() {
        let isPanning = false;
        let startX, startY;
        let startViewBox = { ...this.viewBox };
        
        this.svg.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                isPanning = true;
                startX = e.clientX;
                startY = e.clientY;
                startViewBox = { ...this.viewBox };
                this.svg.style.cursor = 'grabbing';
            }
        });
        
        this.svg.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            
            const dx = (e.clientX - startX) * (this.viewBox.width / this.svg.clientWidth);
            const dy = (e.clientY - startY) * (this.viewBox.height / this.svg.clientHeight);
            
            this.viewBox.x = startViewBox.x - dx;
            this.viewBox.y = startViewBox.y - dy;
            
            this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
        });
        
        this.svg.addEventListener('mouseup', () => {
            isPanning = false;
            this.svg.style.cursor = 'grab';
        });
        
        this.svg.addEventListener('mouseleave', () => {
            isPanning = false;
            this.svg.style.cursor = 'grab';
        });
        
        // Set initial cursor
        this.svg.style.cursor = 'grab';
    }

    // Export method for getting SVG content
    getSVGContent() {
        return this.svg ? this.svg.outerHTML : null;
    }

    // Get antenna geometry data for DXF export
    getAntennaGeometry() {
        if (!this.currentData) return null;
        
        const { results, params } = this.currentData;
        const geometry = [];
        
        results.forEach((result, index) => {
            const rn = result.rn * 1000; // Convert to mm
            const outerRadius = rn * Math.sqrt(params.gamma);
            const alphaRad = MathHelpers.degToRad(params.alpha);
            const rotationAngle = index * 360 / params.toothPairs;
            const rotationRad = MathHelpers.degToRad(rotationAngle);
            
            // Generate both teeth of the pair
            for (let i = 0; i < 2; i++) {
                const baseAngle = rotationRad + (i * Math.PI);
                
                // Calculate tooth vertices
                const innerLeft = MathHelpers.polarToCartesian(rn, baseAngle - alphaRad / 2);
                const innerRight = MathHelpers.polarToCartesian(rn, baseAngle + alphaRad / 2);
                const outerLeft = MathHelpers.polarToCartesian(outerRadius, baseAngle - alphaRad / 2);
                const outerRight = MathHelpers.polarToCartesian(outerRadius, baseAngle + alphaRad / 2);
                
                geometry.push({
                    type: 'tooth',
                    toothPair: result.n,
                    vertices: [
                        innerLeft,
                        outerLeft,
                        outerRight,
                        innerRight
                    ]
                });
            }
        });
        
        return geometry;
    }
}