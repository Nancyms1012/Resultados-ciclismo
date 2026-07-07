// ===== ADMIN PANEL - CYCLING RESULTS =====
// Panel simplificado: solo vista previa de CSV y descarga de plantilla

(function() {
    'use strict';

    // DOM Elements
    const uploadArea = document.getElementById('upload-area');
    const csvFileInput = document.getElementById('csv-file');
    const dataPreview = document.getElementById('data-preview');
    const alertSuccess = document.getElementById('alert-success');
    const alertError = document.getElementById('alert-error');

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        setupEventListeners();
    }

    function setupEventListeners() {
        // Template download
        document.getElementById('btn-download-template').addEventListener('click', downloadTemplate);

        // CSV Upload for preview
        uploadArea.addEventListener('click', () => csvFileInput.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        csvFileInput.addEventListener('change', handleFileSelect);
    }

    // Download CSV template
    function downloadTemplate() {
        const headers = 'posicion,dorsal,nombre,categoria,evento,tiempo,diferencia';
        const example1 = '1,101,Carlos Martinez,Elite Varonil,80 km,02:15:32,-';
        const example2 = '2,115,Miguel Rodriguez,Elite Varonil,80 km,02:16:45,+01:13';
        const example3 = '3,205,Ana Ramirez,Elite Femenil,80 km,02:25:40,+10:08';
        const example4 = '4,301,Diego Flores,Juvenil,40 km,01:35:22,-';
        
        const content = [headers, example1, example2, example3, example4].join('\n');
        const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resultados.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Drag and drop handlers
    function handleDragOver(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '#1a73e8';
        uploadArea.style.background = '#e8f0fe';
    }

    function handleDragLeave(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
        
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
            previewCSV(file);
        } else {
            showAlert('error', 'Por favor sube un archivo CSV valido');
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            previewCSV(file);
        }
    }

    // Preview CSV file (just for validation before uploading to GitHub)
    function previewCSV(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const lines = text.split(/\r?\n/).filter(line => line.trim());
                
                if (lines.length < 2) {
                    showAlert('error', 'El archivo esta vacio o no tiene datos');
                    return;
                }

                // Parse header
                const headers = lines[0].split(',').map(h => h.trim());

                // Parse data rows
                const rows = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = parseCSVLine(lines[i]);
                    if (values.length > 0 && values.some(v => v.trim())) {
                        rows.push(values);
                    }
                }

                if (rows.length === 0) {
                    showAlert('error', 'No se encontraron datos en el archivo');
                    return;
                }

                // Render preview
                renderPreview(headers, rows);
                showAlert('success', `Tu CSV tiene ${rows.length} corredores y se ve correcto. Ahora subelo a GitHub en la carpeta data/`);

            } catch (err) {
                showAlert('error', 'Error al leer el archivo: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    // Parse a CSV line (handles quoted values)
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    // Render preview table
    function renderPreview(headers, rows) {
        dataPreview.style.display = 'block';
        dataPreview.innerHTML = `
            <table>
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            ${row.map(cell => `<td>${cell.trim()}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // Show alert message
    function showAlert(type, message) {
        const alert = type === 'success' ? alertSuccess : alertError;
        alert.textContent = message;
        alert.classList.add('show');
        
        const other = type === 'success' ? alertError : alertSuccess;
        other.classList.remove('show');

        setTimeout(() => {
            alert.classList.remove('show');
        }, 8000);
    }

})();
