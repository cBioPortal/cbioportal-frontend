import { useEffect, useMemo, useState } from 'react';
import { fetchStudy, type Study } from './cbioportal';

interface PaperInfo {
    source: 'pmc' | 'abstract' | 'none';
    pmid: string | null;
    pmcid: string | null;
    paperUrl: string | null;
    studyName: string;
}

interface Cost {
    total: number;
    inputCost: number;
    cacheWriteCost: number;
    cacheReadCost: number;
    outputCost: number;
    tokens: {
        input: number;
        cacheWrite: number;
        cacheRead: number;
        output: number;
    };
    currency: string;
    model: string;
}

interface SuggestResponse {
    suggestion: string;
    paper: PaperInfo;
    usage?: unknown;
    cost?: Cost;
}

function formatCost(n: number): string {
    // Sub-cent precision so a $0.0023 call doesn't read as "$0.00".
    if (n < 0.01) return `$${n.toFixed(4)}`;
    return `$${n.toFixed(3)}`;
}

function formatTokens(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}

function getQueryParam(name: string): string | null {
    return new URLSearchParams(window.location.search).get(name);
}

function paperSourceLabel(source: PaperInfo['source']): string {
    switch (source) {
        case 'pmc':
            return 'Full text available (PMC)';
        case 'abstract':
            return 'Abstract only';
        case 'none':
            return 'No paper available';
    }
}

export function App() {
    const studyId = useMemo(() => getQueryParam('studyId'), []);
    const apiRoot = useMemo(() => getQueryParam('apiRoot') ?? '/', []);
    const gene = useMemo(() => getQueryParam('gene'), []);
    const tab = useMemo(() => getQueryParam('tab'), []);

    const [study, setStudy] = useState<Study | null>(null);
    const [studyError, setStudyError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<SuggestResponse | null>(null);
    const [suggestError, setSuggestError] = useState<string | null>(null);

    useEffect(() => {
        if (!studyId) {
            setStudyError('No studyId provided in URL.');
            return;
        }
        let cancelled = false;
        fetchStudy(apiRoot, studyId)
            .then(s => {
                if (!cancelled) setStudy(s);
            })
            .catch(err => {
                if (!cancelled) setStudyError(String(err.message ?? err));
            });
        return () => {
            cancelled = true;
        };
    }, [apiRoot, studyId]);

    const requestSuggestion = async () => {
        if (!studyId) return;
        setLoading(true);
        setSuggestError(null);
        setSuggestion(null);
        try {
            const r = await fetch('/api/chat/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studyId, gene, tab }),
            });
            if (!r.ok) {
                const body = await r.json().catch(() => ({}));
                throw new Error(body.error ?? `HTTP ${r.status}`);
            }
            const data: SuggestResponse = await r.json();
            setSuggestion(data);
        } catch (err: any) {
            setSuggestError(String(err.message ?? err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-shell">
            <header className="chat-header">
                <div className="chat-title">Study Chat</div>
                {study && (
                    <div className="chat-subtitle" title={study.description}>
                        {study.name}
                    </div>
                )}
            </header>

            <section className="chat-context">
                {studyError && <div className="error">{studyError}</div>}
                {!study && !studyError && (
                    <div className="muted">Loading study…</div>
                )}
                {study && (
                    <dl className="study-meta">
                        <dt>Study</dt>
                        <dd>{study.studyId}</dd>
                        {study.pmid && (
                            <>
                                <dt>PubMed</dt>
                                <dd>
                                    <a
                                        href={`https://pubmed.ncbi.nlm.nih.gov/${study.pmid}/`}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                    >
                                        {study.pmid}
                                    </a>
                                </dd>
                            </>
                        )}
                    </dl>
                )}
            </section>

            <div className="chat-messages">
                {!suggestion && !loading && !suggestError && (
                    <div className="muted hint">
                        Click "Suggest insight" to get a paper-grounded
                        observation about this study.
                    </div>
                )}

                {loading && (
                    <div className="msg msg-assistant muted">
                        Reading the paper and thinking…
                    </div>
                )}

                {suggestError && (
                    <div className="error">{suggestError}</div>
                )}

                {suggestion && (
                    <>
                        <div className="paper-banner">
                            <span className={`pill pill-${suggestion.paper.source}`}>
                                {paperSourceLabel(suggestion.paper.source)}
                            </span>
                            {suggestion.paper.paperUrl && (
                                <a
                                    href={suggestion.paper.paperUrl}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                >
                                    Open paper ↗
                                </a>
                            )}
                        </div>
                        <div className="msg msg-assistant">
                            {suggestion.suggestion}
                        </div>
                        {suggestion.cost && (
                            <div
                                className="cost-line muted"
                                title={`input ${suggestion.cost.tokens.input} · cache-write ${suggestion.cost.tokens.cacheWrite} · cache-read ${suggestion.cost.tokens.cacheRead} · output ${suggestion.cost.tokens.output} tokens`}
                            >
                                Cost: {formatCost(suggestion.cost.total)}{' '}
                                <span className="cost-breakdown">
                                    (in {formatTokens(suggestion.cost.tokens.input)}
                                    {suggestion.cost.tokens.cacheWrite > 0 &&
                                        ` · cache-w ${formatTokens(suggestion.cost.tokens.cacheWrite)}`}
                                    {suggestion.cost.tokens.cacheRead > 0 &&
                                        ` · cache-r ${formatTokens(suggestion.cost.tokens.cacheRead)}`}
                                    {' · out '}
                                    {formatTokens(suggestion.cost.tokens.output)})
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="chat-input">
                <button
                    type="button"
                    onClick={requestSuggestion}
                    disabled={loading || !studyId}
                >
                    {suggestion ? '↻ Regenerate' : 'Suggest insight'}
                </button>
            </div>
        </div>
    );
}
