import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import { Button, Modal } from 'react-bootstrap';
import Helmet from 'react-helmet';
import * as request from 'superagent';
import fileDownload from 'react-file-download';
import { Link } from 'react-router-dom';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import {
    DataAccessToken,
    DataAccessTokenSummary,
} from 'cbioportal-ts-api-client';
import { PageLayout } from 'shared/components/PageLayout/PageLayout';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { getServerConfig } from 'config/config';
import { getInternalClient } from 'shared/api/cbioportalInternalClientInstance';
import { buildCBioPortalAPIUrl } from 'shared/api/urls';
import { SUPPORTED_DAT_METHODS } from 'shared/constants';
import {
    DATA_ACCESS_TOKEN_FILE_NAME,
    formatTokenDate,
    getNumberOfTokensRevokedOnCreate,
    getTokenFileContents,
    isTokenExpired,
} from './DataAccessTokensPageUtils';

const TOKEN_DOCS_URL =
    'https://docs.cbioportal.org/deployment/authorization-and-authentication/authenticating-users-via-tokens/#using-data-access-tokens';

// Bypasses the global superagent GET cache so the list reflects changes
function fetchDataAccessTokenSummaries(): Promise<DataAccessTokenSummary[]> {
    return (
        request
            .get(
                getInternalClient().getAllDataAccessTokenSummariesUsingGETURL(
                    {}
                )
            )
            .set('Accept', 'application/json')
            // @ts-ignore: this method comes from caching plugin and isn't in typing
            .forceUpdate(true)
            .then((res: any) => res.body)
    );
}

type PendingAction =
    | { kind: 'create' }
    | { kind: 'revoke'; token: DataAccessTokenSummary }
    | { kind: 'revokeAll' };

