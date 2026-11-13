#!/usr/bin/env sh
# Copia la web real (../sitio) al prototipo C del Design Lab, adaptada al entorno de pruebas:
# noindex, rutas de imagen, WhatsApp simulado (shared/proto.js) y enlaces legales a la web pública.
# Uso, desde web/design-lab:  sh sync-c.sh
set -e
S=../sitio
C=c
for f in index.html sesiones.html testimonio.html; do
  sed -e 's|<html lang="es">|<html lang="es" data-concept="C">|' \
      -e 's|<meta charset="utf-8">|<meta charset="utf-8">\n<meta name="robots" content="noindex, nofollow">|' \
      -e 's|href="favicon.svg"|href="../favicon.svg"|' \
      -e 's|src="img/|src="../img/|g' \
      -e 's#href="\(aviso-legal\|privacidad\|cookies\)\.html"#href="https://artedeastro.com/\1.html"#g' \
      -e 's|<script src="datos.js"></script><script src="site.js"></script>|<script src="../shared/proto.js"></script><script src="datos.js"></script><script src="../shared/demo-testimonios.js"></script><script src="site.js"></script>|' \
      "$S/$f" > "$C/$f"
done
sed -e "s|'img/|'../img/|g" "$S/datos.js" > "$C/datos.js"
cp "$S/estilos.css" "$S/site.js" "$C/"
for i in "$S"/img/*.jpg; do [ -f "img/$(basename "$i")" ] || cp "$i" img/; done
echo "Prototipo C sincronizado con la web real."
