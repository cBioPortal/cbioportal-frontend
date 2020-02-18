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
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { JsonToTable } from 'react-json-to-table';
import './StudyTagsTooltip.scss';
import { DefaultTooltip, remoteData } from 'cbioportal-frontend-commons';
import client from 'shared/api/cbioportalClientInstance';
import Loader from '../loadingIndicator/LoadingIndicator';

export type StudyTagsTooltipProps = {
    studyDescription: string;
    studyId: string;
    isVirtualStudy: boolean;
    key: number;
    mouseEnterDelay: number;
    placement: string;
    children: any;
};

export type StudyInfoOverlayTooltipProps = {
    studyDescription: string;
    studyId: string;
    isVirtualStudy: boolean;
};

@observer
class StudyInfoOverlay extends React.Component<StudyInfoOverlayTooltipProps, {}> {
    @observable readonly studyMetadata = remoteData({
        invoke: async () => {
            return client.getTagsUsingGET({ studyId: this.props.studyId });
        },
        onError: error => {
            console.error('Error on getting study tags.', error);
        },
    });

    addHTMLDescription(description: string) {
        return { __html: description };
    }

    render() {
        let overlay: any = '';
        if (this.props.isVirtualStudy) {
            overlay = (
                <div
                    dangerouslySetInnerHTML={this.addHTMLDescription(this.props.studyDescription)}
                />
            );
        } else {
            if (this.studyMetadata.isPending) {
                overlay = <Loader isLoading={true} />;
            } else if (this.studyMetadata.isComplete) {
                const resultKeyLength = Object.keys(this.studyMetadata.result).length;
                const description = (
                    <div
                        dangerouslySetInnerHTML={this.addHTMLDescription(
                            this.props.studyDescription
                        )}
                    />
                );
                overlay =
                    resultKeyLength > 0
                        ? [
                              description,
                              <br />,
                              <div className="studyTagsTooltip">
                                  {' '}
                                  <JsonToTable json={this.studyMetadata.result} />
                              </div>,
                          ]
                        : description;
            } else if (this.studyMetadata.isError) {
                overlay = 'error';
            }
        }

        return overlay;
    }
}

@observer
export default class StudyTagsTooltip extends React.Component<StudyTagsTooltipProps, {}> {
    renderTooltip() {
        return (
            <DefaultTooltip
                key={this.props.key}
                mouseEnterDelay={this.props.mouseEnterDelay}
                placement={this.props.placement}
                overlay={
                    <StudyInfoOverlay
                        studyDescription={this.props.studyDescription}
                        studyId={this.props.studyId}
                        isVirtualStudy={this.props.isVirtualStudy}
                    />
                }
                children={this.props.children}
            />
        );
    }

    render() {
        return this.renderTooltip();
    }
}
