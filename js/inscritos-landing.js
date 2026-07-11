// ===== INSCRITOS LANDING PAGE =====

(function() {
    'use strict';

    const SITE_URL = 'https://raceclubhub.com/inscritos.html';

    const eventsGrid = document.getElementById('events-grid');
    const loadingState = document.getElementById('landing-loading');
    const emptyState = document.getElementById('landing-empty');
    const qrContainer = document.getElementById('qr-code');

    document.addEventListener('DOMContentLoaded', function() {
        loadEvents();
        generateQR();
    });

    function generateQR() {
        if (typeof qrcode === 'undefined' || !qrContainer) return;
        var qr = qrcode(0, 'M');
        qr.addData(SITE_URL);
        qr.make();
        qrContainer.innerHTML = qr.createSvgTag(5, 0);
    }

    function loadEvents() {
        const cacheBuster = '?t=' + Date.now();

        fetch('data/eventos.csv' + cacheBuster)
            .then(response => {
                if (!response.ok) throw new Error('No events config');
                return response.text();
            })
            .then(text => {
                const events = parseEventsList(text);
                if (events.length === 0) throw new Error('Empty');
                renderEvents(events);
                loadingState.style.display = 'none';
            })
            .catch(() => {
                loadingState.style.display = 'none';
                emptyState.style.display = 'block';
            });
    }

    function parseEventsList(text) {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) return [];

        const separator = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());

        const events = [];
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(separator).map(p => p.trim());
            if (parts.length >= 2 && parts[0]) {
                const event = {};
                headers.forEach((h, idx) => {
                    event[h] = parts[idx] || '';
                });
                events.push(event);
            }
        }
        return events;
    }

    function renderEvents(events) {
        eventsGrid.innerHTML = events.map(evt => {
            const logoSrc = evt.logo ? 'img/' + evt.logo : '';
            const nombre = evt.evento || evt.nombre || 'Evento';
            const descripcion = evt.descripcion || '';

            return `
                <a href="inscritos-evento.html?evento=${encodeURIComponent(nombre)}" class="event-card">
                    <div class="event-card-logo">
                        ${logoSrc 
                            ? `<img src="${logoSrc}" alt="${nombre}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                               <div class="event-card-icon" style="display:none;">
                                   <svg width="64" height="64" viewBox="0 0 64 64">
                                       <circle cx="16" cy="44" r="12" fill="none" stroke="currentColor" stroke-width="3"/>
                                       <circle cx="48" cy="44" r="12" fill="none" stroke="currentColor" stroke-width="3"/>
                                       <path d="M16 44 L28 20 L38 20 L48 44" fill="none" stroke="currentColor" stroke-width="3"/>
                                       <path d="M28 20 L32 44 L48 44" fill="none" stroke="currentColor" stroke-width="3"/>
                                   </svg>
                               </div>`
                            : `<div class="event-card-icon">
                                   <svg width="64" height="64" viewBox="0 0 64 64">
                                       <circle cx="16" cy="44" r="12" fill="none" stroke="currentColor" stroke-width="3"/>
                                       <circle cx="48" cy="44" r="12" fill="none" stroke="currentColor" stroke-width="3"/>
                                       <path d="M16 44 L28 20 L38 20 L48 44" fill="none" stroke="currentColor" stroke-width="3"/>
                                       <path d="M28 20 L32 44 L48 44" fill="none" stroke="currentColor" stroke-width="3"/>
                                   </svg>
                               </div>`
                        }
                    </div>
                    <div class="event-card-info">
                        <h3 class="event-card-name">${nombre}</h3>
                        ${descripcion ? `<p class="event-card-desc">${descripcion}</p>` : ''}
                    </div>
                    <div class="event-card-action">
                        <span class="btn btn-primary">Ver Inscritos</span>
                    </div>
                </a>
            `;
        }).join('');
    }

})();
