/**
 * RANSA - Capa de Front / Presentación / UI (DOM Manipulation, Events & Rendering)
 * 
 * Gestiona la interacción del usuario, el renderizado de vistas,
 * la captura de eventos, los estados visuales (carga/feedback)
 * y la delegación hacia las capas de Lógica y Conexión.
 */

(function (global) {
  'use strict';

  // Referencias a las capas colaboradoras
  const Connection = () => global.RansaConnection;
  const Logic = () => global.RansaLogic;

  const RansaUI = {
    /**
     * Sistema unificado de notificaciones visuales (Toasts o Alerts flotantes)
     */
    notify(type = 'info', message = '', title = '') {
      if (global.toast && typeof global.toast[type] === 'function') {
        global.toast[type](message, title);
        return;
      }

      // Si no existe el sistema de toast de CoolAdmin, renderizamos un banner accesible
      const containerId = 'ransa-alert-container';
      let container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '99999';
        container.style.maxWidth = '360px';
        document.body.appendChild(container);
      }

      const alertEl = document.createElement('div');
      const bsType = type === 'error' ? 'danger' : (type === 'warning' ? 'warning' : (type === 'success' ? 'success' : 'primary'));
      alertEl.className = `alert alert-${bsType} alert-dismissible fade show shadow-sm mb-2`;
      alertEl.role = 'alert';
      alertEl.innerHTML = `
        ${title ? `<strong>${title}</strong><br>` : ''}
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;

      container.appendChild(alertEl);
      setTimeout(() => {
        alertEl.classList.remove('show');
        setTimeout(() => alertEl.remove(), 250);
      }, 4000);
    },

    /**
     * Muestra diálogo de confirmación no bloqueante o estándar
     */
    confirm(message) {
      return window.confirm(message);
    },

    /**
     * Módulo de presentación para Gestión de Roles (roles.php / roles_l.php)
     */
    roles: {
      reset() {
        Connection().loadFragment('roles.php', {}, 'contenedor');
      },

      view(codigo) {
        Connection().loadFragment('roles.php', { cod: codigo }, 'contenedor');
      },

      save(op) {
        const form = document.getElementById('form') || (document.forms ? document.forms['form'] : null);
        const opInput = document.getElementById('op');
        const codigoInput = document.getElementById('codigo');
        const nombreInput = document.getElementById('nombre');

        const codigoVal = codigoInput ? codigoInput.value : '';
        const nombreVal = nombreInput ? nombreInput.value : '';

        // Construir payload a través de la capa de Lógica
        const payload = Logic().buildRolePayload(op, codigoVal, nombreVal);

        // Validar negocio mediante la capa de Lógica
        const validation = Logic().validateRole(payload);
        if (!validation.isValid) {
          RansaUI.notify('warning', validation.errors.join(' '));
          if (nombreInput && (!nombreVal || nombreVal.trim().length < 2)) {
            nombreInput.focus();
          }
          return;
        }

        // Si es eliminación, solicitar confirmación
        if (op === 'E') {
          const confirmed = RansaUI.confirm('¿Eliminar este rol y sus asignaciones de usuarios y aplicaciones? Esta acción no se puede deshacer.');
          if (!confirmed) return;
        }

        // Asignar al input oculto si existe
        if (opInput) opInput.value = op;

        // Delegar envío y actualización a la capa de Conexión
        Connection().loadFragment('roles_l.php', payload, 'contenedor');
      },

      insert() {
        this.save('I');
      },

      modify() {
        this.save('M');
      },

      remove() {
        this.save('E');
      },

      filterTable(term) {
        RansaUI.filterTableRows('myTable', term, 1);
      }
    },

    /**
     * Módulo de presentación para Asociación Aplicaciones - Roles (roles_aplicaciones.php)
     */
    roleApps: {
      reset() {
        Connection().loadFragment('roles_aplicaciones.php', {}, 'contenedor');
      },

      query() {
        const selectRol = document.getElementById('rol');
        const rolVal = selectRol ? selectRol.value : '';
        if (!rolVal) {
          RansaUI.notify('warning', 'Por favor seleccione un rol.');
          if (selectRol) selectRol.focus();
          return;
        }
        Connection().loadFragment('roles_aplicaciones.php', { rol: rolVal }, 'contenedor');
      },

      toggle(checkboxId, codAplicacion, codRol) {
        const checkbox = document.getElementById(checkboxId);
        const isChecked = checkbox ? checkbox.checked : false;
        const op = isChecked ? 'I' : 'E';

        const payload = Logic().buildRoleAppPayload(op, codRol, codAplicacion);
        const validation = Logic().validateRoleAppAssociation(payload);

        if (!validation.isValid) {
          RansaUI.notify('warning', validation.errors.join(' '));
          if (checkbox) checkbox.checked = !isChecked; // Revertir visualmente
          return;
        }

        Connection().loadFragment('roles_aplicaciones_l.php', payload, 'contenedor', {
          onSuccess: () => {
            const msg = isChecked ? 'Aplicación asociada al rol.' : 'Aplicación desasociada del rol.';
            RansaUI.notify('info', msg);
          },
          onError: () => {
            if (checkbox) checkbox.checked = !isChecked; // Revertir en error
          }
        });
      },

      filterTable(term) {
        RansaUI.filterTableRows('myTable', term, 1);
      }
    },

    /**
     * Módulo de presentación para Asociación Usuarios - Roles (apli_roles.php)
     */
    userRoles: {
      reset() {
        Connection().loadFragment('apli_roles.php', {}, 'contenedor');
      },

      query() {
        const selectUser = document.getElementById('rol');
        const userVal = selectUser ? selectUser.value : '';
        if (!userVal) {
          RansaUI.notify('warning', 'Por favor seleccione un usuario.');
          if (selectUser) selectUser.focus();
          return;
        }
        Connection().loadFragment('apli_roles.php', { rol: userVal }, 'contenedor');
      },

      toggle(checkboxId, codUsuario, codRol) {
        const checkbox = document.getElementById(checkboxId);
        const isChecked = checkbox ? checkbox.checked : false;
        const op = isChecked ? 'I' : 'E';

        const payload = Logic().buildUserRolePayload(op, codRol, codUsuario);
        const validation = Logic().validateUserRoleAssociation(payload);

        if (!validation.isValid) {
          RansaUI.notify('warning', validation.errors.join(' '));
          if (checkbox) checkbox.checked = !isChecked;
          return;
        }

        Connection().loadFragment('apli_roles_l.php', payload, 'contenedor', {
          onSuccess: () => {
            const msg = isChecked ? 'Rol asignado al usuario.' : 'Rol desasignado del usuario.';
            RansaUI.notify('info', msg);
          },
          onError: () => {
            if (checkbox) checkbox.checked = !isChecked;
          }
        });
      },

      filterTable(term) {
        RansaUI.filterTableRows('myTable', term, 1);
      }
    },

    /**
     * Módulo de presentación para Cambio de Contraseña (cambio.php / cambio_l.php)
     */
    password: {
      change() {
        const claveActualInput = document.getElementById('clave_actual');
        const claveNuevaInput = document.getElementById('clave_nueva');
        const claveConfirmarInput = document.getElementById('clave_confirmar');

        const clave_actual = claveActualInput ? claveActualInput.value : '';
        const clave_nueva = claveNuevaInput ? claveNuevaInput.value : '';
        const clave_confirmar = claveConfirmarInput ? claveConfirmarInput.value : '';

        // Validar mediante la capa de Lógica
        const validation = Logic().validatePasswordChange({ clave_actual, clave_nueva, clave_confirmar });
        if (!validation.isValid) {
          RansaUI.notify('warning', validation.errors.join(' '));
          if (!clave_actual && claveActualInput) {
            claveActualInput.focus();
          } else if ((!clave_nueva || clave_nueva.length < 4) && claveNuevaInput) {
            claveNuevaInput.focus();
          } else if (claveConfirmarInput) {
            claveConfirmarInput.focus();
          }
          return;
        }

        // Delegar envío a la capa de Conexión
        Connection().loadFragment('cambio_l.php', { clave_actual, clave_nueva }, 'contenedor');
      },

      toggleVisibility(fieldId) {
        const input = document.getElementById(fieldId);
        const icon = document.getElementById('icon_' + fieldId);
        if (!input || !icon) return;

        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      }
    },

    /**
     * Módulo de presentación para Colaboradores, Dotación y Firma (base DEMO)
     */
    colaboradores: {
      bind(container) {
        const target = container || document;
        const form = target.querySelector('#colaborador-form');
        if (!form || form.dataset.bound === 'true') return;
        form.dataset.bound = 'true';

        const root = target.querySelector('[data-colaboradores-dotacion]') || form.closest('section') || target;
        const formMessage = root.querySelector('#form-message');
        const saveButton = root.querySelector('#guardar-registro');
        const tabs = Array.from(root.querySelectorAll('[data-form-tab]'));
        const panels = Array.from(root.querySelectorAll('[data-form-panel]'));
        const tabsNav = root.querySelector('.form-tabs');

        // Controles y estado de la firma (base DEMO)
        const canvas = root.querySelector('#canvasFirma');
        const contexto = canvas ? canvas.getContext('2d') : null;
        const mensaje = root.querySelector('#mensaje');
        const resultado = root.querySelector('#resultado');
        const lista = root.querySelector('#listaFirmas');
        const botonGuardarFirma = root.querySelector('#guardar');
        const botonLimpiarFirma = root.querySelector('#limpiar');
        const botonDescargarFirma = root.querySelector('#descargar');
        const botonActualizarFirmas = root.querySelector('#actualizarFirmas');
        const idFirmaGuardada = root.querySelector('#idFirmaGuardada');
        const firmaFormulario = root.querySelector('#firmaFormulario');
        const imagenFirmaGuardada = root.querySelector('#imagenFirmaGuardada');
        const verificacionFirma = root.querySelector('#verificacionFirma');

        let dibujando = false;
        let tieneFirma = false;
        let firmaId = null;
        let csrfToken = '';
        let savingRecord = false;

        function mostrarMensaje(texto, color = '#374151') {
          if (!mensaje) return;
          mensaje.textContent = texto;
          mensaje.style.color = color;
        }

        function posicion(e) {
          const r = canvas.getBoundingClientRect();
          const escalaX = canvas.width / canvas.clientWidth;
          const escalaY = canvas.height / canvas.clientHeight;
          return {
            x: (e.clientX - r.left - canvas.clientLeft) * escalaX,
            y: (e.clientY - r.top - canvas.clientTop) * escalaY
          };
        }

        function prepararCanvas(force = false) {
          if (!canvas || !contexto) return;
          if (!canvas.clientWidth || !canvas.clientHeight) return;
          const escala = global.devicePixelRatio || 1;
          const targetW = Math.round(canvas.clientWidth * escala);
          const targetH = Math.round(canvas.clientHeight * escala);
          if (!force && canvas.width === targetW && canvas.height === targetH) return;
          if (!force && tieneFirma && canvas.width > 0 && canvas.height > 0) return;

          canvas.width = targetW;
          canvas.height = targetH;
          contexto.lineWidth = 2.5 * escala;
          contexto.lineCap = 'round';
          contexto.strokeStyle = '#111827';
        }

        function syncSizes() {
          const sizes = [
            ['talla_hombre', ['talla-hombre-ropa', 'talla-hombre-pantalon', 'talla-hombre-calzado']],
            ['talla_mujer', ['talla-mujer-ropa', 'talla-mujer-calzado']]
          ];
          sizes.forEach(([fieldId, selectIds]) => {
            const values = selectIds
              .map((selectId) => root.querySelector(`#${selectId}`)?.value || '');
            const hiddenField = root.querySelector(`#${fieldId}`);
            if (hiddenField) {
              hiddenField.value = Logic().serializeSelectedSizes(values);
            }
          });
        }

        function activateTab(panelId, focusTab) {
          tabs.forEach((tab) => {
            const selected = tab.dataset.formTab === panelId;
            tab.setAttribute('aria-selected', String(selected));
            tab.tabIndex = selected ? 0 : -1;
            if (selected && focusTab) tab.focus();
          });
          panels.forEach((panel) => {
            panel.hidden = panel.id !== panelId;
          });
          if (panelId === 'panel-firma') {
            prepararCanvas();
          }
        }

        async function cargarFirmas() {
          if (!lista) return;
          try {
            const datos = await Connection().listFirmas();
            if (!datos.firmas.length) {
              lista.innerHTML = '<p>No hay firmas guardadas.</p>';
              return;
            }
            lista.innerHTML = '';
            datos.firmas.forEach((f) => {
              const article = document.createElement('article');
              article.className = 'firma-guardada';

              const info = document.createElement('p');
              const title = document.createElement('strong');
              title.textContent = `Firma #${f.id}`;
              info.appendChild(title);
              info.appendChild(document.createElement('br'));
              info.appendChild(document.createTextNode(`Tipo: ${f.tipo_mime}`));
              info.appendChild(document.createElement('br'));
              info.appendChild(document.createTextNode(`Fecha: ${f.creado_en}`));

              const btn = document.createElement('button');
              btn.type = 'button';
              btn.className = 'firma-btn';
              btn.dataset.id = String(f.id);
              btn.textContent = 'Verificar firma';

              article.appendChild(info);
              article.appendChild(btn);
              lista.appendChild(article);
            });
          } catch (error) {
            lista.textContent = error instanceof Error ? error.message : 'No se pudo cargar la lista.';
          }
        }

        // Eventos del canvas de firma (base DEMO)
        if (canvas && contexto) {
          canvas.onpointerdown = (e) => {
            e.preventDefault();
            prepararCanvas();
            dibujando = true;
            tieneFirma = true;
            firmaId = null;
            if (idFirmaGuardada) idFirmaGuardada.value = '';
            canvas.setPointerCapture(e.pointerId);
            const p = posicion(e);
            contexto.beginPath();
            contexto.moveTo(p.x, p.y);
          };

          canvas.onpointermove = (e) => {
            if (!dibujando) return;
            const p = posicion(e);
            contexto.lineTo(p.x, p.y);
            contexto.stroke();
          };

          canvas.onpointerup = canvas.onpointercancel = () => {
            if (!dibujando) return;
            dibujando = false;
            contexto.closePath();
          };
        }

        botonGuardarFirma?.addEventListener('click', async () => {
          if (!tieneFirma) {
            mostrarMensaje('Primero dibuja una firma.', '#dc2626');
            return;
          }
          botonGuardarFirma.disabled = true;
          try {
            const datos = await Connection().saveFirma(canvas.toDataURL('image/png'));
            firmaId = datos.id;
            if (idFirmaGuardada) idFirmaGuardada.value = String(datos.id);
            if (imagenFirmaGuardada) imagenFirmaGuardada.src = Connection().getFirmaUrl(datos.id);
            if (firmaFormulario) firmaFormulario.hidden = false;
            if (resultado) {
              resultado.hidden = false;
              resultado.innerHTML = '<p class="mb-0">La firma fue guardada y asociada automáticamente al formulario.</p>';
            }
            mostrarMensaje(datos.mensaje, '#16a34a');
            await cargarFirmas();
          } catch (error) {
            mostrarMensaje(error instanceof Error ? error.message : 'No se pudo guardar la firma.', '#dc2626');
          } finally {
            botonGuardarFirma.disabled = false;
          }
        });

        botonLimpiarFirma?.addEventListener('click', () => {
          if (contexto && canvas) {
            contexto.clearRect(0, 0, canvas.width, canvas.height);
          }
          tieneFirma = false;
          firmaId = null;
          if (idFirmaGuardada) idFirmaGuardada.value = '';
          if (imagenFirmaGuardada) imagenFirmaGuardada.removeAttribute('src');
          if (firmaFormulario) firmaFormulario.hidden = true;
          if (resultado) {
            resultado.hidden = true;
            resultado.innerHTML = '';
          }
          mostrarMensaje('');
        });

        botonDescargarFirma?.addEventListener('click', () => {
          if (!firmaId) {
            mostrarMensaje('Guarda la firma primero.', '#dc2626');
            return;
          }
          const enlace = document.createElement('a');
          enlace.href = Connection().getFirmaUrl(firmaId);
          enlace.download = `firma-${firmaId}.png`;
          enlace.click();
        });

        lista?.addEventListener('click', (e) => {
          const boton = e.target.closest('[data-id]');
          if (!boton || !verificacionFirma) return;
          const id = boton.dataset.id;
          verificacionFirma.hidden = false;
          verificacionFirma.innerHTML = '';
          const title = document.createElement('strong');
          title.textContent = `Firma #${id}`;
          const img = document.createElement('img');
          img.src = Connection().getFirmaUrl(id);
          img.alt = 'Firma verificada';
          verificacionFirma.appendChild(title);
          verificacionFirma.appendChild(document.createElement('br'));
          verificacionFirma.appendChild(img);
        });

        botonActualizarFirmas?.addEventListener('click', cargarFirmas);

        // Tabs e inputs del formulario
        activateTab('panel-personal', false);

        tabsNav?.addEventListener('click', (event) => {
          const tab = event.target.closest('[data-form-tab]');
          if (tab) activateTab(tab.dataset.formTab, false);
        });

        tabsNav?.addEventListener('keydown', (event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          const currentIndex = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
          const direction = event.key === 'ArrowRight' ? 1 : -1;
          const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
          event.preventDefault();
          activateTab(tabs[nextIndex].dataset.formTab, true);
        });

        const cedulaInput = root.querySelector('#cedula');
        const dotacionCedula = root.querySelector('#dotacion-cedula');
        cedulaInput?.addEventListener('input', (event) => {
          if (dotacionCedula) dotacionCedula.value = event.currentTarget.value;
        });

        root.querySelectorAll('#panel-dotacion select[id^="talla-"]').forEach((select) => {
          select.addEventListener('change', syncSizes);
        });

        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          syncSizes();

          const formData = new FormData(form);
          const entries = Object.fromEntries(formData.entries());
          const validation = Logic().validateColaboradorDotacion({
            cedula: entries.cedula,
            nombre: entries.nombre,
            edad: entries.edad,
            tieneFirma,
            firmaId
          });

          if (!validation.isValid) {
            if (!tieneFirma && !(Number(firmaId) > 0)) {
              activateTab('panel-firma', false);
            } else {
              const invalidControl = form.querySelector(':invalid');
              const panel = invalidControl && invalidControl.closest('[data-form-panel]');
              if (panel) activateTab(panel.id, false);
              if (invalidControl) {
                invalidControl.focus();
                invalidControl.reportValidity();
              }
            }
            if (formMessage) {
              formMessage.className = 'alert alert-warning mt-3';
              formMessage.textContent = validation.errors.join(' ');
            }
            return;
          }

          if (!csrfToken || savingRecord) return;

          const firmaData = tieneFirma && canvas && canvas.width > 0 ? canvas.toDataURL('image/png') : '';
          const payload = Logic().buildColaboradorPayload(
            entries,
            formData.getAll('tipo_equipo_ti[]'),
            formData.getAll('tipo_dotacion_ley[]'),
            firmaData,
            firmaId
          );

          savingRecord = true;
          if (saveButton) saveButton.disabled = true;
          if (formMessage) {
            formMessage.className = 'alert alert-info mt-3';
            formMessage.textContent = 'Guardando colaborador, dotación y firma…';
          }

          try {
            const result = await Connection().saveColaborador(payload, csrfToken);
            if (formMessage) {
              formMessage.className = 'alert alert-success mt-3';
              formMessage.textContent = `Registro guardado. Entrega número ${result.numero_entrega}; firma: ${result.fecha_firma}; vigencia desde ${result.vigencia_inicio}.`;
            }
            RansaUI.notify('success', `Entrega #${result.numero_entrega} registrada correctamente.`);
          } catch (error) {
            if (formMessage) {
              formMessage.className = 'alert alert-danger mt-3';
              formMessage.textContent = error instanceof Error ? error.message : 'Ocurrió un error al guardar. Revisa la conexión e inténtalo nuevamente.';
            }
            if (saveButton) saveButton.disabled = false;
          } finally {
            savingRecord = false;
          }
        });

        form.addEventListener('reset', () => {
          global.setTimeout(() => {
            if (contexto && canvas) {
              contexto.clearRect(0, 0, canvas.width, canvas.height);
            }
            tieneFirma = false;
            firmaId = null;
            if (idFirmaGuardada) idFirmaGuardada.value = '';
            if (imagenFirmaGuardada) imagenFirmaGuardada.removeAttribute('src');
            if (firmaFormulario) firmaFormulario.hidden = true;
            if (resultado) {
              resultado.hidden = true;
              resultado.innerHTML = '';
            }
            mostrarMensaje('');
            syncSizes();
            activateTab('panel-personal', false);
            if (formMessage) {
              formMessage.className = '';
              formMessage.textContent = '';
            }
            if (saveButton) saveButton.disabled = !csrfToken;
          }, 0);
        });

        // Inicialización de seguridad y catálogo de firmas
        Connection().getColaboradorToken()
          .then((token) => {
            csrfToken = token;
            if (saveButton) saveButton.disabled = false;
          })
          .catch(() => {
            if (formMessage) {
              formMessage.className = 'alert alert-danger mt-3';
              formMessage.textContent = 'No fue posible conectar con la aplicación. Inicia sesión y vuelve a cargar esta página.';
            }
          });

        cargarFirmas();
      }
    },

    /**
     * Algoritmo de filtrado de filas de tabla en vivo
     */
    filterTableRows(tableId, term, columnIndex = 1) {
      const table = document.getElementById(tableId);
      if (!table) return;

      const rows = table.getElementsByTagName('tr');
      // Empezar en 1 para saltar fila header
      for (let i = 1; i < rows.length; i++) {
        // Si es fila de footer (colspan), no ocultarla
        if (rows[i].querySelector('th[colspan]')) continue;

        const cell = rows[i].getElementsByTagName('td')[columnIndex];
        if (cell) {
          const text = cell.textContent || cell.innerText || '';
          const match = Logic().matchesSearch(text, term);
          rows[i].style.display = match ? '' : 'none';
        }
      }
    },

    /**
     * Vinculación automática de eventos del DOM en vistas cargadas dinámicamente
     */
    bindLoadedView(container) {
      const target = container || document;

      // 1. Vincular filtro de búsqueda de tablas
      const searchInput = target.querySelector('#myInput');
      if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = 'true';
        searchInput.addEventListener('input', (e) => {
          this.filterTableRows('myTable', e.target.value, 1);
        });
      }

      // 2. Prevenir submit recargador en formularios estándar
      const forms = target.querySelectorAll('form[onsubmit="return false;"]');
      forms.forEach((f) => {
        if (!f.dataset.bound) {
          f.dataset.bound = 'true';
          f.addEventListener('submit', (e) => e.preventDefault());
        }
      });

      // 3. Vincular módulo de colaboradores, dotación y firma
      this.colaboradores.bind(target);
    },

    /**
     * Inicialización global de la capa de UI
     */
    init() {
      // Escuchar eventos de carga de fragmentos dinámicos en el contenedor
      document.addEventListener('ransa:fragment-loaded', (e) => {
        this.bindLoadedView(e.detail && e.detail.container);
      });

      // Delegación de eventos para enlaces de navegación del sidebar
      document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-app-url], .js-app-link');
        if (link) {
          e.preventDefault();
          const url = link.getAttribute('data-app-url') || link.getAttribute('href');
          if (url && url !== '#' && !url.startsWith('javascript:')) {
            Connection().loadFragment(url, {}, 'contenedor');
          }
        }
      });

      // Vinculación inicial de la vista actual
      if (document.readyState !== 'loading') {
        this.bindLoadedView(document);
      } else {
        document.addEventListener('DOMContentLoaded', () => this.bindLoadedView(document));
      }
    }
  };

  // Exponer globalmente
  global.RansaUI = RansaUI;

  // Auto-iniciar la capa de UI
  RansaUI.init();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RansaUI;
  }
})(typeof window !== 'undefined' ? window : globalThis);
