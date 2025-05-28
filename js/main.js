// Main Application Module
import { AntennaCalculator } from './modules/calculator.js';
import { AntennaVisualizer } from './modules/visualization.js';
import { DXFExporter } from './modules/dxfExporter.js';

class AntennaCalcApp {
    constructor() {
        this.calculator = new AntennaCalculator();
        this.visualizer = new AntennaVisualizer();
        this.dxfExporter = new DXFExporter();
        
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
        radioInputs.forEach(radio => {
            radio.addEventListener('change', () => this.handleInputModeChange());
        });

        // Export button
        const exportBtn = document.getElementById('export-dxf');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport());
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
        this.clearAllErrors();
        
        // Get input values
        const inputMode = document.querySelector('input[name="inputMode"]:checked').value;
        const params = this.getFormParameters();
        
        // Validate inputs
        const validation = this.validateInputs(params, inputMode);
        if (!validation.valid) {
            this.showErrors(validation.errors);
            return;
        }
        
        // Calculate results
        try {
            const results = this.calculator.calculate(params, inputMode);
            this.currentResults = results;
            
            // Display results
            this.displayResults(results, params);
            
            // Update visualization
            this.visualizer.drawAntenna(results, params);
            
            // Enable export button
            document.getElementById('export-dxf').disabled = false;
            
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
            beta: parseFloat(document.getElementById('beta').value),
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
        
        if (isNaN(params.alpha) || params.alpha <= 0) {
            errors['alpha-error'] = 'Tooth angle (α) must be greater than 0 degrees';
        }
        
        if (isNaN(params.beta) || params.beta <= 0) {
            errors['beta-error'] = 'Tooth angle (β) must be greater than 0 degrees';
        }
        
        // Check that alpha + beta < 180
        if (!isNaN(params.alpha) && !isNaN(params.beta)) {
            if (params.alpha + params.beta >= 180) {
                errors['alpha-error'] = 'α + β must be less than 180 degrees';
                errors['beta-error'] = 'α + β must be less than 180 degrees';
            }
        }
        
        if (isNaN(params.Eeff) || params.Eeff < 1) {
            errors['Eeff-error'] = 'Effective permittivity (εₑff) must be greater than or equal to 1';
        }
        
        if (isNaN(params.toothPairs) || params.toothPairs < 1 || params.toothPairs > 10) {
            errors['toothPairs-error'] = 'Number of tooth pairs must be between 1 and 10';
        }
        
        return {
            valid: Object.keys(errors).length === 0,
            errors: errors
        };
    }

    displayResults(results, params) {
        const container = document.getElementById('results-container');
        
        // Create results table
        let tableHTML = `
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Tooth Pair (n)</th>
                        <th>Inner Radius (rₙ) [m]</th>
                        <th>Inner Radius (rₙ) [inches]</th>
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

    handleExport() {
        if (!this.currentResults) return;
        
        const params = this.getFormParameters();
        const dxfContent = this.dxfExporter.generateDXF(this.currentResults, params);
        
        // Create and download file
        const blob = new Blob([dxfContent], { type: 'application/dxf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `antenna_${Date.now()}.dxf`;
        a.click();
        URL.revokeObjectURL(url);
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
    window.antennaCalcApp = new AntennaCalcApp();
});