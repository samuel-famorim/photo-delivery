"""
Photo Delivery — Uploader do Fotógrafo
======================================
Roda no computador do fotógrafo durante o evento.
Monitora a pasta onde o Lightroom exporta os JPGs e faz upload
automático para o backend na VPS via HTTP.

Uso:
  python uploader.py

Configuração:
  Crie um arquivo .env nesta mesma pasta (veja .env.example)
"""

import os
import sys
import time
import json
import requests
from pathlib import Path
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ============================================================
# CONFIGURAÇÃO — carrega do .env ou usa defaults
# ============================================================

def load_env():
    """Carrega .env da mesma pasta do script."""
    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ[key.strip()] = value.strip().strip('"').strip("'")


load_env()

API_URL = os.environ.get("API_URL", "https://fotos.seudominio.com.br")
API_TOKEN = os.environ.get("API_TOKEN", "")
WATCH_FOLDER = os.environ.get("WATCH_FOLDER", os.path.expandvars(r"%USERPROFILE%\Pictures\LightroomExport"))
PROCESSED_FOLDER = os.environ.get("PROCESSED_FOLDER", "")

# Cores pra terminal
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"

# ============================================================
# UPLOADER
# ============================================================

class PhotoUploader(FileSystemEventHandler):
    """Detecta novos JPGs e faz upload via HTTP."""

    def __init__(self):
        self.uploaded = 0
        self.errors = 0
        self.processing = set()  # evita upload duplicado

    def on_created(self, event):
        if event.is_directory:
            return
        path = Path(event.src_path)
        if path.suffix.lower() not in (".jpg", ".jpeg"):
            return
        if str(path) in self.processing:
            return

        self.processing.add(str(path))
        self._upload(path)

    def _upload(self, path: Path):
        """Faz upload de um arquivo com retry."""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Pequena pausa pra garantir que o Lightroom terminou de escrever
                if attempt == 0:
                    time.sleep(1.5)

                file_size = path.stat().st_size
                if file_size == 0:
                    print(f"{YELLOW}  ⚠ Arquivo vazio, aguardando...{RESET}")
                    time.sleep(2)
                    continue

                now = datetime.now().strftime("%H:%M:%S")
                print(f"{CYAN}[{now}]{RESET} Enviando: {BOLD}{path.name}{RESET} ({file_size / 1024:.0f} KB)...", end=" ", flush=True)

                with open(path, "rb") as f:
                    res = requests.post(
                        f"{API_URL}/api/v1/photos/upload",
                        files={"file": (path.name, f, "image/jpeg")},
                        headers={"Authorization": f"Bearer {API_TOKEN}"},
                        timeout=30,
                    )

                if res.status_code == 200:
                    data = res.json()
                    self.uploaded += 1
                    print(f"{GREEN}✓ OK{RESET} — {data.get('session_code', '?')} ({data.get('total_session_photos', '?')} fotos)")

                    # Move pra pasta de processados (opcional)
                    if PROCESSED_FOLDER:
                        self._move_processed(path)

                    return
                elif res.status_code == 400:
                    data = res.json()
                    print(f"{RED}✗ {data.get('detail', 'Erro')}{RESET}")
                    return
                elif res.status_code == 401:
                    print(f"{RED}✗ Token inválido. Verifique API_TOKEN no .env{RESET}")
                    return
                else:
                    print(f"{YELLOW}  Tentativa {attempt + 1}/{max_retries}: HTTP {res.status_code}{RESET}")
                    time.sleep(2)

            except requests.exceptions.ConnectionError:
                print(f"{RED}✗ Sem conexão com o servidor{RESET}")
                return
            except Exception as e:
                print(f"{RED}✗ Erro: {e}{RESET}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                else:
                    self.errors += 1
                    return

        print(f"{RED}✗ Falha após {max_retries} tentativas{RESET}")
        self.errors += 1

    def _move_processed(self, path: Path):
        """Move o arquivo pra pasta de processados."""
        try:
            dest = Path(PROCESSED_FOLDER) / path.name
            dest.parent.mkdir(parents=True, exist_ok=True)
            path.rename(dest)
        except Exception:
            pass  # falha ao mover não é crítica


# ============================================================
# MAIN
# ============================================================

def main():
    print(f"""
{BOLD}{CYAN}╔══════════════════════════════════════════════╗
║     Photo Delivery — Uploader do Fotógrafo    ║
╚══════════════════════════════════════════════╝{RESET}

{CYAN}Servidor:{RESET}  {API_URL}
{CYAN}Pasta monitorada:{RESET} {WATCH_FOLDER}
{CYAN}Token:{RESET}        {API_TOKEN[:20] + '...' if len(API_TOKEN) > 20 else 'NÃO CONFIGURADO'}

""")

    watch_path = Path(WATCH_FOLDER)
    if not watch_path.exists():
        print(f"{RED}✗ Pasta não encontrada: {WATCH_FOLDER}{RESET}")
        print(f"{YELLOW}  Crie a pasta ou configure WATCH_FOLDER no .env{RESET}")
        print(f"{YELLOW}  Exemplo de .env na pasta deste script.{RESET}")
        sys.exit(1)

    # Testa conexão
    print(f"{CYAN}Testando conexão...{RESET}", end=" ", flush=True)
    try:
        res = requests.get(f"{API_URL}/api/v1/auth/me", headers={"Authorization": f"Bearer {API_TOKEN}"}, timeout=10)
        if res.status_code == 200:
            user = res.json()
            print(f"{GREEN}✓ Conectado como {user.get('name', '?')}{RESET}")
        else:
            print(f"{RED}✗ HTTP {res.status_code} — verifique API_TOKEN{RESET}")
    except requests.exceptions.ConnectionError:
        print(f"{RED}✗ Sem conexão com {API_URL}{RESET}")
        print(f"{YELLOW}  Verifique se a VPS está online e a URL está correta.{RESET}")
        sys.exit(1)

    handler = PhotoUploader()
    observer = Observer()
    observer.schedule(handler, str(watch_path), recursive=False)
    observer.start()

    print(f"\n{GREEN}▶ Monitorando novas fotos...{RESET}")
    print(f"{YELLOW}  Exporte os JPGs do Lightroom para: {WATCH_FOLDER}{RESET}")
    print(f"{YELLOW}  Pressione Ctrl+C para parar.{RESET}\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print(f"\n\n{BOLD}Resumo:{RESET}")
        print(f"  {GREEN}✓ Enviadas: {handler.uploaded}{RESET}")
        print(f"  {RED}✗ Erros: {handler.errors}{RESET}")
        print(f"  Total: {handler.uploaded + handler.errors}")

    observer.join()


if __name__ == "__main__":
    main()
