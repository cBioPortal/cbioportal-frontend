import * as request from 'superagent';
import {getSessionServiceApiUrl} from "./urls";
import {VirtualStudy} from "shared/model/VirtualStudy";

export default class sessionServiceAPI {
    /**
     * Retrieve Virtual Studies
     */
    getUserVirtualStudies(): Promise<Array<VirtualStudy>> {
        return request
                .get(getSessionServiceApiUrl())
                .then((res) => {
                    return res.body;
                });              
    }

    getVirtualStudy(id:string): Promise<VirtualStudy> {
        return request
                .get(`${getSessionServiceApiUrl()}/${id}`)
                .then((res) => {
                    return res.body;
                });              
    }

    deleteVirtualStudy(id:string){
        return request
                .get(`${getSessionServiceApiUrl()}/delete/${id}`)
                             
    }

    addVirtualStudy(id:string){
        return request
                .get(`${getSessionServiceApiUrl()}/add/${id}`)
                             
    }
    
    saveVirtualStudy(object: any, save: boolean) {
        return request
            .post(getSessionServiceApiUrl() + (save ? '/save' : ''))
            .send(object)
            .then((res) => {
                let result = res.body;
                   return {
                       id:result.id
                   }
            });
    }
}
