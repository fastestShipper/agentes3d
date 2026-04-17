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
import re
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

HERMES_BIN = os.environ.get(
    "HERMES_BIN", "/root/.hermes/hermes-agent/venv/bin/python"
)
HERMES_MODULE = os.environ.get("HERMES_MODULE", "hermes_cli.main")
HERMES_CHAT_TIMEOUT = int(os.environ.get("HERMES_CHAT_TIMEOUT", "180"))
AGENTES3D_STATE = Path(os.environ.get("AGENTES3D_DATA", "/root/.agentes3d"))


def _session_file(agent_id: str) -> Path:
    AGENTES3D_STATE.mkdir(parents=True, exist_ok=True)
    return AGENTES3D_STATE / f"session-{agent_id}.txt"


def _load_session(agent_id: str) -> Optional[str]:
    p = _session_file(agent_id)
    if not p.exists():
        return None
    val = p.read_text(encoding="utf-8").strip()
    return val or None


def _save_session(agent_id: str, session_id: str) -> None:
    _session_file(agent_id).write_text(session_id, encoding="utf-8")


_SESSION_ID_RE = re.compile(r"session_id:\s*([A-Za-z0-9_\-]+)")


def _strip_ansi(s: str) -> str:
    return re.sub(r"\x1b\[[0-9;]*[A-Za-z]", "", s)


def _dedupe_response(text: str) -> str:
    s = text.strip()
    n = len(s)
    if n < 60:
        return s
    # Exact half duplication (same text printed twice)
    for split in range(max(20, n // 2 - 3), min(n - 20, n // 2 + 4)):
        a = s[:split].strip()
        b = s[split:].strip()
        if a and a == b:
            return a
    # Any long prefix that reappears later verbatim
    for size in range(min(n - 20, 400), 40, -1):
        chunk = s[:size].strip()
        if not chunk:
            continue
        if s.count(chunk) >= 2:
            return chunk
    return s


def _clean_hermes_output(raw: str) -> str:
    text = _strip_ansi(raw)
    out_lines: list[str] = []
    box_prefixes = ("╭", "╰", "│", "─", "⚕")
    skip_patterns = (
        "↻ Resumed session",
        "session_id:",
        "  ┊ ",
    )
    for ln in text.splitlines():
        stripped = ln.strip()
        if not stripped:
            out_lines.append(ln)
            continue
        if any(stripped.startswith(p) for p in skip_patterns):
            continue
        if stripped.startswith(box_prefixes):
            cleaned = re.sub(r"^[│|]\s?", "", stripped).strip()
            cleaned = re.sub(r"^[╭╰─]+", "", cleaned).strip()
            if cleaned and not cleaned.startswith("⚕"):
                out_lines.append(cleaned)
            continue
        out_lines.append(ln)
    result = "\n".join(out_lines).strip()
    result = re.sub(r"\n{3,}", "\n\n", result)
    result = _dedupe_response(result)
    return result or text.strip()


async def send_message_to_hermes(agent_id: str, text: str) -> str:
    home = AGENTES_ROOT / agent_id
    if not home.exists():
        raise FileNotFoundError(f"Agente {agent_id} no existe en {AGENTES_ROOT}")
    env = os.environ.copy()
    env["HERMES_HOME"] = str(home)
    env["NO_COLOR"] = "1"
    env["TERM"] = "dumb"

    existing = _load_session(agent_id)
    cmd = [HERMES_BIN, "-m", HERMES_MODULE, "chat", "-q", text, "-Q"]
    if existing:
        cmd.extend(["--resume", existing])

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=str(home),
        env=env,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        out, err = await asyncio.wait_for(
            proc.communicate(), timeout=HERMES_CHAT_TIMEOUT
        )
    except asyncio.TimeoutError:
        try:
            proc.kill()
        except Exception:
            pass
        raise RuntimeError(f"Hermes tardó más de {HERMES_CHAT_TIMEOUT}s en responder")

    stdout = out.decode("utf-8", "replace")
    stderr = err.decode("utf-8", "replace")

    if proc.returncode and proc.returncode != 0 and not stdout.strip():
        detail = (stderr or stdout).strip().splitlines()[-5:]
        raise RuntimeError("Hermes falló: " + " | ".join(detail))

    m = _SESSION_ID_RE.search(stdout)
    if m:
        _save_session(agent_id, m.group(1))

    return _clean_hermes_output(stdout) or "(respuesta vacía)"
