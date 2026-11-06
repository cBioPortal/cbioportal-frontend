import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ClinicalTrackSpec } from './Oncoprint';
import {
    getClinicalTrackColor,
    getClinicalTrackValues,
} from './ResultsViewOncoprint';
import { Modal } from 'react-bootstrap';
import ClinicalTrackColorPicker from './ClinicalTrackColorPicker';
import { RGBAColor } from 'oncoprintjs';
import classnames from 'classnames';
import _ from 'lodash';
import fileDownload from 'react-file-download';
import { rgbaToHex } from 'shared/lib/Colors';
import {
    buildEffectivePalette,
    PALETTE_FILE_NAME,
    PaletteParseError,
    parsePaletteFile,
    resolvePaletteToTracks,
    serializePalette,
    TrackLabelToValueToColor,
} from './OncoprintColorPalette';

interface IOncoprintColorModalProps {
    setTrackKeySelectedForEdit: (key: string | null) => void;
    selectedClinicalTrack: ClinicalTrackSpec;
    handleSelectedClinicalTrackColorChange: (
        value: string,
        color: RGBAColor | undefined
    ) => void;
    getSelectedClinicalTrackDefaultColorForValue: (value: string) => number[];
    /**
     * Every clinical track in the oncoprint, not just the one being edited: palette
     * import/export deliberately works across all of them so a whole project palette can move
     * in one go.
     */
    allClinicalTracks: ClinicalTrackSpec[];
    applyPaletteColors: (colors: TrackLabelToValueToColor) => void;
}

type ImportStatus = { kind: 'error' | 'success'; message: string };

export const OncoprintColorModal: React.FC<IOncoprintColorModalProps> = observer(
    ({
        setTrackKeySelectedForEdit,
        selectedClinicalTrack,
        handleSelectedClinicalTrackColorChange,
        getSelectedClinicalTrackDefaultColorForValue,
        allClinicalTracks,
        applyPaletteColors,
    }: IOncoprintColorModalProps) => {
        const clinicalTrackValues = getClinicalTrackValues(
            selectedClinicalTrack
        );
        const fileInputRef = React.useRef<HTMLInputElement>(null);
        const [importStatus, setImportStatus] = React.useState<
            ImportStatus | undefined
        >(undefined);

        const onExport = () => {
            const palette = buildEffectivePalette(
                allClinicalTracks,
                getClinicalTrackValues,
                getClinicalTrackColor
            );
            fileDownload(serializePalette(palette), PALETTE_FILE_NAME);
        };

        const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files && e.target.files[0];
            // reset so choosing the same file again still fires a change event
            e.target.value = '';
            if (!file) {
                return;
            }
            const reader = new FileReader();
            reader.onerror = () =>
                setImportStatus({
                    kind: 'error',
                    message: 'Could not read that file.',
                });
            reader.onload = () => {
                try {
                    const resolved = resolvePaletteToTracks(
                        parsePaletteFile(String(reader.result)),
                        allClinicalTracks,
                        getClinicalTrackValues
                    );
                    if (resolved.appliedCount === 0) {
                        setImportStatus({
                            kind: 'error',
                            message:
                                'Nothing in this palette matched a track value in this OncoPrint.',
                        });
                        return;
                    }
                    applyPaletteColors(resolved.colors);
                    const skipped =
                        resolved.unmatched.length + resolved.invalid.length;
                    setImportStatus({
                        kind: 'success',
                        message: `Applied ${resolved.appliedCount} ${
                            resolved.appliedCount === 1 ? 'color' : 'colors'
                        } across ${resolved.trackCount} ${
                            resolved.trackCount === 1 ? 'track' : 'tracks'
                        }.${
                            skipped > 0
                                ? ` ${skipped} entr${
                                      skipped === 1 ? 'y was' : 'ies were'
                                  } skipped: ${resolved.unmatched
                                      .concat(resolved.invalid)
                                      .slice(0, 5)
                                      .join(', ')}${skipped > 5 ? ', …' : ''}.`
                                : ''
                        }`,
                    });
                } catch (e) {
                    setImportStatus({
                        kind: 'error',
                        message:
                            e instanceof PaletteParseError
                                ? e.message
                                : 'Could not read that palette file.',
                    });
                }
            };
            reader.readAsText(file);
        };

        return (
            <Modal show={true} onHide={() => setTrackKeySelectedForEdit(null)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Color Configuration: {selectedClinicalTrack.label}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Value</th>
                                <th>Color</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clinicalTrackValues.map(value => (
                                <tr>
                                    <td>{value}</td>
                                    <td>
                                        <ClinicalTrackColorPicker
                                            handleClinicalTrackColorChange={
                                                handleSelectedClinicalTrackColorChange
                                            }
                                            clinicalTrackValue={value}
                                            color={getClinicalTrackColor(
                                                selectedClinicalTrack,
                                                value as string
                                            )}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button
                        className={classnames('btn', 'btn-default', 'btn-sm', {
                            hidden: _.every(
                                clinicalTrackValues,
                                v =>
                                    rgbaToHex(
                                        getClinicalTrackColor(
                                            selectedClinicalTrack,
                                            v as string
                                        )
                                    ) ===
                                    rgbaToHex(
                                        getSelectedClinicalTrackDefaultColorForValue(
                                            v
                                        ) as RGBAColor
                                    )
                            ),
                        })}
                        data-test="resetColors"
                        style={{ marginTop: 5 }}
                        onClick={() => {
                            clinicalTrackValues.forEach(v => {
                                handleSelectedClinicalTrackColorChange(
                                    v,
                                    undefined
                                );
                            });
                        }}
                    >
                        Reset Colors
                    </button>

                    <hr style={{ marginTop: 15, marginBottom: 10 }} />

                    <div data-test="colorPaletteControls">
                        <div style={{ marginBottom: 6 }}>
                            <strong>Color palette</strong>
                            <div
                                className="text-muted"
                                style={{ fontSize: 11 }}
                            >
                                Covers every clinical track in this OncoPrint,
                                not only {selectedClinicalTrack.label}. Import
                                accepts a{' '}
                                <code>{'{"track": {"value": "#rrggbb"}}'}</code>{' '}
                                file, a flat{' '}
                                <code>{'{"value": "#rrggbb"}'}</code> file
                                applied to all tracks, or a two column
                                name/color CSV or TSV.
                            </div>
                        </div>
                        <button
                            className="btn btn-default btn-sm"
                            data-test="exportColorPalette"
                            onClick={onExport}
                        >
                            Export palette
                        </button>
                        <button
                            className="btn btn-default btn-sm"
                            data-test="importColorPalette"
                            style={{ marginLeft: 5 }}
                            onClick={() =>
                                fileInputRef.current &&
                                fileInputRef.current.click()
                            }
                        >
                            Import palette
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json,.csv,.tsv,.txt,application/json,text/csv,text/plain"
                            data-test="importColorPaletteInput"
                            style={{ display: 'none' }}
                            onChange={onFileChosen}
                        />
                        {importStatus && (
                            <div
                                className={
                                    importStatus.kind === 'error'
                                        ? 'text-danger'
                                        : 'text-success'
                                }
                                data-test="colorPaletteImportStatus"
                                style={{ marginTop: 6, fontSize: 12 }}
                            >
                                {importStatus.message}
                            </div>
                        )}
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
);
