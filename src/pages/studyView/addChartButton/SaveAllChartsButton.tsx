import * as React from 'react';
import { observer } from 'mobx-react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';
import { PageUserSession, isConfigured } from 'shared/userSession/PageUserSession';
import { StudyPageSettings } from 'shared/api/session-service/sessionServiceModels';

type SaveAllChartsButtonProps = {
    isLoggedIn: boolean;
    pageUserSession?: PageUserSession<StudyPageSettings>;
}

@observer
export default class SaveAllChartsButton extends React.Component<SaveAllChartsButtonProps> {
    render() {
        const isDirty = this.props.pageUserSession?.isDirty??false;
        const enabled = this.props.isLoggedIn && isDirty;
        
        return (
                <DefaultTooltip
                    overlay={createTooltipMsg(
                        this.props.isLoggedIn,
                        isDirty,
                        this.isDefaultState()
                    )}
                >
                    <button
                        id="save-oncoprint-config-to-session"
                        style={{
                            width: 'fit-content',
                            position: 'relative',
                            zIndex: 2,
                        }}
                        className={`btn btn-primary btn-xs pull-right ${
                            enabled ? '' : 'disabled'
                        }`}
                        onClick={() => {
                            this.props.pageUserSession?.saveUserSession();
                        }}
                    >
                        <i
                            className={`fa ${
                                this.isDefaultState() || isDirty
                                    ? 'fa-thumb-tack'
                                    : 'fa-check-square'
                            }`}
                            aria-hidden="true"
                        />{' '}
                        {this.isDefaultState() || isDirty
                            ? 'Save charts'
                            : 'Charts saved'}
                    </button>
                </DefaultTooltip>
        );
    }

        /**
     * Are user settings equal to configured defaults?
     */
    private isDefaultState() {
        const sameConfig =
            JSON.stringify(this.props.pageUserSession?.userSettings) ===
            getServerConfig().oncoprint_clinical_tracks_config_json;
        const bothEmpty =
            !isConfigured(this.props.pageUserSession?.userSettings) &&
            !isConfigured(
                getServerConfig().oncoprint_clinical_tracks_config_json
            );
        return sameConfig || bothEmpty;
    }
}

function createTooltipMsg(
    isLoggedIn: boolean,
    isDirty: boolean,
    defaultState: boolean
) {
    let msg = '';
    if (defaultState || (isLoggedIn && isDirty)) {
        msg = 'Save charts.';
    } else if (isLoggedIn && !isDirty) {
        msg = 'All changes saved.';
    } else if (!isLoggedIn) {
        msg = 'Log in to save charts.';
    }
    return `${msg} The currently visible charts will be shown by default for future queries in the same study/studies.`;
}
