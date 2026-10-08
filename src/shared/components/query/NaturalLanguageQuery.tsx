import * as React from 'react';
import { observer } from 'mobx-react';
import { action, makeObservable, observable } from 'mobx';
import { getServerConfig } from 'config/config';
import { QueryStoreComponent } from './QueryStore';
import styles from './styles/styles.module.scss';

type Issue = { code: string; message: string; suggestion?: string };

type TranslateResponse = {
    oql?: string;
    checkedStudies?: string[];
    rejected?: boolean;
    warnings?: Issue[];
    error?: string;
    errors?: Issue[];
};

/**
 * Collapsed by default to a small toggle above the gene/OQL box. When opened, the user describes
 * a query in plain language; the NL-to-OQL service translates it and the result replaces the
 * contents of the gene/OQL box.
 */
@observer
export default class NaturalLanguageQuery extends QueryStoreComponent<{}, {}> {
    @observable open = false;
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

    /** All selected studies are sent so the service can check they have the data each alteration needs. */
    get studyIds(): string[] {
        return this.store.physicalStudyIdsInSelection;
    }

    /** Which studies the returned query was checked against, once a translation succeeded. */
    get checkedLabel(): { text: string; title: string } | null {
        const ids = this.result?.oql ? this.result.checkedStudies || [] : [];
        if (!ids.length) return null;
        return {
            text:
                ids.length === 1
                    ? `Checked against ${ids[0]}`
                    : `Checked against ${ids.length} studies`,
            title: ids.join(', '),
        };
    }

    @action.bound
    toggle() {
        this.open = !this.open;
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
                body: JSON.stringify({ prompt, studyIds: this.studyIds }),
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
        if (!this.open) {
            return (
                <button
                    type="button"
                    className={`btn btn-link btn-xs ${styles.naturalLanguageQueryToggle}`}
                    onClick={this.toggle}
                    data-test="nlOqlToggle"
                >
                    <i className="fa fa-magic" /> Try AI-powered OQL wizard
                </button>
            );
        }
        const r = this.result;
        return (
            <div
                className={styles.naturalLanguageQuery}
                data-test="naturalLanguageQuery"
            >
                <div className={styles.naturalLanguageQueryHeader}>
                    <label htmlFor="nlOqlPrompt">
                        Describe your query in plain language
                    </label>
                    <button
                        type="button"
                        className="btn btn-link btn-xs"
                        onClick={this.toggle}
                        title="Close the OQL wizard"
                        data-test="nlOqlClose"
                    >
                        <i className="fa fa-times" />
                    </button>
                </div>
                <textarea
                    id="nlOqlPrompt"
                    className="form-control"
                    rows={2}
                    value={this.prompt}
                    placeholder="e.g. KRAS G12C or STK11 truncating mutations, and MYC amplification"
                    onChange={this.onChange}
                    onKeyDown={this.onKeyDown}
                    autoFocus
                    data-test="nlOqlPrompt"
                />
                <div className={styles.naturalLanguageQueryActions}>
                    <button
                        type="button"
                        className="btn btn-default btn-xs"
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
                    {this.checkedLabel && (
                        <span
                            className={styles.naturalLanguageQueryHint}
                            title={this.checkedLabel.title}
                            data-test="nlOqlChecked"
                        >
                            {this.checkedLabel.text}
                        </span>
                    )}
                </div>
                {r && r.rejected && (
                    <div
                        className={styles.naturalLanguageQueryHint}
                        data-test="nlOqlRejected"
                    >
                        {r.error}
                    </div>
                )}
                {r && !r.oql && !r.rejected && (
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
