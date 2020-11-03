// this component comes from signal

import { observer } from 'mobx-react';
import Tooltip from 'rc-tooltip';
import * as React from 'react';

import 'rc-tooltip/assets/bootstrap_white.css';

interface IFrequencyCellProps {
    frequency: number | null;
    overlay?: () => JSX.Element;
}

@observer
class FrequencyCell extends React.Component<IFrequencyCellProps> {
    public render() {
        let content = this.mainContent();

        if (this.props.overlay) {
            content = (
                <Tooltip
                    mouseEnterDelay={0.5}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}
                    placement="right"
                    overlay={this.props.overlay}
                    destroyTooltipOnHide={true}
                >
                    {content}
                </Tooltip>
            );
        }

        return content;
    }

    private mainContent(): JSX.Element {
        const fractionDigits = 1;
        const fixed =
            this.props.frequency === null
                ? '-'
                : (this.props.frequency * 100).toFixed(fractionDigits);

        let displayValue = fixed;

        // if the actual value is not zero but the display value is like 0.00, then show instead < 0.01
        if (
            this.props.frequency !== null &&
            this.props.frequency !== 0 &&
            Number(fixed) === 0
        ) {
            displayValue = `< ${1 / Math.pow(10, fractionDigits)}`;
        }

        return <span className="pull-right mr-1">{displayValue}</span>;
    }
}

export default FrequencyCell;
