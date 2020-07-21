import * as request from 'superagent';
import {
    fetchComparisonGroupsServiceUrl,
    getComparisonGroupServiceUrl,
    getComparisonSessionServiceUrl,
} from './urls';
import { VirtualStudyData } from '../model/VirtualStudy';
import { Omit } from '../lib/TypeScriptUtils';

export type SessionGroupData = GroupData & {
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
        return request
            .post(`${getComparisonGroupServiceUrl()}/${id}`)
            .send(group);
    }

    public getGroup(id: string) {
        return request
            .get(`${getComparisonGroupServiceUrl()}/${id}`)
            .then((res: any) => res.body);
    }

    public async getGroupsForStudies(studyIds: string[]): Promise<Group[]> {
        return request
            .post(fetchComparisonGroupsServiceUrl())
            .send(studyIds)
            .then((res: any) => {
                return res.body;
            });
    }

    public deleteGroup(id: string) {
        return request
            .get(`${getComparisonGroupServiceUrl()}/delete/${id}`)
            .then(() => {});
    }

    public addGroupToUser(id: string) {
        return request
            .get(`${getComparisonGroupServiceUrl()}/add/${id}`)
            .then(() => {});
    }

    // Group Comparison Sessions
    public addComparisonSession(
        session: Omit<Session, 'id'>
    ): Promise<{ id: string }> {
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
