// ===== CYCLING RESULTS APP =====
// Lee directamente un archivo CSV - no necesitas saber JSON

(function() {
    'use strict';

    // State
    let allResults = [];
    let filteredResults = [];
    let currentSort = { field: 'posicion', direction: 'asc' };
    let categories = [];
    let events = [];

    // DOM Elements
    const searchInput = document.getElementById('search-text');
    const categorySelect = document.getElementById('filter-category');
    const eventSelect = document.getElementById('filter-event');
    const btnSearch = document.getElementById('btn-search');
    const btnClear = document.getElementById('btn-clear');
    const btnRefresh = document.getElementById('btn-refresh');
    const resultsBody = document.getElementById('results-body');
    const resultsCards = document.getElementById('results-cards');
    const resultsCount = document.getElementById('results-count');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');
    const tableWrapper = document.querySelector('.table-wrapper');
    const eventTitle = document.getElementById('event-title');
    const eventDetails = document.getElementById('event-details');

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        loadData();
        setupEventListeners();
    }

    function setupEventListeners() {
        btnSearch.addEventListener('click', applyFilters);
        btnClear.addEventListener('click', clearFilters);
        btnRefresh.addEventListener('click', loadData);

        // Search on Enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') applyFilters();
        });

        // Real-time search as you type
        searchInput.addEventListener('input', debounce(applyFilters, 300));
        categorySelect.addEventListener('change', applyFilters);
        eventSelect.addEventListener('change', applyFilters);

        // Sortable columns
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', function() {
                const field = this.dataset.sort;
                if (currentSort.field === field) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.field = field;
                    currentSort.direction = 'asc';
                }
                updateSortIndicators();
                renderResults();
            });
        });
    }

    // ===== LOAD DATA FROM CSV FILE =====
    function loadData() {
        showLoading(true);

        // Load event config first, then CSV results
        const cacheBuster = '?t=' + Date.now();

        // Try to load event info from config file
        fetch('data/evento.csv' + cacheBuster)
            .then(response => {
                if (!response.ok) throw new Error('No event config');
                return response.text();
            })
            .then(text => {
                parseEventConfig(text);
            })
            .catch(() => {
                // No event config, use defaults
                eventTitle.textContent = 'Resultados de Ciclismo';
                eventDetails.textContent = '';
            });

        // Load results from CSV
        fetch('data/resultados.csv' + cacheBuster)
            .then(response => {
                if (!response.ok) throw new Error('No se encontro el archivo CSV');
                return response.text();
            })
            .then(text => {
                allResults = parseCSV(text);

                // Extract unique categories and events
                categories = [...new Set(allResults.map(r => r.categoria).filter(c => c))].sort();
                events = [...new Set(allResults.map(r => r.evento).filter(e => e))].sort();

                populateFilters();
                applyFilters();
                showLoading(false);
            })
            .catch(error => {
                console.log('Info:', error.message);
                showLoading(false);
                allResults = [];
                filteredResults = [];
                eventTitle.textContent = 'Resultados de Ciclismo';
                eventDetails.textContent = 'Sube el archivo resultados.csv a la carpeta data/';
                renderResults();
            });
    }

    // ===== CSV PARSER =====
    function parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(line => line.trim());

        if (lines.length < 2) return [];

        // Parse header row
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Map common column names (flexible - accepts different names)
        const colMap = {
            posicion: findColumn(headers, ['posicion', 'pos', 'lugar', 'position', 'place', '#']),
            dorsal: findColumn(headers, ['dorsal', 'numero', 'num', 'bib', 'number', 'no']),
            nombre: findColumn(headers, ['nombre', 'name', 'corredor', 'ciclista', 'rider', 'atleta']),
            categoria: findColumn(headers, ['categoria', 'cat', 'category', 'grupo', 'group']),
            evento: findColumn(headers, ['evento', 'event', 'distancia', 'distance', 'modalidad', 'ruta']),
            tiempo: findColumn(headers, ['tiempo', 'time', 'hora', 'crono', 'finish']),
            diferencia: findColumn(headers, ['diferencia', 'dif', 'diff', 'gap', 'delta'])
        };

        // Parse data rows
        const results = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0) continue;

            const row = {
                posicion: getVal(values, colMap.posicion, i),
                dorsal: getVal(values, colMap.dorsal, ''),
                nombre: getVal(values, colMap.nombre, ''),
                categoria: getVal(values, colMap.categoria, ''),
                evento: getVal(values, colMap.evento, ''),
                tiempo: getVal(values, colMap.tiempo, ''),
                diferencia: getVal(values, colMap.diferencia, '-')
            };

            // Convert numeric fields
            row.posicion = parseInt(row.posicion) || i;
            row.dorsal = parseInt(row.dorsal) || 0;

            // Skip rows without a name
            if (row.nombre.trim()) {
                results.push(row);
            }
        }

        return results;
    }

    // Find a column index by trying multiple possible header names
    function findColumn(headers, possibleNames) {
        for (const name of possibleNames) {
            const idx = headers.indexOf(name);
            if (idx !== -1) return idx;
        }
        return -1;
    }

    // Get value from array by index, with default
    function getVal(values, index, defaultVal) {
        if (index === -1 || index >= values.length) return defaultVal;
        return values[index].trim() || defaultVal;
    }

    // Parse a single CSV line (handles quoted values with commas inside)
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

    // Parse event configuration from CSV
    function parseEventConfig(text) {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        const config = {};

        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length >= 2) {
                const key = parts[0].trim().toLowerCase();
                const value = parts.slice(1).join(',').trim();
                config[key] = value;
            }
        }

        const nombre = config.nombre || config.evento || config.name || 'Competencia de Ciclismo';
        eventTitle.textContent = nombre;

        const detailParts = [];
        if (config.fecha || config.date) detailParts.push(config.fecha || config.date);
        if (config.lugar || config.place || config.ciudad) detailParts.push(config.lugar || config.place || config.ciudad);
        if (config.distancia || config.distance) detailParts.push(config.distancia || config.distance);
        eventDetails.textContent = detailParts.join(' | ');
    }

    // ===== FILTERS =====
    function populateFilters() {
        categorySelect.innerHTML = '<option value="">Todas las categorias</option>';
        eventSelect.innerHTML = '<option value="">Todos los eventos</option>';

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });

        events.forEach(evt => {
            const option = document.createElement('option');
            option.value = evt;
            option.textContent = evt;
            eventSelect.appendChild(option);
        });
    }

    function applyFilters() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedCategory = categorySelect.value;
        const selectedEvent = eventSelect.value;

        filteredResults = allResults.filter(result => {
            const matchesSearch = !searchTerm ||
                result.dorsal.toString().includes(searchTerm) ||
                result.nombre.toLowerCase().includes(searchTerm);

            const matchesCategory = !selectedCategory || result.categoria === selectedCategory;
            const matchesEvent = !selectedEvent || result.evento === selectedEvent;

            return matchesSearch && matchesCategory && matchesEvent;
        });

        renderResults();
    }

    function clearFilters() {
        searchInput.value = '';
        categorySelect.value = '';
        eventSelect.value = '';
        filteredResults = [...allResults];
        renderResults();
    }

    // ===== RENDER =====
    function renderResults() {
        const sorted = sortResults([...filteredResults]);

        if (filteredResults.length === allResults.length) {
            resultsCount.textContent = `Mostrando todos los resultados (${allResults.length})`;
        } else {
            resultsCount.textContent = `Mostrando ${filteredResults.length} de ${allResults.length} resultados`;
        }

        if (sorted.length === 0 && allResults.length > 0) {
            emptyState.style.display = 'block';
            tableWrapper.style.display = 'none';
            resultsCards.innerHTML = '';
        } else if (sorted.length === 0) {
            emptyState.style.display = 'none';
            tableWrapper.style.display = 'none';
            resultsCards.innerHTML = '';
        } else {
            emptyState.style.display = 'none';
            tableWrapper.style.display = '';
            renderTable(sorted);
            renderCards(sorted);
        }
    }

    function renderTable(results) {
        resultsBody.innerHTML = results.map(r => `
            <tr>
                <td><span class="position-badge position-${r.posicion <= 3 ? r.posicion : ''}">${r.posicion}</span></td>
                <td><span class="dorsal-badge">${r.dorsal}</span></td>
                <td><strong>${r.nombre}</strong></td>
                <td><span class="category-tag">${r.categoria}</span></td>
                <td>${r.evento}</td>
                <td class="time-display">${r.tiempo || '--:--:--'}</td>
                <td class="diff-display">${r.diferencia || '-'}</td>
            </tr>
        `).join('');
    }

    function renderCards(results) {
        resultsCards.innerHTML = results.map(r => `
            <div class="result-card">
                <div class="card-position">${r.posicion}</div>
                <div class="card-info">
                    <h4><span class="dorsal-badge">${r.dorsal}</span> ${r.nombre}</h4>
                    <div class="card-meta">${r.categoria} | ${r.evento}</div>
                </div>
                <div class="card-time">
                    <div class="time">${r.tiempo || '--:--:--'}</div>
                    <div class="diff">${r.diferencia || ''}</div>
                </div>
            </div>
        `).join('');
    }

    // ===== SORTING =====
    function sortResults(results) {
        return results.sort((a, b) => {
            let valA = a[currentSort.field];
            let valB = b[currentSort.field];

            if (currentSort.field === 'posicion' || currentSort.field === 'dorsal') {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
            } else if (currentSort.field === 'tiempo') {
                valA = timeToSeconds(valA);
                valB = timeToSeconds(valB);
            } else {
                valA = (valA || '').toString().toLowerCase();
                valB = (valB || '').toString().toLowerCase();
            }

            if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    function timeToSeconds(time) {
        if (!time || time === '--:--:--') return Infinity;
        const parts = time.split(':');
        if (parts.length === 3) {
            return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
        }
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
        }
        return Infinity;
    }

    function updateSortIndicators() {
        document.querySelectorAll('.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.sort === currentSort.field) {
                th.classList.add('sort-' + currentSort.direction);
            }
        });
    }

    function showLoading(show) {
        loadingState.style.display = show ? 'block' : 'none';
        if (show) {
            tableWrapper.style.display = 'none';
            resultsCards.innerHTML = '';
            emptyState.style.display = 'none';
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

})();
