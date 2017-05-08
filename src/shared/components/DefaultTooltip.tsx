import * as React from 'react';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap_white.css';

export default class DefaultTooltip extends React.Component<Tooltip.Props, {}> {
    static readonly defaultProps = {
        mouseEnterDelay: 0.5,
        mouseLeaveDelay: 0.05,
        arrowContent: <div className="rc-tooltip-arrow-inner"/>,
    };
    render() {
        return (
            <Tooltip {...this.props}/>
        );
    }
}
