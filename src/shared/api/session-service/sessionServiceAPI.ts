import * as request from 'superagent';
import { getSessionUrl } from '../urls';
import {
    CustomChart,
    CustomChartData,
    Session,
    StudyPageSettings,
    VirtualStudy,
} from './sessionServiceModels';

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
    //Virtual Study API's - START
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
    //Virtual Study API's - END
    //main session API's - START
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
    //main session API's - END
    //StudyPage Settings API's - START
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
    //StudyPage Settings API's - END
    //Custom Chart API's - START
    saveCustomData(data: CustomChartData) {
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

    getCustomData(id: string): Promise<CustomChart> {
        return request
            .get(`${this.getCustomDataUrl()}/${id}`)
            .then((res: any) => res.body);
    }

    getCustomDataForStudies(studyIds: string[]): Promise<CustomChart[]> {
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
    //Custom Chart API's - END
}
