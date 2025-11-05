# Codex Hotspot – Anmeldung

Dieses Beispielprojekt stellt eine moderne Login-Oberfläche mit einer SQLite-Datenbank bereit. Beim ersten Start wird automatisch ein Benutzer angelegt.

## Installation

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Anwendung starten

```bash
flask --app app run
```

Der Server steht standardmäßig unter <http://127.0.0.1:5000> zur Verfügung.

## Standard-Zugangsdaten

- Benutzername: `admin`
- Passwort: `passwort123`

Du kannst neue Benutzer hinzufügen, indem du die Datenbank `users.db` bearbeitest oder eigene Registrierungslogik ergänzt.
