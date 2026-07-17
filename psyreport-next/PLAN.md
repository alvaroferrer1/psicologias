# Plan: i18n real es/en + mejoras de configuración y UI

## Contexto
La web está hardcodeada en español en ~60 archivos. El idioma solo se guarda en `ui-store` (localStorage) vía `setUiPrefs({language})` pero **nunca se aplica** a ninguna traducción. El usuario quiere:
1. Traducción real es/en en **toda** la app (siempre español por defecto, cambiable por usuario).
2. Mejorar visualmente la pantalla de pacientes (mismo azul primario).
3. Arreglar FAQ en dark mode.
4. Todos los toggles de configuración funcionando de verdad (preferencias + notificaciones).
5. Idioma limitado a es/en (quitar ca/gl del selector).

## Enfoque i18n (ligero, sin librería externa)
Crear un diccionario tipado y un hook cliente para evitar refactor masivo:
- `src/lib/i18n/es.ts` y `src/lib/i18n/en.ts`: diccionarios con claves planas (ej. `nav.patients`, `patients.add`, `settings.title`).
- `src/lib/i18n/index.ts`: `type Lang`, `LANGS` (solo es/en), `getDictionary(lang)`, `defaultLang = "es"`.
- `src/lib/i18n/useT.ts`: hook `useT()` que lee el lang desde `ui-store` (`getLang`/`useUiPrefs`) y devuelve `t(key, vars?)`. Las claves faltantes en en caen a es (y a la propia clave como fallback visible).
- Aplicar `LangProvider`/atributo `lang` en `<html>` según selección (actualizar `layout.tsx` para cambiar `lang="es"`→`es|en` vía script + store).

Aplicación por prioridad (todas las páginas/componentses del dashboard + públicas):
- Núcleo: `layout.tsx`, `Sidebar`, `Topbar`, `dashboard/settings/page`, `PlatformPreferences`, `NotificationSettings`, `AccountForm`, `SettingsForm`.
- Pantallas: `dashboard/page`, `patients/page` (+ mejoras visuales), `patients/[id]`, `patients/[id]/history`, `history/page`, `history/[id]`, `calendar`, `new-report`, `new-report/editor`, `search`, `consents`, `team`, `trash`, `audit`, `video`, `sessions`, `legal`, `db-guide`.
- Públicas: `faq` (dark mode), `privacy`, `cookies`, `lock`, `reset-password`, `AuthPageClient`.

## Toggles funcionales (efecto real)
Estado ya existe en `ui-store`/`user`. Añadir efectos visibles:
- `compactMode`: clase `compact-mode` en el wrapper del dashboard (`layout.tsx`) → CSS en `globals.css` reduce paddings/espaciados de listados y tarjetas.
- `privacyMode`: ya añade `privacy-sensitive`; asegurar que `globals.css` difumina datos sensibles y los revela en `:hover` (className `privacy-mask`).
- `groupHistory`: aplicar agrupación real en `history/page` y `patients/[id]/history` leyendo `useUiPrefs().groupHistory`.
- `soundReminders`: ya usado en `NotificationSettings`/`ReminderWatcher`; verificar que el toggle de `PlatformPreferences` también lo refleja (unificar fuente de verdad en `ui-store`).
- Sincronizar `PlatformPreferences` y `NotificationSettings` para que ambos lean/escriban el mismo `soundReminders` y `remindersEnabled`.

## Pantalla de pacientes (mejora visual, mismo azul)
- En `patients/page.tsx`: tarjetas con mejor jerarquía, hover más pulido, avatar con iniciales, badges de tipo/estado con colores del sistema, botones consistentes con `btn-primary`, feedback de búsqueda/filtros vacíos, y respeto de `compactMode`. Sin cambiar la paleta (azul primario).

## FAQ dark mode
- En `faq/page.tsx`: los textos ya usan `dark:`, pero el problema es que hereda colores fijos. Ajustar contenedores/respuestas para usar tokens (`text-secondary-text`, `bg-[var(--color-secondary-card)]`) y asegurar contraste en dark. Revisar `globals.css` para que `dark` esté disponible en rutas públicas (ya hay ThemeProvider).

## Seguridad
- El idioma viene de `localStorage`/selectores controlados (valores cerrados es|en) → sin riesgo de inyección. No introducir `dangerouslySetInnerHTML` con contenido de usuario. Validar `lang` a `"es"|"en"` en `ui-store` (ya hace coerción).

## Pasos
1. Crear `src/lib/i18n/{es,en,index,useT}.ts`.
2. Unificar `ui-store` (lang es/en) y selector de idioma.
3. Aplicar `useT()` en componentes core + layout html lang.
4. Implementar efectos de toggles en `globals.css` + `dashboard/layout.tsx` + historial.
5. Mejorar `patients/page.tsx`.
6. Corregir `faq` dark mode.
7. Recorrer el resto de páginas aplicando `useT()`.
8. `npm run build` / lint para validar.

## Verificación
- `npm run lint` y `npm run build` en `psyreport-next`.
- Comprobar manualmente: cambiar idioma a EN aplica textos; toggles compacto/privacidad/agrupar/sonido tienen efecto visible; FAQ legible en dark; pacientes con aspecto pulido.
