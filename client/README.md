# Frontend Vue — Inducción RR.HH.

## Rutas

| Ruta | Rol |
|------|-----|
| `/login` | Público |
| `/` · `/induccion` | Empleado |
| `/supervisor` | Supervisor (y admin) |
| `/admin/*` | Admin |

## Comandos

```bash
# Desde la raíz del proyecto (recomendado)
cd .. && npm run dev      # API + Vue → http://localhost:5173

# Solo frontend (requiere API en :3000)
npm run dev               # http://localhost:5173 (proxy API → :3000)
npm run build             # Salida: ../public/dist/
```
