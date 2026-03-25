cBioPortal Accessibility Conformance Report
=============================================

WCAG Edition
============

**(Based on VPAT**® **Version 2.5)**

Name of Product/Version
-------------------------

cBioPortal for Cancer Genomics (frontend v6.x, assessed from [cBioPortal/cbioportal-frontend](https://github.com/cBioPortal/cbioportal-frontend) master branch, commit fcd4b34)

Report Date
-------------

March 2026

Product Description
---------------------

cBioPortal is an open-source web application for interactive exploration of multidimensional cancer genomics data sets. It provides visualization and analysis tools including OncoPrint (canvas-based mutation heatmaps), mutation diagrams (SVG lollipop plots), survival curves, study summary charts, and tabular views of genomic and clinical data. The platform is primarily used by cancer researchers and bioinformaticians.

cBioPortal is a single-page application (SPA) built with React 16, TypeScript, MobX, and Bootstrap 3. Its core value proposition is the interactive visualization of complex, high-dimensional genomic data — functionality that is inherently visual and presents fundamental challenges for non-visual accessibility.

Contact Information
---------------------

cBioPortal Development Team — cbioportal@googlegroups.com

GitHub: https://github.com/cBioPortal/cbioportal-frontend

Notes
-------

**Scope of this report:** This report evaluates the publicly hosted instance at https://www.cbioportal.org. The evaluation focused on four representative pages: the Homepage (study selector and query interface), Study View (summary dashboard for a cancer study), Patient View (individual patient clinical and genomic data), and Results/OncoPrint View (mutation visualization for queried genes).

**Nature of the product:** cBioPortal is a specialized scientific research tool whose primary function is the visual exploration of cancer genomics data. Many of its core features — OncoPrint heatmaps, mutation lollipop diagrams, survival plots, copy-number charts — are rendered on HTML5 `<canvas>` and `<svg>` elements that do not currently provide text alternatives or keyboard navigation for the data they encode. These visualizations are the central purpose of the application and represent a fundamental accessibility gap that would require significant architectural changes to address.

**Accessibility improvements in progress:** As part of this assessment, structural accessibility improvements were implemented in PR [#5466](https://github.com/cBioPortal/cbioportal-frontend/pull/5466), including:

- Removal of global focus outline suppression and addition of `:focus-visible` keyboard focus indicators
- Addition of a skip navigation link and `<main>` landmark
- Addition of semantic `<footer>` and labeled `<nav>` landmarks
- Correction of heading hierarchy in query filter fields
- Addition of `aria-label` attributes to unlabeled search inputs and icon-only buttons
- Addition of an `aria-live` announcer region
- Addition of keyboard event handlers (`role="button"`, `tabIndex`, `onKeyDown`) to interactive table cells in Study View
- Addition of `lang="en"` to the HTML document element

These improvements are reflected in the assessments below where noted.

Evaluation Methods Used
-------------------------

- **Automated DOM inspection:** A custom Playwright-based headless browser audit script was used to programmatically inspect the rendered DOM across four representative pages. The script checks for: language attributes, page titles, viewport zoom restrictions, skip navigation links, ARIA landmarks, image/SVG/canvas alt text, heading hierarchy, form input labels, keyboard accessibility of interactive elements, ARIA roles, focus order, inline outline suppression, and `aria-live` regions.
- **Source code review:** Direct review of React component source code (TypeScript/TSX) to assess ARIA usage, semantic HTML, keyboard event handling, and accessible naming patterns.
- **Manual structural analysis:** Inspection of the application shell, navigation patterns, page layout components, and third-party library integration (react-virtualized, IGV.js, oncoprintjs).

Applicable Standards/Guidelines
-------------------------------

This report covers the degree of conformance for the following accessibility standard/guidelines:

| Standard/Guideline | Included In Report |
|---|---|
| [Web Content Accessibility Guidelines 2.0](http://www.w3.org/TR/2008/REC-WCAG20-20081211) | Level A (Yes) Level AA (Yes) Level AAA (No) |
| [Web Content Accessibility Guidelines 2.1](https://www.w3.org/TR/WCAG21) | Level A (Yes) Level AA (Yes) Level AAA (No) |

Terms
-----

The terms used in the Conformance Level information are defined as follows:

- **Supports**: The functionality of the product has at least one method that meets the criterion without known defects or meets with equivalent facilitation.
- **Partially Supports**: Some functionality of the product does not meet the criterion.
- **Does Not Support**: The majority of product functionality does not meet the criterion.
- **Not Applicable**: The criterion is not relevant to the product.

WCAG 2.1 Report
---------------

Note: When reporting on conformance with the WCAG 2.x Success Criteria, they are scoped for full pages, complete processes, and accessibility-supported ways of using technology as documented in the [WCAG 2.0 Conformance Requirements](https://www.w3.org/TR/WCAG20/#conformance-reqs).

### Table 1: Success Criteria, Level A

| **Criteria** | **Conformance Level** | **Remarks and Explanations** |
|---|---|---|
| [1.1.1 Non-text Content](http://www.w3.org/TR/WCAG20/#text-equiv-all) (Level A) | Does Not Support | The application makes extensive use of data visualizations rendered as `<canvas>` elements (OncoPrint heatmaps, IGV genome browser tracks) and `<svg>` elements (mutation lollipop diagrams, pie charts, bar charts, survival plots) that do not provide text alternatives. On the Study View page, 13 of 31 SVGs lack accessible labels. On the Patient View page, 58 of 59 SVGs and all 6 canvas elements lack accessible labels. On the OncoPrint page, 7 canvas elements (the core visualization) and 1 SVG lack labels. Standard `<img>` elements do have appropriate `alt` attributes throughout the application. |
| [1.2.1 Audio-only and Video-only (Prerecorded)](http://www.w3.org/TR/WCAG20/#media-equiv-av-only-alt) (Level A) | Not Applicable | The application does not include audio-only or video-only content. |
| [1.2.2 Captions (Prerecorded)](http://www.w3.org/TR/WCAG20/#media-equiv-captions) (Level A) | Not Applicable | The application does not include prerecorded audio content in synchronized media. |
| [1.2.3 Audio Description or Media Alternative (Prerecorded)](http://www.w3.org/TR/WCAG20/#media-equiv-audio-desc) (Level A) | Not Applicable | The application does not include prerecorded video content in synchronized media. |
| [1.3.1 Info and Relationships](http://www.w3.org/TR/WCAG20/#content-structure-separation-programmatic) (Level A) | Partially Supports | **Supports:** The application uses semantic HTML landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`) to define page structure. Navigation elements have descriptive `aria-label` attributes. Heading hierarchy is correct on the Homepage and Study View (h2 → h3). Data tables use `role="grid"`, `role="columnheader"`, `role="row"`, and `role="gridcell"` via react-virtualized. Form inputs on the Homepage, Study View, and OncoPrint pages have associated labels. **Does not support:** On the Patient View page, 6 form inputs from the embedded IGV.js genome browser (chromosome select, locus search, range slider, and 2 other inputs) lack accessible labels. On the OncoPrint page, heading hierarchy skips from h3 to h5 in the settings panel ("Color by", "Annotate and Filter"). |
| [1.3.2 Meaningful Sequence](http://www.w3.org/TR/WCAG20/#content-structure-separation-sequence) (Level A) | Partially Supports | The DOM order generally follows a meaningful reading sequence: header, navigation, main content, footer. However, some data visualization panels (Study View charts, OncoPrint tracks) use absolute positioning that may not convey a meaningful sequence to screen readers. |
| [1.3.3 Sensory Characteristics](http://www.w3.org/TR/WCAG20/#content-structure-separation-understanding) (Level A) | Partially Supports | Instructions and labels generally use text rather than relying solely on sensory characteristics. However, some chart legends and OncoPrint annotations rely on color or shape to convey mutation type, copy-number status, and other genomic annotations without providing equivalent text-based indicators in all cases. |
| [1.4.1 Use of Color](http://www.w3.org/TR/WCAG20/#visual-audio-contrast-without-color) (Level A) | Partially Supports | The application uses color extensively to encode genomic data categories (mutation types, copy-number alterations, expression levels). In OncoPrint, mutation types are distinguished by color (green for missense, black for truncating, etc.). Study View pie charts and bar charts use color to distinguish categories. While legends are provided, the color encoding is the primary means of distinguishing data categories in these visualizations, and no alternative (pattern, text label) is available within the charts themselves. Standard UI elements (buttons, links, form states) do not rely solely on color. |
| [1.4.2 Audio Control](http://www.w3.org/TR/WCAG20/#visual-audio-contrast-dis-audio) (Level A) | Not Applicable | The application does not play audio automatically. |
| [2.1.1 Keyboard](http://www.w3.org/TR/WCAG20/#keyboard-operation-keyboard-operable) (Level A) | Partially Supports | **Supports:** Standard navigation (header links, tab navigation between pages), form inputs (study search, gene query, checkboxes), and data table operations (sorting via column headers with `tabIndex` and `onKeyDown` handlers provided by react-virtualized) are keyboard accessible. Study View gene name cells and filter icons have been updated with `role="button"`, `tabIndex`, and keyboard event handlers. **Does not support:** Canvas-based visualizations (OncoPrint, IGV genome browser) do not support keyboard interaction — users cannot navigate individual data points, select samples, or interact with chart elements via keyboard. Some interactive elements across the application (tooltips triggered on hover, drag-to-zoom on charts) have no keyboard equivalent. The Patient View page has 11 div elements with `role="button"` that lack `tabIndex` for keyboard focus. |
| [2.1.2 No Keyboard Trap](http://www.w3.org/TR/WCAG20/#keyboard-operation-trapping) (Level A) | Supports | No keyboard traps were identified. Users can navigate away from all focusable elements using standard keyboard commands. Modal dialogs can be dismissed with the Escape key. |
| [2.1.4 Character Key Shortcuts](https://www.w3.org/TR/WCAG21/#character-key-shortcuts) (Level A 2.1 and 2.2) | Supports | The application does not implement single character key shortcuts. |
| [2.2.1 Timing Adjustable](http://www.w3.org/TR/WCAG20/#time-limits-required-behaviors) (Level A) | Supports | The application does not impose time limits on user interactions. Session management is handled by the backend and does not forcibly expire active sessions during use. |
| [2.2.2 Pause, Stop, Hide](http://www.w3.org/TR/WCAG20/#time-limits-pause) (Level A) | Supports | Loading spinners are the only automatically updating content and are transient indicators of data loading. No scrolling, blinking, or auto-updating content persists after page load. |
| [2.3.1 Three Flashes or Below Threshold](http://www.w3.org/TR/WCAG20/#seizure-does-not-violate) (Level A) | Supports | The application does not contain content that flashes more than three times per second. |
| [2.4.1 Bypass Blocks](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-skip) (Level A) | Supports | A "Skip to main content" link is provided as the first focusable element on every page. The link targets the `<main id="main-content">` landmark. ARIA landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`) provide additional navigation points for assistive technology users. |
| [2.4.2 Page Titled](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-title) (Level A) | Supports | All pages have descriptive `<title>` elements. The Patient View dynamically updates the title to include the patient ID (e.g., "Patient: TCGA-AR-A1AR"). The Results View includes the gene list and study name. The Homepage and Study View use the application name "cBioPortal for Cancer Genomics." |
| [2.4.3 Focus Order](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-focus-order) (Level A) | Supports | No positive `tabindex` values were found in the application. Focus order follows DOM order, which matches the visual layout. |
| [2.4.4 Link Purpose (In Context)](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-refs) (Level A) | Partially Supports | Navigation links (Data Sets, Web API, Tutorials, FAQ, etc.) have clear purposes. Study links in the Homepage list identify the study name. However, some links in data tables and visualization panels may have ambiguous purpose without surrounding context (e.g., gene symbols that function as filter toggles). |
| [2.5.1 Pointer Gestures](https://www.w3.org/TR/WCAG21/#pointer-gestures) (Level A 2.1 and 2.2) | Partially Supports | Most functionality uses single-pointer actions (click, tap). However, some chart interactions in the Study View and OncoPrint (pinch-to-zoom, drag-to-select) use multipoint or path-based gestures without single-pointer alternatives. |
| [2.5.2 Pointer Cancellation](https://www.w3.org/TR/WCAG21/#pointer-cancellation) (Level A 2.1 and 2.2) | Supports | Interactive elements use standard click/mouseup events. Drag operations can be cancelled by moving the pointer outside the target area. |
| [2.5.3 Label in Name](https://www.w3.org/TR/WCAG21/#label-in-name) (Level A 2.1 and 2.2) | Supports | Interactive elements with visible labels have accessible names that contain the visible text. Search inputs use `aria-label` values that match their placeholder text. Buttons with visible text use that text as their accessible name. |
| [2.5.4 Motion Actuation](https://www.w3.org/TR/WCAG21/#motion-actuation) (Level A 2.1 and 2.2) | Not Applicable | The application does not use device motion or user motion for any functionality. |
| [3.1.1 Language of Page](http://www.w3.org/TR/WCAG20/#meaning-doc-lang-id) (Level A) | Supports | The `<html>` element includes `lang="en"` on all pages. |
| [3.2.1 On Focus](http://www.w3.org/TR/WCAG20/#consistent-behavior-receive-focus) (Level A) | Supports | No context changes occur when components receive focus. Tooltips that appear on focus do not constitute a context change. |
| [3.2.2 On Input](http://www.w3.org/TR/WCAG20/#consistent-behavior-unpredictable-change) (Level A) | Supports | Form inputs do not cause unexpected context changes. Study search filters results in-place. Checkbox selections in data tables update filters without navigating away. Query submission requires an explicit button click. |
| [3.3.1 Error Identification](http://www.w3.org/TR/WCAG20/#minimize-error-identified) (Level A) | Partially Supports | The gene query form validates input and displays error messages when invalid gene symbols are entered. However, error messages are not consistently associated with their input fields via `aria-describedby` or similar mechanisms, and may not be announced by screen readers. |
| [3.3.2 Labels or Instructions](http://www.w3.org/TR/WCAG20/#minimize-error-cues) (Level A) | Partially Supports | Search inputs have `aria-label` attributes and placeholder text. The gene query textarea has visible instructions. However, some form controls in the Study View and Patient View (particularly those from the IGV genome browser integration) lack labels or instructions. |
| [4.1.1 Parsing](http://www.w3.org/TR/WCAG20/#ensure-compat-parses) (Level A) | Supports | Per the September 2023 WCAG 2.0 and 2.1 editorial errata, this criterion is always considered satisfied. |
| [4.1.2 Name, Role, Value](http://www.w3.org/TR/WCAG20/#ensure-compat-rsv) (Level A) | Partially Supports | **Supports:** Navigation elements have `aria-label` attributes. Icon-only buttons (OncoPrint settings toggle, minimap toggle, driver annotation settings) have `aria-label` attributes. Data table column headers have `role="columnheader"` with `aria-sort` and `aria-label`. Interactive cells in Study View gene tables have `role="button"` and descriptive `aria-label` attributes. Search inputs have `aria-label`. **Does not support:** One dropdown toggle button on the Homepage lacks an accessible name (shows only a caret icon). Some interactive elements in the Patient View (IGV toolbar buttons) may have generic or missing accessible names. Canvas-based visualizations expose no programmatic roles or values. |

### Table 2: Success Criteria, Level AA

| **Criteria** | **Conformance Level** | **Remarks and Explanations** |
|---|---|---|
| [1.2.4 Captions (Live)](http://www.w3.org/TR/WCAG20/#media-equiv-real-time-captions) (Level AA) | Not Applicable | The application does not include live audio content. |
| [1.2.5 Audio Description (Prerecorded)](http://www.w3.org/TR/WCAG20/#media-equiv-audio-desc-only) (Level AA) | Not Applicable | The application does not include prerecorded video content. |
| [1.3.4 Orientation](https://www.w3.org/TR/WCAG21/#orientation) (Level AA 2.1 and 2.2) | Supports | The application does not restrict display to a single orientation. Content adapts to both portrait and landscape viewports. |
| [1.3.5 Identify Input Purpose](https://www.w3.org/TR/WCAG21/#identify-input-purpose) (Level AA 2.1 and 2.2) | Partially Supports | The application does not use `autocomplete` attributes on input fields that collect user information. The primary input fields are domain-specific (gene names, study searches) rather than personal data fields, so the scope of this gap is limited. Login fields (where present) may benefit from `autocomplete` attributes. |
| [1.4.3 Contrast (Minimum)](http://www.w3.org/TR/WCAG20/#visual-audio-contrast-contrast) (Level AA) | Partially Supports | Standard UI elements (navigation text, buttons, form labels) generally meet 4.5:1 contrast ratios against their backgrounds. However, some data visualization elements use colors that may not meet minimum contrast requirements — particularly lighter colors in charts (e.g., light pink for certain mutation categories, light gray for unaltered samples) and small text labels within SVG charts. This was not exhaustively tested with automated contrast checking tools. |
| [1.4.4 Resize text](http://www.w3.org/TR/WCAG20/#visual-audio-contrast-scale) (Level AA) | Partially Supports | The application does not set `user-scalable=no` or `maximum-scale=1` in the viewport meta tag, allowing browser zoom. Text in standard UI elements scales with browser zoom. However, text within canvas-based visualizations (OncoPrint labels, IGV tracks) is rendered at fixed pixel sizes and does not respond to browser text-size adjustments. SVG text in charts may not scale appropriately in all cases. |
| [1.4.5 Images of Text](http://www.w3.org/TR/WCAG20/#visual-audio-contrast-text-presentation) (Level AA) | Partially Supports | The application generally uses real text rather than images of text for UI elements, navigation, and labels. However, canvas-based visualizations (OncoPrint gene labels, sample labels, track labels) render text as pixels on canvas, which functions as images of text. This is inherent to the canvas-based visualization architecture. |
| [1.4.10 Reflow](https://www.w3.org/TR/WCAG21/#reflow) (Level AA 2.1 and 2.2) | Partially Supports | The main navigation and page layout adapt to narrower viewports. However, data visualization panels (OncoPrint, Study View charts, data tables) use fixed-width layouts and horizontal scrolling that may not reflow to a single-column layout at 320 CSS pixels width. This is inherent to the data-dense visualization nature of the application. |
| [1.4.11 Non-text Contrast](https://www.w3.org/TR/WCAG21/#non-text-contrast) (Level AA 2.1 and 2.2) | Partially Supports | Standard UI components (buttons, form inputs, checkboxes) have visible boundaries. However, some graphical elements in charts and visualizations may not meet the 3:1 contrast ratio against adjacent colors — particularly in densely packed visualizations like OncoPrint where adjacent data cells use similar colors. |
| [1.4.12 Text Spacing](https://www.w3.org/TR/WCAG21/#text-spacing) (Level AA 2.1 and 2.2) | Partially Supports | Standard HTML text content supports user-applied text spacing overrides. Text rendered within `<canvas>` and `<svg>` elements does not respond to CSS text spacing adjustments. |
| [1.4.13 Content on Hover or Focus](https://www.w3.org/TR/WCAG21/#content-on-hover-or-focus) (Level AA 2.1 and 2.2) | Partially Supports | Tooltips throughout the application appear on hover and provide additional context for data points, chart elements, and UI controls. These tooltips can generally be dismissed by moving the pointer. However, not all tooltips are keyboard-triggerable (particularly those on canvas/SVG visualization elements), and it was not verified that pointer can be moved over tooltip content without dismissal in all cases. |
| [2.4.5 Multiple Ways](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-mult-loc) (Level AA) | Supports | Pages can be reached via: the main navigation menu, direct URL, the study search/filter interface, breadcrumb-style links in study and patient views, and browser history. |
| [2.4.6 Headings and Labels](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-descriptive) (Level AA) | Supports | Headings describe the topic or purpose of their sections (e.g., "Select Studies for Visualization & Analysis", "Breast Invasive Carcinoma (TCGA, Nature 2012)"). Form labels and `aria-label` attributes describe the purpose of their associated controls. |
| [2.4.7 Focus Visible](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-focus-visible) (Level AA) | Supports | A visible focus indicator (2px solid #1a74c6 outline) is provided for keyboard focus via `:focus-visible` CSS. This applies to buttons and div elements receiving keyboard focus. Browser default focus styles apply to links and form inputs. No inline `outline:none` styles were detected. The previously present global CSS rule suppressing all focus outlines has been removed. |
| [3.1.2 Language of Parts](http://www.w3.org/TR/WCAG20/#meaning-other-lang-id) (Level AA) | Supports | The application content is in English. Gene symbols, protein identifiers, and other scientific nomenclature are universal terms that do not require language markup. No sections of content in other languages were identified. |
| [3.2.3 Consistent Navigation](http://www.w3.org/TR/WCAG20/#consistent-behavior-consistent-locations) (Level AA) | Supports | The main navigation bar appears consistently across all pages in the same position and order. The footer is consistent across pages where it appears. |
| [3.2.4 Consistent Identification](http://www.w3.org/TR/WCAG20/#consistent-behavior-consistent-functionality) (Level AA) | Supports | Components with the same function are identified consistently. Search inputs use consistent "Search..." placeholder text and similar `aria-label` values. Navigation items maintain consistent labels. Data table controls (sort, filter, select all) use consistent patterns. |
| [3.3.3 Error Suggestion](http://www.w3.org/TR/WCAG20/#minimize-error-suggestions) (Level AA) | Partially Supports | The gene query interface suggests corrections for misspelled gene symbols. However, error suggestions are not consistently provided across all input fields, and suggestion mechanisms may not be fully accessible to screen readers. |
| [3.3.4 Error Prevention (Legal, Financial, Data)](http://www.w3.org/TR/WCAG20/#minimize-error-reversible) (Level AA) | Not Applicable | The application does not involve legal commitments, financial transactions, or modification of user-controllable data in data storage. It is a read-only data exploration tool. |
| [4.1.3 Status Messages](https://www.w3.org/TR/WCAG21/#status-messages) (Level AA 2.1 and 2.2) | Partially Supports | An `aria-live="polite"` region has been added to the application shell for announcing status messages. The Patient View includes an `alert` role for informational messages (e.g., "Study is not profiled for structural variants"). However, dynamic status changes (loading states, filter result counts, query progress) are not yet wired to the live region and may not be announced by screen readers. |

Legal Disclaimer
--------------------------

This Accessibility Conformance Report is provided for informational purposes and reflects the state of the product at the time of assessment. cBioPortal is open-source software developed by a community of contributors. Accessibility conformance may vary across deployments, configurations, and customizations. This report does not constitute a guarantee of accessibility for any specific use case or assistive technology combination.
