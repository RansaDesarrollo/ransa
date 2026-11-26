import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const connectionSrc = readFileSync(path.join(root, 'js/layers/connection.js'), 'utf8');
const logicSrc = readFileSync(path.join(root, 'js/layers/logic.js'), 'utf8');
const uiSrc = readFileSync(path.join(root, 'js/layers/ui.js'), 'utf8');
const legacyBridgesSrc = readFileSync(path.join(root, 'js/layers/legacy-bridges.js'), 'utf8');
const responseUiSrc = readFileSync(path.join(root, 'js/layers/response-ui.js'), 'utf8');

function createSandboxContext(extraGlobals = {}) {
  const listeners = new Map();
  const document = {
    readyState: 'complete',
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (event, handler) => {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(handler);
    },
    removeEventListener: () => {},
    dispatchEvent: (event) => {
      const handlers = listeners.get(event.type) || [];
      handlers.forEach(h => h(event));
    },
    createElement: (tag) => ({
      tagName: tag.toUpperCase(),
      classList: { add: () => {}, remove: () => {} },
      appendChild: () => {},
      remove: () => {},
      style: {},
      setAttribute: () => {},
      attributes: [],
      children: []
    })
  };

  const context = {
    console,
    setTimeout,
    clearTimeout,
    AbortController: globalThis.AbortController,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    },
    URLSearchParams,
    FormData: class FormData {
      constructor() { this.entries = new Map(); }
      append(k, v) { this.entries.set(k, v); }
      get(k) { return this.entries.get(k); }
    },
    document,
    window: {},
    globalThis: {},
    fetch: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      text: async () => '<div id="test">Loaded content</div>'
    }),
    ...extraGlobals
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  return context;
}

test('CAPA DE LÓGICA: RansaLogic validaciones y normalización de datos', () => {
  const ctx = createSandboxContext();
  vm.runInContext(logicSrc, ctx);
  const { RansaLogic } = ctx;

  assert.ok(RansaLogic, 'RansaLogic debe estar definido en el contexto global');

  // 1. Normalización y búsqueda
  assert.equal(RansaLogic.normalize('  ADMINISTRACIÓN  '), 'administracion');
  assert.equal(RansaLogic.matchesSearch('Administrador de Sistemas', 'admin'), true);
  assert.equal(RansaLogic.matchesSearch('Óscar Pérez', 'oscar'), true);
  assert.equal(RansaLogic.matchesSearch('Rol de Bodega', 'ventas'), false);

  // 2. Validación de Roles
  const insertValid = RansaLogic.validateRole({ op: 'I', nombre: 'Auditor' });
  assert.equal(insertValid.isValid, true);
  assert.equal(insertValid.errors.length, 0);

  const insertInvalid = RansaLogic.validateRole({ op: 'I', nombre: '' });
  assert.equal(insertInvalid.isValid, false);
  assert.ok(insertInvalid.errors.some(e => e.includes('requerido')));

  const modifyValid = RansaLogic.validateRole({ op: 'M', codigo: 3, nombre: 'Super Admin' });
  assert.equal(modifyValid.isValid, true);

  const modifyInvalid = RansaLogic.validateRole({ op: 'M', codigo: 0, nombre: 'Super Admin' });
  assert.equal(modifyInvalid.isValid, false);

  const deleteValid = RansaLogic.validateRole({ op: 'E', codigo: 5 });
  assert.equal(deleteValid.isValid, true);

  // 3. Validación de Asociaciones
  const assocAppValid = RansaLogic.validateRoleAppAssociation({ op: 'I', cod_rol: 1, cod_aplicacion: 2 });
  assert.equal(assocAppValid.isValid, true);

  const assocAppInvalid = RansaLogic.validateRoleAppAssociation({ op: 'X', cod_rol: 1, cod_aplicacion: 0 });
  assert.equal(assocAppInvalid.isValid, false);

  const assocUserValid = RansaLogic.validateUserRoleAssociation({ op: 'E', cod_rol: 2, cod_usuario: 10 });
  assert.equal(assocUserValid.isValid, true);

  // 4. Validación de Login
  const loginValid = RansaLogic.validateLogin({ us: 'admin', pa: 'secret123' });
  assert.equal(loginValid.isValid, true);

  const loginInvalid = RansaLogic.validateLogin({ us: '', pa: '' });
  assert.equal(loginInvalid.isValid, false);

  // 5. Generadores de Payload
  const rolePayload = RansaLogic.buildRolePayload('i', '5', ' Supervisor ');
  assert.deepEqual({ ...rolePayload }, { op: 'I', codigo: '5', nombre: 'Supervisor' });

  const roleAppPayload = RansaLogic.buildRoleAppPayload('i', '2', '8');
  assert.deepEqual({ ...roleAppPayload }, { op: 'I', cod_rol: 2, cod_aplicacion: 8 });

  const userRolePayload = RansaLogic.buildUserRolePayload('e', '3', '15');
  assert.deepEqual({ ...userRolePayload }, { op: 'E', cod_rol: 3, cod_usuario: 15 });

  // 6. Validación de Colaboradores, Dotación y Firma
  assert.equal(RansaLogic.serializeSelectedSizes(['M', '', '32']), '["M","32"]');
  assert.equal(RansaLogic.serializeSelectedSizes(['', '']), '');

  const colabInvalid = RansaLogic.validateColaboradorDotacion({
    cedula: '',
    nombre: 'Ana',
    edad: '150',
    tieneFirma: false,
    firmaId: null
  });
  assert.equal(colabInvalid.isValid, false);
  assert.equal(colabInvalid.errors.length, 3);

  const colabValid = RansaLogic.validateColaboradorDotacion({
    cedula: '10012345',
    nombre: 'Ana Gómez',
    edad: '29',
    tieneFirma: true,
    firmaId: 4
  });
  assert.equal(colabValid.isValid, true);
  assert.deepEqual(
    { ...RansaLogic.buildColaboradorPayload({ cedula: '10012345' }, ['Laptop'], ['BOTAS'], 'data:image/png;base64,abc', '4') },
    {
      cedula: '10012345',
      tipo_equipo_ti: ['Laptop'],
      tipo_dotacion_ley: ['BOTAS'],
      firma_id: 4,
      firma: 'data:image/png;base64,abc'
    }
  );
});

