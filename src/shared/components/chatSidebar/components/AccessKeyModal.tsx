import * as React from 'react';
import { observer } from 'mobx-react';
import { Modal } from 'react-bootstrap';
import { ChatStore } from '../store/ChatStore';

interface AccessKeyModalProps {
    store: ChatStore;
}

interface AccessKeyModalState {
    inputValue: string;
}

@observer
export default class AccessKeyModal extends React.Component<
    AccessKeyModalProps,
    AccessKeyModalState
> {
    constructor(props: AccessKeyModalProps) {
        super(props);
        this.state = { inputValue: '' };
    }

    private handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ inputValue: e.target.value });
    };

    private handleSubmit = () => {
        const token = this.state.inputValue.trim();
        if (!token) return;
        this.props.store.saveAccessKey(token);
        this.setState({ inputValue: '' });
    };

    private handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') this.handleSubmit();
    };

    render() {
        const { store } = this.props;
        const canSubmit = !!this.state.inputValue.trim();

        return (
            <Modal show={store.needsKey} onHide={() => store.closeSidebar()}>
                <Modal.Header closeButton>
                    <Modal.Title>Enter Access Key</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        An access key is required to use the cBioPortal
                        Assistant. Contact your administrator to obtain one.
                    </p>
                    <input
                        type="password"
                        style={{
                            width: '100%',
                            padding: '8px',
                            boxSizing: 'border-box',
                        }}
                        placeholder="Paste your access key here"
                        value={this.state.inputValue}
                        onChange={this.handleChange}
                        onKeyDown={this.handleKeyDown}
                        autoFocus
                    />
                </Modal.Body>
                <Modal.Footer>
                    <button
                        onClick={() => store.closeSidebar()}
                        style={{ marginRight: '8px' }}
                    >
                        Cancel
                    </button>
                    <button disabled={!canSubmit} onClick={this.handleSubmit}>
                        Submit
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
}
