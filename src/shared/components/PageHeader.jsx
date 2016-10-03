import React, { PropTypes as T } from 'react';

class PageHeader extends React.Component {

    render() {
        return (
            <header className="clearfix">
                <h1 className="pull-left">cBioPortal.com</h1>



                <div className="pull-right">


                    <form className="form-inline" onSubmit={(e) => e.preventDefault()}>
                        <div className="form-group">
                                <input className="form-control" defaultValue={this.props.currentRoutePath} onBlur={(event) => this.props.changeRoute(event.target.value)} />
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








