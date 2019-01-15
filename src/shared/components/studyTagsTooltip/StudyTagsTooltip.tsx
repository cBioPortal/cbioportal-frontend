/*
 * Copyright (c) 2018. The Hyve and respective contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * See the file LICENSE in the root of this repository.
 *
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

import * as React from 'react';
import DefaultTooltip from '../defaultTooltip/DefaultTooltip';
import { observer } from 'mobx-react';
import { JsonToTable } from 'react-json-to-table';
import './StudyTagsTooltip.scss';
import { remoteData } from '../../api/remoteData';
import client from "shared/api/cbioportalClientInstance";
import { MobxPromiseUnionType } from 'mobxpromise';
import Loader from '../loadingIndicator/LoadingIndicator';

export type StudyTagsTooltipProps = {
    studyDescription: string;
    studyId: string;
    key: number;
    mouseEnterDelay: number;
    placement: string;
    children: any;
};

@observer
export default class StudyTagsTooltip extends React.Component<StudyTagsTooltipProps, {}> {

    readonly studyMetadata = remoteData({
        invoke: async () => {
            return client.getTagsUsingGET({studyId: this.props.studyId});
        },
        onError: (error) => {
            console.error("Error on getting study tags.", error);
        }
    });

    addHTMLDescription(description:string) {
        return {__html: description};
    }

    renderTooltip = (meta: MobxPromiseUnionType<any>) => {
        let overlay:any = '';
        if (meta.isPending) {
            overlay = <Loader isLoading={true}/>;
        }
        if (meta.isComplete) {
            const resultKeyLength = Object.keys(meta.result).length;
            const description = <div dangerouslySetInnerHTML={this.addHTMLDescription(this.props.studyDescription)}/>;
            overlay = resultKeyLength > 0 ? ([description, <br/>, <div className="studyTagsTooltip"> <JsonToTable json={meta.result}/></div>]) : description;
        }
        if (meta.isError) {
            overlay = 'error';
        }

        return (<DefaultTooltip
            key={this.props.key}
            mouseEnterDelay={this.props.mouseEnterDelay}
            placement={this.props.placement}
            overlay={overlay}
            children={this.props.children}
        />);
    }

    render() {
        const meta = this.studyMetadata;
        return this.renderTooltip(meta);
    }
}
