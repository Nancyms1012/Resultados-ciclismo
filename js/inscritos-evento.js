// ===== INSCRITOS PER EVENT PAGE =====

(function() {
    'use strict';

    const params = new URLSearchParams(window.location.search);
    const eventoNombre = params.get('evento') || '';

    // State
    let allInscritos = [];
    let filteredInscritos = [];
    let currentSort = { field: 'dorsal', direction: 'asc' };
    let categories = [];
    let equipos = [];
    let selectedCategories = [];
    let selectedEquipos = [];

    // DOM Elements
    const searchInput = document.getElementById('search-text');
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

    // Set title
    document.title = eventoNombre + ' - Inscritos';
    eventTitleEl.textContent = eventoNombre || 'Inscritos';

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

        const possibleFiles = [
            'data/inscritos.csv',
            'data/INSCRITOS.csv',
            'data/INSCRITOS_TURRI.csv'
        ];

        tryLoadFiles(possibleFiles, cacheBuster);
    }

    function tryLoadFiles(files, cacheBuster) {
        if (files.length === 0) {
            showLoading(false);
            allInscritos = [];
            filteredInscritos = [];
            eventSubtitle.textContent = 'No se encontro archivo de inscritos';
            renderResults();
            return;
        }

        fetch(files[0] + cacheBuster)
            .then(response => {
                if (!response.ok) throw new Error('Not found');
                return response.text();
            })
            .then(text => {
                const allData = parseCSV(text);
                // Filter by event name (flexible matching: trim, case-insensitive, includes)
                if (eventoNombre) {
                    const searchEvento = eventoNombre.trim().toLowerCase();
                    allInscritos = allData.filter(r => {
                        const ev = r.evento.trim().toLowerCase();
                        return ev === searchEvento || ev.includes(searchEvento) || searchEvento.includes(ev);
                    });
                } else {
                    allInscritos = allData;
                }

                categories = [...new Set(allInscritos.map(r => r.categoria).filter(c => c))].sort();
                equipos = [...new Set(allInscritos.map(r => r.equipo).filter(e => e))].sort();
                populateFilters();
                applyFilters();
                showLoading(false);
                eventSubtitle.textContent = allInscritos.length + ' inscritos';
            })
            .catch(() => {
                tryLoadFiles(files.slice(1), cacheBuster);
            });
    }

    function parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) return [];

        const separator = detectSeparator(lines[0]);
        const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());

        const colMap = {
            dorsal: findCol(headers, ['dorsal', 'numero', 'num', 'bib', 'no', 'number', '#']),
            nombre: findCol(headers, ['nombre', 'name', 'corredor', 'ciclista', 'participante']),
            categoria: findCol(headers, ['categoria', 'cat', 'category', 'grupo']),
            equipo: findCol(headers, ['equipo', 'team', 'club']),
            evento: findCol(headers, ['evento', 'event', 'distancia', 'modalidad'])
        };

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
        return ',';
    }

    function findCol(headers, possibleNames) {
        for (const name of possibleNames) {
            const idx = headers.indexOf(name);
            if (idx !== -1) return idx;
        }
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

    function populateFilters() {
        const catDropdown = document.getElementById('ms-category-dropdown');
        catDropdown.innerHTML = categories.map(cat => `
            <div class="multi-select-item">
                <input type="checkbox" id="cat-${cat.replace(/\s/g, '_')}" value="${cat}">
                <label for="cat-${cat.replace(/\s/g, '_')}">${cat}</label>
            </div>
        `).join('');

        const eqDropdown = document.getElementById('ms-equipo-dropdown');
        eqDropdown.innerHTML = equipos.map(eq => `
            <div class="multi-select-item">
                <input type="checkbox" id="eq-${eq.replace(/\s/g, '_')}" value="${eq}">
                <label for="eq-${eq.replace(/\s/g, '_')}">${eq}</label>
            </div>
        `).join('');
    }

    function applyFilters() {
        const searchTerm = searchInput.value.trim().toLowerCase();
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
            const matchCat = selectedCategories.length === 0 || selectedCategories.includes(r.categoria);
            const matchEquipo = selectedEquipos.length === 0 || selectedEquipos.includes(r.equipo);
            return matchSearch && matchCat && matchEquipo;
        });
        renderResults();
    }

    function clearFilters() {
        searchInput.value = '';
        selectedCategories = [];
        selectedEquipos = [];
        document.querySelectorAll('.multi-select-dropdown input').forEach(cb => cb.checked = false);
        updateMultiSelectHeader('ms-category', []);
        updateMultiSelectHeader('ms-equipo', []);
        filteredInscritos = [...allInscritos];
        renderResults();
    }

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
            </tr>
        `).join('');
    }

    function renderCards(results) {
        resultsCards.innerHTML = results.map(r => `
            <div class="result-card">
                <div class="card-position"><span class="dorsal-badge">${r.dorsal || '-'}</span></div>
                <div class="card-info">
                    <h4>${r.nombre}</h4>
                    <div class="card-meta">${r.categoria}${r.equipo ? ' | ' + r.equipo : ''}</div>
                </div>
            </div>
        `).join('');
    }

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
