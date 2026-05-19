import { useEffect, useMemo, useRef, useState } from 'react';
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

type Preset = 'keyFinding' | 'cohort' | 'limitations';

const PRESETS: { id: Preset; label: string }[] = [
    { id: 'keyFinding', label: 'Key finding' },
    { id: 'cohort', label: 'Cohort' },
    { id: 'limitations', label: 'Limitations' },
];

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

export function App() {
    const studyId = useMemo(() => getQueryParam('studyId'), []);
    const apiRoot = useMemo(() => getQueryParam('apiRoot') ?? '/', []);
    const genes = useMemo(() => {
        const raw = getQueryParam('genes');
        return raw ? raw.split(',').filter(Boolean) : [];
    }, []);
    const tab = useMemo(() => getQueryParam('tab'), []);

    const [study, setStudy] = useState<Study | null>(null);
    const [studyError, setStudyError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<SuggestResponse | null>(null);
    const [suggestError, setSuggestError] = useState<string | null>(null);
    const [activePreset, setActivePreset] = useState<Preset | null>(null);
    const autoRunRef = useRef(false);

    useEffect(() => {
        if (!studyId || autoRunRef.current) return;
        autoRunRef.current = true;
        requestSuggestion('keyFinding');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studyId]);

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

    const requestSuggestion = async (preset: Preset) => {
        if (!studyId) return;
        setActivePreset(preset);
        setLoading(true);
        setSuggestError(null);
        setSuggestion(null);
        try {
            const r = await fetch('/api/chat/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studyId, genes, tab, preset }),
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
                        {suggestion?.paper?.paperUrl ? (
                            <a
                                href={suggestion.paper.paperUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                            >
                                {study.name} ↗
                            </a>
                        ) : (
                            study.name
                        )}
                    </div>
                )}
                {studyError && <div className="error">{studyError}</div>}
            </header>

            <section className="ask-prompts" aria-label="Ask about the current view">
                <div className="ask-prompts-label muted">
                    Based on the paper and query:
                </div>
                <div className="ask-prompts-row">
                    {PRESETS.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            className={
                                'preset-btn' +
                                (activePreset === p.id ? ' active' : '')
                            }
                            onClick={() => requestSuggestion(p.id)}
                            disabled={loading || !studyId}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </section>

            <div className="chat-messages">
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
        </div>
    );
}
