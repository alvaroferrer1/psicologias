# PsyReport / Emotiva System

Plataforma clinica construida con `Next.js 16`, `React 19` y `Prisma` para gestionar pacientes, informes, citas, auditoria, videoconsulta y expediente completo.

## Que incluye

- Autenticacion con sesiones persistentes en base de datos
- Acceso privado para profesionales autorizados
- Dashboard clinico con panel de actividad y accesos rapidos
- Gestion de pacientes con ficha completa y expediente unificado
- Historial completo por paciente con acceso a todos sus informes
- Informes versionados, borradores y exportacion a PDF / CSV / JSON
- Citas presenciales y videoconsulta con integracion Jitsi
- Auditoria persistente con busqueda y filtros
- Consentimientos, notas privadas y documentos por paciente
- Papelera clinica con restauracion de pacientes
- Endpoint de salud en `/api/health`

## Stack

- `Next.js 16.1.6`
- `React 19.2`
- `TypeScript`
- `Prisma`
- `PostgreSQL / Neon`
- `Framer Motion`
- `Lucide React`

## Estructura principal

```text
src/
  app/
    dashboard/
      patients/
      history/
      calendar/
      audit/
      settings/
      trash/
  components/
  lib/
prisma/
scripts/
```

## Arranque local

1. Instala dependencias:

```bash
npm install
```

2. Configura variables de entorno en `.env`:

```env
DATABASE_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ENABLE_SELF_REGISTRATION=false
```

3. Sincroniza Prisma:

```bash
npx prisma db push
npx prisma generate
```

4. Si necesitas datos de prueba no sensibles:

```bash
npm run seed:demo
```

5. Arranca la app:

```bash
npm run dev
```

## Scripts utiles

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run seed:admin
npm run seed:demo
```

## Seguridad

- No subas secretos reales ni archivos `.env`
- No uses datos clinicos reales en scripts, seeds o fixtures del repositorio
- Mantiene `ENABLE_SELF_REGISTRATION=false` en produccion
- Los accesos deben ser creados por administracion o mediante proceso interno controlado

## Calidad

Comprobaciones usadas durante el desarrollo:

```bash
npm run lint
npm run build
```

## Estado del proyecto

El proyecto esta preparado para seguir creciendo hacia un entorno de produccion mas serio. Los siguientes pasos recomendados son:

- roles y permisos finos
- adjuntos reales de archivos
- backups y monitorizacion
- tests end-to-end
- exportacion PDF clinica mas avanzada
