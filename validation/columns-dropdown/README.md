# Study View Columns dropdown validation

These screenshots were captured against the local nginx-backed Study View at
`/study/clinicalData?id=coad_msk_2025` using the Keycloak test account
`testuser`.

- `columns-dropdown-before.png`: controlled reproduction of the pre-fix stacking
  order, with the tooltip below the table headers.
- `columns-dropdown-after.png`: the PR implementation, with the tooltip above
  the table headers.
- `columns-dropdown-playwright.png`: Playwright capture of the Columns menu
  open at 1600 x 1000 against the PR preview.
- `deploy-preview-5655-columns-popup.png`: Playwright capture from deploy
  preview 5655 showing the Columns popup at 1600 x 1000.
- `local-auth-reset-charts-modal.png`: Playwright capture from the authenticated
  local Docker stack showing the Reset charts modal above the Columns popup.

The browser validation used Chromium at 1600 x 1000 and clicked the blue
`data-test="add-charts-button"` control. The test account and local auth stack
are development-only.
