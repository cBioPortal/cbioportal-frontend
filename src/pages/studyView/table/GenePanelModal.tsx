import * as React from "react";
import { Modal, Button } from "react-bootstrap";
import {GenePanel, GenePanelToGene} from "shared/api/generated/CBioPortalAPI";
import { observer } from "mobx-react";
import {observable, action} from 'mobx';
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import autobind from 'autobind-decorator';
import MobxPromiseCache from "shared/lib/MobxPromiseCache";

interface IGeneModalProps {
    genePanelCache: MobxPromiseCache<{ genePanelId: string }, GenePanel>;
    panelName: string;
    show: boolean;
    hide: () => void;
}

interface IGenePanelTooltipProps {
    genePanelIds: string[];
    toggleModal: (panelId: string) => void;
}

export const GenePanelList: React.FunctionComponent<IGenePanelTooltipProps> = ({
    genePanelIds,
    toggleModal
}) => {
    if (genePanelIds.length > 0) {
        return (
            <span style={{maxWidth: 400}}>
                Gene panels:{" "}
                {genePanelIds.map((genePanelId, i) => [
                    i > 0 && ", ",
                    <a key={genePanelId}
                       data-test={`gene-panel-linkout-${genePanelId}`}
                        href="#"
                        onClick={() => {
                            toggleModal(genePanelId);
                        }}
                    >
                        {genePanelId}
                    </a>
                ])}
            </span>
        );
    } else {
        return null;
    }
};

@observer
export class GenePanelModal extends React.Component<IGeneModalProps, {}> {
    render() {
        const mobxPromise = this.props.genePanelCache.get({genePanelId: this.props.panelName});
        return (
            <Modal show={this.props.show} onHide={this.props.hide} keyboard>
                <Modal.Header closeButton>
                    <Modal.Title data-test="gene-panel-modal-title">{this.props.panelName}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{maxHeight: "calc(100vh - 210px)", overflowY: "auto"}}>
                    {this.props.show && mobxPromise.isPending &&
                    <LoadingIndicator isLoading={true}/>}
                    {this.props.show && mobxPromise.isComplete &&
                    <div data-test="gene-panel-modal-body">
                        {mobxPromise.result!.genes.map(gene => (
                            <p key={gene.entrezGeneId}>{gene.hugoGeneSymbol}</p>
                        ))}
                    </div>}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.hide}>Close</Button>
                </Modal.Footer>
            </Modal>
        );
    }
};
