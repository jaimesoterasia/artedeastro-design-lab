# artedeastro · Design Lab

Entorno de pruebas del rediseño de artedeastro.com. **No es la web pública** y no comparte archivos con ella.

- `index.html`: laboratorio para comparar la web actual con los conceptos A, B y C, en escritorio y móvil.
- `revision.html`: propuestas con estados Aprobado / Revisar / Descartado. Las decisiones se guardan en el navegador.
- `a/`, `b/`, `c/`: prototipos (inicio y sesiones). Los botones de reserva son simulaciones.
- `actual/`: copia de la web publicada el 6 de noviembre de 2026.

Todas las páginas llevan `noindex` y `robots.txt` bloquea a los buscadores.

## Concepto C = la web real
Desde el 13 de noviembre de 2026, `c/` es una copia de la web publicada (`../sitio`) generada con `sh sync-c.sh`:
mismos archivos, con `noindex`, WhatsApp y correo simulados (`shared/proto.js`) y enlaces legales a artedeastro.com.
Para ver la sección de testimonios con contenido de ejemplo, añade `?demo` a la dirección (`c/index.html?demo#testimonios`).
