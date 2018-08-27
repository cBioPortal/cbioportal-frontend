import * as request from 'superagent';
import {getSessionServiceUrl, getVirtualStudyServiceUrl} from "./urls";
import {VirtualStudy} from "shared/model/VirtualStudy";

export default class sessionServiceAPI {
    /**
     * Retrieve Virtual Studies
     */
    getUserVirtualStudies(): Promise<Array<VirtualStudy>> {
        return request
                .get(getVirtualStudyServiceUrl())
                .then((res) => {
                    return res.body;
                });              
    }

    getVirtualStudy(id:string): Promise<VirtualStudy> {
        return request
                .get(`${getVirtualStudyServiceUrl()}/${id}`)
                .then((res) => {
                    return res.body;
                });              
    }

    deleteVirtualStudy(id:string){
        return request
                .get(`${getVirtualStudyServiceUrl()}/delete/${id}`)
                             
    }

    addVirtualStudy(id:string){
        return request
                .get(`${getVirtualStudyServiceUrl()}/add/${id}`)
                             
    }
    
    saveVirtualStudy(object: any, save: boolean) {
        return request
            .post(getVirtualStudyServiceUrl() + (save ? '/save' : ''))
            .send(object)
            .then((res) => {
                let result = res.body;
                   return {
                       id:result.id
                   }
            });
    }

    saveSession(data:any) {
        return request
            .post(getSessionServiceUrl())
            .send(data)
            .then((res) => {
                return res.body
            });
    }

    getSession(sessionId:string) {
        return request
            .get(`${getSessionServiceUrl()}/${sessionId}`)
            .then((res) => {
                return res.body
            });
    }
}
