# SWES - Sistema Web de Emprendimientos Estudiantiles

Descripcion del proyecto: SWES es una plataforma web tipo mini marketplace diseñada para la promoción, gestión y búsqueda de emprendimientos y servicios ofrecidos por estudiantes de la Escuela Politécnica Nacional.

El sistema permite a los usuarios registrarse e iniciar sesión para acceder a sus funcionalidades. Una vez dentro, los estudiantes pueden publicar y administrar sus propios emprendimientos, así como explorar los servicios ofrecidos por otros usuarios.

La plataforma organiza los emprendimientos en distintas categorías, como tecnología, educación y comida, facilitando la búsqueda y navegación. De esta manera, SWES fomenta la colaboración, visibilidad y crecimiento de iniciativas estudiantiles dentro de la comunidad universitaria.

## Funcionalidades

- Registro e inicio de sesión de usuarios
- Publicación y gestión de emprendimientos
- Visualización de servicios disponibles
- Clasificación por categorías (tecnología, educación, comida)
- Navegación entre usuarios y emprendimientos
- Contacto directo con los emprendimientos a través de WhatsApp
- Comunicación rápida entre cliente y emprendedor para facilitar acuerdos y consultas
  
## Arquitectura del sistema

El sistema sigue una arquitectura cliente-servidor:

- Frontend: React + Vite
- Backend: Node.js + Express
- Base de datos: Supabase (Postgres)
- Autenticación: Supabase Auth
- Despliegue: Vercel (Serverless Functions para el Backend).
  
## Estructura
* **/docs**: Diseños y mockups.
* **/frontend**: Interfaz de usuario creada con:
  1. React + Vite: Proporciona un renderizado eficiente de componentes y una velocidad de desarrollo superior gracias al hot-reload de Vite.
  2. Tailwind CSS: Framework principal de estilos dentro del frontend.
  3. Configuración Visual: El diseño se centra en los archivos **tailwind.config.js** e **index.css**
* **/backend**: Carpeta para la lógica del servidor.
* **.gitignore**: Configurado para no subir archivos innecesarios o pesados.

## Tecnologías
* **Base de Datos**: Supabase (Postgres).
* **Autenticación**: Supabase Auth.
* **Entorno**: Node.js v24.14.1 y npm 11.11.0.
* **Desarrollo de la interfaz de usuario del sistema**: Tailwind CSS

## Endpoints
| Método | Ruta | Descripción | HU |
| :--- | :--- | :--- | :--- |
| GET | `/` | Estado del servidor | - |
| POST | `/api/register` | Registro de usuario | HUA-01 |
| POST | `/api/login` | Inicio de sesión | HUA-02 |
| GET | `/api/products` | Listar productos | HUA-04 |
| GET | `/api/products/:id` | Ver detalle del producto | HUA-06 |
| GET | `/api/products/user/:userId` | Ver todos mis productos | HUA-07 |
| POST | `/api/products` | Publicar o registrar productos | HUA-03 |
| PUT | `/api/products/:id` | Editar producto | HUA-08, HUA-10 |
| DELETE | `/api/products/:id` | Eliminar producto | HUA-09, HUA-11 |
| POST | `/api/contact` | Contactar emprendedores | HUA-12 |
| POST | `/api/auth/forgot-password` | Solicitar reseteo de contraseña | HUA-15 |

## Capturas de ejecucion de cada Enpoint

/api/register  -> METODO: POST

<img width="921" height="417" alt="image" src="https://github.com/user-attachments/assets/e29c52bd-4a61-4548-a92c-7b153bc71e54" />

/api/login   -> METODO: POST

<img width="921" height="495" alt="image" src="https://github.com/user-attachments/assets/10ee555f-0758-4f2f-b132-92741bd17f19" />

/api/products   -> METODO: GET

<img width="921" height="358" alt="image" src="https://github.com/user-attachments/assets/5ed46ff6-ab56-4836-9b6f-aec33be2df7c" />

/api/products/id   -> METODO: GET

<img width="921" height="452" alt="image" src="https://github.com/user-attachments/assets/77f412c5-dde4-474c-a983-fd7c36144715" />

/api/products/user/userid   -> METODO: GET

<img width="921" height="437" alt="image" src="https://github.com/user-attachments/assets/50514404-57d8-40a2-8ddd-c6024b255893" />

/api/products        -> METODO: POST

<img width="921" height="406" alt="image" src="https://github.com/user-attachments/assets/eb04d871-312b-40b1-9875-ba0791071fd8" />

/api/products/id    -> METODO: PUT

<img width="921" height="423" alt="image" src="https://github.com/user-attachments/assets/a6fc5d21-7cf7-4d4b-877e-5b72f0ab55e4" />

/api/products/:id    -> METODO: DELETE

<img width="921" height="399" alt="image" src="https://github.com/user-attachments/assets/ebb41b32-be41-4a2d-80fd-c0da4f96d442" />

/api/contact         -> METODO: POST

<img width="921" height="393" alt="image" src="https://github.com/user-attachments/assets/f8873b3c-4579-4ac0-994e-e9aa11b998b6" />

/api/auth/forgot-password      -> METODO: POST

<img width="921" height="382" alt="image" src="https://github.com/user-attachments/assets/552c04f0-43bb-48c4-91f1-9f56a5e42c18" />


## Variables de entorno

