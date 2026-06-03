import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownMessageProps {
    content: string;
}

export default class MarkdownMessage extends React.Component<
    MarkdownMessageProps
> {
    render() {
        return (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {this.props.content}
            </ReactMarkdown>
        );
    }
}
