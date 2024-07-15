import { action, observable } from 'mobx';
import React from 'react';
import {
    Modal,
    Form,
    FormControl,
    FormGroup,
    ControlLabel,
    Button,
} from 'react-bootstrap';
import { buildCBioPortalPageUrl } from 'shared/api/urls';

interface FilenameModalProps {
    show: boolean;
    fileContent: string;
    fileName: string;
    handleClose: () => void;
}

interface FilenameModalState {
    folderName: string;
    validated: boolean;
    errorMessage: string;
}

class JupyterNoteBookModal extends React.Component<
    FilenameModalProps,
    FilenameModalState
> {
    constructor(props: FilenameModalProps) {
        super(props);
        this.state = {
            folderName: '',
            validated: false,
            errorMessage: '',
        };
    }

    componentDidMount() {
        this.setState({ folderName: '' });
    }

    handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ folderName: event.target.value, errorMessage: '' });
    };

    @action
    handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const { folderName } = this.state;

        if (folderName.trim() === '' || /\s/.test(folderName)) {
            this.setState({
                validated: false,
                errorMessage: 'Session name cannot be empty or contain spaces',
            });
            return;
        }

        const { fileContent, fileName } = this.props;

        const jupyterNotebookTool = window.open(
            buildCBioPortalPageUrl('/jupyternotebook')
        ) as any;

        jupyterNotebookTool.clientPostedData = {
            fileContent: fileContent,
            filename: `${fileName}.csv`,
            folderName: folderName,
        };

        this.setState({ folderName: '', validated: false, errorMessage: '' });
        this.props.handleClose();
    };

    render() {
        const { show, handleClose } = this.props;
        const { folderName, errorMessage } = this.state;

        return (
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Enter Folder Name</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form
                        onSubmit={e =>
                            this.handleSubmit(
                                (e as unknown) as React.FormEvent<
                                    HTMLFormElement
                                >
                            )
                        }
                    >
                        <FormGroup controlId="formFolderName">
                            <ControlLabel className="py-2">
                                Session Name
                            </ControlLabel>
                            <FormControl
                                type="text"
                                placeholder="Enter Session Name"
                                value={folderName}
                                onChange={e =>
                                    this.handleChange(
                                        (e as unknown) as React.ChangeEvent<
                                            HTMLInputElement
                                        >
                                    )
                                }
                                required
                            />
                            {errorMessage && (
                                <div style={{ color: 'red' }}>
                                    {errorMessage}
                                </div>
                            )}
                        </FormGroup>
                        <Modal.Footer>
                            <Button onClick={handleClose}>Close</Button>
                            <Button type="submit">Open Jupyter Notebook</Button>
                        </Modal.Footer>
                    </Form>
                </Modal.Body>
            </Modal>
        );
    }
}

export default JupyterNoteBookModal;
