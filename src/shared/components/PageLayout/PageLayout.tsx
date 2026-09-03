import * as React from 'react';
import classNames from 'classnames';
import { inject } from 'mobx-react';
import { AppStore } from '../../../AppStore';
import PortalFooter from '../../../appShell/App/PortalFooter';
import { RFC80Test } from 'shared/components/rfc80Tester';
import {
    setCurrentPageStore,
    clearCurrentPageStore,
} from 'shared/components/chatSidebar/currentPageStore';

interface IPageLayout {
    rightBar?: any;
    className?: string;
    noMargin?: boolean;
    appStore?: AppStore;
    hideFooter?: boolean;
    children?: React.ReactNode;
    // Lets the chat sidebar read "what's on screen" without prop-drilling
    // through Container/the router.
    pageStore?: unknown;
}

@inject('appStore')
export class PageLayout extends React.Component<IPageLayout, {}> {
    componentDidMount() {
        if (this.props.pageStore) {
            setCurrentPageStore(this.props.pageStore);
        }
    }

    componentDidUpdate(prevProps: IPageLayout) {
        if (prevProps.pageStore !== this.props.pageStore) {
            if (prevProps.pageStore) {
                clearCurrentPageStore(prevProps.pageStore);
            }
            if (this.props.pageStore) {
                setCurrentPageStore(this.props.pageStore);
            }
        }
    }

    componentWillUnmount() {
        if (this.props.pageStore) {
            clearCurrentPageStore(this.props.pageStore);
        }
    }

    render() {
        const noMargin = this.props.noMargin ? 'noMargin' : '';

        return (
            <div className={'mainContainer'}>
                <div
                    className={classNames(
                        'contentWidth',
                        this.props.className,
                        noMargin
                    )}
                >
                    <main id="mainColumn" data-tour="mainColumn">
                        <div>{this.props.children}</div>
                    </main>
                    {this.props.rightBar && (
                        <div id="rightColumn">{this.props.rightBar}</div>
                    )}
                </div>

                {!this.props.hideFooter && (
                    <PortalFooter appStore={this.props.appStore!} />
                )}

                {localStorage.rfc80 && <RFC80Test />}
            </div>
        );
    }
}
