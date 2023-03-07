import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import * as React from 'react';
import { computed, makeObservable, observable } from 'mobx';
import classNames from 'classnames';
import styles from 'pages/studyView/styles.module.scss';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import { AutosubmitToggle } from 'pages/studyView/menu/AutosubmitToggle';

export interface IStudyViewPageSettingsMenuProps {
    store: StudyViewPageStore;
}

@observer
export default class StudyViewPageSettingsMenu extends React.Component<
    IStudyViewPageSettingsMenuProps,
    {}
> {
    constructor(props: Readonly<IStudyViewPageSettingsMenuProps>) {
        super(props);
        makeObservable(this);
    }

    @observable visible = false;

    @computed get menu() {
        return (
            <div>
                <AutosubmitToggle store={this.props.store} />
            </div>
        );
    }

    render() {
        return (
            <div className={classNames(styles.studyViewPageGearMenu)}>
                <DefaultTooltip
                    trigger={'click'}
                    placement="bottom"
                    overlay={this.menu}
                    visible={this.visible}
                    onVisibleChange={visible => {
                        this.visible = !!visible;
                    }}
                >
                    <button
                        className={classNames('btn', 'btn-sm', 'btn-primary', {
                            active: this.visible,
                        })}
                        data-test="study-view-settings-menu"
                    >
                        <i className="fa fa-cog" />
                    </button>
                </DefaultTooltip>
            </div>
        );
    }
}
