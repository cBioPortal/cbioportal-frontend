import * as React from 'react';
import styles from './DisclosureBlock.module.scss';

interface DisclosureBlockProps {
    // Font Awesome classes for the leading icon (e.g. 'fa-regular fa-lightbulb').
    iconClassName: string;
    title: React.ReactNode;
    children: React.ReactNode;
}

// Collapsible <details> card used by the reasoning and tool-call blocks.
export default class DisclosureBlock extends React.Component<
    DisclosureBlockProps
> {
    render() {
        const { iconClassName, title, children } = this.props;
        return (
            <details className={styles.block}>
                <summary className={styles.summary}>
                    <span className={`${iconClassName} ${styles.icon}`} />
                    <span className={styles.title}>{title}</span>
                    <span
                        className={`fa-solid fa-chevron-down ${styles.chevron}`}
                    />
                </summary>
                <div className={styles.content}>{children}</div>
            </details>
        );
    }
}
