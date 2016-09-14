import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import Immutable from 'immutable';

export default class PurifyComponent extends React.Component {
    constructor(props) {
        super(props);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
    }

    render() {
        const newProps = {};

        Object.keys(this.props).forEach((key) => {
            if (key !== 'component') {
                if (Immutable.Iterable.isIterable(this.props[key])) {
                    newProps[key] = this.props[key].toJS();
                } else {
                    newProps[key] = this.props[key];
                }
            }
        });

        return <this.props.component {...newProps} />;
    }
}
