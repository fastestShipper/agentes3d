"""FastAPI bridge para agentes3d.

Endpoints:
  GET  /agents                     listar agentes (estado real desde systemd + directorio de agentes)
  GET  /agents/{id}                 detalle
  GET  /agents/{id}/messages        historial (archivo local por agente)
  POST /agents/{id}/chat            envía mensaje (guarda historial + stub respuesta)
  POST /agents                      crear agente nuevo (clonar agente0 template)
  DELETE /agents/{id}               eliminar agente
  GET  /health                      ping
"""
from __future__ import annotations
import asyncio
import json
import os
import re
import shutil
import subprocess
import time
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from hermes_reader import (
    AGENTES_ROOT,
    SYSTEMD_PREFIX,
    list_hermes_agents,
    send_message_to_hermes,
)

AGENTES3D_DATA = Path(os.path.expanduser(os.environ.get("AGENTES3D_DATA", "~/.agentes3d")))
AGENTES3D_DATA.mkdir(parents=True, exist_ok=True)

TEMPLATE_DIR = Path(os.path.expanduser(os.environ.get("AGENTES3D_TEMPLATE", "~/agentes/agente0")))

HERMES_EXEC = os.environ.get("HERMES_EXEC", "hermes gateway run --replace")

app = FastAPI(title="agentes3d-bridge", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- schemas ---------------------------------------------------------------

class AgentOut(BaseModel):
    id: str
    name: str
    role: str
    status: str
    model: Optional[str] = None
    home_dir: Optional[str] = None
    systemd_unit: Optional[str] = None
    last_activity: Optional[str] = None


class MessageOut(BaseModel):
    id: str
    agent_id: str
    from_: str = Field(alias="from")
    text: str
    ts: int

    class Config:
        populate_by_name = True


class ChatIn(BaseModel):
    text: str


class CreateAgentIn(BaseModel):
    name: str
    role: str
    instructions: str = ""
    model: Optional[str] = None


# --- helpers ---------------------------------------------------------------

def _slug(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or f"agent-{uuid.uuid4().hex[:6]}"


def _messages_file(agent_id: str) -> Path:
    return AGENTES3D_DATA / f"messages-{agent_id}.jsonl"


def _load_messages(agent_id: str) -> list[dict]:
    path = _messages_file(agent_id)
    if not path.exists():
        return []
    out: list[dict] = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except Exception:
            continue
    return out


def _append_message(agent_id: str, msg: dict) -> None:
    path = _messages_file(agent_id)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(msg, ensure_ascii=False) + "\n")


def _agent_to_out(a) -> AgentOut:
    return AgentOut(
        id=a.id,
        name=a.name,
        role=a.role,
        status=a.status,
        model=a.model,
        home_dir=a.home_dir,
        systemd_unit=a.systemd_unit,
        last_activity=a.last_activity,
    )


def _run(cmd: list[str]) -> tuple[int, str]:
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        return r.returncode, (r.stdout + r.stderr).strip()
    except Exception as e:
        return 1, str(e)


# --- endpoints -------------------------------------------------------------

@app.get("/health")
async def health() -> dict:
    return {"ok": True, "ts": int(time.time()), "agentes_root": str(AGENTES_ROOT)}


@app.get("/agents", response_model=list[AgentOut])
async def agents_list() -> list[AgentOut]:
    agents = await list_hermes_agents()
    return [_agent_to_out(a) for a in agents]


@app.get("/agents/{agent_id}", response_model=AgentOut)
async def agents_get(agent_id: str) -> AgentOut:
    agents = await list_hermes_agents()
    for a in agents:
        if a.id == agent_id:
            return _agent_to_out(a)
    raise HTTPException(404, f"agente {agent_id} no existe")


@app.get("/agents/{agent_id}/messages")
async def agents_messages(agent_id: str):
    msgs = _load_messages(agent_id)
    return msgs


@app.post("/agents/{agent_id}/chat")
async def agents_chat(agent_id: str, body: ChatIn):
    home = AGENTES_ROOT / agent_id
    if not home.exists():
        raise HTTPException(404, f"agente {agent_id} no existe")
    now = int(time.time() * 1000)
    user_msg = {
        "id": f"u-{now}",
        "agent_id": agent_id,
        "from": "user",
        "text": body.text,
        "ts": now,
    }
    _append_message(agent_id, user_msg)

    try:
        reply_text = await send_message_to_hermes(agent_id, body.text)
    except Exception as e:
        reply_text = f"(bridge) no pude entregar el mensaje: {e}"

    reply = {
        "id": f"a-{int(time.time()*1000)}",
        "agent_id": agent_id,
        "from": "agent",
        "text": reply_text,
        "ts": int(time.time() * 1000),
    }
    _append_message(agent_id, reply)
    return reply


@app.post("/agents", response_model=AgentOut)
async def agents_create(body: CreateAgentIn):
    slug = _slug(body.name)
    home = AGENTES_ROOT / slug
    if home.exists():
        raise HTTPException(409, f"agente {slug} ya existe")

    if TEMPLATE_DIR.exists():
        try:
            shutil.copytree(TEMPLATE_DIR, home, dirs_exist_ok=False, symlinks=True)
        except Exception as e:
            raise HTTPException(500, f"error clonando template: {e}") from e
    else:
        home.mkdir(parents=True, exist_ok=True)
        (home / ".hermes").mkdir(exist_ok=True)

    meta = {
        "created_at": int(time.time()),
        "name": body.name,
        "role": body.role,
        "instructions": body.instructions,
        "model": body.model or "",
        "source": "agentes3d",
    }
    (home / ".agentes3d.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    if body.instructions:
        (home / ".hermes" / "instructions.md").write_text(
            body.instructions, encoding="utf-8"
        )

    unit_name = f"{SYSTEMD_PREFIX}{slug}.service"
    unit_path = Path(f"/etc/systemd/system/{unit_name}")
    unit_content = f"""[Unit]
Description=Hermes Agent - {body.name}
After=network.target

[Service]
Type=simple
User=root
Environment=HERMES_HOME={home}
WorkingDirectory={home}
ExecStart={HERMES_EXEC}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"""
    try:
        unit_path.write_text(unit_content, encoding="utf-8")
        _run(["systemctl", "daemon-reload"])
        _run(["systemctl", "enable", unit_name])
    except Exception as e:
        pass

    agents = await list_hermes_agents()
    for a in agents:
        if a.id == slug:
            return _agent_to_out(a)

    return AgentOut(
        id=slug,
        name=body.name,
        role=body.role,
        status="idle",
        model=body.model,
        home_dir=str(home),
        systemd_unit=unit_name,
    )


@app.delete("/agents/{agent_id}")
async def agents_delete(agent_id: str):
    home = AGENTES_ROOT / agent_id
    if not home.exists():
        raise HTTPException(404, f"agente {agent_id} no existe")
    unit = f"{SYSTEMD_PREFIX}{agent_id}.service"
    _run(["systemctl", "stop", unit])
    _run(["systemctl", "disable", unit])
    unit_path = Path(f"/etc/systemd/system/{unit}")
    try:
        if unit_path.exists():
            unit_path.unlink()
    except Exception:
        pass
    archive = AGENTES3D_DATA / f"archived-{agent_id}-{int(time.time())}"
    try:
        shutil.move(str(home), str(archive))
    except Exception as e:
        raise HTTPException(500, f"no pude archivar: {e}") from e
    _run(["systemctl", "daemon-reload"])
    return {"ok": True, "archived_to": str(archive)}
