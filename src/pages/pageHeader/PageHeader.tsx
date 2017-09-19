import * as React from 'react';
import './styles.scss';

interface IPageHeaderProps {
    router: any;
    currentRoutePath: string;
}

export default class PageHeader extends React.Component<IPageHeaderProps, {}> {

    routeInput: HTMLInputElement;

    handleSubmit(e:React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        this.props.router.push(this.routeInput.value);
    }

    render() {
        return (
            <header className="clearfix">
                <h1 className="pull-left">cBioPortal.org</h1>
                <div className="pull-right">
                    <form className="form-inline" onSubmit={(e) => this.handleSubmit(e)}>
                        <div className="form-group">
                                <input className="form-control" defaultValue={this.props.currentRoutePath} ref={(c:HTMLInputElement) => { this.routeInput = c; }} />
                        </div>
                    </form>
                </div>
            </header>
        );
    }
}
