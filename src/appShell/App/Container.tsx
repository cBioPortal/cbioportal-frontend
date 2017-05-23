import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import PageHeader from '../../pages/pageHeader/PageHeader';

import '../../globalStyles/prefixed-global.scss';

interface IContainerProps {
    location: Location;
    children: React.ReactNode;
}

export default class Container extends React.Component<IContainerProps, void> {

    static contextTypes = {
        router: React.PropTypes.object,
    };

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
                    {this.renderChildren()}
                </div>
            </div>
        );
    }
}

