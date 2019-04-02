import * as React from "react";
import {observer} from "mobx-react";
import LoadingIndicator from "../../shared/components/loadingIndicator/LoadingIndicator";
import {AppStore} from "../../AppStore";
import {computed} from "mobx";

export interface IGroupComparisonLoadingProps {
    routing:any;
    appStore:AppStore;
}

export type GroupComparisonLoadingParams = {
    phase:LoadingPhase,
    clinicalAttributeName:string;
}

export enum LoadingPhase {
    DOWNLOADING_GROUPS="downloading",
    CREATING_SESSION="creating_session"
}

@observer
export default class GroupComparisonLoading extends React.Component<IGroupComparisonLoadingProps, {}> {
    @computed get message() {
        const ret:JSX.Element[] = [];
        const query = (window as any).routingStore.location.query as Partial<GroupComparisonLoadingParams>;
        ret.push(<div><span style={{fontWeight:"bold"}}>Do not close the window you came from.</span></div>);
        switch (query.phase) {
            case LoadingPhase.DOWNLOADING_GROUPS:
                if (query.clinicalAttributeName) {
                    ret.push(<div>Loading each subgroup of <span style={{whiteSpace:"nowrap"}}>{query.clinicalAttributeName}..</span></div>);
                } else {
                    ret.push(<div>Creating groups..</div>);
                }
                break;
            case LoadingPhase.CREATING_SESSION:
                ret.push(<div>Groups loaded.</div>);
                ret.push(<div>Creating comparison session..</div>);
                break;
            default:
                ret.push(<div>Redirecting you to the Comparison page...</div>);
        }
        return ret;
    }

    render() {
        return (
            <LoadingIndicator center={true} isLoading={true} size="big">
                <div style={{marginTop:20}}>
                    {this.message}
                </div>
            </LoadingIndicator>
        );
    }
}