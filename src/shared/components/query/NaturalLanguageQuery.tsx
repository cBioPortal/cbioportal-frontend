import * as React from 'react';
import { observer } from 'mobx-react';
import { action, makeObservable, observable } from 'mobx';
import { getServerConfig } from 'config/config';
import { QueryStoreComponent } from './QueryStore';
import styles from './styles/styles.module.scss';

type Issue = { code: string; message: string; suggestion?: string };

type TranslateResponse = {
    oql?: string;
    explanation?: string[];
    warnings?: Issue[];
    error?: string;
    errors?: Issue[];
};

/**
 * Lets the user describe a query in plain language; the NL-to-OQL service translates it and the
 * result replaces the contents of the gene/OQL box.
 */
@observer
export default class NaturalLanguageQuery extends QueryStoreComponent<{}, {}> {
    @observable prompt = '';
    @observable busy = false;
    @observable result: TranslateResponse | null = null;

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    get serviceUrl(): string | null {
        const url = getServerConfig().nl_oql_service_url;
        return url ? url.replace(/\/+$/, '') : null;
    }

    /** The study is sent only when exactly one is selected, so the service can check its data types. */
    get studyId(): string | undefined {
        const ids = this.store.physicalStudyIdsInSelection;
        return ids.length === 1 ? ids[0] : undefined;
    }

    @action.bound
    onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        this.prompt = e.target.value;
    }

    @action.bound
    onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            this.translate();
        }
    }

    @action.bound
    async translate() {
        const prompt = this.prompt.trim();
        if (!prompt || !this.serviceUrl || this.busy) return;
        this.busy = true;
        this.result = null;
        let result: TranslateResponse;
        try {
            const res = await fetch(`${this.serviceUrl}/api/v1/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, studyId: this.studyId }),
            });
            result = await res.json();
        } catch (e) {
            result = {
                error: `Could not reach the translation service (${e})`,
            };
        }
        this.applyResult(result);
    }

    @action.bound
    applyResult(result: TranslateResponse) {
        this.busy = false;
        this.result = result;
        if (result.oql) {
            this.store.geneQuery = result.oql;
        }
    }

    render() {
        if (!this.serviceUrl) return null;
        const r = this.result;
        return (
            <div
                className={styles.naturalLanguageQuery}
                data-test="naturalLanguageQuery"
            >
                <label htmlFor="nlOqlPrompt">
                    Or describe your query in plain language
                </label>
                <textarea
                    id="nlOqlPrompt"
                    className="form-control"
                    rows={2}
                    value={this.prompt}
                    placeholder="e.g. KRAS G12C or STK11 truncating mutations, and MYC amplification"
                    onChange={this.onChange}
                    onKeyDown={this.onKeyDown}
                    data-test="nlOqlPrompt"
                />
                <div className={styles.naturalLanguageQueryActions}>
                    <button
                        type="button"
                        className="btn btn-default btn-sm"
                        disabled={this.busy || !this.prompt.trim()}
                        onClick={this.translate}
                        data-test="nlOqlTranslate"
                    >
                        {this.busy ? (
                            <>
                                <i className="fa fa-spinner fa-pulse" />{' '}
                                Translating…
                            </>
                        ) : (
                            'Translate to OQL'
                        )}
                    </button>
                    {this.studyId && (
                        <span className={styles.naturalLanguageQueryHint}>
                            Checked against {this.studyId}
                        </span>
                    )}
                </div>
                {r && r.oql && (
                    <ul
                        className={styles.naturalLanguageQueryExplanation}
                        data-test="nlOqlExplanation"
                    >
                        {(r.explanation || []).map((line, i) => (
                            <li key={i}>{line}</li>
                        ))}
                    </ul>
                )}
                {r && !r.oql && (
                    <div className="text-danger" data-test="nlOqlError">
                        {r.error}
                        {(r.errors || []).map((e, i) => (
                            <div key={i}>{e.message}</div>
                        ))}
                    </div>
                )}
                {r && r.warnings && r.warnings.length > 0 && (
                    <div className="text-warning" data-test="nlOqlWarnings">
                        {r.warnings.map((w, i) => (
                            <div key={i}>{w.message}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}
