import { DefaultTooltip, setArrowLeft } from 'cbioportal-frontend-commons';
import SettingsMenu from '../../../pages/resultsView/settings/SettingsMenu';
import * as React from 'react';
import {
    IDriverSettingsProps,
    IExclusionSettings,
} from 'shared/alterationFiltering/AnnotationFilteringSettings';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';

export interface SettingsButtonProps {
    store: IDriverSettingsProps &
        IExclusionSettings &
        ISettingsMenuButtonVisible;
    resultsView?: boolean;
    disabled?: boolean;
}

export interface ISettingsMenuButtonVisible {
    isSettingsMenuVisible?: boolean;
}

@observer
export default class SettingsMenuButton extends React.Component<
    SettingsButtonProps,
    {}
> {
    constructor(props: Readonly<SettingsButtonProps>) {
        super(props);
        makeObservable(this);
    }

    @computed get margin() {
        return this.props.resultsView ? 5 : 0;
    }

    @observable visible = false;

    // determine whether visibility is controlled
    // by a store component or by local state
    @computed get visibilityState() {
        if (this.props.store.isSettingsMenuVisible !== undefined)
            return this.props.store.isSettingsMenuVisible;
        return this.visible;
    }

    @action
    private setVisibilityState(visible: boolean | undefined) {
        if (visible !== undefined) {
            if (this.props.store.isSettingsMenuVisible !== undefined)
                this.props.store.isSettingsMenuVisible = !!visible;
            else this.visible = !!visible;
        }
    }

    @computed get overlay() {
        return (
            <SettingsMenu
                store={this.props.store}
                resultsView={this.props.resultsView}
                disabled={this.props.disabled}
            />
        );
    }

    @computed get trigger() {
        if (this.props.disabled) {
            return 'hover';
        } else {
            return 'click';
        }
    }

    render() {
        return (
            <DefaultTooltip
                trigger={[this.trigger]}
                placement="bottomRight"
                overlay={this.overlay}
                visible={this.visibilityState}
                onVisibleChange={visible => {
                    this.setVisibilityState(visible);
                }}
                onPopupAlign={tooltipEl => setArrowLeft(tooltipEl, '22px')}
            >
                <button
                    data-test="GlobalSettingsButton"
                    style={{
                        height: 38,
                        marginRight: this.margin,
                        marginLeft: this.margin,
                    }}
                    className="btn btn-primary"
                >
                    <i className="fa fa-sliders fa-lg" />
                </button>
            </DefaultTooltip>
        );
    }
}
