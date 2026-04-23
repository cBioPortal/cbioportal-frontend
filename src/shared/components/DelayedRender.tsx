import * as React from 'react';

export default class DelayedRender extends React.Component<
    { children?: React.ReactNode },
    {}
> {
    shouldComponentUpdate() {
        setTimeout(() => this.forceUpdate(), 0);
        return false;
    }
    render() {
        return this.props.children;
    }
}
