# Panorama 360° ilustrado

La sección **Vista 360°** del sitio muestra una recreación ilustrada del circuito (un viñedo al atardecer con las estaciones alrededor). **No son fotografías.** El panorama se dibuja con código: una escena 3D de estilo "low-poly" hecha con [three.js](https://threejs.org) que se renderiza una sola vez y se guarda como imagen.

Esta carpeta guarda el código para poder retocarla o regenerarla. El sitio no usa nada de acá: solo usa los archivos ya generados (`LaRutadelTannat_files/recorrido-360-vinedo.webp` y `recorrido-360-poster.webp`).

## Regenerar

```bash
npm i --no-save three sharp     # solo para esto: no quedan en package.json
node scripts/panorama-360/render.js panorama size=4096 centro=315 out=panorama.png
node scripts/panorama-360/render.js vistas 315 pitch=2 fov=67 w=1280 h=720 out=vistas   # el póster: vista inicial del visor
```

Después se pasan a WebP (por ejemplo con `sharp`: calidad 82 el panorama y 80 el póster) y se copian a `LaRutadelTannat_files/`. Tarda alrededor de un minuto: Chrome dibuja con WebGL por software.

- `centro=315` deja el centro de la imagen mirando al noroeste (acimut 315°). Si se cambia, hay que cambiar también `CENTRO` en el script del visor del HTML (`initTour360`), porque de ahí salen los ángulos de los pines.
- `scene.js` explica arriba los parámetros de depuración (`?solo=…`, `?eye=…`). Los acimuts de cada lugar (Harriague 0°, Salto Chico 88°, Bertolini 180°, Mori Maglio 232°, termas 312°, sol 285°) están repetidos en `PUNTOS` del HTML: van juntos.
- Si algún día hay **fotos 360° reales** de las estaciones, se reemplaza el panorama (cualquier imagen equirrectangular 2:1) y se ajustan los acimuts de los pines; esta carpeta deja de hacer falta.

## Por qué las 6 vistas y no el cubo de three

El cubo de renderizado de three (`CubeCamera`) dibujaba mal el terreno cercano en el Chrome por software. Por eso `render.js` saca seis vistas normales de 92° (se solapan para que no se vean costuras) y hace la proyección equirrectangular por su cuenta.
