// Heavy entry: the React viewer. Hosts load it lazily; OpenSeadragon is
// loaded on first slide open as a separate chunk.
export {
    default,
    default as WsiViewer,
    WsiViewerProps,
} from './WsiViewerEntry';
export { WsiViewerConfig } from './wsiViewerConfig';
