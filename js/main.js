console.log('[main.js] loaded at', new Date());
// Main Application Module
import { AntennaCalculator } from './modules/calculator.js';
import { AntennaVisualizer } from './modules/visualization.js';
import { AntennaGeometry } from './modules/antennaGeometry.js'; // Added for testing
// import { DXFExporter } from './modules/dxfExporter.js';
  

class AntennaCalcApp {
    constructor() {
        this.calculator = new AntennaCalculator();
        this.visualizer = new AntennaVisualizer();
        // this.dxfExporter = new DXFExporter();
        
        this.currentResults = null;
        this.init();
    }

    init() {
        this.bindEventListeners();
        this.setupInitialState();
    }

    bindEventListeners() {
        // Form submission
        const form = document.getElementById('calculator-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCalculate();
        });

        // Input mode change
        const radioInputs = document.querySelectorAll('input[name="inputMode"]');
        console.log('Found radio inputs',radioInputs.length);
        radioInputs.forEach(radio => {
            radio.addEventListener('change', () => this.handleInputModeChange());
        });

        // Export button
        // const exportDxfBtn = document.getElementById('export-dxf');
        // if (exportDxfBtn) {
        //     exportDxfBtn.addEventListener('click', () => this.handleDxfExport());
        // }
        
        const exportSvgBtn = document.getElementById('export-svg');
        if (exportSvgBtn) {
            exportSvgBtn.addEventListener('click', () => this.handleSvgExport());
        }

