import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import browser from 'detect-browser';
import PageHeader from '../../pages/pageHeader/PageHeader';
import UnsupportedBrowserModal from "shared/components/unsupportedBrowserModal/UnsupportedBrowserModal";

import '../../globalStyles/prefixed-global.scss';

interface IContainerProps {
    location: Location;
    children: React.ReactNode;
}

export default class Container extends React.Component<IContainerProps, {}> {

    context: {router: any};

    componentDidMount() {

        const headerNode = document.getElementById("reactHeader");
        if (headerNode !== null) {
            ReactDOM.render(<PageHeader router={this.context.router} currentRoutePath={ this.props.location.pathname } />,
                headerNode);
        }

    }

    renderChildren() {
        const childProps = {...this.props};
        const {children} = this.props;
        return React.Children.map(children,
            c => React.cloneElement(c as React.ReactElement<any>, childProps));
    }

    render() {
        return (
            <div>
                <div>
                    <UnsupportedBrowserModal/>
                    {this.renderChildren()}
                </div>
            </div>
        );
    }
}