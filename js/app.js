// ===== CYCLING RESULTS APP =====
// Soporta multiples archivos CSV (uno por evento)
// Lee el formato de empresa de chips (categorias como secciones, separado por tabs)

(function() {
    'use strict';

    // State
    let allResults = [];
    let filteredResults = [];
    let currentSort = { field: 'posicion', direction: 'asc' };
    let categories = [];
    let equipos = [];
    let eventos = [];

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

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') applyFilters();
        });

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

    // ===== LOAD DATA =====
    function loadData() {
        showLoading(true);
        const cacheBuster = '?t=' + Date.now();

        // Load event info
        fetch('data/evento.csv' + cacheBuster)
            .then(response => {
                if (!response.ok) throw new Error('No event config');
                return response.text();
            })
            .then(text => parseEventConfig(text))
            .catch(() => {
                eventTitle.textContent = 'Resultados de Ciclismo';
                eventDetails.textContent = '';
            });

        // Try to load eventos.csv (multi-event config)
        fetch('data/eventos.csv' + cacheBuster)
            .then(response => {
                if (!response.ok) throw new Error('No multi-event config');
                return response.text();
            })
            .then(text => {
                const eventFiles = parseEventsList(text);
                if (eventFiles.length > 0) {
                    return loadMultipleEvents(eventFiles);
                } else {
                    throw new Error('Empty events list');
                }
            })
            .then(() => {
                finishLoading();
            })
            .catch(() => {
                // Fallback: try single file (resultados.csv)
                fetch('data/resultados.csv' + cacheBuster)
                    .then(response => {
                        if (!response.ok) throw new Error('No file');
                        return response.text();
                    })
                    .then(text => {
                        allResults = parseChipTimingFile(text, '');
                        finishLoading();
                    })
                    .catch(error => {
                        console.log('Info:', error.message);
                        showLoading(false);
                        allResults = [];
                        filteredResults = [];
                        eventTitle.textContent = 'Resultados de Ciclismo';
                        eventDetails.textContent = 'Sube tus archivos CSV a la carpeta data/';
                        renderResults();
                    });
            });
    }

    // Parse eventos.csv (list of event files)
    function parseEventsList(text) {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        const eventFiles = [];

        if (lines.length < 2) return [];

        // First line is header
        const separator = lines[0].includes('\t') ? '\t' : ',';

        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(separator).map(p => p.trim());
            if (parts.length >= 2 && parts[0]) {
                eventFiles.push({
                    archivo: parts[0],
                    evento: parts[1] || parts[0].replace(/\.csv$/i, '').replace(/resultados_?/i, '')
                });
            }
        }

        return eventFiles;
    }

    // Load multiple event files
    function loadMultipleEvents(eventFiles) {
        const cacheBuster = '?t=' + Date.now();
        const promises = eventFiles.map(ef => {
            return fetch('data/' + ef.archivo + cacheBuster)
                .then(response => {
                    if (!response.ok) throw new Error('No file: ' + ef.archivo);
                    return response.text();
                })
                .then(text => {
                    return parseChipTimingFile(text, ef.evento);
                })
                .catch(() => {
                    console.log('No se pudo cargar: ' + ef.archivo);
                    return [];
                });
        });

        return Promise.all(promises).then(resultsArrays => {
            allResults = [];
            resultsArrays.forEach(results => {
                allResults = allResults.concat(results);
            });
        });
    }

    function finishLoading() {
        categories = [...new Set(allResults.map(r => r.categoria).filter(c => c))].sort();
        equipos = [...new Set(allResults.map(r => r.equipo).filter(e => e))].sort();
        eventos = [...new Set(allResults.map(r => r.evento).filter(e => e))].sort();

        populateFilters();
        applyFilters();
        showLoading(false);
    }

    // ===== PARSER PARA FORMATO DE EMPRESA DE CHIPS =====
    function parseChipTimingFile(text, eventoName) {
        const lines = text.split(/\r?\n/);
        const results = [];
        let currentCategory = '';
        let headerFound = false;
        let colMap = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed) {
                headerFound = false;
                continue;
            }

            const separator = detectSeparator(line);
            const parts = splitLine(line, separator);

            // Is this a category header?
            if (isCategoryHeader(trimmed, parts)) {
                currentCategory = trimmed;
                headerFound = false;
                continue;
            }

            // Is this a column header row?
            if (isColumnHeader(parts)) {
                colMap = mapColumns(parts);
                headerFound = true;
                continue;
            }

            // Data row
            if (headerFound && colMap && parts.length >= 3) {
                const pos = getColValue(parts, colMap.pos);
                const numero = getColValue(parts, colMap.numero);
                const nombre = getColValue(parts, colMap.nombre);
                const equipo = getColValue(parts, colMap.equipo);
                const tiempo = getColValue(parts, colMap.tiempo);

                if (pos && !isNaN(parseInt(pos)) && nombre.trim()) {
                    results.push({
                        posicion: parseInt(pos),
                        dorsal: parseInt(numero) || 0,
                        nombre: nombre.trim(),
                        categoria: currentCategory,
                        equipo: equipo ? equipo.trim() : '',
                        evento: eventoName,
                        tiempo: formatTime(tiempo),
                        diferencia: ''
                    });
                }
            }
        }

        // Calculate differences per category
        calculateDifferences(results);

        return results;
    }

    function detectSeparator(line) {
        const tabs = (line.match(/\t/g) || []).length;
        const commas = (line.match(/,/g) || []).length;
        if (tabs >= 2) return '\t';
        if (commas >= 2) return ',';
        if (/\s{2,}/.test(line)) return 'spaces';
        return '\t';
    }

    function splitLine(line, separator) {
        if (separator === 'spaces') {
            return line.trim().split(/\s{2,}/);
        }
        if (separator === ',') {
            return parseCSVLine(line);
        }
        return line.split(separator);
    }

    function isCategoryHeader(trimmed, parts) {
        if (parts.length <= 2 && trimmed.length > 0 && isNaN(parseInt(parts[0]))) {
            return true;
        }
        if (parts.length >= 3) return false;
        if (/^\d+$/.test(parts[0])) return false;
        return true;
    }

    function isColumnHeader(parts) {
        if (parts.length < 3) return false;
        const first = parts[0].trim().toLowerCase();
        const headerKeywords = ['pos', 'posicion', 'position', '#', 'lugar', 'place'];
        return headerKeywords.includes(first);
    }

    function mapColumns(parts) {
        const map = { pos: 0, numero: 1, nombre: 2, equipo: -1, tiempo: -1 };
        
        for (let i = 0; i < parts.length; i++) {
            const col = parts[i].trim().toLowerCase();
            
            if (['pos', 'posicion', 'position', '#', 'lugar'].includes(col)) {
                map.pos = i;
            } else if (['numero', 'num', 'dorsal', 'bib', 'no', 'number'].includes(col)) {
                map.numero = i;
            } else if (col.includes('nombre') || col.includes('name') || col.includes('participante') || col.includes('corredor') || col.includes('ciclista') || col.includes('rider') || col.includes('atleta')) {
                map.nombre = i;
            } else if (['equipo', 'team', 'club', 'grupo'].includes(col)) {
                map.equipo = i;
            } else if (['tiempo', 'time', 'hora', 'crono', 'finish', 'chip'].includes(col)) {
                map.tiempo = i;
            }
        }

        return map;
    }

    function getColValue(parts, index) {
        if (index === -1 || index >= parts.length) return '';
        return parts[index] || '';
    }

    function formatTime(time) {
        if (!time) return '';
        time = time.trim();
        if (/^\d{1,2}:\d{2}:\d{2}/.test(time)) return time;
        if (/^\d+\.?\d*$/.test(time)) {
            const totalSec = parseFloat(time);
            const h = Math.floor(totalSec / 3600);
            const m = Math.floor((totalSec % 3600) / 60);
            const s = (totalSec % 60).toFixed(3);
            return `${pad(h)}:${pad(m)}:${s.padStart(6, '0')}`;
        }
        return time;
    }

    function pad(n) {
        return n.toString().padStart(2, '0');
    }

    function calculateDifferences(results) {
        const byCategory = {};
        
        results.forEach(r => {
            if (!byCategory[r.categoria]) byCategory[r.categoria] = [];
            byCategory[r.categoria].push(r);
        });

        Object.values(byCategory).forEach(group => {
            group.sort((a, b) => a.posicion - b.posicion);
            
            if (group.length > 0 && group[0].tiempo) {
                const firstTime = timeToSeconds(group[0].tiempo);
                group[0].diferencia = '-';
                
                for (let i = 1; i < group.length; i++) {
                    if (group[i].tiempo) {
                        const diff = timeToSeconds(group[i].tiempo) - firstTime;
                        group[i].diferencia = '+' + secondsToTime(diff);
                    }
                }
            }
        });
    }

    function secondsToTime(totalSec) {
        if (totalSec < 60) {
            return totalSec.toFixed(1) + 's';
        }
        const m = Math.floor(totalSec / 60);
        const s = Math.floor(totalSec % 60);
        if (m < 60) {
            return `${pad(m)}:${pad(s)}`;
        }
        const h = Math.floor(m / 60);
        const mins = m % 60;
        return `${pad(h)}:${pad(mins)}:${pad(s)}`;
    }

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

    function parseEventConfig(text) {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        const config = {};

        for (const line of lines) {
            const separator = line.includes('\t') ? '\t' : ',';
            const parts = line.split(separator);
            if (parts.length >= 2) {
                const key = parts[0].trim().toLowerCase();
                const value = parts.slice(1).join(separator).trim();
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

        // If there are multiple events, show event filter
        // If only one event, show equipo filter instead
        if (eventos.length > 1) {
            eventos.forEach(evt => {
                const option = document.createElement('option');
                option.value = evt;
                option.textContent = evt;
                eventSelect.appendChild(option);
            });
        } else {
            eventSelect.innerHTML = '<option value="">Todos los equipos</option>';
            equipos.forEach(eq => {
                const option = document.createElement('option');
                option.value = eq;
                option.textContent = eq;
                eventSelect.appendChild(option);
            });
        }
    }

    function applyFilters() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedCategory = categorySelect.value;
        const selectedEvent = eventSelect.value;
        const filterByEvent = eventos.length > 1;

        filteredResults = allResults.filter(result => {
            const matchesSearch = !searchTerm ||
                result.dorsal.toString().includes(searchTerm) ||
                result.nombre.toLowerCase().includes(searchTerm);

            const matchesCategory = !selectedCategory || result.categoria === selectedCategory;

            let matchesEvent = true;
            if (selectedEvent) {
                if (filterByEvent) {
                    matchesEvent = result.evento === selectedEvent;
                } else {
                    matchesEvent = result.equipo === selectedEvent;
                }
            }

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
        const showEvento = eventos.length > 1;
        resultsBody.innerHTML = results.map(r => `
            <tr>
                <td><span class="position-badge position-${r.posicion <= 3 ? r.posicion : ''}">${r.posicion}</span></td>
                <td><span class="dorsal-badge">${r.dorsal}</span></td>
                <td><strong>${r.nombre}</strong></td>
                <td><span class="category-tag">${r.categoria}</span></td>
                <td>${showEvento ? r.evento : r.equipo}</td>
                <td class="time-display">${r.tiempo || '--:--:--'}</td>
                <td class="diff-display">${r.diferencia || '-'}</td>
            </tr>
        `).join('');
    }

    function renderCards(results) {
        const showEvento = eventos.length > 1;
        resultsCards.innerHTML = results.map(r => `
            <div class="result-card">
                <div class="card-position">${r.posicion}</div>
                <div class="card-info">
                    <h4><span class="dorsal-badge">${r.dorsal}</span> ${r.nombre}</h4>
                    <div class="card-meta">${r.categoria}${showEvento ? ' | ' + r.evento : (r.equipo ? ' | ' + r.equipo : '')}</div>
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
