/*
 * Copyright (c) 2018. The Hyve and respective contributors
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, makeObservable } from 'mobx';
import './StudyTagsTooltip.scss';
import JsonTable from './JsonTable';
import { DefaultTooltip, remoteData } from 'cbioportal-frontend-commons';
import client from 'shared/api/cbioportalClientInstance';
import Loader from '../loadingIndicator/LoadingIndicator';
import styles from 'pages/studyView/styles.module.scss';
import ServerConfigDefaults from 'config/serverConfigDefaults';
import { getServerConfig } from 'config/config';
import {
    hasJsonPathPlaceholders,
    replaceJsonPathPlaceholders,
} from 'shared/lib/JsonPathUtils';

export enum IconType {
    INFO_ICON,
    LOCK_ICON,
}

export type StudyTagsTooltipProps = {
    studyDescription: string;
    studyId: string;
    isVirtualStudy: boolean;
    key: number;
    mouseEnterDelay: number;
    placement: string;
    children: any;
    iconType: IconType;
};

export type StudyInfoOverlayTooltipProps = {
    studyDescription: string;
    studyId: string;
    isVirtualStudy: boolean;
    iconType: IconType;
};

function addHTMLDescription(description: string) {
    return { __html: description };
}

@observer
class StudyInfoOverlay extends React.Component<
    StudyInfoOverlayTooltipProps,
    {}
> {
    @observable readonly studyMetadata = remoteData({
        invoke: async () => {
            return client.getTagsUsingGET({ studyId: this.props.studyId });
        },
        onError: error => {
            console.error('Error on getting study tags.', error);
        },
    });

    constructor(props: StudyInfoOverlayTooltipProps) {
        super(props);
        makeObservable(this);
    }

    render() {
        let overlay: any = '';
        if (this.props.isVirtualStudy) {
            overlay = (
                <div
                    dangerouslySetInnerHTML={addHTMLDescription(
                        this.props.studyDescription
                    )}
                />
            );
        } else {
            if (this.studyMetadata.isPending) {
                overlay = <Loader isLoading={true} />;
            } else if (this.studyMetadata.isComplete) {
                const resultKeyLength = Object.keys(this.studyMetadata.result)
                    .length;
                const description = (
                    <div
                        dangerouslySetInnerHTML={addHTMLDescription(
                            this.props.studyDescription
                        )}
                    />
                );
                if (this.props.iconType === IconType.INFO_ICON) {
                    overlay =
                        resultKeyLength > 0
                            ? [
                                  description,
                                  <br />,
                                  <div className="studyTagsTooltip">
                                      {' '}
                                      <JsonTable
                                          json={this.studyMetadata.result}
                                      />
                                  </div>,
                              ]
                            : description;
                } else {
                    const message = replaceJsonPathPlaceholders(
                        getServerConfig()
                            .skin_home_page_unauthorized_studies_global_message,
                        this.studyMetadata.result,
                        this.props.studyId
                    );

                    // if the placeholders couldn't be replaced, then show default global message
                    overlay = hasJsonPathPlaceholders(message) ? (
                        ServerConfigDefaults.skin_home_page_unauthorized_studies_global_message
                    ) : (
                        <div
                            style={{ maxWidth: 300 }}
                            dangerouslySetInnerHTML={addHTMLDescription(
                                message.toString()
                            )}
                        />
                    );
                }
            } else if (this.studyMetadata.isError) {
                overlay = 'error';
            }
        }

        return overlay;
    }
}

@observer
export default class StudyTagsTooltip extends React.Component<
    StudyTagsTooltipProps,
    {}
> {
    renderTooltip() {
        return (
            <DefaultTooltip
                mouseEnterDelay={this.props.mouseEnterDelay}
                placement={this.props.placement}
                overlay={
                    this.props.iconType === IconType.LOCK_ICON &&
                    !hasJsonPathPlaceholders(
                        getServerConfig()
                            .skin_home_page_unauthorized_studies_global_message
                    ) ? (
                        <div
                            className={styles.tooltip}
                            dangerouslySetInnerHTML={addHTMLDescription(
                                getServerConfig()
                                    .skin_home_page_unauthorized_studies_global_message
                            )}
                        />
                    ) : (
                        <StudyInfoOverlay
                            studyDescription={this.props.studyDescription}
                            studyId={this.props.studyId}
                            isVirtualStudy={this.props.isVirtualStudy}
                            iconType={this.props.iconType}
                        />
                    )
                }
                children={this.props.children}
            />
        );
    }

    render() {
        return this.renderTooltip();
    }
}