test('CAPA DE CONEXIÓN: RansaConnection peticiones y carga de fragmentos', async () => {
  let requestedUrl = null;
  let requestedMethod = null;
  let requestedBody = null;

  const ctx = createSandboxContext({
    fetch: async (url, options = {}) => {
      requestedUrl = url;
      requestedMethod = options.method;
      requestedBody = options.body;
      return {
        ok: true,
        status: 200,
        text: async () => '<div class="content"><script>window.__scriptExecuted = true;</script><span>OK</span></div>'
      };
    }
  });

  vm.runInContext(connectionSrc, ctx);
  const { RansaConnection, AjaxConsulta } = ctx;

  assert.ok(RansaConnection, 'RansaConnection debe estar definido');
  assert.equal(typeof AjaxConsulta, 'function', 'AjaxConsulta bridge debe estar definido');

  // Test carga de fragmento con contenedor DOM mock
  const container = {
    id: 'contenedor',
    innerHTML: '',
    querySelectorAll: (sel) => {
      if (sel === 'script') {
        return [{
          attributes: [],
          textContent: 'window.__scriptExecuted = true;',
          parentNode: { replaceChild: () => {} }
        }];
      }
      return [];
    }
  };
  ctx.document.getElementById = (id) => (id === 'contenedor' ? container : null);

  const loadSuccess = await RansaConnection.loadFragment('roles.php', { cod: 12 }, 'contenedor');
  assert.equal(loadSuccess, true);
  assert.equal(requestedUrl, 'roles.php');
  assert.equal(requestedMethod, 'POST');
  assert.ok(requestedBody instanceof ctx.FormData);
  assert.equal(requestedBody.get('cod'), 12);

  // Test función global AjaxConsulta
  const bridgeSuccess = await AjaxConsulta('roles_l.php', { op: 'I', nombre: 'Nuevo' }, 'contenedor');
  assert.equal(bridgeSuccess, true);
  assert.equal(requestedUrl, 'roles_l.php');
  assert.equal(requestedBody.get('nombre'), 'Nuevo');

  // Test capa de conexión de firmas (base DEMO)
  assert.equal(RansaConnection.getFirmaUrl(7), 'guardar_firma.php?id=7');

  const firmaCtx = createSandboxContext({
    fetch: async (url, options = {}) => {
      requestedUrl = url;
      requestedMethod = options.method || 'GET';
      requestedBody = options.body;
      if (requestedMethod === 'POST') {
        return { ok: true, status: 201, json: async () => ({ ok: true, id: 9, mensaje: 'Firma guardada correctamente.' }) };
      }
      return { ok: true, status: 200, json: async () => ({ ok: true, firmas: [{ id: 9, tipo_mime: 'image/png', tamano_bytes: 120, creado_en: '2026-11-26' }] }) };
    }
  });
  vm.runInContext(connectionSrc, firmaCtx);
  const saved = await firmaCtx.RansaConnection.saveFirma('data:image/png;base64,iVBORw0KGgo=');
  assert.equal(saved.id, 9);
  assert.equal(requestedUrl, 'guardar_firma.php');
  assert.equal(requestedMethod, 'POST');
  const listed = await firmaCtx.RansaConnection.listFirmas();
  assert.equal(listed.firmas.length, 1);
  assert.equal(listed.firmas[0].id, 9);
});

