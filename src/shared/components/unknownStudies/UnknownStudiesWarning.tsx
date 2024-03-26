import * as React from 'react';
import { observer } from 'mobx-react';
import { Collapse } from 'react-collapse';
import classnames from 'classnames';

@observer
export default class UnknownStudiesWarning extends React.Component<
    { ids: String[] },
    { studiesCollapsed: boolean },
    {}
> {
    constructor(props: { ids: String[] }) {
        super(props);
        this.state = {
            studiesCollapsed: true
        };
    }

    toggleStudiesCollapse = () => {
        this.setState(prevState => ({
            studiesCollapsed: !prevState.studiesCollapsed
        }));
    }

    render() {
        const { studiesCollapsed } = this.state;
        if (this.props.ids.length > 0) {
            return (
                <div
                    className="alert alert-danger"
                    data-test="unkown-study-warning"
                    style={{ marginBottom: 0 }}
                >

                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                        onClick={() => this.toggleStudiesCollapse()}
                    >
                        <i className="fa fa-exclamation-triangle"></i> The following
                        studies do not exist or you do not have access to them.
                        <span style={{ float: 'right' }}>
                            {studiesCollapsed ? (
                                <i
                                    className={classnames(
                                        'fa fa-chevron-down'
                                    )}
                                />
                            ) : (
                                <i
                                    className={classnames(
                                        'fa fa-chevron-up'
                                    )}
                                />
                            )}
                        </span>
                    </div>
                    <Collapse isOpened={!studiesCollapsed}>
                        <ul style={{ margin: '10px 0' }}>
                            {this.props.ids.map(id => (
                                <li>{id}</li>
                            ))}
                        </ul>
                    </Collapse>
                    Please resubmit your query below.
                </div>
            );
        } else {
            return null;
        }
    }
}
