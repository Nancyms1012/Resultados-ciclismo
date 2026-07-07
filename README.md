# Resultados de Ciclismo

Pagina web para publicar resultados de competencias de ciclismo.
Los participantes pueden buscar por dorsal, nombre, categoria o evento.

## Ver la pagina en vivo

Una vez activado GitHub Pages, tu pagina estara disponible en:

**https://nancyms1012.github.io/Resultados-ciclismo/**

---

## Como activar la pagina (solo la primera vez)

1. Ve a tu repositorio en GitHub: https://github.com/Nancyms1012/Resultados-ciclismo
2. Haz clic en **Settings** (Configuracion)
3. En el menu izquierdo, busca **Pages**
4. En "Source" selecciona **Deploy from a branch**
5. En "Branch" selecciona **main** y la carpeta **/ (root)**
6. Haz clic en **Save**
7. Espera 1-2 minutos y tu pagina estara en linea

---

## Como subir resultados (SOLO CSV - super facil)

### Paso 1: Crea tu archivo CSV en Excel o Google Sheets

Crea una hoja con estas columnas:

| posicion | dorsal | nombre | categoria | evento | tiempo | diferencia |
|----------|--------|--------|-----------|--------|--------|------------|
| 1 | 101 | Carlos Martinez | Elite Varonil | 80 km | 02:15:32 | - |
| 2 | 115 | Miguel Rodriguez | Elite Varonil | 80 km | 02:16:45 | +01:13 |
| 3 | 205 | Ana Ramirez | Elite Femenil | 80 km | 02:25:40 | +10:08 |

**Importante:** La primera fila DEBE ser los encabezados (posicion, dorsal, nombre, etc.)

### Paso 2: Guarda como CSV

- En **Excel**: Archivo > Guardar como > selecciona "CSV (delimitado por comas)"
- En **Google Sheets**: Archivo > Descargar > Valores separados por coma (.csv)

### Paso 3: Sube el CSV a GitHub

1. Ve a https://github.com/Nancyms1012/Resultados-ciclismo/tree/main/data
2. Haz clic en **Add file** > **Upload files**
3. Arrastra tu archivo `resultados.csv`
4. Haz clic en **Commit changes**
5. ¡Listo! En 1-2 minutos se actualizan los resultados

**Nota:** Si ya existe un archivo `resultados.csv`, GitHub te preguntara si quieres reemplazarlo. Di que si.

---

## Como cambiar la informacion del evento

El archivo `data/evento.csv` tiene la informacion del evento. Editalo directamente en GitHub:

1. Ve a https://github.com/Nancyms1012/Resultados-ciclismo/blob/main/data/evento.csv
2. Haz clic en el lapiz (editar)
3. Cambia los datos:

```
nombre,Gran Fondo Ciclista 2024
fecha,15 de Diciembre 2024
lugar,Ciudad de Mexico
distancia,80 km
organizador,Tu Organizacion
```

4. Haz clic en **Commit changes**

---

## Nombres de columnas aceptados

El sistema es flexible y acepta diferentes nombres de columnas:

| Columna | Nombres aceptados |
|---------|-------------------|
| Posicion | posicion, pos, lugar, position, place, # |
| Dorsal | dorsal, numero, num, bib, number, no |
| Nombre | nombre, name, corredor, ciclista, rider, atleta |
| Categoria | categoria, cat, category, grupo, group |
| Evento | evento, event, distancia, distance, modalidad, ruta |
| Tiempo | tiempo, time, hora, crono, finish |
| Diferencia | diferencia, dif, diff, gap, delta |

Esto significa que si tu cronometro exporta un CSV con columnas en ingles, tambien funcionara.

---

## Actualizar resultados durante la competencia

Para ir subiendo resultados conforme van llegando los corredores:

1. Llena tu Excel/Sheets con los corredores que ya llegaron
2. Guarda como CSV
3. Sube a GitHub (reemplazando el anterior)
4. Repite cada vez que quieras actualizar

**Tip:** Puedes hacer muchas actualizaciones al dia. Cada vez que subas un nuevo CSV, la pagina se actualiza en 1-2 minutos.

---

## Funciones de la pagina

- **Busqueda** por dorsal o nombre del corredor
- **Filtros** por categoria y evento
- **Ordenamiento** por columnas (clic en los encabezados)
- **Responsive** - se ve bien en celular y computadora
- **Actualizacion** - boton para recargar resultados sin refrescar toda la pagina

---

## Estructura del proyecto

```
Resultados-ciclismo/
├── index.html              ← Pagina principal (resultados)
├── admin.html              ← Panel de ayuda
├── css/
│   └── styles.css          ← Estilos visuales
├── js/
│   ├── app.js              ← Lee el CSV y muestra resultados
│   └── admin.js            ← Logica del panel admin
├── data/
│   ├── resultados.csv      ← ** AQUI SUBES TUS RESULTADOS **
│   └── evento.csv          ← Informacion del evento
└── README.md               ← Este archivo
```

---

## Preguntas frecuentes

**¿Puedo usar Excel directamente?**
No directamente, pero puedes guardar tu Excel como CSV (Guardar como > CSV) y subir ese archivo.

**¿Cuanto tarda en actualizarse?**
1-2 minutos despues de subir el archivo a GitHub.

**¿Puedo tener varias competencias?**
Si, simplemente reemplaza el CSV cada vez que tengas una nueva competencia.

**¿Tiene costo?**
No, GitHub Pages es completamente gratuito.

**¿Que pasa si me equivoco en el CSV?**
Simplemente sube uno nuevo y reemplazara el anterior.
