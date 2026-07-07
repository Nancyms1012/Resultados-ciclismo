# Resultados de Ciclismo

Pagina web para publicar resultados de competencias de ciclismo.
El competidor entra, ve los logos de los eventos del dia y elige cual quiere consultar.

## Ver la pagina en vivo

**https://nancyms1012.github.io/Resultados-ciclismo/**

---

## Como activar la pagina (solo la primera vez)

1. Ve a tu repositorio: https://github.com/Nancyms1012/Resultados-ciclismo
2. **Settings** > **Pages**
3. Branch: **main** / carpeta: **/ (root)**
4. **Save**

---

## Como configurar un dia de competencia

### 1. Sube los logos de cada evento

- Sube las imagenes a la carpeta `img/` en GitHub
- Nombra los archivos como quieras (ej: `logo_endurance.png`, `logo_reto.png`)
- Formatos aceptados: PNG, JPG, SVG

### 2. Sube los archivos CSV de resultados

- Sube los archivos de la empresa de chips a la carpeta `data/`
- Nombra cada archivo como quieras (ej: `resultados_endurance.csv`, `resultados_reto.csv`)

### 3. Edita el archivo eventos.csv

Ve a `data/eventos.csv` y editalo:

```
archivo,evento,logo,descripcion
resultados_endurance.csv,Endurance,logo_endurance.png,Endurance MTB Challenge
resultados_reto.csv,Reto,logo_reto.png,Reto Ciclista 2025
```

Columnas:
- **archivo** = nombre del CSV de resultados
- **evento** = nombre que aparece en la tarjeta
- **logo** = nombre del archivo de imagen en la carpeta img/
- **descripcion** = texto adicional (opcional)

---

## Estructura de archivos

```
Resultados-ciclismo/
├── index.html              ← Pagina de seleccion de evento (logos)
├── resultados.html         ← Pagina de resultados (se abre al elegir evento)
├── css/
│   └── styles.css
├── js/
│   ├── landing.js          ← Logica de la pagina de seleccion
│   └── resultados.js       ← Logica de busqueda y filtros
├── img/
│   ├── logo_endurance.png  ← Logo evento 1
│   └── logo_reto.png       ← Logo evento 2
├── data/
│   ├── eventos.csv         ← Configuracion de eventos del dia
│   ├── evento.csv          ← Info general (nombre, fecha, lugar) - opcional
│   ├── resultados_endurance.csv  ← Archivo de chips evento 1
│   └── resultados_reto.csv       ← Archivo de chips evento 2
└── README.md
```

---

## Para cada competencia nueva

1. Sube los logos nuevos a `img/`
2. Sube los CSV de resultados a `data/`
3. Actualiza `data/eventos.csv` con los nombres correctos
4. Listo - la pagina se actualiza en 1-2 minutos

---

## Preguntas frecuentes

**¿Que tamano de logo recomiendan?**
Cuadrado o casi cuadrado, al menos 200x200 pixeles.

**¿Puedo tener mas de 2 eventos?**
Si, solo agrega mas lineas en eventos.csv.

**¿Como actualizo resultados durante la carrera?**
Reemplaza el CSV correspondiente en la carpeta data/.
