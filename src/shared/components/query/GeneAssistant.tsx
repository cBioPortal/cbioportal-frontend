import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { observer } from 'mobx-react';
import { action, observable, makeObservable } from 'mobx';
import styles from './styles/styles.module.scss';
import { AssistantMessage, QueryStoreComponent } from './QueryStore';
import {
    isOqlTranslatorAvailable,
    OqlTranslation,
    translateToOql,
} from './oqlTranslator';

enum OQLError {
    io = 'Something went wrong, please try again',
}

// One reply per translation: the query and what it means, or why there is none.
function replyFor(translation: OqlTranslation): AssistantMessage {
    if (translation.kind === 'ok') {
        const lines = [
            ...translation.oql.split('\n').map(line => `\`${line}\``),
            ...translation.explanation,
            ...translation.warnings.map(w => `⚠️ ${w.message}`),
        ];
        return { speaker: 'AI', text: lines.join('\n'), oql: translation.oql };
    }
    if (translation.kind === 'rejected') {
        return { speaker: 'AI', text: translation.message };
    }
    return {
        speaker: 'AI',
        text: [
            translation.message,
            ...translation.errors.map(e => e.message),
        ].join('\n'),
    };
}

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className={styles.errorMessage}>{message}</div>
);

@observer
export default class GeneAssistant extends QueryStoreComponent<{}, {}> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @observable private available = false;
    @observable private userMessage = '';
    @observable private pending = false;
    @observable private showErrorMessage = false;
    @observable private errorMessage = OQLError.io;
    private examples = {
        'KRAS G12C or STK11 truncating mutations':
            'KRAS: MUT=G12C; STK11: TRUNC',
        'Somatic missense mutations in PIK3CA': 'PIK3CA: MISSENSE_SOMATIC',
        'MDM2 amplification or CDKN2A deep deletion':
            'MDM2: AMP; CDKN2A: HOMDEL',
    };

    componentDidMount() {
        isOqlTranslatorAvailable().then(
            action((available: boolean) => {
                this.available = available;
            })
        );
    }

    @action.bound
    private toggleSupport() {
        this.store.showSupport = !this.store.showSupport;
    }

    @action.bound
    private submitOQL(oql: string) {
        this.store.geneQuery = oql;
    }

    @action.bound
    private queryExample(example: string) {
        this.userMessage = example;
    }

    @action.bound
    private handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.userMessage = event.target.value;
    }

    @action.bound
    private handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!this.userMessage.trim()) return;

        const prompt = this.userMessage.trim();
        this.store.messages.push({
            speaker: 'User',
            text: prompt,
        });
        this.userMessage = '';
        this.getResponse(prompt);
    }

    @action.bound
    private async getResponse(prompt: string) {
        this.showErrorMessage = false;
        this.pending = true;
        try {
            const translation = await translateToOql(prompt);
            this.addReply(replyFor(translation));
        } catch (error) {
            this.showError(OQLError.io);
        }
    }

    @action.bound
    private addReply(reply: AssistantMessage) {
        this.pending = false;
        this.store.messages.push(reply);
    }

    @action.bound
    private showError(message: OQLError) {
        this.pending = false;
        this.showErrorMessage = true;
        this.errorMessage = message;
    }

    renderButton() {
        return (
            <button
                style={{ borderRadius: '8px', fontSize: '13px' }}
                className="btn btn-primary btn-lg"
                data-test="aiButton"
                onClick={this.toggleSupport}
            >
                {!this.store.showSupport ? (
                    <div>
                        <i
                            className="fa-solid fa-robot"
                            style={{ paddingRight: '5px' }}
                        />
                        Gene Assistant
                    </div>
                ) : (
                    <div>
                        <i
                            className="fa-solid fa-robot"
                            style={{ paddingRight: '5px' }}
                        />
                        Hide Assistant
                    </div>
                )}
            </button>
        );
    }

    renderThinking() {
        return (
            <div className={styles.thinking}>
                <span className={styles.dots}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                </span>
            </div>
        );
    }

    renderErrorMessage(error: string) {
        return <div className={styles.errorMessage}>{error}</div>;
    }

    renderMessages() {
        return (
            <div>
                {this.store.messages.map((msg, index) => {
                    const isUser = msg.speaker === 'User';
                    return (
                        <div
                            key={index}
                            className={
                                styles.messageRow +
                                (isUser ? ' ' + styles.messageRowRight : '')
                            }
                        >
                            <div
                                className={
                                    isUser ? styles.question : styles.message
                                }
                            >
                                {msg.text.split('\n').map((line, i) => (
                                    <div key={i} className={styles.messageLine}>
                                        <ReactMarkdown>{line}</ReactMarkdown>
                                    </div>
                                ))}
                            </div>
                            {msg.oql && (
                                <div>
                                    <button
                                        title="Use this query"
                                        onClick={() => this.submitOQL(msg.oql!)}
                                        style={{
                                            fontSize: '20px',
                                            color: '#3498db',
                                            marginRight: '8px',
                                            border: 0,
                                            background: 'none',
                                        }}
                                    >
                                        <i className="fa-solid fa-right-to-bracket"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    renderExamples() {
        return (
            <div className={styles.examplesarea}>
                <h2>
                    <i
                        className="fa-solid fa-lightbulb"
                        style={{ paddingRight: '10px' }}
                    />
                    Quick Examples:
                </h2>

                <div className={styles.examplestext}>
                    {Object.entries(this.examples).map(([example, genes]) => (
                        <div
                            key={example}
                            className={styles.exampleitem}
                            onClick={() => this.queryExample(example)}
                        >
                            <strong className={styles.exampletitle}>
                                {example}
                            </strong>
                            <span className={styles.exampledescription}>
                                {genes}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    render() {
        if (!this.available) {
            return null;
        }
        return (
            <div className={styles.supportContainer}>
                {this.renderButton()}
                {this.store.showSupport && (
                    <div className={styles.chatWindow}>
                        <section className={styles.titlearea}>
                            <img
                                src={require('../../../globalStyles/images/cbioportal_icon.png')}
                                className={styles.titleIcon}
                                alt="cBioPortal icon"
                            />
                            <span>cBioPortal Gene Assistant</span>
                        </section>

                        {this.renderExamples()}

                        <div className={styles.textarea}>
                            <div className={styles.textheader}>
                                Describe the genes and alterations to query in
                                plain language, and get an Onco Query Language
                                (OQL) query to use.
                            </div>
                            {this.renderMessages()}
                            {this.pending && this.renderThinking()}
                            {this.showErrorMessage && (
                                <ErrorMessage message={this.errorMessage} />
                            )}
                        </div>

                        <div className={styles.inputarea}>
                            <form
                                className={styles.form}
                                onSubmit={this.handleSendMessage}
                            >
                                <input
                                    className={styles.input}
                                    type="text"
                                    value={this.userMessage}
                                    onChange={this.handleInputChange}
                                    placeholder="e.g. KRAS G12C or STK11 truncating mutations"
                                />
                                <button
                                    type="submit"
                                    aria-hidden="true"
                                    style={{
                                        fontSize: '20px',
                                        color: '#3498db',
                                        marginRight: '8px',
                                        border: 0,
                                        background: 'none',
                                    }}
                                >
                                    <i className="fa-solid fa-paper-plane"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
