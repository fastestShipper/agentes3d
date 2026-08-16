# agentes3d 🏢🤖

**Oficina 3D donde tus agentes de IA son personajes y tus labs son salas.**

Un POC que convierte el estado real de un conjunto de agentes autónomos en un
espacio 3D navegable: cada agente aparece como un personaje con su estado
(activo/idle), sus labs como salas, y se puede chatear con ellos desde la
oficina.

> No inventa un orquestador nuevo: **visualiza lo que ya tienes.**

## Stack

- **Frontend:** Next.js + React 19 + Tailwind v4 + React Three Fiber + Zustand
- **Bridge:** FastAPI + Python (lee el estado real de los agentes: systemd,
  directorios de agentes, logs, última interacción)

## Arquitectura

```
agentes3d/
├── web/       Frontend — la oficina 3D
└── bridge/    API que conecta con el estado real de los agentes
```

- `web/` hace rewrites de `/api/bridge/*` → `http://127.0.0.1:8700`
- El bridge es configurable por entorno (`AGENTES_ROOT`, `AGENTES3D_DATA`,
  `AGENTES3D_TEMPLATE`, `HERMES_EXEC`) — apunta a tu propio stack de agentes

## Qué muestra

- Cada agente como personaje 3D con estado real (activo/idle según systemd)
- Labs (Poker, Design, Content, Trading, ...) como salas de la oficina
- Logs recientes, crons activos, última interacción
- Chat directo con un agente (passthrough al backend)

## Correr localmente

```bash
# bridge (API)
cd bridge && pip install -r requirements.txt
uvicorn main:app --port 8700

# web
cd web && npm install && npm run dev
# abre http://localhost:3000
```

## Concepto

POC de abril 2026: la capa de "oficina virtual" para operar y observar un
conjunto de agentes de IA — la visualización como herramienta de operación,
no decoración.
