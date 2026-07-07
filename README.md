# Resultados de Ciclismo

Pagina web para publicar resultados de competencias de ciclismo.
Los participantes pueden buscar por dorsal, nombre, categoria o equipo.

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

## Como subir resultados

### El archivo que te manda la empresa de chips funciona directamente

La pagina lee el formato que exportan las empresas de cronometraje por chip:

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

**No necesitas modificar nada.** Solo sube el archivo tal cual te lo mandan.

### Pasos para subir:

1. Guarda el archivo que te manda la empresa como **resultados.csv**
2. Ve a https://github.com/Nancyms1012/Resultados-ciclismo/tree/main/data
3. Haz clic en **Add file** > **Upload files**
4. Arrastra tu archivo `resultados.csv`
5. Haz clic en **Commit changes**
6. En 1-2 minutos la pagina se actualiza automaticamente

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

## Que reconoce la pagina automaticamente

- **Categorias como secciones:** El nombre de la categoria aparece solo en una linea antes de los datos
- **Separadores:** Acepta tabulaciones (tabs) o comas
- **Encabezados flexibles:** Pos/Posicion, Numero/Dorsal, Nombre/Nombre Participante, Equipo/Team, Tiempo/Time
- **Diferencias:** Se calculan automaticamente (diferencia con el primer lugar de cada categoria)

---

## Actualizar resultados durante la competencia

Para ir subiendo conforme van llegando los corredores:

1. La empresa de chips te manda actualizaciones (o cortes)
2. Guarda el archivo como `resultados.csv`
3. Subelo a GitHub (reemplazando el anterior)
4. Repite cada vez que tengas un nuevo corte

**Tip:** Puedes hacer muchas actualizaciones al dia.

---

## Funciones de la pagina

- **Busqueda** por dorsal o nombre del corredor
- **Filtros** por categoria y equipo
- **Ordenamiento** por columnas (clic en los encabezados)
- **Responsive** - se ve bien en celular y computadora
- **Diferencias** calculadas automaticamente
- **Actualizacion** - boton para recargar sin refrescar toda la pagina

---

## Estructura del proyecto

```
Resultados-ciclismo/
├── index.html              ← Pagina principal (resultados)
├── admin.html              ← Panel de ayuda
├── css/
│   └── styles.css          ← Estilos visuales
├── js/
│   ├── app.js              ← Lee el archivo de chips y muestra resultados
│   └── admin.js            ← Logica del panel admin
├── data/
│   ├── resultados.csv      ← ** AQUI SUBES EL ARCHIVO DE LA EMPRESA **
│   └── evento.csv          ← Informacion del evento
└── README.md               ← Este archivo
```

---

## Preguntas frecuentes

**¿Tengo que modificar el archivo que me manda la empresa?**
No. Solo guardalo como `resultados.csv` y subelo tal cual.

**¿Cuanto tarda en actualizarse?**
1-2 minutos despues de subir el archivo a GitHub.

**¿Puedo tener varias competencias?**
Si, simplemente reemplaza el CSV cada vez que tengas una nueva competencia.

**¿Tiene costo?**
No, GitHub Pages es completamente gratuito.

**¿Que pasa si me equivoco?**
Simplemente sube uno nuevo y reemplazara el anterior.

**¿Funciona con el formato de cualquier empresa de chips?**
Esta configurado para el formato estandar (con categorias como encabezados de seccion). Si tu empresa usa otro formato, me avisas y lo adapto.
