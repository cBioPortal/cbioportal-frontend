import * as React from 'react';
import { observer } from 'mobx-react';

interface ScrollWrapperProps {
    children: React.ReactNode;
    plotElementWidth: number;
    assignDummyScrollPaneRef: (el: HTMLDivElement) => void;
}

@observer
export default class ScrollWrapper extends React.Component<
    ScrollWrapperProps,
    {}
> {
    render() {
        return (
            <div
                className="dummyScrollDiv scrollbarAlwaysVisible"
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: this.props.plotElementWidth,
                    overflow: 'scroll',
                    marginTop: 35,
                    marginBottom: -25, // reduce excessive padding caused by the marginTop
                    zIndex: 1, // make sure it receives mouse even though marginBottom pulls the plot on top of it
                }}
                ref={this.props.assignDummyScrollPaneRef}
            >
                <div
                    style={{
                        minWidth: this.props.plotElementWidth - 8, // subtract 8 due to the pseudo-scrollbar element adding bulk
                        height: 1,
                    }}
                />
            </div>
        );
    }
}
