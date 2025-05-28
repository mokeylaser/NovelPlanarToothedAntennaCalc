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
        const scaleFactor = 400 / maxRadius; // Scale to fit in viewport
        
        // Draw concentric circles for each rn
        results.forEach((result, index) => {
            const rn = result.rn * 1000 * scaleFactor; // Convert to mm and scale
            
            // Draw circle for this radius
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '0');
            circle.setAttribute('cy', '0');
            circle.setAttribute('r', rn);
            circle.setAttribute('class', 'antenna-tooth');
            circle.setAttribute('data-tooth-pair', result.n);
            circle.setAttribute('data-frequency', result.fnDisplay.toFixed(3));
            circle.setAttribute('data-radius', result.rn.toFixed(6));
            circle.setAttribute('fill', 'none');
            
            antennaGroup.appendChild(circle);
            
            // Add radius label
            const labelAngle = -Math.PI / 2; // Top of circle (0 degrees)
            const labelPos = MathHelpers.polarToCartesian(rn + 10, labelAngle);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', labelPos.x);
            text.setAttribute('y', labelPos.y);
            text.setAttribute('class', 'dimension-text');
            text.setAttribute('text-anchor', 'middle');
            text.textContent = `r${result.n}`;
            
            antennaGroup.appendChild(text);
        });
        
        // Get the outermost radius for drawing angle lines
        const outermostRadius = results[results.length - 1].rn * 1000 * scaleFactor;
        
        // Draw reference line at 0 degrees (top)
        const refLine = this.createLine(0, 0, 0, -outermostRadius);
        refLine.setAttribute('class', 'antenna-outline');
        refLine.setAttribute('stroke-width', '2');
        antennaGroup.appendChild(refLine);
        
        // Add 0° label
        const zeroLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        zeroLabel.setAttribute('x', '0');
        zeroLabel.setAttribute('y', -outermostRadius - 20);
        zeroLabel.setAttribute('class', 'dimension-text');
        zeroLabel.setAttribute('text-anchor', 'middle');
        zeroLabel.textContent = '0°';
        antennaGroup.appendChild(zeroLabel);
        
        // Calculate beta
        const beta = 90 - params.alpha;
        
        // Draw alpha line (clockwise from 0°)
        const alphaRad = MathHelpers.degToRad(params.alpha);
        const alphaEnd = MathHelpers.polarToCartesian(outermostRadius, -Math.PI/2 + alphaRad);
        const alphaLine = this.createLine(0, 0, alphaEnd.x, alphaEnd.y);
        alphaLine.setAttribute('class', 'antenna-outline');
        alphaLine.setAttribute('stroke', '#e11d48'); // Red for alpha
        alphaLine.setAttribute('stroke-width', '2');
        antennaGroup.appendChild(alphaLine);
        
        // Add alpha label
        const alphaLabelPos = MathHelpers.polarToCartesian(outermostRadius + 30, -Math.PI/2 + alphaRad);
        const alphaLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        alphaLabel.setAttribute('x', alphaLabelPos.x);
        alphaLabel.setAttribute('y', alphaLabelPos.y);
        alphaLabel.setAttribute('class', 'dimension-text');
        alphaLabel.setAttribute('text-anchor', 'middle');
        alphaLabel.setAttribute('fill', '#e11d48');
        alphaLabel.textContent = `α=${params.alpha}°`;
        antennaGroup.appendChild(alphaLabel);
        
        // Draw beta line (90 degrees clockwise from 0°)
        const betaRad = MathHelpers.degToRad(90);
        const betaEnd = MathHelpers.polarToCartesian(outermostRadius, -Math.PI/2 + betaRad);
        const betaLine = this.createLine(0, 0, betaEnd.x, betaEnd.y);
        betaLine.setAttribute('class', 'antenna-outline');
        betaLine.setAttribute('stroke', '#059669'); // Green for beta
        betaLine.setAttribute('stroke-width', '2');
        antennaGroup.appendChild(betaLine);
        
        // Add beta label
        const betaLabelPos = MathHelpers.polarToCartesian(outermostRadius + 30, -Math.PI/2 + betaRad);
        const betaLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        betaLabel.setAttribute('x', betaLabelPos.x);
        betaLabel.setAttribute('y', betaLabelPos.y);
        betaLabel.setAttribute('class', 'dimension-text');
        betaLabel.setAttribute('text-anchor', 'middle');
        betaLabel.setAttribute('fill', '#059669');
        betaLabel.textContent = `β=${beta}°`;
        antennaGroup.appendChild(betaLabel);
        
        // Draw arc to show alpha
        const arcRadius = outermostRadius * 0.3;
        const alphaArcPath = this.createArc(0, 0, arcRadius, -Math.PI/2, -Math.PI/2 + alphaRad);
        const alphaArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        alphaArc.setAttribute('d', alphaArcPath);
        alphaArc.setAttribute('class', 'dimension-line');
        alphaArc.setAttribute('fill', 'none');
        alphaArc.setAttribute('stroke', '#e11d48');
        antennaGroup.appendChild(alphaArc);
        
        // Draw arc to show beta
        const betaArcPath = this.createArc(0, 0, arcRadius * 0.5, -Math.PI/2 + alphaRad, -Math.PI/2 + betaRad);
        const betaArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        betaArc.setAttribute('d', betaArcPath);
        betaArc.setAttribute('class', 'dimension-line');
        betaArc.setAttribute('fill', 'none');
        betaArc.setAttribute('stroke', '#059669');
        antennaGroup.appendChild(betaArc);
        
        this.svg.appendChild(antennaGroup);
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
        
        // Handle circle hover
        const circles = this.svg.querySelectorAll('circle.antenna-tooth');
        circles.forEach(circle => {
            circle.addEventListener('mouseenter', (e) => this.showTooltip(e, tooltip));
            circle.addEventListener('mousemove', (e) => this.updateTooltipPosition(e, tooltip));
            circle.addEventListener('mouseleave', () => this.hideTooltip(tooltip));
        });
        
        // Pan functionality
        this.setupPanning();
    }

    showTooltip(event, tooltip) {
        const element = event.target;
        const toothPair = element.getAttribute('data-tooth-pair');
        const frequency = element.getAttribute('data-frequency');
        const radius = element.getAttribute('data-radius');
        
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