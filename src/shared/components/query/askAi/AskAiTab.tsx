import * as React from 'react';
import { getBrowserWindow } from 'cbioportal-frontend-commons';

const AskAiTab: React.FunctionComponent = () => {
    const [text, setText] = React.useState('');

    const submit = () => {
        if (!text.trim()) {
            return;
        }
        getBrowserWindow().globalStores.chatStore.sendMessage(text);
        setText('');
    };

    return (
        <div style={{ padding: 20, maxWidth: 600 }}>
            <p>
                Ask a question in plain language (e.g. "show me TP53
                mutations in lung TCGA studies") and the assistant will take
                you to the right page.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
                <textarea
                    style={{ flex: 1, height: 60, padding: 8 }}
                    value={text}
                    placeholder="What would you like to explore?"
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            submit();
                        }
                    }}
                />
                <button onClick={submit} disabled={!text.trim()}>
                    Ask AI
                </button>
            </div>
        </div>
    );
};

export default AskAiTab;
