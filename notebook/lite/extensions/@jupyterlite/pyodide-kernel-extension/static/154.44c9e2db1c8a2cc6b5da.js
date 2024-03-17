'use strict';
(self.webpackChunk_jupyterlite_pyodide_kernel_extension =
    self.webpackChunk_jupyterlite_pyodide_kernel_extension || []).push([
    [154],
    {
        260: (e, l, n) => {
            n.r(l),
                n.d(l, { KERNEL_SETTINGS_SCHEMA: () => o, default: () => p });
            var t = n(281),
                i = n(976),
                s = n(240),
                r = n(540);
            const a = n.p + 'schema/kernel.v0.schema.json';
            var o = n.t(a);
            const h = `data:image/svg+xml;base64,${btoa(
                    '<?xml version="1.0" encoding="UTF-8"?>\n<svg width="182" height="182" data-name="Layer 1" version="1.1" viewBox="0 0 182 182" xmlns="http://www.w3.org/2000/svg">\n <defs>\n  <style>.cls-1 {\n        fill: #fff;\n      }\n\n      .cls-2 {\n        fill: #654ff0;\n      }</style>\n </defs>\n <rect width="182" height="182" fill="#fff" stop-color="#000000" style="paint-order:stroke fill markers"/>\n <rect class="cls-1" x="107" y="125" width="50" height="32"/>\n <path class="cls-2" d="m135.18 97c0-0.13-0.01-7.24-0.02-7.37h27.51v71.33h-71.34v-71.33h27.51c0 0.13-0.02 7.24-0.02 7.37m32.59 56.33h4.9l-7.43-25.25h-7.45l-6.12 25.25h4.75l1.24-5.62h8.49l1.61 5.62zm-26.03 0h4.69l6.02-25.25h-4.63l-3.69 17.4h-0.06l-3.5-17.4h-4.42l-3.9 17.19h-0.06l-3.23-17.19h-4.72l5.44 25.25h4.78l3.75-17.19h0.06zm18.89-19.03h1.99l2.37 9.27h-6.42z"/>\n <path d="m89 49.66c0 10.6-8.8 20-20 20h-40v20h-10v-70h50c10.7 0 19.7 8.9 20 20zm-10-10c0-5.5-4.5-10-10-10h-40v30h40c5.5 0 10-4.5 10-10z"/>\n <path d="m132 67.66v22h-10v-22l-30-33v-15h10v10.9l25 27.5 25-27.5v-10.9h10v15z"/>\n</svg>\n'
                )}`,
                d = '@jupyterlite/pyodide-kernel-extension:kernel',
                p = [
                    {
                        id: d,
                        autoStart: !0,
                        requires: [s.IKernelSpecs],
                        optional: [
                            i.IServiceWorkerManager,
                            r.IBroadcastChannelWrapper,
                        ],
                        activate: (e, l, i, s) => {
                            const r =
                                    JSON.parse(
                                        t.PageConfig.getOption(
                                            'litePluginSettings'
                                        ) || '{}'
                                    )[d] || {},
                                a =
                                    r.pyodideUrl ||
                                    'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js',
                                o = t.URLExt.parse(a).href,
                                p = r.pipliteWheelUrl
                                    ? t.URLExt.parse(r.pipliteWheelUrl).href
                                    : void 0,
                                c = (r.pipliteUrls || []).map(
                                    e => t.URLExt.parse(e).href
                                ),
                                v = !!r.disablePyPIFallback;
                            l.register({
                                spec: {
                                    name: 'python',
                                    display_name: 'Python (Pyodide)',
                                    language: 'python',
                                    argv: [],
                                    resources: {
                                        'logo-32x32': h,
                                        'logo-64x64': h,
                                    },
                                },
                                create: async e => {
                                    const { PyodideKernel: l } = await n
                                            .e(728)
                                            .then(n.t.bind(n, 728, 23)),
                                        t = !(
                                            !(null == i ? void 0 : i.enabled) ||
                                            !(null == s ? void 0 : s.enabled)
                                        );
                                    return (
                                        t
                                            ? console.info(
                                                  'Pyodide contents will be synced with Jupyter Contents'
                                              )
                                            : console.warn(
                                                  'Pyodide contents will NOT be synced with Jupyter Contents'
                                              ),
                                        new l({
                                            ...e,
                                            pyodideUrl: o,
                                            pipliteWheelUrl: p,
                                            pipliteUrls: c,
                                            disablePyPIFallback: v,
                                            mountDrive: t,
                                        })
                                    );
                                },
                            });
                        },
                    },
                ];
        },
    },
]);
//# sourceMappingURL=154.44c9e2db1c8a2cc6b5da.js.map?v=44c9e2db1c8a2cc6b5da
