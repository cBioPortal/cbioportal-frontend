import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import './footer.scss';
import _ from 'lodash';
import { AppStore } from '../../AppStore';
import { observer } from 'mobx-react';
import { action, observable, makeObservable } from 'mobx';
import styles from './support.module.scss';
import internalClient from '../../shared/api/cbioportalInternalClientInstance';
import { SupportMessage } from 'cbioportal-ts-api-client/dist/generated/CBioPortalAPIInternal';

@observer
export default class PortalSupport extends React.Component<{
    appStore: AppStore;
}> {
    @observable private userInput = '';
    @observable private pending = false;
    @observable private showErrorMessage = false;

    constructor(props: { appStore: AppStore }) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private toggleSupport() {
        this.props.appStore.showSupport = !this.props.appStore.showSupport;
    }

    @action.bound
    private handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.userInput = event.target.value;
    }

    @action.bound
    private handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!this.userInput.trim()) return;

        this.props.appStore.messages.push({
            speaker: 'User',
            text: this.userInput,
        });
        this.getResponse();
        this.userInput = '';
    }

    @action.bound
    private async getResponse() {
        this.showErrorMessage = false;
        this.pending = true;

        let supportMessage = {
            message: this.userInput,
        } as SupportMessage;

        try {
            const response = await internalClient.getSupportUsingPOST({
                supportMessage,
            });
            this.props.appStore.messages.push({
                speaker: 'AI',
                text: response.answer,
            });
            this.pending = false;
        } catch (error) {
            this.pending = false;
            this.showErrorMessage = true;
        }
    }

    renderButton() {
        return (
            <button
                style={{ width: '64px', height: '64px', borderRadius: '20px' }}
                className="btn btn-primary btn-lg"
                data-test="aiButton"
                onClick={this.toggleSupport}
            >
                {!this.props.appStore.showSupport ? (
                    <i className="fa fa-comment" style={{ fontSize: '32px' }} />
                ) : (
                    <i
                        className="fa fa-angle-down"
                        style={{ fontSize: '32px' }}
                    />
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

    renderErrorMessage() {
        return (
            <div className={styles.error}>
                Something went wrong, please try again.
            </div>
        );
    }

    renderMessages() {
        return (
            <div>
                {this.props.appStore.messages.map((msg, index) => {
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
                        </div>
                    );
                })}
            </div>
        );
    }

    render() {
        return (
            <div className={styles.supportContainer}>
                {this.props.appStore.showSupport && (
                    <div className={styles.chatWindow}>
                        <section className={styles.titlearea}>
                            <img
                                src={require('./cbioportal_icon.png')}
                                className={styles.titleIcon}
                                alt="cBioPortal Icon"
                            />
                            <span>cBioPortal Support</span>
                        </section>

                        <div className={styles.textarea}>
                            <div className={styles.textheader}>
                                Please ask your cBioPortal related questions
                                here, for example how to correctly format a
                                query using Onco Query Language (OQL).
                            </div>
                            {this.renderMessages()}
                            {this.pending && this.renderThinking()}
                            {this.showErrorMessage && this.renderErrorMessage()}
                        </div>

                        <div className={styles.inputarea}>
                            <form
                                className={styles.form}
                                onSubmit={this.handleSendMessage}
                            >
                                <input
                                    className={styles.input}
                                    type="text"
                                    value={this.userInput}
                                    onChange={this.handleInputChange}
                                    placeholder="Type a message"
                                />
                                <button
                                    type="submit"
                                    className="fa fa-paper-plane"
                                    aria-hidden="true"
                                    style={{
                                        fontSize: '20px',
                                        color: '#3498db',
                                        marginRight: '8px',
                                        border: 0,
                                        background: 'none',
                                    }}
                                />
                            </form>
                        </div>
                    </div>
                )}
                {this.renderButton()}
            </div>
        );
    }
}