const ConfirmModal: React.FunctionComponent<{
    title: string;
    confirmLabel: string;
    confirmStyle: string;
    busy: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    children: React.ReactNode;
}> = props => (
    <Modal show={true} onHide={props.onCancel} animation={false}>
        <Modal.Header closeButton>
            <Modal.Title>{props.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{props.children}</Modal.Body>
        <Modal.Footer>
            <Button
                bsStyle={props.confirmStyle}
                data-test="confirmTokenAction"
                disabled={props.busy}
                onClick={props.onConfirm}
            >
                {props.confirmLabel}
            </Button>
            <Button onClick={props.onCancel} disabled={props.busy}>
                Cancel
            </Button>
        </Modal.Footer>
    </Modal>
);

@observer
export default class DataAccessTokensPage extends React.Component<{}, {}> {
    @observable.ref private tokens: DataAccessTokenSummary[] = [];
    @observable private tokensLoading = true;
    @observable private tokensLoadFailed = false;
    @observable.ref private pendingAction: PendingAction | undefined;
    @observable.ref private newToken: DataAccessToken | undefined;
    @observable private busy = false;
    @observable private copied = false;
    @observable.ref private errorMessage: string | undefined;

    constructor(props: {}) {
        super(props);
        makeObservable(this);
    }

    private get appStore() {
        return getBrowserWindow().globalStores.appStore;
    }

    @computed get datMethod(): string {
        return getServerConfig().dat_method;
    }

    @computed get canManageTokens(): boolean {
        return this.datMethod === 'uuid';
    }

    @computed get maxNumberOfTokens(): number {
        return Number(getServerConfig().dat_uuid_max_number_per_user);
    }

    componentDidMount() {
        this.reload();
    }

    @computed get tokensRevokedOnCreate(): DataAccessTokenSummary[] {
        const tokens = this.tokens;
        const n = getNumberOfTokensRevokedOnCreate(
            tokens.length,
            this.maxNumberOfTokens
        );
        // tokens are sorted by expiration ascending, oldest first
        return tokens.slice(0, n);
    }

    @action.bound
    private async reload() {
        if (!this.appStore.isLoggedIn || !this.canManageTokens) {
            return;
        }
        this.tokensLoading = true;
        try {
            const tokens = await fetchDataAccessTokenSummaries();
            action(() => {
                this.tokens = tokens;
                this.tokensLoadFailed = false;
            })();
        } catch (e) {
            action(() => (this.tokensLoadFailed = true))();
        } finally {
            action(() => (this.tokensLoading = false))();
        }
    }

    @action.bound
    private requestCreate() {
        this.errorMessage = undefined;
        if (this.tokensRevokedOnCreate.length > 0) {
            this.pendingAction = { kind: 'create' };
        } else {
            this.createToken();
        }
    }

    @action.bound
    private cancelPendingAction() {
        this.pendingAction = undefined;
    }

    private async runAction(fn: () => Promise<void>, failureMessage: string) {
        this.busy = true;
        this.errorMessage = undefined;
        try {
            await fn();
        } catch (e) {
            this.errorMessage = failureMessage;
        } finally {
            action(() => {
                this.busy = false;
                this.pendingAction = undefined;
            })();
            this.reload();
        }
    }

    @action.bound
    private createToken() {
        return this.runAction(async () => {
            const token = await getInternalClient().createDataAccessTokenUsingPOST(
                {}
            );
            action(() => {
                this.newToken = token;
                this.copied = false;
            })();
        }, 'Could not create a new token. Please try again.');
    }

    @action.bound
    private revokeToken(token: DataAccessTokenSummary) {
        return this.runAction(async () => {
            await getInternalClient().revokeDataAccessTokenByIdUsingDELETE({
                id: token.id,
            });
        }, 'Could not revoke the token. Please try again.');
    }

    @action.bound
    private revokeAllTokens() {
        return this.runAction(async () => {
            await getInternalClient().revokeAllDataAccessTokensUsingDELETE({});
            action(() => {
                this.newToken = undefined;
            })();
        }, 'Could not revoke your tokens. Please try again.');
    }

    @action.bound
    private confirmPendingAction() {
        const pending = this.pendingAction;
        if (!pending) {
            return;
        }
        switch (pending.kind) {
            case 'create':
                this.createToken();
                break;
            case 'revoke':
                this.revokeToken(pending.token);
                break;
            case 'revokeAll':
                this.revokeAllTokens();
                break;
        }
    }

    @action.bound
    private async copyNewToken() {
        if (!this.newToken) {
            return;
        }
        try {
            await navigator.clipboard.writeText(this.newToken.token);
            action(() => (this.copied = true))();
        } catch (e) {
            action(
                () =>
                    (this.errorMessage =
                        'Could not copy to the clipboard. Select the token and copy it manually.')
            )();
        }
    }

    @action.bound
    private downloadNewToken() {
        if (this.newToken) {
            fileDownload(
                getTokenFileContents(this.newToken),
                DATA_ACCESS_TOKEN_FILE_NAME
            );
        }
    }

    @action.bound
    private dismissNewToken() {
        this.newToken = undefined;
    }

    private renderNewToken() {
        if (!this.newToken) {
            return null;
        }
        return (
            <div className="alert alert-success" data-test="newDataAccessToken">
                <p>
                    <strong>Your new token has been created.</strong> Copy or
                    download it now. For your security it will not be shown
                    again.
                </p>
                <pre style={{ margin: '10px 0', userSelect: 'all' }}>
                    {this.newToken.token}
                </pre>
                <p style={{ marginBottom: 0 }}>
                    Expires {formatTokenDate(this.newToken.expiration)}.
                </p>
                <div style={{ marginTop: 10 }}>
                    <Button bsSize="small" onClick={this.copyNewToken}>
                        <i className="fa fa-copy" />{' '}
                        {this.copied ? 'Copied' : 'Copy'}
                    </Button>{' '}
                    <Button bsSize="small" onClick={this.downloadNewToken}>
                        <i className="fa fa-download" /> Download
                    </Button>{' '}
                    <Button
                        bsSize="small"
                        bsStyle="link"
                        onClick={this.dismissNewToken}
                    >
                        Done
                    </Button>
                </div>
            </div>
        );
    }

    private renderTokenTable() {
        if (this.tokensLoading && this.tokens.length === 0) {
            return <LoadingIndicator isLoading={true} center={true} />;
        }
        if (this.tokensLoadFailed) {
            return (
                <div className="alert alert-danger">
                    Could not load your tokens.{' '}
                    <a onClick={this.reload} style={{ cursor: 'pointer' }}>
                        Retry
                    </a>
                </div>
            );
        }
        const tokens = this.tokens;
        if (tokens.length === 0) {
            return (
                <p data-test="noDataAccessTokens">
                    You do not have any active tokens.
                </p>
            );
        }
        return (
            <table
                className="table table-striped"
                data-test="dataAccessTokensTable"
            >
                <thead>
                    <tr>
                        <th>Token</th>
                        <th>Created</th>
                        <th>Expires</th>
                        <th />
                    </tr>
                </thead>
                <tbody>
                    {tokens.map(token => (
                        <tr key={token.id}>
                            <td>
                                <code>{token.tokenPreview}</code>
                            </td>
                            <td>{formatTokenDate(token.creation)}</td>
                            <td>
                                {formatTokenDate(token.expiration)}
                                {isTokenExpired(token.expiration) && (
                                    <span
                                        className="label label-default"
                                        style={{ marginLeft: 5 }}
                                    >
                                        Expired
                                    </span>
                                )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                <Button
                                    bsSize="xsmall"
                                    bsStyle="danger"
                                    data-test="revokeDataAccessToken"
                                    disabled={this.busy}
                                    onClick={action(
                                        () =>
                                            (this.pendingAction = {
                                                kind: 'revoke',
                                                token,
                                            })
                                    )}
                                >
                                    Revoke
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    private renderConfirmModal() {
        const pending = this.pendingAction;
        if (!pending) {
            return null;
        }
        const common = {
            busy: this.busy,
            onConfirm: this.confirmPendingAction,
            onCancel: this.cancelPendingAction,
        };
        switch (pending.kind) {
            case 'create': {
                const revoked = this.tokensRevokedOnCreate;
                return (
                    <ConfirmModal
                        {...common}
                        title="Create a new token?"
                        confirmLabel="Create token"
                        confirmStyle="primary"
                    >
                        <p>
                            You can have at most {this.maxNumberOfTokens} active{' '}
                            {this.maxNumberOfTokens === 1 ? 'token' : 'tokens'}.
                            Creating a new token will revoke{' '}
                            {revoked.length === 1
                                ? 'your oldest token'
                                : `your ${revoked.length} oldest tokens`}
                            :
                        </p>
                        <ul>
                            {revoked.map(t => (
                                <li key={t.id}>
                                    <code>{t.tokenPreview}</code> (created{' '}
                                    {formatTokenDate(t.creation)})
                                </li>
                            ))}
                        </ul>
                        <p>
                            Scripts and tools using{' '}
                            {revoked.length === 1 ? 'it' : 'them'} will stop
                            working.
                        </p>
                    </ConfirmModal>
                );
            }
            case 'revoke':
                return (
                    <ConfirmModal
                        {...common}
                        title="Revoke token?"
                        confirmLabel="Revoke"
                        confirmStyle="danger"
                    >
                        <p>
                            Revoke token{' '}
                            <code>{pending.token.tokenPreview}</code> created{' '}
                            {formatTokenDate(pending.token.creation)}?
                        </p>
                        <p>
                            Any scripts or tools using this token will
                            immediately lose access. This cannot be undone.
                        </p>
                    </ConfirmModal>
                );
            case 'revokeAll':
                return (
                    <ConfirmModal
                        {...common}
                        title="Revoke all tokens?"
                        confirmLabel="Revoke all"
                        confirmStyle="danger"
                    >
                        <p>
                            All {this.tokens.length} of your tokens will be
                            revoked. Any scripts or tools using them will
                            immediately lose access. This cannot be undone.
                        </p>
                    </ConfirmModal>
                );
        }
    }

    private renderManagement() {
        const tokens = this.tokens;
        return (
            <>
                <p>
                    Data access tokens let scripts and tools such as the
                    cBioPortal R and Python clients access the{' '}
                    <Link to="/webAPI">web API</Link> on your behalf. Treat them
                    like a password. See the{' '}
                    <a href={TOKEN_DOCS_URL} target="_blank">
                        documentation
                    </a>{' '}
                    for how to use them.
                </p>
                {this.renderNewToken()}
                {this.errorMessage && (
                    <div className="alert alert-danger">
                        {this.errorMessage}
                    </div>
                )}
                <div style={{ marginBottom: 15 }}>
                    <Button
                        bsStyle="primary"
                        bsSize="small"
                        data-test="createDataAccessToken"
                        disabled={this.busy || this.tokensLoading}
                        onClick={this.requestCreate}
                    >
                        <i className="fa fa-plus" /> Create new token
                    </Button>{' '}
                    {tokens.length > 1 && (
                        <Button
                            bsSize="small"
                            data-test="revokeAllDataAccessTokens"
                            disabled={this.busy}
                            onClick={action(
                                () =>
                                    (this.pendingAction = {
                                        kind: 'revokeAll',
                                    })
                            )}
                        >
                            Revoke all
                        </Button>
                    )}
                </div>
                {this.renderTokenTable()}
                {this.maxNumberOfTokens > 0 && (
                    <p className="text-muted">
                        You can have up to {this.maxNumberOfTokens} active{' '}
                        {this.maxNumberOfTokens === 1 ? 'token' : 'tokens'}.
                    </p>
                )}
                {this.renderConfirmModal()}
            </>
        );
    }

    private renderContent() {
        if (!this.appStore.isLoggedIn) {
            return <p>Please sign in to manage your data access tokens.</p>;
        }
        if (
            this.appStore.isSocialAuthenticated ||
            !SUPPORTED_DAT_METHODS.includes(this.datMethod)
        ) {
            return <p>Data access tokens are not enabled on this portal.</p>;
        }
        if (!this.canManageTokens) {
            return (
                <>
                    <p>
                        Your token can be downloaded below. Listing and revoking
                        tokens is not supported for this portal's token
                        configuration.
                    </p>
                    <a
                        className="btn btn-primary btn-sm"
                        href={buildCBioPortalAPIUrl('api/data-access-token')}
                        target="_blank"
                    >
                        Download Token
                    </a>
                </>
            );
        }
        return this.renderManagement();
    }

    public render() {
        return (
            <PageLayout className={'whiteBackground staticPage'}>
                <Helmet>
                    <title>
                        {'cBioPortal for Cancer Genomics::Data Access Tokens'}
                    </title>
                </Helmet>
                <h1>Data Access Tokens</h1>
                {this.renderContent()}
            </PageLayout>
        );
    }
}
