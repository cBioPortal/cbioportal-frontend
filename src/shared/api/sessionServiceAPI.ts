import * as request from 'superagent';
import { getSessionUrl } from './urls';
import { VirtualStudy } from 'shared/model/VirtualStudy';
import {
    StudyPageSettings,
    CustomChartIdentifierWithValue,
} from 'pages/studyView/StudyViewPageStore';

export type CustomChart = {
    origin: string[];
    displayName: string;
    description: string;
    datatype: string;
    patientAttribute: boolean;
    priority: number;
    data: CustomChartIdentifierWithValue[];
};

export type CustomChartSession = {
    id: string;
    data: CustomChart;
};

export default class sessionServiceAPI {
    getVirtualStudyServiceUrl() {
        return `${getSessionUrl()}/virtual_study`;
    }

    getSessionServiceUrl() {
        return `${getSessionUrl()}/main_session`;
    }

    getUserSettingUrl() {
        return `${getSessionUrl()}/settings`;
    }

    getCustomDataUrl() {
        return `${getSessionUrl()}/custom_data`;
    }

    /**
     * Retrieve Virtual Studies
     */
    getUserVirtualStudies(): Promise<Array<VirtualStudy>> {
        return (
            request
                .get(this.getVirtualStudyServiceUrl())
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
                .then((res: any) => {
                    return res.body;
                })
        );
    }

    getVirtualStudy(id: string): Promise<VirtualStudy> {
        return (
            request
                .get(`${this.getVirtualStudyServiceUrl()}/${id}`)
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
                .then((res: any) => {
                    return res.body;
                })
        );
    }

    deleteVirtualStudy(id: string) {
        return (
            request
                .get(`${this.getVirtualStudyServiceUrl()}/delete/${id}`)
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
        );
    }

    addVirtualStudy(id: string) {
        return (
            request
                .get(`${this.getVirtualStudyServiceUrl()}/add/${id}`)
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
        );
    }

    saveVirtualStudy(object: any, save: boolean) {
        return request
            .post(this.getVirtualStudyServiceUrl() + (save ? '/save' : ''))
            .send(object)
            .then((res: any) => {
                let result = res.body;
                return {
                    id: result.id,
                };
            });
    }

    saveSession(data: any) {
        return request
            .post(this.getSessionServiceUrl())
            .send(data)
            .then((res: any) => {
                return res.body;
            });
    }

    getSession(sessionId: string) {
        return (
            request
                .get(`${this.getSessionServiceUrl()}/${sessionId}`)
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
                .then((res: any) => {
                    return res.body;
                })
        );
    }

    fetchUserSettings(
        studyIds: string[]
    ): Promise<StudyPageSettings | undefined> {
        return (
            request
                .post(`${this.getUserSettingUrl()}/fetch`)
                .send({ page: 'study_view', origin: studyIds })
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
                .then((res: any) => {
                    //can be undefined if noting was saved previously
                    return res.body;
                })
        );
    }

    updateUserSettings(data: StudyPageSettings) {
        return (
            request
                .post(this.getUserSettingUrl())
                .send({ page: 'study_view', ...data })
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
                .then((res: any) => {
                    return res.body;
                })
        );
    }

    saveCustomData(data: any) {
        return request
            .post(this.getCustomDataUrl())
            .send(data)
            .then((res: any) => {
                let result = res.body;
                return {
                    id: result.id,
                };
            });
    }

    getCustomData(id: string): Promise<CustomChartSession> {
        return request
            .get(`${this.getCustomDataUrl()}/${id}`)
            .then((res: any) => res.body);
    }

    getCustomDataForStudies(studyIds: string[]): Promise<CustomChartSession[]> {
        return request
            .post(`${this.getCustomDataUrl()}/fetch`)
            .send(studyIds)
            .then((res: any) => {
                return res.body;
            });
    }

    public deleteCustomData(id: string) {
        return request
            .get(`${this.getCustomDataUrl()}/delete/${id}`)
            .then(() => {});
    }

    public addCustomDataToUser(id: string) {
        return request
            .get(`${this.getCustomDataUrl()}/add/${id}`)
            .then(() => {});
    }
}
