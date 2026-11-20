import { PageEvent, PageType } from './page-events';

// Welcome-screen starters: fixed templates per page type, filled from the
// stable fields of the latest settled page snapshot (the host's
// pageDetails.ts). Prompts say "this study" or "my current selection" rather
// than naming what's on screen — the chat reads the live page when one is sent.

export interface Starter {
    title: string;
    prompt: string;
}

export interface StartersState {
    // loading: embedded, and the host's first settled snapshot hasn't arrived
    // yet — showing the fallbacks meanwhile would flash them on every load.
    status: 'loading' | 'ready';
    // Undefined on pages without page details: show FALLBACK_STARTERS.
    suggestions: Starter[] | undefined;
}

// For pages without page details (home, query builder, static pages) and
// when not embedded.
export const FALLBACK_STARTERS: Starter[] = [
    {
        title: 'Find lung adenocarcinoma studies',
        prompt:
            'Which cBioPortal studies include lung adenocarcinoma samples with both mutation and copy-number data? For each study, list the number of samples and the available molecular profiles.',
    },
    {
        title: 'OncoPrint for EGFR and KRAS',
        prompt:
            'Give me an OncoPrint for EGFR and KRAS in TCGA lung adenocarcinoma, and summarize how often each gene is altered and whether their alterations tend to be mutually exclusive.',
    },
    {
        title: 'Compare glioma subtypes',
        prompt:
            'Compare low grade glioma by molecular subtype, highlighting differences in the most frequently altered genes and in overall survival between subtypes.',
    },
];

// Past this many, gene and group lists are referred to generically.
const MAX_NAMED = 5;

type Details = Record<string, unknown>;

function strings(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter(
              (item): item is string => typeof item === 'string' && !!item
          )
        : [];
}

// "A", "A and B", "A, B and C" (or "or"); undefined when empty or past
// MAX_NAMED.
function joinNames(
    names: string[],
    conjunction: 'and' | 'or' = 'and'
): string | undefined {
    if (names.length === 0 || names.length > MAX_NAMED) return undefined;
    if (names.length === 1) return names[0];
    return `${names.slice(0, -1).join(', ')} ${conjunction} ${
        names[names.length - 1]
    }`;
}

function studyStarters(details: Details): Starter[] {
    if (details.isFiltered === true) {
        return [
            {
                title: 'Rank most mutated genes in my selection',
                prompt:
                    'Which genes are most frequently mutated in the samples in my current selection? List the top 10 with the number and percentage of profiled samples mutated.',
            },
            {
                title: 'Compare my selection with the rest',
                prompt:
                    'Compare the samples in my current selection with the rest of this study: which altered genes and clinical attributes differ most? Link me to the group comparison.',
            },
            {
                title: 'Write a script to export my selection',
                prompt:
                    'Write a Python script that downloads the clinical and mutation data for the samples in my current selection.',
            },
        ];
    }
    return [
        {
            title: 'Rank most mutated genes in this study',
            prompt:
                'Which genes are most frequently mutated in this study? List the top 10 with the number and percentage of profiled samples mutated.',
        },
        {
            title: 'Find common copy-number changes in this study',
            prompt:
                'Which genes are most frequently amplified or deeply deleted in this study? List the top 10 of each with their frequencies.',
        },
        {
            title: 'Compare survival for the top mutated gene',
            prompt:
                "Compare overall survival between samples with and without a mutation in this study's most frequently mutated gene, and link me to the comparison in cBioPortal.",
        },
    ];
}

