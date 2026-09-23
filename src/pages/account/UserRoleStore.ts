import { observable, action, makeObservable } from 'mobx';

export enum UserRole {
    CLINICIAN = 'Clinician',
    RESEARCHER = 'Researcher',
    STUDENT = 'Student',
    BIOINFORMATICIAN = 'Bioinformatician',
    DEVELOPER = 'Developer',
    OTHER = 'Other',
}

const USER_ROLE_STORAGE_KEY = 'cbioportal_user_role';

export class UserRoleStore {
    @observable.ref currentRole: UserRole | undefined;

    constructor() {
        makeObservable(this);
        const stored = localStorage.getItem(USER_ROLE_STORAGE_KEY);
        this.currentRole = (Object.values(UserRole) as string[]).includes(
            stored || ''
        )
            ? (stored as UserRole)
            : undefined;
    }

    @action
    public setRole(role: UserRole) {
        this.currentRole = role;
        localStorage.setItem(USER_ROLE_STORAGE_KEY, role);
    }

    @action
    public clearRole() {
        this.currentRole = undefined;
        localStorage.removeItem(USER_ROLE_STORAGE_KEY);
    }
}
