// ===== CYCLING RESULTS APP =====

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

    // Load data from JSON file
    function loadData() {
        showLoading(true);
        
        // Add cache-busting parameter to avoid stale data
        const cacheBuster = '?t=' + Date.now();
        
        fetch('data/resultados.json' + cacheBuster)
            .then(response => {
                if (!response.ok) throw new Error('No se pudieron cargar los datos');
                return response.json();
            })
            .then(data => {
                // Update event info
                if (data.evento) {
                    eventTitle.textContent = data.evento.nombre || 'Competencia de Ciclismo';
                    eventDetails.textContent = formatEventDetails(data.evento);
                }

                // Load results
                allResults = data.resultados || [];
                
                // Extract unique categories and events
                categories = [...new Set(allResults.map(r => r.categoria))].sort();
                events = [...new Set(allResults.map(r => r.evento))].sort();

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
                eventDetails.textContent = 'Sube los resultados desde el panel de administracion';
                renderResults();
            });
    }

    function formatEventDetails(evento) {
        const parts = [];
        if (evento.fecha) parts.push(evento.fecha);
        if (evento.lugar) parts.push(evento.lugar);
        if (evento.distancia) parts.push(evento.distancia);
        return parts.join(' | ');
    }

    function populateFilters() {
        // Clear existing options (keep the first "all" option)
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
            // Search by dorsal or name
            const matchesSearch = !searchTerm || 
                result.dorsal.toString().includes(searchTerm) ||
                result.nombre.toLowerCase().includes(searchTerm);

            // Filter by category
            const matchesCategory = !selectedCategory || result.categoria === selectedCategory;

            // Filter by event
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

    function renderResults() {
        // Sort results
        const sorted = sortResults([...filteredResults]);

        // Update count
        if (filteredResults.length === allResults.length) {
            resultsCount.textContent = `Mostrando todos los resultados (${allResults.length})`;
        } else {
            resultsCount.textContent = `Mostrando ${filteredResults.length} de ${allResults.length} resultados`;
        }

        // Show/hide empty state
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

    function sortResults(results) {
        return results.sort((a, b) => {
            let valA = a[currentSort.field];
            let valB = b[currentSort.field];

            // Handle numeric fields
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

    // Utility: Debounce
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

})();
