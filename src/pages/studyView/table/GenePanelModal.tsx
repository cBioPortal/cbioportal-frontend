import * as React from "react";
import { Modal, Button } from "react-bootstrap";
import { GenePanelToGene, GenePanel } from "shared/api/generated/CBioPortalAPIInternal";

interface IGeneModalProps {
    genes: GenePanelToGene[];
    panelName: string;
    show: boolean;
    hide: () => void;
}

interface IGenePanelTooltipProps {
    genePanels: GenePanel[];
    toggleModal: (panelName: string, genes: GenePanelToGene[]) => void;
}

export const GenePanelList: React.FunctionComponent<IGenePanelTooltipProps> = ({
    genePanels,
    toggleModal
}) => {
    if (genePanels.length > 0) {
        return (
            <span style={{maxWidth: 400}}>
                Gene panels:{" "}
                {genePanels.map((panel, i) => [
                    i > 0 && ", ",
                    <a key={panel.genePanelId}
                        href="#"
                        onClick={() => {
                            toggleModal(panel.genePanelId, panel.genes);
                        }}
                    >
                        {panel.genePanelId}
                    </a>
                ])}
            </span>
        );
    } else {
        return <span />;
    }
};

export const GenePanelModal: React.FunctionComponent<IGeneModalProps> = ({
    show,
    panelName,
    genes,
    hide
}) => {
    return (
        <Modal show={show} onHide={hide} keyboard>
            <Modal.Header closeButton>
                <Modal.Title>{panelName}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: "calc(100vh - 210px)", overflowY: "auto" }}>
                {genes.map(gene => (
                    <p key={gene.entrezGeneId}>{gene.hugoGeneSymbol}</p>
                ))}
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={hide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};
