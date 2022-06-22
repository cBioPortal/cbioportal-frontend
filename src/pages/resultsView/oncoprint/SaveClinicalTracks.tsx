import * as React from 'react';
import { ResultsViewPageStore } from 'pages/resultsView/ResultsViewPageStore';
import { observer } from 'mobx-react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

type SaveClinicalStracksProps = {
    store: ResultsViewPageStore;
    isEnabled: boolean;
};

@observer
export default class SaveClinicalTracks extends React.Component<
    SaveClinicalStracksProps
> {
    constructor(props: SaveClinicalStracksProps) {
        super(props);
    }

    render() {
        return (
            <>
                <DefaultTooltip overlay="Store clinical tracks for the current selected studies">
                    <button
                        id="save-oncoprint-config-to-session"
                        style={{
                            width: 'fit-content',
                            position: 'relative',
                            zIndex: 2,
                        }}
                        className="btn btn-primary btn-xs pull-right"
                        onClick={() => {
                            this.props.store.pageUserSession.saveUserSession();
                        }}
                        disabled={!this.props.isEnabled}
                    >
                        <i className="fa fa-thumb-tack" aria-hidden="true" />{' '}
                        Save tracks
                    </button>
                </DefaultTooltip>
            </>
        );
    }
}
