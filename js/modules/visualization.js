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

    drawAntenna(results, params, feedGap) {
        this.currentData = { results, params };
        this.clearVisualization();
        this.createSVG();
        this.drawGrid();
        this.drawAntennaGeometry(results, params, feedGap);
        this.addZoomControls();
        this.setupInteractions();
    }

    clearVisualization() {
        this.container.innerHTML = '';
    }
    
    // Create SVG element and set attributes
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

    drawAntennaGeometry(results, params, feedGap) {
        const antennaGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        antennaGroup.setAttribute('class', 'antenna-group');
        const SVG_NS = 'http://www.w3.org/2000/svg';

        // Calculate actual maximum antenna radius in millimeters
        let actualOuterRadiusMm = 0;
        if (results.length > 0) {
            actualOuterRadiusMm = results[results.length - 1].rn * 1000 * Math.sqrt(params.gamma);
        }
        // Ensure a minimum radius if actualOuterRadiusMm is zero or very small, to prevent issues with viewBox
        if (actualOuterRadiusMm === 0) {
            actualOuterRadiusMm = 100; // Default to a 100mm radius area if antenna is not defined
            console.warn("Antenna dimensions are zero, defaulting to a 100mm radius view.");
        }

        // Calculate actual_max_antenna_radius_meters
        const base_rn_for_max_radius = params.gamma < 1 && results.length > 0 ? results[0].rn : (results.length > 0 ? results[results.length - 1].rn : 0);
        const actual_max_antenna_radius_meters = base_rn_for_max_radius * Math.sqrt(params.gamma);

        // Calculate dynamic_font_size_mm
        let dynamic_font_size_mm = (0.075 * actual_max_antenna_radius_meters) * 1000;
        if (isNaN(dynamic_font_size_mm) || dynamic_font_size_mm <= 0) {
            dynamic_font_size_mm = 1; // Default to 1mm if calculation is not valid
        }

        // Calculate scale factor to fit antenna in viewport
        const maxRadius = results.length > 0 ? results[results.length - 1].rn * 1000 : 0; // Convert to mm
        // const outerRadiusMax = maxRadius * Math.sqrt(params.gamma);
        // const scaleFactor = outerRadiusMax > 0 ? 400 / outerRadiusMax : 1; // Scale to fit in viewport, handle division by zero
        
        // Calculate angles
        const alphaRad = MathHelpers.degToRad(params.alpha);
        const betaStartRad = MathHelpers.degToRad(params.alpha); // Beta starts where alpha ends
        const betaEndRad = MathHelpers.degToRad(90); // Beta ends at 90 degrees
        const q3StartRad = MathHelpers.degToRad(90); // Q3 starts at 90 degrees
        const q3EndRad = MathHelpers.degToRad(90 + params.alpha); // Q3 ends at 90 + alpha
        
               
        // Draw alternating teeth in Q1 (0 to alpha degrees)
        results.forEach((result, index) => {
            if (index < results.length - 1) {
                const currentRn = result.rn * 1000;
                const nextRn = results[index + 1].rn * 1000;
                
                // Q1: Even indices (0, 2, 4...) draw teeth from 0 to alpha
                if (index % 2 === 0) {
                    const tooth1Path = this.createToothPath(currentRn, nextRn, -Math.PI/2, -Math.PI/2 + alphaRad);
                    const tooth1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    tooth1.setAttribute('d', tooth1Path);
                    tooth1.setAttribute('class', 'antenna-tooth-filled quadrant-1');
                    tooth1.setAttribute('data-tooth-index', index);
                    tooth1.setAttribute('data-tooth-pair', `${result.n}-${results[index + 1].n}`);
                    tooth1.setAttribute('data-frequency', `${result.fnDisplay.toFixed(3)}-${results[index + 1].fnDisplay.toFixed(3)}`);
                    tooth1.setAttribute('data-radius', `${result.rn.toFixed(6)}-${results[index + 1].rn.toFixed(6)}`);
                    antennaGroup.appendChild(tooth1);
                }
                
                // Q3: Odd indices (1, 3, 5...) draw teeth from 90 to 90+alpha
                if (index % 2 === 1) {
                    const tooth3Path = this.createToothPath(currentRn, nextRn, -Math.PI/2 + q3StartRad, -Math.PI/2 + q3EndRad);
                    const tooth3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    tooth3.setAttribute('d', tooth3Path);
                    tooth3.setAttribute('class', 'antenna-tooth-filled quadrant-3');
                    tooth3.setAttribute('data-tooth-index', index);
                    tooth3.setAttribute('data-tooth-pair', `${result.n}-${results[index + 1].n}`);
                    tooth3.setAttribute('data-frequency', `${result.fnDisplay.toFixed(3)}-${results[index + 1].fnDisplay.toFixed(3)}`);
                    tooth3.setAttribute('data-radius', `${result.rn.toFixed(6)}-${results[index + 1].rn.toFixed(6)}`);
                    antennaGroup.appendChild(tooth3);
                }
            }
        });
           
                /* ────────── Q2: solid β-section + feed gap ────────── */
        
        if (results.length > 0) {

              /* ----- feed-gap indicator (tiny red bar at the apex) ----- */

            if (feedGap && !isNaN(feedGap)) {
                const gMeters   = Number(feedGap);          // metres
                const gSvg      = gMeters * 1000; // convert → mm → SVG-units
                const halfG     = 0.5 * gSvg;
                const barHeight = params.r1 * 1000 * 0.02;
                const gapAngle = params.alpha - 75; // angle at which the gap is drawn

                const gapRect = document.createElementNS(SVG_NS, 'rect');
                gapRect.setAttribute('x', (-halfG).toString());
                gapRect.setAttribute('y', (-barHeight).toString());
                gapRect.setAttribute('width', gSvg.toString());
                gapRect.setAttribute('height', (barHeight * 2).toString());
                gapRect.setAttribute('fill', '#ef4444');
                gapRect.setAttribute('transform', `rotate(${gapAngle}, 0, 0)`);
                gapRect.setAttribute('data-tippy-content',`Feed gap ≈ ${(gMeters * 1e3).toFixed(1)} mm`);
                this.svg.appendChild(gapRect);
            } // ← closes feed-gap IF
           
            const innerRadius = results[0].rn * 1000; // smallest
            const outerRadius = results[results.length - 1].rn * 1000 * Math.sqrt(params.gamma); // largest

            // β-section (first half-plane)
            const betaPath = this.createToothPath(
                innerRadius,
                outerRadius,
                -Math.PI / 2 + betaStartRad,
                -Math.PI / 2 + betaEndRad
           );
          
            const betaSection = document.createElementNS(SVG_NS, 'path');
            betaSection.setAttribute('d', betaPath);
            betaSection.setAttribute('class', 'antenna-tooth-filled beta-section');
            betaSection.setAttribute('data-section', 'beta');
            betaSection.setAttribute('data-angle', `${params.alpha}°-90°`);
            antennaGroup.appendChild(betaSection);

            // Wedge section (filled triangular region)
            const startX = 0;
            const startY = 0;
            const outerEndX = outerRadius * Math.cos(-Math.PI / 2 + betaEndRad);
            const outerEndY = outerRadius * Math.sin(-Math.PI / 2 + betaEndRad);
            const endX = outerRadius * Math.cos(-Math.PI / 2 + betaStartRad);
            const endY = outerRadius * Math.sin(-Math.PI / 2 + betaStartRad);
            //'M' = move to start point, 'L' = line to end point, 'A' = arc
            // 'Z' = close path
            const wedgePath = 'M ' + startX + ' ' + startY + ' L ' + endX + ' ' + endY + ' A ' + outerRadius + ' ' + outerRadius + ' 0 0 1 ' + outerEndX + ' ' + outerEndY + ' Z';
            
            const wedge = document.createElementNS(SVG_NS, 'path');
            wedge.setAttribute('d', wedgePath);
            wedge.setAttribute('class', 'antenna-tooth-filled beta-section');
            wedge.setAttribute('data-section', 'beta');
            wedge.setAttribute('data-angle', `${params.alpha}°-90°`);
            antennaGroup.appendChild(wedge);


        } // ← *** closes the big “if (results.length > 0)” block that was missing ***


        /* ────────── Other half of dipole (180° rotated) ────────── */
        results.forEach((result, index) => {
            if (index < results.length - 1) {
                const currentRn = result.rn * 1000;
                const nextRn    = results[index + 1].rn * 1000;

                // mirror Q1
                if (index % 2 === 0) {
                    const p = this.createToothPath(
                        currentRn, nextRn,
                        Math.PI / 2,
                        Math.PI / 2 + alphaRad
                    );
                    const el = document.createElementNS(SVG_NS, 'path');
                    el.setAttribute('d', p);
                    el.setAttribute('class', 'antenna-tooth-filled quadrant-1-mirror');
                    el.setAttribute('data-tooth-pair', `${result.n}-${results[index + 1].n}`);
                    el.setAttribute('data-frequency', `${result.fnDisplay.toFixed(3)}-${results[index + 1].fnDisplay.toFixed(3)}`);
                    el.setAttribute('data-radius', `${result.rn.toFixed(6)}-${results[index + 1].rn.toFixed(6)}`);
                    antennaGroup.appendChild(el);
                }

                // mirror Q3
                if (index % 2 === 1) {
                    const p = this.createToothPath(
                        currentRn, nextRn,
                        Math.PI / 2 + q3StartRad,
                        Math.PI / 2 + q3EndRad
                    );
                    const el = document.createElementNS(SVG_NS, 'path');
                    el.setAttribute('d', p);
                    el.setAttribute('class', 'antenna-tooth-filled quadrant-3-mirror');
                    el.setAttribute('data-tooth-pair', `${result.n}-${results[index + 1].n}`);
                    el.setAttribute('data-frequency', `${result.fnDisplay.toFixed(3)}-${results[index + 1].fnDisplay.toFixed(3)}`);
                    el.setAttribute('data-radius', `${result.rn.toFixed(6)}-${results[index + 1].rn.toFixed(6)}`);
                    antennaGroup.appendChild(el);
                }
            }
        });

        /* ────────── mirrored β-section (second half-plane) ────────── */
        if (results.length > 0) {
            const innerRadius = results[0].rn * 1000;
            const outerRadius = results[results.length - 1].rn * 1000 * Math.sqrt(params.gamma);

            const p = this.createToothPath(
                innerRadius,
                outerRadius,
                Math.PI / 2 + betaStartRad,
                Math.PI / 2 + betaEndRad
            );
            const el = document.createElementNS(SVG_NS, 'path');
            el.setAttribute('d', p);
            el.setAttribute('class', 'antenna-tooth-filled beta-section-mirror');
            el.setAttribute('data-section', 'beta-mirror');
            el.setAttribute('data-angle', `${180 + params.alpha}°-270°`);
            antennaGroup.appendChild(el);

            // Wedge section (filled triangular region)
            const startX = 0;
            const startY = 0;
            const outerEndX = outerRadius * Math.cos(Math.PI / 2 + betaEndRad);
            const outerEndY = outerRadius * Math.sin(Math.PI / 2 + betaEndRad);
            const endX = outerRadius * Math.cos(Math.PI / 2 + betaStartRad);
            const endY = outerRadius * Math.sin(Math.PI / 2 + betaStartRad);
            //'M' = move to start point, 'L' = line to end point, 'A' = arc
            // 'Z' = close path
            const mirrorWedgePath = 'M ' + startX + ' ' + startY + ' L ' + endX + ' ' + endY + ' A ' + outerRadius + ' ' + outerRadius + ' 0 0 1 ' + outerEndX + ' ' + outerEndY + ' Z';
            
            const el2 = document.createElementNS(SVG_NS, 'path');
            el2.setAttribute('d', mirrorWedgePath);
            el2.setAttribute('class', 'antenna-tooth-filled beta-section');
            el2.setAttribute('data-section', 'wedge-mirror');
            el2.setAttribute('data-angle', `${180 + params.alpha}°-270°`);
            antennaGroup.appendChild(el2);
        }

        
        // Draw reference lines (optional)
        const showReferenceLines = true;
        if (showReferenceLines && results.length > 0) { // Ensure results is not empty
            this.drawReferenceLines(antennaGroup, results, params, dynamic_font_size_mm);
        }
        
        this.svg.appendChild(antennaGroup);

        // Adjust zoom to fit the newly drawn antenna
        if (typeof actualOuterRadiusMm !== 'undefined') {
            this.zoomToFit(actualOuterRadiusMm);
        } else {
            // Fallback if actualOuterRadiusMm was not calculated, though previous steps should ensure it is.
            console.error("actualOuterRadiusMm is not defined when attempting to zoomToFit in drawAntennaGeometry.");
            this.zoomToFit(100); // Default to a 100mm radius view as a safe fallback
        }
    }
    
    drawReferenceLines(group, results, params, dynamic_font_size_mm) {
        const outermostRadius = results[results.length - 1].rn * 1000 * Math.sqrt(params.gamma);
        const alphaRad = MathHelpers.degToRad(params.alpha);
        
        // Draw main angle lines
        const angles = [0, params.alpha, 90, 90 + params.alpha, 180, 180 + params.alpha, 270, 270 + params.alpha];
        const colors = ['#666', '#e11d48', '#059669', '#e11d48', '#666', '#e11d48', '#059669', '#e11d48'];
        
        angles.forEach((angle, i) => {
            const angleRad = MathHelpers.degToRad(angle);
            const end = MathHelpers.polarToCartesian(outermostRadius, -Math.PI/2 + angleRad);
            const line = this.createLine(0, 0, end.x, end.y);
            line.setAttribute('class', 'reference-line');
            line.setAttribute('stroke', colors[i]);
            line.setAttribute('stroke-width', '1');
            line.setAttribute('stroke-dasharray', '2, 2');
            group.appendChild(line);
        });
        
        // Add angle labels
        this.addAngleLabels(group, outermostRadius, params.alpha, dynamic_font_size_mm);

        // Prepare radii for labels
        const radiiSource = [];
        if (results.length > 0) {
            radiiSource.push(results[0].rn); // First radius

            if (results.length > 1) {
                const outerMostVal = results[results.length - 1].rn * Math.sqrt(params.gamma);
                if (outerMostVal !== results[0].rn) { // Avoid duplicate if only one result and gamma = 1
                    radiiSource.push(outerMostVal);
                }
            }

            if (results.length > 2) {
                const midIndex1 = Math.floor(results.length / 3);
                if (midIndex1 > 0 && midIndex1 < results.length -1) { // ensure index is not first or last
                     radiiSource.push(results[midIndex1].rn);
                }
                const midIndex2 = Math.floor(2 * results.length / 3);
                if (midIndex2 > 0 && midIndex2 < results.length -1 && midIndex2 !== midIndex1) { // ensure index is not first or last, and not same as midIndex1
                    radiiSource.push(results[midIndex2].rn);
                }
            }
        }

        // Filter unique radii and map to the required format
        const uniqueRadii = [...new Set(radiiSource)];
        const radiiToLabel = uniqueRadii.map(r => ({
            value: r,
            scaledValue: r * 1000
        })).sort((a,b) => a.value - b.value); // Sort by value for consistent labeling order

        // Add radii labels
        if (radiiToLabel.length > 0) {
            const labelAngleRad = MathHelpers.degToRad(-10); // Angle for placing radius labels
            const labelOffset = 20; // Offset from the radius point
            this.addRadiiLabels(group, radiiToLabel, labelAngleRad, dynamic_font_size_mm, labelOffset);
        }
    }
        // Create paths for tooth segments
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

    addAngleLabels(group, radius, alpha, dynamicFontSize) {
        const beta = 90 - alpha;
        const labelOffset = 20; // This offset might need adjustment based on font size or be dynamic
        
        // 0° label
        const zeroLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        zeroLabel.setAttribute('x', '0');
        zeroLabel.setAttribute('y', (-radius - labelOffset).toString());
        zeroLabel.setAttribute('class', 'dimension-text');
        zeroLabel.setAttribute('text-anchor', 'middle');
        zeroLabel.setAttribute('fill', '#666');
        zeroLabel.setAttribute('font-size', dynamicFontSize.toString());
        zeroLabel.textContent = '0°';
        group.appendChild(zeroLabel);
        
        // Alpha label
        const alphaPos = MathHelpers.polarToCartesian(radius + labelOffset, -Math.PI/2 + MathHelpers.degToRad(alpha));
        const alphaLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        alphaLabel.setAttribute('x', alphaPos.x.toString());
        alphaLabel.setAttribute('y', alphaPos.y.toString());
        alphaLabel.setAttribute('class', 'dimension-text');
        alphaLabel.setAttribute('text-anchor', 'middle');
        alphaLabel.setAttribute('fill', '#e11d48');
        alphaLabel.setAttribute('font-size', dynamicFontSize.toString());
        alphaLabel.textContent = `α=${alpha}°`;
        group.appendChild(alphaLabel);
        
        // Beta label
        const betaPos = MathHelpers.polarToCartesian(radius + labelOffset, 0); // Positioned along the x-axis
        const betaLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        betaLabel.setAttribute('x', betaPos.x.toString());
        betaLabel.setAttribute('y', betaPos.y.toString());
        betaLabel.setAttribute('class', 'dimension-text');
        betaLabel.setAttribute('text-anchor', 'middle'); // Center text at (radius + offset, 0)
        betaLabel.setAttribute('dominant-baseline', 'middle'); // Vertically center for better alignment
        betaLabel.setAttribute('fill', '#059669');
        betaLabel.setAttribute('font-size', dynamicFontSize.toString());
        betaLabel.textContent = `β=${beta}°`;
        group.appendChild(betaLabel);
        
        // 180° label
        const label180 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label180.setAttribute('x', '0');
        label180.setAttribute('y', (radius + labelOffset + dynamicFontSize).toString()); // Adjust y based on font size
        label180.setAttribute('class', 'dimension-text');
        label180.setAttribute('text-anchor', 'middle');
        label180.setAttribute('fill', '#666');
        label180.setAttribute('font-size', dynamicFontSize.toString());
        label180.textContent = '180°';
        group.appendChild(label180);
    }

    addRadiiLabels(group, radiiToLabel, angleRad, dynamicFontSize, labelOffset) {
        radiiToLabel.forEach(radius => {
            const pos = MathHelpers.polarToCartesian(radius.scaledValue + labelOffset, angleRad);
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', pos.x.toString());
            label.setAttribute('y', pos.y.toString());
            label.setAttribute('class', 'dimension-text radius-label');
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('fill', '#007bff'); // Or a distinct color
            label.setAttribute('font-size', dynamicFontSize.toString());
            label.textContent = `${radius.value.toFixed(2)}m`;
            group.appendChild(label);
        });
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
        if (this.currentData && this.currentData.results && this.currentData.results.length > 0 && this.currentData.params) {
            const results = this.currentData.results;
            const params = this.currentData.params;
            let actualOuterRadiusMm = results[results.length - 1].rn * 1000 * Math.sqrt(params.gamma);

            if (actualOuterRadiusMm === 0) {
                actualOuterRadiusMm = 100; // Default to a 100mm radius area
                console.warn("Antenna dimensions for resetZoom are zero, defaulting to a 100mm radius view.");
            }
            this.zoomToFit(actualOuterRadiusMm);
        } else {
            // Fallback if there's no current antenna data, revert to a default generic view
            console.warn("No current antenna data for resetZoom, reverting to default viewport.");
            this.viewBox = { x: -500, y: -500, width: 1000, height: 1000 };
            this.scale = 1;
            if (this.svg) {
                this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
            }
        }
    }

    zoomToFit(antennaMaxRadiusMm) {
        const paddingFactor = 1.1; // 10% padding
        let viewWidth, viewHeight, viewX, viewY;

        if (antennaMaxRadiusMm <= 0) {
            // Fallback for zero or negative radius, similar to resetZoom's defaults but adjust as needed
            console.warn("zoomToFit called with invalid antennaMaxRadiusMm. Using default viewport.");
            viewX = -500;
            viewY = -500;
            viewWidth = 1000;
            viewHeight = 1000;
            this.scale = 1; // Reset scale
        } else {
            viewWidth = antennaMaxRadiusMm * 2 * paddingFactor;
            viewHeight = antennaMaxRadiusMm * 2 * paddingFactor;
            viewX = -antennaMaxRadiusMm * paddingFactor;
            viewY = -antennaMaxRadiusMm * paddingFactor;
            // Recalculate scale based on the new viewBox relative to a conceptual default or initial size.
            // If a default viewport width is 1000 units, then scale is 1000 / new viewWidth.
            // This keeps the this.scale property consistent with how zoom() might use it.
            // Alternatively, if this.scale is purely for zoom multiplication factor,
            // setting it to 1 here means "fitted" is the new baseline.
            this.scale = 1;
        }

        this.viewBox = {
            x: viewX,
            y: viewY,
            width: viewWidth,
            height: viewHeight
        };

        if (this.svg) {
            this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
        }
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
        const section = element.getAttribute('data-section');
        
        if (section === 'beta' || section === 'beta-mirror') {
            // Beta section tooltip
            const angle = element.getAttribute('data-angle');
            tooltip.innerHTML = `
                <div class="tooltip-content">
                    <div><span class="tooltip-label">Section:</span> Beta (β)</div>
                    <div><span class="tooltip-label">Angle Range:</span> ${angle}</div>
                    <div><span class="tooltip-label">Type:</span> Solid triangular region</div>
                </div>
            `;
        } else {
            // Regular tooth tooltip
            const toothPair = element.getAttribute('data-tooth-pair');
            const frequency = element.getAttribute('data-frequency');
            const radius = element.getAttribute('data-radius');
            let quadrant = '';
            
            if (element.classList.contains('quadrant-1')) quadrant = 'Q1';
            else if (element.classList.contains('quadrant-3')) quadrant = 'Q3';
            else if (element.classList.contains('quadrant-1-mirror')) quadrant = 'Q1 (mirror)';
            else if (element.classList.contains('quadrant-3-mirror')) quadrant = 'Q3 (mirror)';
            
            tooltip.innerHTML = `
                <div class="tooltip-content">
                    <div><span class="tooltip-label">Tooth:</span> ${toothPair} (${quadrant})</div>
                    <div><span class="tooltip-label">Frequency Range:</span> ${frequency} ${this.currentData.params.outputUnit}</div>
                    <div><span class="tooltip-label">Radius Range:</span> ${radius} m</div>
                </div>
            `;
        }
        
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
    
    // Export SVG as downloadable file
    exportSVG(filename = 'antenna_design.svg') {
        if (!this.svg) return;
        
        // Clone the SVG to avoid modifying the original
        const svgClone = this.svg.cloneNode(true);
        
        // Add XML declaration and namespace
        const svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgClone.outerHTML;
        
        // Create blob and download
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Get antenna geometry data for DXF export
    getAntennaGeometry() {
        if (!this.currentData) return null;
        
        const { results, params } = this.currentData;
        const geometry = [];
        
        // Calculate angles
        const alphaRad = MathHelpers.degToRad(params.alpha);
        const betaStartRad = MathHelpers.degToRad(params.alpha);
        const betaEndRad = MathHelpers.degToRad(90);
        const q3StartRad = MathHelpers.degToRad(90);
        const q3EndRad = MathHelpers.degToRad(90 + params.alpha);
        
        // Generate alternating teeth
        results.forEach((result, index) => {
            if (index < results.length - 1) {
                const currentRn = result.rn * 1000; // Convert to mm
                const nextRn = results[index + 1].rn * 1000;
                
                // Q1 teeth (even indices)
                if (index % 2 === 0) {
                    // First quadrant
                    geometry.push({
                        type: 'tooth',
                        quadrant: 'Q1',
                        toothPair: `${result.n}-${results[index + 1].n}`,
                        vertices: this.getToothVertices(currentRn, nextRn, -Math.PI/2, -Math.PI/2 + alphaRad)
                    });
                    
                    // Mirror quadrant
                    geometry.push({
                        type: 'tooth',
                        quadrant: 'Q1-mirror',
                        toothPair: `${result.n}-${results[index + 1].n}`,
                        vertices: this.getToothVertices(currentRn, nextRn, Math.PI/2, Math.PI/2 + alphaRad)
                    });
                }
                
                // Q3 teeth (odd indices)
                if (index % 2 === 1) {
                    // Third quadrant
                    geometry.push({
                        type: 'tooth',
                        quadrant: 'Q3',
                        toothPair: `${result.n}-${results[index + 1].n}`,
                        vertices: this.getToothVertices(currentRn, nextRn, -Math.PI/2 + q3StartRad, -Math.PI/2 + q3EndRad)
                    });
                    
                    // Mirror quadrant
                    geometry.push({
                        type: 'tooth',
                        quadrant: 'Q3-mirror',
                        toothPair: `${result.n}-${results[index + 1].n}`,
                        vertices: this.getToothVertices(currentRn, nextRn, Math.PI/2 + q3StartRad, Math.PI/2 + q3EndRad)
                    });
                }
            }
        });
        
        // Add beta sections
        if (results.length > 0) {
            const innerRadius = results[0].rn * 1000;
            const outerRadius = results[results.length - 1].rn * 1000 * Math.sqrt(params.gamma);
            
            // Beta section 1
            geometry.push({
                type: 'beta',
                quadrant: 'Q2',
                vertices: this.getToothVertices(innerRadius, outerRadius, -Math.PI/2 + betaStartRad, -Math.PI/2 + betaEndRad)
            });
            
            // Beta section 2 (mirror)
            geometry.push({
                type: 'beta',
                quadrant: 'Q2-mirror',
                vertices: this.getToothVertices(innerRadius, outerRadius, Math.PI/2 + betaStartRad, Math.PI/2 + betaEndRad)
            });
        }
        
        return geometry;
    }
    
    getToothVertices(innerRadius, outerRadius, startAngle, endAngle) {
        const innerStart = MathHelpers.polarToCartesian(innerRadius, startAngle);
        const innerEnd = MathHelpers.polarToCartesian(innerRadius, endAngle);
        const outerStart = MathHelpers.polarToCartesian(outerRadius, startAngle);
        const outerEnd = MathHelpers.polarToCartesian(outerRadius, endAngle);
        
        return [innerStart, outerStart, outerEnd, innerEnd];
    }
}