import {DefaultTooltip} from "cbioportal-frontend-commons";
import * as React from "react";

import {Mutation} from "../../model/Mutation";
import styles from "./mutationStatus.module.scss";

type MutationStatusProps = {
    mutation: Mutation;
    displayValueMap?: {[mutationStatus: string]: string};
};

export default class MutationStatus extends React.Component<MutationStatusProps, {}>
{
    public render() {
        const value = this.props.mutation.mutationStatus;
        let content: JSX.Element;
        let needTooltip = false;

        if (value)
        {
            if (value.toLowerCase().indexOf("somatic") > -1) {
                content = (
                    <span className={styles.somatic}>
                        {(this.props.displayValueMap && this.props.displayValueMap["somatic"]) || "Somatic"}
                    </span>
                );
                needTooltip = this.props.displayValueMap !== undefined;
            }
            else if (value.toLowerCase().indexOf("germline") > -1) {
                content = (
                    <span className={styles.germline}>
                        {(this.props.displayValueMap && this.props.displayValueMap["germline"]) || "Germline"}
                    </span>
                );
                needTooltip = this.props.displayValueMap !== undefined;
            }
            else {
                content = <span className={styles.unknown}>{value}</span>;
            }
        }
        else {
            content = <span />;
        }

        if (needTooltip)
        {
            content = (
                <DefaultTooltip
                    overlay={<span>{value}</span>}
                    placement="right"
                >
                    {content}
                </DefaultTooltip>
            );
        }

        return content;
    }
}
