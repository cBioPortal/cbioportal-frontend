import * as React from 'react';
import { observer } from 'mobx-react';
import { ToolCallPart } from '../store/types';
import DisclosureBlock from './DisclosureBlock';
import styles from './ToolCallDisplay.module.scss';

interface ToolCallDisplayProps {
    part: ToolCallPart;
}

@observer
export default class ToolCallDisplay extends React.Component<
    ToolCallDisplayProps
> {
    private get isRunning(): boolean {
        const status = this.props.part.status;
        return status === 'running' || status === 'pending';
    }

    private get iconClassName(): string {
        if (this.isRunning) {
            return 'fa-solid fa-spinner fa-spin';
        }
        return this.props.part.status === 'error'
            ? 'fa-regular fa-circle-xmark'
            : 'fa-regular fa-circle-check';
    }

    private get title(): string {
        const { toolName } = this.props.part;
        return this.isRunning ? `Running ${toolName}` : `Ran ${toolName}`;
    }

    private formatValue(value: unknown): string {
        if (value === undefined || value === null) return '';
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    }

    render() {
        const { args, result } = this.props.part;
        const sent = this.formatValue(args);
        const received = this.formatValue(result);
        const showReceived = !this.isRunning && received.length > 0;

        return (
            <DisclosureBlock
                iconClassName={this.iconClassName}
                title={this.title}
            >
                <div className={styles.section}>
                    <div className={styles.label}>Sent</div>
                    <div className={styles.code}>{sent || '—'}</div>
                </div>
                {showReceived && (
                    <div className={styles.section}>
                        <div className={styles.label}>Received</div>
                        <div className={styles.code}>{received}</div>
                    </div>
                )}
            </DisclosureBlock>
        );
    }
}
