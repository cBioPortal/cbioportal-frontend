import { observer } from 'mobx-react';
import * as React from 'react';
import classNames from 'classnames';
import styles from 'pages/studyView/styles.module.scss';
import Tooltip from 'rc-tooltip';

import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
export type IAutosubmitToggleProps = {
    store: StudyViewPageStore;
};

@observer
export class AutosubmitToggle extends React.Component<
    IAutosubmitToggleProps,
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
