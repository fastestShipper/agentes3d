"""Lee estado real de los agentes Hermes del VPS.

Fuentes:
- `systemctl is-active hermes-<name>` → status
- `/root/agentes/<name>/` → home dir
- `systemctl show hermes-<name> -p ActiveEnterTimestamp` → last activity
- `.hermes/config.yaml` del agente → modelo configurado
"""
from __future__ import annotations
import asyncio
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

AGENTES_ROOT = Path(os.environ.get("AGENTES_ROOT", "/root/agentes"))
SYSTEMD_PREFIX = os.environ.get("HERMES_UNIT_PREFIX", "hermes-")


@dataclass
class HermesAgent:
    id: str
    name: str
    role: str
    status: str  # "active" | "idle" | "error"
    model: Optional[str]
    home_dir: str
    systemd_unit: str
    last_activity: Optional[str]


async def _run(cmd: list[str]) -> tuple[int, str]:
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    out, err = await proc.communicate()
    return proc.returncode or 0, (out.decode("utf-8", "replace") + err.decode("utf-8", "replace")).strip()


async def _systemctl_status(unit: str) -> str:
    rc, out = await _run(["systemctl", "is-active", unit])
    if rc == 0 and "active" in out:
        return "active"
    if "inactive" in out or "dead" in out:
        return "idle"
    if "failed" in out:
        return "error"
    return "idle"


async def _systemctl_show(unit: str, prop: str) -> str:
    rc, out = await _run(["systemctl", "show", unit, "-p", prop, "--value"])
    return out.strip() if rc == 0 else ""


def _read_config(home: Path) -> dict:
    cfg_path = home / ".hermes" / "config.yaml"
    if not cfg_path.exists():
        return {}
    try:
        text = cfg_path.read_text(encoding="utf-8")
    except Exception:
        return {}
    out = {}
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("default:") and "model" not in out:
            out["model"] = s.split(":", 1)[1].strip().strip('"').strip("'")
    return out


def _role_guess(name: str) -> str:
    mapping = {
        "ainstein": "Agencia digital",
        "ainstein-v2": "Agencia digital",
        "tcher": "Educación",
        "t-cher": "Educación",
        "t-cher-v2": "Educación",
        "carlitos": "Investigación y periodismo",
        "agente0": "Hermes base",
        "hermes": "Orquestador",
    }
    return mapping.get(name.lower(), "Agente")


IGNORED_DIRS = {"archived", "backups", ".git", "__pycache__"}


async def _list_hermes_units() -> list[str]:
    rc, out = await _run(
        ["systemctl", "list-units", "--type=service", "--all", "--no-legend", "--plain"]
    )
    if rc != 0:
        return []
    units: list[str] = []
    for line in out.splitlines():
        parts = line.strip().split()
        if not parts:
            continue
        unit = parts[0]
        if unit.startswith(SYSTEMD_PREFIX) and unit.endswith(".service"):
            units.append(unit)
    return units


async def _dir_to_unit_map() -> dict[str, str]:
    units = await _list_hermes_units()
    mapping: dict[str, str] = {}
    for unit in units:
        wd = await _systemctl_show(unit, "WorkingDirectory")
        if wd:
            mapping[Path(wd).name] = unit
    return mapping


async def list_hermes_agents() -> list[HermesAgent]:
    agents: list[HermesAgent] = []
    if not AGENTES_ROOT.exists():
        return agents
    unit_by_dir = await _dir_to_unit_map()
    for home in sorted(AGENTES_ROOT.iterdir()):
        if not home.is_dir():
            continue
        name = home.name
        if name in IGNORED_DIRS or name.startswith("."):
            continue
        unit = unit_by_dir.get(name, f"{SYSTEMD_PREFIX}{name}.service")
        status_task = _systemctl_status(unit)
        enter_task = _systemctl_show(unit, "ActiveEnterTimestamp")
        status, enter_ts = await asyncio.gather(status_task, enter_task)
        cfg = _read_config(home)
        agents.append(
            HermesAgent(
                id=name,
                name=_display_name(name),
                role=_role_guess(name),
                status=status,
                model=cfg.get("model"),
                home_dir=str(home),
                systemd_unit=unit,
                last_activity=enter_ts or None,
            )
        )
    return agents


def _display_name(slug: str) -> str:
    parts = slug.replace("_", "-").split("-")
    return " ".join(p.capitalize() if p and p[0].isalpha() else p for p in parts)


# ---------------------------------------------------------------------------
# Chat passthrough (stub): hasta montar bridge real con Hermes CLI,
# responde con un "eco explicativo" que deja claro que el canal está vivo
# pero el puente real requiere config adicional.
# ---------------------------------------------------------------------------

async def send_message_to_hermes(agent_id: str, text: str) -> str:
    home = AGENTES_ROOT / agent_id
    if not home.exists():
        raise FileNotFoundError(f"Agente {agent_id} no existe en {AGENTES_ROOT}")
    # Puente mínimo: registrar el mensaje en inbox.jsonl del agente.
    # Hermes real se engancha después leyendo este inbox o vía webhook/CLI.
    inbox = home / "agentes3d-inbox.jsonl"
    line = f'{{"ts":{int(time.time())},"from":"agentes3d","text":{text!r}}}\n'
    try:
        with open(inbox, "a", encoding="utf-8") as f:
            f.write(line)
    except Exception as e:
        raise RuntimeError(f"No pude escribir inbox: {e}") from e
    return (
        f"Mensaje entregado al inbox de {agent_id}.\n"
        f"(Puente Hermes CLI pendiente de conectar. El inbox queda en {inbox}.)"
    )
