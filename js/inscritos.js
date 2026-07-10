// ===== INSCRITOS PAGE =====

(function() {
    'use strict';

    const SITE_URL = 'https://nancyms1012.github.io/Resultados-ciclismo/inscritos.html';

    // State
    let allInscritos = [];
    let filteredInscritos = [];
    let currentSort = { field: 'dorsal', direction: 'asc' };
    let categories = [];
    let equipos = [];
    let eventos = [];

    // DOM Elements
    const searchInput = document.getElementById('search-text');
    const categorySelect = document.getElementById('filter-category');
    const equipoSelect = document.getElementById('filter-equipo');
    const eventoSelect = document.getElementById('filter-evento');
    const btnSearch = document.getElementById('btn-search');
    const btnClear = document.getElementById('btn-clear');
    const btnRefresh = document.getElementById('btn-refresh');
    const resultsBody = document.getElementById('results-body');
    const resultsCards = document.getElementById('results-cards');
    const resultsCount = document.getElementById('results-count');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');
    const tableWrapper = document.querySelector('.table-wrapper');
    const eventSubtitle = document.getElementById('event-subtitle');
    const qrContainer = document.getElementById('qr-code');

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        loadData();
        setupEventListeners();
        generateQR();
    }

    function generateQR() {
        if (typeof qrcode === 'undefined' || !qrContainer) return;
        var qr = qrcode(0, 'M');
        qr.addData(SITE_URL);
        qr.make();
        qrContainer.innerHTML = qr.createSvgTag(5, 0);
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
        eventoSelect.addEventListener('change', applyFilters);

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

        fetch('data/inscritos.csv' + cacheBuster)
            .then(response => {
                if (!response.ok) throw new Error('No file');
                return response.text();
            })
            .then(text => {
                allInscritos = parseCSV(text);
                categories = [...new Set(allInscritos.map(r => r.categoria).filter(c => c))].sort();
                equipos = [...new Set(allInscritos.map(r => r.equipo).filter(e => e))].sort();
                eventos = [...new Set(allInscritos.map(r => r.evento).filter(e => e))].sort();
                populateFilters();
                applyFilters();
                showLoading(false);
                eventSubtitle.textContent = allInscritos.length + ' inscritos';
            })
            .catch(error => {
                console.log('Info:', error.message);
                showLoading(false);
                allInscritos = [];
                filteredInscritos = [];
                eventSubtitle.textContent = 'Sube inscritos.csv a la carpeta data/';
                renderResults();
            });
    }

    // ===== CSV PARSER =====
    function parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) return [];

        // Detect separator
        const separator = detectSeparator(lines[0]);

        // Parse header
        const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());

        // Map columns flexibly
        const colMap = {
            dorsal: findCol(headers, ['dorsal', 'numero', 'num', 'bib', 'no', 'number', '#']),
            nombre: findCol(headers, ['nombre', 'name', 'corredor', 'ciclista', 'rider', 'atleta', 'participante', 'nombre participante']),
            categoria: findCol(headers, ['categoria', 'cat', 'category', 'grupo', 'group']),
            equipo: findCol(headers, ['equipo', 'team', 'club', 'grupo']),
            evento: findCol(headers, ['evento', 'event', 'distancia', 'distance', 'modalidad', 'ruta'])
        };

        // Parse rows
        const results = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(separator).map(v => v.trim());
            if (values.length < 2) continue;

            const nombre = getVal(values, colMap.nombre);
            if (!nombre) continue;

            results.push({
                dorsal: parseInt(getVal(values, colMap.dorsal)) || 0,
                nombre: nombre,
                categoria: getVal(values, colMap.categoria),
                equipo: getVal(values, colMap.equipo),
                evento: getVal(values, colMap.evento)
            });
        }
        return results;
    }

    function detectSeparator(line) {
        const semicolons = (line.match(/;/g) || []).length;
        const tabs = (line.match(/\t/g) || []).length;
        const commas = (line.match(/,/g) || []).length;
        if (semicolons >= 2) return ';';
        if (tabs >= 2) return '\t';
        if (commas >= 2) return ',';
        return ',';
    }

    function findCol(headers, possibleNames) {
        for (const name of possibleNames) {
            const idx = headers.indexOf(name);
            if (idx !== -1) return idx;
        }
        // Try partial match
        for (const name of possibleNames) {
            for (let i = 0; i < headers.length; i++) {
                if (headers[i].includes(name)) return i;
            }
        }
        return -1;
    }

    function getVal(values, index) {
        if (index === -1 || index >= values.length) return '';
        return (values[index] || '').trim();
    }

    // ===== FILTERS =====
    function populateFilters() {
        categorySelect.innerHTML = '<option value="">Todas las categorias</option>';
        equipoSelect.innerHTML = '<option value="">Todos los equipos</option>';
        eventoSelect.innerHTML = '<option value="">Todos los eventos</option>';

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
        eventos.forEach(ev => {
            const opt = document.createElement('option');
            opt.value = ev; opt.textContent = ev;
            eventoSelect.appendChild(opt);
        });
    }

    function applyFilters() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedCat = categorySelect.value;
        const selectedEquipo = equipoSelect.value;
        const selectedEvento = eventoSelect.value;
        const isNumericSearch = /^\d+$/.test(searchTerm);

        filteredInscritos = allInscritos.filter(r => {
            let matchSearch = true;
            if (searchTerm) {
                if (isNumericSearch) {
                    matchSearch = r.dorsal.toString() === searchTerm;
                } else {
                    matchSearch = r.nombre.toLowerCase().includes(searchTerm);
                }
            }
            const matchCat = !selectedCat || r.categoria === selectedCat;
            const matchEquipo = !selectedEquipo || r.equipo === selectedEquipo;
            const matchEvento = !selectedEvento || r.evento === selectedEvento;
            return matchSearch && matchCat && matchEquipo && matchEvento;
        });
        renderResults();
    }

    function clearFilters() {
        searchInput.value = '';
        categorySelect.value = '';
        equipoSelect.value = '';
        eventoSelect.value = '';
        filteredInscritos = [...allInscritos];
        renderResults();
    }

    // ===== RENDER =====
    function renderResults() {
        const sorted = sortResults([...filteredInscritos]);

        if (filteredInscritos.length === allInscritos.length) {
            resultsCount.textContent = `Mostrando todos los inscritos (${allInscritos.length})`;
        } else {
            resultsCount.textContent = `Mostrando ${filteredInscritos.length} de ${allInscritos.length} inscritos`;
        }

        if (sorted.length === 0 && allInscritos.length > 0) {
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
                <td><span class="dorsal-badge">${r.dorsal || '-'}</span></td>
                <td><strong>${r.nombre}</strong></td>
                <td><span class="category-tag">${r.categoria}</span></td>
                <td>${r.equipo}</td>
                <td>${r.evento}</td>
            </tr>
        `).join('');
    }

    function renderCards(results) {
        resultsCards.innerHTML = results.map(r => `
            <div class="result-card">
                <div class="card-position"><span class="dorsal-badge">${r.dorsal || '-'}</span></div>
                <div class="card-info">
                    <h4>${r.nombre}</h4>
                    <div class="card-meta">${r.categoria}${r.equipo ? ' | ' + r.equipo : ''}${r.evento ? ' | ' + r.evento : ''}</div>
                </div>
            </div>
        `).join('');
    }

    // ===== SORTING =====
    function sortResults(results) {
        return results.sort((a, b) => {
            let valA = a[currentSort.field];
            let valB = b[currentSort.field];
            if (currentSort.field === 'dorsal') {
                valA = Number(valA) || 0; valB = Number(valB) || 0;
            } else {
                valA = (valA || '').toString().toLowerCase();
                valB = (valB || '').toString().toLowerCase();
            }
            if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
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
