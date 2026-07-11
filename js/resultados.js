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
    let currentSort = { field: 'tiempo', direction: 'asc' };
    let currentView = 'general'; // 'general' or 'categoria'
    let categories = [];
    let equipos = [];

    // DOM Elements
    const searchInput = document.getElementById('search-text');
    const genderSelect = document.getElementById('filter-gender');
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

    // Multi-select state
    let selectedCategories = [];
    let selectedEquipos = [];

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
        genderSelect.addEventListener('change', applyFilters);

        // Multi-select dropdowns
        setupMultiSelect('ms-category', function(selected) {
            selectedCategories = selected;
            applyFilters();
        });
        setupMultiSelect('ms-equipo', function(selected) {
            selectedEquipos = selected;
            applyFilters();
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.multi-select')) {
                document.querySelectorAll('.multi-select-dropdown').forEach(d => d.classList.remove('show'));
                document.querySelectorAll('.multi-select-header').forEach(h => h.classList.remove('active'));
            }
        });

        // View toggle buttons
        document.getElementById('btn-general').addEventListener('click', function() {
            currentView = 'general';
            this.classList.add('active');
            document.getElementById('btn-categoria').classList.remove('active');
            renderResults();
        });
        document.getElementById('btn-categoria').addEventListener('click', function() {
            currentView = 'categoria';
            this.classList.add('active');
            document.getElementById('btn-general').classList.remove('active');
            renderResults();
        });

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

    function setupMultiSelect(id, onChange) {
        const container = document.getElementById(id);
        const header = container.querySelector('.multi-select-header');
        const dropdown = container.querySelector('.multi-select-dropdown');

        header.addEventListener('click', function(e) {
            e.stopPropagation();
            // Close other dropdowns
            document.querySelectorAll('.multi-select-dropdown').forEach(d => {
                if (d !== dropdown) d.classList.remove('show');
            });
            document.querySelectorAll('.multi-select-header').forEach(h => {
                if (h !== header) h.classList.remove('active');
            });
            dropdown.classList.toggle('show');
            header.classList.toggle('active');
        });

        dropdown.addEventListener('change', function() {
            const checked = Array.from(dropdown.querySelectorAll('input:checked')).map(cb => cb.value);
            onChange(checked);
            updateMultiSelectHeader(id, checked);
        });
    }

    function updateMultiSelectHeader(id, selected) {
        const header = document.querySelector('#' + id + ' .multi-select-header');
        const isCategory = id === 'ms-category';
        const defaultText = isCategory ? 'Todas las categorias' : 'Todos los equipos';

        if (selected.length === 0) {
            header.textContent = defaultText;
            header.classList.remove('has-selection');
        } else if (selected.length === 1) {
            header.textContent = selected[0];
            header.classList.add('has-selection');
        } else {
            header.textContent = selected.length + (isCategory ? ' categorias' : ' equipos');
            header.classList.add('has-selection');
        }
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
                        genero: detectGender(currentCategory),
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
                        genero: detectGender(currentCategory),
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

    // Detect gender from category name
    function detectGender(categoria) {
        const cat = categoria.toLowerCase();
        if (cat.includes('femen') || cat.includes('mujer') || cat.includes('dama') || cat.includes('female') || cat.includes('women')) {
            return 'F';
        }
        if (cat.includes('mixto') || cat.includes('mixta') || cat.includes('mixed')) {
            return 'X';
        }
        return 'M';
    }


    function calculateDifferences(results) {
        // 1. General Classification: difference against overall fastest
        let fastestTime = Infinity;
        results.forEach(r => {
            if (r.posicion !== 999 && r.tiempo) {
                const t = timeToSeconds(r.tiempo);
                if (t < fastestTime) fastestTime = t;
            }
        });
        results.forEach(r => {
            if (r.posicion === 999) {
                r.difGeneral = r.tiempo;
            } else if (r.tiempo) {
                const t = timeToSeconds(r.tiempo);
                r.difGeneral = (t === fastestTime) ? '-' : '+' + secondsToTime(t - fastestTime);
            } else {
                r.difGeneral = '-';
            }
        });

        // 2. Category Classification: difference against first in each category
        const byCategory = {};
        results.forEach(r => {
            if (!byCategory[r.categoria]) byCategory[r.categoria] = [];
            byCategory[r.categoria].push(r);
        });
        Object.values(byCategory).forEach(group => {
            group.sort((a, b) => timeToSeconds(a.tiempo) - timeToSeconds(b.tiempo));
            const firstTime = group.length > 0 && group[0].posicion !== 999 ? timeToSeconds(group[0].tiempo) : Infinity;
            group.forEach((r, i) => {
                if (r.posicion === 999) {
                    r.difCategoria = r.tiempo;
                } else if (r.tiempo && firstTime !== Infinity) {
                    const t = timeToSeconds(r.tiempo);
                    r.difCategoria = (t === firstTime) ? '-' : '+' + secondsToTime(t - firstTime);
                } else {
                    r.difCategoria = '-';
                }
                r.posCategoria = r.posicion === 999 ? 999 : (i + 1);
            });
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
        // Populate category multi-select
        const catDropdown = document.getElementById('ms-category-dropdown');
        catDropdown.innerHTML = categories.map(cat => `
            <div class="multi-select-item">
                <input type="checkbox" id="cat-${cat}" value="${cat}">
                <label for="cat-${cat}">${cat}</label>
            </div>
        `).join('');

        // Populate equipo multi-select
        const eqDropdown = document.getElementById('ms-equipo-dropdown');
        eqDropdown.innerHTML = equipos.map(eq => `
            <div class="multi-select-item">
                <input type="checkbox" id="eq-${eq}" value="${eq}">
                <label for="eq-${eq}">${eq}</label>
            </div>
        `).join('');
    }

    function applyFilters() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedGender = genderSelect.value;
        const isNumericSearch = /^\d+$/.test(searchTerm);

        filteredResults = allResults.filter(r => {
            let matchSearch = true;
            if (searchTerm) {
                if (isNumericSearch) {
                    matchSearch = r.dorsal.toString() === searchTerm;
                } else {
                    matchSearch = r.nombre.toLowerCase().includes(searchTerm);
                }
            }
            const matchCat = selectedCategories.length === 0 || selectedCategories.includes(r.categoria);
            const matchEquipo = selectedEquipos.length === 0 || selectedEquipos.includes(r.equipo);
            const matchGender = !selectedGender || r.genero === selectedGender;
            return matchSearch && matchCat && matchEquipo && matchGender;
        });
        renderResults();
    }

    function clearFilters() {
        searchInput.value = '';
        genderSelect.value = '';
        selectedCategories = [];
        selectedEquipos = [];
        // Uncheck all checkboxes
        document.querySelectorAll('.multi-select-dropdown input').forEach(cb => cb.checked = false);
        updateMultiSelectHeader('ms-category', []);
        updateMultiSelectHeader('ms-equipo', []);
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
        resultsBody.innerHTML = results.map((r, idx) => {
            const isGeneral = (currentView === 'general');
            const pos = r.posicion === 999 ? '-' : (isGeneral ? (idx + 1) : r.posCategoria);
            const dif = r.posicion === 999 ? r.tiempo : (isGeneral ? r.difGeneral : r.difCategoria);
            return `
            <tr>
                <td><span class="position-badge position-${pos <= 3 && r.posicion !== 999 ? pos : ''}">${pos}</span></td>
                <td><span class="dorsal-badge">${r.dorsal}</span></td>
                <td><strong>${r.nombre}</strong></td>
                <td><span class="category-tag">${r.categoria}</span></td>
                <td>${r.equipo}</td>
                <td class="time-display">${r.posicion === 999 ? r.tiempo : (r.tiempo || '--:--:--')}</td>
                <td class="diff-display">${dif || '-'}</td>
            </tr>
        `}).join('');
    }

    function renderCards(results) {
        resultsCards.innerHTML = results.map((r, idx) => {
            const isGeneral = (currentView === 'general');
            const pos = r.posicion === 999 ? '-' : (isGeneral ? (idx + 1) : r.posCategoria);
            const dif = r.posicion === 999 ? '' : (isGeneral ? r.difGeneral : r.difCategoria);
            return `
            <div class="result-card">
                <div class="card-position">${pos}</div>
                <div class="card-info">
                    <h4><span class="dorsal-badge">${r.dorsal}</span> ${r.nombre}</h4>
                    <div class="card-meta">${r.categoria}${r.equipo ? ' | ' + r.equipo : ''}</div>
                </div>
                <div class="card-time">
                    <div class="time">${r.posicion === 999 ? r.tiempo : (r.tiempo || '--:--:--')}</div>
                    <div class="diff">${dif || ''}</div>
                </div>
            </div>
        `}).join('');
    }

    // ===== SORTING =====
    function sortResults(results) {
        if (currentView === 'categoria') {
            // Sort by category order, then by time within category
            return results.sort((a, b) => {
                const catIdxA = categories.indexOf(a.categoria);
                const catIdxB = categories.indexOf(b.categoria);
                if (catIdxA !== catIdxB) return catIdxA - catIdxB;
                return timeToSeconds(a.tiempo) - timeToSeconds(b.tiempo);
            });
        }

        // General classification: sort by time (or custom sort)
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
