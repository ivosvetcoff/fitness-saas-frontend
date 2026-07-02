# ⚠️ DEPRECADO — App móvil vieja (React Native / Expo)

**Este repo está oficialmente retirado desde 2026-07-02. NO editar, NO desplegar, NO usar.**

## Por qué

La auditoría general de julio 2026 confirmó que esta app está **100% rota contra el
backend actual**:

1. **Nunca envía el JWT** — desde el hardening de autenticación, todos los endpoints
   protegidos le devuelven 401 (rutinas, dashboard, fotos, logs, etc.).
2. **Llama endpoints sociales que no existen** — `/feed`, `/posts`, `/messages`
   nunca se implementaron en el backend (404 en todos).
3. `GET /student/{id}/nutrition` y otros contratos cambiaron sin que esta app
   se actualizara.

## Qué usar en su lugar

La experiencia del alumno vive en la **web app**: `https://aefitt.com/app`
(código en `fitness-saas-dashboard/src/App.jsx`). Es mobile-first y es la que
reciben todos los alumnos.

## Si alguna vez se quiere revivir

No lo recomendamos — habría que: adjuntar el `access_token` como `Authorization: Bearer`
en todas las llamadas, eliminar o implementar el módulo social, y realinear todos los
contratos contra `fitness-saas-backend/main.py`. El esfuerzo es equivalente a
reescribirla. Ver `fitness-saas-backend/AUDITORIA_GENERAL_2026-07.md` (CRIT-10).
