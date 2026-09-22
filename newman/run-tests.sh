#!/usr/bin/env bash
# Runs the DIA API Postman collection via Newman CLI.
#
# Usage:
#   ./run-tests.sh                                  # auto-picks an environment file, see below
#   ./run-tests.sh path/to/other.postman_environment.json
#
# Prerequisites:
#   npm install -g newman
#   (optional, for a nicer HTML report) npm install -g newman-reporter-htmlextra
#
# Environment file selection (with no argument):
#   1. postman/environments/DIA-Local.postman_environment.local.json, if it
#      exists -- this is YOUR gitignored copy with real credentials filled
#      in. Create it once with:
#        cp postman/environments/DIA-Local.postman_environment.json \
#           postman/environments/DIA-Local.postman_environment.local.json
#      then edit the .local.json copy to add username/password.
#   2. Otherwise, postman/environments/DIA-Local.postman_environment.json --
#      the committed template. Its secret values must stay empty (see
#      README.md); do not fill them in here or you risk committing them.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COLLECTION="$SCRIPT_DIR/../postman/DIA-API-Tests.postman_collection.json"
LOCAL_ENV_FILE="$SCRIPT_DIR/../postman/environments/DIA-Local.postman_environment.local.json"
TEMPLATE_ENV_FILE="$SCRIPT_DIR/../postman/environments/DIA-Local.postman_environment.json"

if [ -n "${1:-}" ]; then
    ENV_FILE="$1"
elif [ -f "$LOCAL_ENV_FILE" ]; then
    ENV_FILE="$LOCAL_ENV_FILE"
    echo "Using local environment (gitignored): $ENV_FILE"
else
    ENV_FILE="$TEMPLATE_ENV_FILE"
    echo "No $LOCAL_ENV_FILE found -- falling back to the committed template."
    echo "Its username/password are expected to be empty; create a .local.json copy to run authenticated tests (see comment above)."
fi

REPORT_DIR="$SCRIPT_DIR/reports"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

if ! command -v newman >/dev/null 2>&1; then
    echo "Newman is not installed. Install it with: npm install -g newman" >&2
    exit 1
fi

mkdir -p "$REPORT_DIR"

REPORTERS="cli,json"
REPORTER_ARGS=(--reporter-json-export "$REPORT_DIR/report-$TIMESTAMP.json")

if npm ls -g newman-reporter-htmlextra >/dev/null 2>&1; then
    REPORTERS="cli,json,htmlextra"
    REPORTER_ARGS+=(--reporter-htmlextra-export "$REPORT_DIR/report-$TIMESTAMP.html")
fi

set +e
newman run "$COLLECTION" \
    -e "$ENV_FILE" \
    --reporters "$REPORTERS" \
    "${REPORTER_ARGS[@]}"
NEWMAN_EXIT=$?
set -e

echo ""
echo "JSON report: $REPORT_DIR/report-$TIMESTAMP.json"

# Always generate the human-readable HTML report, even when tests failed --
# that's exactly when someone needs to open it to see what broke. The
# original Newman exit code is preserved below so CI still fails the build.
node "$SCRIPT_DIR/generate-report.js" "$REPORT_DIR/report-$TIMESTAMP.json"

exit "$NEWMAN_EXIT"
