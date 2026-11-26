# RANSA — panel web

## Páginas HTML y plantillas

Las 35 páginas HTML de la raíz son resultados generados; no se editan directamente.
Cada ruta tiene una plantilla de entrada en `src/pug/pages/`. El menú enlaza estas
rutas, por lo que quitarlas sin retirar también sus enlaces rompería la navegación.

Los archivos HTML de `src/pug/partials/content/` son fragmentos incluidos por esas
plantillas, no páginas independientes. Los layouts y componentes compartidos están
en `src/pug/layouts/` y `src/pug/partials/`.

Edita la fuente Pug y regenera el HTML:

```sh
npm run dev       # Vite, Sass y Pug con recarga durante el desarrollo
npm run build:pug # Genera las páginas HTML
npm test          # Ejecuta las pruebas
```

## Dónde está el JavaScript

Los scripts compartidos se incluyen desde `src/pug/partials/footer-scripts.pug`.
El orden importa: las utilidades se cargan primero, y las capas RANSA después de
la conexión con el servidor y de las reglas de negocio.

El panel PHP usa Tailwind solo para algunas utilidades de layout. Sus clases llevan
el prefijo `tw-` para distinguirlas de Bootstrap, y no se incluye el reset global
de Tailwind. La fuente está en `src/tailwind.css`; la compilación genera
`css/tailwind.css`.

| Archivo | Responsabilidad |
| --- | --- |
| `js/vanilla-utils.js` | Ayudantes DOM globales (`$`, `$$`, eventos, clases, animaciones y `ready`). |
| `js/bootstrap5-init.js` | Activa tooltips y popovers de Bootstrap. |
| `js/main-vanilla.js` | Gráficos de los dashboards y comportamiento general de la plantilla: menú, panel lateral, temas, notificaciones, buscador de comandos y tablas. |
| `js/modern-plugins.js` | Contadores animados, barras de progreso modernas y visor de imágenes. |
| `js/layers/connection.js` | Peticiones HTTP y carga de fragmentos PHP/HTML en la vista. |
| `js/layers/logic.js` | Validaciones, normalización de búsquedas y preparación de datos; no manipula el DOM. |
| `js/layers/ui.js` | Presentación y acciones para roles, asociaciones, cambio de contraseña, filtros y navegación. |
| `js/layers/auth-ui.js` | Validación visual del login, mostrar/ocultar contraseña y mensajes de retorno. |
| `js/layers/legacy-bridges.js` | Mantiene los nombres globales que usan las páginas PHP antiguas. |
| `js/layers/response-ui.js` | Procesa mensajes y solicitudes de recarga declarados por las respuestas del servidor. |
| `js/pages/login-splash.js` | Redirige la pantalla de entrada `index.php` al login. |

`legacy-bridges.js` y `response-ui.js` se cargan en `contexto.php`, no en el pie de
página común. Los comportamientos propios de un ejemplo se encuentran junto a su
contenido en archivos `src/pug/partials/content/*.scripts.html` y se incluyen desde
la plantilla correspondiente.
