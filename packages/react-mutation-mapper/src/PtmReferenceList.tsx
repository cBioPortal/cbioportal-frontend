import {observer} from "mobx-react";
import * as React from "react";

import {DefaultTooltip, ReferenceList} from "cbioportal-frontend-commons";

import {Cache} from "./model/MobxCache";

interface IPtmReferenceListProps {
    pubmedIds: string[];
    pmidData: Cache
}

function extractNumericalPart(pmid: string) {
    const matched = pmid.match(/[0-9]+/);

    if (matched) {
        return Number(matched[0]);
    }
    else {
        return undefined;
    }
}

@observer
export default class PtmReferenceList extends React.Component<IPtmReferenceListProps, {}>
{
    public render() {
        return (
            <DefaultTooltip
                placement="right"
                overlay={
                    <div style={{maxWidth: 400, maxHeight: 400, overflowY: "auto"}}>
                        <ReferenceList
                            pmids={
                                this.props.pubmedIds
                                    .map(id => extractNumericalPart(id))
                                    .filter(id => id !== undefined) as number[]
                            }
                            pmidData={this.props.pmidData}
                            abstracts={[]}
                        />
                    </div>
                }
                destroyTooltipOnHide={true}
            >
                <div style={{textAlign: "right"}}>
                    <i className="fa fa-book" style={{color: "black"}}/>
                </div>
            </DefaultTooltip>
        );
    }
}
