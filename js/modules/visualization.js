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
        const maxRadius = results[results.length - 1].rn * Math.sqrt(params.gamma);
        const scaleFactor = 400 / (maxRadius * 1000); // Convert to mm and scale
        
        // Draw each tooth pair
        results.forEach((result, index) => {
            const toothGroup = this.drawToothPair(result, params, scaleFactor, index);
            antennaGroup.appendChild(toothGroup);
        });
        
        this.svg.appendChild(antennaGroup);
    }

    drawToothPair(result, params, scaleFactor, index) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'tooth-pair');
        group.setAttribute('data-index', index);
        
        const rn = result.rn * 1000 * scaleFactor; // Convert to mm and scale
        const outerRadius = rn * Math.sqrt(params.gamma);
        const alphaRad = MathHelpers.degToRad(params.alpha);
        
        // Calculate rotation angle for this tooth pair
        const rotationAngle = index * 360 / params.toothPairs;
        const rotationRad = MathHelpers.degToRad(rotationAngle);
        
        // Draw both teeth of the pair (180 degrees apart)
        for (let i = 0; i < 2; i++) {
            const baseAngle = rotationRad + (i * Math.PI);
            
            // Calculate tooth vertices
            const innerLeft = MathHelpers.polarToCartesian(rn, baseAngle - alphaRad / 2);
            const innerRight = MathHelpers.polarToCartesian(rn, baseAngle + alphaRad / 2);
            const outerLeft = MathHelpers.polarToCartesian(outerRadius, baseAngle - alphaRad / 2);
            const outerRight = MathHelpers.polarToCartesian(outerRadius, baseAngle + alphaRad / 2);
            
            // Create tooth path
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const d = `
                M ${innerLeft.x} ${innerLeft.y}
                L ${outerLeft.x} ${outerLeft.y}
                L ${outerRight.x} ${outerRight.y}
                L ${innerRight.x} ${innerRight.y}
                Z
            `;
            path.setAttribute('d', d);
            path.setAttribute('class', 'antenna-tooth antenna-animate');
            path.setAttribute('data-tooth-pair', result.n);
            path.setAttribute('data-frequency', result.fnDisplay.toFixed(3));
            path.setAttribute('data-radius', result.rn.toFixed(6));
            
            group.appendChild(path);
        }
        
        // Add dimension annotation
        const dimensionGroup = this.createDimensionAnnotation(rn, outerRadius, rotationAngle, result);
        group.appendChild(dimensionGroup);
        
        return group;
    }

    createDimensionAnnotation(innerRadius, outerRadius, angle, result) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'dimension-group');
        
        const angleRad = MathHelpers.degToRad(angle);
        const midRadius = (innerRadius + outerRadius) / 2;
        
        // Position for text
        const textPos = MathHelpers.polarToCartesian(midRadius, angleRad);
        
        // Create text element
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', textPos.x);
        text.setAttribute('y', textPos.y);
        text.setAttribute('class', 'dimension-text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.textContent = `n=${result.n}`;
        
        group.appendChild(text);
        
        return group;
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
        
        // Handle tooth hover
        const teeth = this.svg.querySelectorAll('.antenna-tooth');
        teeth.forEach(tooth => {
            tooth.addEventListener('mouseenter', (e) => this.showTooltip(e, tooltip));
            tooth.addEventListener('mousemove', (e) => this.updateTooltipPosition(e, tooltip));
            tooth.addEventListener('mouseleave', () => this.hideTooltip(tooltip));
        });
        
        // Pan functionality
        this.setupPanning();
    }

    showTooltip(event, tooltip) {
        const tooth = event.target;
        const toothPair = tooth.getAttribute('data-tooth-pair');
        const frequency = tooth.getAttribute('data-frequency');
        const radius = tooth.getAttribute('data-radius');
        
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <div><span class="tooltip-label">Tooth Pair:</span> ${toothPair}</div>
                <div><span class="tooltip-label">Frequency:</span> ${frequency} ${this.currentData.params.outputUnit}</div>
                <div><span class="tooltip-label">Radius:</span> ${radius} m</div>
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