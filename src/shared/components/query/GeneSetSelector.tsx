import * as React from 'react';
import * as styles_any from './styles/styles.module.scss';
import {Modal} from 'react-bootstrap';
import ReactSelect from 'react-select';
import {observer} from "mobx-react";
import {computed} from 'mobx';
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import gene_lists from './gene_lists';
import GenesetValidator from "./GenesetValidator";
import classNames from 'classnames';
import {getOncoQueryDocUrl} from "../../api/urls";
import {QueryStoreComponent} from "./QueryStore";
import GenesetsHierarchySelector from "./GenesetsHierarchySelector";
import SectionHeader from "../sectionHeader/SectionHeader";
import AppConfig from "appConfig";

const styles = styles_any as {
    GeneSetSelector: string,
    GenesetsSelectorWindow: string,
    buttonRow: string,
    geneSet: string,
    empty: string,
    notEmpty: string,
    sectionSpinner: string,
};

export interface GeneSetSelectorProps
{
}

@observer
export default class GeneSetSelector extends QueryStoreComponent<GeneSetSelectorProps, {}>
{
    @computed get selectedGeneListOption()
    {
        const option = this.geneListOptions.find(opt => opt.value === this.store.geneQuery);
        return option ? option.value : '';
    }

    @computed get geneListOptions()
    {
        let geneList: {"id": string, "genes": string[]}[] = gene_lists;
        if (AppConfig.querySetsOfGenes) {
            geneList = AppConfig.querySetsOfGenes;
        }

        return [
                {
                    label: 'User-defined List',
                    value: ''
                },
                ...geneList.map(item => ({
                    label: `${item.id} (${item.genes.length} genes)`,
                    value: item.genes.join(' ')
                }))
                ];
    }

    @computed get textAreaRef()
    {
        if (this.store.geneQueryErrorDisplayStatus === 'shouldFocus')
            return (textArea:HTMLTextAreaElement) => {
                const {error} = this.store.oql;
                if (textArea && error)
                {
                    textArea.focus();
                    textArea.setSelectionRange(error.start, error.end);
                    this.store.geneQueryErrorDisplayStatus = 'focused';
                }
            };
    }

    render()
    {
        return (
                <FlexRow padded overflow className={styles.GeneSetSelector}>
                    <SectionHeader className="sectionLabel">
                        Enter Gene Sets:
                    </SectionHeader>

                    <FlexCol overflow>

                    <FlexRow padded className={styles.buttonRow}>
                    <button className="btn btn-default btn-sm" onClick={() => this.store.showGenesetsHierarchyPopup = true}>
                        Select Gene Sets
                    </button>
                    </FlexRow>

                    <textarea
                        ref={this.textAreaRef}
                        className={classNames(styles.geneSet, this.store.genesetQuery ? styles.notEmpty : styles.empty)}
                        rows={5}
                        cols={80}
                        placeholder="Enter Gene Sets"
                        title="Enter Gene Sets"
                        value={this.store.genesetQuery}
                        onChange={event => this.store.genesetQuery = event.currentTarget.value}
                        data-test='geneSet'
                    />

                    <GenesetValidator/>

                    <Modal
                        className={classNames('cbioportal-frontend',styles.GenesetsSelectorWindow)}
                        show={this.store.showGenesetsHierarchyPopup}
                        onHide={() => this.store.showGenesetsHierarchyPopup = false}
                    >
                    <Modal.Header closeButton>
                    <Modal.Title>Select Gene Sets From Hierarchy</Modal.Title>
                    </Modal.Header>
                    <GenesetsHierarchySelector
                        gsvaProfile={this.store.getFilteredProfiles("GENESET_SCORE")[0].molecularProfileId}
                        sampleListId={this.store.defaultSelectedSampleListId}
                    />
                    <Modal.Body>
                    </Modal.Body>
                    </Modal>

                    </FlexCol>
                </FlexRow>
        );
    }
}
