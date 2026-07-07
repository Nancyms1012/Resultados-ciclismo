# 🚴 Resultados de Ciclismo

Pagina web para publicar resultados de competencias de ciclismo en tiempo real. Los participantes pueden buscar por dorsal, nombre, categoria o evento.

## 🌐 Ver la pagina en vivo

Una vez activado GitHub Pages, tu pagina estara disponible en:

**https://nancyms1012.github.io/Resultados-ciclismo/**

---

## 🚀 Como activar la pagina (solo la primera vez)

1. Ve a tu repositorio en GitHub: https://github.com/Nancyms1012/Resultados-ciclismo
2. Haz clic en **Settings** (Configuracion)
3. En el menu izquierdo, busca **Pages**
4. En "Source" selecciona **Deploy from a branch**
5. En "Branch" selecciona **main** y la carpeta **/ (root)**
6. Haz clic en **Save**
7. Espera 1-2 minutos y tu pagina estara en linea

---

## 📋 Como subir resultados de una competencia

### Opcion 1: Usando el Panel de Administracion (Recomendado)

1. Abre tu pagina web y ve a la seccion **Admin**
2. Llena la informacion del evento (nombre, fecha, lugar)
3. Puedes:
   - **Subir un archivo CSV** con todos los resultados
   - **Agregar corredores uno por uno** conforme van llegando
4. Una vez que tengas todos los datos, haz clic en **Copiar JSON**
5. Ve a GitHub > tu repositorio > carpeta `data` > archivo `resultados.json`
6. Haz clic en el icono de lapiz (editar)
7. Borra todo el contenido y pega lo que copiaste
8. Haz clic en **Commit changes** (abajo de la pagina)
9. Los resultados se actualizaran en 1-2 minutos

### Opcion 2: Editar directamente en GitHub

1. Ve a https://github.com/Nancyms1012/Resultados-ciclismo/blob/main/data/resultados.json
2. Haz clic en el icono de lapiz para editar
3. Modifica los datos siguiendo el formato JSON
4. Haz clic en **Commit changes**

### Opcion 3: Usar el archivo CSV

1. Descarga la plantilla desde el panel Admin
2. Llena los datos en Excel o Google Sheets
3. Guarda como CSV
4. Sube el CSV en el panel Admin
5. Copia el JSON generado y actualizalo en GitHub

---

## 📄 Formato del archivo de resultados

El archivo `data/resultados.json` tiene esta estructura:

```json
{
    "evento": {
        "nombre": "Nombre de tu competencia",
        "fecha": "15 de Diciembre 2024",
        "lugar": "Ciudad",
        "distancia": "80 km",
        "organizador": "Tu organizacion"
    },
    "resultados": [
        {
            "posicion": 1,
            "dorsal": 101,
            "nombre": "Carlos Martinez",
            "categoria": "Elite Varonil",
            "evento": "80 km",
            "tiempo": "02:15:32",
            "diferencia": "-"
        },
        {
            "posicion": 2,
            "dorsal": 115,
            "nombre": "Miguel Rodriguez",
            "categoria": "Elite Varonil",
            "evento": "80 km",
            "tiempo": "02:16:45",
            "diferencia": "+01:13"
        }
    ]
}
```

### Campos de cada corredor:

| Campo | Descripcion | Ejemplo |
|-------|-------------|---------|
| posicion | Lugar en el que llego | 1, 2, 3... |
| dorsal | Numero de dorsal | 101 |
| nombre | Nombre completo | Carlos Martinez |
| categoria | Categoria de competencia | Elite Varonil, Master 30, Juvenil |
| evento | Distancia o modalidad | 80 km, 40 km |
| tiempo | Tiempo oficial | 02:15:32 |
| diferencia | Diferencia con el 1er lugar | +01:13 (usar "-" para el primero) |

---

## 📄 Formato del archivo CSV

Si prefieres usar CSV, el formato es:

```
posicion,dorsal,nombre,categoria,evento,tiempo,diferencia
1,101,Carlos Martinez,Elite Varonil,80 km,02:15:32,-
2,115,Miguel Rodriguez,Elite Varonil,80 km,02:16:45,+01:13
3,205,Ana Ramirez,Elite Femenil,80 km,02:25:40,+10:08
```

---

## 🔄 Actualizar resultados durante la competencia

Para ir actualizando conforme van llegando los corredores:

1. Abre el panel Admin en tu celular o computadora
2. Agrega cada corredor con el formulario individual
3. Cuando tengas un grupo listo, copia el JSON
4. Actualiza el archivo en GitHub
5. Los cambios se reflejan en 1-2 minutos

**Tip:** Puedes hacer multiples actualizaciones durante el dia. Cada vez que hagas commit en GitHub, la pagina se actualiza.

---

## 🔍 Funciones de la pagina

- **Busqueda** por dorsal o nombre del corredor
- **Filtros** por categoria y evento
- **Ordenamiento** por columnas (clic en los encabezados)
- **Responsive** - se ve bien en celular y computadora
- **Actualizacion** - boton para recargar resultados

---

## 📁 Estructura del proyecto

```
Resultados-ciclismo/
├── index.html          ← Pagina principal (resultados)
├── admin.html          ← Panel de administracion
├── css/
│   └── styles.css      ← Estilos visuales
├── js/
│   ├── app.js          ← Logica de busqueda y filtros
│   └── admin.js        ← Logica del panel admin
├── data/
│   └── resultados.json ← AQUI VAN LOS RESULTADOS
└── README.md           ← Este archivo
```

---

## ❓ Preguntas frecuentes

**¿Cuanto tarda en actualizarse la pagina?**
Despues de hacer commit en GitHub, los cambios se reflejan en 1-2 minutos.

**¿Puedo tener varias competencias?**
Si, simplemente cambia la informacion del evento y los resultados cada vez que tengas una nueva competencia.

**¿Se puede usar sin internet?**
No, la pagina necesita estar en linea para funcionar.

**¿Tiene costo?**
No, GitHub Pages es completamente gratuito.

---

## 🛠 Soporte

Si tienes problemas o necesitas ayuda, puedes crear un Issue en el repositorio o contactar al desarrollador.
