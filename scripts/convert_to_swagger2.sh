#!/usr/bin/env bash

set -e  # Exit on error

# Check if api-spec-converter is installed
if ! command -v api-spec-converter &> /dev/null
then
    # Install api-spec-converter, ignoring errors
    npm install api-spec-converter --no-save --legacy-peer-deps 2>/dev/null || true
fi

mv packages/cbioportal-ts-api-client/src/generated/CBioPortalAPI-docs.json packages/cbioportal-ts-api-client/src/generated/public.json
mv packages/cbioportal-ts-api-client/src/generated/CBioPortalAPIInternal-docs.json packages/cbioportal-ts-api-client/src/generated/internal.json

# Downgrade OpenAPI 3.1.0 to 3.0.1 so api-spec-converter can handle it.
jq '.openapi |= gsub("3\\.1\\.0"; "3.0.1")' packages/cbioportal-ts-api-client/src/generated/public.json > packages/cbioportal-ts-api-client/src/generated/public.tmp.json && mv packages/cbioportal-ts-api-client/src/generated/public.tmp.json packages/cbioportal-ts-api-client/src/generated/public.json
jq '.openapi |= gsub("3\\.1\\.0"; "3.0.1")' packages/cbioportal-ts-api-client/src/generated/internal.json > packages/cbioportal-ts-api-client/src/generated/internal.tmp.json && mv packages/cbioportal-ts-api-client/src/generated/internal.tmp.json packages/cbioportal-ts-api-client/src/generated/internal.json

# Use npx to run api-spec-converter from node_modules (pnpm overrides will handle Node 15 compatibility)
npx api-spec-converter --from=openapi_3 --to=swagger_2 --syntax=json packages/cbioportal-ts-api-client/src/generated/public.json | jq 'del(.host, .basePath, .schemes)' > packages/cbioportal-ts-api-client/src/generated/CBioPortalAPI-docs.json
npx api-spec-converter --from=openapi_3 --to=swagger_2 --syntax=json packages/cbioportal-ts-api-client/src/generated/internal.json | jq 'del(.host, .basePath, .schemes)' > packages/cbioportal-ts-api-client/src/generated/CBioPortalAPIInternal-docs.json

rm packages/cbioportal-ts-api-client/src/generated/public.json packages/cbioportal-ts-api-client/src/generated/internal.json
