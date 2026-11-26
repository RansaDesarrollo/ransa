/**
 * RANSA - Capa de Conexión (Networking / API / Data Access)
 * 
 * Centraliza toda la comunicación HTTP (Fetch API, FormData, QueryParams),
 * carga dinámica de vistas/fragmentos HTML con ejecución segura de scripts,
 * gestión de estados de red y manejo centralizado de errores.
 */

(function (global) {
  'use strict';

  const DEFAULT_TIMEOUT = 15000;

  /**
   * Helper para construir URL con query parameters
   */
  function buildUrl(url, params) {
    if (!params || Object.keys(params).length === 0) return url;
    const queryString = new URLSearchParams(params).toString();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${queryString}`;
  }

  /**
   * Helper para convertir objeto plano en FormData
   */
  function toFormData(data) {
    if (data instanceof FormData) return data;
    const form = new FormData();
    if (!data || typeof data !== 'object') return form;
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && val !== null) {
        form.append(key, val);
      }
    }
    return form;
  }

  /**
   * Ejecuta los scripts encontrados dentro de un contenedor tras una inyección de innerHTML.
   * Por especificación HTML5, los navegadores NO ejecutan scripts insertados directamente por innerHTML.
   */
  function executeEmbeddedScripts(container) {
    if (!container) return;
    const scripts = container.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      // Copiar atributos (src, type, etc.)
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      // Copiar contenido inline
      newScript.textContent = oldScript.textContent;

      // Reemplazar el viejo por el nuevo para forzar la ejecución en el contexto global
      if (oldScript.parentNode) {
        oldScript.parentNode.replaceChild(newScript, oldScript);
      }
    });
  }

  const RansaConnection = {
    /**
     * Petición HTTP genérica con soporte de timeout y control de errores
     */
    async request(url, options = {}) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT);

      const config = {
        method: options.method || 'GET',
        headers: options.headers || {},
        signal: controller.signal,
        ...options
      };

      try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = new Error(`HTTP Error ${response.status}: ${response.statusText}`);
          error.status = response.status;
          error.response = response;
          throw error;
        }

        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error(`La petición a ${url} superó el tiempo límite de espera (${options.timeout || DEFAULT_TIMEOUT}ms).`);
        }
        throw err;
      }
    },

    /**
     * Petición GET que retorna JSON
     */
    async getJson(url, params = {}, options = {}) {
      const targetUrl = buildUrl(url, params);
      const res = await this.request(targetUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json', ...(options.headers || {}) },
        ...options
      });
      return res.json();
    },

    /**
     * Petición POST enviando JSON o FormData
     */
    async post(url, data = {}, options = {}) {
      let body;
      const headers = { ...(options.headers || {}) };

      if (data instanceof FormData) {
        body = data;
      } else if (typeof data === 'object') {
        const formData = toFormData(data);
        body = formData;
      } else {
        body = data;
      }

      const res = await this.request(url, {
        method: 'POST',
        headers,
        body,
        ...options
      });
      return res;
    },

    /**
     * Petición POST que retorna JSON
     */
    async postJson(url, data = {}, options = {}) {
      const res = await this.post(url, data, {
        headers: { 'Accept': 'application/json', ...(options.headers || {}) },
        ...options
      });
      return res.json();
    },

    /**
     * Carga dinámica de fragmentos HTML (SPA / AJAX) con inserción en contenedor
     * y ejecución automática de scripts embebidos.
     * 
     * @param {string} url - Archivo o endpoint PHP a consultar (e.g. 'roles.php')
     * @param {Object} params - Parámetros a enviar (se envían por POST si existen datos, o GET si está vacío)
     * @param {string|HTMLElement} target - ID del contenedor o elemento DOM destino (e.g. 'contenedor')
     * @param {Object} [options] - Opciones adicionales (onSuccess, onError, showLoading)
     */
    async loadFragment(url, params = {}, target = 'contenedor', options = {}) {
      const container = typeof target === 'string' ? document.getElementById(target) : target;
      if (!container) {
        console.warn(`[RansaConnection] Contenedor destino '${target}' no fue encontrado en el DOM.`);
        return false;
      }

      // Visual feedback de carga
      if (options.showLoading !== false) {
        container.innerHTML = `
          <div class="text-center text-muted py-4 animate-fade-in">
            <div class="spinner-border text-primary mb-2" role="status" style="width: 2rem; height: 2rem;">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mb-0 font-weight-500">Por favor espere unos segundos...</p>
          </div>
        `;
      }

      try {
        let res;
        const hasParams = params && Object.keys(params).length > 0;

        // Si hay parámetros, los enviamos mediante POST (FormData) para compatibilidad con $_REQUEST en PHP
        if (hasParams && options.method !== 'GET') {
          const formData = toFormData(params);
          res = await this.request(url, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
          });
        } else {
          const finalUrl = hasParams ? buildUrl(url, params) : url;
          res = await this.request(finalUrl, {
            method: 'GET',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
          });
        }

        const html = await res.text();
        container.innerHTML = html;

        // Ejecutar los scripts incluidos en la respuesta
        executeEmbeddedScripts(container);

        // Notificar evento global de carga de fragmento
        const event = new CustomEvent('ransa:fragment-loaded', {
          bubbles: true,
          detail: { url, params, container }
        });
        document.dispatchEvent(event);

        if (typeof options.onSuccess === 'function') {
          options.onSuccess(html, container);
        }

        return true;
      } catch (err) {
        console.error(`[RansaConnection] Error al cargar ${url}:`, err);
        container.innerHTML = `
          <div class="alert alert-danger text-center my-3" role="alert">
            <i class="fa-solid fa-triangle-exclamation me-2"></i>
            <strong>Error al cargar la información:</strong> ${err.message || 'No se pudo comunicar con el servidor'}
            <div class="mt-2">
              <button class="btn btn-sm btn-outline-danger" onclick="RansaConnection.loadFragment('${url}', ${JSON.stringify(params)}, '${typeof target === 'string' ? target : target.id}')">
                <i class="fa-solid fa-rotate-right me-1"></i> Reintentar
              </button>
            </div>
          </div>
        `;
        if (typeof options.onError === 'function') {
          options.onError(err);
        }
        return false;
      }
    },

    /**
     * URL de consulta/descarga para una firma almacenada (base DEMO)
     */
    getFirmaUrl(id) {
      return `guardar_firma.php?id=${encodeURIComponent(id)}`;
    },

    /**
     * Envía la firma en Base64 al backend PHP (base DEMO)
     */
    async saveFirma(firmaBase64) {
      const respuesta = await fetch('guardar_firma.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firma: firmaBase64 })
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.ok) {
        throw new Error(datos.mensaje || 'No se pudo guardar la firma.');
      }
      return datos;
    },

    /**
     * Obtiene el listado de metadatos de firmas guardadas (base DEMO)
     */
    async listFirmas() {
      const respuesta = await fetch('guardar_firma.php', {
        cache: 'no-store',
        credentials: 'same-origin'
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.ok || !Array.isArray(datos.firmas)) {
        throw new Error(datos.mensaje || 'No se pudo cargar la lista.');
      }
      return datos;
    },

    /**
     * Solicita el token CSRF de sesión para guardar colaborador y dotación
     */
    async getColaboradorToken() {
      const response = await fetch('colaboradores_dotacion_guardar.php?accion=token', {
        credentials: 'same-origin'
      });
      const result = await response.json();
      if (!response.ok || !result.csrf_token) {
        throw new Error(result.message || 'No se pudo iniciar una sesión segura.');
      }
      return result.csrf_token;
    },

    /**
     * Envía el registro completo de colaborador, dotación y firma
     */
    async saveColaborador(payload, csrfToken) {
      const response = await fetch('colaboradores_dotacion_guardar.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(payload)
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('La sesión terminó o el servidor respondió en un formato inesperado. Inicia sesión y vuelve a intentarlo.');
      }
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'No se pudo guardar el registro.');
      }
      return result;
    }
  };

  /**
   * Puente global compatible para mantener interoperabilidad con el código existente:
   * AjaxConsulta(pagDestino, parametros, htmlObjetivo)
   */
  global.AjaxConsulta = function (pagDestino, parametros, htmlObjetivo) {
    return RansaConnection.loadFragment(pagDestino, parametros || {}, htmlObjetivo || 'contenedor');
  };

  /**
   * Helper simplificado para eventos del menú
   */
  global.evento = function (url) {
    return RansaConnection.loadFragment(url, {}, 'contenedor');
  };

  // Exponer en espacio de nombres global
  global.RansaConnection = RansaConnection;

  // Soporte para módulos ES / CommonJS si aplica
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RansaConnection;
  }
})(typeof window !== 'undefined' ? window : globalThis);
