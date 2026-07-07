// ===== ADMIN PANEL - CYCLING RESULTS =====

(function() {
    'use strict';

    // State
    let currentResults = [];

    // DOM Elements
    const eventName = document.getElementById('event-name');
    const eventDate = document.getElementById('event-date');
    const eventPlace = document.getElementById('event-place');
    const eventDistance = document.getElementById('event-distance');
    const eventOrganizer = document.getElementById('event-organizer');
    const uploadArea = document.getElementById('upload-area');
    const csvFileInput = document.getElementById('csv-file');
    const dataPreview = document.getElementById('data-preview');
    const jsonOutput = document.getElementById('json-output');
    const alertSuccess = document.getElementById('alert-success');
    const alertError = document.getElementById('alert-error');

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        loadExistingData();
        setupEventListeners();
    }

    function setupEventListeners() {
        // Template download
        document.getElementById('btn-download-template').addEventListener('click', downloadTemplate);

        // CSV Upload
        uploadArea.addEventListener('click', () => csvFileInput.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        csvFileInput.addEventListener('change', handleFileSelect);

        // Add individual runner
        document.getElementById('btn-add-runner').addEventListener('click', addRunner);

        // JSON actions
        document.getElementById('btn-copy-json').addEventListener('click', copyJSON);
        document.getElementById('btn-download-json').addEventListener('click', downloadJSON);
        document.getElementById('btn-clear-all').addEventListener('click', clearAll);

        // Auto-update JSON when event info changes
        [eventName, eventDate, eventPlace, eventDistance, eventOrganizer].forEach(el => {
            el.addEventListener('input', updateJSONOutput);
        });
    }

    // Load existing data
    function loadExistingData() {
        fetch('data/resultados.json?t=' + Date.now())
            .then(r => r.json())
            .then(data => {
                if (data.evento) {
                    eventName.value = data.evento.nombre || '';
                    eventDate.value = data.evento.fecha || '';
                    eventPlace.value = data.evento.lugar || '';
                    eventDistance.value = data.evento.distancia || '';
                    eventOrganizer.value = data.evento.organizador || '';
                }
                if (data.resultados) {
                    currentResults = data.resultados;
                    renderPreview();
                    updateJSONOutput();
                }
            })
            .catch(() => {
                // No existing data, start fresh
                updateJSONOutput();
            });
    }

    // Download CSV template
    function downloadTemplate() {
        const headers = 'posicion,dorsal,nombre,categoria,evento,tiempo,diferencia';
        const example1 = '1,101,Carlos Martinez,Elite Varonil,80 km,02:15:32,-';
        const example2 = '2,115,Miguel Rodriguez,Elite Varonil,80 km,02:16:45,+01:13';
        const example3 = '3,205,Ana Ramirez,Elite Femenil,80 km,02:25:40,+10:08';
        
        const content = [headers, example1, example2, example3].join('\n');
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_resultados.csv';
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
        if (file && file.name.endsWith('.csv')) {
            processCSV(file);
        } else {
            showAlert('error', 'Por favor sube un archivo CSV valido');
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            processCSV(file);
        }
    }

    // Process CSV file
    function processCSV(file) {
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
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                
                // Validate required columns
                const requiredCols = ['posicion', 'dorsal', 'nombre', 'categoria', 'evento', 'tiempo'];
                const missingCols = requiredCols.filter(col => !headers.includes(col));
                
                if (missingCols.length > 0) {
                    showAlert('error', `Faltan columnas: ${missingCols.join(', ')}. Descarga la plantilla para ver el formato correcto.`);
                    return;
                }

                // Parse data rows
                const results = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = parseCSVLine(lines[i]);
                    if (values.length >= headers.length) {
                        const row = {};
                        headers.forEach((h, idx) => {
                            row[h] = values[idx] ? values[idx].trim() : '';
                        });

                        results.push({
                            posicion: parseInt(row.posicion) || i,
                            dorsal: parseInt(row.dorsal) || 0,
                            nombre: row.nombre || '',
                            categoria: row.categoria || '',
                            evento: row.evento || '',
                            tiempo: row.tiempo || '',
                            diferencia: row.diferencia || '-'
                        });
                    }
                }

                if (results.length === 0) {
                    showAlert('error', 'No se encontraron datos validos en el archivo');
                    return;
                }

                currentResults = results;
                renderPreview();
                updateJSONOutput();
                showAlert('success', `Se cargaron ${results.length} resultados correctamente`);

            } catch (err) {
                showAlert('error', 'Error al procesar el archivo: ' + err.message);
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

    // Add individual runner
    function addRunner() {
        const position = parseInt(document.getElementById('add-position').value);
        const dorsal = parseInt(document.getElementById('add-dorsal').value);
        const name = document.getElementById('add-name').value.trim();
        const category = document.getElementById('add-category').value.trim();
        const event = document.getElementById('add-event').value.trim();
        const time = document.getElementById('add-time').value.trim();
        const diff = document.getElementById('add-diff').value.trim() || '-';

        if (!dorsal || !name) {
            showAlert('error', 'Al menos el dorsal y nombre son obligatorios');
            return;
        }

        const runner = {
            posicion: position || (currentResults.length + 1),
            dorsal: dorsal,
            nombre: name,
            categoria: category,
            evento: event,
            tiempo: time,
            diferencia: diff
        };

        currentResults.push(runner);
        
        // Sort by position
        currentResults.sort((a, b) => a.posicion - b.posicion);

        // Clear form
        document.getElementById('add-position').value = '';
        document.getElementById('add-dorsal').value = '';
        document.getElementById('add-name').value = '';
        document.getElementById('add-category').value = '';
        document.getElementById('add-event').value = '';
        document.getElementById('add-time').value = '';
        document.getElementById('add-diff').value = '';

        renderPreview();
        updateJSONOutput();
        showAlert('success', `Corredor "${name}" agregado correctamente`);
    }

    // Render preview table
    function renderPreview() {
        if (currentResults.length === 0) {
            dataPreview.style.display = 'none';
            return;
        }

        dataPreview.style.display = 'block';
        dataPreview.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Pos</th>
                        <th>Dorsal</th>
                        <th>Nombre</th>
                        <th>Categoria</th>
                        <th>Evento</th>
                        <th>Tiempo</th>
                        <th>Dif</th>
                        <th>Accion</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentResults.map((r, i) => `
                        <tr>
                            <td>${r.posicion}</td>
                            <td>${r.dorsal}</td>
                            <td>${r.nombre}</td>
                            <td>${r.categoria}</td>
                            <td>${r.evento}</td>
                            <td>${r.tiempo}</td>
                            <td>${r.diferencia}</td>
                            <td><button onclick="removeRunner(${i})" style="color: #ea4335; border: none; background: none; cursor: pointer; font-size: 1.2rem;" title="Eliminar">&times;</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // Remove runner (exposed globally for onclick)
    window.removeRunner = function(index) {
        currentResults.splice(index, 1);
        renderPreview();
        updateJSONOutput();
    };

    // Update JSON output
    function updateJSONOutput() {
        const data = {
            evento: {
                nombre: eventName.value || 'Competencia de Ciclismo',
                fecha: eventDate.value || '',
                lugar: eventPlace.value || '',
                distancia: eventDistance.value || '',
                organizador: eventOrganizer.value || ''
            },
            resultados: currentResults
        };

        jsonOutput.value = JSON.stringify(data, null, 4);
    }

    // Copy JSON to clipboard
    function copyJSON() {
        jsonOutput.select();
        jsonOutput.setSelectionRange(0, 99999);
        
        try {
            navigator.clipboard.writeText(jsonOutput.value).then(() => {
                showAlert('success', 'JSON copiado al portapapeles. Pegalo en data/resultados.json en GitHub.');
            }).catch(() => {
                document.execCommand('copy');
                showAlert('success', 'JSON copiado. Pegalo en data/resultados.json en GitHub.');
            });
        } catch (e) {
            document.execCommand('copy');
            showAlert('success', 'JSON copiado. Pegalo en data/resultados.json en GitHub.');
        }
    }

    // Download JSON file
    function downloadJSON() {
        const blob = new Blob([jsonOutput.value], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resultados.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Clear all data
    function clearAll() {
        if (confirm('¿Estas seguro de que quieres borrar todos los resultados?')) {
            currentResults = [];
            renderPreview();
            updateJSONOutput();
            showAlert('success', 'Todos los datos han sido eliminados');
        }
    }

    // Show alert message
    function showAlert(type, message) {
        const alert = type === 'success' ? alertSuccess : alertError;
        alert.textContent = message;
        alert.classList.add('show');
        
        // Hide other alert
        const other = type === 'success' ? alertError : alertSuccess;
        other.classList.remove('show');

        setTimeout(() => {
            alert.classList.remove('show');
        }, 5000);
    }

})();
