// Tutorial 1: Single Study Exploration, as an interactive tour. Converted from the tutorial
// script (YAML) that also produces the Tutorial 1 slides and walkthrough video.
import { TutorialScript } from './types';

const tutorial1: TutorialScript = {
    tutorial: 'Tutorial 1',
    name: 'Single Study Exploration',
    study: 'lgg_tcga_pan_can_atlas_2018',
    beats: [
        {
            kind: 'title',
            title: 'Tutorial 1: Single Study Exploration',
            bullets: ['Explore all data in a dataset'],
        },
        {
            kind: 'text',
            title: 'Tutorial objectives',
            bullets: [
                'Introduce the cBioPortal main page',
                'Find a study on the main page: search by name, or filter by data type',
                'Walk through the study view tabs: Summary, Clinical Data, CN Segments, Plots and Slide Microscopy',
                'Add charts and select a subset of samples',
                'Run a query from the study view',
            ],
            foot:
                'Example study throughout: Brain Lower Grade Glioma (TCGA, PanCancer Atlas).',
        },
        {
            title: 'cBioPortal main page',
            page: '/',
            points: [
                {
                    n: 1,
                    say: 'Filter studies by tissue of origin.',
                    target: {
                        css: 'ul[class*=cancerTypeList]',
                        pad: [9, -4, -7, -10],
                    },
                },
                {
                    n: 2,
                    say: 'Browse studies, or quick select a curated set.',
                    target: {
                        css: '[data-test=cancerTypeListContainer]',
                        pad: [-17, -56, 3, -14],
                    },
                },
                {
                    n: 3,
                    say: 'Search studies by name or data type.',
                    target: {
                        union: [
                            '[data-test=dropdown-data-type-filter]',
                            '[data-test=study-search]',
                        ],
                        pad: [1, 4, 5, 4],
                    },
                },
                {
                    n: 4,
                    say: 'Query by gene, or explore the selected studies.',
                    target: {
                        union: [
                            '[data-test=queryByGeneButton]',
                            'a[data-tour=explore-studies-button]',
                        ],
                        pad: [2, 3, 2, 4],
                    },
                },
            ],
        },
        {
            title: 'Selecting a study: search by name',
            page: '/',
            points: [
                {
                    n: 1,
                    say:
                        'Filter the list: type in the search box (here, “lower grade glioma”).',
                    target: '[data-test=study-search-input]',
                },
                {
                    n: 2,
                    say:
                        'Tick the study. The counter shows how many studies and samples are selected.',
                    target: {
                        css: 'label',
                        text:
                            'Brain Lower Grade Glioma (TCGA, PanCancer Atlas)',
                        within: {
                            css: '[data-test=StudySelect]',
                            has:
                                'Brain Lower Grade Glioma (TCGA, PanCancer Atlas)',
                        },
                        pad: 3,
                    },
                },
                {
                    n: 3,
                    say:
                        "Then click Explore Selected Studies, or click the study's pie icon to open its summary directly.",
                    target: 'a[data-tour=explore-studies-button]',
                    also: [
                        {
                            css: 'a.ci-pie-chart',
                            within: {
                                css: '[data-test=StudySelect]',
                                has:
                                    'Brain Lower Grade Glioma (TCGA, PanCancer Atlas)',
                            },
                            pad: 2,
                        },
                    ],
                },
            ],
            reveal: [
                {
                    type: {
                        into: '[data-test=study-search-input]',
                        text: 'lower grade glioma',
                    },
                },
                {
                    click: {
                        css: 'input',
                        within: {
                            css: '[data-test=StudySelect]',
                            has:
                                'Brain Lower Grade Glioma (TCGA, PanCancer Atlas)',
                        },
                    },
                },
            ],
        },
        {
            title: 'Selecting a study: filter by data type',
            page: '/',
            points: [
                {
                    n: 1,
                    say:
                        'Or narrow the list by the data you need: open the Data type menu.',
                    target: {
                        css: '[data-test=dropdown-data-type-filter]',
                        pad: [0, 0, -5, 0],
                    },
                },
                {
                    n: 2,
                    say:
                        'Each data type shows how many studies and samples have it.',
                    target: {
                        css: 'tr',
                        has: 'Studies',
                        within: '[data-test=dropdown-data-type-filter]',
                    },
                },
                {
                    n: 3,
                    say:
                        'Tick one or more. Here: RNA-Seq. The list now shows only those studies.',
                    target: {
                        css: 'tr',
                        has: 'RNA-Seq',
                        within: '[data-test=dropdown-data-type-filter]',
                    },
                },
                {
                    n: 4,
                    say:
                        'Our example study is among them: tick it and click Explore Selected Studies.',
                    target: {
                        css: 'label',
                        text:
                            'Brain Lower Grade Glioma (TCGA, PanCancer Atlas)',
                        within: {
                            css: '[data-test=StudySelect]',
                            has:
                                'Brain Lower Grade Glioma (TCGA, PanCancer Atlas)',
                        },
                        pad: 3,
                    },
                },
            ],
            reveal: [
                {
                    click: '[data-test=dropdown-data-type-filter] button',
                },
                {
                    click: {
                        css: 'label',
                        text: 'RNA-Seq',
                    },
                },
                {
                    scroll_to: {
                        css: '[data-test=StudySelect]',
                        has: 'Brain Lower Grade Glioma (TCGA, PanCancer Atlas)',
                    },
                },
            ],
        },
        {
            kind: 'text',
            title: 'Once you select a study',
            bullets: [
                'Click Explore Selected Studies (or the pie icon next to a study) to open the study view on its Summary tab.',
                'Here you can explore features of the samples, such as mutated genes or sex, for the whole study or for a subset, and start a query.',
                'The charts and tabs you see depend on the data available for the study you selected.',
            ],
        },
        {
            title: 'Study view: Summary tab',
            page: '/study/summary?id=lgg_tcga_pan_can_atlas_2018',
            points: [
                {
                    n: 1,
                    say:
                        "Tabs: Summary, Clinical Data, CN Segments, Plots, Slide Microscopy. They depend on the study's data.",
                    target: {
                        union: [
                            'a.tabAnchor_summary',
                            {
                                css: 'a.tabAnchor',
                                text: 'Slide Microscopy',
                            },
                        ],
                    },
                },
                {
                    n: 2,
                    say:
                        'The current selection: number of patients and samples.',
                    target: {
                        css: '[data-test=selected-info]',
                        pad: [0, -2, 3, -2],
                    },
                },
                {
                    n: 3,
                    say: 'Study view actions (see next slides).',
                    target: {
                        union: [
                            'button[aria-label="View selected cases"]',
                            {
                                css: 'button',
                                text: 'Groups ▾',
                            },
                        ],
                        pad: [0, 0, 42, 0],
                    },
                },
                {
                    n: 4,
                    say:
                        'Every chart summarizes one attribute. Click a chart to select samples; all charts update.',
                    target: {
                        css: 'div.react-grid-layout',
                        pad: [0, 1, -5, -8],
                    },
                },
            ],
        },
        {
            title: 'Study view: groups, custom selection and sharing',
            page: '/study/summary?id=lgg_tcga_pan_can_atlas_2018',
            points: [
                {
                    n: 1,
                    say:
                        'View all selected cases in Patient View (see the Patient View tutorial).',
                    target: {
                        css: 'button[aria-label="View selected cases"]',
                        pad: [-1, -1, -2, -1],
                    },
                },
                {
                    n: 2,
                    say:
                        'Share Virtual Study: save the selection as a virtual study (see the Virtual Studies tutorial).',
                    target: {
                        css: 'button[data-tour=action-button-bookmark]',
                        pad: [-2, -1, -2, -1],
                    },
                },
                {
                    n: 3,
                    say: 'Download clinical data for the selected cases.',
                    target: {
                        css:
                            'button[aria-label="Download clinical data for the selected cases"]',
                        pad: [-2, -1, -1, -1],
                    },
                },
                {
                    n: 4,
                    say:
                        'Custom Selection: paste a list of sample or patient IDs to filter to.',
                    target: '[data-test=custom-selection-button]',
                },
                {
                    n: 5,
                    say:
                        'Groups: create a group from the selected samples and compare groups (see the Group Comparison tutorial).',
                    target: {
                        css: '.rc-tooltip-inner',
                        pad: [-1, 0, 0, -2],
                    },
                },
            ],
            reveal: [
                {
                    click: {
                        css: 'button',
                        text: 'Groups ▾',
                    },
                },
            ],
        },
        {
            title: 'Summary tab: adding charts',
            page: '/study/summary?id=lgg_tcga_pan_can_atlas_2018',
            points: [
                {
                    n: 1,
                    say:
                        'The Charts menu adds charts. They work like any other: filter, compare, download.',
                    target: '[data-test=add-charts-button]',
                },
                {
                    n: 2,
                    say:
                        'Clinical, Genomic, Gene Specific (e.g. mRNA of one gene), Custom Data (your own groups), X vs Y (Beta), and study-specific tabs such as Arm-level CNA, Genetic Ancestry, Methylation.',
                    target: {
                        union: [
                            'a.tabAnchor_Clinical',
                            {
                                css: 'a.tabAnchor',
                                text: 'Methylation',
                            },
                        ],
                        pad: [-5, 1, 7, -2],
                    },
                },
                {
                    n: 3,
                    say:
                        'Tick attributes to show them. Freq is the share of samples with data.',
                    target: {
                        css: '.addClinicalChartTab .ReactVirtualized__Table',
                        pad: [1, -4, 3, 3],
                    },
                },
                {
                    n: 4,
                    say:
                        'When logged in, Save settings keeps this chart layout.',
                    target: {
                        css: '[data-test=save-chart-settings-to-session]',
                        pad: [1, 1, 1, 0],
                    },
                },
            ],
            reveal: [
                {
                    click: {
                        css: 'button',
                        text: 'Charts ▾',
                    },
                },
            ],
        },
        {
            kind: 'text',
            title: 'Summary tab: more kinds of charts',
            bullets: [
                'Genomic: charts that summarize the genomic data (mutated genes, CNA genes, mutation count, ...).',
                'Gene Specific: a chart for one gene from any profile with continuous data. Here: EGFR mRNA expression.',
                'Custom Data: paste your own values for the samples, e.g. groups from your own analysis. You need to be logged in.',
                'X vs Y (Beta): a chart of two clinical attributes.',
            ],
            page: '/study/summary?id=lgg_tcga_pan_can_atlas_2018',
        },
        {
            title: 'Summary tab: working with charts',
            page: '/study/summary?id=lgg_tcga_pan_can_atlas_2018',
            points: [
                {
                    n: 1,
                    say:
                        "Hover over a chart's title bar to show its buttons. Drag the title bar to move the chart.",
                    target: {
                        css: '[data-test=chart-container-SEX] .chartHeader',
                        pad: [-1, 0, -82, 0],
                    },
                },
                {
                    n: 2,
                    say: 'The i button describes the data.',
                    target: {
                        css: '.controls .btn',
                        within: '[data-test=chart-container-SEX]',
                        pad: -1,
                    },
                },
                {
                    n: 3,
                    say: 'The x button removes the chart.',
                    target: {
                        css:
                            '[data-test=chart-container-SEX] [data-test=deleteChart]',
                        pad: [-2, -1, -1, -1],
                    },
                },
                {
                    n: 4,
                    say:
                        'Hover over the menu icon for Show Table, Compare Groups (one group per value, see the Group Comparison tutorial) and Download.',
                    target: {
                        css:
                            '[data-test=chart-container-SEX] [data-test=chart-header-hamburger-icon]',
                        pad: [-2, -1, -1, -1],
                    },
                },
                {
                    n: 5,
                    say: 'Drag the corner to resize the chart.',
                    target: {
                        css:
                            '.react-grid-item:has([data-test=chart-container-SEX]) .react-resizable-handle',
                        pad: [-1, -6, -1, 2],
                    },
                },
            ],
            reveal: [
                {
                    hover: {
                        css: '.chartTitle',
                        within: '[data-test=chart-container-SEX]',
                    },
                },
                {
                    hover:
                        '[data-test=chart-container-SEX] [data-test=chart-header-hamburger-icon]',
                },
            ],
        },
        {
            title: 'Summary tab: selecting a subset of samples',
            page: '/study/summary?id=lgg_tcga_pan_can_atlas_2018',
            points: [
                {
                    n: 1,
                    say:
                        'Use any chart to select samples. Here: tick IDH1 in Mutated Genes, then Select Samples.',
                    target: {
                        css: '[role=row]',
                        has: 'IDH1',
                        within: '[data-test=mutations-table]',
                    },
                },
                {
                    n: 2,
                    say:
                        'Active filters are listed here. Click x on a filter to remove it, or Clear All Filters. The link button copies a shareable link with the filters applied.',
                    target: {
                        union: [
                            '[class*=parentGroupLogic]',
                            '[data-test=clear-all-filters]',
                            'a[class*=bookmarkButton]',
                        ],
                    },
                },
                {
                    n: 3,
                    say:
                        'All charts update to the IDH1-mutant samples. Add more filters to narrow down.',
                    target: '[data-test=selected-info]',
                },
            ],
            reveal: [
                {
                    click: {
                        css: 'input',
                        within: {
                            css: '[role=row]',
                            has: 'IDH1',
                            within: '[data-test=mutations-table]',
                        },
                    },
                },
                {
                    click: {
                        css: 'button',
                        text: 'Select Samples',
                        within: '[data-test=mutations-table]',
                    },
                },
            ],
        },
        {
            title: 'Clinical Data tab',
            page: '/study/clinicalData?id=lgg_tcga_pan_can_atlas_2018',
            points: [
                {
                    n: 1,
                    say:
                        'Filters from the Summary tab apply here: only the IDH1-mutant samples.',
                    target: {
                        union: [
                            '[class*=parentGroupLogic]',
                            '[data-test=clear-all-filters]',
                        ],
                    },
                },
                {
                    n: 2,
                    say:
                        'Click a column header to sort. Scroll right for more columns.',
                    target: '[data-test=LazyMobXTable] thead tr',
                },
                {
                    n: 3,
                    say:
                        'The Columns menu shows more attributes (they vary by study).',
                    target: '[data-test=add-charts-button]',
                },
                {
                    n: 4,
                    say: 'Download or search the table.',
                    target: {
                        union: [
                            {
                                css: 'button',
                                within: '[data-test=clinical-data-tab-content]',
                            },
                            '[data-test=table-search-input]',
                        ],
                    },
                },
            ],
            reveal: [
                {
                    click: 'a.tabAnchor_clinicalData',
                },
            ],
        },
        {
            title: 'CN Segments tab',
            page: '/study/cnSegments?id=lgg_tcga_pan_can_atlas_2018',
            points: [
                {
                    n: 1,
                    say:
                        'Enter a gene or genomic coordinates to zoom in. Filters from the Summary tab apply.',
                    target: {
                        css: 'div.igv-navbar',
                        pad: [4, 1, -10, 1],
                    },
                },
                {
                    n: 2,
                    say:
                        'The Integrative Genomics Viewer (IGV) shows segments across the genome, one row per sample.',
                    target: {
                        css: 'div.igv-column-container',
                        pad: [4, -1, -10, -20],
                    },
                },
            ],
            reveal: [
                {
                    click: 'a.tabAnchor_cnSegments',
                },
            ],
        },
        {
            title: 'Plots tab',
            page: '/study/plots?id=lgg_tcga_pan_can_atlas_2018',
            points: [
                {
                    n: 1,
                    say:
                        'Filters from the Summary tab apply here: only the IDH1-mutant samples are plotted.',
                    target: {
                        union: [
                            '[class*=parentGroupLogic]',
                            '[data-test=clear-all-filters]',
                        ],
                    },
                },
                {
                    n: 2,
                    say:
                        'Start from an example, such as mutation count by cancer type (Mut# vs Dx).',
                    target: {
                        css: '[data-test=PlotsTabEntireDiv] ul.nav-pills',
                        pad: [74, 2, -6, 1],
                    },
                },
                {
                    n: 3,
                    say:
                        'Or choose the data type and attribute for each axis: clinical attributes, mutations, copy number, expression and more.',
                    target: {
                        css: '.leftColumn',
                        pad: [2, 0, 2, -281],
                    },
                },
                {
                    n: 4,
                    say: 'Color samples by another attribute.',
                    target: {
                        css: '[data-test=GeneColoringMenu]',
                        pad: [-6, 0, 2, -2],
                    },
                },
                {
                    n: 5,
                    say: 'Download the plot or its data.',
                    target: {
                        css:
                            '[data-test=PlotsTabPlotDiv] .btn.btn-default.btn-xs',
                        pad: [0, 0, 1, 0],
                    },
                },
            ],
            reveal: [
                {
                    click: 'a.tabAnchor_plots',
                },
                {
                    click: {
                        css: 'a',
                        text: 'Mut# vs Dx',
                    },
                },
            ],
        },
        {
            title: 'Slide Microscopy tab',
            page:
                '/study/resourceTable_IDC_SLIM?id=lgg_tcga_pan_can_atlas_2018',
            points: [
                {
                    n: 1,
                    say: 'Shown for studies with H&E slide images.',
                    target: {
                        css: 'a.tabAnchor',
                        text: 'Slide Microscopy',
                    },
                },
                {
                    n: 2,
                    say:
                        'Slides of the selected patients: the IDH1 filter from the Summary tab applies.',
                    target: {
                        union: [
                            '[class*=parentGroupLogic]',
                            '[data-test=clear-all-filters]',
                        ],
                    },
                    also: [
                        {
                            css: 'div',
                            has: 'Slides ·',
                            pad: [0, 0, 19, 4],
                        },
                    ],
                },
                {
                    n: 3,
                    say:
                        'One row per slide, with pathology annotations: tumor cells, tumor nuclei, necrosis (%).',
                    target: {
                        css: '[data-test=ServerDrivenTableScrollContainer] tr',
                        pad: [0, 0, -110, 0],
                    },
                },
                {
                    n: 4,
                    say:
                        'Open a slide in the NCI Imaging Data Commons viewer. Below: a whole slide (TCGA-CS-4938, FFPE H&E) and a close-up.',
                    target: {
                        union: [
                            {
                                css: 'a',
                                has: 'Open in new window',
                            },
                            {
                                css: 'a',
                                has: 'Open in new window',
                                nth: 24,
                            },
                        ],
                    },
                },
            ],
            reveal: [
                {
                    click: {
                        css: 'a.tabAnchor',
                        text: 'Slide Microscopy',
                    },
                },
            ],
        },
        {
            title: 'Study view: run a query',
            page: '/study/summary?id=lgg_tcga_pan_can_atlas_2018',
            points: [
                {
                    n: 1,
                    say:
                        'Back on the Summary tab: click the search icon next to a gene in any genomic table to add it to the query. Apply filters first to query only the selected samples.',
                    target: {
                        union: [
                            {
                                css: '[data-test=geneNameCell]',
                                has: 'IDH1',
                                within: '[data-test=mutations-table]',
                            },
                            {
                                css: '[data-test=geneNameCell]',
                                has: 'ATRX',
                                within: '[data-test=mutations-table]',
                            },
                        ],
                        pad: [10, 5, -34, 5],
                    },
                    hover: {
                        css: '[role=row]',
                        has: 'IDH1',
                        within: '[data-test=mutations-table]',
                    },
                },
                {
                    n: 2,
                    say: 'Or type gene symbols here.',
                    target: '[data-test=geneSet]',
                },
                {
                    n: 3,
                    say:
                        'Then click Query. See Tutorial 2: Single Study Query.',
                    target: '[data-test=geneSetSubmit]',
                },
            ],
            reveal: [
                {
                    type: {
                        into: '[data-test=geneSet]',
                        text: 'IDH1 TP53 ATRX',
                    },
                },
            ],
        },
        {
            kind: 'end',
            title: 'End of the tutorial',
            links: [
                {
                    label: 'Next: Tutorial 2, Single Study Query',
                },
                {
                    label: 'More tutorials: ',
                    text: 'cbioportal.org/tutorials',
                    url: 'https://www.cbioportal.org/tutorials',
                },
                {
                    label: 'Documentation: ',
                    text: 'docs.cbioportal.org',
                    url: 'https://docs.cbioportal.org',
                },
                {
                    label: 'Email us: ',
                    text: 'cbioportal@googlegroups.com',
                    url: 'mailto:cbioportal@googlegroups.com',
                },
            ],
        },
    ],
};

export default tutorial1;
