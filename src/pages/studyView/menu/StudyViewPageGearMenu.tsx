import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import * as React from 'react';
import { computed, makeObservable, observable } from 'mobx';
import classNames from 'classnames';
import styles from 'pages/studyView/styles.module.scss';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import Tooltip from 'rc-tooltip';

interface IStudyViewPageGearMenuProps {
    store: StudyViewPageStore;
}

@observer
export default class StudyViewPageGearMenu extends React.Component<
    IStudyViewPageGearMenuProps,
    {}
> {
    constructor(props: Readonly<IStudyViewPageGearMenuProps>) {
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
                    >
                        <i className="fa fa-cog" />
                    </button>
                </DefaultTooltip>
            </div>
        );
    }
}

@observer
export class AutosubmitToggle extends React.Component<
    IStudyViewPageGearMenuProps,
    {}
> {
    render() {
        return (
            <div className={classNames(styles.autosubmitToggle)}>
                <h5>
                    Submitting filters{' '}
                    <Tooltip
                        placement="top"
                        overlayStyle={{
                            maxWidth: 400,
                        }}
                        overlay="Disabling autosubmit is a beta feature still under evaluation"
                    >
                        <i
                            className={classNames(
                                'fa fa-info-circle',
                                styles.hesitateControlsAlign
                            )}
                        />
                    </Tooltip>
                </h5>
                <div className="btn-group">
                    <label>
                        <input
                            onClick={() =>
                                (this.props.store.hesitateUpdate = false)
                            }
                            checked={!this.props.store.hesitateUpdate}
                            type="radio"
                        />{' '}
                        Autosubmit
                    </label>
                    <label>
                        <input
                            onClick={() =>
                                (this.props.store.hesitateUpdate = true)
                            }
                            checked={this.props.store.hesitateUpdate}
                            type="radio"
                        />{' '}
                        Manually submit
                    </label>
                </div>
            </div>
        );
    }
}
