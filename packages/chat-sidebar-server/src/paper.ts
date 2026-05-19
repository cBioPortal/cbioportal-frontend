// Fetches a study's associated paper text for grounding chat suggestions.
// Strategy: cBioPortal study -> PMID(s) -> PMC full text via BioC -> fallback to PubMed abstract.

export interface Study {
    studyId: string;
    name: string;
    description: string;
    pmid: string;
    citation: string;
}

export interface PaperContext {
    study: Study;
    pmid: string | null;
    pmcid: string | null;
    source: 'pmc' | 'abstract' | 'none';
    text: string;
    paperUrl: string | null;
}

const CBIO_API = 'https://www.cbioportal.org';
const NCBI_EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const BIOC_BASE =
    'https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_json';

const MAX_PAPER_CHARS = 200_000;

export async function fetchStudy(studyId: string): Promise<Study> {
    const r = await fetch(
        `${CBIO_API}/api/studies/${encodeURIComponent(studyId)}`
    );
    if (!r.ok)
        throw new Error(`cBioPortal study ${studyId}: HTTP ${r.status}`);
    return (await r.json()) as Study;
}

// NCBI sometimes returns malformed JSON or HTML error pages; never let a single
// flaky upstream call crash the whole paper-context fetch.
async function safeJson(url: string): Promise<any | null> {
    try {
        const r = await fetch(url);
        if (!r.ok) return null;
        const text = await r.text();
        try {
            return JSON.parse(text);
        } catch {
            return null;
        }
    } catch {
        return null;
    }
}

async function pmidToPmcid(pmid: string): Promise<string | null> {
    const data = await safeJson(
        `${NCBI_EUTILS}/elink.fcgi?dbfrom=pubmed&db=pmc&id=${pmid}&retmode=json`
    );
    if (!data) return null;
    for (const ls of data?.linksets ?? []) {
        for (const db of ls?.linksetdbs ?? []) {
            if (db?.linkname === 'pubmed_pmc' && db?.links?.length) {
                return String(db.links[0]);
            }
        }
    }
    return null;
}

async function fetchPmcFullText(pmcid: string): Promise<string | null> {
    const data = await safeJson(`${BIOC_BASE}/PMC${pmcid}/unicode`);
    if (!data) return null;
    const collections = Array.isArray(data) ? data : [data];
    const passages: string[] = [];
    for (const coll of collections) {
        for (const doc of coll?.documents ?? []) {
            for (const p of doc?.passages ?? []) {
                if (typeof p?.text === 'string' && p.text.trim()) {
                    const section = p?.infons?.section_type
                        ? `[${p.infons.section_type}] `
                        : '';
                    passages.push(section + p.text);
                }
            }
        }
    }
    const text = passages.join('\n\n');
    return text || null;
}

async function fetchPubmedAbstract(pmid: string): Promise<string | null> {
    try {
        const r = await fetch(
            `${NCBI_EUTILS}/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=text`
        );
        if (!r.ok) return null;
        const text = await r.text();
        return text.trim() || null;
    } catch {
        return null;
    }
}

export async function fetchPaperForStudy(
    studyId: string
): Promise<PaperContext> {
    const study = await fetchStudy(studyId);
    const pmids = String(study.pmid || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    if (pmids.length === 0) {
        return {
            study,
            pmid: null,
            pmcid: null,
            source: 'none',
            text: '',
            paperUrl: null,
        };
    }

    // Try each PMID for a PMC full-text version first.
    for (const pmid of pmids) {
        const pmcid = await pmidToPmcid(pmid);
        if (pmcid) {
            const text = await fetchPmcFullText(pmcid);
            if (text) {
                return {
                    study,
                    pmid,
                    pmcid,
                    source: 'pmc',
                    text: text.slice(0, MAX_PAPER_CHARS),
                    paperUrl: `https://pmc.ncbi.nlm.nih.gov/articles/PMC${pmcid}/`,
                };
            }
        }
    }

    // Fall back to the abstract of the first PMID.
    const pmid = pmids[0];
    const abstract = await fetchPubmedAbstract(pmid);
    if (abstract) {
        return {
            study,
            pmid,
            pmcid: null,
            source: 'abstract',
            text: abstract,
            paperUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        };
    }

    return {
        study,
        pmid,
        pmcid: null,
        source: 'none',
        text: '',
        paperUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    };
}
