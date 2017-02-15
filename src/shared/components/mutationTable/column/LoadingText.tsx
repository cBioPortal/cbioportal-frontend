import * as React from 'react';

export default class LoadingText extends React.Component<{},{}> {
    public render() {
        return (<span
                    style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                    alt="Querying server for data."
                >
                    LOADING
                </span>);
    }
}