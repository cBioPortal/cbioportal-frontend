import * as React from 'react';
import { components } from 'react-select';

export default class OptimizedOption extends React.Component<any> {
    public render() {
        delete this.props.innerProps.onMouseMove;
        delete this.props.innerProps.onMouseOver;

        return (
            <components.Option {...this.props}>
                {this.props.children}
            </components.Option>
        );
    }
}
