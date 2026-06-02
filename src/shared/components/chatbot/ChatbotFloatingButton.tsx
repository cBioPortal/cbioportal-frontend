import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import ChatbotModal from './ChatbotModal';

@observer
export default class ChatbotFloatingButton extends React.Component<{}, {}> {
    @observable showSidebar = false;

    constructor(props: {}) {
        super(props);
        makeObservable(this);
    }

    @autobind
    handleToggle() {
        this.showSidebar = !this.showSidebar;
    }

    @autobind
    handleClose() {
        this.showSidebar = false;
    }

    render() {
        return (
            <>
                {!this.showSidebar && (
                    <button
                        onClick={this.handleToggle}
                        style={{
                            position: 'fixed',
                            bottom: '20px',
                            right: '20px',
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            cursor: 'pointer',
                            fontSize: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1051,
                            transition:
                                'transform 0.2s ease, box-shadow 0.2s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow =
                                '0 6px 16px rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow =
                                '0 4px 12px rgba(0, 0, 0, 0.15)';
                        }}
                        title="Open AI Assistant"
                        data-test="chatbot-floating-button"
                    >
                        <i className="fa fa-comments" />
                    </button>
                )}

                <ChatbotModal
                    show={this.showSidebar}
                    onHide={this.handleClose}
                />
            </>
        );
    }
}
