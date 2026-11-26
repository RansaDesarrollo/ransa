/**
 * RANSA - Procesamiento de respuestas declarativas del servidor
 */

(function (global) {
  'use strict';

  function readParams(element) {
    const raw = element.getAttribute('data-ransa-params');
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error('[RansaResponseUI] Parámetros inválidos:', error);
      return {};
    }
  }

  function handle(container) {
    if (!container) return;
    const response = container.querySelector('[data-ransa-server-response]');
    if (!response || !global.RansaUI) return;

    const type = response.getAttribute('data-ransa-type') || 'info';
    const message = response.getAttribute('data-ransa-message') || '';
    const title = response.getAttribute('data-ransa-title') || '';
    global.RansaUI.notify(type, message, title);

    const url = response.getAttribute('data-ransa-reload');
    if (url && global.RansaConnection) {
      global.RansaConnection.loadFragment(url, readParams(response), 'contenedor');
    }

    if (response.getAttribute('data-ransa-refresh-sidebar') === 'true' && global.RansaConnection) {
      global.RansaConnection.loadFragment('contexto.php?fragment=sidebar', {}, 'sidebar-roles', { showLoading: false });
      global.RansaConnection.loadFragment('contexto.php?fragment=sidebar&mode=mobile', {}, 'mobile-sidebar-roles', { showLoading: false });
    }
  }

  document.addEventListener('ransa:fragment-loaded', (event) => {
    handle(event.detail && event.detail.container);
  });
})(typeof window !== 'undefined' ? window : globalThis);