- Este proyecto utiliza variables de entorno para la configuración.
- El archivo `.env` no está incluido en el repositorio por seguridad.
  Ejemplo de variables necesarias (usar `backend/.env` y `frontend/.env`):
  ```env
  # Backend
  BACKEND_PORT=8000
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=sb_publishable_xxx
  SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx

  # Optional email settings for password recovery
  # Para pruebas locales sin SMTP real, usa ENABLE_DEV_EMAILS=true y deja los campos SMTP vacíos.
  # Para enviar correos reales, pon ENABLE_DEV_EMAILS=false y completa los datos SMTP.
  ENABLE_DEV_EMAILS=false
  # Gmail
  # MAIL_HOST=smtp.gmail.com
  # MAIL_PORT=587
  # MAIL_SECURE=false
  # MAIL_USER=tu-correo@gmail.com
  # MAIL_PASS=tu-app-password
  # MAIL_FROM=Tu Nombre <tu-correo@gmail.com>

  # Outlook / Microsoft 365
  # MAIL_HOST=smtp.office365.com
  # MAIL_PORT=587
  # MAIL_SECURE=false
  # MAIL_USER=tu-correo@outlook.com
  # MAIL_PASS=tu-app-password
  # MAIL_FROM=Tu Nombre <tu-correo@outlook.com>

  MAIL_HOST=smtp.example.com
  MAIL_PORT=587
  MAIL_USER=your-smtp-user@example.com
  MAIL_PASS=your-smtp-password
  MAIL_FROM=swes-noreply@yourdomain.com
  MAIL_SECURE=false
  MAIL_TLS_REJECT_UNAUTHORIZED=true
  # También puedes usar SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD y MAIL_FROM_ADDRESS.

  # Frontend (.env)
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
  VITE_BACKEND_URL=http://localhost:8000/api
 ´´´


## Pasos para la ejecucion localmente del proyecto:
1. Clona el repositorio en Visual Studio Code
2. En el proyecto abre una nueva terminal para cada carpeta:
   - Frontend
     1. Entra a la carpeta: `cd frontend`
     2. Instala todo lo necesario para el proyecto: `npm install`
     3. Ejecucion del frontend: `npm run dev`
     4. Resultado: `http://localhost:5173/ ` (puede variar según el entorno)
  - Backend
    1. Entra a la carpeta: `cd backend`
    2. Instala todo lo necesario para el proyecto: `npm install`
    3. Ejecucion del backend: `npm run dev`
     4. Resultado: Servidor corriendo en `http://localhost:8000/`

## Diseño y Mockups

Puedes visualizar el prototipo del sistema en Figma en el siguiente enlace:

https://www.figma.com/design/fNTTzkFcvX08LUIrXNV0WA/Sin-t%C3%ADtulo?node-id=0-1&t=gz4VUQkisP9iNQFS-1

Nota: El diseño presentado en Figma es una propuesta conceptual y puede sufrir modificaciones durante el desarrollo del sistema.

## Capturas del sistema

1. Registro de cuenta

   <img width="1878" height="878" alt="image" src="https://github.com/user-attachments/assets/cfd479e5-e38d-406d-a222-00ac0473c804" />


3. Inicio de sesion

   <img width="1907" height="892" alt="image" src="https://github.com/user-attachments/assets/31dab834-a489-403c-bb78-11965e949763" />


5. Autenticacion de inicio de sesion: Credenciales incorrectas

   <img width="1857" height="876" alt="image" src="https://github.com/user-attachments/assets/69cbdb64-858b-4242-a167-984e6a2c9beb" />


6. Autenticacion de registro de usuario: Validacion de correo electronico unico

  <img width="1882" height="912" alt="image" src="https://github.com/user-attachments/assets/938f1eb7-0bd5-4fef-90f8-8a2ce64ee411" />

7. Autenticacion de registro de usuario: Validacion de la contraseña con un minimo de 6 caracteres

   <img width="1763" height="842" alt="image" src="https://github.com/user-attachments/assets/a2ca2d9a-2062-4ebe-b719-6853446b3505" />


4. Base de dtos en Supabase
   <img width="1062" height="731" alt="image" src="https://github.com/user-attachments/assets/86963e05-903a-4300-86e3-330a8a6911e6" />

   <img width="1376" height="441" alt="image" src="https://github.com/user-attachments/assets/46fa3481-6c64-40a1-bb01-bbb4e7ceaff2" />



  

---

## Despliegue en Vercel

El proyecto está configurado para desplegarse de manera independiente en Vercel utilizando configuraciones optimizadas para monorepositorios.

### Backend Deployment
El backend se ejecuta sobre **Vercel Serverless Functions**. 
* **Root Directory:** `backend`
* **Framework Preset:** `Express` (u `Other`)
* **Variables de Entorno Requeridas:**
    * `SUPABASE_URL`: Enlace del proyecto de Supabase.
    * `SUPABASE_ANON_KEY`: Clave pública de Supabase.
    * `SUPABASE_SERVICE_ROLE_KEY`: Clave de servicio privada de Supabase.
    * `ENABLE_DEV_EMAILS`: Habilitación de correos de prueba (`true`).

### Frontend Deployment
El frontend está optimizado para distribuirse de forma global y cuenta con reescritura de rutas para evitar errores de recarga (404).
* **Root Directory:** `frontend`
* **Framework Preset:** `Vite`
* **Variables de Entorno Requeridas:**
    * `VITE_SUPABASE_URL`: URL del proyecto Supabase.
    * `VITE_SUPABASE_ANON_KEY`: Clave anónima de Supabase.
    * `VITE_BACKEND_URL`: URL de producción del backend en Vercel (ej. `https://tu-backend.vercel.app/api`).

---

### URL de Despliegue:
**Frontend:** https://swes-proyecto-web-mm5j.vercel.app/
https://swesvercel-1.vercel.app/


**Backend:** https://swes-proyecto-web-b8y3.vercel.app/
https://swesvercel-1-7bf6.vercel.app/

## Autores
- Nombres: Concepcion Arequipa, Camila Bueno y Leonor Yumi
- Institución: Escuela Politécnica Nacional




   