function resultsStarters(details: Details): Starter[] {
    const genes = strings(details.hugoGeneSymbols);
    if (genes.length === 1) {
        const [gene] = genes;
        return [
            {
                title: `Break down ${gene} alterations by type`,
                prompt: `In this query, how are ${gene} alterations split between mutations, amplifications, deep deletions and structural variants? Give counts and percentages of altered samples.`,
            },
            {
                title: `Find the most recurrent ${gene} mutations`,
                prompt: `Which ${gene} protein changes are most recurrent in this query's samples? List the top 10 with their counts.`,
            },
            {
                title: `Compare survival for ${gene} altered vs unaltered`,
                prompt: `Compare overall survival between samples with and without ${gene} alterations in this query, and link me to the Survival tab.`,
            },
        ];
    }
    const named = joinNames(genes) ?? 'the queried genes';
    const anyOf = joinNames(genes, 'or') ?? 'the queried genes';
    // With exactly two genes the titles name both.
    const pair = genes.length === 2 ? genes : undefined;
    return [
        {
            title: pair
                ? `Compare alteration rates of ${pair[0]} and ${pair[1]}`
                : 'Rank queried genes by alteration frequency',
            prompt: `Rank ${named} by how often each is altered in this query, with the percentage of samples and the main alteration type for each.`,
        },
        {
            title: pair
                ? `Check if ${pair[0]} and ${pair[1]} co-occur`
                : 'Check mutual exclusivity of queried genes',
            prompt: `Do alterations in ${named} tend to co-occur or be mutually exclusive in this query? Give the log odds ratio and p-value for each pair, and link me to the Mutual Exclusivity tab.`,
        },
        {
            title: pair
                ? `Compare survival for ${pair[0]} or ${pair[1]} altered`
                : 'Compare survival for altered vs unaltered samples',
            prompt: `Compare overall survival between samples with at least one alteration in ${anyOf} and samples with none, and link me to the Survival tab.`,
        },
    ];
}

// The chat can't read a comparison session's sample lists, so these lean on
// links to the comparison's own tabs.
function groupComparisonStarters(details: Details): Starter[] {
    const groups = Array.isArray(details.groups)
        ? strings(
              details.groups.map(
                  group => (group as { name?: unknown } | null)?.name
              )
          )
        : [];
    const named = joinNames(groups);
    return [
        {
            title: 'Summarize how these groups are defined',
            prompt: `How is each group in this comparison${
                named ? ` (${named})` : ''
            } defined, and how many samples and patients does each contain?`,
        },
        {
            title: 'Compare survival between these groups',
            prompt: `Link me to the Survival tab for this comparison and explain how to read whether survival differs between ${named ??
                'these groups'}.`,
        },
        {
            title: 'Find genes altered differently between groups',
            prompt:
                'Link me to the Alterations tab for this comparison and explain how to find the genes altered significantly more often in one group.',
        },
    ];
}

function patientStarters(details: Details): Starter[] {
    const subject = details.pageMode === 'sample' ? 'sample' : 'patient';
    const cancerType =
        typeof details.cancerType === 'string' && details.cancerType
            ? details.cancerType
            : 'the same cancer type';
    const hasTimeline = strings(details.timelineEventTypes).length > 0;
    return [
        {
            title: `Summarize this ${subject}'s mutations`,
            prompt: `Summarize this ${subject}'s mutations: list the genes and protein changes, and flag any that are frequently mutated in ${cancerType} across cBioPortal.`,
        },
        {
            title: `Compare this ${subject} with the study cohort`,
            prompt: `How common is each of this ${subject}'s mutated genes in the rest of this study? Give the frequency for each.`,
        },
        hasTimeline
            ? {
                  title: "Summarize this patient's timeline events",
                  prompt:
                      "Summarize the events on this patient's timeline in chronological order, grouped by event type.",
              }
            : {
                  title: 'Find patients with the same mutated genes',
                  prompt:
                      'Find other patients in this study with mutations in the same genes as this patient, and link me to them.',
              },
    ];
}

function templateStarters(details: Details): Starter[] | undefined {
    if (!details.available) return undefined;
    switch (details.pageType as PageType) {
        case 'study':
            return studyStarters(details);
        case 'results':
            return resultsStarters(details);
        case 'groupComparison':
            return groupComparisonStarters(details);
        case 'patient':
            return patientStarters(details);
        default:
            return undefined;
    }
}

let state: StartersState = {
    status: window.parent && window.parent !== window ? 'loading' : 'ready',
    suggestions: undefined,
};

const listeners = new Set<() => void>();

export function subscribeToStarters(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getStartersState(): StartersState {
    return state;
}

export function setSettledSnapshot(event: PageEvent): void {
    const suggestions = templateStarters(event.details);
    // Most snapshots (a filter click, a tab switch) leave the starters as
    // they were.
    if (
        state.status === 'ready' &&
        JSON.stringify(suggestions) === JSON.stringify(state.suggestions)
    ) {
        return;
    }
    state = { status: 'ready', suggestions };
    for (const listener of listeners) listener();
}
