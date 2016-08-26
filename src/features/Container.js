import React, { PropTypes as T } from 'react';

export class Container extends React.Component {
    renderChildren() {
        const childProps = {
            ...this.props
        };
        const {children} = this.props;
        return React.Children.map(children,
              c => React.cloneElement(c, childProps));
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

Container.contextTypes = {
    router: T.object
};

export default Container;
