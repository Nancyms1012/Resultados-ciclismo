# Resultados de Ciclismo

Pagina web para publicar resultados de competencias de ciclismo.
Soporta multiples eventos en la misma competencia.
Los participantes pueden buscar por dorsal, nombre, categoria o evento.

## Ver la pagina en vivo

**https://nancyms1012.github.io/Resultados-ciclismo/**

---

## Como activar la pagina (solo la primera vez)

1. Ve a tu repositorio: https://github.com/Nancyms1012/Resultados-ciclismo
2. **Settings** > **Pages**
3. Branch: **main** / carpeta: **/ (root)**
4. **Save**
5. En 1-2 minutos estara en linea

---

## Como subir resultados

### Cuando tienes UN solo evento:

1. Guarda el archivo de la empresa de chips como **`resultados.csv`**
2. Subelo a https://github.com/Nancyms1012/Resultados-ciclismo/upload/main/data
3. ¡Listo!

### Cuando tienes DOS o MAS eventos (como este domingo):

Necesitas hacer dos cosas:

#### 1. Sube un archivo CSV por cada evento

Por ejemplo:
- `resultados_mtb60k.csv` (archivo de chips del evento 1)
- `resultados_ruta100k.csv` (archivo de chips del evento 2)

Subelos a: https://github.com/Nancyms1012/Resultados-ciclismo/upload/main/data

#### 2. Edita el archivo `eventos.csv` para decirle a la pagina cuales son

Ve a https://github.com/Nancyms1012/Resultados-ciclismo/blob/main/data/eventos.csv y editalo asi:

```
archivo,evento
resultados_mtb60k.csv,MTB 60K
resultados_ruta100k.csv,Ruta 100K
```

Donde:
- **archivo** = nombre exacto del archivo que subiste
- **evento** = nombre que quieres que aparezca en la pagina

¡Eso es todo! La pagina mostrara un filtro para elegir entre los eventos.

---

## Formato del archivo de chips

La pagina lee directamente el formato que mandan las empresas de cronometraje:

```
EXPERTOS MASCULINO
Pos	Numero	Nombre Participante	Equipo	Tiempo
1	2009	Julian Ulloa Castro	INDEPENDIENTE	01:33:54.496
2	2002	Jack Dany Rivera Castro	VEINTE24 CYCLING	01:43:27.548
...

EXPERTOS A MASCULINO
Pos	Numero	Nombre Participante	Equipo	Tiempo
1	2113	Yeikol Fallas Lara	VEINTE24	01:34:17.484
...
```

**No necesitas modificar nada del archivo.** Solo guardalo como CSV y subelo.

---

## Como cambiar la informacion del evento

Edita `data/evento.csv` en GitHub:

```
nombre,Copa Ciclista 2024
fecha,13 de Julio 2025
lugar,San Jose Costa Rica
distancia,MTB 60K y Ruta 100K
organizador,Tu Organizacion
```

---

## Comportamiento inteligente

- **1 evento:** Muestra filtro por Equipo
- **2+ eventos:** Muestra filtro por Evento (MTB 60K, Ruta 100K, etc.)
- **Diferencias:** Se calculan automaticamente por categoria
- **Categorias:** Se detectan automaticamente de los encabezados del archivo

---

## Actualizar durante la competencia

1. La empresa de chips te manda un nuevo corte
2. Guardalo con el mismo nombre de archivo
3. Subelo a GitHub (reemplaza el anterior)
4. Se actualiza en 1-2 minutos

---

## Estructura de archivos

```
data/
├── evento.csv                  ← Info general (nombre, fecha, lugar)
├── eventos.csv                 ← Lista de archivos (solo si hay 2+ eventos)
├── resultados_evento1.csv      ← Archivo de chips evento 1
└── resultados_evento2.csv      ← Archivo de chips evento 2
```

Si solo tienes 1 evento, no necesitas `eventos.csv`. Solo sube `resultados.csv`.

---

## Preguntas frecuentes

**¿Tengo que modificar el archivo que me manda la empresa?**
No. Solo guardalo como CSV y subelo.

**¿Puedo subir varios archivos a la vez?**
Si, GitHub permite subir multiples archivos al mismo tiempo.

**¿Cuanto tarda en actualizarse?**
1-2 minutos.

**¿Tiene costo?**
No, GitHub Pages es gratuito.

**¿Que pasa si me equivoco?**
Solo sube el archivo correcto de nuevo.
