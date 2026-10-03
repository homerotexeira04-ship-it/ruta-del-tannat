#!/bin/bash
# Prepara las sesiones de Claude Code web: dependencias del sitio y Chrome para las pruebas.
# Es idempotente y no interactivo. En la computadora local no hace nada.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Tailwind (npm run build:css) y puppeteer-core (npm run smoke). npm install y no ci: aprovecha el caché del contenedor.
npm install --no-audit --no-fund --loglevel=error

# npm run smoke lee CHROME_PATH; en la nube el Chromium está en /opt/pw-browsers.
if [ -n "${CLAUDE_ENV_FILE:-}" ] && [ -x /opt/pw-browsers/chromium ] && ! grep -qs 'CHROME_PATH' "$CLAUDE_ENV_FILE"; then
  echo 'export CHROME_PATH="/opt/pw-browsers/chromium"' >> "$CLAUDE_ENV_FILE"
fi

# Deja en caché el MCP de Playwright para que la próxima sesión lo arranque al instante.
npx -y @playwright/mcp@latest --version >/dev/null 2>&1 || true
