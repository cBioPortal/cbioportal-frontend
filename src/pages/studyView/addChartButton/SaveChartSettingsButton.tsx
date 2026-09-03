import * as React from 'react';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import { observer } from 'mobx-react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

type SaveChartSettingsButtonProps = {
    store: StudyViewPageStore;

    // User is logged in
    isLoggedIn: boolean;

    // Chart settings have unsaved changes
    isDirty: boolean;
};

@observer
export default class SaveChartSettingsButton extends React.Component<SaveChartSettingsButtonProps> {
    render() {
        const enabled = this.props.isDirty && this.props.isLoggedIn;
        // Show the "save" state when user is not logged in or when there are unsaved changes
        const showSaveState = !this.props.isLoggedIn || this.props.isDirty;
        return (
            <DefaultTooltip
                overlay={createTooltipMsg(
                    this.props.isLoggedIn,
                    this.props.isDirty
                )}
            >
                <button
                    data-test="save-chart-settings-to-session"
                    disabled={!enabled}
                    style={{
                        width: 'fit-content',
                        position: 'relative',
                        zIndex: 2,
                    }}
                    className={`btn btn-primary btn-xs pull-right ${
                        enabled ? '' : 'disabled'
                    }`}
                    onClick={() => {
                        if (enabled) {
                            this.props.store.saveChartSettings();
                        }
                    }}
                >
                    <i
                        className={`fa ${
                            showSaveState ? 'fa-thumb-tack' : 'fa-check-square'
                        }`}
                        aria-hidden="true"
                    />{' '}
                    {showSaveState ? 'Save settings' : 'Settings saved'}
                </button>
            </DefaultTooltip>
        );
    }
}

function createTooltipMsg(isLoggedIn: boolean, isDirty: boolean) {
    let msg: string;
    if (!isLoggedIn) {
        msg = 'Log in to save chart settings.';
    } else if (isDirty) {
        msg =
            'Save the currently visible charts as default for future visits to this study.';
    } else {
        msg = 'All changes saved.';
    }
    return msg;
}