test('CAPA DE FRONT / UI: RansaUI orquestación, puentes legacy y delegación', () => {
  const container = {
    id: 'contenedor',
    innerHTML: '',
    querySelectorAll: () => []
  };

  let fragmentLoadedUrl = null;
  let fragmentLoadedParams = null;

  const ctx = createSandboxContext();
  ctx.document.getElementById = (id) => (id === 'contenedor' ? container : null);

  // Cargar Connection y Logic primero
  vm.runInContext(connectionSrc, ctx);
  vm.runInContext(logicSrc, ctx);

  // Mockear loadFragment para verificar que UI delega a Connection
  ctx.RansaConnection.loadFragment = (url, params) => {
    fragmentLoadedUrl = url;
    fragmentLoadedParams = params;
    return Promise.resolve(true);
  };

  // Cargar UI
  vm.runInContext(uiSrc, ctx);
  vm.runInContext(legacyBridgesSrc, ctx);
  const { RansaUI, insertar, ver, restablecer } = ctx;

  assert.ok(RansaUI, 'RansaUI debe existir');
  assert.equal(typeof insertar, 'function', 'insertar() global bridge debe existir');
  assert.equal(typeof ver, 'function', 'ver() global bridge debe existir');
  assert.equal(typeof restablecer, 'function', 'restablecer() global bridge debe existir');

  // 1. Test ver(cod)
  ver(42);
  assert.equal(fragmentLoadedUrl, 'roles.php');
  assert.deepEqual({ ...fragmentLoadedParams }, { cod: 42 });

  // 2. Test roles.save con validación
  ctx.document.getElementById = (id) => {
    if (id === 'op') return { value: '' };
    if (id === 'codigo') return { value: '10' };
    if (id === 'nombre') return { value: 'Auditor Contable' };
    if (id === 'contenedor') return container;
    return null;
  };

  RansaUI.roles.save('M');
  assert.equal(fragmentLoadedUrl, 'roles_l.php');
  assert.deepEqual({ ...fragmentLoadedParams }, { op: 'M', codigo: '10', nombre: 'Auditor Contable' });

  let deleteConfirmation = '';
  RansaUI.confirm = message => {
    deleteConfirmation = message;
    return true;
  };
  RansaUI.roles.save('E');
  assert.match(deleteConfirmation, /asignaciones de usuarios y aplicaciones/);
  assert.equal(fragmentLoadedUrl, 'roles_l.php');
  assert.deepEqual({ ...fragmentLoadedParams }, { op: 'E', codigo: '10', nombre: 'Auditor Contable' });
});

test('CAPA DE RESPUESTA: procesa respuestas declarativas del servidor', () => {
  const ctx = createSandboxContext();
  const response = {
    getAttribute: (name) => ({
      'data-ransa-type': 'success',
      'data-ransa-message': 'Guardado',
      'data-ransa-title': '',
      'data-ransa-reload': 'roles.php',
      'data-ransa-params': '{}',
      'data-ransa-refresh-sidebar': 'true'
    }[name] || null)
  };
  const container = {
    querySelector: (selector) => selector === '[data-ransa-server-response]' ? response : null,
    querySelectorAll: () => []
  };
  const notifications = [];
  const reloads = [];

  vm.runInContext(connectionSrc, ctx);
  vm.runInContext(logicSrc, ctx);
  vm.runInContext(uiSrc, ctx);
  ctx.RansaUI.notify = (...args) => notifications.push(args);
  ctx.RansaConnection.loadFragment = (...args) => { reloads.push(args); };
  vm.runInContext(responseUiSrc, ctx);

  ctx.document.dispatchEvent(new ctx.CustomEvent('ransa:fragment-loaded', {
    detail: { container }
  }));

  assert.deepEqual(notifications, [['success', 'Guardado', '']]);
  assert.equal(reloads[0][0], 'roles.php');
  assert.deepEqual({ ...reloads[0][1] }, {});
  assert.equal(reloads[0][2], 'contenedor');
  assert.equal(reloads[1][0], 'contexto.php?fragment=sidebar');
  assert.equal(reloads[1][2], 'sidebar-roles');
  assert.equal(reloads[2][0], 'contexto.php?fragment=sidebar&mode=mobile');
  assert.equal(reloads[2][2], 'mobile-sidebar-roles');
});
