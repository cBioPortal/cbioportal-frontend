import * as request from 'superagent';
import { getSessionUrl } from './urls';
import { VirtualStudy } from 'shared/model/VirtualStudy';
import { StudyPageSettings } from 'pages/studyView/StudyViewPageStore';

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
                .post(`${this.getUserSettingUrl()}`)
                .send({ page: 'study_view', ...data })
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
                .then((res: any) => {
                    return res.body;
                })
        );
    }
}
