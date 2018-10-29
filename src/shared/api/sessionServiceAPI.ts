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
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
                .then((res:any) => {
                    return res.body;
                });              
    }

    getVirtualStudy(id:string): Promise<VirtualStudy> {
        return request
                .get(`${getVirtualStudyServiceUrl()}/${id}`)
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
                .then((res:any) => {
                    return res.body;
                });              
    }

    deleteVirtualStudy(id:string){
        return request
                .get(`${getVirtualStudyServiceUrl()}/delete/${id}`)
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
                             
    }

    addVirtualStudy(id:string){
        return request
                .get(`${getVirtualStudyServiceUrl()}/add/${id}`)
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
    }
    
    saveVirtualStudy(object: any, save: boolean) {
        return request
            .post(getVirtualStudyServiceUrl() + (save ? '/save' : ''))
            .send(object)
            .then((res:any) => {
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
            .then((res:any) => {
                return res.body
            });
    }

    getSession(sessionId:string) {
        return request
            .get(`${getSessionServiceUrl()}/${sessionId}`)
            // @ts-ignore: this method comes from caching plugin and isn't in typing
            .forceUpdate(true)
            .then((res:any) => {
                return res.body
            });
    }
}
