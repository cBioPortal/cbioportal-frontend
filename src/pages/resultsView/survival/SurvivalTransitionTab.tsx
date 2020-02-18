import * as React from 'react';
import { observer } from 'mobx-react';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import Timer = NodeJS.Timer;
import { autorun, IReactionDisposer, observable } from 'mobx';
import { ResultsViewTab } from '../ResultsViewPageHelpers';

export interface ISurvivalTransitionTabProps {
    store: ResultsViewPageStore;
}

const REDIRECT_TIME = 3;

@observer
export default class SurvivalTransitionTab extends React.Component<
    ISurvivalTransitionTabProps,
    {}
> {
    @observable private redirectTimer: number;
    private redirectInterval: Timer | null = null;
    private tabVisibleReaction: IReactionDisposer;

    constructor(props: ISurvivalTransitionTabProps) {
        super(props);
        this.tabVisibleReaction = autorun(() => {
            if (
                this.redirectInterval === null &&
                this.props.store.urlWrapper.tabId === ResultsViewTab.SURVIVAL
            ) {
                // If no redirect is pending, and we find ourselves on survival tab, then initiate a redirect.
                this.redirectTimer = REDIRECT_TIME;
                this.redirectInterval = setInterval(() => {
                    this.redirectTimer -= 1;
                    if (this.redirectTimer === 0) {
                        // when the timer reaches 0, navigate to survival tab and clear interval
                        this.clearPendingRedirect();
                        this.props.store.navigateToSurvivalTab();
                    }
                }, 1000);
            } else if (this.props.store.urlWrapper.tabId !== ResultsViewTab.SURVIVAL) {
                // If user navigates away from this tab, clear any pending redirect
                this.clearPendingRedirect();
            }
        });
    }

    componentWillUnmount() {
        this.tabVisibleReaction();
        this.clearPendingRedirect();
    }

    private clearPendingRedirect() {
        clearInterval(this.redirectInterval as any);
        this.redirectInterval = null;
    }

    render() {
        return (
            <div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    Survival analysis has moved to the Comparison tab.
                </div>
                <br />
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    Redirecting you in&nbsp;<b>{this.redirectTimer}</b>... or{' '}
                    {
                        <button
                            className="btn btn-md btn-primary"
                            onClick={this.props.store.navigateToSurvivalTab}
                            style={{
                                marginLeft: 6,
                                paddingLeft: 5,
                                paddingRight: 5,
                                paddingTop: 2,
                                paddingBottom: 2,
                            }}
                        >
                            Click here to go there now.
                        </button>
                    }
                </div>
            </div>
        );
    }
}
