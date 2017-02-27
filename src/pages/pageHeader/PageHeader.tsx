import * as React from 'react';
import './styles.scss';
import {StateToggle} from "../../shared/components/ExperimentalControls";
import devMode from "../../shared/lib/devMode";
import {observer} from "mobx-react";

interface IPageHeaderProps {
    router: any;
    currentRoutePath: string;
}

@observer
export default class PageHeader extends React.Component<IPageHeaderProps, void> {

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
                                <input className="form-control" defaultValue={this.props.currentRoutePath} ref={(c) => { this.routeInput = c; }} />
                        </div>
                    </form>
					<StateToggle label='Show work in progress' style={{color: 'white'}} target={devMode} name='enabled' defaultValue={devMode.enabled}/>
                </div>
            </header>
        );
    }
}
