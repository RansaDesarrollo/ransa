import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('repeated dashboard refresh releases old charts before replacing canvases', () => {
  const instances = new Map();
  let nextChartId = 0;
  let click;
  let finishRefresh;
  const button = {
    dataset: {}, innerHTML: 'Refresh', disabled: false,
    addEventListener: (_, handler) => { click = handler; },
  };
  function card(markup) {
    let html = markup;
    const element = {
      canvas: {}, style: {},
      getBoundingClientRect: () => ({ height: 300 }),
      querySelectorAll: () => element.canvas ? [element.canvas] : [],
      get innerHTML() { return html; },
      set innerHTML(value) {
        html = value;
        element.canvas = value === markup ? {} : null;
      },
    };
    return element;
  }
  const stat = card('Stat markup');
  const primary = card('Chart markup');
  const Chart = {
    getChart: canvas => [...instances.values()].find(chart => chart.canvas === canvas),
  };
  function render(canvas) {
    const id = nextChartId++;
    instances.set(id, { canvas, destroy: () => instances.delete(id) });
  }
  const document = {
    getElementById: id => id === 'dash-refresh-btn' ? button : null,
    querySelectorAll: () => [stat],
    querySelector: () => primary,
  };
  const window = { Chart };
  const context = vm.createContext({
    window, Chart, document, ready: () => {},
    setTimeout: callback => { finishRefresh = callback; },
  });
  vm.runInContext(readFileSync(new URL('../js/main-vanilla.js', import.meta.url), 'utf8'), context);
  window.__coolReinit = () => [stat, primary].forEach(element => render(element.canvas));
  window.__coolReinit();
  // A chart outside the refreshed cards must remain alive.
  const untouched = {};
  render(untouched);
  vm.runInContext('initDashboardRefresh()', context);

  for (let i = 0; i < 3; i++) {
    click();
    assert.equal(instances.size, 1, 'Destroy refreshed charts before removing their canvases');
    assert.ok(Chart.getChart(untouched));
    assert.equal(button.disabled, true);
    finishRefresh();
    assert.equal(instances.size, 3, 'Refresh must not retain detached chart instances');
    assert.equal(button.disabled, false);
    assert.ok(Chart.getChart(stat.canvas));
    assert.ok(Chart.getChart(primary.canvas));
  }
});

test('account dropdown supports keyboard activation and updates aria-expanded', () => {
  const classes = new Set();
  const attributes = new Map();
  const listeners = new Map();
  const item = {
    classList: {
      add: name => classes.add(name),
      remove: name => classes.delete(name),
      toggle: name => classes.has(name) ? classes.delete(name) : classes.add(name),
    },
    closest: () => null,
    addEventListener: (event, handler) => {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(handler);
    },
    setAttribute: (name, value) => attributes.set(name, value),
    click: () => {
      const event = { target: item, preventDefault() {}, stopPropagation() {} };
      (listeners.get('click') || []).forEach(handler => handler(event));
    },
  };
  const bodyListeners = new Map();
  const body = {
    addEventListener: (event, handler) => bodyListeners.set(event, handler),
  };
  const document = {
    body,
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: selector => selector.includes('.js-item-menu') ? [item] : [],
  };
  const context = vm.createContext({
    window: {},
    document,
    ready: () => {},
    $: () => null,
    $$: selector => document.querySelectorAll(selector),
    on: (element, event, handler) => element.addEventListener(event, handler),
    addClass: (element, name) => element.classList.add(name),
    removeClass: (element, name) => element.classList.remove(name),
  });

  vm.runInContext(readFileSync(new URL('../js/main-vanilla.js', import.meta.url), 'utf8'), context);
  vm.runInContext('initTopbarDropdowns()', context);

  const keydown = listeners.get('keydown')[0];
  keydown({ target: item, key: 'Enter', preventDefault() {} });
  assert.equal(classes.has('show-dropdown'), true);
  assert.equal(attributes.get('aria-expanded'), 'true');

  bodyListeners.get('click')();
  assert.equal(classes.has('show-dropdown'), false);
  assert.equal(attributes.get('aria-expanded'), 'false');
});

test('sidebar submenu arrows handle clicks on refreshed menu items', () => {
  const documentListeners = new Map();
  const document = {
    addEventListener: (event, handler) => documentListeners.set(event, handler),
    getElementById: () => null,
  };
  const classes = new Set();
  const arrow = {
    classList: {
      add: name => classes.add(name),
      remove: name => classes.delete(name),
      toggle: name => classes.has(name) ? classes.delete(name) : classes.add(name),
    },
    closest: selector => selector === '.js-arrow' ? arrow : null,
    querySelector: () => null,
    parentNode: { querySelector: () => null },
  };
  const context = vm.createContext({
    window: {},
    document,
    ready: () => {},
    on: (element, event, handler) => element.addEventListener(event, handler),
    find: (element, selector) => element.querySelector(selector),
    toggleClass: (element, name) => element.classList.toggle(name),
  });

  vm.runInContext(readFileSync(new URL('../js/main-vanilla.js', import.meta.url), 'utf8'), context);
  vm.runInContext('initSubListArrows()', context);

  let prevented = false;
  documentListeners.get('click')({ target: arrow, preventDefault: () => { prevented = true; } });

  assert.equal(prevented, true);
  assert.equal(classes.has('open'), true);
});