        // Real-time validation
        const inputs = form.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.clearError(input.id));
        });
    }

    setupInitialState() {
        // Set default values if needed
        this.handleInputModeChange(); 
    }

    handleInputModeChange() {
        const inputMode = document.querySelector('input[name="inputMode"]:checked').value;
        const r1Input = document.getElementById('r1-input');
        const f1Input = document.getElementById('f1-input');

        console.log('mode changed')

        if (inputMode === 'r1') {
            r1Input.classList.remove('hidden');
            f1Input.classList.add('hidden');
            document.getElementById('r1').required = true;
            document.getElementById('f1').required = false;
        } else {
            r1Input.classList.add('hidden');
            f1Input.classList.remove('hidden');
            document.getElementById('r1').required = false;
            document.getElementById('f1').required = true;
        }
        
        this.clearAllErrors();
    }

    handleCalculate() {
       
        // Clear previous results and errors
        this.clearAllErrors();

        const inputMode = document.querySelector('input[name="inputMode"]:checked').value;
        const params = this.getFormParameters();

  if (!this.validateInputs(params)) return;
        
        // Calculate results
        try {
            const { results, feedGap } = this.calculator.calculate(params, inputMode);
            this.currentResults = results;
            this.currentFeedGap = feedGap;

            // Display results
            this.displayResults(results, params, feedGap);
                                        
            // Update visualization
            this.visualizer.drawAntenna(this.currentResults, params, this.currentFeedGap);
            // this.visualizer.updateFeedGap(feedGap);
            
            // Enable export button
            // document.getElementById('export-dxf').disabled = false;
            
            // Show results card
            document.getElementById('results-card').classList.remove('hidden');
            
            // Show export controls
            const exportControls = document.querySelector('.export-controls');
            if (exportControls) {
                exportControls.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Calculation error:', error);
            this.showError('gamma-error', 'Calculation failed. Please check your inputs.');
        }
    }

    getFormParameters() {
        const inputMode = document.querySelector('input[name="inputMode"]:checked').value;
        const params = {
            gamma: parseFloat(document.getElementById('gamma').value),
            alpha: parseFloat(document.getElementById('alpha').value),
            Eeff: parseFloat(document.getElementById('Eeff').value),
            toothPairs: parseInt(document.getElementById('toothPairs').value),
            outputUnit: document.getElementById('frequency-unit').value
        };
        
        if (inputMode === 'r1') {
            params.r1 = parseFloat(document.getElementById('r1').value);
        } else {
            params.f1 = parseFloat(document.getElementById('f1').value);
            params.f1Unit = document.getElementById('f1-unit').value;
        }
        
        return params;
    }

    validateInputs(params, inputMode) {
        const errors = {};
        
        if (inputMode === 'r1') {
            if (isNaN(params.r1) || params.r1 <= 0) {
                errors['r1-error'] = 'Please enter a valid positive value for r₁';
            }
        } else {
            if (isNaN(params.f1) || params.f1 <= 0) {
                errors['f1-error'] = 'Please enter a valid positive value for f₁';
            }
        }
        
        if (isNaN(params.gamma) || params.gamma <= 0) {
            errors['gamma-error'] = 'Scaling factor (Γ) must be greater than zero';
        }
        
        if (isNaN(params.alpha) || params.alpha <= 0 || params.alpha > 90) {
            errors['alpha-error'] = 'Tooth angle (α) must be between 0 and 90 degrees';
        }
        
        if (isNaN(params.Eeff) || params.Eeff < 1) {
            errors['Eeff-error'] = 'Effective permittivity (εₑff) must be greater than or equal to 1';
        }
        
        if (isNaN(params.toothPairs) || params.toothPairs < 1 || params.toothPairs > 16) {
            errors['toothPairs-error'] = 'Number of tooth pairs must be 16 or fewer';
        }
        
        return {
            valid: Object.keys(errors).length === 0,
            errors: errors
        };
    }

    displayResults(results, params,) {
        const container = document.getElementById('results-container');
        
        // Create results table
        let tableHTML = `
            <table class="results-table">
                <thead>
                    <tr class="bg-slate-100 font-semibold">
                    <td colspan="2">Feed-gap (g)</td>
                    <td>${(this.currentFeedGap * 39.3701).toFixed(3)}&nbsp;in</td>
                    <td>${this.currentFeedGap.toFixed(6)}&nbsp;m</td>
                    </tr>
                    <tr>
                        <th>Tooth Pair (n)</th>
                        <th>Radius (rₙ) [m]</th>
                        <th>Radius (rₙ) [inches]</th>
                        <th>Frequency (fₙ) [${params.outputUnit}]</th>
                    </tr>
                </thead>
                <tbody>
        `;
        

        results.forEach(result => {
            tableHTML += `
                <tr>
                    <td>${result.n}</td>
                    <td>${result.rn.toFixed(6)}</td>
                    <td>${result.rnInches.toFixed(6)}</td>
                    <td>${result.fnDisplay.toFixed(6)}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        
        // Add fade-in animation
        container.classList.add('fade-in');
    }

    // handleDxfExport() {
    //     if (!this.currentResults) return;
        
    //     const params = this.getFormParameters();
    //     const dxfContent = this.dxfExporter.generateDXF(this.currentResults, params);
        
    //     // Create and download file
    //     const blob = new Blob([dxfContent], { type: 'application/dxf' });
    //     const url = URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = `antenna_${Date.now()}.dxf`;
    //     a.click();
    //     URL.revokeObjectURL(url);
    // }
    
    handleSvgExport() {
        if (!this.currentResults) return;
        
        const params = this.getFormParameters();
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `antenna_${params.alpha}deg_${params.toothPairs}pairs_${timestamp}.svg`;
        
        this.visualizer.exportSVG(filename);
    }

    showErrors(errors) {
        Object.keys(errors).forEach(id => {
            this.showError(id, errors[id]);
        });
    }

    showError(fieldId, message) {
        const errorElement = document.getElementById(fieldId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    clearError(fieldId) {
        const errorElement = document.getElementById(fieldId + '-error');
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    clearAllErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    tippy('[data-tippy-content]', {
        trigger: 'mouseenter focus', // show on hover or focus
        placement: 'top',        // or 'top', 'bottom'…
        animation: 'shift-away',   // nice subtle slide
        theme: 'light-border',     // built-in theme
        allowHTML: true            // if you ever slip in <strong> or MathJax
    }); 
   window.antennaCalcApp = new AntennaCalcApp();
   console.log('AntennaCalcApp initialized');

    // --- Test code for SVG and DXF export ---
    console.log('--- Starting SVG and DXF Export Test ---');

    const sampleResults = [
        { rn: 0.1, n: 1, fnDisplay: 100 },
        { rn: 0.2, n: 2, fnDisplay: 200 },
        { rn: 0.3, n: 3, fnDisplay: 300 },
        { rn: 0.4, n: 4, fnDisplay: 400 }
    ];
    const sampleParams = {
        alpha: 30,
        gamma: 1.2,
        r1: 0.1,
        toothPairs: 4,
        outputUnit: 'GHz'
    };
    const feedGap = 0.001;

    const visualizer = new AntennaVisualizer();
    // Ensure the container exists in the DOM if drawAntenna relies on it.
    // For this test, we assume a simplified scenario or that drawAntenna handles a missing container gracefully.
    // If #antenna-visualization is strictly required by drawAntenna, this test needs a DOM element.
    // However, exportSVG primarily needs this.currentData and this.svg (if bounds calculation is tied to it).
    // The refactored exportSVG should ideally get bounds from AntennaGeometry directly if possible.

    // Simulate drawAntenna to populate necessary properties
    visualizer.currentData = { results: sampleResults, params: sampleParams };
    // Create a dummy SVG element as it's checked in exportSVG
    visualizer.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    visualizer.svg.setAttribute('viewBox', '0 0 1000 1000'); // Initial dummy viewBox

    console.log('Simulating drawAntenna call...');
    // We are not calling visualizer.drawAntenna(sampleResults, sampleParams, feedGap);
    // because it might have complex DOM manipulations not suitable for this headless test.
    // Instead, we directly set the properties that exportSVG and getAntennaGeometry rely on.


    // Simulate Zoom
    console.log('Simulating zoom...');
    visualizer.viewBox = { x: -50, y: -50, width: 100, height: 100 };
    visualizer.svg.setAttribute('viewBox', `${visualizer.viewBox.x} ${visualizer.viewBox.y} ${visualizer.viewBox.width} ${visualizer.viewBox.height}`);
    console.log('Zoomed viewBox (visualizer.viewBox):', visualizer.viewBox);
    console.log('Zoomed viewBox (SVG attribute):', visualizer.svg.getAttribute('viewBox'));


    // Test SVG Export
    console.log('Testing SVG Export...');
    const svgString = visualizer.exportSVG('test_full_antenna.svg');
    if (svgString) {
        // Extract viewBox using regex
        const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
        const extractedViewBox = viewBoxMatch ? viewBoxMatch[1] : null;
        console.log('Extracted viewBox from exported SVG:', extractedViewBox);

        const geom = new AntennaGeometry();
        const expectedGeomData = geom.generateCompleteGeometry(sampleResults, sampleParams);
        const expectedBounds = expectedGeomData.bounds;

        if (expectedBounds && expectedBounds.width > 0 && expectedBounds.height > 0) {
            const paddingWidth = expectedBounds.width * 0.1;
            const paddingHeight = expectedBounds.height * 0.1;
            const expectedViewBoxX = expectedBounds.min.x - paddingWidth / 2;
            const expectedViewBoxY = expectedBounds.min.y - paddingHeight / 2;
            const expectedViewBoxWidth = expectedBounds.width + paddingWidth;
            const expectedViewBoxHeight = expectedBounds.height + paddingHeight;
            const expectedPaddedViewBox = `${expectedViewBoxX} ${expectedViewBoxY} ${expectedViewBoxWidth} ${expectedViewBoxHeight}`;
            console.log('Expected Bounds (raw):', expectedBounds);
            console.log('Expected padded viewBox for SVG export:', expectedPaddedViewBox);
        } else {
            console.log('Could not calculate expected bounds for SVG export.');
        }
    } else {
        console.error('SVG Export test failed: exportSVG did not return a string.');
    }

    // Test DXF Data Generation
    console.log('Testing DXF Data Generation (getAntennaGeometry)...');
    // For getAntennaGeometry, currentData must be set on the visualizer instance
    visualizer.currentData = { results: sampleResults, params: sampleParams }; // Ensure it's set
    const dxfData = visualizer.getAntennaGeometry();
    if (dxfData) {
        console.log('DXF Data (getAntennaGeometry) generated. Structure:');
        // Basic structure check: is it an array and does it have elements if expected?
        if (Array.isArray(dxfData) && dxfData.length > 0) {
            console.log(`  Type: Array, Length: ${dxfData.length}`);
            console.log('  First element structure:', dxfData[0] ? Object.keys(dxfData[0]).join(', ') : 'Empty array');
            // console.log(JSON.stringify(dxfData, null, 2)); // Full dump can be too verbose
        } else if (Array.isArray(dxfData) && dxfData.length === 0) {
             console.log('  Type: Array, Length: 0. DXF Data is empty, which might be valid for empty results.');
        } else {
            console.log('  DXF Data structure is not an array or is null/undefined.');
        }
    } else {
        console.error('DXF Data generation test failed: getAntennaGeometry returned null or undefined.');
    }
    console.log('--- End of SVG and DXF Export Test ---');
});