# agentes3d

Oficina 3D que muestra tus agentes Hermes reales y tus Labs como personajes y salas. Lee estado directo de systemd + /root/agentes/*/ + logs.

No inventa orquestador nuevo. Solo visualiza lo que ya tienes.

## Stack
- **Frontend:** Next.js 16, React 19, Tailwind v4, React Three Fiber, Zustand
- **Bridge:** FastAPI + Python 3.11
- **Deploy:** systemd + nginx + Let's Encrypt

## Estructura
```
agentes3d/
├── web/       Frontend Next.js
├── bridge/    FastAPI que lee Hermes + systemd
└── deploy/    Scripts deploy al VPS
```

## Qué muestra
- Cada Hermes agent (Ainstein, T-Cher, Carlitos) como personaje 3D
- Estado real: activo/idle según `systemctl is-active`
- Labs (Poker, Design, Content, Trading, Secret) como salas
- Logs recientes, crons activos, última interacción Telegram
- Chat directo con un agent (passthrough al backend)

## URL
https://agente.gambolsoft.com/ (VPS Principal)
