import {
    CopyDownloadControls,
    ICopyDownloadData,
} from './CopyDownloadControls';
import React from 'react';
import { assert } from 'chai';
import { mount, ReactWrapper } from 'enzyme';
import sinon from 'sinon';

describe('CopyDownloadControls', () => {
    const completeData: ICopyDownloadData = {
        status: 'complete',
        text: 'This is your complete & shiny download data!',
    };

    const incompleteData: ICopyDownloadData = {
        status: 'incomplete',
        text: 'This data is incomplete, because sometimes shift happens!',
    };

    it('downloads the complete data without any error messages', done => {
        const resolvedPromiseWithCompleteData = Promise.resolve(completeData);
        const downloadData = () => resolvedPromiseWithCompleteData;
        const component: ReactWrapper<any, any> = mount(
            <CopyDownloadControls downloadData={downloadData} />
        );
        const instance = component.instance() as CopyDownloadControls;
        const downloadStub = sinon.stub(instance, 'download');

        instance.handleDownload();

        resolvedPromiseWithCompleteData
            .then(() => {
                assert.isTrue(
                    downloadStub.calledWith(
                        'This is your complete & shiny download data!'
                    )
                );
                assert.isFalse(instance.showErrorMessage);
                done();
            })
            .catch(done);
    });

    it('downloads the incomplete data, and shows a warning message', done => {
        const resolvedPromiseWithIncompleteData = Promise.resolve(
            incompleteData
        );
        const downloadData = () => resolvedPromiseWithIncompleteData;
        const component: ReactWrapper<any, any> = mount(
            <CopyDownloadControls downloadData={downloadData} />
        );
        const instance = component.instance() as CopyDownloadControls;
        const downloadStub = sinon.stub(instance, 'download');

        instance.handleDownload();

        resolvedPromiseWithIncompleteData
            .then(() => {
                assert.isTrue(
                    downloadStub.calledWith(
                        'This data is incomplete, because sometimes shift happens!'
                    )
                );
                assert.isTrue(instance.showErrorMessage);
                done();
            })
            .catch(done);
    });

    it('shows an error when downloading rejects', async () => {
        const downloadData = () => Promise.reject(new Error('download failed'));
        const component: ReactWrapper<any, any> = mount(
            <CopyDownloadControls downloadData={downloadData} />
        );
        const instance = component.instance() as CopyDownloadControls;

        instance.handleDownload();
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.isFalse(instance.downloadingData);
        assert.isTrue(instance.showErrorMessage);
    });

    it('cancels an in-flight download without showing an error', async () => {
        let resolveDownload: (data: ICopyDownloadData) => void = () =>
            undefined;
        const downloadPromise: any = new Promise(resolve => {
            resolveDownload = resolve;
        });
        downloadPromise.cancel = sinon.spy();
        const downloadData = () => downloadPromise;
        const component: ReactWrapper<any, any> = mount(
            <CopyDownloadControls downloadData={downloadData} />
        );
        const instance = component.instance() as CopyDownloadControls;

        instance.handleDownload();
        assert.isTrue(instance.downloadingData);

        instance.cancelDownload();
        assert.isTrue(downloadPromise.cancel.calledOnce);
        assert.isFalse(instance.downloadingData);

        resolveDownload(completeData);
        await Promise.resolve();
        assert.isFalse(instance.showErrorMessage);
    });

    it('copies the complete data without any error messages', done => {
        const resolvedPromiseWithCompleteData = Promise.resolve(completeData);
        const downloadData = () => resolvedPromiseWithCompleteData;
        const component: ReactWrapper<any, any> = mount(
            <CopyDownloadControls downloadData={downloadData} />
        );
        const instance = component.instance() as CopyDownloadControls;

        instance.initCopyProcess();

        resolvedPromiseWithCompleteData
            .then(() => {
                assert.equal(
                    instance.getText(),
                    'This is your complete & shiny download data!'
                );
                assert.isTrue(instance.copyingData);
                assert.isFalse(instance.showErrorMessage);
                done();
            })
            .catch(done);
    });

    it('copies the incomplete data, and shows a warning message', done => {
        const resolvedPromiseWithIncompleteData = Promise.resolve(
            incompleteData
        );
        const downloadData = () => resolvedPromiseWithIncompleteData;
        const component: ReactWrapper<any, any> = mount(
            <CopyDownloadControls downloadData={downloadData} />
        );
        const instance = component.instance() as CopyDownloadControls;

        instance.initCopyProcess();

        resolvedPromiseWithIncompleteData
            .then(() => {
                assert.equal(
                    instance.getText(),
                    'This data is incomplete, because sometimes shift happens!'
                );
                assert.isTrue(instance.copyingData);
                assert.isTrue(instance.showErrorMessage);
                done();
            })
            .catch(done);
    });
});
