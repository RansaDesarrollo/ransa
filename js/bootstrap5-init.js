/**
 * Inicialización de componentes de Bootstrap 5 que no se activan solos.
 *
 * Modales, menús, pestañas, paneles, alertas y carruseles se activan con sus
 * atributos data-bs. Los tooltips y popovers requieren inicialización explícita.
 */

ready(() => {
  $$('[data-bs-toggle="tooltip"]').forEach((el) => new bootstrap.Tooltip(el));
  $$('[data-bs-toggle="popover"]').forEach((el) => new bootstrap.Popover(el));
});
