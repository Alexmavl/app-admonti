# 💱 Banguat Exchange — Tipo de Cambio en Tiempo Real

Aplicación web que consume el **servicio web SOAP** del Banco de Guatemala (Banguat) para consultar tipos de cambio de moneda extranjera en tiempo real.

🌐 **Ver tarea desplegada:** [https://app-admonti.vercel.app/](https://app-admonti.vercel.app/)

---

## 📋 Información del Proyecto

| Campo | Detalle |
|---|---|
| **Universidad** | Universidad Mariano Gálvez de Guatemala (UMG) |
| **Sede** | Chiquimulilla, Santa Rosa |
| **Facultad** | Ingeniería en Sistemas |
| **Curso** | Administración de Tecnologías de Información |
| **Semestre** | 9no Semestre — 2026 |

### 👥 Integrantes

| Nombre | Carnet |
|---|---|
| Marvin Alexander Vásquez López | 1790-22-12802 |
| Teddy Leonardo Hernández Pérez | 1790-22-2563 |
| Wilson Eduardo Hernández López | 1790-22-7315 |
| Guillermo José Gómez Aguilera | 1790-22-16429 |

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Versión | Descripción |
|---|---|---|
| **React** | 19.x | Biblioteca para construir interfaces de usuario reactivas |
| **TypeScript** | 5.9 | Superset de JavaScript con tipado estático |
| **Vite** | 8.x | Bundler y servidor de desarrollo ultrarrápido |
| **CSS3** | — | Estilos personalizados con variables CSS, gradientes y animaciones |
| **SOAP 1.2** | — | Protocolo de comunicación para consumir el servicio web del Banguat |
| **Vercel** | — | Plataforma de despliegue en la nube |

---

## 🏦 API Utilizada — Servicio Web SOAP del Banguat

**URL del servicio:** [https://www.banguat.gob.gt/variables/ws/tipocambio.asmx](https://www.banguat.gob.gt/variables/ws/tipocambio.asmx)

**WSDL:** [https://www.banguat.gob.gt/variables/ws/tipocambio.asmx?WSDL](https://www.banguat.gob.gt/variables/ws/tipocambio.asmx?WSDL)

### Protocolo SOAP

**SOAP** (Simple Object Access Protocol) es un protocolo de comunicación basado en XML que permite el intercambio de información estructurada entre sistemas. A diferencia de REST, SOAP:

- Utiliza **XML** tanto para las solicitudes como para las respuestas
- Define un contrato estricto mediante **WSDL** (Web Services Description Language)
- Envía las solicitudes mediante **HTTP POST** con un sobre (envelope) XML
- Ofrece tipado fuerte y validación mediante **XSD** (XML Schema Definition)

### Operaciones SOAP consumidas

| Operación | Descripción | Parámetros |
|---|---|---|
| `TipoCambioDia` | Devuelve el tipo de cambio del día en dólares | Ninguno |
| `TipoCambioRango` | Tipo de cambio del dólar entre dos fechas | `fechainit`, `fechafin` (dd/mm/aaaa) |
| `TipoCambioRangoMoneda` | Tipo de cambio por moneda y rango de fechas | `fechainit`, `fechafin`, `moneda` |
| `VariablesDisponibles` | Lista de monedas disponibles para consulta | Ninguno |

### Ejemplo de solicitud SOAP

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <TipoCambioDia xmlns="http://www.banguat.gob.gt/variables/ws/" />
  </soap12:Body>
</soap12:Envelope>
```

### Ejemplo de respuesta SOAP

La respuesta incluye datos como:
- **Referencia**: Tipo de cambio de referencia del día
- **Compra**: Precio al que las instituciones compran USD
- **Venta**: Precio al que las instituciones venden USD

---

## 🚀 Cómo Clonar y Ejecutar el Proyecto Localmente

### Prerrequisitos

Asegúrate de tener instalado:

- **Node.js** (versión 18 o superior) — [Descargar aquí](https://nodejs.org/)
- **Git** — [Descargar aquí](https://git-scm.com/)

Para verificar que están instalados, ejecuta en la terminal:

```bash
node --version
npm --version
git --version
```

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/Alexmavl/app-admonti.git
```

### Paso 2: Entrar al directorio del proyecto

```bash
cd app-admonti
```

### Paso 3: Instalar dependencias

```bash
npm install
```

### Paso 4: Ejecutar en modo desarrollo

```bash
npm run dev
```

### Paso 5: Abrir en el navegador

Una vez ejecutado, la terminal mostrará algo como:

```
  VITE v8.x.x  ready in XXXms

  ➜  Local:   http://localhost:5173/
```

Abre tu navegador y visita: **http://localhost:5173/**

---

## 📁 Estructura del Proyecto

```
app-admonti/
├── public/
│   └── imagen/
│       └── Umg_logotipo.png        # Logo de la UMG
├── src/
│   ├── services/
│   │   └── soapService.ts          # Servicio SOAP que consume la API del Banguat
│   ├── App.tsx                      # Componente principal de la aplicación
│   ├── App.css                      # Estilos específicos de App
│   ├── index.css                    # Sistema de diseño (variables, componentes, responsive)
│   └── main.tsx                     # Punto de entrada de React
├── index.html                       # HTML principal
├── vite.config.ts                   # Configuración de Vite (incluye proxy para desarrollo)
├── vercel.json                      # Configuración de Vercel (rewrites/proxy para producción)
├── package.json                     # Dependencias y scripts del proyecto
└── tsconfig.json                    # Configuración de TypeScript
```

### Archivos clave

- **`src/services/soapService.ts`** — Contiene toda la lógica para construir los sobres SOAP (envelopes XML), enviar las peticiones HTTP POST al servicio del Banguat, y parsear las respuestas XML.

- **`vite.config.ts`** — Configura un proxy en desarrollo para reenviar las peticiones `/api/banguat/*` hacia `banguat.gob.gt`, evitando problemas de CORS.

- **`vercel.json`** — Configura rewrites en producción (Vercel) para hacer lo mismo que el proxy de Vite pero en el servidor desplegado.

---

## ⚙️ Arquitectura y Flujo de Datos

```
┌──────────────────┐     SOAP POST (XML)     ┌────────────────────────┐
│                  │ ──────────────────────►  │                        │
│   React App      │     /api/banguat/...     │   Proxy (Vite/Vercel)  │
│   (Frontend)     │                          │                        │
│                  │ ◄──────────────────────  │                        │
└──────────────────┘     XML Response         └────────────┬───────────┘
                                                           │
                                                           │ HTTPS POST
                                                           ▼
                                              ┌────────────────────────┐
                                              │   Banguat SOAP API     │
                                              │   tipocambio.asmx      │
                                              │   banguat.gob.gt       │
                                              └────────────────────────┘
```

1. El usuario interactúa con la interfaz React
2. La app construye un **sobre SOAP** (XML) con la operación solicitada
3. La petición se envía al **proxy** (`/api/banguat/...`)
4. El proxy reenvía la petición al servicio real del **Banguat** (evitando CORS)
5. La respuesta XML se recibe y se **parsea** para extraer los datos
6. Los datos se muestran en la interfaz de usuario

### ¿Por qué se necesita un proxy?

Los navegadores bloquean peticiones directas a dominios externos por seguridad (**política CORS**). El servicio SOAP del Banguat no incluye los headers CORS necesarios, por lo que se usa un proxy intermedio:

- **En desarrollo:** Vite actúa como proxy (configurado en `vite.config.ts`)
- **En producción:** Vercel actúa como proxy (configurado en `vercel.json`)

---

## 📜 Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo con HMR |
| `npm run build` | Compila el proyecto para producción |
| `npm run preview` | Previsualiza el build de producción |
| `npm run lint` | Ejecuta ESLint para verificar el código |

---

## 🌐 Despliegue en Vercel

La tarea está desplegado automáticamente en Vercel. Cada push a la rama `main` en GitHub genera un nuevo despliegue.

**URL de producción:** [https://app-admonti.vercel.app/](https://app-admonti.vercel.app/)

