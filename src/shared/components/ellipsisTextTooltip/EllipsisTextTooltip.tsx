import * as React from 'react';
import {observable} from 'mobx';
import {observer} from "mobx-react";
import styles from "./EllipsisTextTooltip.module.scss";
import DefaultTooltip from "../defaultTooltip/DefaultTooltip";

@observer
export default class EllipsisTextTooltip extends React.Component<{ content: string }, {}> {
    @observable disabled = false;
    private contentRef: any;

    constructor(props: { content: string }) {
        super(props);
    }

    componentDidMount(): void {
        if (this.contentRef.offsetWidth === this.contentRef.scrollWidth) {
            this.disabled = true;
        }
    }

    render() {
        return <DefaultTooltip
            overlay={() => <span>{this.props.content}</span>}
            trigger={['hover']}
            disabled={this.disabled}
        >
            <span className={styles.text} ref={(node) => {
                this.contentRef = node;
            }}>{this.props.content}</span>
        </DefaultTooltip>
    }
}