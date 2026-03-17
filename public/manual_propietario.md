# 📘 Manual Técnico y del Propietario - PsyReport

Este documento es tu guía maestra para ser autónomo con tu nueva plataforma premium. Guarda este manual como referencia frente a cualquier necesidad futura.

---

## 🏗️ 1. Estructura del Código (¿Dónde está cada cosa?)
El sistema se ha reescrito sobre la base **Next.js 15 (App Router)**, la mejor tecnología moderna web existente (usada por Netflix o Tik-Tok). Su estructura es extremadamente lógica:

- `src/app/`: Aquí viven todas las **Páginas de la Aplicación**. 
  - `src/app/page.tsx`: Es tu pantalla inicial (El Login de la clínica).
  - `src/app/dashboard/`: Contiene subcarpetas con el resto de pantallas. Si quieres modificar la pantalla de "Pacientes", ve a `src/app/dashboard/patients/page.tsx`.
  - `src/app/globals.css`: Tu hoja de estilos maestra. Aquí viven todos los colores de la marca y las reglas del "Dark Mode" (Modo oscuro) y el "Glassmorphism" (Efecto cristal).
- `src/components/`: Son las piezas del lego que se repiten en muchos sitios. Aquí encontrarás, por ejemplo, `Sidebar.tsx` (el menú lateral) o `Topbar.tsx` (la barra superior de búsqueda y notificaciones).
- `public/`: La carpeta de los **Archivos multimedia**. Las imágenes, logotipos y PDFs base se guardan aquí.

---

## 🎨 2. Personalizando la Plataforma (Identidad y Copywriting)

### **A. Cambiar el Logotipo**
Las imágenes públicas residen en la carpeta `public/` en la base del proyecto. 
1. Reemplaza el archivo del logo existente (o añade uno nuevo, por ejemplo `logo-nuevo.png` o `isotipo.svg`) a la carpeta `public`.
2. O bien llamas a la nueva imagen con el mimso nombre que la que usaba en código, o modificas la ruta de la imagen en los componentes como `Sidebar.tsx`.

### **B. Cambiar los Colores y la "Marca"**
1. Abre el archivo `src/app/globals.css`.
2. Al inicio verás una etiqueta:
   ```css
   @theme {
     --color-primary: #0d968b; /* Verde Turquesa Actual */
     --color-primary-dark: #0a7a70;
     ...
   }
   ```
3. Sustituye esos códigos **HEX (#0d968b)** por los colores de la marca de tu clínica. ¡Automáticamente toda la web cambiará de look! Es magia pura de Tailwind CSS.

### **C. Cambiar Textos (Ejemplo: "Buenos días, Ana👋")**
Abriendo las páginas en la carpeta `/src/app`, puedes cambiar todo lo que esté escrito entre `> <`. 
- Ve a `src/app/dashboard/page.tsx`.
- Busca las líneas de código donde pone `Buenos días, Ana 👋` y cámbialo, por la variable o el texto fijo `Hola, Master Clínico`. Guardas el archivo y tus cambios se reflejan al instante.

---

## 🚀 3. Base de Datos y Subida a Producción (El Servidor)

Tu código cliente está completo, compilado (`Exit Code 0`) y es sumamente rápido. Ahora, te explico el circuito real para mantenerlo en línea para siempre bajo máxima seguridad.

### **1. La Base de Datos (Supabase)**
Nuestro backend es [Supabase](https://supabase.com). Es increíblemente seguro frente a normativas tipo RGPD (Europa/USA) por sus filtros PostgreSQL "RLS".
1. Si no lo has hecho, regístrate en Supabase y crea un nuevo proyecto gratuíto.
2. Tras esto, te darán en los Ajustes (Settings -> API) un **Project URL** y una **API Key (anon/public)**.
3. Debes crear un archivo en la raíz del código fuente llamado `.env.local` y pegar exactamente esto dentro:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_escreta_aqui
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_escreta_aqui
   ```
4. El código utilizará estos datos ciegamente para insertar y recuperar toda tu info médica en la nube, protegido con JWT.

### **2. Desplegar el Servidor al Mundo (Vercel)**
¿Cómo publicas esta web `localhost:3000` al dominio `clinica-psyreport.com` de forma gratuita, segura y automática? Utilizando **[Vercel](https://vercel.com/)** (los propios creadores de Next.js).

1. Abre una cuenta en **GitHub.com** y vinculala a tu ordenador local con `git`. Subes tu código fuente como repositorio **Privado** (¡Nunca público, son datos médicos!).
2. Entra en **Vercel.com**, dale a `Add New Project` (Añadir nuevo proyecto), le das permiso para conectar con tu GitHub e importarás tu recién creado repositorio Privado con un click.
3. Antes del botón final de "Deploy", fíjate en la zona de "Environment Variables" (Variables de entorno). Ahí añadirás el URL y KEY de Supabase, porque nuestro querido `.env.local` nunca se sube a internet por seguridad, pero Vercel necesita las llaves.
4. Pincha en **Deploy**. Empezará a construir la aplicación. Tras unos segundos te brindará un Link mundial como `https://psyreport-algo.vercel.app`, que luego podrás adjuntar a tu propio dominio `.com`.

> Cada vez que tú modifiques alguna letra en tu ordenador visual studio code y hagas un *Commit* a tu GitHub, **Vercel volverá a compilar la app y actualizará en directo** para todos tus psicólogos los cambios sin tú tener que intervenir ni hacer nada más.

---

## 🛠️ 4. Guía de Ejecución Local para Desarrollo

Siempre que quieras testear un nuevo color, un diseño, o programar algo, te sugiero hacerlo primero localmente.

1. Abre tu terminal (ej: *PowerShell* de Windows) dentro de tu carpeta `psicologia gio/psyreport-next`.
2. Para **Arrancar el Servidor Local**:
   Escribe el comando:
   `npm run dev`
3. Minimiza la consola y abre la página `http://localhost:3000`. Ahi verás en vivo los cambios a golpe de click.

---
Si en el futuro deseas expandir tu panel, contratar a más agentes técnicos para inyectar nuevas integraciones (videollamadas nativas reales, cobros, subidas a Google Drive con OAuth, etc.), enséñales directamente la carpeta de código, ya es moderna y estándar de Mercado.

*Att: Antigravity - Tu Ingeniero en Sistemas*
