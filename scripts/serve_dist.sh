#!/usr/bin/env bash

set -e
set -u
set -o pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

protocol="${PROTOCOL:-https}"

# serve frontend as https if CBIOPORTAL_URL contains https, use http otherwise
# CircleCI resolves the backend once in the preceding step and persists it in
# BASH_ENV. Honor that value so every shard does not repeat the unauthenticated
# GitHub API lookup. Local invocations still resolve through env_vars.sh.
if [[ -z "${CBIOPORTAL_URL:-}" ]]; then
  eval "$(bash "$SCRIPT_DIR/env_vars.sh")"
fi
: "${CBIOPORTAL_URL:=https://www.cbioportal.org}"
(echo $CBIOPORTAL_URL | grep -q https) \

if [[ $protocol == "http" ]];
then
  echo "running http"
  ./node_modules/http-server/bin/http-server --cors dist/ -p 3000;
else
  (
      openssl \
          req -newkey rsa:2048 -new -nodes -x509 -days 1 -keyout key.pem -out cert.pem \
          -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=localhost" && \
      ./node_modules/http-server/bin/http-server -S -C cert.pem --cors dist/ -p 3000 \
  ) || ./node_modules/http-server/bin/http-server --cors dist/ -p 3000;
fi
