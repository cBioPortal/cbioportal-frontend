declare module 'web-worker:*' {
    // rollup-plugin-web-worker-loader exposes a Worker constructor at runtime.
    const WorkerFactory: { new (): Worker };
    export default WorkerFactory;
}
