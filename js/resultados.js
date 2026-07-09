// ===== RESULTS PAGE - Single Event =====

(function() {
    'use strict';

    // Get event file from URL parameter
    const params = new URLSearchParams(window.location.search);
    const eventoArchivo = params.get('evento') || '';
    const eventoNombre = params.get('nombre') || 'Resultados';

    // State
    let allResults = [];
    let filteredResults = [];
    let currentSort = { field: 'default', direction: 'asc' };
    let categories = [];
    let equipos = [];

    // DOM Elements
    const searchInput = document.getElementById('search-text');
    const categorySelect = document.getElementById('filter-category');
    const equipoSelect = document.getElementById('filter-equipo');
    const btnSearch = document.getElementById('btn-search');
    const btnClear = document.getElementById('btn-clear');
    const btnRefresh = document.getElementById('btn-refresh');
    const resultsBody = document.getElementById('results-body');
    const resultsCards = document.getElementById('results-cards');
    const resultsCount = document.getElementById('results-count');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');
    const tableWrapper = document.querySelector('.table-wrapper');
    const eventTitleEl = document.getElementById('event-title');
    const eventSubtitle = document.getElementById('event-subtitle');

    // Set page title
    document.title = eventoNombre + ' - Resultados';
    eventTitleEl.textContent = eventoNombre;

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
        equipoSelect.addEventListener('change', applyFilters);

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

    function loadData() {
        showLoading(true);
        const cacheBuster = '?t=' + Date.now();

        if (!eventoArchivo) {
            showLoading(false);
            eventTitleEl.textContent = 'Error';
            eventSubtitle.textContent = 'No se especifico un evento';
            return;
        }

        fetch('data/' + eventoArchivo + cacheBuster)
            .then(response => {
                if (!response.ok) throw new Error('No file');
                return response.text();
            })
            .then(text => {
                allResults = parseChipTimingFile(text);
                // Preserve category order as they appear in the file
                const seenCats = [];
                allResults.forEach(r => {
                    if (r.categoria && !seenCats.includes(r.categoria)) seenCats.push(r.categoria);
                });
                categories = seenCats;
                equipos = [...new Set(allResults.map(r => r.equipo).filter(e => e))].sort();
                populateFilters();
                applyFilters();
                showLoading(false);
                eventSubtitle.textContent = allResults.length + ' participantes';
            })
            .catch(error => {
                console.log('Info:', error.message);
                showLoading(false);
                allResults = [];
                filteredResults = [];
                eventSubtitle.textContent = 'No se encontraron resultados';
                renderResults();
            });
    }


    // ===== CHIP TIMING FILE PARSER =====
    function parseChipTimingFile(text) {
        const lines = text.split(/\r?\n/);
        const results = [];
        let currentCategory = '';
        let headerFound = false;
        let colMap = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed || /^[;,\t\s]+$/.test(trimmed)) {
                headerFound = false;
                continue;
            }

            const separator = detectSeparator(line);
            const parts = splitLine(line, separator);

            if (isCategoryHeader(trimmed, parts)) {
                currentCategory = parts.filter(p => p.trim().length > 0)[0] || trimmed;
                headerFound = false;
                continue;
            }

            if (isColumnHeader(parts)) {
                colMap = mapColumns(parts);
                headerFound = true;
                continue;
            }

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
                        tiempo: formatTime(tiempo),
                        diferencia: ''
                    });
                } else if (pos && ['DSQ','DNF','DNS','OTL'].includes(pos.trim().toUpperCase()) && nombre.trim()) {
                    results.push({
                        posicion: 999,
                        dorsal: parseInt(numero) || 0,
                        nombre: nombre.trim(),
                        categoria: currentCategory,
                        equipo: equipo ? equipo.trim() : '',
                        tiempo: pos.trim().toUpperCase(),
                        diferencia: ''
                    });
                }
            }
        }
        calculateDifferences(results);
        return results;
    }


    function detectSeparator(line) {
        const tabs = (line.match(/\t/g) || []).length;
        const semicolons = (line.match(/;/g) || []).length;
        const commas = (line.match(/,/g) || []).length;
        if (semicolons >= 2) return ';';
        if (tabs >= 2) return '\t';
        if (commas >= 2) return ',';
        if (/\s{2,}/.test(line)) return 'spaces';
        return '\t';
    }

    function splitLine(line, separator) {
        if (separator === 'spaces') return line.trim().split(/\s{2,}/);
        if (separator === ',') return parseCSVLine(line);
        return line.split(separator);
    }

    function isCategoryHeader(trimmed, parts) {
        const nonEmpty = parts.filter(p => p.trim().length > 0);
        if (nonEmpty.length === 1 && isNaN(parseInt(nonEmpty[0])) && nonEmpty[0].length > 1) return true;
        if (parts.length <= 2 && trimmed.length > 0 && isNaN(parseInt(parts[0]))) return true;
        if (parts.length >= 3 && nonEmpty.length >= 3) return false;
        if (/^\d+$/.test(parts[0].trim())) return false;
        return true;
    }

    function isColumnHeader(parts) {
        if (parts.length < 3) return false;
        const first = parts[0].trim().toLowerCase();
        return ['pos', 'posicion', 'position', '#', 'lugar', 'place'].includes(first);
    }

    function mapColumns(parts) {
        const map = { pos: 0, numero: 1, nombre: 2, equipo: -1, tiempo: -1 };
        for (let i = 0; i < parts.length; i++) {
            const col = parts[i].trim().toLowerCase();
            if (['pos','posicion','position','#','lugar'].includes(col)) map.pos = i;
            else if (['numero','num','dorsal','bib','no','number'].includes(col)) map.numero = i;
            else if (col.includes('nombre') || col.includes('name') || col.includes('participante')) map.nombre = i;
            else if (['equipo','team','club','grupo'].includes(col)) map.equipo = i;
            else if (['tiempo','time','hora','crono','finish','chip'].includes(col)) map.tiempo = i;
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
        return time;
    }

    function pad(n) { return n.toString().padStart(2, '0'); }


    function calculateDifferences(results) {
        const byCategory = {};
        results.forEach(r => {
            if (!byCategory[r.categoria]) byCategory[r.categoria] = [];
            byCategory[r.categoria].push(r);
        });
        Object.values(byCategory).forEach(group => {
            group.sort((a, b) => a.posicion - b.posicion);
            if (group.length > 0 && group[0].tiempo && group[0].posicion !== 999) {
                const firstTime = timeToSeconds(group[0].tiempo);
                group[0].diferencia = '-';
                for (let i = 1; i < group.length; i++) {
                    if (group[i].posicion === 999) {
                        group[i].diferencia = group[i].tiempo;
                    } else if (group[i].tiempo) {
                        const diff = timeToSeconds(group[i].tiempo) - firstTime;
                        group[i].diferencia = '+' + secondsToTime(diff);
                    }
                }
            }
        });
    }

    function secondsToTime(totalSec) {
        if (totalSec < 60) return totalSec.toFixed(1) + 's';
        const m = Math.floor(totalSec / 60);
        const s = Math.floor(totalSec % 60);
        if (m < 60) return `${pad(m)}:${pad(s)}`;
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
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
            else current += char;
        }
        result.push(current);
        return result;
    }

    // ===== FILTERS =====
    function populateFilters() {
        categorySelect.innerHTML = '<option value="">Todas las categorias</option>';
        equipoSelect.innerHTML = '<option value="">Todos los equipos</option>';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat; opt.textContent = cat;
            categorySelect.appendChild(opt);
        });
        equipos.forEach(eq => {
            const opt = document.createElement('option');
            opt.value = eq; opt.textContent = eq;
            equipoSelect.appendChild(opt);
        });
    }

    function applyFilters() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedCat = categorySelect.value;
        const selectedEquipo = equipoSelect.value;
        filteredResults = allResults.filter(r => {
            const matchSearch = !searchTerm ||
                r.dorsal.toString().includes(searchTerm) ||
                r.nombre.toLowerCase().includes(searchTerm);
            const matchCat = !selectedCat || r.categoria === selectedCat;
            const matchEquipo = !selectedEquipo || r.equipo === selectedEquipo;
            return matchSearch && matchCat && matchEquipo;
        });
        renderResults();
    }

    function clearFilters() {
        searchInput.value = '';
        categorySelect.value = '';
        equipoSelect.value = '';
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
                <td><span class="position-badge position-${r.posicion <= 3 ? r.posicion : ''}">${r.posicion === 999 ? '-' : r.posicion}</span></td>
                <td><span class="dorsal-badge">${r.dorsal}</span></td>
                <td><strong>${r.nombre}</strong></td>
                <td><span class="category-tag">${r.categoria}</span></td>
                <td>${r.equipo}</td>
                <td class="time-display">${r.posicion === 999 ? r.tiempo : (r.tiempo || '--:--:--')}</td>
                <td class="diff-display">${r.posicion === 999 ? r.tiempo : (r.diferencia || '-')}</td>
            </tr>
        `).join('');
    }

    function renderCards(results) {
        resultsCards.innerHTML = results.map(r => `
            <div class="result-card">
                <div class="card-position">${r.posicion === 999 ? '-' : r.posicion}</div>
                <div class="card-info">
                    <h4><span class="dorsal-badge">${r.dorsal}</span> ${r.nombre}</h4>
                    <div class="card-meta">${r.categoria}${r.equipo ? ' | ' + r.equipo : ''}</div>
                </div>
                <div class="card-time">
                    <div class="time">${r.posicion === 999 ? r.tiempo : (r.tiempo || '--:--:--')}</div>
                    <div class="diff">${r.posicion === 999 ? '' : (r.diferencia || '')}</div>
                </div>
            </div>
        `).join('');
    }

    // ===== SORTING =====
    function sortResults(results) {
        // Default sort: by category order (as they appear in file) then by position
        if (currentSort.field === 'default') {
            return results.sort((a, b) => {
                const catIdxA = categories.indexOf(a.categoria);
                const catIdxB = categories.indexOf(b.categoria);
                if (catIdxA !== catIdxB) return catIdxA - catIdxB;
                return (a.posicion || 999) - (b.posicion || 999);
            });
        }

        return results.sort((a, b) => {
            let valA = a[currentSort.field];
            let valB = b[currentSort.field];
            if (currentSort.field === 'posicion' || currentSort.field === 'dorsal') {
                valA = Number(valA) || 0; valB = Number(valB) || 0;
            } else if (currentSort.field === 'tiempo') {
                valA = timeToSeconds(valA); valB = timeToSeconds(valB);
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
        if (['DSQ','DNF','DNS','OTL'].includes(time)) return Infinity;
        const parts = time.split(':');
        if (parts.length === 3) return parseInt(parts[0])*3600 + parseInt(parts[1])*60 + parseFloat(parts[2]);
        if (parts.length === 2) return parseInt(parts[0])*60 + parseFloat(parts[1]);
        return Infinity;
    }

    function updateSortIndicators() {
        document.querySelectorAll('.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.sort === currentSort.field) th.classList.add('sort-' + currentSort.direction);
        });
    }

    function showLoading(show) {
        loadingState.style.display = show ? 'block' : 'none';
        if (show) { tableWrapper.style.display = 'none'; resultsCards.innerHTML = ''; emptyState.style.display = 'none'; }
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); };
    }

})();
