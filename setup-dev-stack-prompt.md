# Full local WSI development-stack setup prompt

Copy the prompt below into an implementation agent.

```text
Set up the complete local cBioPortal WSI development stack on host
pllimsksparky4.

Repositories and branches:

- ../cbioportal-frontend — feature/native-wsi-viewer
- ../cbioportal — feature/wsi-tile-server-config
- ../cbioportal-tile-server — main
- ../cbioportal-docker-compose — master

If the repositories are not already present, clone them into one parent
directory and check out the required branches:

    mkdir -p /gpfs/mskmind_ess/limr/repos
    cd /gpfs/mskmind_ess/limr/repos

    git clone --branch feature/native-wsi-viewer \
      git@github.com:raylim/cbioportal-frontend.git cbioportal-frontend
    git clone --branch feature/wsi-tile-server-config \
      git@github.com:raylim/cbioportal.git cbioportal
    git clone --branch main \
      git@github.com:msk-mind/cbioportal-tile-server.git cbioportal-tile-server
    git clone --branch master \
      git@github.com:cBioPortal/cbioportal-docker-compose.git cbioportal-docker-compose

If a repository already exists, do not reclone it. Instead run:

    git fetch --all --prune
    git switch <required-branch>
    git pull --ff-only

Verify the expected branches before making changes:

    for repo in cbioportal-frontend cbioportal cbioportal-tile-server cbioportal-docker-compose; do
      printf '%s: ' "$repo"
      git -C "/gpfs/mskmind_ess/limr/repos/$repo" branch --show-current
    done

Do not reset, discard, or overwrite existing user changes. Inspect each
worktree first and preserve unrelated modifications.

Start and connect the complete stack:

- ClickHouse
- Mongo/session service
- Keycloak
- cBioPortal backend
- WSI tile server
- Redis
- Frontend development server
- nginx reverse proxy

Use nginx as the browser-visible entrypoint on port 3001:

- `/` -> frontend on port 3000
- `/api/` -> cBioPortal backend on port 8090
- `/saml2/` and `/login/saml2/` -> backend
- `/wsi/` -> tile server on port 8081
- Preserve query parameters and Authorization headers.

Configure all hostnames, SAML metadata, Keycloak redirects, CORS, proxy
headers, and SSO URLs for `pllimsksparky4`, not pllimsksparky3.

Authentication requirements:

- Frontend authentication method: `saml`
- Keycloak SAML client/entity ID: `cbioportal-saml`
- Enable WSI authentication.
- Use a local WSI secret with at least 32 bytes.
- Local Keycloak credentials:
  - username: `testuser`
  - password: `P@ssword1`
- Configure redirects for:
  - `http://pllimsksparky4:3000`
  - `http://pllimsksparky4:3001`

WSI access must follow cBioPortal study access groups:

- `coad_msk_2025` must be readable by the test user.
- `/api/wsi/access-token?studyId=coad_msk_2025` succeeds after login.
- The JWT must contain `sub`, `aud`, `scope=wsi:read`, `study_id`, `iat`, and `exp`.
- Unknown or unauthorized studies return HTTP 403.
- Anonymous token requests return HTTP 401.
- A token for one study must not work for another study.

Frontend WSI behavior:

- Cache WSI tokens per study ID.
- Include `studyId` on hierarchy, metadata, thumbnails, tiles, and
  OpenSeadragon requests.
- Send the bearer token on every WSI request.
- Ensure `/patient/wsiHESlides` loads through nginx with all filters and
  query parameters preserved.

Tile-server behavior:

- Support the `/wsi` namespace behind nginx.
- Keep `/wsi/health` public.
- When `WSI_AUTH_REQUIRED=true`, require a bearer token and matching
  `studyId` query parameter.
- Require `WSI_STUDY_MAPPING_TABLE` containing `image_id` and `study_id`.
- Reject slides not mapped to the requested study.
- Fail closed if the mapping table is missing or the mapping does not match.
- When `WSI_AUTH_REQUIRED=false` for the local legacy rehearsal, preserve the
  existing unscoped metadata path.
- Keep patient and slide metadata responses private and no-store.

Verify these URLs:

- http://pllimsksparky4:3001/
- http://pllimsksparky4:3001/study/summary?id=coad_msk_2025
- http://pllimsksparky4:3001/patient/summary?studyId=coad_msk_2025&caseId=P-0008377
- http://pllimsksparky4:3001/patient/wsiHESlides?studyId=coad_msk_2025&caseId=P-0008377
- http://pllimsksparky4:3001/wsi/health

Run validation:

    cd ../cbioportal-tile-server
    python3 -m pytest -q

    cd ../cbioportal-frontend
    pnpm exec tsc --noEmit --pretty false
    pnpm exec jest --runInBand \
      src/shared/components/wsiViewer/wsiAuth.spec.ts \
      src/shared/components/wsiViewer/wsiOsdUtils.spec.ts

    cd end-to-end-test-playwright
    PW_LOCAL=1 CBIOPORTAL_URL=http://pllimsksparky4:3001 \
      pnpm exec playwright test \
      tests/local/wsi-keycloak.spec.ts \
      tests/local/coad-study-access.spec.ts

Run the repeatable tile benchmark through nginx:

    cd ../cbioportal-tile-server
    python bench/tile_bench.py \
      --base-url http://pllimsksparky4:3001/wsi \
      --study-id coad_msk_2025 \
      --slide-id 2908638 \
      --max-zoom 9 \
      --tile-grid 8 \
      --requests 1000 \
      --concurrency 20 \
      --warmup 100 \
      --cache-mode warm \
      --json-out results/nginx-warm.json

If JMeter is installed, also run:

    jmeter -n -t bench/tile-benchmark.jmx \
      -JBASE_URL=http://pllimsksparky4:3001/wsi \
      -JSTUDY_ID=coad_msk_2025 \
      -JSLIDE_IDS=2908638,4186363 \
      -JMAX_ZOOM=9 -JTILE_GRID=8 \
      -Jusers=20 -Jramp_seconds=20 -Jduration_seconds=60 \
      -l results/jmeter-warm.jtl \
      -e -o results/jmeter-warm-report

At the end, report:

- Services and ports
- Active branches and commit IDs
- Login URL and credentials
- Environment variables configured
- Docker images rebuilt
- Test commands and results
- Benchmark result paths and p50/p95/p99
- Any remaining gap, especially a missing slide-to-study mapping table
```
