# Study View Columns dropdown validation

These screenshots were captured against the public Study View at
`https://www.cbioportal.org/study/summary?id=msk_impact_50k_2026` after signing
in and setting
`localStorage.netlify = "deploy-preview-5655--cbioportalfrontend"` in the
browser console.

- `columns-dropdown-before.png`: controlled reproduction of the pre-fix stacking
  order, with the tooltip below the table headers.
- `columns-dropdown-after.png`: the PR implementation, with the tooltip above
  the table headers.
- `columns-dropdown-playwright.png`: Playwright capture of the Columns menu
  open at 1600 x 1000 against the PR preview.
- `deploy-preview-5655-columns-popup.png`: Playwright capture from deploy
  preview 5655 showing the Columns popup at 1600 x 1000.
- `local-auth-reset-charts-modal.png`: authenticated browser capture showing
  the Reset charts modal above the Columns popup.

The browser validation used Chromium at 1600 x 1000, clicked the blue
`data-test="add-charts-button"` control, selected an additional chart, and then
opened Reset charts from the Columns popup.
