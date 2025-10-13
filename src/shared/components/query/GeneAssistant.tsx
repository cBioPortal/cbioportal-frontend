import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { observer } from 'mobx-react';
import { action, observable, makeObservable } from 'mobx';
import styles from './styles/styles.module.scss';
import internalClient from '../../../shared/api/cbioportalInternalClientInstance';
import { UserMessage } from 'cbioportal-ts-api-client/dist/generated/CBioPortalAPIInternal';
import { QueryStoreComponent } from './QueryStore';

enum OQLError {
    io = 'Something went wrong, please try again',
    invalid = 'Please submit a valid OQL question',
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
    @observable private userMessage = '';
    @observable private pending = false;
    @observable private showErrorMessage = false;
    @observable private errorMessage = OQLError.io;
    private examples = {
        'Find mutations in tumor suppressor genes': 'TP53, RB1, PTEN, APC',
        'Look for oncogene amplifications': 'MYC, ERBB2, EGFR',
        'Find KRAS mutations excluding silent ones': 'KRAS',
    };

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

        this.store.messages.push({
            speaker: 'User',
            text: this.userMessage,
        });
        this.getResponse();
        this.userMessage = '';
    }

    @action.bound
    private async getResponse() {
        this.showErrorMessage = false;
        this.pending = true;

        let userMessage = {
            message: this.userMessage,
        } as UserMessage;

        try {
            const response = await internalClient.getSupportUsingPOST({
                userMessage,
            });
            const parts = response.aiResponse.split('OQL: ', 2);

            if (parts.length < 2 || parts[1].trim().toUpperCase() === 'FALSE') {
                this.showErrorMessage = true;
                this.errorMessage = OQLError.invalid;
            } else {
                this.store.messages.push({
                    speaker: 'AI',
                    text: parts[0].trim(),
                });
            }
            this.pending = false;
        } catch (error) {
            this.pending = false;
            this.showErrorMessage = true;
            this.errorMessage = OQLError.io;
        }
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
                                    <p key={i} className={styles.messageLine}>
                                        <ReactMarkdown key={i}>
                                            {line}
                                        </ReactMarkdown>
                                    </p>
                                ))}
                            </div>
                            {!isUser && index !== 0 && (
                                <div>
                                    <button
                                        onClick={() => this.submitOQL(msg.text)}
                                        style={{
                                            fontSize: '20px',
                                            color: '#3498db',
                                            marginRight: '8px',
                                            border: 0,
                                            background: 'none',
                                        }}
                                    >
                                        <i className="fa-solid fa-share"></i>
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
                                Please ask your cBioPortal querying questions
                                here, for example how to correctly format a
                                query using Onco Query Language (OQL).
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
                                    placeholder="Ask me about genes, cancer types or OQL syntax!"
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
