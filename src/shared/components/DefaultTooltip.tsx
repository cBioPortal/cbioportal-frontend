import * as React from 'react';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap_white.css';

export default class DefaultTooltip extends React.Component<Tooltip.Props, {}> {
    render() {
        const defaultProps = {
            mouseEnterDelay:0.5,
            mouseLeaveDelay:0.05,
            arrowContent:(<div className="rc-tooltip-arrow-inner"/>)
        };
        return (
            <Tooltip {...Object.assign({}, defaultProps, this.props)}>
                {this.props.children}
            </Tooltip>
        );
    }
}