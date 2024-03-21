#!/usr/bin/env bash


# Check if api-spec-converter is installed
if ! command -v api-spec-converter &> /dev/null
then
    # Install api-spec-converter, ignoring errors
    npm install api-spec-converter --no-save --legacy-peer-deps 2>/dev/null || true
fi

mv packages/cbioportal-ts-api-client/src/generated/CBioPortalAPI-docs.json packages/cbioportal-ts-api-client/src/generated/public.json
mv packages/cbioportal-ts-api-client/src/generated/CBioPortalAPIInternal-docs.json packages/cbioportal-ts-api-client/src/generated/internal.json

api-spec-converter --from=openapi_3 --to=swagger_2 --syntax=json packages/cbioportal-ts-api-client/src/generated/public.json | jq 'del(.host, .basePath, .schemes)' > packages/cbioportal-ts-api-client/src/generated/CBioPortalAPI-docs.json
api-spec-converter --from=openapi_3 --to=swagger_2 --syntax=json packages/cbioportal-ts-api-client/src/generated/internal.json | jq 'del(.host, .basePath, .schemes)' > packages/cbioportal-ts-api-client/src/generated/CBioPortalAPIInternal-docs.json

rm packages/cbioportal-ts-api-client/src/generated/public.json packages/cbioportal-ts-api-client/src/generated/internal.json
