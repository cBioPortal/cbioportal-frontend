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
// NCBI ID Converter — maps PMID -> PMCID. We use this instead of eutils
// elink.fcgi for the PMID->PMCID hop because NCBI tarpits elink from cloud
// egress IPs (verified on Vercel: elink hangs ~8s and times out, while efetch
// on the same host and idconv here both respond in <200ms). Lives on the same
// host family as the BioC full-text service.
const IDCONV =
    'https://pmc.ncbi.nlm.nih.gov/tools/idconv/api/v1/articles/';

const MAX_PAPER_CHARS = 200_000;

// NCBI asks every automated client to identify itself with tool + email, and
// gives api_key holders a 10-req/s/IP limit instead of the anonymous 3/s. On
// Vercel's shared datacenter egress that lower limit is exactly what was
// dropping the elink (PMID -> PMCID) call. Set NCBI_API_KEY in the Vercel env
// to lift it; tool/email work without a key.
const NCBI_API_KEY = process.env.NCBI_API_KEY || '';
const NCBI_TOOL = 'cbioportal-chat-sidebar';
const NCBI_EMAIL = process.env.NCBI_EMAIL || 'cbioportal-dev@cbioportal.org';

// Append NCBI's identification + rate-limit params to a eutils URL.
function withNcbiParams(url: string): string {
    const u = new URL(url);
    u.searchParams.set('tool', NCBI_TOOL);
    u.searchParams.set('email', NCBI_EMAIL);
    if (NCBI_API_KEY) u.searchParams.set('api_key', NCBI_API_KEY);
    return u.toString();
}

function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}

// fetch with a per-attempt timeout and small backoff retries on transient
// failures (network error, timeout, 429, or 5xx). A single dropped request to
// NCBI used to lose the whole PMC hop; retrying recovers from the throttling
// that hits cloud egress IPs. The timeout matters because a stuck NCBI socket
// would otherwise hang for the whole serverless budget (paper-status has 30s).
async function fetchWithRetry(
    url: string,
    retries = 2,
    backoffMs = 400,
    timeoutMs = 8000
): Promise<Response | null> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const r = await fetch(url, {
                signal: AbortSignal.timeout(timeoutMs),
            });
            if (r.ok) return r;
            // 4xx other than 429 won't change on retry — give up immediately.
            if (r.status !== 429 && r.status < 500) return r;
        } catch {
            /* network error or timeout — fall through to retry */
        }
        if (attempt < retries) await sleep(backoffMs * (attempt + 1));
    }
    return null;
}

export async function fetchStudy(studyId: string): Promise<Study> {
    const r = await fetch(
        `${CBIO_API}/api/studies/${encodeURIComponent(studyId)}`
    );
    if (!r.ok) throw new Error(`cBioPortal study ${studyId}: HTTP ${r.status}`);
    return (await r.json()) as Study;
}

// NCBI sometimes returns malformed JSON or HTML error pages; never let a single
// flaky upstream call crash the whole paper-context fetch.
async function safeJson(url: string): Promise<any | null> {
    const r = await fetchWithRetry(url);
    if (!r || !r.ok) return null;
    try {
        return JSON.parse(await r.text());
    } catch {
        return null;
    }
}

async function pmidToPmcid(pmid: string): Promise<string | null> {
    const data = await safeJson(
        withNcbiParams(`${IDCONV}?ids=${pmid}&format=json`)
    );
    if (!data || data.status !== 'ok') return null;
    for (const rec of data.records ?? []) {
        if (rec?.pmcid) {
            // idconv returns "PMC3401966"; downstream wants the bare number.
            return String(rec.pmcid).replace(/^PMC/i, '');
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
    const r = await fetchWithRetry(
        withNcbiParams(
            `${NCBI_EUTILS}/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=text`
        )
    );
    if (!r || !r.ok) return null;
    const text = await r.text();
    return text.trim() || null;
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
