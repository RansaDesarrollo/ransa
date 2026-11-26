/**
 * Ayudantes JavaScript sin dependencias.
 * Reemplazan patrones de jQuery que usa la plantilla.
 */

// Búsqueda de elementos en el DOM
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => context.querySelectorAll(selector);

// Operaciones con clases CSS
const addClass = (element, className) => element.classList.add(className);
const removeClass = (element, className) => element.classList.remove(className);
const toggleClass = (element, className) => element.classList.toggle(className);
const hasClass = (element, className) => element.classList.contains(className);

// Lee o actualiza el valor de un campo (compatibilidad con jQuery)
const val = (element, value) => {
    if (typeof element === 'string') element = $(element);
    if (!element) return undefined;
    if (value !== undefined) {
        element.value = value;
        return element;
    }
    return element.value;
};

if (typeof Element !== 'undefined' && !Element.prototype.val) {
    Element.prototype.val = function(newVal) {
        if (newVal !== undefined) {
            this.value = newVal;
            return this;
        }
        return this.value;
    };
}

// Registro y eliminación de eventos
const on = (element, event, handler, options = false) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.addEventListener(event, handler, options);
    }
};

const off = (element, event, handler) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.removeEventListener(event, handler);
    }
};

// Animaciones para mostrar, ocultar y desvanecer elementos
const slideUp = (element, duration = 300) => {
    element.style.height = element.offsetHeight + 'px';
    element.style.transitionProperty = 'height, margin, padding';
    element.style.transitionDuration = duration + 'ms';
    element.offsetHeight; // trigger reflow
    element.style.overflow = 'hidden';
    element.style.height = 0;
    element.style.paddingTop = 0;
    element.style.paddingBottom = 0;
    element.style.marginTop = 0;
    element.style.marginBottom = 0;
    
    setTimeout(() => {
        element.style.display = 'none';
        element.style.removeProperty('height');
        element.style.removeProperty('padding-top');
        element.style.removeProperty('padding-bottom');
        element.style.removeProperty('margin-top');
        element.style.removeProperty('margin-bottom');
        element.style.removeProperty('overflow');
        element.style.removeProperty('transition-duration');
        element.style.removeProperty('transition-property');
    }, duration);
};

const slideDown = (element, duration = 300) => {
    element.style.removeProperty('display');
    let display = window.getComputedStyle(element).display;
    if (display === 'none') display = 'block';
    
    element.style.display = display;
    let height = element.offsetHeight;
    element.style.overflow = 'hidden';
    element.style.height = 0;
    element.style.paddingTop = 0;
    element.style.paddingBottom = 0;
    element.style.marginTop = 0;
    element.style.marginBottom = 0;
    element.offsetHeight; // trigger reflow
    element.style.boxSizing = 'border-box';
    element.style.transitionProperty = 'height, margin, padding';
    element.style.transitionDuration = duration + 'ms';
    element.style.height = height + 'px';
    element.style.removeProperty('padding-top');
    element.style.removeProperty('padding-bottom');
    element.style.removeProperty('margin-top');
    element.style.removeProperty('margin-bottom');
    
    setTimeout(() => {
        element.style.removeProperty('height');
        element.style.removeProperty('overflow');
        element.style.removeProperty('transition-duration');
        element.style.removeProperty('transition-property');
    }, duration);
};

const slideToggle = (element, duration = 300) => {
    if (window.getComputedStyle(element).display === 'none') {
        slideDown(element, duration);
    } else {
        slideUp(element, duration);
    }
};

const fadeIn = (element, duration = 300) => {
    element.style.opacity = 0;
    element.style.display = 'block';
    element.style.transition = `opacity ${duration}ms`;
    
    setTimeout(() => {
        element.style.opacity = 1;
    }, 10);
    
    setTimeout(() => {
        element.style.removeProperty('transition');
    }, duration);
};

const fadeOut = (element, duration = 300) => {
    element.style.transition = `opacity ${duration}ms`;
    element.style.opacity = 0;
    
    setTimeout(() => {
        element.style.display = 'none';
        element.style.removeProperty('transition');
        element.style.removeProperty('opacity');
    }, duration);
};

const fadeToggle = (element, duration = 300) => {
    if (window.getComputedStyle(element).display === 'none') {
        fadeIn(element, duration);
    } else {
        fadeOut(element, duration);
    }
};

// Ejecuta una función cuando el DOM está listo
const ready = (callback) => {
    if (document.readyState !== 'loading') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
};

// Ayudantes generales para elementos del DOM
const hide = (element) => element.style.display = 'none';
const show = (element) => element.style.removeProperty('display');

const siblings = (element) => {
    return Array.from(element.parentNode.children).filter(child => child !== element);
};

const closest = (element, selector) => {
    return element.closest(selector);
};

const find = (element, selector) => {
    return element.querySelector(selector);
};

const findAll = (element, selector) => {
    return element.querySelectorAll(selector);
};

// Expone los ayudantes para que los scripts clásicos puedan usarlos.
window.$ = $;
window.$$ = $$;
window.addClass = addClass;
window.removeClass = removeClass;
window.toggleClass = toggleClass;
window.hasClass = hasClass;
window.on = on;
window.off = off;
window.slideUp = slideUp;
window.slideDown = slideDown;
window.slideToggle = slideToggle;
window.fadeIn = fadeIn;
window.fadeOut = fadeOut;
window.fadeToggle = fadeToggle;
window.ready = ready;
window.hide = hide;
window.show = show;
window.siblings = siblings;
window.closest = closest;
window.find = find;
window.findAll = findAll;
window.val = val;

// Permite reutilizar estos ayudantes desde pruebas o módulos CommonJS.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        $, $$, addClass, removeClass, toggleClass, hasClass, val,
        on, off, slideUp, slideDown, slideToggle,
        fadeIn, fadeOut, fadeToggle, ready,
        hide, show, siblings, closest, find, findAll
    };
}