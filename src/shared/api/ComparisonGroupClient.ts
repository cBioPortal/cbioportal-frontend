import * as request from 'superagent';
import {
    fetchComparisonGroupsServiceUrl,
    getComparisonGroupServiceUrl,
    getComparisonSessionServiceUrl,
} from './urls';
import { VirtualStudy, VirtualStudyData } from '../model/VirtualStudy';
import { ClinicalAttribute } from './generated/CBioPortalAPI';
import PromisePlus from '../lib/PromisePlus';
import { Omit } from '../lib/TypeScriptUtils';

export type SessionGroupData = Omit<VirtualStudyData, 'studyViewFilter'> & {
    uid?: string;
    color?: string; // for charts
};
export type Session = {
    id: string;
    groups: SessionGroupData[];
    origin: string[];
    clinicalAttributeName?: string;
    groupNameOrder?: string[];
};
export type Group = {
    id: string;
    data: GroupData;
};
export type GroupData = Omit<VirtualStudyData, 'studyViewFilter'>;

export default class ComparisonGroupClient {
    // edge case: user deletes a group, then opens the panel again,
    //          and the getGroups request responds before the deleteGroup
    //          request completes, thus showing a group that should be
    //          (and soon will be) deleted. We fix this by waiting
    //          until deletions are done before allowing getGroups requests.
    private _pendingDeletions: PromisePlus<any>[] = [];

    private getPendingDeletions() {
        // filter out non-pending deletions
        this._pendingDeletions = this._pendingDeletions.filter(x => x.status !== 'pending');
        return this._pendingDeletions.map(p => p.promise);
    }

    // Groups
    public addGroup(group: GroupData): Promise<{ id: string }> {
        return request
            .post(getComparisonGroupServiceUrl())
            .send(group)
            .then((res: any) => {
                let result = res.body;
                return {
                    id: result.id,
                };
            });
    }

    public updateGroup(id: string, group: GroupData) {
        return request.post(`${getComparisonGroupServiceUrl()}/${id}`).send(group);
    }

    public getGroup(id: string) {
        return request.get(`${getComparisonGroupServiceUrl()}/${id}`).then((res: any) => res.body);
    }

    public async getGroupsForStudies(studyIds: string[]): Promise<Group[]> {
        await Promise.all(this.getPendingDeletions()); // wait for pending deletions to finish

        return request
            .post(fetchComparisonGroupsServiceUrl())
            .send(studyIds)
            .then((res: any) => {
                return res.body;
            });
    }

    public deleteGroup(id: string) {
        const req = request.get(`${getComparisonGroupServiceUrl()}/delete/${id}`).then(() => {});

        this._pendingDeletions.push(new PromisePlus(req));
        return req;
    }

    // Group Comparison Sessions
    public addComparisonSession(session: Omit<Session, 'id'>): Promise<{ id: string }> {
        return request
            .post(getComparisonSessionServiceUrl())
            .send(session)
            .then((res: any) => {
                let result = res.body;
                return {
                    id: result.id,
                };
            });
    }

    public async getComparisonSession(id: string): Promise<Session> {
        const storedValue: {
            id: string;
            data: Omit<Session, 'id'>;
        } = await request
            .get(`${getComparisonSessionServiceUrl()}/${id}`)
            .then((res: any) => res.body);

        return Object.assign(storedValue.data, { id: storedValue.id });
    }
}
