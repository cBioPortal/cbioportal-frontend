import * as React from 'react';
import DisclosureBlock from './DisclosureBlock';
import styles from './ReasoningBlock.module.scss';

interface ReasoningBlockProps {
    text: string;
    done: boolean;
}

export default class ReasoningBlock extends React.Component<
    ReasoningBlockProps
> {
    render() {
        const { text, done } = this.props;
        return (
            <DisclosureBlock
                iconClassName="fa-regular fa-lightbulb"
                title={done ? 'Thoughts' : 'Thinking...'}
            >
                <div className={styles.text}>{text}</div>
            </DisclosureBlock>
        );
    }
}
