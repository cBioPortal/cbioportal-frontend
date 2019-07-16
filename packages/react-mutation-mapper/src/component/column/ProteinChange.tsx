import {calcProteinChangeSortValue} from "cbioportal-frontend-commons";
import * as React from "react";

import {Mutation} from "../../model/Mutation";
import {defaultSortMethod} from "../../util/ReactTableUtils";
import styles from './proteinChange.module.scss';

type ProteinChangeProps = {
    mutation: Mutation;
};

export function proteinChangeSortMethod(a: string, b: string)
{
    return defaultSortMethod(
        a ? calcProteinChangeSortValue(a) : null,
        b ? calcProteinChangeSortValue(b) : null
    );
}

export default class ProteinChange extends React.Component<ProteinChangeProps, {}>
{
    public render() {
        // use text as display value
        const mutation = this.props.mutation;
        const proteinChange = mutation.proteinChange;
        const mutationStatus = mutation.mutationStatus;

        // TODO TruncatedText
        // let content = (
        //     <TruncatedText
        //         text={proteinChange}
        //         tooltip={<span>{proteinChange}</span>}
        //         className={styles.proteinChange}
        //         maxLength={40}
        //     />
        // );

        let content = <span className={styles.proteinChange}>{proteinChange}</span>;

        // add a germline indicator next to protein change if it is a germline mutation!
        if (mutationStatus &&
            mutationStatus.toLowerCase().indexOf("germline") > -1)
        {
            content = (
                <React.Fragment>
                    {content}
                    <span className={styles.germline}>Germline</span>
                </React.Fragment>
            );
        }

        return content;
    }
}
