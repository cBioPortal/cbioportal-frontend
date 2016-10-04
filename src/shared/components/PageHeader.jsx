import React, { PropTypes as T } from 'react';

class PageHeader extends React.Component {

    handleSubmit(e) {
        e.preventDefault();
        this.props.changeRoute(this.routeInput.value);
    }

    render() {
        return (
            <header className="clearfix">
                <h1 className="pull-left">cBioPortal.com</h1>
                <div className="pull-right">
                    <form className="form-inline" onSubmit={(e) => this.handleSubmit(e)}>
                        <div className="form-group">
                                <input className="form-control" defaultValue={this.props.currentRoutePath} ref={(c) => { this.routeInput = c; }} />
                        </div>
                    </form>
                </div>
            </header>
        );
    }
}

PageHeader.propTypes = {
    changeRoute: T.func.isRequired,
    currentRoutePath: T.string.isRequired
};

export default PageHeader;








