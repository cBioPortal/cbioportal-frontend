import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { RiInformation2Fill } from 'react-icons/ri';

export interface IInfoIconProps {
    tooltip: JSX.Element;
    tooltipPlacement?: string;
    style?: any;
    divStyle?: any;
}

export default class InfoIcon extends React.Component<IInfoIconProps, {}> {
    render() {
        return (
            <DefaultTooltip
                overlay={this.props.tooltip}
                placement={this.props.tooltipPlacement || 'right'}
            >
                <div style={this.props.divStyle}>
                    {React.createElement(RiInformation2Fill as any, {
                        style: Object.assign(
                            {},
                            {
                                color: '#000000',
                                cursor: 'pointer',
                            },
                            this.props.style || {}
                        ),
                        'data-test': 'infoIcon',
                    })}
                </div>
            </DefaultTooltip>
        );
    }
}
