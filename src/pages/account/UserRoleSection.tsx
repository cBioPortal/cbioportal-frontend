import * as React from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';
import { UserRole, UserRoleStore } from './UserRoleStore';
import styles from './styles.module.scss';

interface IUserRoleSectionProps {
    userRoleStore: UserRoleStore;
}

@observer
export default class UserRoleSection extends React.Component<
    IUserRoleSectionProps,
    {}
> {
    render() {
        const { userRoleStore } = this.props;
        return (
            <div className={styles.card}>
                <h4>Your Role</h4>
                <p className={styles.subtext}>
                    Let us know how you use cBioPortal. This is stored only in
                    your browser.
                </p>
                <div className={styles.roleOptions}>
                    {Object.values(UserRole).map(role => (
                        <button
                            key={role}
                            className={classNames(
                                'btn btn-sm',
                                userRoleStore.currentRole === role
                                    ? 'btn-primary'
                                    : 'btn-default'
                            )}
                            onClick={() => userRoleStore.setRole(role)}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
}
