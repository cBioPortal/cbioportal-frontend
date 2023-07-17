/*! For license information please see 8101.8ebbb2f.js.LICENSE.txt */
(self.webpackChunk_JUPYTERLAB_CORE_OUTPUT =
    self.webpackChunk_JUPYTERLAB_CORE_OUTPUT || []).push([
    [8101],
    {
        98639: (e, t, a) => {
            'use strict';
            Object.defineProperty(t, '__esModule', { value: !0 }),
                (t.ActivityMonitor = void 0);
            const n = a(32798);
            t.ActivityMonitor = class {
                constructor(e) {
                    (this._timer = -1),
                        (this._timeout = -1),
                        (this._isDisposed = !1),
                        (this._activityStopped = new n.Signal(this)),
                        e.signal.connect(this._onSignalFired, this),
                        (this._timeout = e.timeout || 1e3);
                }
                get activityStopped() {
                    return this._activityStopped;
                }
                get timeout() {
                    return this._timeout;
                }
                set timeout(e) {
                    this._timeout = e;
                }
                get isDisposed() {
                    return this._isDisposed;
                }
                dispose() {
                    this._isDisposed ||
                        ((this._isDisposed = !0), n.Signal.clearData(this));
                }
                _onSignalFired(e, t) {
                    clearTimeout(this._timer),
                        (this._sender = e),
                        (this._args = t),
                        (this._timer = setTimeout(() => {
                            this._activityStopped.emit({
                                sender: this._sender,
                                args: this._args,
                            });
                        }, this._timeout));
                }
            };
        },
        54705: function(e, t, a) {
            'use strict';
            var n =
                    (this && this.__createBinding) ||
                    (Object.create
                        ? function(e, t, a, n) {
                              void 0 === n && (n = a),
                                  Object.defineProperty(e, n, {
                                      enumerable: !0,
                                      get: function() {
                                          return t[a];
                                      },
                                  });
                          }
                        : function(e, t, a, n) {
                              void 0 === n && (n = a), (e[n] = t[a]);
                          }),
                s =
                    (this && this.__exportStar) ||
                    function(e, t) {
                        for (var a in e)
                            'default' === a ||
                                Object.prototype.hasOwnProperty.call(t, a) ||
                                n(t, e, a);
                    };
            Object.defineProperty(t, '__esModule', { value: !0 }),
                s(a(98639), t),
                s(a(84413), t),
                s(a(84024), t),
                s(a(58479), t),
                s(a(36112), t),
                s(a(78627), t),
                s(a(77661), t),
                s(a(2664), t);
        },
        84413: (e, t) => {
            'use strict';
            Object.defineProperty(t, '__esModule', { value: !0 });
        },
        84024: (e, t) => {
            'use strict';
            Object.defineProperty(t, '__esModule', { value: !0 }),
                (t.MarkdownCodeBlocks = void 0),
                (function(e) {
                    e.CODE_BLOCK_MARKER = '```';
                    const t = [
                        '.markdown',
                        '.mdown',
                        '.mkdn',
                        '.md',
                        '.mkd',
                        '.mdwn',
                        '.mdtxt',
                        '.mdtext',
                        '.text',
                        '.txt',
                        '.Rmd',
                    ];
                    class a {
                        constructor(e) {
                            (this.startLine = e),
                                (this.code = ''),
                                (this.endLine = -1);
                        }
                    }
                    (e.MarkdownCodeBlock = a),
                        (e.isMarkdown = function(e) {
                            return t.indexOf(e) > -1;
                        }),
                        (e.findMarkdownCodeBlocks = function(t) {
                            if (!t || '' === t) return [];
                            const n = t.split('\n'),
                                s = [];
                            let r = null;
                            for (let t = 0; t < n.length; t++) {
                                const i = n[t],
                                    d = 0 === i.indexOf(e.CODE_BLOCK_MARKER),
                                    _ = null != r;
                                if (d || _)
                                    if (_)
                                        r &&
                                            (d
                                                ? ((r.endLine = t - 1),
                                                  s.push(r),
                                                  (r = null))
                                                : (r.code += i + '\n'));
                                    else {
                                        r = new a(t);
                                        const n = i.indexOf(
                                                e.CODE_BLOCK_MARKER
                                            ),
                                            d = i.lastIndexOf(
                                                e.CODE_BLOCK_MARKER
                                            );
                                        n !== d &&
                                            ((r.code = i.substring(
                                                n + e.CODE_BLOCK_MARKER.length,
                                                d
                                            )),
                                            (r.endLine = t),
                                            s.push(r),
                                            (r = null));
                                    }
                            }
                            return s;
                        });
                })(t.MarkdownCodeBlocks || (t.MarkdownCodeBlocks = {}));
        },
        58479: function(__unused_webpack_module, exports, __webpack_require__) {
            'use strict';
            var process = __webpack_require__(18533),
                __importDefault =
                    (this && this.__importDefault) ||
                    function(e) {
                        return e && e.__esModule ? e : { default: e };
                    };
            Object.defineProperty(exports, '__esModule', { value: !0 }),
                (exports.PageConfig = void 0);
            const coreutils_1 = __webpack_require__(26169),
                minimist_1 = __importDefault(__webpack_require__(82646)),
                url_1 = __webpack_require__(2664);
            var PageConfig;
            (function(PageConfig) {
                function getOption(name) {
                    if (configData)
                        return configData[name] || getBodyData(name);
                    configData = Object.create(null);
                    let found = !1;
                    if ('undefined' != typeof document && document) {
                        const e = document.getElementById(
                            'jupyter-config-data'
                        );
                        e &&
                            ((configData = JSON.parse(e.textContent || '')),
                            (found = !0));
                    }
                    if (!found && process.argv)
                        try {
                            const cli = minimist_1.default(
                                    process.argv.slice(2)
                                ),
                                path = __webpack_require__(67477);
                            let fullPath = '';
                            'jupyter-config-data' in cli
                                ? (fullPath = path.resolve(
                                      cli['jupyter-config-data']
                                  ))
                                : 'JUPYTER_CONFIG_DATA' in {} &&
                                  (fullPath = path.resolve(
                                      {}.JUPYTER_CONFIG_DATA
                                  )),
                                fullPath &&
                                    (configData = eval('require')(fullPath));
                        } catch (e) {
                            console.error(e);
                        }
                    if (coreutils_1.JSONExt.isObject(configData))
                        for (const e in configData)
                            'string' != typeof configData[e] &&
                                (configData[e] = JSON.stringify(configData[e]));
                    else configData = Object.create(null);
                    return configData[name] || getBodyData(name);
                }
                function setOption(e, t) {
                    const a = getOption(e);
                    return (configData[e] = t), a;
                }
                function getBaseUrl() {
                    return url_1.URLExt.normalize(getOption('baseUrl') || '/');
                }
                function getTreeUrl() {
                    return url_1.URLExt.join(
                        getBaseUrl(),
                        getOption('treeUrl')
                    );
                }
                function getShareUrl() {
                    return url_1.URLExt.normalize(
                        getOption('shareUrl') || getBaseUrl()
                    );
                }
                function getTreeShareUrl() {
                    return url_1.URLExt.normalize(
                        url_1.URLExt.join(getShareUrl(), getOption('treeUrl'))
                    );
                }
                function getUrl(e) {
                    var t, a, n, s;
                    let r = e.toShare ? getShareUrl() : getBaseUrl();
                    const i =
                            null !== (t = e.mode) && void 0 !== t
                                ? t
                                : getOption('mode'),
                        d =
                            null !== (a = e.workspace) && void 0 !== a
                                ? a
                                : getOption('workspace'),
                        _ = 'single-document' === i ? 'doc' : 'lab';
                    (r = url_1.URLExt.join(r, _)),
                        d !== PageConfig.defaultWorkspace &&
                            (r = url_1.URLExt.join(
                                r,
                                'workspaces',
                                encodeURIComponent(
                                    null !== (n = getOption('workspace')) &&
                                        void 0 !== n
                                        ? n
                                        : PageConfig.defaultWorkspace
                                )
                            ));
                    const o =
                        null !== (s = e.treePath) && void 0 !== s
                            ? s
                            : getOption('treePath');
                    return (
                        o &&
                            (r = url_1.URLExt.join(
                                r,
                                'tree',
                                url_1.URLExt.encodeParts(o)
                            )),
                        r
                    );
                }
                function getWsUrl(e) {
                    let t = getOption('wsUrl');
                    if (!t) {
                        if (
                            0 !==
                            (e = e
                                ? url_1.URLExt.normalize(e)
                                : getBaseUrl()).indexOf('http')
                        )
                            return '';
                        t = 'ws' + e.slice(4);
                    }
                    return url_1.URLExt.normalize(t);
                }
                function getNBConvertURL({ path: e, format: t, download: a }) {
                    const n = url_1.URLExt.encodeParts(e),
                        s = url_1.URLExt.join(getBaseUrl(), 'nbconvert', t, n);
                    return a ? s + '?download=true' : s;
                }
                function getToken() {
                    return getOption('token') || getBodyData('jupyterApiToken');
                }
                function getNotebookVersion() {
                    const e = getOption('notebookVersion');
                    return '' === e ? [0, 0, 0] : JSON.parse(e);
                }
                (PageConfig.getOption = getOption),
                    (PageConfig.setOption = setOption),
                    (PageConfig.getBaseUrl = getBaseUrl),
                    (PageConfig.getTreeUrl = getTreeUrl),
                    (PageConfig.getShareUrl = getShareUrl),
                    (PageConfig.getTreeShareUrl = getTreeShareUrl),
                    (PageConfig.getUrl = getUrl),
                    (PageConfig.defaultWorkspace = 'default'),
                    (PageConfig.getWsUrl = getWsUrl),
                    (PageConfig.getNBConvertURL = getNBConvertURL),
                    (PageConfig.getToken = getToken),
                    (PageConfig.getNotebookVersion = getNotebookVersion);
                let configData = null,
                    Extension;
                function getBodyData(e) {
                    if ('undefined' == typeof document || !document.body)
                        return '';
                    const t = document.body.dataset[e];
                    return void 0 === t ? '' : decodeURIComponent(t);
                }
                !(function(e) {
                    function t(e) {
                        try {
                            const t = getOption(e);
                            if (t) return JSON.parse(t);
                        } catch (t) {
                            console.warn(`Unable to parse ${e}.`, t);
                        }
                        return [];
                    }
                    (e.deferred = t('deferredExtensions')),
                        (e.disabled = t('disabledExtensions')),
                        (e.isDeferred = function(t) {
                            const a = t.indexOf(':');
                            let n = '';
                            return (
                                -1 !== a && (n = t.slice(0, a)),
                                e.deferred.some(e => e === t || (n && e === n))
                            );
                        }),
                        (e.isDisabled = function(t) {
                            const a = t.indexOf(':');
                            let n = '';
                            return (
                                -1 !== a && (n = t.slice(0, a)),
                                e.disabled.some(e => e === t || (n && e === n))
                            );
                        });
                })(
                    (Extension =
                        PageConfig.Extension || (PageConfig.Extension = {}))
                );
            })((PageConfig = exports.PageConfig || (exports.PageConfig = {})));
        },
        36112: (e, t, a) => {
            'use strict';
            Object.defineProperty(t, '__esModule', { value: !0 }),
                (t.PathExt = void 0);
            const n = a(67477);
            !(function(e) {
                function t(e) {
                    return 0 === e.indexOf('/') && (e = e.slice(1)), e;
                }
                (e.join = function(...e) {
                    const a = n.posix.join(...e);
                    return '.' === a ? '' : t(a);
                }),
                    (e.basename = function(e, t) {
                        return n.posix.basename(e, t);
                    }),
                    (e.dirname = function(e) {
                        const a = t(n.posix.dirname(e));
                        return '.' === a ? '' : a;
                    }),
                    (e.extname = function(e) {
                        return n.posix.extname(e);
                    }),
                    (e.normalize = function(e) {
                        return '' === e ? '' : t(n.posix.normalize(e));
                    }),
                    (e.resolve = function(...e) {
                        return t(n.posix.resolve(...e));
                    }),
                    (e.relative = function(e, a) {
                        return t(n.posix.relative(e, a));
                    }),
                    (e.normalizeExtension = function(e) {
                        return (
                            e.length > 0 &&
                                0 !== e.indexOf('.') &&
                                (e = `.${e}`),
                            e
                        );
                    }),
                    (e.removeSlash = t);
            })(t.PathExt || (t.PathExt = {}));
        },
        78627: (e, t) => {
            'use strict';
            Object.defineProperty(t, '__esModule', { value: !0 }),
                (t.Text = void 0),
                (function(e) {
                    const t = '𝐚'.length > 1;
                    (e.jsIndexToCharIndex = function(e, a) {
                        if (t) return e;
                        let n = e;
                        for (let t = 0; t + 1 < a.length && t < e; t++) {
                            const e = a.charCodeAt(t);
                            if (e >= 55296 && e <= 56319) {
                                const e = a.charCodeAt(t + 1);
                                e >= 56320 && e <= 57343 && (n--, t++);
                            }
                        }
                        return n;
                    }),
                        (e.charIndexToJsIndex = function(e, a) {
                            if (t) return e;
                            let n = e;
                            for (let e = 0; e + 1 < a.length && e < n; e++) {
                                const t = a.charCodeAt(e);
                                if (t >= 55296 && t <= 56319) {
                                    const t = a.charCodeAt(e + 1);
                                    t >= 56320 && t <= 57343 && (n++, e++);
                                }
                            }
                            return n;
                        }),
                        (e.camelCase = function(e, t = !1) {
                            return e.replace(/^(\w)|[\s-_:]+(\w)/g, function(
                                e,
                                a,
                                n
                            ) {
                                return n
                                    ? n.toUpperCase()
                                    : t
                                    ? a.toUpperCase()
                                    : a.toLowerCase();
                            });
                        }),
                        (e.titleCase = function(e) {
                            return (e || '')
                                .toLowerCase()
                                .split(' ')
                                .map(
                                    e => e.charAt(0).toUpperCase() + e.slice(1)
                                )
                                .join(' ');
                        });
                })(t.Text || (t.Text = {}));
        },
        77661: function(e, t, a) {
            'use strict';
            var n =
                (this && this.__importDefault) ||
                function(e) {
                    return e && e.__esModule ? e : { default: e };
                };
            Object.defineProperty(t, '__esModule', { value: !0 }),
                (t.Time = void 0);
            const s = n(a(37485));
            var r;
            ((r = t.Time || (t.Time = {})).formatHuman = function(e) {
                s.default.locale(document.documentElement.lang);
                let t = s.default(e).fromNow();
                return (t = 'a few seconds ago' === t ? 'seconds ago' : t), t;
            }),
                (r.format = function(e, t = 'YYYY-MM-DD HH:mm') {
                    return s.default(e).format(t);
                });
        },
        2664: function(e, t, a) {
            'use strict';
            var n =
                (this && this.__importDefault) ||
                function(e) {
                    return e && e.__esModule ? e : { default: e };
                };
            Object.defineProperty(t, '__esModule', { value: !0 }),
                (t.URLExt = void 0);
            const s = a(67477),
                r = n(a(75158));
            !(function(e) {
                function t(e) {
                    if ('undefined' != typeof document && document) {
                        const t = document.createElement('a');
                        return (t.href = e), t;
                    }
                    return r.default(e);
                }
                function a(...e) {
                    const t = r.default(e[0], {}),
                        a = `${t.protocol}${t.slashes ? '//' : ''}${t.auth}${
                            t.auth ? '@' : ''
                        }${t.host}`,
                        n = s.posix.join(
                            `${a && '/' !== t.pathname[0] ? '/' : ''}${
                                t.pathname
                            }`,
                            ...e.slice(1)
                        );
                    return `${a}${'.' === n ? '' : n}`;
                }
                (e.parse = t),
                    (e.getHostName = function(e) {
                        return r.default(e).hostname;
                    }),
                    (e.normalize = function(e) {
                        return e && t(e).toString();
                    }),
                    (e.join = a),
                    (e.encodeParts = function(e) {
                        return a(...e.split('/').map(encodeURIComponent));
                    }),
                    (e.objectToQueryString = function(e) {
                        const t = Object.keys(e).filter(e => e.length > 0);
                        return t.length
                            ? '?' +
                                  t
                                      .map(t => {
                                          const a = encodeURIComponent(
                                              String(e[t])
                                          );
                                          return t + (a ? '=' + a : '');
                                      })
                                      .join('&')
                            : '';
                    }),
                    (e.queryStringToObject = function(e) {
                        return e
                            .replace(/^\?/, '')
                            .split('&')
                            .reduce((e, t) => {
                                const [a, n] = t.split('=');
                                return (
                                    a.length > 0 &&
                                        (e[a] = decodeURIComponent(n || '')),
                                    e
                                );
                            }, {});
                    }),
                    (e.isLocal = function(e) {
                        const { protocol: a } = t(e);
                        return (
                            (!a || 0 !== e.toLowerCase().indexOf(a)) &&
                            0 !== e.indexOf('/')
                        );
                    });
            })(t.URLExt || (t.URLExt = {}));
        },
        82646: e => {
            function t(e) {
                return (
                    'number' == typeof e ||
                    !!/^0x[0-9a-f]+$/i.test(e) ||
                    /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(e)
                );
            }
            function a(e, t) {
                return (
                    ('constructor' === t && 'function' == typeof e[t]) ||
                    '__proto__' === t
                );
            }
            e.exports = function(e, n) {
                n || (n = {});
                var s = { bools: {}, strings: {}, unknownFn: null };
                'function' == typeof n.unknown && (s.unknownFn = n.unknown),
                    'boolean' == typeof n.boolean && n.boolean
                        ? (s.allBools = !0)
                        : []
                              .concat(n.boolean)
                              .filter(Boolean)
                              .forEach(function(e) {
                                  s.bools[e] = !0;
                              });
                var r = {};
                Object.keys(n.alias || {}).forEach(function(e) {
                    (r[e] = [].concat(n.alias[e])),
                        r[e].forEach(function(t) {
                            r[t] = [e].concat(
                                r[e].filter(function(e) {
                                    return t !== e;
                                })
                            );
                        });
                }),
                    []
                        .concat(n.string)
                        .filter(Boolean)
                        .forEach(function(e) {
                            (s.strings[e] = !0), r[e] && (s.strings[r[e]] = !0);
                        });
                var i = n.default || {},
                    d = { _: [] };
                Object.keys(s.bools).forEach(function(e) {
                    o(e, void 0 !== i[e] && i[e]);
                });
                var _ = [];
                function o(e, a, n) {
                    if (
                        !n ||
                        !s.unknownFn ||
                        (function(e, t) {
                            return (
                                (s.allBools && /^--[^=]+$/.test(t)) ||
                                s.strings[e] ||
                                s.bools[e] ||
                                r[e]
                            );
                        })(e, n) ||
                        !1 !== s.unknownFn(n)
                    ) {
                        var i = !s.strings[e] && t(a) ? Number(a) : a;
                        u(d, e.split('.'), i),
                            (r[e] || []).forEach(function(e) {
                                u(d, e.split('.'), i);
                            });
                    }
                }
                function u(e, t, n) {
                    for (var r = e, i = 0; i < t.length - 1; i++) {
                        if (a(r, (d = t[i]))) return;
                        void 0 === r[d] && (r[d] = {}),
                            (r[d] !== Object.prototype &&
                                r[d] !== Number.prototype &&
                                r[d] !== String.prototype) ||
                                (r[d] = {}),
                            r[d] === Array.prototype && (r[d] = []),
                            (r = r[d]);
                    }
                    var d;
                    a(r, (d = t[t.length - 1])) ||
                        ((r !== Object.prototype &&
                            r !== Number.prototype &&
                            r !== String.prototype) ||
                            (r = {}),
                        r === Array.prototype && (r = []),
                        void 0 === r[d] ||
                        s.bools[d] ||
                        'boolean' == typeof r[d]
                            ? (r[d] = n)
                            : Array.isArray(r[d])
                            ? r[d].push(n)
                            : (r[d] = [r[d], n]));
                }
                function m(e) {
                    return r[e].some(function(e) {
                        return s.bools[e];
                    });
                }
                -1 !== e.indexOf('--') &&
                    ((_ = e.slice(e.indexOf('--') + 1)),
                    (e = e.slice(0, e.indexOf('--'))));
                for (var l = 0; l < e.length; l++) {
                    var c = e[l];
                    if (/^--.+=/.test(c)) {
                        var h = c.match(/^--([^=]+)=([\s\S]*)$/),
                            M = h[1],
                            L = h[2];
                        s.bools[M] && (L = 'false' !== L), o(M, L, c);
                    } else if (/^--no-.+/.test(c))
                        o((M = c.match(/^--no-(.+)/)[1]), !1, c);
                    else if (/^--.+/.test(c))
                        (M = c.match(/^--(.+)/)[1]),
                            void 0 === (p = e[l + 1]) ||
                            /^-/.test(p) ||
                            s.bools[M] ||
                            s.allBools ||
                            (r[M] && m(M))
                                ? /^(true|false)$/.test(p)
                                    ? (o(M, 'true' === p, c), l++)
                                    : o(M, !s.strings[M] || '', c)
                                : (o(M, p, c), l++);
                    else if (/^-[^-]+/.test(c)) {
                        for (
                            var Y = c.slice(1, -1).split(''), f = !1, y = 0;
                            y < Y.length;
                            y++
                        ) {
                            var p;
                            if ('-' !== (p = c.slice(y + 2))) {
                                if (/[A-Za-z]/.test(Y[y]) && /=/.test(p)) {
                                    o(Y[y], p.split('=')[1], c), (f = !0);
                                    break;
                                }
                                if (
                                    /[A-Za-z]/.test(Y[y]) &&
                                    /-?\d+(\.\d*)?(e-?\d+)?$/.test(p)
                                ) {
                                    o(Y[y], p, c), (f = !0);
                                    break;
                                }
                                if (Y[y + 1] && Y[y + 1].match(/\W/)) {
                                    o(Y[y], c.slice(y + 2), c), (f = !0);
                                    break;
                                }
                                o(Y[y], !s.strings[Y[y]] || '', c);
                            } else o(Y[y], p, c);
                        }
                        (M = c.slice(-1)[0]),
                            f ||
                                '-' === M ||
                                (!e[l + 1] ||
                                /^(-|--)[^-]/.test(e[l + 1]) ||
                                s.bools[M] ||
                                (r[M] && m(M))
                                    ? e[l + 1] &&
                                      /^(true|false)$/.test(e[l + 1])
                                        ? (o(M, 'true' === e[l + 1], c), l++)
                                        : o(M, !s.strings[M] || '', c)
                                    : (o(M, e[l + 1], c), l++));
                    } else if (
                        ((s.unknownFn && !1 === s.unknownFn(c)) ||
                            d._.push(s.strings._ || !t(c) ? c : Number(c)),
                        n.stopEarly)
                    ) {
                        d._.push.apply(d._, e.slice(l + 1));
                        break;
                    }
                }
                return (
                    Object.keys(i).forEach(function(e) {
                        var t, a, n;
                        (t = d),
                            (a = e.split('.')),
                            (n = t),
                            a.slice(0, -1).forEach(function(e) {
                                n = n[e] || {};
                            }),
                            a[a.length - 1] in n ||
                                (u(d, e.split('.'), i[e]),
                                (r[e] || []).forEach(function(t) {
                                    u(d, t.split('.'), i[e]);
                                }));
                    }),
                    n['--']
                        ? ((d['--'] = new Array()),
                          _.forEach(function(e) {
                              d['--'].push(e);
                          }))
                        : _.forEach(function(e) {
                              d._.push(e);
                          }),
                    d
                );
            };
        },
        75436: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('af', {
                    months: 'Januarie_Februarie_Maart_April_Mei_Junie_Julie_Augustus_September_Oktober_November_Desember'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Feb_Mrt_Apr_Mei_Jun_Jul_Aug_Sep_Okt_Nov_Des'.split(
                        '_'
                    ),
                    weekdays: 'Sondag_Maandag_Dinsdag_Woensdag_Donderdag_Vrydag_Saterdag'.split(
                        '_'
                    ),
                    weekdaysShort: 'Son_Maa_Din_Woe_Don_Vry_Sat'.split('_'),
                    weekdaysMin: 'So_Ma_Di_Wo_Do_Vr_Sa'.split('_'),
                    meridiemParse: /vm|nm/i,
                    isPM: function(e) {
                        return /^nm$/i.test(e);
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? (a ? 'vm' : 'VM') : a ? 'nm' : 'NM';
                    },
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Vandag om] LT',
                        nextDay: '[Môre om] LT',
                        nextWeek: 'dddd [om] LT',
                        lastDay: '[Gister om] LT',
                        lastWeek: '[Laas] dddd [om] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'oor %s',
                        past: '%s gelede',
                        s: "'n paar sekondes",
                        ss: '%d sekondes',
                        m: "'n minuut",
                        mm: '%d minute',
                        h: "'n uur",
                        hh: '%d ure',
                        d: "'n dag",
                        dd: '%d dae',
                        M: "'n maand",
                        MM: '%d maande',
                        y: "'n jaar",
                        yy: '%d jaar',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
                    ordinal: function(e) {
                        return (
                            e + (1 === e || 8 === e || e >= 20 ? 'ste' : 'de')
                        );
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        73578: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = function(e) {
                        return 0 === e
                            ? 0
                            : 1 === e
                            ? 1
                            : 2 === e
                            ? 2
                            : e % 100 >= 3 && e % 100 <= 10
                            ? 3
                            : e % 100 >= 11
                            ? 4
                            : 5;
                    },
                    a = {
                        s: [
                            'أقل من ثانية',
                            'ثانية واحدة',
                            ['ثانيتان', 'ثانيتين'],
                            '%d ثوان',
                            '%d ثانية',
                            '%d ثانية',
                        ],
                        m: [
                            'أقل من دقيقة',
                            'دقيقة واحدة',
                            ['دقيقتان', 'دقيقتين'],
                            '%d دقائق',
                            '%d دقيقة',
                            '%d دقيقة',
                        ],
                        h: [
                            'أقل من ساعة',
                            'ساعة واحدة',
                            ['ساعتان', 'ساعتين'],
                            '%d ساعات',
                            '%d ساعة',
                            '%d ساعة',
                        ],
                        d: [
                            'أقل من يوم',
                            'يوم واحد',
                            ['يومان', 'يومين'],
                            '%d أيام',
                            '%d يومًا',
                            '%d يوم',
                        ],
                        M: [
                            'أقل من شهر',
                            'شهر واحد',
                            ['شهران', 'شهرين'],
                            '%d أشهر',
                            '%d شهرا',
                            '%d شهر',
                        ],
                        y: [
                            'أقل من عام',
                            'عام واحد',
                            ['عامان', 'عامين'],
                            '%d أعوام',
                            '%d عامًا',
                            '%d عام',
                        ],
                    },
                    n = function(e) {
                        return function(n, s, r, i) {
                            var d = t(n),
                                _ = a[e][t(n)];
                            return (
                                2 === d && (_ = _[s ? 0 : 1]),
                                _.replace(/%d/i, n)
                            );
                        };
                    },
                    s = [
                        'جانفي',
                        'فيفري',
                        'مارس',
                        'أفريل',
                        'ماي',
                        'جوان',
                        'جويلية',
                        'أوت',
                        'سبتمبر',
                        'أكتوبر',
                        'نوفمبر',
                        'ديسمبر',
                    ];
                e.defineLocale('ar-dz', {
                    months: s,
                    monthsShort: s,
                    weekdays: 'الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split(
                        '_'
                    ),
                    weekdaysShort: 'أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت'.split(
                        '_'
                    ),
                    weekdaysMin: 'ح_ن_ث_ر_خ_ج_س'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'D/‏M/‏YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    meridiemParse: /ص|م/,
                    isPM: function(e) {
                        return 'م' === e;
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? 'ص' : 'م';
                    },
                    calendar: {
                        sameDay: '[اليوم عند الساعة] LT',
                        nextDay: '[غدًا عند الساعة] LT',
                        nextWeek: 'dddd [عند الساعة] LT',
                        lastDay: '[أمس عند الساعة] LT',
                        lastWeek: 'dddd [عند الساعة] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'بعد %s',
                        past: 'منذ %s',
                        s: n('s'),
                        ss: n('s'),
                        m: n('m'),
                        mm: n('m'),
                        h: n('h'),
                        hh: n('h'),
                        d: n('d'),
                        dd: n('d'),
                        M: n('M'),
                        MM: n('M'),
                        y: n('y'),
                        yy: n('y'),
                    },
                    postformat: function(e) {
                        return e.replace(/,/g, '،');
                    },
                    week: { dow: 0, doy: 4 },
                });
            })(a(37485));
        },
        79535: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('ar-kw', {
                    months: 'يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر'.split(
                        '_'
                    ),
                    monthsShort: 'يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر'.split(
                        '_'
                    ),
                    weekdays: 'الأحد_الإتنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split(
                        '_'
                    ),
                    weekdaysShort: 'احد_اتنين_ثلاثاء_اربعاء_خميس_جمعة_سبت'.split(
                        '_'
                    ),
                    weekdaysMin: 'ح_ن_ث_ر_خ_ج_س'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[اليوم على الساعة] LT',
                        nextDay: '[غدا على الساعة] LT',
                        nextWeek: 'dddd [على الساعة] LT',
                        lastDay: '[أمس على الساعة] LT',
                        lastWeek: 'dddd [على الساعة] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'في %s',
                        past: 'منذ %s',
                        s: 'ثوان',
                        ss: '%d ثانية',
                        m: 'دقيقة',
                        mm: '%d دقائق',
                        h: 'ساعة',
                        hh: '%d ساعات',
                        d: 'يوم',
                        dd: '%d أيام',
                        M: 'شهر',
                        MM: '%d أشهر',
                        y: 'سنة',
                        yy: '%d سنوات',
                    },
                    week: { dow: 0, doy: 12 },
                });
            })(a(37485));
        },
        45801: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '1',
                        2: '2',
                        3: '3',
                        4: '4',
                        5: '5',
                        6: '6',
                        7: '7',
                        8: '8',
                        9: '9',
                        0: '0',
                    },
                    a = function(e) {
                        return 0 === e
                            ? 0
                            : 1 === e
                            ? 1
                            : 2 === e
                            ? 2
                            : e % 100 >= 3 && e % 100 <= 10
                            ? 3
                            : e % 100 >= 11
                            ? 4
                            : 5;
                    },
                    n = {
                        s: [
                            'أقل من ثانية',
                            'ثانية واحدة',
                            ['ثانيتان', 'ثانيتين'],
                            '%d ثوان',
                            '%d ثانية',
                            '%d ثانية',
                        ],
                        m: [
                            'أقل من دقيقة',
                            'دقيقة واحدة',
                            ['دقيقتان', 'دقيقتين'],
                            '%d دقائق',
                            '%d دقيقة',
                            '%d دقيقة',
                        ],
                        h: [
                            'أقل من ساعة',
                            'ساعة واحدة',
                            ['ساعتان', 'ساعتين'],
                            '%d ساعات',
                            '%d ساعة',
                            '%d ساعة',
                        ],
                        d: [
                            'أقل من يوم',
                            'يوم واحد',
                            ['يومان', 'يومين'],
                            '%d أيام',
                            '%d يومًا',
                            '%d يوم',
                        ],
                        M: [
                            'أقل من شهر',
                            'شهر واحد',
                            ['شهران', 'شهرين'],
                            '%d أشهر',
                            '%d شهرا',
                            '%d شهر',
                        ],
                        y: [
                            'أقل من عام',
                            'عام واحد',
                            ['عامان', 'عامين'],
                            '%d أعوام',
                            '%d عامًا',
                            '%d عام',
                        ],
                    },
                    s = function(e) {
                        return function(t, s, r, i) {
                            var d = a(t),
                                _ = n[e][a(t)];
                            return (
                                2 === d && (_ = _[s ? 0 : 1]),
                                _.replace(/%d/i, t)
                            );
                        };
                    },
                    r = [
                        'يناير',
                        'فبراير',
                        'مارس',
                        'أبريل',
                        'مايو',
                        'يونيو',
                        'يوليو',
                        'أغسطس',
                        'سبتمبر',
                        'أكتوبر',
                        'نوفمبر',
                        'ديسمبر',
                    ];
                e.defineLocale('ar-ly', {
                    months: r,
                    monthsShort: r,
                    weekdays: 'الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split(
                        '_'
                    ),
                    weekdaysShort: 'أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت'.split(
                        '_'
                    ),
                    weekdaysMin: 'ح_ن_ث_ر_خ_ج_س'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'D/‏M/‏YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    meridiemParse: /ص|م/,
                    isPM: function(e) {
                        return 'م' === e;
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? 'ص' : 'م';
                    },
                    calendar: {
                        sameDay: '[اليوم عند الساعة] LT',
                        nextDay: '[غدًا عند الساعة] LT',
                        nextWeek: 'dddd [عند الساعة] LT',
                        lastDay: '[أمس عند الساعة] LT',
                        lastWeek: 'dddd [عند الساعة] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'بعد %s',
                        past: 'منذ %s',
                        s: s('s'),
                        ss: s('s'),
                        m: s('m'),
                        mm: s('m'),
                        h: s('h'),
                        hh: s('h'),
                        d: s('d'),
                        dd: s('d'),
                        M: s('M'),
                        MM: s('M'),
                        y: s('y'),
                        yy: s('y'),
                    },
                    preparse: function(e) {
                        return e.replace(/،/g, ',');
                    },
                    postformat: function(e) {
                        return e
                            .replace(/\d/g, function(e) {
                                return t[e];
                            })
                            .replace(/,/g, '،');
                    },
                    week: { dow: 6, doy: 12 },
                });
            })(a(37485));
        },
        64784: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('ar-ma', {
                    months: 'يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر'.split(
                        '_'
                    ),
                    monthsShort: 'يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر'.split(
                        '_'
                    ),
                    weekdays: 'الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split(
                        '_'
                    ),
                    weekdaysShort: 'احد_اثنين_ثلاثاء_اربعاء_خميس_جمعة_سبت'.split(
                        '_'
                    ),
                    weekdaysMin: 'ح_ن_ث_ر_خ_ج_س'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[اليوم على الساعة] LT',
                        nextDay: '[غدا على الساعة] LT',
                        nextWeek: 'dddd [على الساعة] LT',
                        lastDay: '[أمس على الساعة] LT',
                        lastWeek: 'dddd [على الساعة] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'في %s',
                        past: 'منذ %s',
                        s: 'ثوان',
                        ss: '%d ثانية',
                        m: 'دقيقة',
                        mm: '%d دقائق',
                        h: 'ساعة',
                        hh: '%d ساعات',
                        d: 'يوم',
                        dd: '%d أيام',
                        M: 'شهر',
                        MM: '%d أشهر',
                        y: 'سنة',
                        yy: '%d سنوات',
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        59050: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '١',
                        2: '٢',
                        3: '٣',
                        4: '٤',
                        5: '٥',
                        6: '٦',
                        7: '٧',
                        8: '٨',
                        9: '٩',
                        0: '٠',
                    },
                    a = {
                        '١': '1',
                        '٢': '2',
                        '٣': '3',
                        '٤': '4',
                        '٥': '5',
                        '٦': '6',
                        '٧': '7',
                        '٨': '8',
                        '٩': '9',
                        '٠': '0',
                    };
                e.defineLocale('ar-sa', {
                    months: 'يناير_فبراير_مارس_أبريل_مايو_يونيو_يوليو_أغسطس_سبتمبر_أكتوبر_نوفمبر_ديسمبر'.split(
                        '_'
                    ),
                    monthsShort: 'يناير_فبراير_مارس_أبريل_مايو_يونيو_يوليو_أغسطس_سبتمبر_أكتوبر_نوفمبر_ديسمبر'.split(
                        '_'
                    ),
                    weekdays: 'الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split(
                        '_'
                    ),
                    weekdaysShort: 'أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت'.split(
                        '_'
                    ),
                    weekdaysMin: 'ح_ن_ث_ر_خ_ج_س'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    meridiemParse: /ص|م/,
                    isPM: function(e) {
                        return 'م' === e;
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? 'ص' : 'م';
                    },
                    calendar: {
                        sameDay: '[اليوم على الساعة] LT',
                        nextDay: '[غدا على الساعة] LT',
                        nextWeek: 'dddd [على الساعة] LT',
                        lastDay: '[أمس على الساعة] LT',
                        lastWeek: 'dddd [على الساعة] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'في %s',
                        past: 'منذ %s',
                        s: 'ثوان',
                        ss: '%d ثانية',
                        m: 'دقيقة',
                        mm: '%d دقائق',
                        h: 'ساعة',
                        hh: '%d ساعات',
                        d: 'يوم',
                        dd: '%d أيام',
                        M: 'شهر',
                        MM: '%d أشهر',
                        y: 'سنة',
                        yy: '%d سنوات',
                    },
                    preparse: function(e) {
                        return e
                            .replace(/[١٢٣٤٥٦٧٨٩٠]/g, function(e) {
                                return a[e];
                            })
                            .replace(/،/g, ',');
                    },
                    postformat: function(e) {
                        return e
                            .replace(/\d/g, function(e) {
                                return t[e];
                            })
                            .replace(/,/g, '،');
                    },
                    week: { dow: 0, doy: 6 },
                });
            })(a(37485));
        },
        62042: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('ar-tn', {
                    months: 'جانفي_فيفري_مارس_أفريل_ماي_جوان_جويلية_أوت_سبتمبر_أكتوبر_نوفمبر_ديسمبر'.split(
                        '_'
                    ),
                    monthsShort: 'جانفي_فيفري_مارس_أفريل_ماي_جوان_جويلية_أوت_سبتمبر_أكتوبر_نوفمبر_ديسمبر'.split(
                        '_'
                    ),
                    weekdays: 'الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split(
                        '_'
                    ),
                    weekdaysShort: 'أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت'.split(
                        '_'
                    ),
                    weekdaysMin: 'ح_ن_ث_ر_خ_ج_س'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[اليوم على الساعة] LT',
                        nextDay: '[غدا على الساعة] LT',
                        nextWeek: 'dddd [على الساعة] LT',
                        lastDay: '[أمس على الساعة] LT',
                        lastWeek: 'dddd [على الساعة] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'في %s',
                        past: 'منذ %s',
                        s: 'ثوان',
                        ss: '%d ثانية',
                        m: 'دقيقة',
                        mm: '%d دقائق',
                        h: 'ساعة',
                        hh: '%d ساعات',
                        d: 'يوم',
                        dd: '%d أيام',
                        M: 'شهر',
                        MM: '%d أشهر',
                        y: 'سنة',
                        yy: '%d سنوات',
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        27662: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '١',
                        2: '٢',
                        3: '٣',
                        4: '٤',
                        5: '٥',
                        6: '٦',
                        7: '٧',
                        8: '٨',
                        9: '٩',
                        0: '٠',
                    },
                    a = {
                        '١': '1',
                        '٢': '2',
                        '٣': '3',
                        '٤': '4',
                        '٥': '5',
                        '٦': '6',
                        '٧': '7',
                        '٨': '8',
                        '٩': '9',
                        '٠': '0',
                    },
                    n = function(e) {
                        return 0 === e
                            ? 0
                            : 1 === e
                            ? 1
                            : 2 === e
                            ? 2
                            : e % 100 >= 3 && e % 100 <= 10
                            ? 3
                            : e % 100 >= 11
                            ? 4
                            : 5;
                    },
                    s = {
                        s: [
                            'أقل من ثانية',
                            'ثانية واحدة',
                            ['ثانيتان', 'ثانيتين'],
                            '%d ثوان',
                            '%d ثانية',
                            '%d ثانية',
                        ],
                        m: [
                            'أقل من دقيقة',
                            'دقيقة واحدة',
                            ['دقيقتان', 'دقيقتين'],
                            '%d دقائق',
                            '%d دقيقة',
                            '%d دقيقة',
                        ],
                        h: [
                            'أقل من ساعة',
                            'ساعة واحدة',
                            ['ساعتان', 'ساعتين'],
                            '%d ساعات',
                            '%d ساعة',
                            '%d ساعة',
                        ],
                        d: [
                            'أقل من يوم',
                            'يوم واحد',
                            ['يومان', 'يومين'],
                            '%d أيام',
                            '%d يومًا',
                            '%d يوم',
                        ],
                        M: [
                            'أقل من شهر',
                            'شهر واحد',
                            ['شهران', 'شهرين'],
                            '%d أشهر',
                            '%d شهرا',
                            '%d شهر',
                        ],
                        y: [
                            'أقل من عام',
                            'عام واحد',
                            ['عامان', 'عامين'],
                            '%d أعوام',
                            '%d عامًا',
                            '%d عام',
                        ],
                    },
                    r = function(e) {
                        return function(t, a, r, i) {
                            var d = n(t),
                                _ = s[e][n(t)];
                            return (
                                2 === d && (_ = _[a ? 0 : 1]),
                                _.replace(/%d/i, t)
                            );
                        };
                    },
                    i = [
                        'يناير',
                        'فبراير',
                        'مارس',
                        'أبريل',
                        'مايو',
                        'يونيو',
                        'يوليو',
                        'أغسطس',
                        'سبتمبر',
                        'أكتوبر',
                        'نوفمبر',
                        'ديسمبر',
                    ];
                e.defineLocale('ar', {
                    months: i,
                    monthsShort: i,
                    weekdays: 'الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split(
                        '_'
                    ),
                    weekdaysShort: 'أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت'.split(
                        '_'
                    ),
                    weekdaysMin: 'ح_ن_ث_ر_خ_ج_س'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'D/‏M/‏YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    meridiemParse: /ص|م/,
                    isPM: function(e) {
                        return 'م' === e;
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? 'ص' : 'م';
                    },
                    calendar: {
                        sameDay: '[اليوم عند الساعة] LT',
                        nextDay: '[غدًا عند الساعة] LT',
                        nextWeek: 'dddd [عند الساعة] LT',
                        lastDay: '[أمس عند الساعة] LT',
                        lastWeek: 'dddd [عند الساعة] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'بعد %s',
                        past: 'منذ %s',
                        s: r('s'),
                        ss: r('s'),
                        m: r('m'),
                        mm: r('m'),
                        h: r('h'),
                        hh: r('h'),
                        d: r('d'),
                        dd: r('d'),
                        M: r('M'),
                        MM: r('M'),
                        y: r('y'),
                        yy: r('y'),
                    },
                    preparse: function(e) {
                        return e
                            .replace(/[١٢٣٤٥٦٧٨٩٠]/g, function(e) {
                                return a[e];
                            })
                            .replace(/،/g, ',');
                    },
                    postformat: function(e) {
                        return e
                            .replace(/\d/g, function(e) {
                                return t[e];
                            })
                            .replace(/,/g, '،');
                    },
                    week: { dow: 6, doy: 12 },
                });
            })(a(37485));
        },
        11071: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                    1: '-inci',
                    5: '-inci',
                    8: '-inci',
                    70: '-inci',
                    80: '-inci',
                    2: '-nci',
                    7: '-nci',
                    20: '-nci',
                    50: '-nci',
                    3: '-üncü',
                    4: '-üncü',
                    100: '-üncü',
                    6: '-ncı',
                    9: '-uncu',
                    10: '-uncu',
                    30: '-uncu',
                    60: '-ıncı',
                    90: '-ıncı',
                };
                e.defineLocale('az', {
                    months: 'yanvar_fevral_mart_aprel_may_iyun_iyul_avqust_sentyabr_oktyabr_noyabr_dekabr'.split(
                        '_'
                    ),
                    monthsShort: 'yan_fev_mar_apr_may_iyn_iyl_avq_sen_okt_noy_dek'.split(
                        '_'
                    ),
                    weekdays: 'Bazar_Bazar ertəsi_Çərşənbə axşamı_Çərşənbə_Cümə axşamı_Cümə_Şənbə'.split(
                        '_'
                    ),
                    weekdaysShort: 'Baz_BzE_ÇAx_Çər_CAx_Cüm_Şən'.split('_'),
                    weekdaysMin: 'Bz_BE_ÇA_Çə_CA_Cü_Şə'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[bugün saat] LT',
                        nextDay: '[sabah saat] LT',
                        nextWeek: '[gələn həftə] dddd [saat] LT',
                        lastDay: '[dünən] LT',
                        lastWeek: '[keçən həftə] dddd [saat] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s sonra',
                        past: '%s əvvəl',
                        s: 'bir neçə saniyə',
                        ss: '%d saniyə',
                        m: 'bir dəqiqə',
                        mm: '%d dəqiqə',
                        h: 'bir saat',
                        hh: '%d saat',
                        d: 'bir gün',
                        dd: '%d gün',
                        M: 'bir ay',
                        MM: '%d ay',
                        y: 'bir il',
                        yy: '%d il',
                    },
                    meridiemParse: /gecə|səhər|gündüz|axşam/,
                    isPM: function(e) {
                        return /^(gündüz|axşam)$/.test(e);
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'gecə'
                            : e < 12
                            ? 'səhər'
                            : e < 17
                            ? 'gündüz'
                            : 'axşam';
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}-(ıncı|inci|nci|üncü|ncı|uncu)/,
                    ordinal: function(e) {
                        if (0 === e) return e + '-ıncı';
                        var a = e % 10;
                        return (
                            e +
                            (t[a] ||
                                t[(e % 100) - a] ||
                                t[e >= 100 ? 100 : null])
                        );
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        48369: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a) {
                    return 'm' === a
                        ? t
                            ? 'хвіліна'
                            : 'хвіліну'
                        : 'h' === a
                        ? t
                            ? 'гадзіна'
                            : 'гадзіну'
                        : e +
                          ' ' +
                          ((n = +e),
                          (s = {
                              ss: t
                                  ? 'секунда_секунды_секунд'
                                  : 'секунду_секунды_секунд',
                              mm: t
                                  ? 'хвіліна_хвіліны_хвілін'
                                  : 'хвіліну_хвіліны_хвілін',
                              hh: t
                                  ? 'гадзіна_гадзіны_гадзін'
                                  : 'гадзіну_гадзіны_гадзін',
                              dd: 'дзень_дні_дзён',
                              MM: 'месяц_месяцы_месяцаў',
                              yy: 'год_гады_гадоў',
                          }[a].split('_')),
                          n % 10 == 1 && n % 100 != 11
                              ? s[0]
                              : n % 10 >= 2 &&
                                n % 10 <= 4 &&
                                (n % 100 < 10 || n % 100 >= 20)
                              ? s[1]
                              : s[2]);
                    var n, s;
                }
                e.defineLocale('be', {
                    months: {
                        format: 'студзеня_лютага_сакавіка_красавіка_траўня_чэрвеня_ліпеня_жніўня_верасня_кастрычніка_лістапада_снежня'.split(
                            '_'
                        ),
                        standalone: 'студзень_люты_сакавік_красавік_травень_чэрвень_ліпень_жнівень_верасень_кастрычнік_лістапад_снежань'.split(
                            '_'
                        ),
                    },
                    monthsShort: 'студ_лют_сак_крас_трав_чэрв_ліп_жнів_вер_каст_ліст_снеж'.split(
                        '_'
                    ),
                    weekdays: {
                        format: 'нядзелю_панядзелак_аўторак_сераду_чацвер_пятніцу_суботу'.split(
                            '_'
                        ),
                        standalone: 'нядзеля_панядзелак_аўторак_серада_чацвер_пятніца_субота'.split(
                            '_'
                        ),
                        isFormat: /\[ ?[Ууў] ?(?:мінулую|наступную)? ?\] ?dddd/,
                    },
                    weekdaysShort: 'нд_пн_ат_ср_чц_пт_сб'.split('_'),
                    weekdaysMin: 'нд_пн_ат_ср_чц_пт_сб'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY г.',
                        LLL: 'D MMMM YYYY г., HH:mm',
                        LLLL: 'dddd, D MMMM YYYY г., HH:mm',
                    },
                    calendar: {
                        sameDay: '[Сёння ў] LT',
                        nextDay: '[Заўтра ў] LT',
                        lastDay: '[Учора ў] LT',
                        nextWeek: function() {
                            return '[У] dddd [ў] LT';
                        },
                        lastWeek: function() {
                            switch (this.day()) {
                                case 0:
                                case 3:
                                case 5:
                                case 6:
                                    return '[У мінулую] dddd [ў] LT';
                                case 1:
                                case 2:
                                case 4:
                                    return '[У мінулы] dddd [ў] LT';
                            }
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'праз %s',
                        past: '%s таму',
                        s: 'некалькі секунд',
                        m: t,
                        mm: t,
                        h: t,
                        hh: t,
                        d: 'дзень',
                        dd: t,
                        M: 'месяц',
                        MM: t,
                        y: 'год',
                        yy: t,
                    },
                    meridiemParse: /ночы|раніцы|дня|вечара/,
                    isPM: function(e) {
                        return /^(дня|вечара)$/.test(e);
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'ночы'
                            : e < 12
                            ? 'раніцы'
                            : e < 17
                            ? 'дня'
                            : 'вечара';
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}-(і|ы|га)/,
                    ordinal: function(e, t) {
                        switch (t) {
                            case 'M':
                            case 'd':
                            case 'DDD':
                            case 'w':
                            case 'W':
                                return (e % 10 != 2 && e % 10 != 3) ||
                                    e % 100 == 12 ||
                                    e % 100 == 13
                                    ? e + '-ы'
                                    : e + '-і';
                            case 'D':
                                return e + '-га';
                            default:
                                return e;
                        }
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        37874: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('bg', {
                    months: 'януари_февруари_март_април_май_юни_юли_август_септември_октомври_ноември_декември'.split(
                        '_'
                    ),
                    monthsShort: 'яну_фев_мар_апр_май_юни_юли_авг_сеп_окт_ное_дек'.split(
                        '_'
                    ),
                    weekdays: 'неделя_понеделник_вторник_сряда_четвъртък_петък_събота'.split(
                        '_'
                    ),
                    weekdaysShort: 'нед_пон_вто_сря_чет_пет_съб'.split('_'),
                    weekdaysMin: 'нд_пн_вт_ср_чт_пт_сб'.split('_'),
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'D.MM.YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY H:mm',
                        LLLL: 'dddd, D MMMM YYYY H:mm',
                    },
                    calendar: {
                        sameDay: '[Днес в] LT',
                        nextDay: '[Утре в] LT',
                        nextWeek: 'dddd [в] LT',
                        lastDay: '[Вчера в] LT',
                        lastWeek: function() {
                            switch (this.day()) {
                                case 0:
                                case 3:
                                case 6:
                                    return '[Миналата] dddd [в] LT';
                                case 1:
                                case 2:
                                case 4:
                                case 5:
                                    return '[Миналия] dddd [в] LT';
                            }
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'след %s',
                        past: 'преди %s',
                        s: 'няколко секунди',
                        ss: '%d секунди',
                        m: 'минута',
                        mm: '%d минути',
                        h: 'час',
                        hh: '%d часа',
                        d: 'ден',
                        dd: '%d дена',
                        w: 'седмица',
                        ww: '%d седмици',
                        M: 'месец',
                        MM: '%d месеца',
                        y: 'година',
                        yy: '%d години',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}-(ев|ен|ти|ви|ри|ми)/,
                    ordinal: function(e) {
                        var t = e % 10,
                            a = e % 100;
                        return 0 === e
                            ? e + '-ев'
                            : 0 === a
                            ? e + '-ен'
                            : a > 10 && a < 20
                            ? e + '-ти'
                            : 1 === t
                            ? e + '-ви'
                            : 2 === t
                            ? e + '-ри'
                            : 7 === t || 8 === t
                            ? e + '-ми'
                            : e + '-ти';
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        88393: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('bm', {
                    months: 'Zanwuyekalo_Fewuruyekalo_Marisikalo_Awirilikalo_Mɛkalo_Zuwɛnkalo_Zuluyekalo_Utikalo_Sɛtanburukalo_ɔkutɔburukalo_Nowanburukalo_Desanburukalo'.split(
                        '_'
                    ),
                    monthsShort: 'Zan_Few_Mar_Awi_Mɛ_Zuw_Zul_Uti_Sɛt_ɔku_Now_Des'.split(
                        '_'
                    ),
                    weekdays: 'Kari_Ntɛnɛn_Tarata_Araba_Alamisa_Juma_Sibiri'.split(
                        '_'
                    ),
                    weekdaysShort: 'Kar_Ntɛ_Tar_Ara_Ala_Jum_Sib'.split('_'),
                    weekdaysMin: 'Ka_Nt_Ta_Ar_Al_Ju_Si'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'MMMM [tile] D [san] YYYY',
                        LLL: 'MMMM [tile] D [san] YYYY [lɛrɛ] HH:mm',
                        LLLL: 'dddd MMMM [tile] D [san] YYYY [lɛrɛ] HH:mm',
                    },
                    calendar: {
                        sameDay: '[Bi lɛrɛ] LT',
                        nextDay: '[Sini lɛrɛ] LT',
                        nextWeek: 'dddd [don lɛrɛ] LT',
                        lastDay: '[Kunu lɛrɛ] LT',
                        lastWeek: 'dddd [tɛmɛnen lɛrɛ] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s kɔnɔ',
                        past: 'a bɛ %s bɔ',
                        s: 'sanga dama dama',
                        ss: 'sekondi %d',
                        m: 'miniti kelen',
                        mm: 'miniti %d',
                        h: 'lɛrɛ kelen',
                        hh: 'lɛrɛ %d',
                        d: 'tile kelen',
                        dd: 'tile %d',
                        M: 'kalo kelen',
                        MM: 'kalo %d',
                        y: 'san kelen',
                        yy: 'san %d',
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        70643: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '১',
                        2: '২',
                        3: '৩',
                        4: '৪',
                        5: '৫',
                        6: '৬',
                        7: '৭',
                        8: '৮',
                        9: '৯',
                        0: '০',
                    },
                    a = {
                        '১': '1',
                        '২': '2',
                        '৩': '3',
                        '৪': '4',
                        '৫': '5',
                        '৬': '6',
                        '৭': '7',
                        '৮': '8',
                        '৯': '9',
                        '০': '0',
                    };
                e.defineLocale('bn-bd', {
                    months: 'জানুয়ারি_ফেব্রুয়ারি_মার্চ_এপ্রিল_মে_জুন_জুলাই_আগস্ট_সেপ্টেম্বর_অক্টোবর_নভেম্বর_ডিসেম্বর'.split(
                        '_'
                    ),
                    monthsShort: 'জানু_ফেব্রু_মার্চ_এপ্রিল_মে_জুন_জুলাই_আগস্ট_সেপ্ট_অক্টো_নভে_ডিসে'.split(
                        '_'
                    ),
                    weekdays: 'রবিবার_সোমবার_মঙ্গলবার_বুধবার_বৃহস্পতিবার_শুক্রবার_শনিবার'.split(
                        '_'
                    ),
                    weekdaysShort: 'রবি_সোম_মঙ্গল_বুধ_বৃহস্পতি_শুক্র_শনি'.split(
                        '_'
                    ),
                    weekdaysMin: 'রবি_সোম_মঙ্গল_বুধ_বৃহ_শুক্র_শনি'.split('_'),
                    longDateFormat: {
                        LT: 'A h:mm সময়',
                        LTS: 'A h:mm:ss সময়',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY, A h:mm সময়',
                        LLLL: 'dddd, D MMMM YYYY, A h:mm সময়',
                    },
                    calendar: {
                        sameDay: '[আজ] LT',
                        nextDay: '[আগামীকাল] LT',
                        nextWeek: 'dddd, LT',
                        lastDay: '[গতকাল] LT',
                        lastWeek: '[গত] dddd, LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s পরে',
                        past: '%s আগে',
                        s: 'কয়েক সেকেন্ড',
                        ss: '%d সেকেন্ড',
                        m: 'এক মিনিট',
                        mm: '%d মিনিট',
                        h: 'এক ঘন্টা',
                        hh: '%d ঘন্টা',
                        d: 'এক দিন',
                        dd: '%d দিন',
                        M: 'এক মাস',
                        MM: '%d মাস',
                        y: 'এক বছর',
                        yy: '%d বছর',
                    },
                    preparse: function(e) {
                        return e.replace(/[১২৩৪৫৬৭৮৯০]/g, function(e) {
                            return a[e];
                        });
                    },
                    postformat: function(e) {
                        return e.replace(/\d/g, function(e) {
                            return t[e];
                        });
                    },
                    meridiemParse: /রাত|ভোর|সকাল|দুপুর|বিকাল|সন্ধ্যা|রাত/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'রাত' === t
                                ? e < 4
                                    ? e
                                    : e + 12
                                : 'ভোর' === t || 'সকাল' === t
                                ? e
                                : 'দুপুর' === t
                                ? e >= 3
                                    ? e
                                    : e + 12
                                : 'বিকাল' === t || 'সন্ধ্যা' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'রাত'
                            : e < 6
                            ? 'ভোর'
                            : e < 12
                            ? 'সকাল'
                            : e < 15
                            ? 'দুপুর'
                            : e < 18
                            ? 'বিকাল'
                            : e < 20
                            ? 'সন্ধ্যা'
                            : 'রাত';
                    },
                    week: { dow: 0, doy: 6 },
                });
            })(a(37485));
        },
        92722: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '১',
                        2: '২',
                        3: '৩',
                        4: '৪',
                        5: '৫',
                        6: '৬',
                        7: '৭',
                        8: '৮',
                        9: '৯',
                        0: '০',
                    },
                    a = {
                        '১': '1',
                        '২': '2',
                        '৩': '3',
                        '৪': '4',
                        '৫': '5',
                        '৬': '6',
                        '৭': '7',
                        '৮': '8',
                        '৯': '9',
                        '০': '0',
                    };
                e.defineLocale('bn', {
                    months: 'জানুয়ারি_ফেব্রুয়ারি_মার্চ_এপ্রিল_মে_জুন_জুলাই_আগস্ট_সেপ্টেম্বর_অক্টোবর_নভেম্বর_ডিসেম্বর'.split(
                        '_'
                    ),
                    monthsShort: 'জানু_ফেব্রু_মার্চ_এপ্রিল_মে_জুন_জুলাই_আগস্ট_সেপ্ট_অক্টো_নভে_ডিসে'.split(
                        '_'
                    ),
                    weekdays: 'রবিবার_সোমবার_মঙ্গলবার_বুধবার_বৃহস্পতিবার_শুক্রবার_শনিবার'.split(
                        '_'
                    ),
                    weekdaysShort: 'রবি_সোম_মঙ্গল_বুধ_বৃহস্পতি_শুক্র_শনি'.split(
                        '_'
                    ),
                    weekdaysMin: 'রবি_সোম_মঙ্গল_বুধ_বৃহ_শুক্র_শনি'.split('_'),
                    longDateFormat: {
                        LT: 'A h:mm সময়',
                        LTS: 'A h:mm:ss সময়',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY, A h:mm সময়',
                        LLLL: 'dddd, D MMMM YYYY, A h:mm সময়',
                    },
                    calendar: {
                        sameDay: '[আজ] LT',
                        nextDay: '[আগামীকাল] LT',
                        nextWeek: 'dddd, LT',
                        lastDay: '[গতকাল] LT',
                        lastWeek: '[গত] dddd, LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s পরে',
                        past: '%s আগে',
                        s: 'কয়েক সেকেন্ড',
                        ss: '%d সেকেন্ড',
                        m: 'এক মিনিট',
                        mm: '%d মিনিট',
                        h: 'এক ঘন্টা',
                        hh: '%d ঘন্টা',
                        d: 'এক দিন',
                        dd: '%d দিন',
                        M: 'এক মাস',
                        MM: '%d মাস',
                        y: 'এক বছর',
                        yy: '%d বছর',
                    },
                    preparse: function(e) {
                        return e.replace(/[১২৩৪৫৬৭৮৯০]/g, function(e) {
                            return a[e];
                        });
                    },
                    postformat: function(e) {
                        return e.replace(/\d/g, function(e) {
                            return t[e];
                        });
                    },
                    meridiemParse: /রাত|সকাল|দুপুর|বিকাল|রাত/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            ('রাত' === t && e >= 4) ||
                            ('দুপুর' === t && e < 5) ||
                            'বিকাল' === t
                                ? e + 12
                                : e
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'রাত'
                            : e < 10
                            ? 'সকাল'
                            : e < 17
                            ? 'দুপুর'
                            : e < 20
                            ? 'বিকাল'
                            : 'রাত';
                    },
                    week: { dow: 0, doy: 6 },
                });
            })(a(37485));
        },
        85165: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '༡',
                        2: '༢',
                        3: '༣',
                        4: '༤',
                        5: '༥',
                        6: '༦',
                        7: '༧',
                        8: '༨',
                        9: '༩',
                        0: '༠',
                    },
                    a = {
                        '༡': '1',
                        '༢': '2',
                        '༣': '3',
                        '༤': '4',
                        '༥': '5',
                        '༦': '6',
                        '༧': '7',
                        '༨': '8',
                        '༩': '9',
                        '༠': '0',
                    };
                e.defineLocale('bo', {
                    months: 'ཟླ་བ་དང་པོ_ཟླ་བ་གཉིས་པ_ཟླ་བ་གསུམ་པ_ཟླ་བ་བཞི་པ_ཟླ་བ་ལྔ་པ_ཟླ་བ་དྲུག་པ_ཟླ་བ་བདུན་པ_ཟླ་བ་བརྒྱད་པ_ཟླ་བ་དགུ་པ_ཟླ་བ་བཅུ་པ_ཟླ་བ་བཅུ་གཅིག་པ_ཟླ་བ་བཅུ་གཉིས་པ'.split(
                        '_'
                    ),
                    monthsShort: 'ཟླ་1_ཟླ་2_ཟླ་3_ཟླ་4_ཟླ་5_ཟླ་6_ཟླ་7_ཟླ་8_ཟླ་9_ཟླ་10_ཟླ་11_ཟླ་12'.split(
                        '_'
                    ),
                    monthsShortRegex: /^(ཟླ་\d{1,2})/,
                    monthsParseExact: !0,
                    weekdays: 'གཟའ་ཉི་མ་_གཟའ་ཟླ་བ་_གཟའ་མིག་དམར་_གཟའ་ལྷག་པ་_གཟའ་ཕུར་བུ_གཟའ་པ་སངས་_གཟའ་སྤེན་པ་'.split(
                        '_'
                    ),
                    weekdaysShort: 'ཉི་མ་_ཟླ་བ་_མིག་དམར་_ལྷག་པ་_ཕུར་བུ_པ་སངས་_སྤེན་པ་'.split(
                        '_'
                    ),
                    weekdaysMin: 'ཉི_ཟླ_མིག_ལྷག_ཕུར_སངས_སྤེན'.split('_'),
                    longDateFormat: {
                        LT: 'A h:mm',
                        LTS: 'A h:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY, A h:mm',
                        LLLL: 'dddd, D MMMM YYYY, A h:mm',
                    },
                    calendar: {
                        sameDay: '[དི་རིང] LT',
                        nextDay: '[སང་ཉིན] LT',
                        nextWeek: '[བདུན་ཕྲག་རྗེས་མ], LT',
                        lastDay: '[ཁ་སང] LT',
                        lastWeek: '[བདུན་ཕྲག་མཐའ་མ] dddd, LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s ལ་',
                        past: '%s སྔན་ལ',
                        s: 'ལམ་སང',
                        ss: '%d སྐར་ཆ།',
                        m: 'སྐར་མ་གཅིག',
                        mm: '%d སྐར་མ',
                        h: 'ཆུ་ཚོད་གཅིག',
                        hh: '%d ཆུ་ཚོད',
                        d: 'ཉིན་གཅིག',
                        dd: '%d ཉིན་',
                        M: 'ཟླ་བ་གཅིག',
                        MM: '%d ཟླ་བ',
                        y: 'ལོ་གཅིག',
                        yy: '%d ལོ',
                    },
                    preparse: function(e) {
                        return e.replace(/[༡༢༣༤༥༦༧༨༩༠]/g, function(e) {
                            return a[e];
                        });
                    },
                    postformat: function(e) {
                        return e.replace(/\d/g, function(e) {
                            return t[e];
                        });
                    },
                    meridiemParse: /མཚན་མོ|ཞོགས་ཀས|ཉིན་གུང|དགོང་དག|མཚན་མོ/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            ('མཚན་མོ' === t && e >= 4) ||
                            ('ཉིན་གུང' === t && e < 5) ||
                            'དགོང་དག' === t
                                ? e + 12
                                : e
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'མཚན་མོ'
                            : e < 10
                            ? 'ཞོགས་ཀས'
                            : e < 17
                            ? 'ཉིན་གུང'
                            : e < 20
                            ? 'དགོང་དག'
                            : 'མཚན་མོ';
                    },
                    week: { dow: 0, doy: 6 },
                });
            })(a(37485));
        },
        96645: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a) {
                    return (
                        e +
                        ' ' +
                        (function(e, t) {
                            return 2 === t
                                ? (function(e) {
                                      var t = { m: 'v', b: 'v', d: 'z' };
                                      return void 0 === t[e.charAt(0)]
                                          ? e
                                          : t[e.charAt(0)] + e.substring(1);
                                  })(e)
                                : e;
                        })({ mm: 'munutenn', MM: 'miz', dd: 'devezh' }[a], e)
                    );
                }
                function a(e) {
                    return e > 9 ? a(e % 10) : e;
                }
                var n = [
                        /^gen/i,
                        /^c[ʼ\']hwe/i,
                        /^meu/i,
                        /^ebr/i,
                        /^mae/i,
                        /^(mez|eve)/i,
                        /^gou/i,
                        /^eos/i,
                        /^gwe/i,
                        /^her/i,
                        /^du/i,
                        /^ker/i,
                    ],
                    s = /^(genver|c[ʼ\']hwevrer|meurzh|ebrel|mae|mezheven|gouere|eost|gwengolo|here|du|kerzu|gen|c[ʼ\']hwe|meu|ebr|mae|eve|gou|eos|gwe|her|du|ker)/i,
                    r = [
                        /^Su/i,
                        /^Lu/i,
                        /^Me([^r]|$)/i,
                        /^Mer/i,
                        /^Ya/i,
                        /^Gw/i,
                        /^Sa/i,
                    ];
                e.defineLocale('br', {
                    months: 'Genver_Cʼhwevrer_Meurzh_Ebrel_Mae_Mezheven_Gouere_Eost_Gwengolo_Here_Du_Kerzu'.split(
                        '_'
                    ),
                    monthsShort: 'Gen_Cʼhwe_Meu_Ebr_Mae_Eve_Gou_Eos_Gwe_Her_Du_Ker'.split(
                        '_'
                    ),
                    weekdays: 'Sul_Lun_Meurzh_Mercʼher_Yaou_Gwener_Sadorn'.split(
                        '_'
                    ),
                    weekdaysShort: 'Sul_Lun_Meu_Mer_Yao_Gwe_Sad'.split('_'),
                    weekdaysMin: 'Su_Lu_Me_Mer_Ya_Gw_Sa'.split('_'),
                    weekdaysParse: r,
                    fullWeekdaysParse: [
                        /^sul/i,
                        /^lun/i,
                        /^meurzh/i,
                        /^merc[ʼ\']her/i,
                        /^yaou/i,
                        /^gwener/i,
                        /^sadorn/i,
                    ],
                    shortWeekdaysParse: [
                        /^Sul/i,
                        /^Lun/i,
                        /^Meu/i,
                        /^Mer/i,
                        /^Yao/i,
                        /^Gwe/i,
                        /^Sad/i,
                    ],
                    minWeekdaysParse: r,
                    monthsRegex: s,
                    monthsShortRegex: s,
                    monthsStrictRegex: /^(genver|c[ʼ\']hwevrer|meurzh|ebrel|mae|mezheven|gouere|eost|gwengolo|here|du|kerzu)/i,
                    monthsShortStrictRegex: /^(gen|c[ʼ\']hwe|meu|ebr|mae|eve|gou|eos|gwe|her|du|ker)/i,
                    monthsParse: n,
                    longMonthsParse: n,
                    shortMonthsParse: n,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D [a viz] MMMM YYYY',
                        LLL: 'D [a viz] MMMM YYYY HH:mm',
                        LLLL: 'dddd, D [a viz] MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Hiziv da] LT',
                        nextDay: '[Warcʼhoazh da] LT',
                        nextWeek: 'dddd [da] LT',
                        lastDay: '[Decʼh da] LT',
                        lastWeek: 'dddd [paset da] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'a-benn %s',
                        past: '%s ʼzo',
                        s: 'un nebeud segondennoù',
                        ss: '%d eilenn',
                        m: 'ur vunutenn',
                        mm: t,
                        h: 'un eur',
                        hh: '%d eur',
                        d: 'un devezh',
                        dd: t,
                        M: 'ur miz',
                        MM: t,
                        y: 'ur bloaz',
                        yy: function(e) {
                            switch (a(e)) {
                                case 1:
                                case 3:
                                case 4:
                                case 5:
                                case 9:
                                    return e + ' bloaz';
                                default:
                                    return e + ' vloaz';
                            }
                        },
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(añ|vet)/,
                    ordinal: function(e) {
                        return e + (1 === e ? 'añ' : 'vet');
                    },
                    week: { dow: 1, doy: 4 },
                    meridiemParse: /a.m.|g.m./,
                    isPM: function(e) {
                        return 'g.m.' === e;
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? 'a.m.' : 'g.m.';
                    },
                });
            })(a(37485));
        },
        15870: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a) {
                    var n = e + ' ';
                    switch (a) {
                        case 'ss':
                            return (
                                n +
                                (1 === e
                                    ? 'sekunda'
                                    : 2 === e || 3 === e || 4 === e
                                    ? 'sekunde'
                                    : 'sekundi')
                            );
                        case 'm':
                            return t ? 'jedna minuta' : 'jedne minute';
                        case 'mm':
                            return (
                                n +
                                (1 === e
                                    ? 'minuta'
                                    : 2 === e || 3 === e || 4 === e
                                    ? 'minute'
                                    : 'minuta')
                            );
                        case 'h':
                            return t ? 'jedan sat' : 'jednog sata';
                        case 'hh':
                            return (
                                n +
                                (1 === e
                                    ? 'sat'
                                    : 2 === e || 3 === e || 4 === e
                                    ? 'sata'
                                    : 'sati')
                            );
                        case 'dd':
                            return n + (1 === e ? 'dan' : 'dana');
                        case 'MM':
                            return (
                                n +
                                (1 === e
                                    ? 'mjesec'
                                    : 2 === e || 3 === e || 4 === e
                                    ? 'mjeseca'
                                    : 'mjeseci')
                            );
                        case 'yy':
                            return (
                                n +
                                (1 === e
                                    ? 'godina'
                                    : 2 === e || 3 === e || 4 === e
                                    ? 'godine'
                                    : 'godina')
                            );
                    }
                }
                e.defineLocale('bs', {
                    months: 'januar_februar_mart_april_maj_juni_juli_august_septembar_oktobar_novembar_decembar'.split(
                        '_'
                    ),
                    monthsShort: 'jan._feb._mar._apr._maj._jun._jul._aug._sep._okt._nov._dec.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota'.split(
                        '_'
                    ),
                    weekdaysShort: 'ned._pon._uto._sri._čet._pet._sub.'.split(
                        '_'
                    ),
                    weekdaysMin: 'ne_po_ut_sr_če_pe_su'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D. MMMM YYYY',
                        LLL: 'D. MMMM YYYY H:mm',
                        LLLL: 'dddd, D. MMMM YYYY H:mm',
                    },
                    calendar: {
                        sameDay: '[danas u] LT',
                        nextDay: '[sutra u] LT',
                        nextWeek: function() {
                            switch (this.day()) {
                                case 0:
                                    return '[u] [nedjelju] [u] LT';
                                case 3:
                                    return '[u] [srijedu] [u] LT';
                                case 6:
                                    return '[u] [subotu] [u] LT';
                                case 1:
                                case 2:
                                case 4:
                                case 5:
                                    return '[u] dddd [u] LT';
                            }
                        },
                        lastDay: '[jučer u] LT',
                        lastWeek: function() {
                            switch (this.day()) {
                                case 0:
                                case 3:
                                    return '[prošlu] dddd [u] LT';
                                case 6:
                                    return '[prošle] [subote] [u] LT';
                                case 1:
                                case 2:
                                case 4:
                                case 5:
                                    return '[prošli] dddd [u] LT';
                            }
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'za %s',
                        past: 'prije %s',
                        s: 'par sekundi',
                        ss: t,
                        m: t,
                        mm: t,
                        h: t,
                        hh: t,
                        d: 'dan',
                        dd: t,
                        M: 'mjesec',
                        MM: t,
                        y: 'godinu',
                        yy: t,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        3993: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('ca', {
                    months: {
                        standalone: 'gener_febrer_març_abril_maig_juny_juliol_agost_setembre_octubre_novembre_desembre'.split(
                            '_'
                        ),
                        format: "de gener_de febrer_de març_d'abril_de maig_de juny_de juliol_d'agost_de setembre_d'octubre_de novembre_de desembre".split(
                            '_'
                        ),
                        isFormat: /D[oD]?(\s)+MMMM/,
                    },
                    monthsShort: 'gen._febr._març_abr._maig_juny_jul._ag._set._oct._nov._des.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'diumenge_dilluns_dimarts_dimecres_dijous_divendres_dissabte'.split(
                        '_'
                    ),
                    weekdaysShort: 'dg._dl._dt._dc._dj._dv._ds.'.split('_'),
                    weekdaysMin: 'dg_dl_dt_dc_dj_dv_ds'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM [de] YYYY',
                        ll: 'D MMM YYYY',
                        LLL: 'D MMMM [de] YYYY [a les] H:mm',
                        lll: 'D MMM YYYY, H:mm',
                        LLLL: 'dddd D MMMM [de] YYYY [a les] H:mm',
                        llll: 'ddd D MMM YYYY, H:mm',
                    },
                    calendar: {
                        sameDay: function() {
                            return (
                                '[avui a ' +
                                (1 !== this.hours() ? 'les' : 'la') +
                                '] LT'
                            );
                        },
                        nextDay: function() {
                            return (
                                '[demà a ' +
                                (1 !== this.hours() ? 'les' : 'la') +
                                '] LT'
                            );
                        },
                        nextWeek: function() {
                            return (
                                'dddd [a ' +
                                (1 !== this.hours() ? 'les' : 'la') +
                                '] LT'
                            );
                        },
                        lastDay: function() {
                            return (
                                '[ahir a ' +
                                (1 !== this.hours() ? 'les' : 'la') +
                                '] LT'
                            );
                        },
                        lastWeek: function() {
                            return (
                                '[el] dddd [passat a ' +
                                (1 !== this.hours() ? 'les' : 'la') +
                                '] LT'
                            );
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: "d'aquí %s",
                        past: 'fa %s',
                        s: 'uns segons',
                        ss: '%d segons',
                        m: 'un minut',
                        mm: '%d minuts',
                        h: 'una hora',
                        hh: '%d hores',
                        d: 'un dia',
                        dd: '%d dies',
                        M: 'un mes',
                        MM: '%d mesos',
                        y: 'un any',
                        yy: '%d anys',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(r|n|t|è|a)/,
                    ordinal: function(e, t) {
                        var a =
                            1 === e
                                ? 'r'
                                : 2 === e
                                ? 'n'
                                : 3 === e
                                ? 'r'
                                : 4 === e
                                ? 't'
                                : 'è';
                        return ('w' !== t && 'W' !== t) || (a = 'a'), e + a;
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        3627: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        format: 'leden_únor_březen_duben_květen_červen_červenec_srpen_září_říjen_listopad_prosinec'.split(
                            '_'
                        ),
                        standalone: 'ledna_února_března_dubna_května_června_července_srpna_září_října_listopadu_prosince'.split(
                            '_'
                        ),
                    },
                    a = 'led_úno_bře_dub_kvě_čvn_čvc_srp_zář_říj_lis_pro'.split(
                        '_'
                    ),
                    n = [
                        /^led/i,
                        /^úno/i,
                        /^bře/i,
                        /^dub/i,
                        /^kvě/i,
                        /^(čvn|červen$|června)/i,
                        /^(čvc|červenec|července)/i,
                        /^srp/i,
                        /^zář/i,
                        /^říj/i,
                        /^lis/i,
                        /^pro/i,
                    ],
                    s = /^(leden|únor|březen|duben|květen|červenec|července|červen|června|srpen|září|říjen|listopad|prosinec|led|úno|bře|dub|kvě|čvn|čvc|srp|zář|říj|lis|pro)/i;
                function r(e) {
                    return e > 1 && e < 5 && 1 != ~~(e / 10);
                }
                function i(e, t, a, n) {
                    var s = e + ' ';
                    switch (a) {
                        case 's':
                            return t || n ? 'pár sekund' : 'pár sekundami';
                        case 'ss':
                            return t || n
                                ? s + (r(e) ? 'sekundy' : 'sekund')
                                : s + 'sekundami';
                        case 'm':
                            return t ? 'minuta' : n ? 'minutu' : 'minutou';
                        case 'mm':
                            return t || n
                                ? s + (r(e) ? 'minuty' : 'minut')
                                : s + 'minutami';
                        case 'h':
                            return t ? 'hodina' : n ? 'hodinu' : 'hodinou';
                        case 'hh':
                            return t || n
                                ? s + (r(e) ? 'hodiny' : 'hodin')
                                : s + 'hodinami';
                        case 'd':
                            return t || n ? 'den' : 'dnem';
                        case 'dd':
                            return t || n
                                ? s + (r(e) ? 'dny' : 'dní')
                                : s + 'dny';
                        case 'M':
                            return t || n ? 'měsíc' : 'měsícem';
                        case 'MM':
                            return t || n
                                ? s + (r(e) ? 'měsíce' : 'měsíců')
                                : s + 'měsíci';
                        case 'y':
                            return t || n ? 'rok' : 'rokem';
                        case 'yy':
                            return t || n
                                ? s + (r(e) ? 'roky' : 'let')
                                : s + 'lety';
                    }
                }
                e.defineLocale('cs', {
                    months: t,
                    monthsShort: a,
                    monthsRegex: s,
                    monthsShortRegex: s,
                    monthsStrictRegex: /^(leden|ledna|února|únor|březen|března|duben|dubna|květen|května|červenec|července|červen|června|srpen|srpna|září|říjen|října|listopadu|listopad|prosinec|prosince)/i,
                    monthsShortStrictRegex: /^(led|úno|bře|dub|kvě|čvn|čvc|srp|zář|říj|lis|pro)/i,
                    monthsParse: n,
                    longMonthsParse: n,
                    shortMonthsParse: n,
                    weekdays: 'neděle_pondělí_úterý_středa_čtvrtek_pátek_sobota'.split(
                        '_'
                    ),
                    weekdaysShort: 'ne_po_út_st_čt_pá_so'.split('_'),
                    weekdaysMin: 'ne_po_út_st_čt_pá_so'.split('_'),
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D. MMMM YYYY',
                        LLL: 'D. MMMM YYYY H:mm',
                        LLLL: 'dddd D. MMMM YYYY H:mm',
                        l: 'D. M. YYYY',
                    },
                    calendar: {
                        sameDay: '[dnes v] LT',
                        nextDay: '[zítra v] LT',
                        nextWeek: function() {
                            switch (this.day()) {
                                case 0:
                                    return '[v neděli v] LT';
                                case 1:
                                case 2:
                                    return '[v] dddd [v] LT';
                                case 3:
                                    return '[ve středu v] LT';
                                case 4:
                                    return '[ve čtvrtek v] LT';
                                case 5:
                                    return '[v pátek v] LT';
                                case 6:
                                    return '[v sobotu v] LT';
                            }
                        },
                        lastDay: '[včera v] LT',
                        lastWeek: function() {
                            switch (this.day()) {
                                case 0:
                                    return '[minulou neděli v] LT';
                                case 1:
                                case 2:
                                    return '[minulé] dddd [v] LT';
                                case 3:
                                    return '[minulou středu v] LT';
                                case 4:
                                case 5:
                                    return '[minulý] dddd [v] LT';
                                case 6:
                                    return '[minulou sobotu v] LT';
                            }
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'za %s',
                        past: 'před %s',
                        s: i,
                        ss: i,
                        m: i,
                        mm: i,
                        h: i,
                        hh: i,
                        d: i,
                        dd: i,
                        M: i,
                        MM: i,
                        y: i,
                        yy: i,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        58957: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('cv', {
                    months: 'кӑрлач_нарӑс_пуш_ака_май_ҫӗртме_утӑ_ҫурла_авӑн_юпа_чӳк_раштав'.split(
                        '_'
                    ),
                    monthsShort: 'кӑр_нар_пуш_ака_май_ҫӗр_утӑ_ҫур_авн_юпа_чӳк_раш'.split(
                        '_'
                    ),
                    weekdays: 'вырсарникун_тунтикун_ытларикун_юнкун_кӗҫнерникун_эрнекун_шӑматкун'.split(
                        '_'
                    ),
                    weekdaysShort: 'выр_тун_ытл_юн_кӗҫ_эрн_шӑм'.split('_'),
                    weekdaysMin: 'вр_тн_ыт_юн_кҫ_эр_шм'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD-MM-YYYY',
                        LL: 'YYYY [ҫулхи] MMMM [уйӑхӗн] D[-мӗшӗ]',
                        LLL: 'YYYY [ҫулхи] MMMM [уйӑхӗн] D[-мӗшӗ], HH:mm',
                        LLLL:
                            'dddd, YYYY [ҫулхи] MMMM [уйӑхӗн] D[-мӗшӗ], HH:mm',
                    },
                    calendar: {
                        sameDay: '[Паян] LT [сехетре]',
                        nextDay: '[Ыран] LT [сехетре]',
                        lastDay: '[Ӗнер] LT [сехетре]',
                        nextWeek: '[Ҫитес] dddd LT [сехетре]',
                        lastWeek: '[Иртнӗ] dddd LT [сехетре]',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: function(e) {
                            return (
                                e +
                                (/сехет$/i.exec(e)
                                    ? 'рен'
                                    : /ҫул$/i.exec(e)
                                    ? 'тан'
                                    : 'ран')
                            );
                        },
                        past: '%s каялла',
                        s: 'пӗр-ик ҫеккунт',
                        ss: '%d ҫеккунт',
                        m: 'пӗр минут',
                        mm: '%d минут',
                        h: 'пӗр сехет',
                        hh: '%d сехет',
                        d: 'пӗр кун',
                        dd: '%d кун',
                        M: 'пӗр уйӑх',
                        MM: '%d уйӑх',
                        y: 'пӗр ҫул',
                        yy: '%d ҫул',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}-мӗш/,
                    ordinal: '%d-мӗш',
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        55770: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('cy', {
                    months: 'Ionawr_Chwefror_Mawrth_Ebrill_Mai_Mehefin_Gorffennaf_Awst_Medi_Hydref_Tachwedd_Rhagfyr'.split(
                        '_'
                    ),
                    monthsShort: 'Ion_Chwe_Maw_Ebr_Mai_Meh_Gor_Aws_Med_Hyd_Tach_Rhag'.split(
                        '_'
                    ),
                    weekdays: 'Dydd Sul_Dydd Llun_Dydd Mawrth_Dydd Mercher_Dydd Iau_Dydd Gwener_Dydd Sadwrn'.split(
                        '_'
                    ),
                    weekdaysShort: 'Sul_Llun_Maw_Mer_Iau_Gwe_Sad'.split('_'),
                    weekdaysMin: 'Su_Ll_Ma_Me_Ia_Gw_Sa'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Heddiw am] LT',
                        nextDay: '[Yfory am] LT',
                        nextWeek: 'dddd [am] LT',
                        lastDay: '[Ddoe am] LT',
                        lastWeek: 'dddd [diwethaf am] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'mewn %s',
                        past: '%s yn ôl',
                        s: 'ychydig eiliadau',
                        ss: '%d eiliad',
                        m: 'munud',
                        mm: '%d munud',
                        h: 'awr',
                        hh: '%d awr',
                        d: 'diwrnod',
                        dd: '%d diwrnod',
                        M: 'mis',
                        MM: '%d mis',
                        y: 'blwyddyn',
                        yy: '%d flynedd',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(fed|ain|af|il|ydd|ed|eg)/,
                    ordinal: function(e) {
                        var t = '';
                        return (
                            e > 20
                                ? (t =
                                      40 === e ||
                                      50 === e ||
                                      60 === e ||
                                      80 === e ||
                                      100 === e
                                          ? 'fed'
                                          : 'ain')
                                : e > 0 &&
                                  (t = [
                                      '',
                                      'af',
                                      'il',
                                      'ydd',
                                      'ydd',
                                      'ed',
                                      'ed',
                                      'ed',
                                      'fed',
                                      'fed',
                                      'fed',
                                      'eg',
                                      'fed',
                                      'eg',
                                      'eg',
                                      'fed',
                                      'eg',
                                      'eg',
                                      'fed',
                                      'eg',
                                      'fed',
                                  ][e]),
                            e + t
                        );
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        54649: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('da', {
                    months: 'januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december'.split(
                        '_'
                    ),
                    monthsShort: 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split(
                        '_'
                    ),
                    weekdays: 'søndag_mandag_tirsdag_onsdag_torsdag_fredag_lørdag'.split(
                        '_'
                    ),
                    weekdaysShort: 'søn_man_tir_ons_tor_fre_lør'.split('_'),
                    weekdaysMin: 'sø_ma_ti_on_to_fr_lø'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D. MMMM YYYY',
                        LLL: 'D. MMMM YYYY HH:mm',
                        LLLL: 'dddd [d.] D. MMMM YYYY [kl.] HH:mm',
                    },
                    calendar: {
                        sameDay: '[i dag kl.] LT',
                        nextDay: '[i morgen kl.] LT',
                        nextWeek: 'på dddd [kl.] LT',
                        lastDay: '[i går kl.] LT',
                        lastWeek: '[i] dddd[s kl.] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'om %s',
                        past: '%s siden',
                        s: 'få sekunder',
                        ss: '%d sekunder',
                        m: 'et minut',
                        mm: '%d minutter',
                        h: 'en time',
                        hh: '%d timer',
                        d: 'en dag',
                        dd: '%d dage',
                        M: 'en måned',
                        MM: '%d måneder',
                        y: 'et år',
                        yy: '%d år',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        28709: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a, n) {
                    var s = {
                        m: ['eine Minute', 'einer Minute'],
                        h: ['eine Stunde', 'einer Stunde'],
                        d: ['ein Tag', 'einem Tag'],
                        dd: [e + ' Tage', e + ' Tagen'],
                        w: ['eine Woche', 'einer Woche'],
                        M: ['ein Monat', 'einem Monat'],
                        MM: [e + ' Monate', e + ' Monaten'],
                        y: ['ein Jahr', 'einem Jahr'],
                        yy: [e + ' Jahre', e + ' Jahren'],
                    };
                    return t ? s[a][0] : s[a][1];
                }
                e.defineLocale('de-at', {
                    months: 'Jänner_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split(
                        '_'
                    ),
                    monthsShort: 'Jän._Feb._März_Apr._Mai_Juni_Juli_Aug._Sep._Okt._Nov._Dez.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split(
                        '_'
                    ),
                    weekdaysShort: 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
                    weekdaysMin: 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D. MMMM YYYY',
                        LLL: 'D. MMMM YYYY HH:mm',
                        LLLL: 'dddd, D. MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[heute um] LT [Uhr]',
                        sameElse: 'L',
                        nextDay: '[morgen um] LT [Uhr]',
                        nextWeek: 'dddd [um] LT [Uhr]',
                        lastDay: '[gestern um] LT [Uhr]',
                        lastWeek: '[letzten] dddd [um] LT [Uhr]',
                    },
                    relativeTime: {
                        future: 'in %s',
                        past: 'vor %s',
                        s: 'ein paar Sekunden',
                        ss: '%d Sekunden',
                        m: t,
                        mm: '%d Minuten',
                        h: t,
                        hh: '%d Stunden',
                        d: t,
                        dd: t,
                        w: t,
                        ww: '%d Wochen',
                        M: t,
                        MM: t,
                        y: t,
                        yy: t,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        21320: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a, n) {
                    var s = {
                        m: ['eine Minute', 'einer Minute'],
                        h: ['eine Stunde', 'einer Stunde'],
                        d: ['ein Tag', 'einem Tag'],
                        dd: [e + ' Tage', e + ' Tagen'],
                        w: ['eine Woche', 'einer Woche'],
                        M: ['ein Monat', 'einem Monat'],
                        MM: [e + ' Monate', e + ' Monaten'],
                        y: ['ein Jahr', 'einem Jahr'],
                        yy: [e + ' Jahre', e + ' Jahren'],
                    };
                    return t ? s[a][0] : s[a][1];
                }
                e.defineLocale('de-ch', {
                    months: 'Januar_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split(
                        '_'
                    ),
                    monthsShort: 'Jan._Feb._März_Apr._Mai_Juni_Juli_Aug._Sep._Okt._Nov._Dez.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split(
                        '_'
                    ),
                    weekdaysShort: 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
                    weekdaysMin: 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D. MMMM YYYY',
                        LLL: 'D. MMMM YYYY HH:mm',
                        LLLL: 'dddd, D. MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[heute um] LT [Uhr]',
                        sameElse: 'L',
                        nextDay: '[morgen um] LT [Uhr]',
                        nextWeek: 'dddd [um] LT [Uhr]',
                        lastDay: '[gestern um] LT [Uhr]',
                        lastWeek: '[letzten] dddd [um] LT [Uhr]',
                    },
                    relativeTime: {
                        future: 'in %s',
                        past: 'vor %s',
                        s: 'ein paar Sekunden',
                        ss: '%d Sekunden',
                        m: t,
                        mm: '%d Minuten',
                        h: t,
                        hh: '%d Stunden',
                        d: t,
                        dd: t,
                        w: t,
                        ww: '%d Wochen',
                        M: t,
                        MM: t,
                        y: t,
                        yy: t,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        89084: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a, n) {
                    var s = {
                        m: ['eine Minute', 'einer Minute'],
                        h: ['eine Stunde', 'einer Stunde'],
                        d: ['ein Tag', 'einem Tag'],
                        dd: [e + ' Tage', e + ' Tagen'],
                        w: ['eine Woche', 'einer Woche'],
                        M: ['ein Monat', 'einem Monat'],
                        MM: [e + ' Monate', e + ' Monaten'],
                        y: ['ein Jahr', 'einem Jahr'],
                        yy: [e + ' Jahre', e + ' Jahren'],
                    };
                    return t ? s[a][0] : s[a][1];
                }
                e.defineLocale('de', {
                    months: 'Januar_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split(
                        '_'
                    ),
                    monthsShort: 'Jan._Feb._März_Apr._Mai_Juni_Juli_Aug._Sep._Okt._Nov._Dez.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split(
                        '_'
                    ),
                    weekdaysShort: 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
                    weekdaysMin: 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D. MMMM YYYY',
                        LLL: 'D. MMMM YYYY HH:mm',
                        LLLL: 'dddd, D. MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[heute um] LT [Uhr]',
                        sameElse: 'L',
                        nextDay: '[morgen um] LT [Uhr]',
                        nextWeek: 'dddd [um] LT [Uhr]',
                        lastDay: '[gestern um] LT [Uhr]',
                        lastWeek: '[letzten] dddd [um] LT [Uhr]',
                    },
                    relativeTime: {
                        future: 'in %s',
                        past: 'vor %s',
                        s: 'ein paar Sekunden',
                        ss: '%d Sekunden',
                        m: t,
                        mm: '%d Minuten',
                        h: t,
                        hh: '%d Stunden',
                        d: t,
                        dd: t,
                        w: t,
                        ww: '%d Wochen',
                        M: t,
                        MM: t,
                        y: t,
                        yy: t,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        63575: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = [
                        'ޖެނުއަރީ',
                        'ފެބްރުއަރީ',
                        'މާރިޗު',
                        'އޭޕްރީލު',
                        'މޭ',
                        'ޖޫން',
                        'ޖުލައި',
                        'އޯގަސްޓު',
                        'ސެޕްޓެމްބަރު',
                        'އޮކްޓޯބަރު',
                        'ނޮވެމްބަރު',
                        'ޑިސެމްބަރު',
                    ],
                    a = [
                        'އާދިއްތަ',
                        'ހޯމަ',
                        'އަންގާރަ',
                        'ބުދަ',
                        'ބުރާސްފަތި',
                        'ހުކުރު',
                        'ހޮނިހިރު',
                    ];
                e.defineLocale('dv', {
                    months: t,
                    monthsShort: t,
                    weekdays: a,
                    weekdaysShort: a,
                    weekdaysMin: 'އާދި_ހޯމަ_އަން_ބުދަ_ބުރާ_ހުކު_ހޮނި'.split(
                        '_'
                    ),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'D/M/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    meridiemParse: /މކ|މފ/,
                    isPM: function(e) {
                        return 'މފ' === e;
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? 'މކ' : 'މފ';
                    },
                    calendar: {
                        sameDay: '[މިއަދު] LT',
                        nextDay: '[މާދަމާ] LT',
                        nextWeek: 'dddd LT',
                        lastDay: '[އިއްޔެ] LT',
                        lastWeek: '[ފާއިތުވި] dddd LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'ތެރޭގައި %s',
                        past: 'ކުރިން %s',
                        s: 'ސިކުންތުކޮޅެއް',
                        ss: 'd% ސިކުންތު',
                        m: 'މިނިޓެއް',
                        mm: 'މިނިޓު %d',
                        h: 'ގަޑިއިރެއް',
                        hh: 'ގަޑިއިރު %d',
                        d: 'ދުވަހެއް',
                        dd: 'ދުވަސް %d',
                        M: 'މަހެއް',
                        MM: 'މަސް %d',
                        y: 'އަހަރެއް',
                        yy: 'އަހަރު %d',
                    },
                    preparse: function(e) {
                        return e.replace(/،/g, ',');
                    },
                    postformat: function(e) {
                        return e.replace(/,/g, '،');
                    },
                    week: { dow: 7, doy: 12 },
                });
            })(a(37485));
        },
        56395: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('el', {
                    monthsNominativeEl: 'Ιανουάριος_Φεβρουάριος_Μάρτιος_Απρίλιος_Μάιος_Ιούνιος_Ιούλιος_Αύγουστος_Σεπτέμβριος_Οκτώβριος_Νοέμβριος_Δεκέμβριος'.split(
                        '_'
                    ),
                    monthsGenitiveEl: 'Ιανουαρίου_Φεβρουαρίου_Μαρτίου_Απριλίου_Μαΐου_Ιουνίου_Ιουλίου_Αυγούστου_Σεπτεμβρίου_Οκτωβρίου_Νοεμβρίου_Δεκεμβρίου'.split(
                        '_'
                    ),
                    months: function(e, t) {
                        return e
                            ? 'string' == typeof t &&
                              /D/.test(t.substring(0, t.indexOf('MMMM')))
                                ? this._monthsGenitiveEl[e.month()]
                                : this._monthsNominativeEl[e.month()]
                            : this._monthsNominativeEl;
                    },
                    monthsShort: 'Ιαν_Φεβ_Μαρ_Απρ_Μαϊ_Ιουν_Ιουλ_Αυγ_Σεπ_Οκτ_Νοε_Δεκ'.split(
                        '_'
                    ),
                    weekdays: 'Κυριακή_Δευτέρα_Τρίτη_Τετάρτη_Πέμπτη_Παρασκευή_Σάββατο'.split(
                        '_'
                    ),
                    weekdaysShort: 'Κυρ_Δευ_Τρι_Τετ_Πεμ_Παρ_Σαβ'.split('_'),
                    weekdaysMin: 'Κυ_Δε_Τρ_Τε_Πε_Πα_Σα'.split('_'),
                    meridiem: function(e, t, a) {
                        return e > 11 ? (a ? 'μμ' : 'ΜΜ') : a ? 'πμ' : 'ΠΜ';
                    },
                    isPM: function(e) {
                        return 'μ' === (e + '').toLowerCase()[0];
                    },
                    meridiemParse: /[ΠΜ]\.?Μ?\.?/i,
                    longDateFormat: {
                        LT: 'h:mm A',
                        LTS: 'h:mm:ss A',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY h:mm A',
                        LLLL: 'dddd, D MMMM YYYY h:mm A',
                    },
                    calendarEl: {
                        sameDay: '[Σήμερα {}] LT',
                        nextDay: '[Αύριο {}] LT',
                        nextWeek: 'dddd [{}] LT',
                        lastDay: '[Χθες {}] LT',
                        lastWeek: function() {
                            return 6 === this.day()
                                ? '[το προηγούμενο] dddd [{}] LT'
                                : '[την προηγούμενη] dddd [{}] LT';
                        },
                        sameElse: 'L',
                    },
                    calendar: function(e, t) {
                        var a,
                            n = this._calendarEl[e],
                            s = t && t.hours();
                        return (
                            (a = n),
                            (('undefined' != typeof Function &&
                                a instanceof Function) ||
                                '[object Function]' ===
                                    Object.prototype.toString.call(a)) &&
                                (n = n.apply(t)),
                            n.replace('{}', s % 12 == 1 ? 'στη' : 'στις')
                        );
                    },
                    relativeTime: {
                        future: 'σε %s',
                        past: '%s πριν',
                        s: 'λίγα δευτερόλεπτα',
                        ss: '%d δευτερόλεπτα',
                        m: 'ένα λεπτό',
                        mm: '%d λεπτά',
                        h: 'μία ώρα',
                        hh: '%d ώρες',
                        d: 'μία μέρα',
                        dd: '%d μέρες',
                        M: 'ένας μήνας',
                        MM: '%d μήνες',
                        y: 'ένας χρόνος',
                        yy: '%d χρόνια',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}η/,
                    ordinal: '%dη',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        93826: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('en-au', {
                    months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split(
                        '_'
                    ),
                    weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
                        '_'
                    ),
                    weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
                    weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
                    longDateFormat: {
                        LT: 'h:mm A',
                        LTS: 'h:mm:ss A',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY h:mm A',
                        LLLL: 'dddd, D MMMM YYYY h:mm A',
                    },
                    calendar: {
                        sameDay: '[Today at] LT',
                        nextDay: '[Tomorrow at] LT',
                        nextWeek: 'dddd [at] LT',
                        lastDay: '[Yesterday at] LT',
                        lastWeek: '[Last] dddd [at] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'in %s',
                        past: '%s ago',
                        s: 'a few seconds',
                        ss: '%d seconds',
                        m: 'a minute',
                        mm: '%d minutes',
                        h: 'an hour',
                        hh: '%d hours',
                        d: 'a day',
                        dd: '%d days',
                        M: 'a month',
                        MM: '%d months',
                        y: 'a year',
                        yy: '%d years',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
                    ordinal: function(e) {
                        var t = e % 10;
                        return (
                            e +
                            (1 == ~~((e % 100) / 10)
                                ? 'th'
                                : 1 === t
                                ? 'st'
                                : 2 === t
                                ? 'nd'
                                : 3 === t
                                ? 'rd'
                                : 'th')
                        );
                    },
                    week: { dow: 0, doy: 4 },
                });
            })(a(37485));
        },
        13769: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('en-ca', {
                    months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split(
                        '_'
                    ),
                    weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
                        '_'
                    ),
                    weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
                    weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
                    longDateFormat: {
                        LT: 'h:mm A',
                        LTS: 'h:mm:ss A',
                        L: 'YYYY-MM-DD',
                        LL: 'MMMM D, YYYY',
                        LLL: 'MMMM D, YYYY h:mm A',
                        LLLL: 'dddd, MMMM D, YYYY h:mm A',
                    },
                    calendar: {
                        sameDay: '[Today at] LT',
                        nextDay: '[Tomorrow at] LT',
                        nextWeek: 'dddd [at] LT',
                        lastDay: '[Yesterday at] LT',
                        lastWeek: '[Last] dddd [at] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'in %s',
                        past: '%s ago',
                        s: 'a few seconds',
                        ss: '%d seconds',
                        m: 'a minute',
                        mm: '%d minutes',
                        h: 'an hour',
                        hh: '%d hours',
                        d: 'a day',
                        dd: '%d days',
                        M: 'a month',
                        MM: '%d months',
                        y: 'a year',
                        yy: '%d years',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
                    ordinal: function(e) {
                        var t = e % 10;
                        return (
                            e +
                            (1 == ~~((e % 100) / 10)
                                ? 'th'
                                : 1 === t
                                ? 'st'
                                : 2 === t
                                ? 'nd'
                                : 3 === t
                                ? 'rd'
                                : 'th')
                        );
                    },
                });
            })(a(37485));
        },
        24155: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('en-gb', {
                    months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split(
                        '_'
                    ),
                    weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
                        '_'
                    ),
                    weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
                    weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Today at] LT',
                        nextDay: '[Tomorrow at] LT',
                        nextWeek: 'dddd [at] LT',
                        lastDay: '[Yesterday at] LT',
                        lastWeek: '[Last] dddd [at] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'in %s',
                        past: '%s ago',
                        s: 'a few seconds',
                        ss: '%d seconds',
                        m: 'a minute',
                        mm: '%d minutes',
                        h: 'an hour',
                        hh: '%d hours',
                        d: 'a day',
                        dd: '%d days',
                        M: 'a month',
                        MM: '%d months',
                        y: 'a year',
                        yy: '%d years',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
                    ordinal: function(e) {
                        var t = e % 10;
                        return (
                            e +
                            (1 == ~~((e % 100) / 10)
                                ? 'th'
                                : 1 === t
                                ? 'st'
                                : 2 === t
                                ? 'nd'
                                : 3 === t
                                ? 'rd'
                                : 'th')
                        );
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        1518: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('en-ie', {
                    months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split(
                        '_'
                    ),
                    weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
                        '_'
                    ),
                    weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
                    weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Today at] LT',
                        nextDay: '[Tomorrow at] LT',
                        nextWeek: 'dddd [at] LT',
                        lastDay: '[Yesterday at] LT',
                        lastWeek: '[Last] dddd [at] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'in %s',
                        past: '%s ago',
                        s: 'a few seconds',
                        ss: '%d seconds',
                        m: 'a minute',
                        mm: '%d minutes',
                        h: 'an hour',
                        hh: '%d hours',
                        d: 'a day',
                        dd: '%d days',
                        M: 'a month',
                        MM: '%d months',
                        y: 'a year',
                        yy: '%d years',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
                    ordinal: function(e) {
                        var t = e % 10;
                        return (
                            e +
                            (1 == ~~((e % 100) / 10)
                                ? 'th'
                                : 1 === t
                                ? 'st'
                                : 2 === t
                                ? 'nd'
                                : 3 === t
                                ? 'rd'
                                : 'th')
                        );
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        24043: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('en-il', {
                    months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split(
                        '_'
                    ),
                    weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
                        '_'
                    ),
                    weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
                    weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Today at] LT',
                        nextDay: '[Tomorrow at] LT',
                        nextWeek: 'dddd [at] LT',
                        lastDay: '[Yesterday at] LT',
                        lastWeek: '[Last] dddd [at] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'in %s',
                        past: '%s ago',
                        s: 'a few seconds',
                        ss: '%d seconds',
                        m: 'a minute',
                        mm: '%d minutes',
                        h: 'an hour',
                        hh: '%d hours',
                        d: 'a day',
                        dd: '%d days',
                        M: 'a month',
                        MM: '%d months',
                        y: 'a year',
                        yy: '%d years',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
                    ordinal: function(e) {
                        var t = e % 10;
                        return (
                            e +
                            (1 == ~~((e % 100) / 10)
                                ? 'th'
                                : 1 === t
                                ? 'st'
                                : 2 === t
                                ? 'nd'
                                : 3 === t
                                ? 'rd'
                                : 'th')
                        );
                    },
                });
            })(a(37485));
        },
        18404: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('en-in', {
                    months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split(
                        '_'
                    ),
                    weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
                        '_'
                    ),
                    weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
                    weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
                    longDateFormat: {
                        LT: 'h:mm A',
                        LTS: 'h:mm:ss A',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY h:mm A',
                        LLLL: 'dddd, D MMMM YYYY h:mm A',
                    },
                    calendar: {
                        sameDay: '[Today at] LT',
                        nextDay: '[Tomorrow at] LT',
                        nextWeek: 'dddd [at] LT',
                        lastDay: '[Yesterday at] LT',
                        lastWeek: '[Last] dddd [at] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'in %s',
                        past: '%s ago',
                        s: 'a few seconds',
                        ss: '%d seconds',
                        m: 'a minute',
                        mm: '%d minutes',
                        h: 'an hour',
                        hh: '%d hours',
                        d: 'a day',
                        dd: '%d days',
                        M: 'a month',
                        MM: '%d months',
                        y: 'a year',
                        yy: '%d years',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
                    ordinal: function(e) {
                        var t = e % 10;
                        return (
                            e +
                            (1 == ~~((e % 100) / 10)
                                ? 'th'
                                : 1 === t
                                ? 'st'
                                : 2 === t
                                ? 'nd'
                                : 3 === t
                                ? 'rd'
                                : 'th')
                        );
                    },
                    week: { dow: 0, doy: 6 },
                });
            })(a(37485));
        },
        79220: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('en-nz', {
                    months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split(
                        '_'
                    ),
                    weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
                        '_'
                    ),
                    weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
                    weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
                    longDateFormat: {
                        LT: 'h:mm A',
                        LTS: 'h:mm:ss A',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY h:mm A',
                        LLLL: 'dddd, D MMMM YYYY h:mm A',
                    },
                    calendar: {
                        sameDay: '[Today at] LT',
                        nextDay: '[Tomorrow at] LT',
                        nextWeek: 'dddd [at] LT',
                        lastDay: '[Yesterday at] LT',
                        lastWeek: '[Last] dddd [at] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'in %s',
                        past: '%s ago',
                        s: 'a few seconds',
                        ss: '%d seconds',
                        m: 'a minute',
                        mm: '%d minutes',
                        h: 'an hour',
                        hh: '%d hours',
                        d: 'a day',
                        dd: '%d days',
                        M: 'a month',
                        MM: '%d months',
                        y: 'a year',
                        yy: '%d years',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
                    ordinal: function(e) {
                        var t = e % 10;
                        return (
                            e +
                            (1 == ~~((e % 100) / 10)
                                ? 'th'
                                : 1 === t
                                ? 'st'
                                : 2 === t
                                ? 'nd'
                                : 3 === t
                                ? 'rd'
                                : 'th')
                        );
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        29133: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('en-sg', {
                    months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split(
                        '_'
                    ),
                    weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
                        '_'
                    ),
                    weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
                    weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Today at] LT',
                        nextDay: '[Tomorrow at] LT',
                        nextWeek: 'dddd [at] LT',
                        lastDay: '[Yesterday at] LT',
                        lastWeek: '[Last] dddd [at] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'in %s',
                        past: '%s ago',
                        s: 'a few seconds',
                        ss: '%d seconds',
                        m: 'a minute',
                        mm: '%d minutes',
                        h: 'an hour',
                        hh: '%d hours',
                        d: 'a day',
                        dd: '%d days',
                        M: 'a month',
                        MM: '%d months',
                        y: 'a year',
                        yy: '%d years',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
                    ordinal: function(e) {
                        var t = e % 10;
                        return (
                            e +
                            (1 == ~~((e % 100) / 10)
                                ? 'th'
                                : 1 === t
                                ? 'st'
                                : 2 === t
                                ? 'nd'
                                : 3 === t
                                ? 'rd'
                                : 'th')
                        );
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        48648: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('eo', {
                    months: 'januaro_februaro_marto_aprilo_majo_junio_julio_aŭgusto_septembro_oktobro_novembro_decembro'.split(
                        '_'
                    ),
                    monthsShort: 'jan_feb_mart_apr_maj_jun_jul_aŭg_sept_okt_nov_dec'.split(
                        '_'
                    ),
                    weekdays: 'dimanĉo_lundo_mardo_merkredo_ĵaŭdo_vendredo_sabato'.split(
                        '_'
                    ),
                    weekdaysShort: 'dim_lun_mard_merk_ĵaŭ_ven_sab'.split('_'),
                    weekdaysMin: 'di_lu_ma_me_ĵa_ve_sa'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'YYYY-MM-DD',
                        LL: '[la] D[-an de] MMMM, YYYY',
                        LLL: '[la] D[-an de] MMMM, YYYY HH:mm',
                        LLLL: 'dddd[n], [la] D[-an de] MMMM, YYYY HH:mm',
                        llll: 'ddd, [la] D[-an de] MMM, YYYY HH:mm',
                    },
                    meridiemParse: /[ap]\.t\.m/i,
                    isPM: function(e) {
                        return 'p' === e.charAt(0).toLowerCase();
                    },
                    meridiem: function(e, t, a) {
                        return e > 11
                            ? a
                                ? 'p.t.m.'
                                : 'P.T.M.'
                            : a
                            ? 'a.t.m.'
                            : 'A.T.M.';
                    },
                    calendar: {
                        sameDay: '[Hodiaŭ je] LT',
                        nextDay: '[Morgaŭ je] LT',
                        nextWeek: 'dddd[n je] LT',
                        lastDay: '[Hieraŭ je] LT',
                        lastWeek: '[pasintan] dddd[n je] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'post %s',
                        past: 'antaŭ %s',
                        s: 'kelkaj sekundoj',
                        ss: '%d sekundoj',
                        m: 'unu minuto',
                        mm: '%d minutoj',
                        h: 'unu horo',
                        hh: '%d horoj',
                        d: 'unu tago',
                        dd: '%d tagoj',
                        M: 'unu monato',
                        MM: '%d monatoj',
                        y: 'unu jaro',
                        yy: '%d jaroj',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}a/,
                    ordinal: '%da',
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        16734: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split(
                        '_'
                    ),
                    a = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split(
                        '_'
                    ),
                    n = [
                        /^ene/i,
                        /^feb/i,
                        /^mar/i,
                        /^abr/i,
                        /^may/i,
                        /^jun/i,
                        /^jul/i,
                        /^ago/i,
                        /^sep/i,
                        /^oct/i,
                        /^nov/i,
                        /^dic/i,
                    ],
                    s = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i;
                e.defineLocale('es-do', {
                    months: 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split(
                        '_'
                    ),
                    monthsShort: function(e, n) {
                        return e
                            ? /-MMM-/.test(n)
                                ? a[e.month()]
                                : t[e.month()]
                            : t;
                    },
                    monthsRegex: s,
                    monthsShortRegex: s,
                    monthsStrictRegex: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
                    monthsShortStrictRegex: /^(ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i,
                    monthsParse: n,
                    longMonthsParse: n,
                    shortMonthsParse: n,
                    weekdays: 'domingo_lunes_martes_miércoles_jueves_viernes_sábado'.split(
                        '_'
                    ),
                    weekdaysShort: 'dom._lun._mar._mié._jue._vie._sáb.'.split(
                        '_'
                    ),
                    weekdaysMin: 'do_lu_ma_mi_ju_vi_sá'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'h:mm A',
                        LTS: 'h:mm:ss A',
                        L: 'DD/MM/YYYY',
                        LL: 'D [de] MMMM [de] YYYY',
                        LLL: 'D [de] MMMM [de] YYYY h:mm A',
                        LLLL: 'dddd, D [de] MMMM [de] YYYY h:mm A',
                    },
                    calendar: {
                        sameDay: function() {
                            return (
                                '[hoy a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        nextDay: function() {
                            return (
                                '[mañana a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        nextWeek: function() {
                            return (
                                'dddd [a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        lastDay: function() {
                            return (
                                '[ayer a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        lastWeek: function() {
                            return (
                                '[el] dddd [pasado a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'en %s',
                        past: 'hace %s',
                        s: 'unos segundos',
                        ss: '%d segundos',
                        m: 'un minuto',
                        mm: '%d minutos',
                        h: 'una hora',
                        hh: '%d horas',
                        d: 'un día',
                        dd: '%d días',
                        w: 'una semana',
                        ww: '%d semanas',
                        M: 'un mes',
                        MM: '%d meses',
                        y: 'un año',
                        yy: '%d años',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}º/,
                    ordinal: '%dº',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        31910: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split(
                        '_'
                    ),
                    a = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split(
                        '_'
                    ),
                    n = [
                        /^ene/i,
                        /^feb/i,
                        /^mar/i,
                        /^abr/i,
                        /^may/i,
                        /^jun/i,
                        /^jul/i,
                        /^ago/i,
                        /^sep/i,
                        /^oct/i,
                        /^nov/i,
                        /^dic/i,
                    ],
                    s = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i;
                e.defineLocale('es-mx', {
                    months: 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split(
                        '_'
                    ),
                    monthsShort: function(e, n) {
                        return e
                            ? /-MMM-/.test(n)
                                ? a[e.month()]
                                : t[e.month()]
                            : t;
                    },
                    monthsRegex: s,
                    monthsShortRegex: s,
                    monthsStrictRegex: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
                    monthsShortStrictRegex: /^(ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i,
                    monthsParse: n,
                    longMonthsParse: n,
                    shortMonthsParse: n,
                    weekdays: 'domingo_lunes_martes_miércoles_jueves_viernes_sábado'.split(
                        '_'
                    ),
                    weekdaysShort: 'dom._lun._mar._mié._jue._vie._sáb.'.split(
                        '_'
                    ),
                    weekdaysMin: 'do_lu_ma_mi_ju_vi_sá'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D [de] MMMM [de] YYYY',
                        LLL: 'D [de] MMMM [de] YYYY H:mm',
                        LLLL: 'dddd, D [de] MMMM [de] YYYY H:mm',
                    },
                    calendar: {
                        sameDay: function() {
                            return (
                                '[hoy a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        nextDay: function() {
                            return (
                                '[mañana a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        nextWeek: function() {
                            return (
                                'dddd [a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        lastDay: function() {
                            return (
                                '[ayer a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        lastWeek: function() {
                            return (
                                '[el] dddd [pasado a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'en %s',
                        past: 'hace %s',
                        s: 'unos segundos',
                        ss: '%d segundos',
                        m: 'un minuto',
                        mm: '%d minutos',
                        h: 'una hora',
                        hh: '%d horas',
                        d: 'un día',
                        dd: '%d días',
                        w: 'una semana',
                        ww: '%d semanas',
                        M: 'un mes',
                        MM: '%d meses',
                        y: 'un año',
                        yy: '%d años',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}º/,
                    ordinal: '%dº',
                    week: { dow: 0, doy: 4 },
                    invalidDate: 'Fecha inválida',
                });
            })(a(37485));
        },
        67093: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split(
                        '_'
                    ),
                    a = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split(
                        '_'
                    ),
                    n = [
                        /^ene/i,
                        /^feb/i,
                        /^mar/i,
                        /^abr/i,
                        /^may/i,
                        /^jun/i,
                        /^jul/i,
                        /^ago/i,
                        /^sep/i,
                        /^oct/i,
                        /^nov/i,
                        /^dic/i,
                    ],
                    s = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i;
                e.defineLocale('es-us', {
                    months: 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split(
                        '_'
                    ),
                    monthsShort: function(e, n) {
                        return e
                            ? /-MMM-/.test(n)
                                ? a[e.month()]
                                : t[e.month()]
                            : t;
                    },
                    monthsRegex: s,
                    monthsShortRegex: s,
                    monthsStrictRegex: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
                    monthsShortStrictRegex: /^(ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i,
                    monthsParse: n,
                    longMonthsParse: n,
                    shortMonthsParse: n,
                    weekdays: 'domingo_lunes_martes_miércoles_jueves_viernes_sábado'.split(
                        '_'
                    ),
                    weekdaysShort: 'dom._lun._mar._mié._jue._vie._sáb.'.split(
                        '_'
                    ),
                    weekdaysMin: 'do_lu_ma_mi_ju_vi_sá'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'h:mm A',
                        LTS: 'h:mm:ss A',
                        L: 'MM/DD/YYYY',
                        LL: 'D [de] MMMM [de] YYYY',
                        LLL: 'D [de] MMMM [de] YYYY h:mm A',
                        LLLL: 'dddd, D [de] MMMM [de] YYYY h:mm A',
                    },
                    calendar: {
                        sameDay: function() {
                            return (
                                '[hoy a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        nextDay: function() {
                            return (
                                '[mañana a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        nextWeek: function() {
                            return (
                                'dddd [a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        lastDay: function() {
                            return (
                                '[ayer a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        lastWeek: function() {
                            return (
                                '[el] dddd [pasado a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'en %s',
                        past: 'hace %s',
                        s: 'unos segundos',
                        ss: '%d segundos',
                        m: 'un minuto',
                        mm: '%d minutos',
                        h: 'una hora',
                        hh: '%d horas',
                        d: 'un día',
                        dd: '%d días',
                        w: 'una semana',
                        ww: '%d semanas',
                        M: 'un mes',
                        MM: '%d meses',
                        y: 'un año',
                        yy: '%d años',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}º/,
                    ordinal: '%dº',
                    week: { dow: 0, doy: 6 },
                });
            })(a(37485));
        },
        68465: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split(
                        '_'
                    ),
                    a = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split(
                        '_'
                    ),
                    n = [
                        /^ene/i,
                        /^feb/i,
                        /^mar/i,
                        /^abr/i,
                        /^may/i,
                        /^jun/i,
                        /^jul/i,
                        /^ago/i,
                        /^sep/i,
                        /^oct/i,
                        /^nov/i,
                        /^dic/i,
                    ],
                    s = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i;
                e.defineLocale('es', {
                    months: 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split(
                        '_'
                    ),
                    monthsShort: function(e, n) {
                        return e
                            ? /-MMM-/.test(n)
                                ? a[e.month()]
                                : t[e.month()]
                            : t;
                    },
                    monthsRegex: s,
                    monthsShortRegex: s,
                    monthsStrictRegex: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
                    monthsShortStrictRegex: /^(ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i,
                    monthsParse: n,
                    longMonthsParse: n,
                    shortMonthsParse: n,
                    weekdays: 'domingo_lunes_martes_miércoles_jueves_viernes_sábado'.split(
                        '_'
                    ),
                    weekdaysShort: 'dom._lun._mar._mié._jue._vie._sáb.'.split(
                        '_'
                    ),
                    weekdaysMin: 'do_lu_ma_mi_ju_vi_sá'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D [de] MMMM [de] YYYY',
                        LLL: 'D [de] MMMM [de] YYYY H:mm',
                        LLLL: 'dddd, D [de] MMMM [de] YYYY H:mm',
                    },
                    calendar: {
                        sameDay: function() {
                            return (
                                '[hoy a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        nextDay: function() {
                            return (
                                '[mañana a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        nextWeek: function() {
                            return (
                                'dddd [a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        lastDay: function() {
                            return (
                                '[ayer a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        lastWeek: function() {
                            return (
                                '[el] dddd [pasado a la' +
                                (1 !== this.hours() ? 's' : '') +
                                '] LT'
                            );
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'en %s',
                        past: 'hace %s',
                        s: 'unos segundos',
                        ss: '%d segundos',
                        m: 'un minuto',
                        mm: '%d minutos',
                        h: 'una hora',
                        hh: '%d horas',
                        d: 'un día',
                        dd: '%d días',
                        w: 'una semana',
                        ww: '%d semanas',
                        M: 'un mes',
                        MM: '%d meses',
                        y: 'un año',
                        yy: '%d años',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}º/,
                    ordinal: '%dº',
                    week: { dow: 1, doy: 4 },
                    invalidDate: 'Fecha inválida',
                });
            })(a(37485));
        },
        53742: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a, n) {
                    var s = {
                        s: ['mõne sekundi', 'mõni sekund', 'paar sekundit'],
                        ss: [e + 'sekundi', e + 'sekundit'],
                        m: ['ühe minuti', 'üks minut'],
                        mm: [e + ' minuti', e + ' minutit'],
                        h: ['ühe tunni', 'tund aega', 'üks tund'],
                        hh: [e + ' tunni', e + ' tundi'],
                        d: ['ühe päeva', 'üks päev'],
                        M: ['kuu aja', 'kuu aega', 'üks kuu'],
                        MM: [e + ' kuu', e + ' kuud'],
                        y: ['ühe aasta', 'aasta', 'üks aasta'],
                        yy: [e + ' aasta', e + ' aastat'],
                    };
                    return t
                        ? s[a][2]
                            ? s[a][2]
                            : s[a][1]
                        : n
                        ? s[a][0]
                        : s[a][1];
                }
                e.defineLocale('et', {
                    months: 'jaanuar_veebruar_märts_aprill_mai_juuni_juuli_august_september_oktoober_november_detsember'.split(
                        '_'
                    ),
                    monthsShort: 'jaan_veebr_märts_apr_mai_juuni_juuli_aug_sept_okt_nov_dets'.split(
                        '_'
                    ),
                    weekdays: 'pühapäev_esmaspäev_teisipäev_kolmapäev_neljapäev_reede_laupäev'.split(
                        '_'
                    ),
                    weekdaysShort: 'P_E_T_K_N_R_L'.split('_'),
                    weekdaysMin: 'P_E_T_K_N_R_L'.split('_'),
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D. MMMM YYYY',
                        LLL: 'D. MMMM YYYY H:mm',
                        LLLL: 'dddd, D. MMMM YYYY H:mm',
                    },
                    calendar: {
                        sameDay: '[Täna,] LT',
                        nextDay: '[Homme,] LT',
                        nextWeek: '[Järgmine] dddd LT',
                        lastDay: '[Eile,] LT',
                        lastWeek: '[Eelmine] dddd LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s pärast',
                        past: '%s tagasi',
                        s: t,
                        ss: t,
                        m: t,
                        mm: t,
                        h: t,
                        hh: t,
                        d: t,
                        dd: '%d päeva',
                        M: t,
                        MM: t,
                        y: t,
                        yy: t,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        41088: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('eu', {
                    months: 'urtarrila_otsaila_martxoa_apirila_maiatza_ekaina_uztaila_abuztua_iraila_urria_azaroa_abendua'.split(
                        '_'
                    ),
                    monthsShort: 'urt._ots._mar._api._mai._eka._uzt._abu._ira._urr._aza._abe.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'igandea_astelehena_asteartea_asteazkena_osteguna_ostirala_larunbata'.split(
                        '_'
                    ),
                    weekdaysShort: 'ig._al._ar._az._og._ol._lr.'.split('_'),
                    weekdaysMin: 'ig_al_ar_az_og_ol_lr'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'YYYY-MM-DD',
                        LL: 'YYYY[ko] MMMM[ren] D[a]',
                        LLL: 'YYYY[ko] MMMM[ren] D[a] HH:mm',
                        LLLL: 'dddd, YYYY[ko] MMMM[ren] D[a] HH:mm',
                        l: 'YYYY-M-D',
                        ll: 'YYYY[ko] MMM D[a]',
                        lll: 'YYYY[ko] MMM D[a] HH:mm',
                        llll: 'ddd, YYYY[ko] MMM D[a] HH:mm',
                    },
                    calendar: {
                        sameDay: '[gaur] LT[etan]',
                        nextDay: '[bihar] LT[etan]',
                        nextWeek: 'dddd LT[etan]',
                        lastDay: '[atzo] LT[etan]',
                        lastWeek: '[aurreko] dddd LT[etan]',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s barru',
                        past: 'duela %s',
                        s: 'segundo batzuk',
                        ss: '%d segundo',
                        m: 'minutu bat',
                        mm: '%d minutu',
                        h: 'ordu bat',
                        hh: '%d ordu',
                        d: 'egun bat',
                        dd: '%d egun',
                        M: 'hilabete bat',
                        MM: '%d hilabete',
                        y: 'urte bat',
                        yy: '%d urte',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        13554: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '۱',
                        2: '۲',
                        3: '۳',
                        4: '۴',
                        5: '۵',
                        6: '۶',
                        7: '۷',
                        8: '۸',
                        9: '۹',
                        0: '۰',
                    },
                    a = {
                        '۱': '1',
                        '۲': '2',
                        '۳': '3',
                        '۴': '4',
                        '۵': '5',
                        '۶': '6',
                        '۷': '7',
                        '۸': '8',
                        '۹': '9',
                        '۰': '0',
                    };
                e.defineLocale('fa', {
                    months: 'ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر'.split(
                        '_'
                    ),
                    monthsShort: 'ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر'.split(
                        '_'
                    ),
                    weekdays: 'یک‌شنبه_دوشنبه_سه‌شنبه_چهارشنبه_پنج‌شنبه_جمعه_شنبه'.split(
                        '_'
                    ),
                    weekdaysShort: 'یک‌شنبه_دوشنبه_سه‌شنبه_چهارشنبه_پنج‌شنبه_جمعه_شنبه'.split(
                        '_'
                    ),
                    weekdaysMin: 'ی_د_س_چ_پ_ج_ش'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    meridiemParse: /قبل از ظهر|بعد از ظهر/,
                    isPM: function(e) {
                        return /بعد از ظهر/.test(e);
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? 'قبل از ظهر' : 'بعد از ظهر';
                    },
                    calendar: {
                        sameDay: '[امروز ساعت] LT',
                        nextDay: '[فردا ساعت] LT',
                        nextWeek: 'dddd [ساعت] LT',
                        lastDay: '[دیروز ساعت] LT',
                        lastWeek: 'dddd [پیش] [ساعت] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'در %s',
                        past: '%s پیش',
                        s: 'چند ثانیه',
                        ss: '%d ثانیه',
                        m: 'یک دقیقه',
                        mm: '%d دقیقه',
                        h: 'یک ساعت',
                        hh: '%d ساعت',
                        d: 'یک روز',
                        dd: '%d روز',
                        M: 'یک ماه',
                        MM: '%d ماه',
                        y: 'یک سال',
                        yy: '%d سال',
                    },
                    preparse: function(e) {
                        return e
                            .replace(/[۰-۹]/g, function(e) {
                                return a[e];
                            })
                            .replace(/،/g, ',');
                    },
                    postformat: function(e) {
                        return e
                            .replace(/\d/g, function(e) {
                                return t[e];
                            })
                            .replace(/,/g, '،');
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}م/,
                    ordinal: '%dم',
                    week: { dow: 6, doy: 12 },
                });
            })(a(37485));
        },
        3996: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = 'nolla yksi kaksi kolme neljä viisi kuusi seitsemän kahdeksan yhdeksän'.split(
                        ' '
                    ),
                    a = [
                        'nolla',
                        'yhden',
                        'kahden',
                        'kolmen',
                        'neljän',
                        'viiden',
                        'kuuden',
                        t[7],
                        t[8],
                        t[9],
                    ];
                function n(e, n, s, r) {
                    var i = '';
                    switch (s) {
                        case 's':
                            return r ? 'muutaman sekunnin' : 'muutama sekunti';
                        case 'ss':
                            i = r ? 'sekunnin' : 'sekuntia';
                            break;
                        case 'm':
                            return r ? 'minuutin' : 'minuutti';
                        case 'mm':
                            i = r ? 'minuutin' : 'minuuttia';
                            break;
                        case 'h':
                            return r ? 'tunnin' : 'tunti';
                        case 'hh':
                            i = r ? 'tunnin' : 'tuntia';
                            break;
                        case 'd':
                            return r ? 'päivän' : 'päivä';
                        case 'dd':
                            i = r ? 'päivän' : 'päivää';
                            break;
                        case 'M':
                            return r ? 'kuukauden' : 'kuukausi';
                        case 'MM':
                            i = r ? 'kuukauden' : 'kuukautta';
                            break;
                        case 'y':
                            return r ? 'vuoden' : 'vuosi';
                        case 'yy':
                            i = r ? 'vuoden' : 'vuotta';
                    }
                    return (
                        (function(e, n) {
                            return e < 10 ? (n ? a[e] : t[e]) : e;
                        })(e, r) +
                        ' ' +
                        i
                    );
                }
                e.defineLocale('fi', {
                    months: 'tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kesäkuu_heinäkuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu'.split(
                        '_'
                    ),
                    monthsShort: 'tammi_helmi_maalis_huhti_touko_kesä_heinä_elo_syys_loka_marras_joulu'.split(
                        '_'
                    ),
                    weekdays: 'sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai'.split(
                        '_'
                    ),
                    weekdaysShort: 'su_ma_ti_ke_to_pe_la'.split('_'),
                    weekdaysMin: 'su_ma_ti_ke_to_pe_la'.split('_'),
                    longDateFormat: {
                        LT: 'HH.mm',
                        LTS: 'HH.mm.ss',
                        L: 'DD.MM.YYYY',
                        LL: 'Do MMMM[ta] YYYY',
                        LLL: 'Do MMMM[ta] YYYY, [klo] HH.mm',
                        LLLL: 'dddd, Do MMMM[ta] YYYY, [klo] HH.mm',
                        l: 'D.M.YYYY',
                        ll: 'Do MMM YYYY',
                        lll: 'Do MMM YYYY, [klo] HH.mm',
                        llll: 'ddd, Do MMM YYYY, [klo] HH.mm',
                    },
                    calendar: {
                        sameDay: '[tänään] [klo] LT',
                        nextDay: '[huomenna] [klo] LT',
                        nextWeek: 'dddd [klo] LT',
                        lastDay: '[eilen] [klo] LT',
                        lastWeek: '[viime] dddd[na] [klo] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s päästä',
                        past: '%s sitten',
                        s: n,
                        ss: n,
                        m: n,
                        mm: n,
                        h: n,
                        hh: n,
                        d: n,
                        dd: n,
                        M: n,
                        MM: n,
                        y: n,
                        yy: n,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        20368: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('fil', {
                    months: 'Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre'.split(
                        '_'
                    ),
                    monthsShort: 'Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis'.split(
                        '_'
                    ),
                    weekdays: 'Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado'.split(
                        '_'
                    ),
                    weekdaysShort: 'Lin_Lun_Mar_Miy_Huw_Biy_Sab'.split('_'),
                    weekdaysMin: 'Li_Lu_Ma_Mi_Hu_Bi_Sab'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'MM/D/YYYY',
                        LL: 'MMMM D, YYYY',
                        LLL: 'MMMM D, YYYY HH:mm',
                        LLLL: 'dddd, MMMM DD, YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: 'LT [ngayong araw]',
                        nextDay: '[Bukas ng] LT',
                        nextWeek: 'LT [sa susunod na] dddd',
                        lastDay: 'LT [kahapon]',
                        lastWeek: 'LT [noong nakaraang] dddd',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'sa loob ng %s',
                        past: '%s ang nakalipas',
                        s: 'ilang segundo',
                        ss: '%d segundo',
                        m: 'isang minuto',
                        mm: '%d minuto',
                        h: 'isang oras',
                        hh: '%d oras',
                        d: 'isang araw',
                        dd: '%d araw',
                        M: 'isang buwan',
                        MM: '%d buwan',
                        y: 'isang taon',
                        yy: '%d taon',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}/,
                    ordinal: function(e) {
                        return e;
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        36132: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('fo', {
                    months: 'januar_februar_mars_apríl_mai_juni_juli_august_september_oktober_november_desember'.split(
                        '_'
                    ),
                    monthsShort: 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split(
                        '_'
                    ),
                    weekdays: 'sunnudagur_mánadagur_týsdagur_mikudagur_hósdagur_fríggjadagur_leygardagur'.split(
                        '_'
                    ),
                    weekdaysShort: 'sun_mán_týs_mik_hós_frí_ley'.split('_'),
                    weekdaysMin: 'su_má_tý_mi_hó_fr_le'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D. MMMM, YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Í dag kl.] LT',
                        nextDay: '[Í morgin kl.] LT',
                        nextWeek: 'dddd [kl.] LT',
                        lastDay: '[Í gjár kl.] LT',
                        lastWeek: '[síðstu] dddd [kl] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'um %s',
                        past: '%s síðani',
                        s: 'fá sekund',
                        ss: '%d sekundir',
                        m: 'ein minuttur',
                        mm: '%d minuttir',
                        h: 'ein tími',
                        hh: '%d tímar',
                        d: 'ein dagur',
                        dd: '%d dagar',
                        M: 'ein mánaður',
                        MM: '%d mánaðir',
                        y: 'eitt ár',
                        yy: '%d ár',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        31467: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('fr-ca', {
                    months: 'janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre'.split(
                        '_'
                    ),
                    monthsShort: 'janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split(
                        '_'
                    ),
                    weekdaysShort: 'dim._lun._mar._mer._jeu._ven._sam.'.split(
                        '_'
                    ),
                    weekdaysMin: 'di_lu_ma_me_je_ve_sa'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'YYYY-MM-DD',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Aujourd’hui à] LT',
                        nextDay: '[Demain à] LT',
                        nextWeek: 'dddd [à] LT',
                        lastDay: '[Hier à] LT',
                        lastWeek: 'dddd [dernier à] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'dans %s',
                        past: 'il y a %s',
                        s: 'quelques secondes',
                        ss: '%d secondes',
                        m: 'une minute',
                        mm: '%d minutes',
                        h: 'une heure',
                        hh: '%d heures',
                        d: 'un jour',
                        dd: '%d jours',
                        M: 'un mois',
                        MM: '%d mois',
                        y: 'un an',
                        yy: '%d ans',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(er|e)/,
                    ordinal: function(e, t) {
                        switch (t) {
                            default:
                            case 'M':
                            case 'Q':
                            case 'D':
                            case 'DDD':
                            case 'd':
                                return e + (1 === e ? 'er' : 'e');
                            case 'w':
                            case 'W':
                                return e + (1 === e ? 're' : 'e');
                        }
                    },
                });
            })(a(37485));
        },
        98279: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('fr-ch', {
                    months: 'janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre'.split(
                        '_'
                    ),
                    monthsShort: 'janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split(
                        '_'
                    ),
                    weekdaysShort: 'dim._lun._mar._mer._jeu._ven._sam.'.split(
                        '_'
                    ),
                    weekdaysMin: 'di_lu_ma_me_je_ve_sa'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Aujourd’hui à] LT',
                        nextDay: '[Demain à] LT',
                        nextWeek: 'dddd [à] LT',
                        lastDay: '[Hier à] LT',
                        lastWeek: 'dddd [dernier à] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'dans %s',
                        past: 'il y a %s',
                        s: 'quelques secondes',
                        ss: '%d secondes',
                        m: 'une minute',
                        mm: '%d minutes',
                        h: 'une heure',
                        hh: '%d heures',
                        d: 'un jour',
                        dd: '%d jours',
                        M: 'un mois',
                        MM: '%d mois',
                        y: 'un an',
                        yy: '%d ans',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(er|e)/,
                    ordinal: function(e, t) {
                        switch (t) {
                            default:
                            case 'M':
                            case 'Q':
                            case 'D':
                            case 'DDD':
                            case 'd':
                                return e + (1 === e ? 'er' : 'e');
                            case 'w':
                            case 'W':
                                return e + (1 === e ? 're' : 'e');
                        }
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        71265: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = /(janv\.?|févr\.?|mars|avr\.?|mai|juin|juil\.?|août|sept\.?|oct\.?|nov\.?|déc\.?|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i,
                    a = [
                        /^janv/i,
                        /^févr/i,
                        /^mars/i,
                        /^avr/i,
                        /^mai/i,
                        /^juin/i,
                        /^juil/i,
                        /^août/i,
                        /^sept/i,
                        /^oct/i,
                        /^nov/i,
                        /^déc/i,
                    ];
                e.defineLocale('fr', {
                    months: 'janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre'.split(
                        '_'
                    ),
                    monthsShort: 'janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.'.split(
                        '_'
                    ),
                    monthsRegex: t,
                    monthsShortRegex: t,
                    monthsStrictRegex: /^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i,
                    monthsShortStrictRegex: /(janv\.?|févr\.?|mars|avr\.?|mai|juin|juil\.?|août|sept\.?|oct\.?|nov\.?|déc\.?)/i,
                    monthsParse: a,
                    longMonthsParse: a,
                    shortMonthsParse: a,
                    weekdays: 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split(
                        '_'
                    ),
                    weekdaysShort: 'dim._lun._mar._mer._jeu._ven._sam.'.split(
                        '_'
                    ),
                    weekdaysMin: 'di_lu_ma_me_je_ve_sa'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Aujourd’hui à] LT',
                        nextDay: '[Demain à] LT',
                        nextWeek: 'dddd [à] LT',
                        lastDay: '[Hier à] LT',
                        lastWeek: 'dddd [dernier à] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'dans %s',
                        past: 'il y a %s',
                        s: 'quelques secondes',
                        ss: '%d secondes',
                        m: 'une minute',
                        mm: '%d minutes',
                        h: 'une heure',
                        hh: '%d heures',
                        d: 'un jour',
                        dd: '%d jours',
                        w: 'une semaine',
                        ww: '%d semaines',
                        M: 'un mois',
                        MM: '%d mois',
                        y: 'un an',
                        yy: '%d ans',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(er|)/,
                    ordinal: function(e, t) {
                        switch (t) {
                            case 'D':
                                return e + (1 === e ? 'er' : '');
                            default:
                            case 'M':
                            case 'Q':
                            case 'DDD':
                            case 'd':
                                return e + (1 === e ? 'er' : 'e');
                            case 'w':
                            case 'W':
                                return e + (1 === e ? 're' : 'e');
                        }
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        88841: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = 'jan._feb._mrt._apr._mai_jun._jul._aug._sep._okt._nov._des.'.split(
                        '_'
                    ),
                    a = 'jan_feb_mrt_apr_mai_jun_jul_aug_sep_okt_nov_des'.split(
                        '_'
                    );
                e.defineLocale('fy', {
                    months: 'jannewaris_febrewaris_maart_april_maaie_juny_july_augustus_septimber_oktober_novimber_desimber'.split(
                        '_'
                    ),
                    monthsShort: function(e, n) {
                        return e
                            ? /-MMM-/.test(n)
                                ? a[e.month()]
                                : t[e.month()]
                            : t;
                    },
                    monthsParseExact: !0,
                    weekdays: 'snein_moandei_tiisdei_woansdei_tongersdei_freed_sneon'.split(
                        '_'
                    ),
                    weekdaysShort: 'si._mo._ti._wo._to._fr._so.'.split('_'),
                    weekdaysMin: 'Si_Mo_Ti_Wo_To_Fr_So'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD-MM-YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[hjoed om] LT',
                        nextDay: '[moarn om] LT',
                        nextWeek: 'dddd [om] LT',
                        lastDay: '[juster om] LT',
                        lastWeek: '[ôfrûne] dddd [om] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'oer %s',
                        past: '%s lyn',
                        s: 'in pear sekonden',
                        ss: '%d sekonden',
                        m: 'ien minút',
                        mm: '%d minuten',
                        h: 'ien oere',
                        hh: '%d oeren',
                        d: 'ien dei',
                        dd: '%d dagen',
                        M: 'ien moanne',
                        MM: '%d moannen',
                        y: 'ien jier',
                        yy: '%d jierren',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
                    ordinal: function(e) {
                        return (
                            e + (1 === e || 8 === e || e >= 20 ? 'ste' : 'de')
                        );
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        65254: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('ga', {
                    months: [
                        'Eanáir',
                        'Feabhra',
                        'Márta',
                        'Aibreán',
                        'Bealtaine',
                        'Meitheamh',
                        'Iúil',
                        'Lúnasa',
                        'Meán Fómhair',
                        'Deireadh Fómhair',
                        'Samhain',
                        'Nollaig',
                    ],
                    monthsShort: [
                        'Ean',
                        'Feabh',
                        'Márt',
                        'Aib',
                        'Beal',
                        'Meith',
                        'Iúil',
                        'Lún',
                        'M.F.',
                        'D.F.',
                        'Samh',
                        'Noll',
                    ],
                    monthsParseExact: !0,
                    weekdays: [
                        'Dé Domhnaigh',
                        'Dé Luain',
                        'Dé Máirt',
                        'Dé Céadaoin',
                        'Déardaoin',
                        'Dé hAoine',
                        'Dé Sathairn',
                    ],
                    weekdaysShort: [
                        'Domh',
                        'Luan',
                        'Máirt',
                        'Céad',
                        'Déar',
                        'Aoine',
                        'Sath',
                    ],
                    weekdaysMin: ['Do', 'Lu', 'Má', 'Cé', 'Dé', 'A', 'Sa'],
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Inniu ag] LT',
                        nextDay: '[Amárach ag] LT',
                        nextWeek: 'dddd [ag] LT',
                        lastDay: '[Inné ag] LT',
                        lastWeek: 'dddd [seo caite] [ag] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'i %s',
                        past: '%s ó shin',
                        s: 'cúpla soicind',
                        ss: '%d soicind',
                        m: 'nóiméad',
                        mm: '%d nóiméad',
                        h: 'uair an chloig',
                        hh: '%d uair an chloig',
                        d: 'lá',
                        dd: '%d lá',
                        M: 'mí',
                        MM: '%d míonna',
                        y: 'bliain',
                        yy: '%d bliain',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(d|na|mh)/,
                    ordinal: function(e) {
                        return e + (1 === e ? 'd' : e % 10 == 2 ? 'na' : 'mh');
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        72520: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('gd', {
                    months: [
                        'Am Faoilleach',
                        'An Gearran',
                        'Am Màrt',
                        'An Giblean',
                        'An Cèitean',
                        'An t-Ògmhios',
                        'An t-Iuchar',
                        'An Lùnastal',
                        'An t-Sultain',
                        'An Dàmhair',
                        'An t-Samhain',
                        'An Dùbhlachd',
                    ],
                    monthsShort: [
                        'Faoi',
                        'Gear',
                        'Màrt',
                        'Gibl',
                        'Cèit',
                        'Ògmh',
                        'Iuch',
                        'Lùn',
                        'Sult',
                        'Dàmh',
                        'Samh',
                        'Dùbh',
                    ],
                    monthsParseExact: !0,
                    weekdays: [
                        'Didòmhnaich',
                        'Diluain',
                        'Dimàirt',
                        'Diciadain',
                        'Diardaoin',
                        'Dihaoine',
                        'Disathairne',
                    ],
                    weekdaysShort: [
                        'Did',
                        'Dil',
                        'Dim',
                        'Dic',
                        'Dia',
                        'Dih',
                        'Dis',
                    ],
                    weekdaysMin: ['Dò', 'Lu', 'Mà', 'Ci', 'Ar', 'Ha', 'Sa'],
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[An-diugh aig] LT',
                        nextDay: '[A-màireach aig] LT',
                        nextWeek: 'dddd [aig] LT',
                        lastDay: '[An-dè aig] LT',
                        lastWeek: 'dddd [seo chaidh] [aig] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'ann an %s',
                        past: 'bho chionn %s',
                        s: 'beagan diogan',
                        ss: '%d diogan',
                        m: 'mionaid',
                        mm: '%d mionaidean',
                        h: 'uair',
                        hh: '%d uairean',
                        d: 'latha',
                        dd: '%d latha',
                        M: 'mìos',
                        MM: '%d mìosan',
                        y: 'bliadhna',
                        yy: '%d bliadhna',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(d|na|mh)/,
                    ordinal: function(e) {
                        return e + (1 === e ? 'd' : e % 10 == 2 ? 'na' : 'mh');
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        94898: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('gl', {
                    months: 'xaneiro_febreiro_marzo_abril_maio_xuño_xullo_agosto_setembro_outubro_novembro_decembro'.split(
                        '_'
                    ),
                    monthsShort: 'xan._feb._mar._abr._mai._xuñ._xul._ago._set._out._nov._dec.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'domingo_luns_martes_mércores_xoves_venres_sábado'.split(
                        '_'
                    ),
                    weekdaysShort: 'dom._lun._mar._mér._xov._ven._sáb.'.split(
                        '_'
                    ),
                    weekdaysMin: 'do_lu_ma_mé_xo_ve_sá'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D [de] MMMM [de] YYYY',
                        LLL: 'D [de] MMMM [de] YYYY H:mm',
                        LLLL: 'dddd, D [de] MMMM [de] YYYY H:mm',
                    },
                    calendar: {
                        sameDay: function() {
                            return (
                                '[hoxe ' +
                                (1 !== this.hours() ? 'ás' : 'á') +
                                '] LT'
                            );
                        },
                        nextDay: function() {
                            return (
                                '[mañá ' +
                                (1 !== this.hours() ? 'ás' : 'á') +
                                '] LT'
                            );
                        },
                        nextWeek: function() {
                            return (
                                'dddd [' +
                                (1 !== this.hours() ? 'ás' : 'a') +
                                '] LT'
                            );
                        },
                        lastDay: function() {
                            return (
                                '[onte ' +
                                (1 !== this.hours() ? 'á' : 'a') +
                                '] LT'
                            );
                        },
                        lastWeek: function() {
                            return (
                                '[o] dddd [pasado ' +
                                (1 !== this.hours() ? 'ás' : 'a') +
                                '] LT'
                            );
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: function(e) {
                            return 0 === e.indexOf('un') ? 'n' + e : 'en ' + e;
                        },
                        past: 'hai %s',
                        s: 'uns segundos',
                        ss: '%d segundos',
                        m: 'un minuto',
                        mm: '%d minutos',
                        h: 'unha hora',
                        hh: '%d horas',
                        d: 'un día',
                        dd: '%d días',
                        M: 'un mes',
                        MM: '%d meses',
                        y: 'un ano',
                        yy: '%d anos',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}º/,
                    ordinal: '%dº',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        35171: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a, n) {
                    var s = {
                        s: ['थोडया सॅकंडांनी', 'थोडे सॅकंड'],
                        ss: [e + ' सॅकंडांनी', e + ' सॅकंड'],
                        m: ['एका मिणटान', 'एक मिनूट'],
                        mm: [e + ' मिणटांनी', e + ' मिणटां'],
                        h: ['एका वरान', 'एक वर'],
                        hh: [e + ' वरांनी', e + ' वरां'],
                        d: ['एका दिसान', 'एक दीस'],
                        dd: [e + ' दिसांनी', e + ' दीस'],
                        M: ['एका म्हयन्यान', 'एक म्हयनो'],
                        MM: [e + ' म्हयन्यानी', e + ' म्हयने'],
                        y: ['एका वर्सान', 'एक वर्स'],
                        yy: [e + ' वर्सांनी', e + ' वर्सां'],
                    };
                    return n ? s[a][0] : s[a][1];
                }
                e.defineLocale('gom-deva', {
                    months: {
                        standalone: 'जानेवारी_फेब्रुवारी_मार्च_एप्रील_मे_जून_जुलय_ऑगस्ट_सप्टेंबर_ऑक्टोबर_नोव्हेंबर_डिसेंबर'.split(
                            '_'
                        ),
                        format: 'जानेवारीच्या_फेब्रुवारीच्या_मार्चाच्या_एप्रीलाच्या_मेयाच्या_जूनाच्या_जुलयाच्या_ऑगस्टाच्या_सप्टेंबराच्या_ऑक्टोबराच्या_नोव्हेंबराच्या_डिसेंबराच्या'.split(
                            '_'
                        ),
                        isFormat: /MMMM(\s)+D[oD]?/,
                    },
                    monthsShort: 'जाने._फेब्रु._मार्च_एप्री._मे_जून_जुल._ऑग._सप्टें._ऑक्टो._नोव्हें._डिसें.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'आयतार_सोमार_मंगळार_बुधवार_बिरेस्तार_सुक्रार_शेनवार'.split(
                        '_'
                    ),
                    weekdaysShort: 'आयत._सोम._मंगळ._बुध._ब्रेस्त._सुक्र._शेन.'.split(
                        '_'
                    ),
                    weekdaysMin: 'आ_सो_मं_बु_ब्रे_सु_शे'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'A h:mm [वाजतां]',
                        LTS: 'A h:mm:ss [वाजतां]',
                        L: 'DD-MM-YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY A h:mm [वाजतां]',
                        LLLL: 'dddd, MMMM Do, YYYY, A h:mm [वाजतां]',
                        llll: 'ddd, D MMM YYYY, A h:mm [वाजतां]',
                    },
                    calendar: {
                        sameDay: '[आयज] LT',
                        nextDay: '[फाल्यां] LT',
                        nextWeek: '[फुडलो] dddd[,] LT',
                        lastDay: '[काल] LT',
                        lastWeek: '[फाटलो] dddd[,] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s',
                        past: '%s आदीं',
                        s: t,
                        ss: t,
                        m: t,
                        mm: t,
                        h: t,
                        hh: t,
                        d: t,
                        dd: t,
                        M: t,
                        MM: t,
                        y: t,
                        yy: t,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(वेर)/,
                    ordinal: function(e, t) {
                        return 'D' === t ? e + 'वेर' : e;
                    },
                    week: { dow: 0, doy: 3 },
                    meridiemParse: /राती|सकाळीं|दनपारां|सांजे/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'राती' === t
                                ? e < 4
                                    ? e
                                    : e + 12
                                : 'सकाळीं' === t
                                ? e
                                : 'दनपारां' === t
                                ? e > 12
                                    ? e
                                    : e + 12
                                : 'सांजे' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'राती'
                            : e < 12
                            ? 'सकाळीं'
                            : e < 16
                            ? 'दनपारां'
                            : e < 20
                            ? 'सांजे'
                            : 'राती';
                    },
                });
            })(a(37485));
        },
        63681: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a, n) {
                    var s = {
                        s: ['thoddea sekondamni', 'thodde sekond'],
                        ss: [e + ' sekondamni', e + ' sekond'],
                        m: ['eka mintan', 'ek minut'],
                        mm: [e + ' mintamni', e + ' mintam'],
                        h: ['eka voran', 'ek vor'],
                        hh: [e + ' voramni', e + ' voram'],
                        d: ['eka disan', 'ek dis'],
                        dd: [e + ' disamni', e + ' dis'],
                        M: ['eka mhoinean', 'ek mhoino'],
                        MM: [e + ' mhoineamni', e + ' mhoine'],
                        y: ['eka vorsan', 'ek voros'],
                        yy: [e + ' vorsamni', e + ' vorsam'],
                    };
                    return n ? s[a][0] : s[a][1];
                }
                e.defineLocale('gom-latn', {
                    months: {
                        standalone: 'Janer_Febrer_Mars_Abril_Mai_Jun_Julai_Agost_Setembr_Otubr_Novembr_Dezembr'.split(
                            '_'
                        ),
                        format: 'Janerachea_Febrerachea_Marsachea_Abrilachea_Maiachea_Junachea_Julaiachea_Agostachea_Setembrachea_Otubrachea_Novembrachea_Dezembrachea'.split(
                            '_'
                        ),
                        isFormat: /MMMM(\s)+D[oD]?/,
                    },
                    monthsShort: 'Jan._Feb._Mars_Abr._Mai_Jun_Jul._Ago._Set._Otu._Nov._Dez.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: "Aitar_Somar_Mongllar_Budhvar_Birestar_Sukrar_Son'var".split(
                        '_'
                    ),
                    weekdaysShort: 'Ait._Som._Mon._Bud._Bre._Suk._Son.'.split(
                        '_'
                    ),
                    weekdaysMin: 'Ai_Sm_Mo_Bu_Br_Su_Sn'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'A h:mm [vazta]',
                        LTS: 'A h:mm:ss [vazta]',
                        L: 'DD-MM-YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY A h:mm [vazta]',
                        LLLL: 'dddd, MMMM Do, YYYY, A h:mm [vazta]',
                        llll: 'ddd, D MMM YYYY, A h:mm [vazta]',
                    },
                    calendar: {
                        sameDay: '[Aiz] LT',
                        nextDay: '[Faleam] LT',
                        nextWeek: '[Fuddlo] dddd[,] LT',
                        lastDay: '[Kal] LT',
                        lastWeek: '[Fattlo] dddd[,] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s',
                        past: '%s adim',
                        s: t,
                        ss: t,
                        m: t,
                        mm: t,
                        h: t,
                        hh: t,
                        d: t,
                        dd: t,
                        M: t,
                        MM: t,
                        y: t,
                        yy: t,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(er)/,
                    ordinal: function(e, t) {
                        return 'D' === t ? e + 'er' : e;
                    },
                    week: { dow: 0, doy: 3 },
                    meridiemParse: /rati|sokallim|donparam|sanje/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'rati' === t
                                ? e < 4
                                    ? e
                                    : e + 12
                                : 'sokallim' === t
                                ? e
                                : 'donparam' === t
                                ? e > 12
                                    ? e
                                    : e + 12
                                : 'sanje' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'rati'
                            : e < 12
                            ? 'sokallim'
                            : e < 16
                            ? 'donparam'
                            : e < 20
                            ? 'sanje'
                            : 'rati';
                    },
                });
            })(a(37485));
        },
        32613: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '૧',
                        2: '૨',
                        3: '૩',
                        4: '૪',
                        5: '૫',
                        6: '૬',
                        7: '૭',
                        8: '૮',
                        9: '૯',
                        0: '૦',
                    },
                    a = {
                        '૧': '1',
                        '૨': '2',
                        '૩': '3',
                        '૪': '4',
                        '૫': '5',
                        '૬': '6',
                        '૭': '7',
                        '૮': '8',
                        '૯': '9',
                        '૦': '0',
                    };
                e.defineLocale('gu', {
                    months: 'જાન્યુઆરી_ફેબ્રુઆરી_માર્ચ_એપ્રિલ_મે_જૂન_જુલાઈ_ઑગસ્ટ_સપ્ટેમ્બર_ઑક્ટ્બર_નવેમ્બર_ડિસેમ્બર'.split(
                        '_'
                    ),
                    monthsShort: 'જાન્યુ._ફેબ્રુ._માર્ચ_એપ્રિ._મે_જૂન_જુલા._ઑગ._સપ્ટે._ઑક્ટ્._નવે._ડિસે.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'રવિવાર_સોમવાર_મંગળવાર_બુધ્વાર_ગુરુવાર_શુક્રવાર_શનિવાર'.split(
                        '_'
                    ),
                    weekdaysShort: 'રવિ_સોમ_મંગળ_બુધ્_ગુરુ_શુક્ર_શનિ'.split(
                        '_'
                    ),
                    weekdaysMin: 'ર_સો_મં_બુ_ગુ_શુ_શ'.split('_'),
                    longDateFormat: {
                        LT: 'A h:mm વાગ્યે',
                        LTS: 'A h:mm:ss વાગ્યે',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY, A h:mm વાગ્યે',
                        LLLL: 'dddd, D MMMM YYYY, A h:mm વાગ્યે',
                    },
                    calendar: {
                        sameDay: '[આજ] LT',
                        nextDay: '[કાલે] LT',
                        nextWeek: 'dddd, LT',
                        lastDay: '[ગઇકાલે] LT',
                        lastWeek: '[પાછલા] dddd, LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s મા',
                        past: '%s પહેલા',
                        s: 'અમુક પળો',
                        ss: '%d સેકંડ',
                        m: 'એક મિનિટ',
                        mm: '%d મિનિટ',
                        h: 'એક કલાક',
                        hh: '%d કલાક',
                        d: 'એક દિવસ',
                        dd: '%d દિવસ',
                        M: 'એક મહિનો',
                        MM: '%d મહિનો',
                        y: 'એક વર્ષ',
                        yy: '%d વર્ષ',
                    },
                    preparse: function(e) {
                        return e.replace(/[૧૨૩૪૫૬૭૮૯૦]/g, function(e) {
                            return a[e];
                        });
                    },
                    postformat: function(e) {
                        return e.replace(/\d/g, function(e) {
                            return t[e];
                        });
                    },
                    meridiemParse: /રાત|બપોર|સવાર|સાંજ/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'રાત' === t
                                ? e < 4
                                    ? e
                                    : e + 12
                                : 'સવાર' === t
                                ? e
                                : 'બપોર' === t
                                ? e >= 10
                                    ? e
                                    : e + 12
                                : 'સાંજ' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'રાત'
                            : e < 10
                            ? 'સવાર'
                            : e < 17
                            ? 'બપોર'
                            : e < 20
                            ? 'સાંજ'
                            : 'રાત';
                    },
                    week: { dow: 0, doy: 6 },
                });
            })(a(37485));
        },
        42716: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('he', {
                    months: 'ינואר_פברואר_מרץ_אפריל_מאי_יוני_יולי_אוגוסט_ספטמבר_אוקטובר_נובמבר_דצמבר'.split(
                        '_'
                    ),
                    monthsShort: 'ינו׳_פבר׳_מרץ_אפר׳_מאי_יוני_יולי_אוג׳_ספט׳_אוק׳_נוב׳_דצמ׳'.split(
                        '_'
                    ),
                    weekdays: 'ראשון_שני_שלישי_רביעי_חמישי_שישי_שבת'.split('_'),
                    weekdaysShort: 'א׳_ב׳_ג׳_ד׳_ה׳_ו׳_ש׳'.split('_'),
                    weekdaysMin: 'א_ב_ג_ד_ה_ו_ש'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D [ב]MMMM YYYY',
                        LLL: 'D [ב]MMMM YYYY HH:mm',
                        LLLL: 'dddd, D [ב]MMMM YYYY HH:mm',
                        l: 'D/M/YYYY',
                        ll: 'D MMM YYYY',
                        lll: 'D MMM YYYY HH:mm',
                        llll: 'ddd, D MMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[היום ב־]LT',
                        nextDay: '[מחר ב־]LT',
                        nextWeek: 'dddd [בשעה] LT',
                        lastDay: '[אתמול ב־]LT',
                        lastWeek: '[ביום] dddd [האחרון בשעה] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'בעוד %s',
                        past: 'לפני %s',
                        s: 'מספר שניות',
                        ss: '%d שניות',
                        m: 'דקה',
                        mm: '%d דקות',
                        h: 'שעה',
                        hh: function(e) {
                            return 2 === e ? 'שעתיים' : e + ' שעות';
                        },
                        d: 'יום',
                        dd: function(e) {
                            return 2 === e ? 'יומיים' : e + ' ימים';
                        },
                        M: 'חודש',
                        MM: function(e) {
                            return 2 === e ? 'חודשיים' : e + ' חודשים';
                        },
                        y: 'שנה',
                        yy: function(e) {
                            return 2 === e
                                ? 'שנתיים'
                                : e % 10 == 0 && 10 !== e
                                ? e + ' שנה'
                                : e + ' שנים';
                        },
                    },
                    meridiemParse: /אחה"צ|לפנה"צ|אחרי הצהריים|לפני הצהריים|לפנות בוקר|בבוקר|בערב/i,
                    isPM: function(e) {
                        return /^(אחה"צ|אחרי הצהריים|בערב)$/.test(e);
                    },
                    meridiem: function(e, t, a) {
                        return e < 5
                            ? 'לפנות בוקר'
                            : e < 10
                            ? 'בבוקר'
                            : e < 12
                            ? a
                                ? 'לפנה"צ'
                                : 'לפני הצהריים'
                            : e < 18
                            ? a
                                ? 'אחה"צ'
                                : 'אחרי הצהריים'
                            : 'בערב';
                    },
                });
            })(a(37485));
        },
        71315: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '१',
                        2: '२',
                        3: '३',
                        4: '४',
                        5: '५',
                        6: '६',
                        7: '७',
                        8: '८',
                        9: '९',
                        0: '०',
                    },
                    a = {
                        '१': '1',
                        '२': '2',
                        '३': '3',
                        '४': '4',
                        '५': '5',
                        '६': '6',
                        '७': '7',
                        '८': '8',
                        '९': '9',
                        '०': '0',
                    },
                    n = [
                        /^जन/i,
                        /^फ़र|फर/i,
                        /^मार्च/i,
                        /^अप्रै/i,
                        /^मई/i,
                        /^जून/i,
                        /^जुल/i,
                        /^अग/i,
                        /^सितं|सित/i,
                        /^अक्टू/i,
                        /^नव|नवं/i,
                        /^दिसं|दिस/i,
                    ];
                e.defineLocale('hi', {
                    months: {
                        format: 'जनवरी_फ़रवरी_मार्च_अप्रैल_मई_जून_जुलाई_अगस्त_सितम्बर_अक्टूबर_नवम्बर_दिसम्बर'.split(
                            '_'
                        ),
                        standalone: 'जनवरी_फरवरी_मार्च_अप्रैल_मई_जून_जुलाई_अगस्त_सितंबर_अक्टूबर_नवंबर_दिसंबर'.split(
                            '_'
                        ),
                    },
                    monthsShort: 'जन._फ़र._मार्च_अप्रै._मई_जून_जुल._अग._सित._अक्टू._नव._दिस.'.split(
                        '_'
                    ),
                    weekdays: 'रविवार_सोमवार_मंगलवार_बुधवार_गुरूवार_शुक्रवार_शनिवार'.split(
                        '_'
                    ),
                    weekdaysShort: 'रवि_सोम_मंगल_बुध_गुरू_शुक्र_शनि'.split('_'),
                    weekdaysMin: 'र_सो_मं_बु_गु_शु_श'.split('_'),
                    longDateFormat: {
                        LT: 'A h:mm बजे',
                        LTS: 'A h:mm:ss बजे',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY, A h:mm बजे',
                        LLLL: 'dddd, D MMMM YYYY, A h:mm बजे',
                    },
                    monthsParse: n,
                    longMonthsParse: n,
                    shortMonthsParse: [
                        /^जन/i,
                        /^फ़र/i,
                        /^मार्च/i,
                        /^अप्रै/i,
                        /^मई/i,
                        /^जून/i,
                        /^जुल/i,
                        /^अग/i,
                        /^सित/i,
                        /^अक्टू/i,
                        /^नव/i,
                        /^दिस/i,
                    ],
                    monthsRegex: /^(जनवरी|जन\.?|फ़रवरी|फरवरी|फ़र\.?|मार्च?|अप्रैल|अप्रै\.?|मई?|जून?|जुलाई|जुल\.?|अगस्त|अग\.?|सितम्बर|सितंबर|सित\.?|अक्टूबर|अक्टू\.?|नवम्बर|नवंबर|नव\.?|दिसम्बर|दिसंबर|दिस\.?)/i,
                    monthsShortRegex: /^(जनवरी|जन\.?|फ़रवरी|फरवरी|फ़र\.?|मार्च?|अप्रैल|अप्रै\.?|मई?|जून?|जुलाई|जुल\.?|अगस्त|अग\.?|सितम्बर|सितंबर|सित\.?|अक्टूबर|अक्टू\.?|नवम्बर|नवंबर|नव\.?|दिसम्बर|दिसंबर|दिस\.?)/i,
                    monthsStrictRegex: /^(जनवरी?|फ़रवरी|फरवरी?|मार्च?|अप्रैल?|मई?|जून?|जुलाई?|अगस्त?|सितम्बर|सितंबर|सित?\.?|अक्टूबर|अक्टू\.?|नवम्बर|नवंबर?|दिसम्बर|दिसंबर?)/i,
                    monthsShortStrictRegex: /^(जन\.?|फ़र\.?|मार्च?|अप्रै\.?|मई?|जून?|जुल\.?|अग\.?|सित\.?|अक्टू\.?|नव\.?|दिस\.?)/i,
                    calendar: {
                        sameDay: '[आज] LT',
                        nextDay: '[कल] LT',
                        nextWeek: 'dddd, LT',
                        lastDay: '[कल] LT',
                        lastWeek: '[पिछले] dddd, LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s में',
                        past: '%s पहले',
                        s: 'कुछ ही क्षण',
                        ss: '%d सेकंड',
                        m: 'एक मिनट',
                        mm: '%d मिनट',
                        h: 'एक घंटा',
                        hh: '%d घंटे',
                        d: 'एक दिन',
                        dd: '%d दिन',
                        M: 'एक महीने',
                        MM: '%d महीने',
                        y: 'एक वर्ष',
                        yy: '%d वर्ष',
                    },
                    preparse: function(e) {
                        return e.replace(/[१२३४५६७८९०]/g, function(e) {
                            return a[e];
                        });
                    },
                    postformat: function(e) {
                        return e.replace(/\d/g, function(e) {
                            return t[e];
                        });
                    },
                    meridiemParse: /रात|सुबह|दोपहर|शाम/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'रात' === t
                                ? e < 4
                                    ? e
                                    : e + 12
                                : 'सुबह' === t
                                ? e
                                : 'दोपहर' === t
                                ? e >= 10
                                    ? e
                                    : e + 12
                                : 'शाम' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'रात'
                            : e < 10
                            ? 'सुबह'
                            : e < 17
                            ? 'दोपहर'
                            : e < 20
                            ? 'शाम'
                            : 'रात';
                    },
                    week: { dow: 0, doy: 6 },
                });
            })(a(37485));
        },
        14577: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a) {
                    var n = e + ' ';
                    switch (a) {
                        case 'ss':
                            return (
                                n +
                                (1 === e
                                    ? 'sekunda'
                                    : 2 === e || 3 === e || 4 === e
                                    ? 'sekunde'
                                    : 'sekundi')
                            );
                        case 'm':
                            return t ? 'jedna minuta' : 'jedne minute';
                        case 'mm':
                            return (
                                n +
                                (1 === e
                                    ? 'minuta'
                                    : 2 === e || 3 === e || 4 === e
                                    ? 'minute'
                                    : 'minuta')
                            );
                        case 'h':
                            return t ? 'jedan sat' : 'jednog sata';
                        case 'hh':
                            return (
                                n +
                                (1 === e
                                    ? 'sat'
                                    : 2 === e || 3 === e || 4 === e
                                    ? 'sata'
                                    : 'sati')
                            );
                        case 'dd':
                            return n + (1 === e ? 'dan' : 'dana');
                        case 'MM':
                            return (
                                n +
                                (1 === e
                                    ? 'mjesec'
                                    : 2 === e || 3 === e || 4 === e
                                    ? 'mjeseca'
                                    : 'mjeseci')
                            );
                        case 'yy':
                            return (
                                n +
                                (1 === e
                                    ? 'godina'
                                    : 2 === e || 3 === e || 4 === e
                                    ? 'godine'
                                    : 'godina')
                            );
                    }
                }
                e.defineLocale('hr', {
                    months: {
                        format: 'siječnja_veljače_ožujka_travnja_svibnja_lipnja_srpnja_kolovoza_rujna_listopada_studenoga_prosinca'.split(
                            '_'
                        ),
                        standalone: 'siječanj_veljača_ožujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac'.split(
                            '_'
                        ),
                    },
                    monthsShort: 'sij._velj._ožu._tra._svi._lip._srp._kol._ruj._lis._stu._pro.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota'.split(
                        '_'
                    ),
                    weekdaysShort: 'ned._pon._uto._sri._čet._pet._sub.'.split(
                        '_'
                    ),
                    weekdaysMin: 'ne_po_ut_sr_če_pe_su'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'Do MMMM YYYY',
                        LLL: 'Do MMMM YYYY H:mm',
                        LLLL: 'dddd, Do MMMM YYYY H:mm',
                    },
                    calendar: {
                        sameDay: '[danas u] LT',
                        nextDay: '[sutra u] LT',
                        nextWeek: function() {
                            switch (this.day()) {
                                case 0:
                                    return '[u] [nedjelju] [u] LT';
                                case 3:
                                    return '[u] [srijedu] [u] LT';
                                case 6:
                                    return '[u] [subotu] [u] LT';
                                case 1:
                                case 2:
                                case 4:
                                case 5:
                                    return '[u] dddd [u] LT';
                            }
                        },
                        lastDay: '[jučer u] LT',
                        lastWeek: function() {
                            switch (this.day()) {
                                case 0:
                                    return '[prošlu] [nedjelju] [u] LT';
                                case 3:
                                    return '[prošlu] [srijedu] [u] LT';
                                case 6:
                                    return '[prošle] [subote] [u] LT';
                                case 1:
                                case 2:
                                case 4:
                                case 5:
                                    return '[prošli] dddd [u] LT';
                            }
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'za %s',
                        past: 'prije %s',
                        s: 'par sekundi',
                        ss: t,
                        m: t,
                        mm: t,
                        h: t,
                        hh: t,
                        d: 'dan',
                        dd: t,
                        M: 'mjesec',
                        MM: t,
                        y: 'godinu',
                        yy: t,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        26736: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = 'vasárnap hétfőn kedden szerdán csütörtökön pénteken szombaton'.split(
                    ' '
                );
                function a(e, t, a, n) {
                    var s = e;
                    switch (a) {
                        case 's':
                            return n || t
                                ? 'néhány másodperc'
                                : 'néhány másodperce';
                        case 'ss':
                            return s + (n || t) ? ' másodperc' : ' másodperce';
                        case 'm':
                            return 'egy' + (n || t ? ' perc' : ' perce');
                        case 'mm':
                            return s + (n || t ? ' perc' : ' perce');
                        case 'h':
                            return 'egy' + (n || t ? ' óra' : ' órája');
                        case 'hh':
                            return s + (n || t ? ' óra' : ' órája');
                        case 'd':
                            return 'egy' + (n || t ? ' nap' : ' napja');
                        case 'dd':
                            return s + (n || t ? ' nap' : ' napja');
                        case 'M':
                            return 'egy' + (n || t ? ' hónap' : ' hónapja');
                        case 'MM':
                            return s + (n || t ? ' hónap' : ' hónapja');
                        case 'y':
                            return 'egy' + (n || t ? ' év' : ' éve');
                        case 'yy':
                            return s + (n || t ? ' év' : ' éve');
                    }
                    return '';
                }
                function n(e) {
                    return (
                        (e ? '' : '[múlt] ') +
                        '[' +
                        t[this.day()] +
                        '] LT[-kor]'
                    );
                }
                e.defineLocale('hu', {
                    months: 'január_február_március_április_május_június_július_augusztus_szeptember_október_november_december'.split(
                        '_'
                    ),
                    monthsShort: 'jan._feb._márc._ápr._máj._jún._júl._aug._szept._okt._nov._dec.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'vasárnap_hétfő_kedd_szerda_csütörtök_péntek_szombat'.split(
                        '_'
                    ),
                    weekdaysShort: 'vas_hét_kedd_sze_csüt_pén_szo'.split('_'),
                    weekdaysMin: 'v_h_k_sze_cs_p_szo'.split('_'),
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'YYYY.MM.DD.',
                        LL: 'YYYY. MMMM D.',
                        LLL: 'YYYY. MMMM D. H:mm',
                        LLLL: 'YYYY. MMMM D., dddd H:mm',
                    },
                    meridiemParse: /de|du/i,
                    isPM: function(e) {
                        return 'u' === e.charAt(1).toLowerCase();
                    },
                    meridiem: function(e, t, a) {
                        return e < 12
                            ? !0 === a
                                ? 'de'
                                : 'DE'
                            : !0 === a
                            ? 'du'
                            : 'DU';
                    },
                    calendar: {
                        sameDay: '[ma] LT[-kor]',
                        nextDay: '[holnap] LT[-kor]',
                        nextWeek: function() {
                            return n.call(this, !0);
                        },
                        lastDay: '[tegnap] LT[-kor]',
                        lastWeek: function() {
                            return n.call(this, !1);
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s múlva',
                        past: '%s',
                        s: a,
                        ss: a,
                        m: a,
                        mm: a,
                        h: a,
                        hh: a,
                        d: a,
                        dd: a,
                        M: a,
                        MM: a,
                        y: a,
                        yy: a,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        3417: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('hy-am', {
                    months: {
                        format: 'հունվարի_փետրվարի_մարտի_ապրիլի_մայիսի_հունիսի_հուլիսի_օգոստոսի_սեպտեմբերի_հոկտեմբերի_նոյեմբերի_դեկտեմբերի'.split(
                            '_'
                        ),
                        standalone: 'հունվար_փետրվար_մարտ_ապրիլ_մայիս_հունիս_հուլիս_օգոստոս_սեպտեմբեր_հոկտեմբեր_նոյեմբեր_դեկտեմբեր'.split(
                            '_'
                        ),
                    },
                    monthsShort: 'հնվ_փտր_մրտ_ապր_մյս_հնս_հլս_օգս_սպտ_հկտ_նմբ_դկտ'.split(
                        '_'
                    ),
                    weekdays: 'կիրակի_երկուշաբթի_երեքշաբթի_չորեքշաբթի_հինգշաբթի_ուրբաթ_շաբաթ'.split(
                        '_'
                    ),
                    weekdaysShort: 'կրկ_երկ_երք_չրք_հնգ_ուրբ_շբթ'.split('_'),
                    weekdaysMin: 'կրկ_երկ_երք_չրք_հնգ_ուրբ_շբթ'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY թ.',
                        LLL: 'D MMMM YYYY թ., HH:mm',
                        LLLL: 'dddd, D MMMM YYYY թ., HH:mm',
                    },
                    calendar: {
                        sameDay: '[այսօր] LT',
                        nextDay: '[վաղը] LT',
                        lastDay: '[երեկ] LT',
                        nextWeek: function() {
                            return 'dddd [օրը ժամը] LT';
                        },
                        lastWeek: function() {
                            return '[անցած] dddd [օրը ժամը] LT';
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s հետո',
                        past: '%s առաջ',
                        s: 'մի քանի վայրկյան',
                        ss: '%d վայրկյան',
                        m: 'րոպե',
                        mm: '%d րոպե',
                        h: 'ժամ',
                        hh: '%d ժամ',
                        d: 'օր',
                        dd: '%d օր',
                        M: 'ամիս',
                        MM: '%d ամիս',
                        y: 'տարի',
                        yy: '%d տարի',
                    },
                    meridiemParse: /գիշերվա|առավոտվա|ցերեկվա|երեկոյան/,
                    isPM: function(e) {
                        return /^(ցերեկվա|երեկոյան)$/.test(e);
                    },
                    meridiem: function(e) {
                        return e < 4
                            ? 'գիշերվա'
                            : e < 12
                            ? 'առավոտվա'
                            : e < 17
                            ? 'ցերեկվա'
                            : 'երեկոյան';
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}|\d{1,2}-(ին|րդ)/,
                    ordinal: function(e, t) {
                        switch (t) {
                            case 'DDD':
                            case 'w':
                            case 'W':
                            case 'DDDo':
                                return 1 === e ? e + '-ին' : e + '-րդ';
                            default:
                                return e;
                        }
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        18890: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('id', {
                    months: 'Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Agt_Sep_Okt_Nov_Des'.split(
                        '_'
                    ),
                    weekdays: 'Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu'.split(
                        '_'
                    ),
                    weekdaysShort: 'Min_Sen_Sel_Rab_Kam_Jum_Sab'.split('_'),
                    weekdaysMin: 'Mg_Sn_Sl_Rb_Km_Jm_Sb'.split('_'),
                    longDateFormat: {
                        LT: 'HH.mm',
                        LTS: 'HH.mm.ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY [pukul] HH.mm',
                        LLLL: 'dddd, D MMMM YYYY [pukul] HH.mm',
                    },
                    meridiemParse: /pagi|siang|sore|malam/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'pagi' === t
                                ? e
                                : 'siang' === t
                                ? e >= 11
                                    ? e
                                    : e + 12
                                : 'sore' === t || 'malam' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 11
                            ? 'pagi'
                            : e < 15
                            ? 'siang'
                            : e < 19
                            ? 'sore'
                            : 'malam';
                    },
                    calendar: {
                        sameDay: '[Hari ini pukul] LT',
                        nextDay: '[Besok pukul] LT',
                        nextWeek: 'dddd [pukul] LT',
                        lastDay: '[Kemarin pukul] LT',
                        lastWeek: 'dddd [lalu pukul] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'dalam %s',
                        past: '%s yang lalu',
                        s: 'beberapa detik',
                        ss: '%d detik',
                        m: 'semenit',
                        mm: '%d menit',
                        h: 'sejam',
                        hh: '%d jam',
                        d: 'sehari',
                        dd: '%d hari',
                        M: 'sebulan',
                        MM: '%d bulan',
                        y: 'setahun',
                        yy: '%d tahun',
                    },
                    week: { dow: 0, doy: 6 },
                });
            })(a(37485));
        },
        14468: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e) {
                    return e % 100 == 11 || e % 10 != 1;
                }
                function a(e, a, n, s) {
                    var r = e + ' ';
                    switch (n) {
                        case 's':
                            return a || s
                                ? 'nokkrar sekúndur'
                                : 'nokkrum sekúndum';
                        case 'ss':
                            return t(e)
                                ? r + (a || s ? 'sekúndur' : 'sekúndum')
                                : r + 'sekúnda';
                        case 'm':
                            return a ? 'mínúta' : 'mínútu';
                        case 'mm':
                            return t(e)
                                ? r + (a || s ? 'mínútur' : 'mínútum')
                                : a
                                ? r + 'mínúta'
                                : r + 'mínútu';
                        case 'hh':
                            return t(e)
                                ? r +
                                      (a || s
                                          ? 'klukkustundir'
                                          : 'klukkustundum')
                                : r + 'klukkustund';
                        case 'd':
                            return a ? 'dagur' : s ? 'dag' : 'degi';
                        case 'dd':
                            return t(e)
                                ? a
                                    ? r + 'dagar'
                                    : r + (s ? 'daga' : 'dögum')
                                : a
                                ? r + 'dagur'
                                : r + (s ? 'dag' : 'degi');
                        case 'M':
                            return a ? 'mánuður' : s ? 'mánuð' : 'mánuði';
                        case 'MM':
                            return t(e)
                                ? a
                                    ? r + 'mánuðir'
                                    : r + (s ? 'mánuði' : 'mánuðum')
                                : a
                                ? r + 'mánuður'
                                : r + (s ? 'mánuð' : 'mánuði');
                        case 'y':
                            return a || s ? 'ár' : 'ári';
                        case 'yy':
                            return t(e)
                                ? r + (a || s ? 'ár' : 'árum')
                                : r + (a || s ? 'ár' : 'ári');
                    }
                }
                e.defineLocale('is', {
                    months: 'janúar_febrúar_mars_apríl_maí_júní_júlí_ágúst_september_október_nóvember_desember'.split(
                        '_'
                    ),
                    monthsShort: 'jan_feb_mar_apr_maí_jún_júl_ágú_sep_okt_nóv_des'.split(
                        '_'
                    ),
                    weekdays: 'sunnudagur_mánudagur_þriðjudagur_miðvikudagur_fimmtudagur_föstudagur_laugardagur'.split(
                        '_'
                    ),
                    weekdaysShort: 'sun_mán_þri_mið_fim_fös_lau'.split('_'),
                    weekdaysMin: 'Su_Má_Þr_Mi_Fi_Fö_La'.split('_'),
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D. MMMM YYYY',
                        LLL: 'D. MMMM YYYY [kl.] H:mm',
                        LLLL: 'dddd, D. MMMM YYYY [kl.] H:mm',
                    },
                    calendar: {
                        sameDay: '[í dag kl.] LT',
                        nextDay: '[á morgun kl.] LT',
                        nextWeek: 'dddd [kl.] LT',
                        lastDay: '[í gær kl.] LT',
                        lastWeek: '[síðasta] dddd [kl.] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'eftir %s',
                        past: 'fyrir %s síðan',
                        s: a,
                        ss: a,
                        m: a,
                        mm: a,
                        h: 'klukkustund',
                        hh: a,
                        d: a,
                        dd: a,
                        M: a,
                        MM: a,
                        y: a,
                        yy: a,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        80981: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('it-ch', {
                    months: 'gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre'.split(
                        '_'
                    ),
                    monthsShort: 'gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic'.split(
                        '_'
                    ),
                    weekdays: 'domenica_lunedì_martedì_mercoledì_giovedì_venerdì_sabato'.split(
                        '_'
                    ),
                    weekdaysShort: 'dom_lun_mar_mer_gio_ven_sab'.split('_'),
                    weekdaysMin: 'do_lu_ma_me_gi_ve_sa'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Oggi alle] LT',
                        nextDay: '[Domani alle] LT',
                        nextWeek: 'dddd [alle] LT',
                        lastDay: '[Ieri alle] LT',
                        lastWeek: function() {
                            return 0 === this.day()
                                ? '[la scorsa] dddd [alle] LT'
                                : '[lo scorso] dddd [alle] LT';
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: function(e) {
                            return (
                                (/^[0-9].+$/.test(e) ? 'tra' : 'in') + ' ' + e
                            );
                        },
                        past: '%s fa',
                        s: 'alcuni secondi',
                        ss: '%d secondi',
                        m: 'un minuto',
                        mm: '%d minuti',
                        h: "un'ora",
                        hh: '%d ore',
                        d: 'un giorno',
                        dd: '%d giorni',
                        M: 'un mese',
                        MM: '%d mesi',
                        y: 'un anno',
                        yy: '%d anni',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}º/,
                    ordinal: '%dº',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        45652: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('it', {
                    months: 'gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre'.split(
                        '_'
                    ),
                    monthsShort: 'gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic'.split(
                        '_'
                    ),
                    weekdays: 'domenica_lunedì_martedì_mercoledì_giovedì_venerdì_sabato'.split(
                        '_'
                    ),
                    weekdaysShort: 'dom_lun_mar_mer_gio_ven_sab'.split('_'),
                    weekdaysMin: 'do_lu_ma_me_gi_ve_sa'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: function() {
                            return (
                                '[Oggi a' +
                                (this.hours() > 1
                                    ? 'lle '
                                    : 0 === this.hours()
                                    ? ' '
                                    : "ll'") +
                                ']LT'
                            );
                        },
                        nextDay: function() {
                            return (
                                '[Domani a' +
                                (this.hours() > 1
                                    ? 'lle '
                                    : 0 === this.hours()
                                    ? ' '
                                    : "ll'") +
                                ']LT'
                            );
                        },
                        nextWeek: function() {
                            return (
                                'dddd [a' +
                                (this.hours() > 1
                                    ? 'lle '
                                    : 0 === this.hours()
                                    ? ' '
                                    : "ll'") +
                                ']LT'
                            );
                        },
                        lastDay: function() {
                            return (
                                '[Ieri a' +
                                (this.hours() > 1
                                    ? 'lle '
                                    : 0 === this.hours()
                                    ? ' '
                                    : "ll'") +
                                ']LT'
                            );
                        },
                        lastWeek: function() {
                            return 0 === this.day()
                                ? '[La scorsa] dddd [a' +
                                      (this.hours() > 1
                                          ? 'lle '
                                          : 0 === this.hours()
                                          ? ' '
                                          : "ll'") +
                                      ']LT'
                                : '[Lo scorso] dddd [a' +
                                      (this.hours() > 1
                                          ? 'lle '
                                          : 0 === this.hours()
                                          ? ' '
                                          : "ll'") +
                                      ']LT';
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'tra %s',
                        past: '%s fa',
                        s: 'alcuni secondi',
                        ss: '%d secondi',
                        m: 'un minuto',
                        mm: '%d minuti',
                        h: "un'ora",
                        hh: '%d ore',
                        d: 'un giorno',
                        dd: '%d giorni',
                        w: 'una settimana',
                        ww: '%d settimane',
                        M: 'un mese',
                        MM: '%d mesi',
                        y: 'un anno',
                        yy: '%d anni',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}º/,
                    ordinal: '%dº',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        44511: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('ja', {
                    eras: [
                        {
                            since: '2019-05-01',
                            offset: 1,
                            name: '令和',
                            narrow: '㋿',
                            abbr: 'R',
                        },
                        {
                            since: '1989-01-08',
                            until: '2019-04-30',
                            offset: 1,
                            name: '平成',
                            narrow: '㍻',
                            abbr: 'H',
                        },
                        {
                            since: '1926-12-25',
                            until: '1989-01-07',
                            offset: 1,
                            name: '昭和',
                            narrow: '㍼',
                            abbr: 'S',
                        },
                        {
                            since: '1912-07-30',
                            until: '1926-12-24',
                            offset: 1,
                            name: '大正',
                            narrow: '㍽',
                            abbr: 'T',
                        },
                        {
                            since: '1873-01-01',
                            until: '1912-07-29',
                            offset: 6,
                            name: '明治',
                            narrow: '㍾',
                            abbr: 'M',
                        },
                        {
                            since: '0001-01-01',
                            until: '1873-12-31',
                            offset: 1,
                            name: '西暦',
                            narrow: 'AD',
                            abbr: 'AD',
                        },
                        {
                            since: '0000-12-31',
                            until: -1 / 0,
                            offset: 1,
                            name: '紀元前',
                            narrow: 'BC',
                            abbr: 'BC',
                        },
                    ],
                    eraYearOrdinalRegex: /(元|\d+)年/,
                    eraYearOrdinalParse: function(e, t) {
                        return '元' === t[1] ? 1 : parseInt(t[1] || e, 10);
                    },
                    months: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split(
                        '_'
                    ),
                    monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split(
                        '_'
                    ),
                    weekdays: '日曜日_月曜日_火曜日_水曜日_木曜日_金曜日_土曜日'.split(
                        '_'
                    ),
                    weekdaysShort: '日_月_火_水_木_金_土'.split('_'),
                    weekdaysMin: '日_月_火_水_木_金_土'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'YYYY/MM/DD',
                        LL: 'YYYY年M月D日',
                        LLL: 'YYYY年M月D日 HH:mm',
                        LLLL: 'YYYY年M月D日 dddd HH:mm',
                        l: 'YYYY/MM/DD',
                        ll: 'YYYY年M月D日',
                        lll: 'YYYY年M月D日 HH:mm',
                        llll: 'YYYY年M月D日(ddd) HH:mm',
                    },
                    meridiemParse: /午前|午後/i,
                    isPM: function(e) {
                        return '午後' === e;
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? '午前' : '午後';
                    },
                    calendar: {
                        sameDay: '[今日] LT',
                        nextDay: '[明日] LT',
                        nextWeek: function(e) {
                            return e.week() !== this.week()
                                ? '[来週]dddd LT'
                                : 'dddd LT';
                        },
                        lastDay: '[昨日] LT',
                        lastWeek: function(e) {
                            return this.week() !== e.week()
                                ? '[先週]dddd LT'
                                : 'dddd LT';
                        },
                        sameElse: 'L',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}日/,
                    ordinal: function(e, t) {
                        switch (t) {
                            case 'y':
                                return 1 === e ? '元年' : e + '年';
                            case 'd':
                            case 'D':
                            case 'DDD':
                                return e + '日';
                            default:
                                return e;
                        }
                    },
                    relativeTime: {
                        future: '%s後',
                        past: '%s前',
                        s: '数秒',
                        ss: '%d秒',
                        m: '1分',
                        mm: '%d分',
                        h: '1時間',
                        hh: '%d時間',
                        d: '1日',
                        dd: '%d日',
                        M: '1ヶ月',
                        MM: '%dヶ月',
                        y: '1年',
                        yy: '%d年',
                    },
                });
            })(a(37485));
        },
        63069: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('jv', {
                    months: 'Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_Nopember_Desember'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nop_Des'.split(
                        '_'
                    ),
                    weekdays: 'Minggu_Senen_Seloso_Rebu_Kemis_Jemuwah_Septu'.split(
                        '_'
                    ),
                    weekdaysShort: 'Min_Sen_Sel_Reb_Kem_Jem_Sep'.split('_'),
                    weekdaysMin: 'Mg_Sn_Sl_Rb_Km_Jm_Sp'.split('_'),
                    longDateFormat: {
                        LT: 'HH.mm',
                        LTS: 'HH.mm.ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY [pukul] HH.mm',
                        LLLL: 'dddd, D MMMM YYYY [pukul] HH.mm',
                    },
                    meridiemParse: /enjing|siyang|sonten|ndalu/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'enjing' === t
                                ? e
                                : 'siyang' === t
                                ? e >= 11
                                    ? e
                                    : e + 12
                                : 'sonten' === t || 'ndalu' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 11
                            ? 'enjing'
                            : e < 15
                            ? 'siyang'
                            : e < 19
                            ? 'sonten'
                            : 'ndalu';
                    },
                    calendar: {
                        sameDay: '[Dinten puniko pukul] LT',
                        nextDay: '[Mbenjang pukul] LT',
                        nextWeek: 'dddd [pukul] LT',
                        lastDay: '[Kala wingi pukul] LT',
                        lastWeek: 'dddd [kepengker pukul] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'wonten ing %s',
                        past: '%s ingkang kepengker',
                        s: 'sawetawis detik',
                        ss: '%d detik',
                        m: 'setunggal menit',
                        mm: '%d menit',
                        h: 'setunggal jam',
                        hh: '%d jam',
                        d: 'sedinten',
                        dd: '%d dinten',
                        M: 'sewulan',
                        MM: '%d wulan',
                        y: 'setaun',
                        yy: '%d taun',
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        75258: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('ka', {
                    months: 'იანვარი_თებერვალი_მარტი_აპრილი_მაისი_ივნისი_ივლისი_აგვისტო_სექტემბერი_ოქტომბერი_ნოემბერი_დეკემბერი'.split(
                        '_'
                    ),
                    monthsShort: 'იან_თებ_მარ_აპრ_მაი_ივნ_ივლ_აგვ_სექ_ოქტ_ნოე_დეკ'.split(
                        '_'
                    ),
                    weekdays: {
                        standalone: 'კვირა_ორშაბათი_სამშაბათი_ოთხშაბათი_ხუთშაბათი_პარასკევი_შაბათი'.split(
                            '_'
                        ),
                        format: 'კვირას_ორშაბათს_სამშაბათს_ოთხშაბათს_ხუთშაბათს_პარასკევს_შაბათს'.split(
                            '_'
                        ),
                        isFormat: /(წინა|შემდეგ)/,
                    },
                    weekdaysShort: 'კვი_ორშ_სამ_ოთხ_ხუთ_პარ_შაბ'.split('_'),
                    weekdaysMin: 'კვ_ორ_სა_ოთ_ხუ_პა_შა'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[დღეს] LT[-ზე]',
                        nextDay: '[ხვალ] LT[-ზე]',
                        lastDay: '[გუშინ] LT[-ზე]',
                        nextWeek: '[შემდეგ] dddd LT[-ზე]',
                        lastWeek: '[წინა] dddd LT-ზე',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: function(e) {
                            return e.replace(
                                /(წამ|წუთ|საათ|წელ|დღ|თვ)(ი|ე)/,
                                function(e, t, a) {
                                    return 'ი' === a ? t + 'ში' : t + a + 'ში';
                                }
                            );
                        },
                        past: function(e) {
                            return /(წამი|წუთი|საათი|დღე|თვე)/.test(e)
                                ? e.replace(/(ი|ე)$/, 'ის წინ')
                                : /წელი/.test(e)
                                ? e.replace(/წელი$/, 'წლის წინ')
                                : e;
                        },
                        s: 'რამდენიმე წამი',
                        ss: '%d წამი',
                        m: 'წუთი',
                        mm: '%d წუთი',
                        h: 'საათი',
                        hh: '%d საათი',
                        d: 'დღე',
                        dd: '%d დღე',
                        M: 'თვე',
                        MM: '%d თვე',
                        y: 'წელი',
                        yy: '%d წელი',
                    },
                    dayOfMonthOrdinalParse: /0|1-ლი|მე-\d{1,2}|\d{1,2}-ე/,
                    ordinal: function(e) {
                        return 0 === e
                            ? e
                            : 1 === e
                            ? e + '-ლი'
                            : e < 20 ||
                              (e <= 100 && e % 20 == 0) ||
                              e % 100 == 0
                            ? 'მე-' + e
                            : e + '-ე';
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        77086: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                    0: '-ші',
                    1: '-ші',
                    2: '-ші',
                    3: '-ші',
                    4: '-ші',
                    5: '-ші',
                    6: '-шы',
                    7: '-ші',
                    8: '-ші',
                    9: '-шы',
                    10: '-шы',
                    20: '-шы',
                    30: '-шы',
                    40: '-шы',
                    50: '-ші',
                    60: '-шы',
                    70: '-ші',
                    80: '-ші',
                    90: '-шы',
                    100: '-ші',
                };
                e.defineLocale('kk', {
                    months: 'қаңтар_ақпан_наурыз_сәуір_мамыр_маусым_шілде_тамыз_қыркүйек_қазан_қараша_желтоқсан'.split(
                        '_'
                    ),
                    monthsShort: 'қаң_ақп_нау_сәу_мам_мау_шіл_там_қыр_қаз_қар_жел'.split(
                        '_'
                    ),
                    weekdays: 'жексенбі_дүйсенбі_сейсенбі_сәрсенбі_бейсенбі_жұма_сенбі'.split(
                        '_'
                    ),
                    weekdaysShort: 'жек_дүй_сей_сәр_бей_жұм_сен'.split('_'),
                    weekdaysMin: 'жк_дй_сй_ср_бй_жм_сн'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Бүгін сағат] LT',
                        nextDay: '[Ертең сағат] LT',
                        nextWeek: 'dddd [сағат] LT',
                        lastDay: '[Кеше сағат] LT',
                        lastWeek: '[Өткен аптаның] dddd [сағат] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s ішінде',
                        past: '%s бұрын',
                        s: 'бірнеше секунд',
                        ss: '%d секунд',
                        m: 'бір минут',
                        mm: '%d минут',
                        h: 'бір сағат',
                        hh: '%d сағат',
                        d: 'бір күн',
                        dd: '%d күн',
                        M: 'бір ай',
                        MM: '%d ай',
                        y: 'бір жыл',
                        yy: '%d жыл',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}-(ші|шы)/,
                    ordinal: function(e) {
                        return (
                            e + (t[e] || t[e % 10] || t[e >= 100 ? 100 : null])
                        );
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        84125: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '១',
                        2: '២',
                        3: '៣',
                        4: '៤',
                        5: '៥',
                        6: '៦',
                        7: '៧',
                        8: '៨',
                        9: '៩',
                        0: '០',
                    },
                    a = {
                        '១': '1',
                        '២': '2',
                        '៣': '3',
                        '៤': '4',
                        '៥': '5',
                        '៦': '6',
                        '៧': '7',
                        '៨': '8',
                        '៩': '9',
                        '០': '0',
                    };
                e.defineLocale('km', {
                    months: 'មករា_កុម្ភៈ_មីនា_មេសា_ឧសភា_មិថុនា_កក្កដា_សីហា_កញ្ញា_តុលា_វិច្ឆិកា_ធ្នូ'.split(
                        '_'
                    ),
                    monthsShort: 'មករា_កុម្ភៈ_មីនា_មេសា_ឧសភា_មិថុនា_កក្កដា_សីហា_កញ្ញា_តុលា_វិច្ឆិកា_ធ្នូ'.split(
                        '_'
                    ),
                    weekdays: 'អាទិត្យ_ច័ន្ទ_អង្គារ_ពុធ_ព្រហស្បតិ៍_សុក្រ_សៅរ៍'.split(
                        '_'
                    ),
                    weekdaysShort: 'អា_ច_អ_ព_ព្រ_សុ_ស'.split('_'),
                    weekdaysMin: 'អា_ច_អ_ព_ព្រ_សុ_ស'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    meridiemParse: /ព្រឹក|ល្ងាច/,
                    isPM: function(e) {
                        return 'ល្ងាច' === e;
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? 'ព្រឹក' : 'ល្ងាច';
                    },
                    calendar: {
                        sameDay: '[ថ្ងៃនេះ ម៉ោង] LT',
                        nextDay: '[ស្អែក ម៉ោង] LT',
                        nextWeek: 'dddd [ម៉ោង] LT',
                        lastDay: '[ម្សិលមិញ ម៉ោង] LT',
                        lastWeek: 'dddd [សប្តាហ៍មុន] [ម៉ោង] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%sទៀត',
                        past: '%sមុន',
                        s: 'ប៉ុន្មានវិនាទី',
                        ss: '%d វិនាទី',
                        m: 'មួយនាទី',
                        mm: '%d នាទី',
                        h: 'មួយម៉ោង',
                        hh: '%d ម៉ោង',
                        d: 'មួយថ្ងៃ',
                        dd: '%d ថ្ងៃ',
                        M: 'មួយខែ',
                        MM: '%d ខែ',
                        y: 'មួយឆ្នាំ',
                        yy: '%d ឆ្នាំ',
                    },
                    dayOfMonthOrdinalParse: /ទី\d{1,2}/,
                    ordinal: 'ទី%d',
                    preparse: function(e) {
                        return e.replace(/[១២៣៤៥៦៧៨៩០]/g, function(e) {
                            return a[e];
                        });
                    },
                    postformat: function(e) {
                        return e.replace(/\d/g, function(e) {
                            return t[e];
                        });
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        37197: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '೧',
                        2: '೨',
                        3: '೩',
                        4: '೪',
                        5: '೫',
                        6: '೬',
                        7: '೭',
                        8: '೮',
                        9: '೯',
                        0: '೦',
                    },
                    a = {
                        '೧': '1',
                        '೨': '2',
                        '೩': '3',
                        '೪': '4',
                        '೫': '5',
                        '೬': '6',
                        '೭': '7',
                        '೮': '8',
                        '೯': '9',
                        '೦': '0',
                    };
                e.defineLocale('kn', {
                    months: 'ಜನವರಿ_ಫೆಬ್ರವರಿ_ಮಾರ್ಚ್_ಏಪ್ರಿಲ್_ಮೇ_ಜೂನ್_ಜುಲೈ_ಆಗಸ್ಟ್_ಸೆಪ್ಟೆಂಬರ್_ಅಕ್ಟೋಬರ್_ನವೆಂಬರ್_ಡಿಸೆಂಬರ್'.split(
                        '_'
                    ),
                    monthsShort: 'ಜನ_ಫೆಬ್ರ_ಮಾರ್ಚ್_ಏಪ್ರಿಲ್_ಮೇ_ಜೂನ್_ಜುಲೈ_ಆಗಸ್ಟ್_ಸೆಪ್ಟೆಂ_ಅಕ್ಟೋ_ನವೆಂ_ಡಿಸೆಂ'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'ಭಾನುವಾರ_ಸೋಮವಾರ_ಮಂಗಳವಾರ_ಬುಧವಾರ_ಗುರುವಾರ_ಶುಕ್ರವಾರ_ಶನಿವಾರ'.split(
                        '_'
                    ),
                    weekdaysShort: 'ಭಾನು_ಸೋಮ_ಮಂಗಳ_ಬುಧ_ಗುರು_ಶುಕ್ರ_ಶನಿ'.split(
                        '_'
                    ),
                    weekdaysMin: 'ಭಾ_ಸೋ_ಮಂ_ಬು_ಗು_ಶು_ಶ'.split('_'),
                    longDateFormat: {
                        LT: 'A h:mm',
                        LTS: 'A h:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY, A h:mm',
                        LLLL: 'dddd, D MMMM YYYY, A h:mm',
                    },
                    calendar: {
                        sameDay: '[ಇಂದು] LT',
                        nextDay: '[ನಾಳೆ] LT',
                        nextWeek: 'dddd, LT',
                        lastDay: '[ನಿನ್ನೆ] LT',
                        lastWeek: '[ಕೊನೆಯ] dddd, LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s ನಂತರ',
                        past: '%s ಹಿಂದೆ',
                        s: 'ಕೆಲವು ಕ್ಷಣಗಳು',
                        ss: '%d ಸೆಕೆಂಡುಗಳು',
                        m: 'ಒಂದು ನಿಮಿಷ',
                        mm: '%d ನಿಮಿಷ',
                        h: 'ಒಂದು ಗಂಟೆ',
                        hh: '%d ಗಂಟೆ',
                        d: 'ಒಂದು ದಿನ',
                        dd: '%d ದಿನ',
                        M: 'ಒಂದು ತಿಂಗಳು',
                        MM: '%d ತಿಂಗಳು',
                        y: 'ಒಂದು ವರ್ಷ',
                        yy: '%d ವರ್ಷ',
                    },
                    preparse: function(e) {
                        return e.replace(/[೧೨೩೪೫೬೭೮೯೦]/g, function(e) {
                            return a[e];
                        });
                    },
                    postformat: function(e) {
                        return e.replace(/\d/g, function(e) {
                            return t[e];
                        });
                    },
                    meridiemParse: /ರಾತ್ರಿ|ಬೆಳಿಗ್ಗೆ|ಮಧ್ಯಾಹ್ನ|ಸಂಜೆ/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'ರಾತ್ರಿ' === t
                                ? e < 4
                                    ? e
                                    : e + 12
                                : 'ಬೆಳಿಗ್ಗೆ' === t
                                ? e
                                : 'ಮಧ್ಯಾಹ್ನ' === t
                                ? e >= 10
                                    ? e
                                    : e + 12
                                : 'ಸಂಜೆ' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'ರಾತ್ರಿ'
                            : e < 10
                            ? 'ಬೆಳಿಗ್ಗೆ'
                            : e < 17
                            ? 'ಮಧ್ಯಾಹ್ನ'
                            : e < 20
                            ? 'ಸಂಜೆ'
                            : 'ರಾತ್ರಿ';
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(ನೇ)/,
                    ordinal: function(e) {
                        return e + 'ನೇ';
                    },
                    week: { dow: 0, doy: 6 },
                });
            })(a(37485));
        },
        65508: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('ko', {
                    months: '1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월'.split(
                        '_'
                    ),
                    monthsShort: '1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월'.split(
                        '_'
                    ),
                    weekdays: '일요일_월요일_화요일_수요일_목요일_금요일_토요일'.split(
                        '_'
                    ),
                    weekdaysShort: '일_월_화_수_목_금_토'.split('_'),
                    weekdaysMin: '일_월_화_수_목_금_토'.split('_'),
                    longDateFormat: {
                        LT: 'A h:mm',
                        LTS: 'A h:mm:ss',
                        L: 'YYYY.MM.DD.',
                        LL: 'YYYY년 MMMM D일',
                        LLL: 'YYYY년 MMMM D일 A h:mm',
                        LLLL: 'YYYY년 MMMM D일 dddd A h:mm',
                        l: 'YYYY.MM.DD.',
                        ll: 'YYYY년 MMMM D일',
                        lll: 'YYYY년 MMMM D일 A h:mm',
                        llll: 'YYYY년 MMMM D일 dddd A h:mm',
                    },
                    calendar: {
                        sameDay: '오늘 LT',
                        nextDay: '내일 LT',
                        nextWeek: 'dddd LT',
                        lastDay: '어제 LT',
                        lastWeek: '지난주 dddd LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s 후',
                        past: '%s 전',
                        s: '몇 초',
                        ss: '%d초',
                        m: '1분',
                        mm: '%d분',
                        h: '한 시간',
                        hh: '%d시간',
                        d: '하루',
                        dd: '%d일',
                        M: '한 달',
                        MM: '%d달',
                        y: '일 년',
                        yy: '%d년',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(일|월|주)/,
                    ordinal: function(e, t) {
                        switch (t) {
                            case 'd':
                            case 'D':
                            case 'DDD':
                                return e + '일';
                            case 'M':
                                return e + '월';
                            case 'w':
                            case 'W':
                                return e + '주';
                            default:
                                return e;
                        }
                    },
                    meridiemParse: /오전|오후/,
                    isPM: function(e) {
                        return '오후' === e;
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? '오전' : '오후';
                    },
                });
            })(a(37485));
        },
        18195: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '١',
                        2: '٢',
                        3: '٣',
                        4: '٤',
                        5: '٥',
                        6: '٦',
                        7: '٧',
                        8: '٨',
                        9: '٩',
                        0: '٠',
                    },
                    a = {
                        '١': '1',
                        '٢': '2',
                        '٣': '3',
                        '٤': '4',
                        '٥': '5',
                        '٦': '6',
                        '٧': '7',
                        '٨': '8',
                        '٩': '9',
                        '٠': '0',
                    },
                    n = [
                        'کانونی دووەم',
                        'شوبات',
                        'ئازار',
                        'نیسان',
                        'ئایار',
                        'حوزەیران',
                        'تەمموز',
                        'ئاب',
                        'ئەیلوول',
                        'تشرینی یەكەم',
                        'تشرینی دووەم',
                        'كانونی یەکەم',
                    ];
                e.defineLocale('ku', {
                    months: n,
                    monthsShort: n,
                    weekdays: 'یه‌كشه‌ممه‌_دووشه‌ممه‌_سێشه‌ممه‌_چوارشه‌ممه‌_پێنجشه‌ممه‌_هه‌ینی_شه‌ممه‌'.split(
                        '_'
                    ),
                    weekdaysShort: 'یه‌كشه‌م_دووشه‌م_سێشه‌م_چوارشه‌م_پێنجشه‌م_هه‌ینی_شه‌ممه‌'.split(
                        '_'
                    ),
                    weekdaysMin: 'ی_د_س_چ_پ_ه_ش'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    meridiemParse: /ئێواره‌|به‌یانی/,
                    isPM: function(e) {
                        return /ئێواره‌/.test(e);
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? 'به‌یانی' : 'ئێواره‌';
                    },
                    calendar: {
                        sameDay: '[ئه‌مرۆ كاتژمێر] LT',
                        nextDay: '[به‌یانی كاتژمێر] LT',
                        nextWeek: 'dddd [كاتژمێر] LT',
                        lastDay: '[دوێنێ كاتژمێر] LT',
                        lastWeek: 'dddd [كاتژمێر] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'له‌ %s',
                        past: '%s',
                        s: 'چه‌ند چركه‌یه‌ك',
                        ss: 'چركه‌ %d',
                        m: 'یه‌ك خوله‌ك',
                        mm: '%d خوله‌ك',
                        h: 'یه‌ك كاتژمێر',
                        hh: '%d كاتژمێر',
                        d: 'یه‌ك ڕۆژ',
                        dd: '%d ڕۆژ',
                        M: 'یه‌ك مانگ',
                        MM: '%d مانگ',
                        y: 'یه‌ك ساڵ',
                        yy: '%d ساڵ',
                    },
                    preparse: function(e) {
                        return e
                            .replace(/[١٢٣٤٥٦٧٨٩٠]/g, function(e) {
                                return a[e];
                            })
                            .replace(/،/g, ',');
                    },
                    postformat: function(e) {
                        return e
                            .replace(/\d/g, function(e) {
                                return t[e];
                            })
                            .replace(/,/g, '،');
                    },
                    week: { dow: 6, doy: 12 },
                });
            })(a(37485));
        },
        83971: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                    0: '-чү',
                    1: '-чи',
                    2: '-чи',
                    3: '-чү',
                    4: '-чү',
                    5: '-чи',
                    6: '-чы',
                    7: '-чи',
                    8: '-чи',
                    9: '-чу',
                    10: '-чу',
                    20: '-чы',
                    30: '-чу',
                    40: '-чы',
                    50: '-чү',
                    60: '-чы',
                    70: '-чи',
                    80: '-чи',
                    90: '-чу',
                    100: '-чү',
                };
                e.defineLocale('ky', {
                    months: 'январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь'.split(
                        '_'
                    ),
                    monthsShort: 'янв_фев_март_апр_май_июнь_июль_авг_сен_окт_ноя_дек'.split(
                        '_'
                    ),
                    weekdays: 'Жекшемби_Дүйшөмбү_Шейшемби_Шаршемби_Бейшемби_Жума_Ишемби'.split(
                        '_'
                    ),
                    weekdaysShort: 'Жек_Дүй_Шей_Шар_Бей_Жум_Ише'.split('_'),
                    weekdaysMin: 'Жк_Дй_Шй_Шр_Бй_Жм_Иш'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Бүгүн саат] LT',
                        nextDay: '[Эртең саат] LT',
                        nextWeek: 'dddd [саат] LT',
                        lastDay: '[Кечээ саат] LT',
                        lastWeek: '[Өткөн аптанын] dddd [күнү] [саат] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s ичинде',
                        past: '%s мурун',
                        s: 'бирнече секунд',
                        ss: '%d секунд',
                        m: 'бир мүнөт',
                        mm: '%d мүнөт',
                        h: 'бир саат',
                        hh: '%d саат',
                        d: 'бир күн',
                        dd: '%d күн',
                        M: 'бир ай',
                        MM: '%d ай',
                        y: 'бир жыл',
                        yy: '%d жыл',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}-(чи|чы|чү|чу)/,
                    ordinal: function(e) {
                        return (
                            e + (t[e] || t[e % 10] || t[e >= 100 ? 100 : null])
                        );
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        79651: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a, n) {
                    var s = {
                        m: ['eng Minutt', 'enger Minutt'],
                        h: ['eng Stonn', 'enger Stonn'],
                        d: ['een Dag', 'engem Dag'],
                        M: ['ee Mount', 'engem Mount'],
                        y: ['ee Joer', 'engem Joer'],
                    };
                    return t ? s[a][0] : s[a][1];
                }
                function a(e) {
                    if (((e = parseInt(e, 10)), isNaN(e))) return !1;
                    if (e < 0) return !0;
                    if (e < 10) return 4 <= e && e <= 7;
                    if (e < 100) {
                        var t = e % 10;
                        return a(0 === t ? e / 10 : t);
                    }
                    if (e < 1e4) {
                        for (; e >= 10; ) e /= 10;
                        return a(e);
                    }
                    return a((e /= 1e3));
                }
                e.defineLocale('lb', {
                    months: 'Januar_Februar_Mäerz_Abrëll_Mee_Juni_Juli_August_September_Oktober_November_Dezember'.split(
                        '_'
                    ),
                    monthsShort: 'Jan._Febr._Mrz._Abr._Mee_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'Sonndeg_Méindeg_Dënschdeg_Mëttwoch_Donneschdeg_Freideg_Samschdeg'.split(
                        '_'
                    ),
                    weekdaysShort: 'So._Mé._Dë._Më._Do._Fr._Sa.'.split('_'),
                    weekdaysMin: 'So_Mé_Dë_Më_Do_Fr_Sa'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'H:mm [Auer]',
                        LTS: 'H:mm:ss [Auer]',
                        L: 'DD.MM.YYYY',
                        LL: 'D. MMMM YYYY',
                        LLL: 'D. MMMM YYYY H:mm [Auer]',
                        LLLL: 'dddd, D. MMMM YYYY H:mm [Auer]',
                    },
                    calendar: {
                        sameDay: '[Haut um] LT',
                        sameElse: 'L',
                        nextDay: '[Muer um] LT',
                        nextWeek: 'dddd [um] LT',
                        lastDay: '[Gëschter um] LT',
                        lastWeek: function() {
                            switch (this.day()) {
                                case 2:
                                case 4:
                                    return '[Leschten] dddd [um] LT';
                                default:
                                    return '[Leschte] dddd [um] LT';
                            }
                        },
                    },
                    relativeTime: {
                        future: function(e) {
                            return a(e.substr(0, e.indexOf(' ')))
                                ? 'a ' + e
                                : 'an ' + e;
                        },
                        past: function(e) {
                            return a(e.substr(0, e.indexOf(' ')))
                                ? 'viru ' + e
                                : 'virun ' + e;
                        },
                        s: 'e puer Sekonnen',
                        ss: '%d Sekonnen',
                        m: t,
                        mm: '%d Minutten',
                        h: t,
                        hh: '%d Stonnen',
                        d: t,
                        dd: '%d Deeg',
                        M: t,
                        MM: '%d Méint',
                        y: t,
                        yy: '%d Joer',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        58072: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('lo', {
                    months: 'ມັງກອນ_ກຸມພາ_ມີນາ_ເມສາ_ພຶດສະພາ_ມິຖຸນາ_ກໍລະກົດ_ສິງຫາ_ກັນຍາ_ຕຸລາ_ພະຈິກ_ທັນວາ'.split(
                        '_'
                    ),
                    monthsShort: 'ມັງກອນ_ກຸມພາ_ມີນາ_ເມສາ_ພຶດສະພາ_ມິຖຸນາ_ກໍລະກົດ_ສິງຫາ_ກັນຍາ_ຕຸລາ_ພະຈິກ_ທັນວາ'.split(
                        '_'
                    ),
                    weekdays: 'ອາທິດ_ຈັນ_ອັງຄານ_ພຸດ_ພະຫັດ_ສຸກ_ເສົາ'.split('_'),
                    weekdaysShort: 'ທິດ_ຈັນ_ອັງຄານ_ພຸດ_ພະຫັດ_ສຸກ_ເສົາ'.split(
                        '_'
                    ),
                    weekdaysMin: 'ທ_ຈ_ອຄ_ພ_ພຫ_ສກ_ສ'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'ວັນdddd D MMMM YYYY HH:mm',
                    },
                    meridiemParse: /ຕອນເຊົ້າ|ຕອນແລງ/,
                    isPM: function(e) {
                        return 'ຕອນແລງ' === e;
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? 'ຕອນເຊົ້າ' : 'ຕອນແລງ';
                    },
                    calendar: {
                        sameDay: '[ມື້ນີ້ເວລາ] LT',
                        nextDay: '[ມື້ອື່ນເວລາ] LT',
                        nextWeek: '[ວັນ]dddd[ໜ້າເວລາ] LT',
                        lastDay: '[ມື້ວານນີ້ເວລາ] LT',
                        lastWeek: '[ວັນ]dddd[ແລ້ວນີ້ເວລາ] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'ອີກ %s',
                        past: '%sຜ່ານມາ',
                        s: 'ບໍ່ເທົ່າໃດວິນາທີ',
                        ss: '%d ວິນາທີ',
                        m: '1 ນາທີ',
                        mm: '%d ນາທີ',
                        h: '1 ຊົ່ວໂມງ',
                        hh: '%d ຊົ່ວໂມງ',
                        d: '1 ມື້',
                        dd: '%d ມື້',
                        M: '1 ເດືອນ',
                        MM: '%d ເດືອນ',
                        y: '1 ປີ',
                        yy: '%d ປີ',
                    },
                    dayOfMonthOrdinalParse: /(ທີ່)\d{1,2}/,
                    ordinal: function(e) {
                        return 'ທີ່' + e;
                    },
                });
            })(a(37485));
        },
        62146: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                    ss: 'sekundė_sekundžių_sekundes',
                    m: 'minutė_minutės_minutę',
                    mm: 'minutės_minučių_minutes',
                    h: 'valanda_valandos_valandą',
                    hh: 'valandos_valandų_valandas',
                    d: 'diena_dienos_dieną',
                    dd: 'dienos_dienų_dienas',
                    M: 'mėnuo_mėnesio_mėnesį',
                    MM: 'mėnesiai_mėnesių_mėnesius',
                    y: 'metai_metų_metus',
                    yy: 'metai_metų_metus',
                };
                function a(e, t, a, n) {
                    return t ? s(a)[0] : n ? s(a)[1] : s(a)[2];
                }
                function n(e) {
                    return e % 10 == 0 || (e > 10 && e < 20);
                }
                function s(e) {
                    return t[e].split('_');
                }
                function r(e, t, r, i) {
                    var d = e + ' ';
                    return 1 === e
                        ? d + a(0, t, r[0], i)
                        : t
                        ? d + (n(e) ? s(r)[1] : s(r)[0])
                        : i
                        ? d + s(r)[1]
                        : d + (n(e) ? s(r)[1] : s(r)[2]);
                }
                e.defineLocale('lt', {
                    months: {
                        format: 'sausio_vasario_kovo_balandžio_gegužės_birželio_liepos_rugpjūčio_rugsėjo_spalio_lapkričio_gruodžio'.split(
                            '_'
                        ),
                        standalone: 'sausis_vasaris_kovas_balandis_gegužė_birželis_liepa_rugpjūtis_rugsėjis_spalis_lapkritis_gruodis'.split(
                            '_'
                        ),
                        isFormat: /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?|MMMM?(\[[^\[\]]*\]|\s)+D[oD]?/,
                    },
                    monthsShort: 'sau_vas_kov_bal_geg_bir_lie_rgp_rgs_spa_lap_grd'.split(
                        '_'
                    ),
                    weekdays: {
                        format: 'sekmadienį_pirmadienį_antradienį_trečiadienį_ketvirtadienį_penktadienį_šeštadienį'.split(
                            '_'
                        ),
                        standalone: 'sekmadienis_pirmadienis_antradienis_trečiadienis_ketvirtadienis_penktadienis_šeštadienis'.split(
                            '_'
                        ),
                        isFormat: /dddd HH:mm/,
                    },
                    weekdaysShort: 'Sek_Pir_Ant_Tre_Ket_Pen_Šeš'.split('_'),
                    weekdaysMin: 'S_P_A_T_K_Pn_Š'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'YYYY-MM-DD',
                        LL: 'YYYY [m.] MMMM D [d.]',
                        LLL: 'YYYY [m.] MMMM D [d.], HH:mm [val.]',
                        LLLL: 'YYYY [m.] MMMM D [d.], dddd, HH:mm [val.]',
                        l: 'YYYY-MM-DD',
                        ll: 'YYYY [m.] MMMM D [d.]',
                        lll: 'YYYY [m.] MMMM D [d.], HH:mm [val.]',
                        llll: 'YYYY [m.] MMMM D [d.], ddd, HH:mm [val.]',
                    },
                    calendar: {
                        sameDay: '[Šiandien] LT',
                        nextDay: '[Rytoj] LT',
                        nextWeek: 'dddd LT',
                        lastDay: '[Vakar] LT',
                        lastWeek: '[Praėjusį] dddd LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'po %s',
                        past: 'prieš %s',
                        s: function(e, t, a, n) {
                            return t
                                ? 'kelios sekundės'
                                : n
                                ? 'kelių sekundžių'
                                : 'kelias sekundes';
                        },
                        ss: r,
                        m: a,
                        mm: r,
                        h: a,
                        hh: r,
                        d: a,
                        dd: r,
                        M: a,
                        MM: r,
                        y: a,
                        yy: r,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}-oji/,
                    ordinal: function(e) {
                        return e + '-oji';
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        84824: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                    ss: 'sekundes_sekundēm_sekunde_sekundes'.split('_'),
                    m: 'minūtes_minūtēm_minūte_minūtes'.split('_'),
                    mm: 'minūtes_minūtēm_minūte_minūtes'.split('_'),
                    h: 'stundas_stundām_stunda_stundas'.split('_'),
                    hh: 'stundas_stundām_stunda_stundas'.split('_'),
                    d: 'dienas_dienām_diena_dienas'.split('_'),
                    dd: 'dienas_dienām_diena_dienas'.split('_'),
                    M: 'mēneša_mēnešiem_mēnesis_mēneši'.split('_'),
                    MM: 'mēneša_mēnešiem_mēnesis_mēneši'.split('_'),
                    y: 'gada_gadiem_gads_gadi'.split('_'),
                    yy: 'gada_gadiem_gads_gadi'.split('_'),
                };
                function a(e, t, a) {
                    return a
                        ? t % 10 == 1 && t % 100 != 11
                            ? e[2]
                            : e[3]
                        : t % 10 == 1 && t % 100 != 11
                        ? e[0]
                        : e[1];
                }
                function n(e, n, s) {
                    return e + ' ' + a(t[s], e, n);
                }
                function s(e, n, s) {
                    return a(t[s], e, n);
                }
                e.defineLocale('lv', {
                    months: 'janvāris_februāris_marts_aprīlis_maijs_jūnijs_jūlijs_augusts_septembris_oktobris_novembris_decembris'.split(
                        '_'
                    ),
                    monthsShort: 'jan_feb_mar_apr_mai_jūn_jūl_aug_sep_okt_nov_dec'.split(
                        '_'
                    ),
                    weekdays: 'svētdiena_pirmdiena_otrdiena_trešdiena_ceturtdiena_piektdiena_sestdiena'.split(
                        '_'
                    ),
                    weekdaysShort: 'Sv_P_O_T_C_Pk_S'.split('_'),
                    weekdaysMin: 'Sv_P_O_T_C_Pk_S'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY.',
                        LL: 'YYYY. [gada] D. MMMM',
                        LLL: 'YYYY. [gada] D. MMMM, HH:mm',
                        LLLL: 'YYYY. [gada] D. MMMM, dddd, HH:mm',
                    },
                    calendar: {
                        sameDay: '[Šodien pulksten] LT',
                        nextDay: '[Rīt pulksten] LT',
                        nextWeek: 'dddd [pulksten] LT',
                        lastDay: '[Vakar pulksten] LT',
                        lastWeek: '[Pagājušā] dddd [pulksten] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'pēc %s',
                        past: 'pirms %s',
                        s: function(e, t) {
                            return t ? 'dažas sekundes' : 'dažām sekundēm';
                        },
                        ss: n,
                        m: s,
                        mm: n,
                        h: s,
                        hh: n,
                        d: s,
                        dd: n,
                        M: s,
                        MM: n,
                        y: s,
                        yy: n,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        49674: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                    words: {
                        ss: ['sekund', 'sekunda', 'sekundi'],
                        m: ['jedan minut', 'jednog minuta'],
                        mm: ['minut', 'minuta', 'minuta'],
                        h: ['jedan sat', 'jednog sata'],
                        hh: ['sat', 'sata', 'sati'],
                        dd: ['dan', 'dana', 'dana'],
                        MM: ['mjesec', 'mjeseca', 'mjeseci'],
                        yy: ['godina', 'godine', 'godina'],
                    },
                    correctGrammaticalCase: function(e, t) {
                        return 1 === e ? t[0] : e >= 2 && e <= 4 ? t[1] : t[2];
                    },
                    translate: function(e, a, n) {
                        var s = t.words[n];
                        return 1 === n.length
                            ? a
                                ? s[0]
                                : s[1]
                            : e + ' ' + t.correctGrammaticalCase(e, s);
                    },
                };
                e.defineLocale('me', {
                    months: 'januar_februar_mart_april_maj_jun_jul_avgust_septembar_oktobar_novembar_decembar'.split(
                        '_'
                    ),
                    monthsShort: 'jan._feb._mar._apr._maj_jun_jul_avg._sep._okt._nov._dec.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota'.split(
                        '_'
                    ),
                    weekdaysShort: 'ned._pon._uto._sri._čet._pet._sub.'.split(
                        '_'
                    ),
                    weekdaysMin: 'ne_po_ut_sr_če_pe_su'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D. MMMM YYYY',
                        LLL: 'D. MMMM YYYY H:mm',
                        LLLL: 'dddd, D. MMMM YYYY H:mm',
                    },
                    calendar: {
                        sameDay: '[danas u] LT',
                        nextDay: '[sjutra u] LT',
                        nextWeek: function() {
                            switch (this.day()) {
                                case 0:
                                    return '[u] [nedjelju] [u] LT';
                                case 3:
                                    return '[u] [srijedu] [u] LT';
                                case 6:
                                    return '[u] [subotu] [u] LT';
                                case 1:
                                case 2:
                                case 4:
                                case 5:
                                    return '[u] dddd [u] LT';
                            }
                        },
                        lastDay: '[juče u] LT',
                        lastWeek: function() {
                            return [
                                '[prošle] [nedjelje] [u] LT',
                                '[prošlog] [ponedjeljka] [u] LT',
                                '[prošlog] [utorka] [u] LT',
                                '[prošle] [srijede] [u] LT',
                                '[prošlog] [četvrtka] [u] LT',
                                '[prošlog] [petka] [u] LT',
                                '[prošle] [subote] [u] LT',
                            ][this.day()];
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'za %s',
                        past: 'prije %s',
                        s: 'nekoliko sekundi',
                        ss: t.translate,
                        m: t.translate,
                        mm: t.translate,
                        h: t.translate,
                        hh: t.translate,
                        d: 'dan',
                        dd: t.translate,
                        M: 'mjesec',
                        MM: t.translate,
                        y: 'godinu',
                        yy: t.translate,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        56500: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('mi', {
                    months: 'Kohi-tāte_Hui-tanguru_Poutū-te-rangi_Paenga-whāwhā_Haratua_Pipiri_Hōngoingoi_Here-turi-kōkā_Mahuru_Whiringa-ā-nuku_Whiringa-ā-rangi_Hakihea'.split(
                        '_'
                    ),
                    monthsShort: 'Kohi_Hui_Pou_Pae_Hara_Pipi_Hōngoi_Here_Mahu_Whi-nu_Whi-ra_Haki'.split(
                        '_'
                    ),
                    monthsRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,
                    monthsStrictRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,
                    monthsShortRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,
                    monthsShortStrictRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,2}/i,
                    weekdays: 'Rātapu_Mane_Tūrei_Wenerei_Tāite_Paraire_Hātarei'.split(
                        '_'
                    ),
                    weekdaysShort: 'Ta_Ma_Tū_We_Tāi_Pa_Hā'.split('_'),
                    weekdaysMin: 'Ta_Ma_Tū_We_Tāi_Pa_Hā'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY [i] HH:mm',
                        LLLL: 'dddd, D MMMM YYYY [i] HH:mm',
                    },
                    calendar: {
                        sameDay: '[i teie mahana, i] LT',
                        nextDay: '[apopo i] LT',
                        nextWeek: 'dddd [i] LT',
                        lastDay: '[inanahi i] LT',
                        lastWeek: 'dddd [whakamutunga i] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'i roto i %s',
                        past: '%s i mua',
                        s: 'te hēkona ruarua',
                        ss: '%d hēkona',
                        m: 'he meneti',
                        mm: '%d meneti',
                        h: 'te haora',
                        hh: '%d haora',
                        d: 'he ra',
                        dd: '%d ra',
                        M: 'he marama',
                        MM: '%d marama',
                        y: 'he tau',
                        yy: '%d tau',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}º/,
                    ordinal: '%dº',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        85111: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('mk', {
                    months: 'јануари_февруари_март_април_мај_јуни_јули_август_септември_октомври_ноември_декември'.split(
                        '_'
                    ),
                    monthsShort: 'јан_фев_мар_апр_мај_јун_јул_авг_сеп_окт_ное_дек'.split(
                        '_'
                    ),
                    weekdays: 'недела_понеделник_вторник_среда_четврток_петок_сабота'.split(
                        '_'
                    ),
                    weekdaysShort: 'нед_пон_вто_сре_чет_пет_саб'.split('_'),
                    weekdaysMin: 'нe_пo_вт_ср_че_пе_сa'.split('_'),
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'D.MM.YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY H:mm',
                        LLLL: 'dddd, D MMMM YYYY H:mm',
                    },
                    calendar: {
                        sameDay: '[Денес во] LT',
                        nextDay: '[Утре во] LT',
                        nextWeek: '[Во] dddd [во] LT',
                        lastDay: '[Вчера во] LT',
                        lastWeek: function() {
                            switch (this.day()) {
                                case 0:
                                case 3:
                                case 6:
                                    return '[Изминатата] dddd [во] LT';
                                case 1:
                                case 2:
                                case 4:
                                case 5:
                                    return '[Изминатиот] dddd [во] LT';
                            }
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'за %s',
                        past: 'пред %s',
                        s: 'неколку секунди',
                        ss: '%d секунди',
                        m: 'една минута',
                        mm: '%d минути',
                        h: 'еден час',
                        hh: '%d часа',
                        d: 'еден ден',
                        dd: '%d дена',
                        M: 'еден месец',
                        MM: '%d месеци',
                        y: 'една година',
                        yy: '%d години',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}-(ев|ен|ти|ви|ри|ми)/,
                    ordinal: function(e) {
                        var t = e % 10,
                            a = e % 100;
                        return 0 === e
                            ? e + '-ев'
                            : 0 === a
                            ? e + '-ен'
                            : a > 10 && a < 20
                            ? e + '-ти'
                            : 1 === t
                            ? e + '-ви'
                            : 2 === t
                            ? e + '-ри'
                            : 7 === t || 8 === t
                            ? e + '-ми'
                            : e + '-ти';
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        55597: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('ml', {
                    months: 'ജനുവരി_ഫെബ്രുവരി_മാർച്ച്_ഏപ്രിൽ_മേയ്_ജൂൺ_ജൂലൈ_ഓഗസ്റ്റ്_സെപ്റ്റംബർ_ഒക്ടോബർ_നവംബർ_ഡിസംബർ'.split(
                        '_'
                    ),
                    monthsShort: 'ജനു._ഫെബ്രു._മാർ._ഏപ്രി._മേയ്_ജൂൺ_ജൂലൈ._ഓഗ._സെപ്റ്റ._ഒക്ടോ._നവം._ഡിസം.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'ഞായറാഴ്ച_തിങ്കളാഴ്ച_ചൊവ്വാഴ്ച_ബുധനാഴ്ച_വ്യാഴാഴ്ച_വെള്ളിയാഴ്ച_ശനിയാഴ്ച'.split(
                        '_'
                    ),
                    weekdaysShort: 'ഞായർ_തിങ്കൾ_ചൊവ്വ_ബുധൻ_വ്യാഴം_വെള്ളി_ശനി'.split(
                        '_'
                    ),
                    weekdaysMin: 'ഞാ_തി_ചൊ_ബു_വ്യാ_വെ_ശ'.split('_'),
                    longDateFormat: {
                        LT: 'A h:mm -നു',
                        LTS: 'A h:mm:ss -നു',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY, A h:mm -നു',
                        LLLL: 'dddd, D MMMM YYYY, A h:mm -നു',
                    },
                    calendar: {
                        sameDay: '[ഇന്ന്] LT',
                        nextDay: '[നാളെ] LT',
                        nextWeek: 'dddd, LT',
                        lastDay: '[ഇന്നലെ] LT',
                        lastWeek: '[കഴിഞ്ഞ] dddd, LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s കഴിഞ്ഞ്',
                        past: '%s മുൻപ്',
                        s: 'അൽപ നിമിഷങ്ങൾ',
                        ss: '%d സെക്കൻഡ്',
                        m: 'ഒരു മിനിറ്റ്',
                        mm: '%d മിനിറ്റ്',
                        h: 'ഒരു മണിക്കൂർ',
                        hh: '%d മണിക്കൂർ',
                        d: 'ഒരു ദിവസം',
                        dd: '%d ദിവസം',
                        M: 'ഒരു മാസം',
                        MM: '%d മാസം',
                        y: 'ഒരു വർഷം',
                        yy: '%d വർഷം',
                    },
                    meridiemParse: /രാത്രി|രാവിലെ|ഉച്ച കഴിഞ്ഞ്|വൈകുന്നേരം|രാത്രി/i,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            ('രാത്രി' === t && e >= 4) ||
                            'ഉച്ച കഴിഞ്ഞ്' === t ||
                            'വൈകുന്നേരം' === t
                                ? e + 12
                                : e
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'രാത്രി'
                            : e < 12
                            ? 'രാവിലെ'
                            : e < 17
                            ? 'ഉച്ച കഴിഞ്ഞ്'
                            : e < 20
                            ? 'വൈകുന്നേരം'
                            : 'രാത്രി';
                    },
                });
            })(a(37485));
        },
        83610: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a, n) {
                    switch (a) {
                        case 's':
                            return t ? 'хэдхэн секунд' : 'хэдхэн секундын';
                        case 'ss':
                            return e + (t ? ' секунд' : ' секундын');
                        case 'm':
                        case 'mm':
                            return e + (t ? ' минут' : ' минутын');
                        case 'h':
                        case 'hh':
                            return e + (t ? ' цаг' : ' цагийн');
                        case 'd':
                        case 'dd':
                            return e + (t ? ' өдөр' : ' өдрийн');
                        case 'M':
                        case 'MM':
                            return e + (t ? ' сар' : ' сарын');
                        case 'y':
                        case 'yy':
                            return e + (t ? ' жил' : ' жилийн');
                        default:
                            return e;
                    }
                }
                e.defineLocale('mn', {
                    months: 'Нэгдүгээр сар_Хоёрдугаар сар_Гуравдугаар сар_Дөрөвдүгээр сар_Тавдугаар сар_Зургадугаар сар_Долдугаар сар_Наймдугаар сар_Есдүгээр сар_Аравдугаар сар_Арван нэгдүгээр сар_Арван хоёрдугаар сар'.split(
                        '_'
                    ),
                    monthsShort: '1 сар_2 сар_3 сар_4 сар_5 сар_6 сар_7 сар_8 сар_9 сар_10 сар_11 сар_12 сар'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'Ням_Даваа_Мягмар_Лхагва_Пүрэв_Баасан_Бямба'.split(
                        '_'
                    ),
                    weekdaysShort: 'Ням_Дав_Мяг_Лха_Пүр_Баа_Бям'.split('_'),
                    weekdaysMin: 'Ня_Да_Мя_Лх_Пү_Ба_Бя'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'YYYY-MM-DD',
                        LL: 'YYYY оны MMMMын D',
                        LLL: 'YYYY оны MMMMын D HH:mm',
                        LLLL: 'dddd, YYYY оны MMMMын D HH:mm',
                    },
                    meridiemParse: /ҮӨ|ҮХ/i,
                    isPM: function(e) {
                        return 'ҮХ' === e;
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? 'ҮӨ' : 'ҮХ';
                    },
                    calendar: {
                        sameDay: '[Өнөөдөр] LT',
                        nextDay: '[Маргааш] LT',
                        nextWeek: '[Ирэх] dddd LT',
                        lastDay: '[Өчигдөр] LT',
                        lastWeek: '[Өнгөрсөн] dddd LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s дараа',
                        past: '%s өмнө',
                        s: t,
                        ss: t,
                        m: t,
                        mm: t,
                        h: t,
                        hh: t,
                        d: t,
                        dd: t,
                        M: t,
                        MM: t,
                        y: t,
                        yy: t,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2} өдөр/,
                    ordinal: function(e, t) {
                        switch (t) {
                            case 'd':
                            case 'D':
                            case 'DDD':
                                return e + ' өдөр';
                            default:
                                return e;
                        }
                    },
                });
            })(a(37485));
        },
        47565: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '१',
                        2: '२',
                        3: '३',
                        4: '४',
                        5: '५',
                        6: '६',
                        7: '७',
                        8: '८',
                        9: '९',
                        0: '०',
                    },
                    a = {
                        '१': '1',
                        '२': '2',
                        '३': '3',
                        '४': '4',
                        '५': '5',
                        '६': '6',
                        '७': '7',
                        '८': '8',
                        '९': '9',
                        '०': '0',
                    };
                function n(e, t, a, n) {
                    var s = '';
                    if (t)
                        switch (a) {
                            case 's':
                                s = 'काही सेकंद';
                                break;
                            case 'ss':
                                s = '%d सेकंद';
                                break;
                            case 'm':
                                s = 'एक मिनिट';
                                break;
                            case 'mm':
                                s = '%d मिनिटे';
                                break;
                            case 'h':
                                s = 'एक तास';
                                break;
                            case 'hh':
                                s = '%d तास';
                                break;
                            case 'd':
                                s = 'एक दिवस';
                                break;
                            case 'dd':
                                s = '%d दिवस';
                                break;
                            case 'M':
                                s = 'एक महिना';
                                break;
                            case 'MM':
                                s = '%d महिने';
                                break;
                            case 'y':
                                s = 'एक वर्ष';
                                break;
                            case 'yy':
                                s = '%d वर्षे';
                        }
                    else
                        switch (a) {
                            case 's':
                                s = 'काही सेकंदां';
                                break;
                            case 'ss':
                                s = '%d सेकंदां';
                                break;
                            case 'm':
                                s = 'एका मिनिटा';
                                break;
                            case 'mm':
                                s = '%d मिनिटां';
                                break;
                            case 'h':
                                s = 'एका तासा';
                                break;
                            case 'hh':
                                s = '%d तासां';
                                break;
                            case 'd':
                                s = 'एका दिवसा';
                                break;
                            case 'dd':
                                s = '%d दिवसां';
                                break;
                            case 'M':
                                s = 'एका महिन्या';
                                break;
                            case 'MM':
                                s = '%d महिन्यां';
                                break;
                            case 'y':
                                s = 'एका वर्षा';
                                break;
                            case 'yy':
                                s = '%d वर्षां';
                        }
                    return s.replace(/%d/i, e);
                }
                e.defineLocale('mr', {
                    months: 'जानेवारी_फेब्रुवारी_मार्च_एप्रिल_मे_जून_जुलै_ऑगस्ट_सप्टेंबर_ऑक्टोबर_नोव्हेंबर_डिसेंबर'.split(
                        '_'
                    ),
                    monthsShort: 'जाने._फेब्रु._मार्च._एप्रि._मे._जून._जुलै._ऑग._सप्टें._ऑक्टो._नोव्हें._डिसें.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'रविवार_सोमवार_मंगळवार_बुधवार_गुरूवार_शुक्रवार_शनिवार'.split(
                        '_'
                    ),
                    weekdaysShort: 'रवि_सोम_मंगळ_बुध_गुरू_शुक्र_शनि'.split('_'),
                    weekdaysMin: 'र_सो_मं_बु_गु_शु_श'.split('_'),
                    longDateFormat: {
                        LT: 'A h:mm वाजता',
                        LTS: 'A h:mm:ss वाजता',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY, A h:mm वाजता',
                        LLLL: 'dddd, D MMMM YYYY, A h:mm वाजता',
                    },
                    calendar: {
                        sameDay: '[आज] LT',
                        nextDay: '[उद्या] LT',
                        nextWeek: 'dddd, LT',
                        lastDay: '[काल] LT',
                        lastWeek: '[मागील] dddd, LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%sमध्ये',
                        past: '%sपूर्वी',
                        s: n,
                        ss: n,
                        m: n,
                        mm: n,
                        h: n,
                        hh: n,
                        d: n,
                        dd: n,
                        M: n,
                        MM: n,
                        y: n,
                        yy: n,
                    },
                    preparse: function(e) {
                        return e.replace(/[१२३४५६७८९०]/g, function(e) {
                            return a[e];
                        });
                    },
                    postformat: function(e) {
                        return e.replace(/\d/g, function(e) {
                            return t[e];
                        });
                    },
                    meridiemParse: /पहाटे|सकाळी|दुपारी|सायंकाळी|रात्री/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'पहाटे' === t || 'सकाळी' === t
                                ? e
                                : 'दुपारी' === t ||
                                  'सायंकाळी' === t ||
                                  'रात्री' === t
                                ? e >= 12
                                    ? e
                                    : e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e >= 0 && e < 6
                            ? 'पहाटे'
                            : e < 12
                            ? 'सकाळी'
                            : e < 17
                            ? 'दुपारी'
                            : e < 20
                            ? 'सायंकाळी'
                            : 'रात्री';
                    },
                    week: { dow: 0, doy: 6 },
                });
            })(a(37485));
        },
        64736: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('ms-my', {
                    months: 'Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis'.split(
                        '_'
                    ),
                    weekdays: 'Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu'.split(
                        '_'
                    ),
                    weekdaysShort: 'Ahd_Isn_Sel_Rab_Kha_Jum_Sab'.split('_'),
                    weekdaysMin: 'Ah_Is_Sl_Rb_Km_Jm_Sb'.split('_'),
                    longDateFormat: {
                        LT: 'HH.mm',
                        LTS: 'HH.mm.ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY [pukul] HH.mm',
                        LLLL: 'dddd, D MMMM YYYY [pukul] HH.mm',
                    },
                    meridiemParse: /pagi|tengahari|petang|malam/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'pagi' === t
                                ? e
                                : 'tengahari' === t
                                ? e >= 11
                                    ? e
                                    : e + 12
                                : 'petang' === t || 'malam' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 11
                            ? 'pagi'
                            : e < 15
                            ? 'tengahari'
                            : e < 19
                            ? 'petang'
                            : 'malam';
                    },
                    calendar: {
                        sameDay: '[Hari ini pukul] LT',
                        nextDay: '[Esok pukul] LT',
                        nextWeek: 'dddd [pukul] LT',
                        lastDay: '[Kelmarin pukul] LT',
                        lastWeek: 'dddd [lepas pukul] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'dalam %s',
                        past: '%s yang lepas',
                        s: 'beberapa saat',
                        ss: '%d saat',
                        m: 'seminit',
                        mm: '%d minit',
                        h: 'sejam',
                        hh: '%d jam',
                        d: 'sehari',
                        dd: '%d hari',
                        M: 'sebulan',
                        MM: '%d bulan',
                        y: 'setahun',
                        yy: '%d tahun',
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        7918: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('ms', {
                    months: 'Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis'.split(
                        '_'
                    ),
                    weekdays: 'Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu'.split(
                        '_'
                    ),
                    weekdaysShort: 'Ahd_Isn_Sel_Rab_Kha_Jum_Sab'.split('_'),
                    weekdaysMin: 'Ah_Is_Sl_Rb_Km_Jm_Sb'.split('_'),
                    longDateFormat: {
                        LT: 'HH.mm',
                        LTS: 'HH.mm.ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY [pukul] HH.mm',
                        LLLL: 'dddd, D MMMM YYYY [pukul] HH.mm',
                    },
                    meridiemParse: /pagi|tengahari|petang|malam/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'pagi' === t
                                ? e
                                : 'tengahari' === t
                                ? e >= 11
                                    ? e
                                    : e + 12
                                : 'petang' === t || 'malam' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 11
                            ? 'pagi'
                            : e < 15
                            ? 'tengahari'
                            : e < 19
                            ? 'petang'
                            : 'malam';
                    },
                    calendar: {
                        sameDay: '[Hari ini pukul] LT',
                        nextDay: '[Esok pukul] LT',
                        nextWeek: 'dddd [pukul] LT',
                        lastDay: '[Kelmarin pukul] LT',
                        lastWeek: 'dddd [lepas pukul] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'dalam %s',
                        past: '%s yang lepas',
                        s: 'beberapa saat',
                        ss: '%d saat',
                        m: 'seminit',
                        mm: '%d minit',
                        h: 'sejam',
                        hh: '%d jam',
                        d: 'sehari',
                        dd: '%d hari',
                        M: 'sebulan',
                        MM: '%d bulan',
                        y: 'setahun',
                        yy: '%d tahun',
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        5947: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('mt', {
                    months: 'Jannar_Frar_Marzu_April_Mejju_Ġunju_Lulju_Awwissu_Settembru_Ottubru_Novembru_Diċembru'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Fra_Mar_Apr_Mej_Ġun_Lul_Aww_Set_Ott_Nov_Diċ'.split(
                        '_'
                    ),
                    weekdays: 'Il-Ħadd_It-Tnejn_It-Tlieta_L-Erbgħa_Il-Ħamis_Il-Ġimgħa_Is-Sibt'.split(
                        '_'
                    ),
                    weekdaysShort: 'Ħad_Tne_Tli_Erb_Ħam_Ġim_Sib'.split('_'),
                    weekdaysMin: 'Ħa_Tn_Tl_Er_Ħa_Ġi_Si'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Illum fil-]LT',
                        nextDay: '[Għada fil-]LT',
                        nextWeek: 'dddd [fil-]LT',
                        lastDay: '[Il-bieraħ fil-]LT',
                        lastWeek: 'dddd [li għadda] [fil-]LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'f’ %s',
                        past: '%s ilu',
                        s: 'ftit sekondi',
                        ss: '%d sekondi',
                        m: 'minuta',
                        mm: '%d minuti',
                        h: 'siegħa',
                        hh: '%d siegħat',
                        d: 'ġurnata',
                        dd: '%d ġranet',
                        M: 'xahar',
                        MM: '%d xhur',
                        y: 'sena',
                        yy: '%d sni',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}º/,
                    ordinal: '%dº',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        55624: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '၁',
                        2: '၂',
                        3: '၃',
                        4: '၄',
                        5: '၅',
                        6: '၆',
                        7: '၇',
                        8: '၈',
                        9: '၉',
                        0: '၀',
                    },
                    a = {
                        '၁': '1',
                        '၂': '2',
                        '၃': '3',
                        '၄': '4',
                        '၅': '5',
                        '၆': '6',
                        '၇': '7',
                        '၈': '8',
                        '၉': '9',
                        '၀': '0',
                    };
                e.defineLocale('my', {
                    months: 'ဇန်နဝါရီ_ဖေဖော်ဝါရီ_မတ်_ဧပြီ_မေ_ဇွန်_ဇူလိုင်_သြဂုတ်_စက်တင်ဘာ_အောက်တိုဘာ_နိုဝင်ဘာ_ဒီဇင်ဘာ'.split(
                        '_'
                    ),
                    monthsShort: 'ဇန်_ဖေ_မတ်_ပြီ_မေ_ဇွန်_လိုင်_သြ_စက်_အောက်_နို_ဒီ'.split(
                        '_'
                    ),
                    weekdays: 'တနင်္ဂနွေ_တနင်္လာ_အင်္ဂါ_ဗုဒ္ဓဟူး_ကြာသပတေး_သောကြာ_စနေ'.split(
                        '_'
                    ),
                    weekdaysShort: 'နွေ_လာ_ဂါ_ဟူး_ကြာ_သော_နေ'.split('_'),
                    weekdaysMin: 'နွေ_လာ_ဂါ_ဟူး_ကြာ_သော_နေ'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[ယနေ.] LT [မှာ]',
                        nextDay: '[မနက်ဖြန်] LT [မှာ]',
                        nextWeek: 'dddd LT [မှာ]',
                        lastDay: '[မနေ.က] LT [မှာ]',
                        lastWeek: '[ပြီးခဲ့သော] dddd LT [မှာ]',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'လာမည့် %s မှာ',
                        past: 'လွန်ခဲ့သော %s က',
                        s: 'စက္ကန်.အနည်းငယ်',
                        ss: '%d စက္ကန့်',
                        m: 'တစ်မိနစ်',
                        mm: '%d မိနစ်',
                        h: 'တစ်နာရီ',
                        hh: '%d နာရီ',
                        d: 'တစ်ရက်',
                        dd: '%d ရက်',
                        M: 'တစ်လ',
                        MM: '%d လ',
                        y: 'တစ်နှစ်',
                        yy: '%d နှစ်',
                    },
                    preparse: function(e) {
                        return e.replace(/[၁၂၃၄၅၆၇၈၉၀]/g, function(e) {
                            return a[e];
                        });
                    },
                    postformat: function(e) {
                        return e.replace(/\d/g, function(e) {
                            return t[e];
                        });
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        98607: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('nb', {
                    months: 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split(
                        '_'
                    ),
                    monthsShort: 'jan._feb._mars_apr._mai_juni_juli_aug._sep._okt._nov._des.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'søndag_mandag_tirsdag_onsdag_torsdag_fredag_lørdag'.split(
                        '_'
                    ),
                    weekdaysShort: 'sø._ma._ti._on._to._fr._lø.'.split('_'),
                    weekdaysMin: 'sø_ma_ti_on_to_fr_lø'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D. MMMM YYYY',
                        LLL: 'D. MMMM YYYY [kl.] HH:mm',
                        LLLL: 'dddd D. MMMM YYYY [kl.] HH:mm',
                    },
                    calendar: {
                        sameDay: '[i dag kl.] LT',
                        nextDay: '[i morgen kl.] LT',
                        nextWeek: 'dddd [kl.] LT',
                        lastDay: '[i går kl.] LT',
                        lastWeek: '[forrige] dddd [kl.] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'om %s',
                        past: '%s siden',
                        s: 'noen sekunder',
                        ss: '%d sekunder',
                        m: 'ett minutt',
                        mm: '%d minutter',
                        h: 'en time',
                        hh: '%d timer',
                        d: 'en dag',
                        dd: '%d dager',
                        w: 'en uke',
                        ww: '%d uker',
                        M: 'en måned',
                        MM: '%d måneder',
                        y: 'ett år',
                        yy: '%d år',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        85457: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '१',
                        2: '२',
                        3: '३',
                        4: '४',
                        5: '५',
                        6: '६',
                        7: '७',
                        8: '८',
                        9: '९',
                        0: '०',
                    },
                    a = {
                        '१': '1',
                        '२': '2',
                        '३': '3',
                        '४': '4',
                        '५': '5',
                        '६': '6',
                        '७': '7',
                        '८': '8',
                        '९': '9',
                        '०': '0',
                    };
                e.defineLocale('ne', {
                    months: 'जनवरी_फेब्रुवरी_मार्च_अप्रिल_मई_जुन_जुलाई_अगष्ट_सेप्टेम्बर_अक्टोबर_नोभेम्बर_डिसेम्बर'.split(
                        '_'
                    ),
                    monthsShort: 'जन._फेब्रु._मार्च_अप्रि._मई_जुन_जुलाई._अग._सेप्ट._अक्टो._नोभे._डिसे.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'आइतबार_सोमबार_मङ्गलबार_बुधबार_बिहिबार_शुक्रबार_शनिबार'.split(
                        '_'
                    ),
                    weekdaysShort: 'आइत._सोम._मङ्गल._बुध._बिहि._शुक्र._शनि.'.split(
                        '_'
                    ),
                    weekdaysMin: 'आ._सो._मं._बु._बि._शु._श.'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'Aको h:mm बजे',
                        LTS: 'Aको h:mm:ss बजे',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY, Aको h:mm बजे',
                        LLLL: 'dddd, D MMMM YYYY, Aको h:mm बजे',
                    },
                    preparse: function(e) {
                        return e.replace(/[१२३४५६७८९०]/g, function(e) {
                            return a[e];
                        });
                    },
                    postformat: function(e) {
                        return e.replace(/\d/g, function(e) {
                            return t[e];
                        });
                    },
                    meridiemParse: /राति|बिहान|दिउँसो|साँझ/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'राति' === t
                                ? e < 4
                                    ? e
                                    : e + 12
                                : 'बिहान' === t
                                ? e
                                : 'दिउँसो' === t
                                ? e >= 10
                                    ? e
                                    : e + 12
                                : 'साँझ' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 3
                            ? 'राति'
                            : e < 12
                            ? 'बिहान'
                            : e < 16
                            ? 'दिउँसो'
                            : e < 20
                            ? 'साँझ'
                            : 'राति';
                    },
                    calendar: {
                        sameDay: '[आज] LT',
                        nextDay: '[भोलि] LT',
                        nextWeek: '[आउँदो] dddd[,] LT',
                        lastDay: '[हिजो] LT',
                        lastWeek: '[गएको] dddd[,] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%sमा',
                        past: '%s अगाडि',
                        s: 'केही क्षण',
                        ss: '%d सेकेण्ड',
                        m: 'एक मिनेट',
                        mm: '%d मिनेट',
                        h: 'एक घण्टा',
                        hh: '%d घण्टा',
                        d: 'एक दिन',
                        dd: '%d दिन',
                        M: 'एक महिना',
                        MM: '%d महिना',
                        y: 'एक बर्ष',
                        yy: '%d बर्ष',
                    },
                    week: { dow: 0, doy: 6 },
                });
            })(a(37485));
        },
        3439: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = 'jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.'.split(
                        '_'
                    ),
                    a = 'jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec'.split(
                        '_'
                    ),
                    n = [
                        /^jan/i,
                        /^feb/i,
                        /^maart|mrt.?$/i,
                        /^apr/i,
                        /^mei$/i,
                        /^jun[i.]?$/i,
                        /^jul[i.]?$/i,
                        /^aug/i,
                        /^sep/i,
                        /^okt/i,
                        /^nov/i,
                        /^dec/i,
                    ],
                    s = /^(januari|februari|maart|april|mei|ju[nl]i|augustus|september|oktober|november|december|jan\.?|feb\.?|mrt\.?|apr\.?|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i;
                e.defineLocale('nl-be', {
                    months: 'januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december'.split(
                        '_'
                    ),
                    monthsShort: function(e, n) {
                        return e
                            ? /-MMM-/.test(n)
                                ? a[e.month()]
                                : t[e.month()]
                            : t;
                    },
                    monthsRegex: s,
                    monthsShortRegex: s,
                    monthsStrictRegex: /^(januari|februari|maart|april|mei|ju[nl]i|augustus|september|oktober|november|december)/i,
                    monthsShortStrictRegex: /^(jan\.?|feb\.?|mrt\.?|apr\.?|mei|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i,
                    monthsParse: n,
                    longMonthsParse: n,
                    shortMonthsParse: n,
                    weekdays: 'zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag'.split(
                        '_'
                    ),
                    weekdaysShort: 'zo._ma._di._wo._do._vr._za.'.split('_'),
                    weekdaysMin: 'zo_ma_di_wo_do_vr_za'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[vandaag om] LT',
                        nextDay: '[morgen om] LT',
                        nextWeek: 'dddd [om] LT',
                        lastDay: '[gisteren om] LT',
                        lastWeek: '[afgelopen] dddd [om] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'over %s',
                        past: '%s geleden',
                        s: 'een paar seconden',
                        ss: '%d seconden',
                        m: 'één minuut',
                        mm: '%d minuten',
                        h: 'één uur',
                        hh: '%d uur',
                        d: 'één dag',
                        dd: '%d dagen',
                        M: 'één maand',
                        MM: '%d maanden',
                        y: 'één jaar',
                        yy: '%d jaar',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
                    ordinal: function(e) {
                        return (
                            e + (1 === e || 8 === e || e >= 20 ? 'ste' : 'de')
                        );
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        54041: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = 'jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.'.split(
                        '_'
                    ),
                    a = 'jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec'.split(
                        '_'
                    ),
                    n = [
                        /^jan/i,
                        /^feb/i,
                        /^maart|mrt.?$/i,
                        /^apr/i,
                        /^mei$/i,
                        /^jun[i.]?$/i,
                        /^jul[i.]?$/i,
                        /^aug/i,
                        /^sep/i,
                        /^okt/i,
                        /^nov/i,
                        /^dec/i,
                    ],
                    s = /^(januari|februari|maart|april|mei|ju[nl]i|augustus|september|oktober|november|december|jan\.?|feb\.?|mrt\.?|apr\.?|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i;
                e.defineLocale('nl', {
                    months: 'januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december'.split(
                        '_'
                    ),
                    monthsShort: function(e, n) {
                        return e
                            ? /-MMM-/.test(n)
                                ? a[e.month()]
                                : t[e.month()]
                            : t;
                    },
                    monthsRegex: s,
                    monthsShortRegex: s,
                    monthsStrictRegex: /^(januari|februari|maart|april|mei|ju[nl]i|augustus|september|oktober|november|december)/i,
                    monthsShortStrictRegex: /^(jan\.?|feb\.?|mrt\.?|apr\.?|mei|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i,
                    monthsParse: n,
                    longMonthsParse: n,
                    shortMonthsParse: n,
                    weekdays: 'zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag'.split(
                        '_'
                    ),
                    weekdaysShort: 'zo._ma._di._wo._do._vr._za.'.split('_'),
                    weekdaysMin: 'zo_ma_di_wo_do_vr_za'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD-MM-YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[vandaag om] LT',
                        nextDay: '[morgen om] LT',
                        nextWeek: 'dddd [om] LT',
                        lastDay: '[gisteren om] LT',
                        lastWeek: '[afgelopen] dddd [om] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'over %s',
                        past: '%s geleden',
                        s: 'een paar seconden',
                        ss: '%d seconden',
                        m: 'één minuut',
                        mm: '%d minuten',
                        h: 'één uur',
                        hh: '%d uur',
                        d: 'één dag',
                        dd: '%d dagen',
                        w: 'één week',
                        ww: '%d weken',
                        M: 'één maand',
                        MM: '%d maanden',
                        y: 'één jaar',
                        yy: '%d jaar',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
                    ordinal: function(e) {
                        return (
                            e + (1 === e || 8 === e || e >= 20 ? 'ste' : 'de')
                        );
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        82457: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('nn', {
                    months: 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split(
                        '_'
                    ),
                    monthsShort: 'jan._feb._mars_apr._mai_juni_juli_aug._sep._okt._nov._des.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'sundag_måndag_tysdag_onsdag_torsdag_fredag_laurdag'.split(
                        '_'
                    ),
                    weekdaysShort: 'su._må._ty._on._to._fr._lau.'.split('_'),
                    weekdaysMin: 'su_må_ty_on_to_fr_la'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D. MMMM YYYY',
                        LLL: 'D. MMMM YYYY [kl.] H:mm',
                        LLLL: 'dddd D. MMMM YYYY [kl.] HH:mm',
                    },
                    calendar: {
                        sameDay: '[I dag klokka] LT',
                        nextDay: '[I morgon klokka] LT',
                        nextWeek: 'dddd [klokka] LT',
                        lastDay: '[I går klokka] LT',
                        lastWeek: '[Føregåande] dddd [klokka] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'om %s',
                        past: '%s sidan',
                        s: 'nokre sekund',
                        ss: '%d sekund',
                        m: 'eit minutt',
                        mm: '%d minutt',
                        h: 'ein time',
                        hh: '%d timar',
                        d: 'ein dag',
                        dd: '%d dagar',
                        w: 'ei veke',
                        ww: '%d veker',
                        M: 'ein månad',
                        MM: '%d månader',
                        y: 'eit år',
                        yy: '%d år',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        26236: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('oc-lnc', {
                    months: {
                        standalone: 'genièr_febrièr_març_abril_mai_junh_julhet_agost_setembre_octòbre_novembre_decembre'.split(
                            '_'
                        ),
                        format: "de genièr_de febrièr_de març_d'abril_de mai_de junh_de julhet_d'agost_de setembre_d'octòbre_de novembre_de decembre".split(
                            '_'
                        ),
                        isFormat: /D[oD]?(\s)+MMMM/,
                    },
                    monthsShort: 'gen._febr._març_abr._mai_junh_julh._ago._set._oct._nov._dec.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'dimenge_diluns_dimars_dimècres_dijòus_divendres_dissabte'.split(
                        '_'
                    ),
                    weekdaysShort: 'dg._dl._dm._dc._dj._dv._ds.'.split('_'),
                    weekdaysMin: 'dg_dl_dm_dc_dj_dv_ds'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM [de] YYYY',
                        ll: 'D MMM YYYY',
                        LLL: 'D MMMM [de] YYYY [a] H:mm',
                        lll: 'D MMM YYYY, H:mm',
                        LLLL: 'dddd D MMMM [de] YYYY [a] H:mm',
                        llll: 'ddd D MMM YYYY, H:mm',
                    },
                    calendar: {
                        sameDay: '[uèi a] LT',
                        nextDay: '[deman a] LT',
                        nextWeek: 'dddd [a] LT',
                        lastDay: '[ièr a] LT',
                        lastWeek: 'dddd [passat a] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: "d'aquí %s",
                        past: 'fa %s',
                        s: 'unas segondas',
                        ss: '%d segondas',
                        m: 'una minuta',
                        mm: '%d minutas',
                        h: 'una ora',
                        hh: '%d oras',
                        d: 'un jorn',
                        dd: '%d jorns',
                        M: 'un mes',
                        MM: '%d meses',
                        y: 'un an',
                        yy: '%d ans',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(r|n|t|è|a)/,
                    ordinal: function(e, t) {
                        var a =
                            1 === e
                                ? 'r'
                                : 2 === e
                                ? 'n'
                                : 3 === e
                                ? 'r'
                                : 4 === e
                                ? 't'
                                : 'è';
                        return ('w' !== t && 'W' !== t) || (a = 'a'), e + a;
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        38772: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '੧',
                        2: '੨',
                        3: '੩',
                        4: '੪',
                        5: '੫',
                        6: '੬',
                        7: '੭',
                        8: '੮',
                        9: '੯',
                        0: '੦',
                    },
                    a = {
                        '੧': '1',
                        '੨': '2',
                        '੩': '3',
                        '੪': '4',
                        '੫': '5',
                        '੬': '6',
                        '੭': '7',
                        '੮': '8',
                        '੯': '9',
                        '੦': '0',
                    };
                e.defineLocale('pa-in', {
                    months: 'ਜਨਵਰੀ_ਫ਼ਰਵਰੀ_ਮਾਰਚ_ਅਪ੍ਰੈਲ_ਮਈ_ਜੂਨ_ਜੁਲਾਈ_ਅਗਸਤ_ਸਤੰਬਰ_ਅਕਤੂਬਰ_ਨਵੰਬਰ_ਦਸੰਬਰ'.split(
                        '_'
                    ),
                    monthsShort: 'ਜਨਵਰੀ_ਫ਼ਰਵਰੀ_ਮਾਰਚ_ਅਪ੍ਰੈਲ_ਮਈ_ਜੂਨ_ਜੁਲਾਈ_ਅਗਸਤ_ਸਤੰਬਰ_ਅਕਤੂਬਰ_ਨਵੰਬਰ_ਦਸੰਬਰ'.split(
                        '_'
                    ),
                    weekdays: 'ਐਤਵਾਰ_ਸੋਮਵਾਰ_ਮੰਗਲਵਾਰ_ਬੁਧਵਾਰ_ਵੀਰਵਾਰ_ਸ਼ੁੱਕਰਵਾਰ_ਸ਼ਨੀਚਰਵਾਰ'.split(
                        '_'
                    ),
                    weekdaysShort: 'ਐਤ_ਸੋਮ_ਮੰਗਲ_ਬੁਧ_ਵੀਰ_ਸ਼ੁਕਰ_ਸ਼ਨੀ'.split('_'),
                    weekdaysMin: 'ਐਤ_ਸੋਮ_ਮੰਗਲ_ਬੁਧ_ਵੀਰ_ਸ਼ੁਕਰ_ਸ਼ਨੀ'.split('_'),
                    longDateFormat: {
                        LT: 'A h:mm ਵਜੇ',
                        LTS: 'A h:mm:ss ਵਜੇ',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY, A h:mm ਵਜੇ',
                        LLLL: 'dddd, D MMMM YYYY, A h:mm ਵਜੇ',
                    },
                    calendar: {
                        sameDay: '[ਅਜ] LT',
                        nextDay: '[ਕਲ] LT',
                        nextWeek: '[ਅਗਲਾ] dddd, LT',
                        lastDay: '[ਕਲ] LT',
                        lastWeek: '[ਪਿਛਲੇ] dddd, LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s ਵਿੱਚ',
                        past: '%s ਪਿਛਲੇ',
                        s: 'ਕੁਝ ਸਕਿੰਟ',
                        ss: '%d ਸਕਿੰਟ',
                        m: 'ਇਕ ਮਿੰਟ',
                        mm: '%d ਮਿੰਟ',
                        h: 'ਇੱਕ ਘੰਟਾ',
                        hh: '%d ਘੰਟੇ',
                        d: 'ਇੱਕ ਦਿਨ',
                        dd: '%d ਦਿਨ',
                        M: 'ਇੱਕ ਮਹੀਨਾ',
                        MM: '%d ਮਹੀਨੇ',
                        y: 'ਇੱਕ ਸਾਲ',
                        yy: '%d ਸਾਲ',
                    },
                    preparse: function(e) {
                        return e.replace(/[੧੨੩੪੫੬੭੮੯੦]/g, function(e) {
                            return a[e];
                        });
                    },
                    postformat: function(e) {
                        return e.replace(/\d/g, function(e) {
                            return t[e];
                        });
                    },
                    meridiemParse: /ਰਾਤ|ਸਵੇਰ|ਦੁਪਹਿਰ|ਸ਼ਾਮ/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'ਰਾਤ' === t
                                ? e < 4
                                    ? e
                                    : e + 12
                                : 'ਸਵੇਰ' === t
                                ? e
                                : 'ਦੁਪਹਿਰ' === t
                                ? e >= 10
                                    ? e
                                    : e + 12
                                : 'ਸ਼ਾਮ' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'ਰਾਤ'
                            : e < 10
                            ? 'ਸਵੇਰ'
                            : e < 17
                            ? 'ਦੁਪਹਿਰ'
                            : e < 20
                            ? 'ਸ਼ਾਮ'
                            : 'ਰਾਤ';
                    },
                    week: { dow: 0, doy: 6 },
                });
            })(a(37485));
        },
        43219: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = 'styczeń_luty_marzec_kwiecień_maj_czerwiec_lipiec_sierpień_wrzesień_październik_listopad_grudzień'.split(
                        '_'
                    ),
                    a = 'stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_września_października_listopada_grudnia'.split(
                        '_'
                    ),
                    n = [
                        /^sty/i,
                        /^lut/i,
                        /^mar/i,
                        /^kwi/i,
                        /^maj/i,
                        /^cze/i,
                        /^lip/i,
                        /^sie/i,
                        /^wrz/i,
                        /^paź/i,
                        /^lis/i,
                        /^gru/i,
                    ];
                function s(e) {
                    return e % 10 < 5 && e % 10 > 1 && ~~(e / 10) % 10 != 1;
                }
                function r(e, t, a) {
                    var n = e + ' ';
                    switch (a) {
                        case 'ss':
                            return n + (s(e) ? 'sekundy' : 'sekund');
                        case 'm':
                            return t ? 'minuta' : 'minutę';
                        case 'mm':
                            return n + (s(e) ? 'minuty' : 'minut');
                        case 'h':
                            return t ? 'godzina' : 'godzinę';
                        case 'hh':
                            return n + (s(e) ? 'godziny' : 'godzin');
                        case 'ww':
                            return n + (s(e) ? 'tygodnie' : 'tygodni');
                        case 'MM':
                            return n + (s(e) ? 'miesiące' : 'miesięcy');
                        case 'yy':
                            return n + (s(e) ? 'lata' : 'lat');
                    }
                }
                e.defineLocale('pl', {
                    months: function(e, n) {
                        return e
                            ? /D MMMM/.test(n)
                                ? a[e.month()]
                                : t[e.month()]
                            : t;
                    },
                    monthsShort: 'sty_lut_mar_kwi_maj_cze_lip_sie_wrz_paź_lis_gru'.split(
                        '_'
                    ),
                    monthsParse: n,
                    longMonthsParse: n,
                    shortMonthsParse: n,
                    weekdays: 'niedziela_poniedziałek_wtorek_środa_czwartek_piątek_sobota'.split(
                        '_'
                    ),
                    weekdaysShort: 'ndz_pon_wt_śr_czw_pt_sob'.split('_'),
                    weekdaysMin: 'Nd_Pn_Wt_Śr_Cz_Pt_So'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Dziś o] LT',
                        nextDay: '[Jutro o] LT',
                        nextWeek: function() {
                            switch (this.day()) {
                                case 0:
                                    return '[W niedzielę o] LT';
                                case 2:
                                    return '[We wtorek o] LT';
                                case 3:
                                    return '[W środę o] LT';
                                case 6:
                                    return '[W sobotę o] LT';
                                default:
                                    return '[W] dddd [o] LT';
                            }
                        },
                        lastDay: '[Wczoraj o] LT',
                        lastWeek: function() {
                            switch (this.day()) {
                                case 0:
                                    return '[W zeszłą niedzielę o] LT';
                                case 3:
                                    return '[W zeszłą środę o] LT';
                                case 6:
                                    return '[W zeszłą sobotę o] LT';
                                default:
                                    return '[W zeszły] dddd [o] LT';
                            }
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'za %s',
                        past: '%s temu',
                        s: 'kilka sekund',
                        ss: r,
                        m: r,
                        mm: r,
                        h: r,
                        hh: r,
                        d: '1 dzień',
                        dd: '%d dni',
                        w: 'tydzień',
                        ww: r,
                        M: 'miesiąc',
                        MM: r,
                        y: 'rok',
                        yy: r,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        10376: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('pt-br', {
                    months: 'janeiro_fevereiro_março_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro'.split(
                        '_'
                    ),
                    monthsShort: 'jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez'.split(
                        '_'
                    ),
                    weekdays: 'domingo_segunda-feira_terça-feira_quarta-feira_quinta-feira_sexta-feira_sábado'.split(
                        '_'
                    ),
                    weekdaysShort: 'dom_seg_ter_qua_qui_sex_sáb'.split('_'),
                    weekdaysMin: 'do_2ª_3ª_4ª_5ª_6ª_sá'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D [de] MMMM [de] YYYY',
                        LLL: 'D [de] MMMM [de] YYYY [às] HH:mm',
                        LLLL: 'dddd, D [de] MMMM [de] YYYY [às] HH:mm',
                    },
                    calendar: {
                        sameDay: '[Hoje às] LT',
                        nextDay: '[Amanhã às] LT',
                        nextWeek: 'dddd [às] LT',
                        lastDay: '[Ontem às] LT',
                        lastWeek: function() {
                            return 0 === this.day() || 6 === this.day()
                                ? '[Último] dddd [às] LT'
                                : '[Última] dddd [às] LT';
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'em %s',
                        past: 'há %s',
                        s: 'poucos segundos',
                        ss: '%d segundos',
                        m: 'um minuto',
                        mm: '%d minutos',
                        h: 'uma hora',
                        hh: '%d horas',
                        d: 'um dia',
                        dd: '%d dias',
                        M: 'um mês',
                        MM: '%d meses',
                        y: 'um ano',
                        yy: '%d anos',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}º/,
                    ordinal: '%dº',
                    invalidDate: 'Data inválida',
                });
            })(a(37485));
        },
        31071: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('pt', {
                    months: 'janeiro_fevereiro_março_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro'.split(
                        '_'
                    ),
                    monthsShort: 'jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez'.split(
                        '_'
                    ),
                    weekdays: 'Domingo_Segunda-feira_Terça-feira_Quarta-feira_Quinta-feira_Sexta-feira_Sábado'.split(
                        '_'
                    ),
                    weekdaysShort: 'Dom_Seg_Ter_Qua_Qui_Sex_Sáb'.split('_'),
                    weekdaysMin: 'Do_2ª_3ª_4ª_5ª_6ª_Sá'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D [de] MMMM [de] YYYY',
                        LLL: 'D [de] MMMM [de] YYYY HH:mm',
                        LLLL: 'dddd, D [de] MMMM [de] YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Hoje às] LT',
                        nextDay: '[Amanhã às] LT',
                        nextWeek: 'dddd [às] LT',
                        lastDay: '[Ontem às] LT',
                        lastWeek: function() {
                            return 0 === this.day() || 6 === this.day()
                                ? '[Último] dddd [às] LT'
                                : '[Última] dddd [às] LT';
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'em %s',
                        past: 'há %s',
                        s: 'segundos',
                        ss: '%d segundos',
                        m: 'um minuto',
                        mm: '%d minutos',
                        h: 'uma hora',
                        hh: '%d horas',
                        d: 'um dia',
                        dd: '%d dias',
                        w: 'uma semana',
                        ww: '%d semanas',
                        M: 'um mês',
                        MM: '%d meses',
                        y: 'um ano',
                        yy: '%d anos',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}º/,
                    ordinal: '%dº',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        43551: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a) {
                    var n = ' ';
                    return (
                        (e % 100 >= 20 || (e >= 100 && e % 100 == 0)) &&
                            (n = ' de '),
                        e +
                            n +
                            {
                                ss: 'secunde',
                                mm: 'minute',
                                hh: 'ore',
                                dd: 'zile',
                                ww: 'săptămâni',
                                MM: 'luni',
                                yy: 'ani',
                            }[a]
                    );
                }
                e.defineLocale('ro', {
                    months: 'ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie'.split(
                        '_'
                    ),
                    monthsShort: 'ian._feb._mart._apr._mai_iun._iul._aug._sept._oct._nov._dec.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'duminică_luni_marți_miercuri_joi_vineri_sâmbătă'.split(
                        '_'
                    ),
                    weekdaysShort: 'Dum_Lun_Mar_Mie_Joi_Vin_Sâm'.split('_'),
                    weekdaysMin: 'Du_Lu_Ma_Mi_Jo_Vi_Sâ'.split('_'),
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY H:mm',
                        LLLL: 'dddd, D MMMM YYYY H:mm',
                    },
                    calendar: {
                        sameDay: '[azi la] LT',
                        nextDay: '[mâine la] LT',
                        nextWeek: 'dddd [la] LT',
                        lastDay: '[ieri la] LT',
                        lastWeek: '[fosta] dddd [la] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'peste %s',
                        past: '%s în urmă',
                        s: 'câteva secunde',
                        ss: t,
                        m: 'un minut',
                        mm: t,
                        h: 'o oră',
                        hh: t,
                        d: 'o zi',
                        dd: t,
                        w: 'o săptămână',
                        ww: t,
                        M: 'o lună',
                        MM: t,
                        y: 'un an',
                        yy: t,
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        878: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a) {
                    return 'm' === a
                        ? t
                            ? 'минута'
                            : 'минуту'
                        : e +
                              ' ' +
                              ((n = +e),
                              (s = {
                                  ss: t
                                      ? 'секунда_секунды_секунд'
                                      : 'секунду_секунды_секунд',
                                  mm: t
                                      ? 'минута_минуты_минут'
                                      : 'минуту_минуты_минут',
                                  hh: 'час_часа_часов',
                                  dd: 'день_дня_дней',
                                  ww: 'неделя_недели_недель',
                                  MM: 'месяц_месяца_месяцев',
                                  yy: 'год_года_лет',
                              }[a].split('_')),
                              n % 10 == 1 && n % 100 != 11
                                  ? s[0]
                                  : n % 10 >= 2 &&
                                    n % 10 <= 4 &&
                                    (n % 100 < 10 || n % 100 >= 20)
                                  ? s[1]
                                  : s[2]);
                    var n, s;
                }
                var a = [
                    /^янв/i,
                    /^фев/i,
                    /^мар/i,
                    /^апр/i,
                    /^ма[йя]/i,
                    /^июн/i,
                    /^июл/i,
                    /^авг/i,
                    /^сен/i,
                    /^окт/i,
                    /^ноя/i,
                    /^дек/i,
                ];
                e.defineLocale('ru', {
                    months: {
                        format: 'января_февраля_марта_апреля_мая_июня_июля_августа_сентября_октября_ноября_декабря'.split(
                            '_'
                        ),
                        standalone: 'январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь'.split(
                            '_'
                        ),
                    },
                    monthsShort: {
                        format: 'янв._февр._мар._апр._мая_июня_июля_авг._сент._окт._нояб._дек.'.split(
                            '_'
                        ),
                        standalone: 'янв._февр._март_апр._май_июнь_июль_авг._сент._окт._нояб._дек.'.split(
                            '_'
                        ),
                    },
                    weekdays: {
                        standalone: 'воскресенье_понедельник_вторник_среда_четверг_пятница_суббота'.split(
                            '_'
                        ),
                        format: 'воскресенье_понедельник_вторник_среду_четверг_пятницу_субботу'.split(
                            '_'
                        ),
                        isFormat: /\[ ?[Вв] ?(?:прошлую|следующую|эту)? ?] ?dddd/,
                    },
                    weekdaysShort: 'вс_пн_вт_ср_чт_пт_сб'.split('_'),
                    weekdaysMin: 'вс_пн_вт_ср_чт_пт_сб'.split('_'),
                    monthsParse: a,
                    longMonthsParse: a,
                    shortMonthsParse: a,
                    monthsRegex: /^(январ[ья]|янв\.?|феврал[ья]|февр?\.?|марта?|мар\.?|апрел[ья]|апр\.?|ма[йя]|июн[ья]|июн\.?|июл[ья]|июл\.?|августа?|авг\.?|сентябр[ья]|сент?\.?|октябр[ья]|окт\.?|ноябр[ья]|нояб?\.?|декабр[ья]|дек\.?)/i,
                    monthsShortRegex: /^(январ[ья]|янв\.?|феврал[ья]|февр?\.?|марта?|мар\.?|апрел[ья]|апр\.?|ма[йя]|июн[ья]|июн\.?|июл[ья]|июл\.?|августа?|авг\.?|сентябр[ья]|сент?\.?|октябр[ья]|окт\.?|ноябр[ья]|нояб?\.?|декабр[ья]|дек\.?)/i,
                    monthsStrictRegex: /^(январ[яь]|феврал[яь]|марта?|апрел[яь]|ма[яй]|июн[яь]|июл[яь]|августа?|сентябр[яь]|октябр[яь]|ноябр[яь]|декабр[яь])/i,
                    monthsShortStrictRegex: /^(янв\.|февр?\.|мар[т.]|апр\.|ма[яй]|июн[ья.]|июл[ья.]|авг\.|сент?\.|окт\.|нояб?\.|дек\.)/i,
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY г.',
                        LLL: 'D MMMM YYYY г., H:mm',
                        LLLL: 'dddd, D MMMM YYYY г., H:mm',
                    },
                    calendar: {
                        sameDay: '[Сегодня, в] LT',
                        nextDay: '[Завтра, в] LT',
                        lastDay: '[Вчера, в] LT',
                        nextWeek: function(e) {
                            if (e.week() === this.week())
                                return 2 === this.day()
                                    ? '[Во] dddd, [в] LT'
                                    : '[В] dddd, [в] LT';
                            switch (this.day()) {
                                case 0:
                                    return '[В следующее] dddd, [в] LT';
                                case 1:
                                case 2:
                                case 4:
                                    return '[В следующий] dddd, [в] LT';
                                case 3:
                                case 5:
                                case 6:
                                    return '[В следующую] dddd, [в] LT';
                            }
                        },
                        lastWeek: function(e) {
                            if (e.week() === this.week())
                                return 2 === this.day()
                                    ? '[Во] dddd, [в] LT'
                                    : '[В] dddd, [в] LT';
                            switch (this.day()) {
                                case 0:
                                    return '[В прошлое] dddd, [в] LT';
                                case 1:
                                case 2:
                                case 4:
                                    return '[В прошлый] dddd, [в] LT';
                                case 3:
                                case 5:
                                case 6:
                                    return '[В прошлую] dddd, [в] LT';
                            }
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'через %s',
                        past: '%s назад',
                        s: 'несколько секунд',
                        ss: t,
                        m: t,
                        mm: t,
                        h: 'час',
                        hh: t,
                        d: 'день',
                        dd: t,
                        w: 'неделя',
                        ww: t,
                        M: 'месяц',
                        MM: t,
                        y: 'год',
                        yy: t,
                    },
                    meridiemParse: /ночи|утра|дня|вечера/i,
                    isPM: function(e) {
                        return /^(дня|вечера)$/.test(e);
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'ночи'
                            : e < 12
                            ? 'утра'
                            : e < 17
                            ? 'дня'
                            : 'вечера';
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}-(й|го|я)/,
                    ordinal: function(e, t) {
                        switch (t) {
                            case 'M':
                            case 'd':
                            case 'DDD':
                                return e + '-й';
                            case 'D':
                                return e + '-го';
                            case 'w':
                            case 'W':
                                return e + '-я';
                            default:
                                return e;
                        }
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        93332: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = [
                        'جنوري',
                        'فيبروري',
                        'مارچ',
                        'اپريل',
                        'مئي',
                        'جون',
                        'جولاءِ',
                        'آگسٽ',
                        'سيپٽمبر',
                        'آڪٽوبر',
                        'نومبر',
                        'ڊسمبر',
                    ],
                    a = ['آچر', 'سومر', 'اڱارو', 'اربع', 'خميس', 'جمع', 'ڇنڇر'];
                e.defineLocale('sd', {
                    months: t,
                    monthsShort: t,
                    weekdays: a,
                    weekdaysShort: a,
                    weekdaysMin: a,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd، D MMMM YYYY HH:mm',
                    },
                    meridiemParse: /صبح|شام/,
                    isPM: function(e) {
                        return 'شام' === e;
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? 'صبح' : 'شام';
                    },
                    calendar: {
                        sameDay: '[اڄ] LT',
                        nextDay: '[سڀاڻي] LT',
                        nextWeek: 'dddd [اڳين هفتي تي] LT',
                        lastDay: '[ڪالهه] LT',
                        lastWeek: '[گزريل هفتي] dddd [تي] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s پوء',
                        past: '%s اڳ',
                        s: 'چند سيڪنڊ',
                        ss: '%d سيڪنڊ',
                        m: 'هڪ منٽ',
                        mm: '%d منٽ',
                        h: 'هڪ ڪلاڪ',
                        hh: '%d ڪلاڪ',
                        d: 'هڪ ڏينهن',
                        dd: '%d ڏينهن',
                        M: 'هڪ مهينو',
                        MM: '%d مهينا',
                        y: 'هڪ سال',
                        yy: '%d سال',
                    },
                    preparse: function(e) {
                        return e.replace(/،/g, ',');
                    },
                    postformat: function(e) {
                        return e.replace(/,/g, '،');
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        55268: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('se', {
                    months: 'ođđajagemánnu_guovvamánnu_njukčamánnu_cuoŋománnu_miessemánnu_geassemánnu_suoidnemánnu_borgemánnu_čakčamánnu_golggotmánnu_skábmamánnu_juovlamánnu'.split(
                        '_'
                    ),
                    monthsShort: 'ođđj_guov_njuk_cuo_mies_geas_suoi_borg_čakč_golg_skáb_juov'.split(
                        '_'
                    ),
                    weekdays: 'sotnabeaivi_vuossárga_maŋŋebárga_gaskavahkku_duorastat_bearjadat_lávvardat'.split(
                        '_'
                    ),
                    weekdaysShort: 'sotn_vuos_maŋ_gask_duor_bear_láv'.split(
                        '_'
                    ),
                    weekdaysMin: 's_v_m_g_d_b_L'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'MMMM D. [b.] YYYY',
                        LLL: 'MMMM D. [b.] YYYY [ti.] HH:mm',
                        LLLL: 'dddd, MMMM D. [b.] YYYY [ti.] HH:mm',
                    },
                    calendar: {
                        sameDay: '[otne ti] LT',
                        nextDay: '[ihttin ti] LT',
                        nextWeek: 'dddd [ti] LT',
                        lastDay: '[ikte ti] LT',
                        lastWeek: '[ovddit] dddd [ti] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s geažes',
                        past: 'maŋit %s',
                        s: 'moadde sekunddat',
                        ss: '%d sekunddat',
                        m: 'okta minuhta',
                        mm: '%d minuhtat',
                        h: 'okta diimmu',
                        hh: '%d diimmut',
                        d: 'okta beaivi',
                        dd: '%d beaivvit',
                        M: 'okta mánnu',
                        MM: '%d mánut',
                        y: 'okta jahki',
                        yy: '%d jagit',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        87050: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('si', {
                    months: 'ජනවාරි_පෙබරවාරි_මාර්තු_අප්‍රේල්_මැයි_ජූනි_ජූලි_අගෝස්තු_සැප්තැම්බර්_ඔක්තෝබර්_නොවැම්බර්_දෙසැම්බර්'.split(
                        '_'
                    ),
                    monthsShort: 'ජන_පෙබ_මාර්_අප්_මැයි_ජූනි_ජූලි_අගෝ_සැප්_ඔක්_නොවැ_දෙසැ'.split(
                        '_'
                    ),
                    weekdays: 'ඉරිදා_සඳුදා_අඟහරුවාදා_බදාදා_බ්‍රහස්පතින්දා_සිකුරාදා_සෙනසුරාදා'.split(
                        '_'
                    ),
                    weekdaysShort: 'ඉරි_සඳු_අඟ_බදා_බ්‍රහ_සිකු_සෙන'.split('_'),
                    weekdaysMin: 'ඉ_ස_අ_බ_බ්‍ර_සි_සෙ'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'a h:mm',
                        LTS: 'a h:mm:ss',
                        L: 'YYYY/MM/DD',
                        LL: 'YYYY MMMM D',
                        LLL: 'YYYY MMMM D, a h:mm',
                        LLLL: 'YYYY MMMM D [වැනි] dddd, a h:mm:ss',
                    },
                    calendar: {
                        sameDay: '[අද] LT[ට]',
                        nextDay: '[හෙට] LT[ට]',
                        nextWeek: 'dddd LT[ට]',
                        lastDay: '[ඊයේ] LT[ට]',
                        lastWeek: '[පසුගිය] dddd LT[ට]',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%sකින්',
                        past: '%sකට පෙර',
                        s: 'තත්පර කිහිපය',
                        ss: 'තත්පර %d',
                        m: 'මිනිත්තුව',
                        mm: 'මිනිත්තු %d',
                        h: 'පැය',
                        hh: 'පැය %d',
                        d: 'දිනය',
                        dd: 'දින %d',
                        M: 'මාසය',
                        MM: 'මාස %d',
                        y: 'වසර',
                        yy: 'වසර %d',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2} වැනි/,
                    ordinal: function(e) {
                        return e + ' වැනි';
                    },
                    meridiemParse: /පෙර වරු|පස් වරු|පෙ.ව|ප.ව./,
                    isPM: function(e) {
                        return 'ප.ව.' === e || 'පස් වරු' === e;
                    },
                    meridiem: function(e, t, a) {
                        return e > 11
                            ? a
                                ? 'ප.ව.'
                                : 'පස් වරු'
                            : a
                            ? 'පෙ.ව.'
                            : 'පෙර වරු';
                    },
                });
            })(a(37485));
        },
        46201: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = 'január_február_marec_apríl_máj_jún_júl_august_september_október_november_december'.split(
                        '_'
                    ),
                    a = 'jan_feb_mar_apr_máj_jún_júl_aug_sep_okt_nov_dec'.split(
                        '_'
                    );
                function n(e) {
                    return e > 1 && e < 5;
                }
                function s(e, t, a, s) {
                    var r = e + ' ';
                    switch (a) {
                        case 's':
                            return t || s ? 'pár sekúnd' : 'pár sekundami';
                        case 'ss':
                            return t || s
                                ? r + (n(e) ? 'sekundy' : 'sekúnd')
                                : r + 'sekundami';
                        case 'm':
                            return t ? 'minúta' : s ? 'minútu' : 'minútou';
                        case 'mm':
                            return t || s
                                ? r + (n(e) ? 'minúty' : 'minút')
                                : r + 'minútami';
                        case 'h':
                            return t ? 'hodina' : s ? 'hodinu' : 'hodinou';
                        case 'hh':
                            return t || s
                                ? r + (n(e) ? 'hodiny' : 'hodín')
                                : r + 'hodinami';
                        case 'd':
                            return t || s ? 'deň' : 'dňom';
                        case 'dd':
                            return t || s
                                ? r + (n(e) ? 'dni' : 'dní')
                                : r + 'dňami';
                        case 'M':
                            return t || s ? 'mesiac' : 'mesiacom';
                        case 'MM':
                            return t || s
                                ? r + (n(e) ? 'mesiace' : 'mesiacov')
                                : r + 'mesiacmi';
                        case 'y':
                            return t || s ? 'rok' : 'rokom';
                        case 'yy':
                            return t || s
                                ? r + (n(e) ? 'roky' : 'rokov')
                                : r + 'rokmi';
                    }
                }
                e.defineLocale('sk', {
                    months: t,
                    monthsShort: a,
                    weekdays: 'nedeľa_pondelok_utorok_streda_štvrtok_piatok_sobota'.split(
                        '_'
                    ),
                    weekdaysShort: 'ne_po_ut_st_št_pi_so'.split('_'),
                    weekdaysMin: 'ne_po_ut_st_št_pi_so'.split('_'),
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D. MMMM YYYY',
                        LLL: 'D. MMMM YYYY H:mm',
                        LLLL: 'dddd D. MMMM YYYY H:mm',
                    },
                    calendar: {
                        sameDay: '[dnes o] LT',
                        nextDay: '[zajtra o] LT',
                        nextWeek: function() {
                            switch (this.day()) {
                                case 0:
                                    return '[v nedeľu o] LT';
                                case 1:
                                case 2:
                                    return '[v] dddd [o] LT';
                                case 3:
                                    return '[v stredu o] LT';
                                case 4:
                                    return '[vo štvrtok o] LT';
                                case 5:
                                    return '[v piatok o] LT';
                                case 6:
                                    return '[v sobotu o] LT';
                            }
                        },
                        lastDay: '[včera o] LT',
                        lastWeek: function() {
                            switch (this.day()) {
                                case 0:
                                    return '[minulú nedeľu o] LT';
                                case 1:
                                case 2:
                                case 4:
                                case 5:
                                    return '[minulý] dddd [o] LT';
                                case 3:
                                    return '[minulú stredu o] LT';
                                case 6:
                                    return '[minulú sobotu o] LT';
                            }
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'za %s',
                        past: 'pred %s',
                        s,
                        ss: s,
                        m: s,
                        mm: s,
                        h: s,
                        hh: s,
                        d: s,
                        dd: s,
                        M: s,
                        MM: s,
                        y: s,
                        yy: s,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        96675: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a, n) {
                    var s = e + ' ';
                    switch (a) {
                        case 's':
                            return t || n ? 'nekaj sekund' : 'nekaj sekundami';
                        case 'ss':
                            return (
                                s +
                                (1 === e
                                    ? t
                                        ? 'sekundo'
                                        : 'sekundi'
                                    : 2 === e
                                    ? t || n
                                        ? 'sekundi'
                                        : 'sekundah'
                                    : e < 5
                                    ? t || n
                                        ? 'sekunde'
                                        : 'sekundah'
                                    : 'sekund')
                            );
                        case 'm':
                            return t ? 'ena minuta' : 'eno minuto';
                        case 'mm':
                            return (
                                s +
                                (1 === e
                                    ? t
                                        ? 'minuta'
                                        : 'minuto'
                                    : 2 === e
                                    ? t || n
                                        ? 'minuti'
                                        : 'minutama'
                                    : e < 5
                                    ? t || n
                                        ? 'minute'
                                        : 'minutami'
                                    : t || n
                                    ? 'minut'
                                    : 'minutami')
                            );
                        case 'h':
                            return t ? 'ena ura' : 'eno uro';
                        case 'hh':
                            return (
                                s +
                                (1 === e
                                    ? t
                                        ? 'ura'
                                        : 'uro'
                                    : 2 === e
                                    ? t || n
                                        ? 'uri'
                                        : 'urama'
                                    : e < 5
                                    ? t || n
                                        ? 'ure'
                                        : 'urami'
                                    : t || n
                                    ? 'ur'
                                    : 'urami')
                            );
                        case 'd':
                            return t || n ? 'en dan' : 'enim dnem';
                        case 'dd':
                            return (
                                s +
                                (1 === e
                                    ? t || n
                                        ? 'dan'
                                        : 'dnem'
                                    : 2 === e
                                    ? t || n
                                        ? 'dni'
                                        : 'dnevoma'
                                    : t || n
                                    ? 'dni'
                                    : 'dnevi')
                            );
                        case 'M':
                            return t || n ? 'en mesec' : 'enim mesecem';
                        case 'MM':
                            return (
                                s +
                                (1 === e
                                    ? t || n
                                        ? 'mesec'
                                        : 'mesecem'
                                    : 2 === e
                                    ? t || n
                                        ? 'meseca'
                                        : 'mesecema'
                                    : e < 5
                                    ? t || n
                                        ? 'mesece'
                                        : 'meseci'
                                    : t || n
                                    ? 'mesecev'
                                    : 'meseci')
                            );
                        case 'y':
                            return t || n ? 'eno leto' : 'enim letom';
                        case 'yy':
                            return (
                                s +
                                (1 === e
                                    ? t || n
                                        ? 'leto'
                                        : 'letom'
                                    : 2 === e
                                    ? t || n
                                        ? 'leti'
                                        : 'letoma'
                                    : e < 5
                                    ? t || n
                                        ? 'leta'
                                        : 'leti'
                                    : t || n
                                    ? 'let'
                                    : 'leti')
                            );
                    }
                }
                e.defineLocale('sl', {
                    months: 'januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december'.split(
                        '_'
                    ),
                    monthsShort: 'jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'nedelja_ponedeljek_torek_sreda_četrtek_petek_sobota'.split(
                        '_'
                    ),
                    weekdaysShort: 'ned._pon._tor._sre._čet._pet._sob.'.split(
                        '_'
                    ),
                    weekdaysMin: 'ne_po_to_sr_če_pe_so'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD. MM. YYYY',
                        LL: 'D. MMMM YYYY',
                        LLL: 'D. MMMM YYYY H:mm',
                        LLLL: 'dddd, D. MMMM YYYY H:mm',
                    },
                    calendar: {
                        sameDay: '[danes ob] LT',
                        nextDay: '[jutri ob] LT',
                        nextWeek: function() {
                            switch (this.day()) {
                                case 0:
                                    return '[v] [nedeljo] [ob] LT';
                                case 3:
                                    return '[v] [sredo] [ob] LT';
                                case 6:
                                    return '[v] [soboto] [ob] LT';
                                case 1:
                                case 2:
                                case 4:
                                case 5:
                                    return '[v] dddd [ob] LT';
                            }
                        },
                        lastDay: '[včeraj ob] LT',
                        lastWeek: function() {
                            switch (this.day()) {
                                case 0:
                                    return '[prejšnjo] [nedeljo] [ob] LT';
                                case 3:
                                    return '[prejšnjo] [sredo] [ob] LT';
                                case 6:
                                    return '[prejšnjo] [soboto] [ob] LT';
                                case 1:
                                case 2:
                                case 4:
                                case 5:
                                    return '[prejšnji] dddd [ob] LT';
                            }
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'čez %s',
                        past: 'pred %s',
                        s: t,
                        ss: t,
                        m: t,
                        mm: t,
                        h: t,
                        hh: t,
                        d: t,
                        dd: t,
                        M: t,
                        MM: t,
                        y: t,
                        yy: t,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        27632: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('sq', {
                    months: 'Janar_Shkurt_Mars_Prill_Maj_Qershor_Korrik_Gusht_Shtator_Tetor_Nëntor_Dhjetor'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Shk_Mar_Pri_Maj_Qer_Kor_Gus_Sht_Tet_Nën_Dhj'.split(
                        '_'
                    ),
                    weekdays: 'E Diel_E Hënë_E Martë_E Mërkurë_E Enjte_E Premte_E Shtunë'.split(
                        '_'
                    ),
                    weekdaysShort: 'Die_Hën_Mar_Mër_Enj_Pre_Sht'.split('_'),
                    weekdaysMin: 'D_H_Ma_Më_E_P_Sh'.split('_'),
                    weekdaysParseExact: !0,
                    meridiemParse: /PD|MD/,
                    isPM: function(e) {
                        return 'M' === e.charAt(0);
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? 'PD' : 'MD';
                    },
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Sot në] LT',
                        nextDay: '[Nesër në] LT',
                        nextWeek: 'dddd [në] LT',
                        lastDay: '[Dje në] LT',
                        lastWeek: 'dddd [e kaluar në] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'në %s',
                        past: '%s më parë',
                        s: 'disa sekonda',
                        ss: '%d sekonda',
                        m: 'një minutë',
                        mm: '%d minuta',
                        h: 'një orë',
                        hh: '%d orë',
                        d: 'një ditë',
                        dd: '%d ditë',
                        M: 'një muaj',
                        MM: '%d muaj',
                        y: 'një vit',
                        yy: '%d vite',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        40617: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                    words: {
                        ss: ['секунда', 'секунде', 'секунди'],
                        m: ['један минут', 'једног минута'],
                        mm: ['минут', 'минута', 'минута'],
                        h: ['један сат', 'једног сата'],
                        hh: ['сат', 'сата', 'сати'],
                        d: ['један дан', 'једног дана'],
                        dd: ['дан', 'дана', 'дана'],
                        M: ['један месец', 'једног месеца'],
                        MM: ['месец', 'месеца', 'месеци'],
                        y: ['једну годину', 'једне године'],
                        yy: ['годину', 'године', 'година'],
                    },
                    correctGrammaticalCase: function(e, t) {
                        return e % 10 >= 1 &&
                            e % 10 <= 4 &&
                            (e % 100 < 10 || e % 100 >= 20)
                            ? e % 10 == 1
                                ? t[0]
                                : t[1]
                            : t[2];
                    },
                    translate: function(e, a, n, s) {
                        var r,
                            i = t.words[n];
                        return 1 === n.length
                            ? 'y' === n && a
                                ? 'једна година'
                                : s || a
                                ? i[0]
                                : i[1]
                            : ((r = t.correctGrammaticalCase(e, i)),
                              'yy' === n && a && 'годину' === r
                                  ? e + ' година'
                                  : e + ' ' + r);
                    },
                };
                e.defineLocale('sr-cyrl', {
                    months: 'јануар_фебруар_март_април_мај_јун_јул_август_септембар_октобар_новембар_децембар'.split(
                        '_'
                    ),
                    monthsShort: 'јан._феб._мар._апр._мај_јун_јул_авг._сеп._окт._нов._дец.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'недеља_понедељак_уторак_среда_четвртак_петак_субота'.split(
                        '_'
                    ),
                    weekdaysShort: 'нед._пон._уто._сре._чет._пет._суб.'.split(
                        '_'
                    ),
                    weekdaysMin: 'не_по_ут_ср_че_пе_су'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'D. M. YYYY.',
                        LL: 'D. MMMM YYYY.',
                        LLL: 'D. MMMM YYYY. H:mm',
                        LLLL: 'dddd, D. MMMM YYYY. H:mm',
                    },
                    calendar: {
                        sameDay: '[данас у] LT',
                        nextDay: '[сутра у] LT',
                        nextWeek: function() {
                            switch (this.day()) {
                                case 0:
                                    return '[у] [недељу] [у] LT';
                                case 3:
                                    return '[у] [среду] [у] LT';
                                case 6:
                                    return '[у] [суботу] [у] LT';
                                case 1:
                                case 2:
                                case 4:
                                case 5:
                                    return '[у] dddd [у] LT';
                            }
                        },
                        lastDay: '[јуче у] LT',
                        lastWeek: function() {
                            return [
                                '[прошле] [недеље] [у] LT',
                                '[прошлог] [понедељка] [у] LT',
                                '[прошлог] [уторка] [у] LT',
                                '[прошле] [среде] [у] LT',
                                '[прошлог] [четвртка] [у] LT',
                                '[прошлог] [петка] [у] LT',
                                '[прошле] [суботе] [у] LT',
                            ][this.day()];
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'за %s',
                        past: 'пре %s',
                        s: 'неколико секунди',
                        ss: t.translate,
                        m: t.translate,
                        mm: t.translate,
                        h: t.translate,
                        hh: t.translate,
                        d: t.translate,
                        dd: t.translate,
                        M: t.translate,
                        MM: t.translate,
                        y: t.translate,
                        yy: t.translate,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        83419: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                    words: {
                        ss: ['sekunda', 'sekunde', 'sekundi'],
                        m: ['jedan minut', 'jednog minuta'],
                        mm: ['minut', 'minuta', 'minuta'],
                        h: ['jedan sat', 'jednog sata'],
                        hh: ['sat', 'sata', 'sati'],
                        d: ['jedan dan', 'jednog dana'],
                        dd: ['dan', 'dana', 'dana'],
                        M: ['jedan mesec', 'jednog meseca'],
                        MM: ['mesec', 'meseca', 'meseci'],
                        y: ['jednu godinu', 'jedne godine'],
                        yy: ['godinu', 'godine', 'godina'],
                    },
                    correctGrammaticalCase: function(e, t) {
                        return e % 10 >= 1 &&
                            e % 10 <= 4 &&
                            (e % 100 < 10 || e % 100 >= 20)
                            ? e % 10 == 1
                                ? t[0]
                                : t[1]
                            : t[2];
                    },
                    translate: function(e, a, n, s) {
                        var r,
                            i = t.words[n];
                        return 1 === n.length
                            ? 'y' === n && a
                                ? 'jedna godina'
                                : s || a
                                ? i[0]
                                : i[1]
                            : ((r = t.correctGrammaticalCase(e, i)),
                              'yy' === n && a && 'godinu' === r
                                  ? e + ' godina'
                                  : e + ' ' + r);
                    },
                };
                e.defineLocale('sr', {
                    months: 'januar_februar_mart_april_maj_jun_jul_avgust_septembar_oktobar_novembar_decembar'.split(
                        '_'
                    ),
                    monthsShort: 'jan._feb._mar._apr._maj_jun_jul_avg._sep._okt._nov._dec.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'nedelja_ponedeljak_utorak_sreda_četvrtak_petak_subota'.split(
                        '_'
                    ),
                    weekdaysShort: 'ned._pon._uto._sre._čet._pet._sub.'.split(
                        '_'
                    ),
                    weekdaysMin: 'ne_po_ut_sr_če_pe_su'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'D. M. YYYY.',
                        LL: 'D. MMMM YYYY.',
                        LLL: 'D. MMMM YYYY. H:mm',
                        LLLL: 'dddd, D. MMMM YYYY. H:mm',
                    },
                    calendar: {
                        sameDay: '[danas u] LT',
                        nextDay: '[sutra u] LT',
                        nextWeek: function() {
                            switch (this.day()) {
                                case 0:
                                    return '[u] [nedelju] [u] LT';
                                case 3:
                                    return '[u] [sredu] [u] LT';
                                case 6:
                                    return '[u] [subotu] [u] LT';
                                case 1:
                                case 2:
                                case 4:
                                case 5:
                                    return '[u] dddd [u] LT';
                            }
                        },
                        lastDay: '[juče u] LT',
                        lastWeek: function() {
                            return [
                                '[prošle] [nedelje] [u] LT',
                                '[prošlog] [ponedeljka] [u] LT',
                                '[prošlog] [utorka] [u] LT',
                                '[prošle] [srede] [u] LT',
                                '[prošlog] [četvrtka] [u] LT',
                                '[prošlog] [petka] [u] LT',
                                '[prošle] [subote] [u] LT',
                            ][this.day()];
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'za %s',
                        past: 'pre %s',
                        s: 'nekoliko sekundi',
                        ss: t.translate,
                        m: t.translate,
                        mm: t.translate,
                        h: t.translate,
                        hh: t.translate,
                        d: t.translate,
                        dd: t.translate,
                        M: t.translate,
                        MM: t.translate,
                        y: t.translate,
                        yy: t.translate,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        65321: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('ss', {
                    months: "Bhimbidvwane_Indlovana_Indlov'lenkhulu_Mabasa_Inkhwekhweti_Inhlaba_Kholwane_Ingci_Inyoni_Imphala_Lweti_Ingongoni".split(
                        '_'
                    ),
                    monthsShort: 'Bhi_Ina_Inu_Mab_Ink_Inh_Kho_Igc_Iny_Imp_Lwe_Igo'.split(
                        '_'
                    ),
                    weekdays: 'Lisontfo_Umsombuluko_Lesibili_Lesitsatfu_Lesine_Lesihlanu_Umgcibelo'.split(
                        '_'
                    ),
                    weekdaysShort: 'Lis_Umb_Lsb_Les_Lsi_Lsh_Umg'.split('_'),
                    weekdaysMin: 'Li_Us_Lb_Lt_Ls_Lh_Ug'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'h:mm A',
                        LTS: 'h:mm:ss A',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY h:mm A',
                        LLLL: 'dddd, D MMMM YYYY h:mm A',
                    },
                    calendar: {
                        sameDay: '[Namuhla nga] LT',
                        nextDay: '[Kusasa nga] LT',
                        nextWeek: 'dddd [nga] LT',
                        lastDay: '[Itolo nga] LT',
                        lastWeek: 'dddd [leliphelile] [nga] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'nga %s',
                        past: 'wenteka nga %s',
                        s: 'emizuzwana lomcane',
                        ss: '%d mzuzwana',
                        m: 'umzuzu',
                        mm: '%d emizuzu',
                        h: 'lihora',
                        hh: '%d emahora',
                        d: 'lilanga',
                        dd: '%d emalanga',
                        M: 'inyanga',
                        MM: '%d tinyanga',
                        y: 'umnyaka',
                        yy: '%d iminyaka',
                    },
                    meridiemParse: /ekuseni|emini|entsambama|ebusuku/,
                    meridiem: function(e, t, a) {
                        return e < 11
                            ? 'ekuseni'
                            : e < 15
                            ? 'emini'
                            : e < 19
                            ? 'entsambama'
                            : 'ebusuku';
                    },
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'ekuseni' === t
                                ? e
                                : 'emini' === t
                                ? e >= 11
                                    ? e
                                    : e + 12
                                : 'entsambama' === t || 'ebusuku' === t
                                ? 0 === e
                                    ? 0
                                    : e + 12
                                : void 0
                        );
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}/,
                    ordinal: '%d',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        52765: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('sv', {
                    months: 'januari_februari_mars_april_maj_juni_juli_augusti_september_oktober_november_december'.split(
                        '_'
                    ),
                    monthsShort: 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split(
                        '_'
                    ),
                    weekdays: 'söndag_måndag_tisdag_onsdag_torsdag_fredag_lördag'.split(
                        '_'
                    ),
                    weekdaysShort: 'sön_mån_tis_ons_tor_fre_lör'.split('_'),
                    weekdaysMin: 'sö_må_ti_on_to_fr_lö'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'YYYY-MM-DD',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY [kl.] HH:mm',
                        LLLL: 'dddd D MMMM YYYY [kl.] HH:mm',
                        lll: 'D MMM YYYY HH:mm',
                        llll: 'ddd D MMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Idag] LT',
                        nextDay: '[Imorgon] LT',
                        lastDay: '[Igår] LT',
                        nextWeek: '[På] dddd LT',
                        lastWeek: '[I] dddd[s] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'om %s',
                        past: 'för %s sedan',
                        s: 'några sekunder',
                        ss: '%d sekunder',
                        m: 'en minut',
                        mm: '%d minuter',
                        h: 'en timme',
                        hh: '%d timmar',
                        d: 'en dag',
                        dd: '%d dagar',
                        M: 'en månad',
                        MM: '%d månader',
                        y: 'ett år',
                        yy: '%d år',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(\:e|\:a)/,
                    ordinal: function(e) {
                        var t = e % 10;
                        return (
                            e +
                            (1 == ~~((e % 100) / 10)
                                ? ':e'
                                : 1 === t || 2 === t
                                ? ':a'
                                : ':e')
                        );
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        32831: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('sw', {
                    months: 'Januari_Februari_Machi_Aprili_Mei_Juni_Julai_Agosti_Septemba_Oktoba_Novemba_Desemba'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ago_Sep_Okt_Nov_Des'.split(
                        '_'
                    ),
                    weekdays: 'Jumapili_Jumatatu_Jumanne_Jumatano_Alhamisi_Ijumaa_Jumamosi'.split(
                        '_'
                    ),
                    weekdaysShort: 'Jpl_Jtat_Jnne_Jtan_Alh_Ijm_Jmos'.split('_'),
                    weekdaysMin: 'J2_J3_J4_J5_Al_Ij_J1'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'hh:mm A',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[leo saa] LT',
                        nextDay: '[kesho saa] LT',
                        nextWeek: '[wiki ijayo] dddd [saat] LT',
                        lastDay: '[jana] LT',
                        lastWeek: '[wiki iliyopita] dddd [saat] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s baadaye',
                        past: 'tokea %s',
                        s: 'hivi punde',
                        ss: 'sekunde %d',
                        m: 'dakika moja',
                        mm: 'dakika %d',
                        h: 'saa limoja',
                        hh: 'masaa %d',
                        d: 'siku moja',
                        dd: 'siku %d',
                        M: 'mwezi mmoja',
                        MM: 'miezi %d',
                        y: 'mwaka mmoja',
                        yy: 'miaka %d',
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        77530: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                        1: '௧',
                        2: '௨',
                        3: '௩',
                        4: '௪',
                        5: '௫',
                        6: '௬',
                        7: '௭',
                        8: '௮',
                        9: '௯',
                        0: '௦',
                    },
                    a = {
                        '௧': '1',
                        '௨': '2',
                        '௩': '3',
                        '௪': '4',
                        '௫': '5',
                        '௬': '6',
                        '௭': '7',
                        '௮': '8',
                        '௯': '9',
                        '௦': '0',
                    };
                e.defineLocale('ta', {
                    months: 'ஜனவரி_பிப்ரவரி_மார்ச்_ஏப்ரல்_மே_ஜூன்_ஜூலை_ஆகஸ்ட்_செப்டெம்பர்_அக்டோபர்_நவம்பர்_டிசம்பர்'.split(
                        '_'
                    ),
                    monthsShort: 'ஜனவரி_பிப்ரவரி_மார்ச்_ஏப்ரல்_மே_ஜூன்_ஜூலை_ஆகஸ்ட்_செப்டெம்பர்_அக்டோபர்_நவம்பர்_டிசம்பர்'.split(
                        '_'
                    ),
                    weekdays: 'ஞாயிற்றுக்கிழமை_திங்கட்கிழமை_செவ்வாய்கிழமை_புதன்கிழமை_வியாழக்கிழமை_வெள்ளிக்கிழமை_சனிக்கிழமை'.split(
                        '_'
                    ),
                    weekdaysShort: 'ஞாயிறு_திங்கள்_செவ்வாய்_புதன்_வியாழன்_வெள்ளி_சனி'.split(
                        '_'
                    ),
                    weekdaysMin: 'ஞா_தி_செ_பு_வி_வெ_ச'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY, HH:mm',
                        LLLL: 'dddd, D MMMM YYYY, HH:mm',
                    },
                    calendar: {
                        sameDay: '[இன்று] LT',
                        nextDay: '[நாளை] LT',
                        nextWeek: 'dddd, LT',
                        lastDay: '[நேற்று] LT',
                        lastWeek: '[கடந்த வாரம்] dddd, LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s இல்',
                        past: '%s முன்',
                        s: 'ஒரு சில விநாடிகள்',
                        ss: '%d விநாடிகள்',
                        m: 'ஒரு நிமிடம்',
                        mm: '%d நிமிடங்கள்',
                        h: 'ஒரு மணி நேரம்',
                        hh: '%d மணி நேரம்',
                        d: 'ஒரு நாள்',
                        dd: '%d நாட்கள்',
                        M: 'ஒரு மாதம்',
                        MM: '%d மாதங்கள்',
                        y: 'ஒரு வருடம்',
                        yy: '%d ஆண்டுகள்',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}வது/,
                    ordinal: function(e) {
                        return e + 'வது';
                    },
                    preparse: function(e) {
                        return e.replace(/[௧௨௩௪௫௬௭௮௯௦]/g, function(e) {
                            return a[e];
                        });
                    },
                    postformat: function(e) {
                        return e.replace(/\d/g, function(e) {
                            return t[e];
                        });
                    },
                    meridiemParse: /யாமம்|வைகறை|காலை|நண்பகல்|எற்பாடு|மாலை/,
                    meridiem: function(e, t, a) {
                        return e < 2
                            ? ' யாமம்'
                            : e < 6
                            ? ' வைகறை'
                            : e < 10
                            ? ' காலை'
                            : e < 14
                            ? ' நண்பகல்'
                            : e < 18
                            ? ' எற்பாடு'
                            : e < 22
                            ? ' மாலை'
                            : ' யாமம்';
                    },
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'யாமம்' === t
                                ? e < 2
                                    ? e
                                    : e + 12
                                : 'வைகறை' === t ||
                                  'காலை' === t ||
                                  ('நண்பகல்' === t && e >= 10)
                                ? e
                                : e + 12
                        );
                    },
                    week: { dow: 0, doy: 6 },
                });
            })(a(37485));
        },
        26726: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('te', {
                    months: 'జనవరి_ఫిబ్రవరి_మార్చి_ఏప్రిల్_మే_జూన్_జులై_ఆగస్టు_సెప్టెంబర్_అక్టోబర్_నవంబర్_డిసెంబర్'.split(
                        '_'
                    ),
                    monthsShort: 'జన._ఫిబ్ర._మార్చి_ఏప్రి._మే_జూన్_జులై_ఆగ._సెప్._అక్టో._నవ._డిసె.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'ఆదివారం_సోమవారం_మంగళవారం_బుధవారం_గురువారం_శుక్రవారం_శనివారం'.split(
                        '_'
                    ),
                    weekdaysShort: 'ఆది_సోమ_మంగళ_బుధ_గురు_శుక్ర_శని'.split('_'),
                    weekdaysMin: 'ఆ_సో_మం_బు_గు_శు_శ'.split('_'),
                    longDateFormat: {
                        LT: 'A h:mm',
                        LTS: 'A h:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY, A h:mm',
                        LLLL: 'dddd, D MMMM YYYY, A h:mm',
                    },
                    calendar: {
                        sameDay: '[నేడు] LT',
                        nextDay: '[రేపు] LT',
                        nextWeek: 'dddd, LT',
                        lastDay: '[నిన్న] LT',
                        lastWeek: '[గత] dddd, LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s లో',
                        past: '%s క్రితం',
                        s: 'కొన్ని క్షణాలు',
                        ss: '%d సెకన్లు',
                        m: 'ఒక నిమిషం',
                        mm: '%d నిమిషాలు',
                        h: 'ఒక గంట',
                        hh: '%d గంటలు',
                        d: 'ఒక రోజు',
                        dd: '%d రోజులు',
                        M: 'ఒక నెల',
                        MM: '%d నెలలు',
                        y: 'ఒక సంవత్సరం',
                        yy: '%d సంవత్సరాలు',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}వ/,
                    ordinal: '%dవ',
                    meridiemParse: /రాత్రి|ఉదయం|మధ్యాహ్నం|సాయంత్రం/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'రాత్రి' === t
                                ? e < 4
                                    ? e
                                    : e + 12
                                : 'ఉదయం' === t
                                ? e
                                : 'మధ్యాహ్నం' === t
                                ? e >= 10
                                    ? e
                                    : e + 12
                                : 'సాయంత్రం' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'రాత్రి'
                            : e < 10
                            ? 'ఉదయం'
                            : e < 17
                            ? 'మధ్యాహ్నం'
                            : e < 20
                            ? 'సాయంత్రం'
                            : 'రాత్రి';
                    },
                    week: { dow: 0, doy: 6 },
                });
            })(a(37485));
        },
        35763: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('tet', {
                    months: 'Janeiru_Fevereiru_Marsu_Abril_Maiu_Juñu_Jullu_Agustu_Setembru_Outubru_Novembru_Dezembru'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez'.split(
                        '_'
                    ),
                    weekdays: 'Domingu_Segunda_Tersa_Kuarta_Kinta_Sesta_Sabadu'.split(
                        '_'
                    ),
                    weekdaysShort: 'Dom_Seg_Ters_Kua_Kint_Sest_Sab'.split('_'),
                    weekdaysMin: 'Do_Seg_Te_Ku_Ki_Ses_Sa'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Ohin iha] LT',
                        nextDay: '[Aban iha] LT',
                        nextWeek: 'dddd [iha] LT',
                        lastDay: '[Horiseik iha] LT',
                        lastWeek: 'dddd [semana kotuk] [iha] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'iha %s',
                        past: '%s liuba',
                        s: 'segundu balun',
                        ss: 'segundu %d',
                        m: 'minutu ida',
                        mm: 'minutu %d',
                        h: 'oras ida',
                        hh: 'oras %d',
                        d: 'loron ida',
                        dd: 'loron %d',
                        M: 'fulan ida',
                        MM: 'fulan %d',
                        y: 'tinan ida',
                        yy: 'tinan %d',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
                    ordinal: function(e) {
                        var t = e % 10;
                        return (
                            e +
                            (1 == ~~((e % 100) / 10)
                                ? 'th'
                                : 1 === t
                                ? 'st'
                                : 2 === t
                                ? 'nd'
                                : 3 === t
                                ? 'rd'
                                : 'th')
                        );
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        48165: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                    0: '-ум',
                    1: '-ум',
                    2: '-юм',
                    3: '-юм',
                    4: '-ум',
                    5: '-ум',
                    6: '-ум',
                    7: '-ум',
                    8: '-ум',
                    9: '-ум',
                    10: '-ум',
                    12: '-ум',
                    13: '-ум',
                    20: '-ум',
                    30: '-юм',
                    40: '-ум',
                    50: '-ум',
                    60: '-ум',
                    70: '-ум',
                    80: '-ум',
                    90: '-ум',
                    100: '-ум',
                };
                e.defineLocale('tg', {
                    months: {
                        format: 'январи_феврали_марти_апрели_майи_июни_июли_августи_сентябри_октябри_ноябри_декабри'.split(
                            '_'
                        ),
                        standalone: 'январ_феврал_март_апрел_май_июн_июл_август_сентябр_октябр_ноябр_декабр'.split(
                            '_'
                        ),
                    },
                    monthsShort: 'янв_фев_мар_апр_май_июн_июл_авг_сен_окт_ноя_дек'.split(
                        '_'
                    ),
                    weekdays: 'якшанбе_душанбе_сешанбе_чоршанбе_панҷшанбе_ҷумъа_шанбе'.split(
                        '_'
                    ),
                    weekdaysShort: 'яшб_дшб_сшб_чшб_пшб_ҷум_шнб'.split('_'),
                    weekdaysMin: 'яш_дш_сш_чш_пш_ҷм_шб'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Имрӯз соати] LT',
                        nextDay: '[Фардо соати] LT',
                        lastDay: '[Дирӯз соати] LT',
                        nextWeek: 'dddd[и] [ҳафтаи оянда соати] LT',
                        lastWeek: 'dddd[и] [ҳафтаи гузашта соати] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'баъди %s',
                        past: '%s пеш',
                        s: 'якчанд сония',
                        m: 'як дақиқа',
                        mm: '%d дақиқа',
                        h: 'як соат',
                        hh: '%d соат',
                        d: 'як рӯз',
                        dd: '%d рӯз',
                        M: 'як моҳ',
                        MM: '%d моҳ',
                        y: 'як сол',
                        yy: '%d сол',
                    },
                    meridiemParse: /шаб|субҳ|рӯз|бегоҳ/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'шаб' === t
                                ? e < 4
                                    ? e
                                    : e + 12
                                : 'субҳ' === t
                                ? e
                                : 'рӯз' === t
                                ? e >= 11
                                    ? e
                                    : e + 12
                                : 'бегоҳ' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'шаб'
                            : e < 11
                            ? 'субҳ'
                            : e < 16
                            ? 'рӯз'
                            : e < 19
                            ? 'бегоҳ'
                            : 'шаб';
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}-(ум|юм)/,
                    ordinal: function(e) {
                        return (
                            e + (t[e] || t[e % 10] || t[e >= 100 ? 100 : null])
                        );
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        99496: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('th', {
                    months: 'มกราคม_กุมภาพันธ์_มีนาคม_เมษายน_พฤษภาคม_มิถุนายน_กรกฎาคม_สิงหาคม_กันยายน_ตุลาคม_พฤศจิกายน_ธันวาคม'.split(
                        '_'
                    ),
                    monthsShort: 'ม.ค._ก.พ._มี.ค._เม.ย._พ.ค._มิ.ย._ก.ค._ส.ค._ก.ย._ต.ค._พ.ย._ธ.ค.'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'อาทิตย์_จันทร์_อังคาร_พุธ_พฤหัสบดี_ศุกร์_เสาร์'.split(
                        '_'
                    ),
                    weekdaysShort: 'อาทิตย์_จันทร์_อังคาร_พุธ_พฤหัส_ศุกร์_เสาร์'.split(
                        '_'
                    ),
                    weekdaysMin: 'อา._จ._อ._พ._พฤ._ศ._ส.'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'H:mm',
                        LTS: 'H:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY เวลา H:mm',
                        LLLL: 'วันddddที่ D MMMM YYYY เวลา H:mm',
                    },
                    meridiemParse: /ก่อนเที่ยง|หลังเที่ยง/,
                    isPM: function(e) {
                        return 'หลังเที่ยง' === e;
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? 'ก่อนเที่ยง' : 'หลังเที่ยง';
                    },
                    calendar: {
                        sameDay: '[วันนี้ เวลา] LT',
                        nextDay: '[พรุ่งนี้ เวลา] LT',
                        nextWeek: 'dddd[หน้า เวลา] LT',
                        lastDay: '[เมื่อวานนี้ เวลา] LT',
                        lastWeek: '[วัน]dddd[ที่แล้ว เวลา] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'อีก %s',
                        past: '%sที่แล้ว',
                        s: 'ไม่กี่วินาที',
                        ss: '%d วินาที',
                        m: '1 นาที',
                        mm: '%d นาที',
                        h: '1 ชั่วโมง',
                        hh: '%d ชั่วโมง',
                        d: '1 วัน',
                        dd: '%d วัน',
                        w: '1 สัปดาห์',
                        ww: '%d สัปดาห์',
                        M: '1 เดือน',
                        MM: '%d เดือน',
                        y: '1 ปี',
                        yy: '%d ปี',
                    },
                });
            })(a(37485));
        },
        58573: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                    1: "'inji",
                    5: "'inji",
                    8: "'inji",
                    70: "'inji",
                    80: "'inji",
                    2: "'nji",
                    7: "'nji",
                    20: "'nji",
                    50: "'nji",
                    3: "'ünji",
                    4: "'ünji",
                    100: "'ünji",
                    6: "'njy",
                    9: "'unjy",
                    10: "'unjy",
                    30: "'unjy",
                    60: "'ynjy",
                    90: "'ynjy",
                };
                e.defineLocale('tk', {
                    months: 'Ýanwar_Fewral_Mart_Aprel_Maý_Iýun_Iýul_Awgust_Sentýabr_Oktýabr_Noýabr_Dekabr'.split(
                        '_'
                    ),
                    monthsShort: 'Ýan_Few_Mar_Apr_Maý_Iýn_Iýl_Awg_Sen_Okt_Noý_Dek'.split(
                        '_'
                    ),
                    weekdays: 'Ýekşenbe_Duşenbe_Sişenbe_Çarşenbe_Penşenbe_Anna_Şenbe'.split(
                        '_'
                    ),
                    weekdaysShort: 'Ýek_Duş_Siş_Çar_Pen_Ann_Şen'.split('_'),
                    weekdaysMin: 'Ýk_Dş_Sş_Çr_Pn_An_Şn'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[bugün sagat] LT',
                        nextDay: '[ertir sagat] LT',
                        nextWeek: '[indiki] dddd [sagat] LT',
                        lastDay: '[düýn] LT',
                        lastWeek: '[geçen] dddd [sagat] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s soň',
                        past: '%s öň',
                        s: 'birnäçe sekunt',
                        m: 'bir minut',
                        mm: '%d minut',
                        h: 'bir sagat',
                        hh: '%d sagat',
                        d: 'bir gün',
                        dd: '%d gün',
                        M: 'bir aý',
                        MM: '%d aý',
                        y: 'bir ýyl',
                        yy: '%d ýyl',
                    },
                    ordinal: function(e, a) {
                        switch (a) {
                            case 'd':
                            case 'D':
                            case 'Do':
                            case 'DD':
                                return e;
                            default:
                                if (0 === e) return e + "'unjy";
                                var n = e % 10;
                                return (
                                    e +
                                    (t[n] ||
                                        t[(e % 100) - n] ||
                                        t[e >= 100 ? 100 : null])
                                );
                        }
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        74742: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('tl-ph', {
                    months: 'Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre'.split(
                        '_'
                    ),
                    monthsShort: 'Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis'.split(
                        '_'
                    ),
                    weekdays: 'Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado'.split(
                        '_'
                    ),
                    weekdaysShort: 'Lin_Lun_Mar_Miy_Huw_Biy_Sab'.split('_'),
                    weekdaysMin: 'Li_Lu_Ma_Mi_Hu_Bi_Sab'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'MM/D/YYYY',
                        LL: 'MMMM D, YYYY',
                        LLL: 'MMMM D, YYYY HH:mm',
                        LLLL: 'dddd, MMMM DD, YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: 'LT [ngayong araw]',
                        nextDay: '[Bukas ng] LT',
                        nextWeek: 'LT [sa susunod na] dddd',
                        lastDay: 'LT [kahapon]',
                        lastWeek: 'LT [noong nakaraang] dddd',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'sa loob ng %s',
                        past: '%s ang nakalipas',
                        s: 'ilang segundo',
                        ss: '%d segundo',
                        m: 'isang minuto',
                        mm: '%d minuto',
                        h: 'isang oras',
                        hh: '%d oras',
                        d: 'isang araw',
                        dd: '%d araw',
                        M: 'isang buwan',
                        MM: '%d buwan',
                        y: 'isang taon',
                        yy: '%d taon',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}/,
                    ordinal: function(e) {
                        return e;
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        24780: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = 'pagh_wa’_cha’_wej_loS_vagh_jav_Soch_chorgh_Hut'.split(
                    '_'
                );
                function a(e, a, n, s) {
                    var r = (function(e) {
                        var a = Math.floor((e % 1e3) / 100),
                            n = Math.floor((e % 100) / 10),
                            s = e % 10,
                            r = '';
                        return (
                            a > 0 && (r += t[a] + 'vatlh'),
                            n > 0 &&
                                (r += ('' !== r ? ' ' : '') + t[n] + 'maH'),
                            s > 0 && (r += ('' !== r ? ' ' : '') + t[s]),
                            '' === r ? 'pagh' : r
                        );
                    })(e);
                    switch (n) {
                        case 'ss':
                            return r + ' lup';
                        case 'mm':
                            return r + ' tup';
                        case 'hh':
                            return r + ' rep';
                        case 'dd':
                            return r + ' jaj';
                        case 'MM':
                            return r + ' jar';
                        case 'yy':
                            return r + ' DIS';
                    }
                }
                e.defineLocale('tlh', {
                    months: 'tera’ jar wa’_tera’ jar cha’_tera’ jar wej_tera’ jar loS_tera’ jar vagh_tera’ jar jav_tera’ jar Soch_tera’ jar chorgh_tera’ jar Hut_tera’ jar wa’maH_tera’ jar wa’maH wa’_tera’ jar wa’maH cha’'.split(
                        '_'
                    ),
                    monthsShort: 'jar wa’_jar cha’_jar wej_jar loS_jar vagh_jar jav_jar Soch_jar chorgh_jar Hut_jar wa’maH_jar wa’maH wa’_jar wa’maH cha’'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj'.split(
                        '_'
                    ),
                    weekdaysShort: 'lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj'.split(
                        '_'
                    ),
                    weekdaysMin: 'lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj'.split(
                        '_'
                    ),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[DaHjaj] LT',
                        nextDay: '[wa’leS] LT',
                        nextWeek: 'LLL',
                        lastDay: '[wa’Hu’] LT',
                        lastWeek: 'LLL',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: function(e) {
                            var t = e;
                            return -1 !== e.indexOf('jaj')
                                ? t.slice(0, -3) + 'leS'
                                : -1 !== e.indexOf('jar')
                                ? t.slice(0, -3) + 'waQ'
                                : -1 !== e.indexOf('DIS')
                                ? t.slice(0, -3) + 'nem'
                                : t + ' pIq';
                        },
                        past: function(e) {
                            var t = e;
                            return -1 !== e.indexOf('jaj')
                                ? t.slice(0, -3) + 'Hu’'
                                : -1 !== e.indexOf('jar')
                                ? t.slice(0, -3) + 'wen'
                                : -1 !== e.indexOf('DIS')
                                ? t.slice(0, -3) + 'ben'
                                : t + ' ret';
                        },
                        s: 'puS lup',
                        ss: a,
                        m: 'wa’ tup',
                        mm: a,
                        h: 'wa’ rep',
                        hh: a,
                        d: 'wa’ jaj',
                        dd: a,
                        M: 'wa’ jar',
                        MM: a,
                        y: 'wa’ DIS',
                        yy: a,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        80835: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = {
                    1: "'inci",
                    5: "'inci",
                    8: "'inci",
                    70: "'inci",
                    80: "'inci",
                    2: "'nci",
                    7: "'nci",
                    20: "'nci",
                    50: "'nci",
                    3: "'üncü",
                    4: "'üncü",
                    100: "'üncü",
                    6: "'ncı",
                    9: "'uncu",
                    10: "'uncu",
                    30: "'uncu",
                    60: "'ıncı",
                    90: "'ıncı",
                };
                e.defineLocale('tr', {
                    months: 'Ocak_Şubat_Mart_Nisan_Mayıs_Haziran_Temmuz_Ağustos_Eylül_Ekim_Kasım_Aralık'.split(
                        '_'
                    ),
                    monthsShort: 'Oca_Şub_Mar_Nis_May_Haz_Tem_Ağu_Eyl_Eki_Kas_Ara'.split(
                        '_'
                    ),
                    weekdays: 'Pazar_Pazartesi_Salı_Çarşamba_Perşembe_Cuma_Cumartesi'.split(
                        '_'
                    ),
                    weekdaysShort: 'Paz_Pzt_Sal_Çar_Per_Cum_Cmt'.split('_'),
                    weekdaysMin: 'Pz_Pt_Sa_Ça_Pe_Cu_Ct'.split('_'),
                    meridiem: function(e, t, a) {
                        return e < 12 ? (a ? 'öö' : 'ÖÖ') : a ? 'ös' : 'ÖS';
                    },
                    meridiemParse: /öö|ÖÖ|ös|ÖS/,
                    isPM: function(e) {
                        return 'ös' === e || 'ÖS' === e;
                    },
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[bugün saat] LT',
                        nextDay: '[yarın saat] LT',
                        nextWeek: '[gelecek] dddd [saat] LT',
                        lastDay: '[dün] LT',
                        lastWeek: '[geçen] dddd [saat] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s sonra',
                        past: '%s önce',
                        s: 'birkaç saniye',
                        ss: '%d saniye',
                        m: 'bir dakika',
                        mm: '%d dakika',
                        h: 'bir saat',
                        hh: '%d saat',
                        d: 'bir gün',
                        dd: '%d gün',
                        w: 'bir hafta',
                        ww: '%d hafta',
                        M: 'bir ay',
                        MM: '%d ay',
                        y: 'bir yıl',
                        yy: '%d yıl',
                    },
                    ordinal: function(e, a) {
                        switch (a) {
                            case 'd':
                            case 'D':
                            case 'Do':
                            case 'DD':
                                return e;
                            default:
                                if (0 === e) return e + "'ıncı";
                                var n = e % 10;
                                return (
                                    e +
                                    (t[n] ||
                                        t[(e % 100) - n] ||
                                        t[e >= 100 ? 100 : null])
                                );
                        }
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        2840: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a, n) {
                    var s = {
                        s: ['viensas secunds', "'iensas secunds"],
                        ss: [e + ' secunds', e + ' secunds'],
                        m: ["'n míut", "'iens míut"],
                        mm: [e + ' míuts', e + ' míuts'],
                        h: ["'n þora", "'iensa þora"],
                        hh: [e + ' þoras', e + ' þoras'],
                        d: ["'n ziua", "'iensa ziua"],
                        dd: [e + ' ziuas', e + ' ziuas'],
                        M: ["'n mes", "'iens mes"],
                        MM: [e + ' mesen', e + ' mesen'],
                        y: ["'n ar", "'iens ar"],
                        yy: [e + ' ars', e + ' ars'],
                    };
                    return n || t ? s[a][0] : s[a][1];
                }
                e.defineLocale('tzl', {
                    months: 'Januar_Fevraglh_Març_Avrïu_Mai_Gün_Julia_Guscht_Setemvar_Listopäts_Noemvar_Zecemvar'.split(
                        '_'
                    ),
                    monthsShort: 'Jan_Fev_Mar_Avr_Mai_Gün_Jul_Gus_Set_Lis_Noe_Zec'.split(
                        '_'
                    ),
                    weekdays: 'Súladi_Lúneçi_Maitzi_Márcuri_Xhúadi_Viénerçi_Sáturi'.split(
                        '_'
                    ),
                    weekdaysShort: 'Súl_Lún_Mai_Már_Xhú_Vié_Sát'.split('_'),
                    weekdaysMin: 'Sú_Lú_Ma_Má_Xh_Vi_Sá'.split('_'),
                    longDateFormat: {
                        LT: 'HH.mm',
                        LTS: 'HH.mm.ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D. MMMM [dallas] YYYY',
                        LLL: 'D. MMMM [dallas] YYYY HH.mm',
                        LLLL: 'dddd, [li] D. MMMM [dallas] YYYY HH.mm',
                    },
                    meridiemParse: /d\'o|d\'a/i,
                    isPM: function(e) {
                        return "d'o" === e.toLowerCase();
                    },
                    meridiem: function(e, t, a) {
                        return e > 11 ? (a ? "d'o" : "D'O") : a ? "d'a" : "D'A";
                    },
                    calendar: {
                        sameDay: '[oxhi à] LT',
                        nextDay: '[demà à] LT',
                        nextWeek: 'dddd [à] LT',
                        lastDay: '[ieiri à] LT',
                        lastWeek: '[sür el] dddd [lasteu à] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'osprei %s',
                        past: 'ja%s',
                        s: t,
                        ss: t,
                        m: t,
                        mm: t,
                        h: t,
                        hh: t,
                        d: t,
                        dd: t,
                        M: t,
                        MM: t,
                        y: t,
                        yy: t,
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}\./,
                    ordinal: '%d.',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        70442: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('tzm-latn', {
                    months: 'innayr_brˤayrˤ_marˤsˤ_ibrir_mayyw_ywnyw_ywlywz_ɣwšt_šwtanbir_ktˤwbrˤ_nwwanbir_dwjnbir'.split(
                        '_'
                    ),
                    monthsShort: 'innayr_brˤayrˤ_marˤsˤ_ibrir_mayyw_ywnyw_ywlywz_ɣwšt_šwtanbir_ktˤwbrˤ_nwwanbir_dwjnbir'.split(
                        '_'
                    ),
                    weekdays: 'asamas_aynas_asinas_akras_akwas_asimwas_asiḍyas'.split(
                        '_'
                    ),
                    weekdaysShort: 'asamas_aynas_asinas_akras_akwas_asimwas_asiḍyas'.split(
                        '_'
                    ),
                    weekdaysMin: 'asamas_aynas_asinas_akras_akwas_asimwas_asiḍyas'.split(
                        '_'
                    ),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[asdkh g] LT',
                        nextDay: '[aska g] LT',
                        nextWeek: 'dddd [g] LT',
                        lastDay: '[assant g] LT',
                        lastWeek: 'dddd [g] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'dadkh s yan %s',
                        past: 'yan %s',
                        s: 'imik',
                        ss: '%d imik',
                        m: 'minuḍ',
                        mm: '%d minuḍ',
                        h: 'saɛa',
                        hh: '%d tassaɛin',
                        d: 'ass',
                        dd: '%d ossan',
                        M: 'ayowr',
                        MM: '%d iyyirn',
                        y: 'asgas',
                        yy: '%d isgasn',
                    },
                    week: { dow: 6, doy: 12 },
                });
            })(a(37485));
        },
        66757: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('tzm', {
                    months: 'ⵉⵏⵏⴰⵢⵔ_ⴱⵕⴰⵢⵕ_ⵎⴰⵕⵚ_ⵉⴱⵔⵉⵔ_ⵎⴰⵢⵢⵓ_ⵢⵓⵏⵢⵓ_ⵢⵓⵍⵢⵓⵣ_ⵖⵓⵛⵜ_ⵛⵓⵜⴰⵏⴱⵉⵔ_ⴽⵟⵓⴱⵕ_ⵏⵓⵡⴰⵏⴱⵉⵔ_ⴷⵓⵊⵏⴱⵉⵔ'.split(
                        '_'
                    ),
                    monthsShort: 'ⵉⵏⵏⴰⵢⵔ_ⴱⵕⴰⵢⵕ_ⵎⴰⵕⵚ_ⵉⴱⵔⵉⵔ_ⵎⴰⵢⵢⵓ_ⵢⵓⵏⵢⵓ_ⵢⵓⵍⵢⵓⵣ_ⵖⵓⵛⵜ_ⵛⵓⵜⴰⵏⴱⵉⵔ_ⴽⵟⵓⴱⵕ_ⵏⵓⵡⴰⵏⴱⵉⵔ_ⴷⵓⵊⵏⴱⵉⵔ'.split(
                        '_'
                    ),
                    weekdays: 'ⴰⵙⴰⵎⴰⵙ_ⴰⵢⵏⴰⵙ_ⴰⵙⵉⵏⴰⵙ_ⴰⴽⵔⴰⵙ_ⴰⴽⵡⴰⵙ_ⴰⵙⵉⵎⵡⴰⵙ_ⴰⵙⵉⴹⵢⴰⵙ'.split(
                        '_'
                    ),
                    weekdaysShort: 'ⴰⵙⴰⵎⴰⵙ_ⴰⵢⵏⴰⵙ_ⴰⵙⵉⵏⴰⵙ_ⴰⴽⵔⴰⵙ_ⴰⴽⵡⴰⵙ_ⴰⵙⵉⵎⵡⴰⵙ_ⴰⵙⵉⴹⵢⴰⵙ'.split(
                        '_'
                    ),
                    weekdaysMin: 'ⴰⵙⴰⵎⴰⵙ_ⴰⵢⵏⴰⵙ_ⴰⵙⵉⵏⴰⵙ_ⴰⴽⵔⴰⵙ_ⴰⴽⵡⴰⵙ_ⴰⵙⵉⵎⵡⴰⵙ_ⴰⵙⵉⴹⵢⴰⵙ'.split(
                        '_'
                    ),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[ⴰⵙⴷⵅ ⴴ] LT',
                        nextDay: '[ⴰⵙⴽⴰ ⴴ] LT',
                        nextWeek: 'dddd [ⴴ] LT',
                        lastDay: '[ⴰⵚⴰⵏⵜ ⴴ] LT',
                        lastWeek: 'dddd [ⴴ] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'ⴷⴰⴷⵅ ⵙ ⵢⴰⵏ %s',
                        past: 'ⵢⴰⵏ %s',
                        s: 'ⵉⵎⵉⴽ',
                        ss: '%d ⵉⵎⵉⴽ',
                        m: 'ⵎⵉⵏⵓⴺ',
                        mm: '%d ⵎⵉⵏⵓⴺ',
                        h: 'ⵙⴰⵄⴰ',
                        hh: '%d ⵜⴰⵙⵙⴰⵄⵉⵏ',
                        d: 'ⴰⵙⵙ',
                        dd: '%d oⵙⵙⴰⵏ',
                        M: 'ⴰⵢoⵓⵔ',
                        MM: '%d ⵉⵢⵢⵉⵔⵏ',
                        y: 'ⴰⵙⴳⴰⵙ',
                        yy: '%d ⵉⵙⴳⴰⵙⵏ',
                    },
                    week: { dow: 6, doy: 12 },
                });
            })(a(37485));
        },
        64413: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('ug-cn', {
                    months: 'يانۋار_فېۋرال_مارت_ئاپرېل_ماي_ئىيۇن_ئىيۇل_ئاۋغۇست_سېنتەبىر_ئۆكتەبىر_نويابىر_دېكابىر'.split(
                        '_'
                    ),
                    monthsShort: 'يانۋار_فېۋرال_مارت_ئاپرېل_ماي_ئىيۇن_ئىيۇل_ئاۋغۇست_سېنتەبىر_ئۆكتەبىر_نويابىر_دېكابىر'.split(
                        '_'
                    ),
                    weekdays: 'يەكشەنبە_دۈشەنبە_سەيشەنبە_چارشەنبە_پەيشەنبە_جۈمە_شەنبە'.split(
                        '_'
                    ),
                    weekdaysShort: 'يە_دۈ_سە_چا_پە_جۈ_شە'.split('_'),
                    weekdaysMin: 'يە_دۈ_سە_چا_پە_جۈ_شە'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'YYYY-MM-DD',
                        LL: 'YYYY-يىلىM-ئاينىڭD-كۈنى',
                        LLL: 'YYYY-يىلىM-ئاينىڭD-كۈنى، HH:mm',
                        LLLL: 'dddd، YYYY-يىلىM-ئاينىڭD-كۈنى، HH:mm',
                    },
                    meridiemParse: /يېرىم كېچە|سەھەر|چۈشتىن بۇرۇن|چۈش|چۈشتىن كېيىن|كەچ/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            'يېرىم كېچە' === t ||
                            'سەھەر' === t ||
                            'چۈشتىن بۇرۇن' === t
                                ? e
                                : 'چۈشتىن كېيىن' === t || 'كەچ' === t
                                ? e + 12
                                : e >= 11
                                ? e
                                : e + 12
                        );
                    },
                    meridiem: function(e, t, a) {
                        var n = 100 * e + t;
                        return n < 600
                            ? 'يېرىم كېچە'
                            : n < 900
                            ? 'سەھەر'
                            : n < 1130
                            ? 'چۈشتىن بۇرۇن'
                            : n < 1230
                            ? 'چۈش'
                            : n < 1800
                            ? 'چۈشتىن كېيىن'
                            : 'كەچ';
                    },
                    calendar: {
                        sameDay: '[بۈگۈن سائەت] LT',
                        nextDay: '[ئەتە سائەت] LT',
                        nextWeek: '[كېلەركى] dddd [سائەت] LT',
                        lastDay: '[تۆنۈگۈن] LT',
                        lastWeek: '[ئالدىنقى] dddd [سائەت] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s كېيىن',
                        past: '%s بۇرۇن',
                        s: 'نەچچە سېكونت',
                        ss: '%d سېكونت',
                        m: 'بىر مىنۇت',
                        mm: '%d مىنۇت',
                        h: 'بىر سائەت',
                        hh: '%d سائەت',
                        d: 'بىر كۈن',
                        dd: '%d كۈن',
                        M: 'بىر ئاي',
                        MM: '%d ئاي',
                        y: 'بىر يىل',
                        yy: '%d يىل',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(-كۈنى|-ئاي|-ھەپتە)/,
                    ordinal: function(e, t) {
                        switch (t) {
                            case 'd':
                            case 'D':
                            case 'DDD':
                                return e + '-كۈنى';
                            case 'w':
                            case 'W':
                                return e + '-ھەپتە';
                            default:
                                return e;
                        }
                    },
                    preparse: function(e) {
                        return e.replace(/،/g, ',');
                    },
                    postformat: function(e) {
                        return e.replace(/,/g, '،');
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        64800: function(e, t, a) {
            !(function(e) {
                'use strict';
                function t(e, t, a) {
                    return 'm' === a
                        ? t
                            ? 'хвилина'
                            : 'хвилину'
                        : 'h' === a
                        ? t
                            ? 'година'
                            : 'годину'
                        : e +
                          ' ' +
                          ((n = +e),
                          (s = {
                              ss: t
                                  ? 'секунда_секунди_секунд'
                                  : 'секунду_секунди_секунд',
                              mm: t
                                  ? 'хвилина_хвилини_хвилин'
                                  : 'хвилину_хвилини_хвилин',
                              hh: t
                                  ? 'година_години_годин'
                                  : 'годину_години_годин',
                              dd: 'день_дні_днів',
                              MM: 'місяць_місяці_місяців',
                              yy: 'рік_роки_років',
                          }[a].split('_')),
                          n % 10 == 1 && n % 100 != 11
                              ? s[0]
                              : n % 10 >= 2 &&
                                n % 10 <= 4 &&
                                (n % 100 < 10 || n % 100 >= 20)
                              ? s[1]
                              : s[2]);
                    var n, s;
                }
                function a(e) {
                    return function() {
                        return (
                            e + 'о' + (11 === this.hours() ? 'б' : '') + '] LT'
                        );
                    };
                }
                e.defineLocale('uk', {
                    months: {
                        format: 'січня_лютого_березня_квітня_травня_червня_липня_серпня_вересня_жовтня_листопада_грудня'.split(
                            '_'
                        ),
                        standalone: 'січень_лютий_березень_квітень_травень_червень_липень_серпень_вересень_жовтень_листопад_грудень'.split(
                            '_'
                        ),
                    },
                    monthsShort: 'січ_лют_бер_квіт_трав_черв_лип_серп_вер_жовт_лист_груд'.split(
                        '_'
                    ),
                    weekdays: function(e, t) {
                        var a = {
                            nominative: 'неділя_понеділок_вівторок_середа_четвер_п’ятниця_субота'.split(
                                '_'
                            ),
                            accusative: 'неділю_понеділок_вівторок_середу_четвер_п’ятницю_суботу'.split(
                                '_'
                            ),
                            genitive: 'неділі_понеділка_вівторка_середи_четверга_п’ятниці_суботи'.split(
                                '_'
                            ),
                        };
                        return !0 === e
                            ? a.nominative
                                  .slice(1, 7)
                                  .concat(a.nominative.slice(0, 1))
                            : e
                            ? a[
                                  /(\[[ВвУу]\]) ?dddd/.test(t)
                                      ? 'accusative'
                                      : /\[?(?:минулої|наступної)? ?\] ?dddd/.test(
                                            t
                                        )
                                      ? 'genitive'
                                      : 'nominative'
                              ][e.day()]
                            : a.nominative;
                    },
                    weekdaysShort: 'нд_пн_вт_ср_чт_пт_сб'.split('_'),
                    weekdaysMin: 'нд_пн_вт_ср_чт_пт_сб'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'D MMMM YYYY р.',
                        LLL: 'D MMMM YYYY р., HH:mm',
                        LLLL: 'dddd, D MMMM YYYY р., HH:mm',
                    },
                    calendar: {
                        sameDay: a('[Сьогодні '),
                        nextDay: a('[Завтра '),
                        lastDay: a('[Вчора '),
                        nextWeek: a('[У] dddd ['),
                        lastWeek: function() {
                            switch (this.day()) {
                                case 0:
                                case 3:
                                case 5:
                                case 6:
                                    return a('[Минулої] dddd [').call(this);
                                case 1:
                                case 2:
                                case 4:
                                    return a('[Минулого] dddd [').call(this);
                            }
                        },
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'за %s',
                        past: '%s тому',
                        s: 'декілька секунд',
                        ss: t,
                        m: t,
                        mm: t,
                        h: 'годину',
                        hh: t,
                        d: 'день',
                        dd: t,
                        M: 'місяць',
                        MM: t,
                        y: 'рік',
                        yy: t,
                    },
                    meridiemParse: /ночі|ранку|дня|вечора/,
                    isPM: function(e) {
                        return /^(дня|вечора)$/.test(e);
                    },
                    meridiem: function(e, t, a) {
                        return e < 4
                            ? 'ночі'
                            : e < 12
                            ? 'ранку'
                            : e < 17
                            ? 'дня'
                            : 'вечора';
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}-(й|го)/,
                    ordinal: function(e, t) {
                        switch (t) {
                            case 'M':
                            case 'd':
                            case 'DDD':
                            case 'w':
                            case 'W':
                                return e + '-й';
                            case 'D':
                                return e + '-го';
                            default:
                                return e;
                        }
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        61809: function(e, t, a) {
            !(function(e) {
                'use strict';
                var t = [
                        'جنوری',
                        'فروری',
                        'مارچ',
                        'اپریل',
                        'مئی',
                        'جون',
                        'جولائی',
                        'اگست',
                        'ستمبر',
                        'اکتوبر',
                        'نومبر',
                        'دسمبر',
                    ],
                    a = [
                        'اتوار',
                        'پیر',
                        'منگل',
                        'بدھ',
                        'جمعرات',
                        'جمعہ',
                        'ہفتہ',
                    ];
                e.defineLocale('ur', {
                    months: t,
                    monthsShort: t,
                    weekdays: a,
                    weekdaysShort: a,
                    weekdaysMin: a,
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd، D MMMM YYYY HH:mm',
                    },
                    meridiemParse: /صبح|شام/,
                    isPM: function(e) {
                        return 'شام' === e;
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? 'صبح' : 'شام';
                    },
                    calendar: {
                        sameDay: '[آج بوقت] LT',
                        nextDay: '[کل بوقت] LT',
                        nextWeek: 'dddd [بوقت] LT',
                        lastDay: '[گذشتہ روز بوقت] LT',
                        lastWeek: '[گذشتہ] dddd [بوقت] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s بعد',
                        past: '%s قبل',
                        s: 'چند سیکنڈ',
                        ss: '%d سیکنڈ',
                        m: 'ایک منٹ',
                        mm: '%d منٹ',
                        h: 'ایک گھنٹہ',
                        hh: '%d گھنٹے',
                        d: 'ایک دن',
                        dd: '%d دن',
                        M: 'ایک ماہ',
                        MM: '%d ماہ',
                        y: 'ایک سال',
                        yy: '%d سال',
                    },
                    preparse: function(e) {
                        return e.replace(/،/g, ',');
                    },
                    postformat: function(e) {
                        return e.replace(/,/g, '،');
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        63337: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('uz-latn', {
                    months: 'Yanvar_Fevral_Mart_Aprel_May_Iyun_Iyul_Avgust_Sentabr_Oktabr_Noyabr_Dekabr'.split(
                        '_'
                    ),
                    monthsShort: 'Yan_Fev_Mar_Apr_May_Iyun_Iyul_Avg_Sen_Okt_Noy_Dek'.split(
                        '_'
                    ),
                    weekdays: 'Yakshanba_Dushanba_Seshanba_Chorshanba_Payshanba_Juma_Shanba'.split(
                        '_'
                    ),
                    weekdaysShort: 'Yak_Dush_Sesh_Chor_Pay_Jum_Shan'.split('_'),
                    weekdaysMin: 'Ya_Du_Se_Cho_Pa_Ju_Sha'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'D MMMM YYYY, dddd HH:mm',
                    },
                    calendar: {
                        sameDay: '[Bugun soat] LT [da]',
                        nextDay: '[Ertaga] LT [da]',
                        nextWeek: 'dddd [kuni soat] LT [da]',
                        lastDay: '[Kecha soat] LT [da]',
                        lastWeek: "[O'tgan] dddd [kuni soat] LT [da]",
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'Yaqin %s ichida',
                        past: 'Bir necha %s oldin',
                        s: 'soniya',
                        ss: '%d soniya',
                        m: 'bir daqiqa',
                        mm: '%d daqiqa',
                        h: 'bir soat',
                        hh: '%d soat',
                        d: 'bir kun',
                        dd: '%d kun',
                        M: 'bir oy',
                        MM: '%d oy',
                        y: 'bir yil',
                        yy: '%d yil',
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        37448: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('uz', {
                    months: 'январ_феврал_март_апрел_май_июн_июл_август_сентябр_октябр_ноябр_декабр'.split(
                        '_'
                    ),
                    monthsShort: 'янв_фев_мар_апр_май_июн_июл_авг_сен_окт_ноя_дек'.split(
                        '_'
                    ),
                    weekdays: 'Якшанба_Душанба_Сешанба_Чоршанба_Пайшанба_Жума_Шанба'.split(
                        '_'
                    ),
                    weekdaysShort: 'Якш_Душ_Сеш_Чор_Пай_Жум_Шан'.split('_'),
                    weekdaysMin: 'Як_Ду_Се_Чо_Па_Жу_Ша'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'D MMMM YYYY, dddd HH:mm',
                    },
                    calendar: {
                        sameDay: '[Бугун соат] LT [да]',
                        nextDay: '[Эртага] LT [да]',
                        nextWeek: 'dddd [куни соат] LT [да]',
                        lastDay: '[Кеча соат] LT [да]',
                        lastWeek: '[Утган] dddd [куни соат] LT [да]',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'Якин %s ичида',
                        past: 'Бир неча %s олдин',
                        s: 'фурсат',
                        ss: '%d фурсат',
                        m: 'бир дакика',
                        mm: '%d дакика',
                        h: 'бир соат',
                        hh: '%d соат',
                        d: 'бир кун',
                        dd: '%d кун',
                        M: 'бир ой',
                        MM: '%d ой',
                        y: 'бир йил',
                        yy: '%d йил',
                    },
                    week: { dow: 1, doy: 7 },
                });
            })(a(37485));
        },
        83528: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('vi', {
                    months: 'tháng 1_tháng 2_tháng 3_tháng 4_tháng 5_tháng 6_tháng 7_tháng 8_tháng 9_tháng 10_tháng 11_tháng 12'.split(
                        '_'
                    ),
                    monthsShort: 'Thg 01_Thg 02_Thg 03_Thg 04_Thg 05_Thg 06_Thg 07_Thg 08_Thg 09_Thg 10_Thg 11_Thg 12'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'chủ nhật_thứ hai_thứ ba_thứ tư_thứ năm_thứ sáu_thứ bảy'.split(
                        '_'
                    ),
                    weekdaysShort: 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
                    weekdaysMin: 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
                    weekdaysParseExact: !0,
                    meridiemParse: /sa|ch/i,
                    isPM: function(e) {
                        return /^ch$/i.test(e);
                    },
                    meridiem: function(e, t, a) {
                        return e < 12 ? (a ? 'sa' : 'SA') : a ? 'ch' : 'CH';
                    },
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM [năm] YYYY',
                        LLL: 'D MMMM [năm] YYYY HH:mm',
                        LLLL: 'dddd, D MMMM [năm] YYYY HH:mm',
                        l: 'DD/M/YYYY',
                        ll: 'D MMM YYYY',
                        lll: 'D MMM YYYY HH:mm',
                        llll: 'ddd, D MMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[Hôm nay lúc] LT',
                        nextDay: '[Ngày mai lúc] LT',
                        nextWeek: 'dddd [tuần tới lúc] LT',
                        lastDay: '[Hôm qua lúc] LT',
                        lastWeek: 'dddd [tuần trước lúc] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: '%s tới',
                        past: '%s trước',
                        s: 'vài giây',
                        ss: '%d giây',
                        m: 'một phút',
                        mm: '%d phút',
                        h: 'một giờ',
                        hh: '%d giờ',
                        d: 'một ngày',
                        dd: '%d ngày',
                        w: 'một tuần',
                        ww: '%d tuần',
                        M: 'một tháng',
                        MM: '%d tháng',
                        y: 'một năm',
                        yy: '%d năm',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}/,
                    ordinal: function(e) {
                        return e;
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        1301: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('x-pseudo', {
                    months: 'J~áñúá~rý_F~ébrú~árý_~Márc~h_Áp~ríl_~Máý_~Júñé~_Júl~ý_Áú~gúst~_Sép~témb~ér_Ó~ctób~ér_Ñ~óvém~bér_~Décé~mbér'.split(
                        '_'
                    ),
                    monthsShort: 'J~áñ_~Féb_~Már_~Ápr_~Máý_~Júñ_~Júl_~Áúg_~Sép_~Óct_~Ñóv_~Déc'.split(
                        '_'
                    ),
                    monthsParseExact: !0,
                    weekdays: 'S~úñdá~ý_Mó~ñdáý~_Túé~sdáý~_Wéd~ñésd~áý_T~húrs~dáý_~Fríd~áý_S~átúr~dáý'.split(
                        '_'
                    ),
                    weekdaysShort: 'S~úñ_~Móñ_~Túé_~Wéd_~Thú_~Frí_~Sát'.split(
                        '_'
                    ),
                    weekdaysMin: 'S~ú_Mó~_Tú_~Wé_T~h_Fr~_Sá'.split('_'),
                    weekdaysParseExact: !0,
                    longDateFormat: {
                        LT: 'HH:mm',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY HH:mm',
                        LLLL: 'dddd, D MMMM YYYY HH:mm',
                    },
                    calendar: {
                        sameDay: '[T~ódá~ý át] LT',
                        nextDay: '[T~ómó~rró~w át] LT',
                        nextWeek: 'dddd [át] LT',
                        lastDay: '[Ý~ést~érdá~ý át] LT',
                        lastWeek: '[L~ást] dddd [át] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'í~ñ %s',
                        past: '%s á~gó',
                        s: 'á ~féw ~sécó~ñds',
                        ss: '%d s~écóñ~ds',
                        m: 'á ~míñ~úté',
                        mm: '%d m~íñú~tés',
                        h: 'á~ñ hó~úr',
                        hh: '%d h~óúrs',
                        d: 'á ~dáý',
                        dd: '%d d~áýs',
                        M: 'á ~móñ~th',
                        MM: '%d m~óñt~hs',
                        y: 'á ~ýéár',
                        yy: '%d ý~éárs',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
                    ordinal: function(e) {
                        var t = e % 10;
                        return (
                            e +
                            (1 == ~~((e % 100) / 10)
                                ? 'th'
                                : 1 === t
                                ? 'st'
                                : 2 === t
                                ? 'nd'
                                : 3 === t
                                ? 'rd'
                                : 'th')
                        );
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        7658: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('yo', {
                    months: 'Sẹ́rẹ́_Èrèlè_Ẹrẹ̀nà_Ìgbé_Èbibi_Òkùdu_Agẹmo_Ògún_Owewe_Ọ̀wàrà_Bélú_Ọ̀pẹ̀̀'.split(
                        '_'
                    ),
                    monthsShort: 'Sẹ́r_Èrl_Ẹrn_Ìgb_Èbi_Òkù_Agẹ_Ògú_Owe_Ọ̀wà_Bél_Ọ̀pẹ̀̀'.split(
                        '_'
                    ),
                    weekdays: 'Àìkú_Ajé_Ìsẹ́gun_Ọjọ́rú_Ọjọ́bọ_Ẹtì_Àbámẹ́ta'.split(
                        '_'
                    ),
                    weekdaysShort: 'Àìk_Ajé_Ìsẹ́_Ọjr_Ọjb_Ẹtì_Àbá'.split('_'),
                    weekdaysMin: 'Àì_Aj_Ìs_Ọr_Ọb_Ẹt_Àb'.split('_'),
                    longDateFormat: {
                        LT: 'h:mm A',
                        LTS: 'h:mm:ss A',
                        L: 'DD/MM/YYYY',
                        LL: 'D MMMM YYYY',
                        LLL: 'D MMMM YYYY h:mm A',
                        LLLL: 'dddd, D MMMM YYYY h:mm A',
                    },
                    calendar: {
                        sameDay: '[Ònì ni] LT',
                        nextDay: '[Ọ̀la ni] LT',
                        nextWeek: "dddd [Ọsẹ̀ tón'bọ] [ni] LT",
                        lastDay: '[Àna ni] LT',
                        lastWeek: 'dddd [Ọsẹ̀ tólọ́] [ni] LT',
                        sameElse: 'L',
                    },
                    relativeTime: {
                        future: 'ní %s',
                        past: '%s kọjá',
                        s: 'ìsẹjú aayá die',
                        ss: 'aayá %d',
                        m: 'ìsẹjú kan',
                        mm: 'ìsẹjú %d',
                        h: 'wákati kan',
                        hh: 'wákati %d',
                        d: 'ọjọ́ kan',
                        dd: 'ọjọ́ %d',
                        M: 'osù kan',
                        MM: 'osù %d',
                        y: 'ọdún kan',
                        yy: 'ọdún %d',
                    },
                    dayOfMonthOrdinalParse: /ọjọ́\s\d{1,2}/,
                    ordinal: 'ọjọ́ %d',
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        55526: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('zh-cn', {
                    months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split(
                        '_'
                    ),
                    monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split(
                        '_'
                    ),
                    weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split(
                        '_'
                    ),
                    weekdaysShort: '周日_周一_周二_周三_周四_周五_周六'.split(
                        '_'
                    ),
                    weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'YYYY/MM/DD',
                        LL: 'YYYY年M月D日',
                        LLL: 'YYYY年M月D日Ah点mm分',
                        LLLL: 'YYYY年M月D日ddddAh点mm分',
                        l: 'YYYY/M/D',
                        ll: 'YYYY年M月D日',
                        lll: 'YYYY年M月D日 HH:mm',
                        llll: 'YYYY年M月D日dddd HH:mm',
                    },
                    meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            '凌晨' === t || '早上' === t || '上午' === t
                                ? e
                                : '下午' === t || '晚上' === t
                                ? e + 12
                                : e >= 11
                                ? e
                                : e + 12
                        );
                    },
                    meridiem: function(e, t, a) {
                        var n = 100 * e + t;
                        return n < 600
                            ? '凌晨'
                            : n < 900
                            ? '早上'
                            : n < 1130
                            ? '上午'
                            : n < 1230
                            ? '中午'
                            : n < 1800
                            ? '下午'
                            : '晚上';
                    },
                    calendar: {
                        sameDay: '[今天]LT',
                        nextDay: '[明天]LT',
                        nextWeek: function(e) {
                            return e.week() !== this.week()
                                ? '[下]dddLT'
                                : '[本]dddLT';
                        },
                        lastDay: '[昨天]LT',
                        lastWeek: function(e) {
                            return this.week() !== e.week()
                                ? '[上]dddLT'
                                : '[本]dddLT';
                        },
                        sameElse: 'L',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(日|月|周)/,
                    ordinal: function(e, t) {
                        switch (t) {
                            case 'd':
                            case 'D':
                            case 'DDD':
                                return e + '日';
                            case 'M':
                                return e + '月';
                            case 'w':
                            case 'W':
                                return e + '周';
                            default:
                                return e;
                        }
                    },
                    relativeTime: {
                        future: '%s后',
                        past: '%s前',
                        s: '几秒',
                        ss: '%d 秒',
                        m: '1 分钟',
                        mm: '%d 分钟',
                        h: '1 小时',
                        hh: '%d 小时',
                        d: '1 天',
                        dd: '%d 天',
                        w: '1 周',
                        ww: '%d 周',
                        M: '1 个月',
                        MM: '%d 个月',
                        y: '1 年',
                        yy: '%d 年',
                    },
                    week: { dow: 1, doy: 4 },
                });
            })(a(37485));
        },
        32809: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('zh-hk', {
                    months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split(
                        '_'
                    ),
                    monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split(
                        '_'
                    ),
                    weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split(
                        '_'
                    ),
                    weekdaysShort: '週日_週一_週二_週三_週四_週五_週六'.split(
                        '_'
                    ),
                    weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'YYYY/MM/DD',
                        LL: 'YYYY年M月D日',
                        LLL: 'YYYY年M月D日 HH:mm',
                        LLLL: 'YYYY年M月D日dddd HH:mm',
                        l: 'YYYY/M/D',
                        ll: 'YYYY年M月D日',
                        lll: 'YYYY年M月D日 HH:mm',
                        llll: 'YYYY年M月D日dddd HH:mm',
                    },
                    meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            '凌晨' === t || '早上' === t || '上午' === t
                                ? e
                                : '中午' === t
                                ? e >= 11
                                    ? e
                                    : e + 12
                                : '下午' === t || '晚上' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        var n = 100 * e + t;
                        return n < 600
                            ? '凌晨'
                            : n < 900
                            ? '早上'
                            : n < 1200
                            ? '上午'
                            : 1200 === n
                            ? '中午'
                            : n < 1800
                            ? '下午'
                            : '晚上';
                    },
                    calendar: {
                        sameDay: '[今天]LT',
                        nextDay: '[明天]LT',
                        nextWeek: '[下]ddddLT',
                        lastDay: '[昨天]LT',
                        lastWeek: '[上]ddddLT',
                        sameElse: 'L',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(日|月|週)/,
                    ordinal: function(e, t) {
                        switch (t) {
                            case 'd':
                            case 'D':
                            case 'DDD':
                                return e + '日';
                            case 'M':
                                return e + '月';
                            case 'w':
                            case 'W':
                                return e + '週';
                            default:
                                return e;
                        }
                    },
                    relativeTime: {
                        future: '%s後',
                        past: '%s前',
                        s: '幾秒',
                        ss: '%d 秒',
                        m: '1 分鐘',
                        mm: '%d 分鐘',
                        h: '1 小時',
                        hh: '%d 小時',
                        d: '1 天',
                        dd: '%d 天',
                        M: '1 個月',
                        MM: '%d 個月',
                        y: '1 年',
                        yy: '%d 年',
                    },
                });
            })(a(37485));
        },
        57892: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('zh-mo', {
                    months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split(
                        '_'
                    ),
                    monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split(
                        '_'
                    ),
                    weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split(
                        '_'
                    ),
                    weekdaysShort: '週日_週一_週二_週三_週四_週五_週六'.split(
                        '_'
                    ),
                    weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD/MM/YYYY',
                        LL: 'YYYY年M月D日',
                        LLL: 'YYYY年M月D日 HH:mm',
                        LLLL: 'YYYY年M月D日dddd HH:mm',
                        l: 'D/M/YYYY',
                        ll: 'YYYY年M月D日',
                        lll: 'YYYY年M月D日 HH:mm',
                        llll: 'YYYY年M月D日dddd HH:mm',
                    },
                    meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            '凌晨' === t || '早上' === t || '上午' === t
                                ? e
                                : '中午' === t
                                ? e >= 11
                                    ? e
                                    : e + 12
                                : '下午' === t || '晚上' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        var n = 100 * e + t;
                        return n < 600
                            ? '凌晨'
                            : n < 900
                            ? '早上'
                            : n < 1130
                            ? '上午'
                            : n < 1230
                            ? '中午'
                            : n < 1800
                            ? '下午'
                            : '晚上';
                    },
                    calendar: {
                        sameDay: '[今天] LT',
                        nextDay: '[明天] LT',
                        nextWeek: '[下]dddd LT',
                        lastDay: '[昨天] LT',
                        lastWeek: '[上]dddd LT',
                        sameElse: 'L',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(日|月|週)/,
                    ordinal: function(e, t) {
                        switch (t) {
                            case 'd':
                            case 'D':
                            case 'DDD':
                                return e + '日';
                            case 'M':
                                return e + '月';
                            case 'w':
                            case 'W':
                                return e + '週';
                            default:
                                return e;
                        }
                    },
                    relativeTime: {
                        future: '%s內',
                        past: '%s前',
                        s: '幾秒',
                        ss: '%d 秒',
                        m: '1 分鐘',
                        mm: '%d 分鐘',
                        h: '1 小時',
                        hh: '%d 小時',
                        d: '1 天',
                        dd: '%d 天',
                        M: '1 個月',
                        MM: '%d 個月',
                        y: '1 年',
                        yy: '%d 年',
                    },
                });
            })(a(37485));
        },
        79204: function(e, t, a) {
            !(function(e) {
                'use strict';
                e.defineLocale('zh-tw', {
                    months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split(
                        '_'
                    ),
                    monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split(
                        '_'
                    ),
                    weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split(
                        '_'
                    ),
                    weekdaysShort: '週日_週一_週二_週三_週四_週五_週六'.split(
                        '_'
                    ),
                    weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'YYYY/MM/DD',
                        LL: 'YYYY年M月D日',
                        LLL: 'YYYY年M月D日 HH:mm',
                        LLLL: 'YYYY年M月D日dddd HH:mm',
                        l: 'YYYY/M/D',
                        ll: 'YYYY年M月D日',
                        lll: 'YYYY年M月D日 HH:mm',
                        llll: 'YYYY年M月D日dddd HH:mm',
                    },
                    meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
                    meridiemHour: function(e, t) {
                        return (
                            12 === e && (e = 0),
                            '凌晨' === t || '早上' === t || '上午' === t
                                ? e
                                : '中午' === t
                                ? e >= 11
                                    ? e
                                    : e + 12
                                : '下午' === t || '晚上' === t
                                ? e + 12
                                : void 0
                        );
                    },
                    meridiem: function(e, t, a) {
                        var n = 100 * e + t;
                        return n < 600
                            ? '凌晨'
                            : n < 900
                            ? '早上'
                            : n < 1130
                            ? '上午'
                            : n < 1230
                            ? '中午'
                            : n < 1800
                            ? '下午'
                            : '晚上';
                    },
                    calendar: {
                        sameDay: '[今天] LT',
                        nextDay: '[明天] LT',
                        nextWeek: '[下]dddd LT',
                        lastDay: '[昨天] LT',
                        lastWeek: '[上]dddd LT',
                        sameElse: 'L',
                    },
                    dayOfMonthOrdinalParse: /\d{1,2}(日|月|週)/,
                    ordinal: function(e, t) {
                        switch (t) {
                            case 'd':
                            case 'D':
                            case 'DDD':
                                return e + '日';
                            case 'M':
                                return e + '月';
                            case 'w':
                            case 'W':
                                return e + '週';
                            default:
                                return e;
                        }
                    },
                    relativeTime: {
                        future: '%s後',
                        past: '%s前',
                        s: '幾秒',
                        ss: '%d 秒',
                        m: '1 分鐘',
                        mm: '%d 分鐘',
                        h: '1 小時',
                        hh: '%d 小時',
                        d: '1 天',
                        dd: '%d 天',
                        M: '1 個月',
                        MM: '%d 個月',
                        y: '1 年',
                        yy: '%d 年',
                    },
                });
            })(a(37485));
        },
        37485: function(e, t, a) {
            (e = a.nmd(e)).exports = (function() {
                'use strict';
                var t, n;
                function s() {
                    return t.apply(null, arguments);
                }
                function r(e) {
                    return (
                        e instanceof Array ||
                        '[object Array]' === Object.prototype.toString.call(e)
                    );
                }
                function i(e) {
                    return (
                        null != e &&
                        '[object Object]' === Object.prototype.toString.call(e)
                    );
                }
                function d(e, t) {
                    return Object.prototype.hasOwnProperty.call(e, t);
                }
                function _(e) {
                    if (Object.getOwnPropertyNames)
                        return 0 === Object.getOwnPropertyNames(e).length;
                    var t;
                    for (t in e) if (d(e, t)) return !1;
                    return !0;
                }
                function o(e) {
                    return void 0 === e;
                }
                function u(e) {
                    return (
                        'number' == typeof e ||
                        '[object Number]' === Object.prototype.toString.call(e)
                    );
                }
                function m(e) {
                    return (
                        e instanceof Date ||
                        '[object Date]' === Object.prototype.toString.call(e)
                    );
                }
                function l(e, t) {
                    var a,
                        n = [],
                        s = e.length;
                    for (a = 0; a < s; ++a) n.push(t(e[a], a));
                    return n;
                }
                function c(e, t) {
                    for (var a in t) d(t, a) && (e[a] = t[a]);
                    return (
                        d(t, 'toString') && (e.toString = t.toString),
                        d(t, 'valueOf') && (e.valueOf = t.valueOf),
                        e
                    );
                }
                function h(e, t, a, n) {
                    return wt(e, t, a, n, !0).utc();
                }
                function M(e) {
                    return (
                        null == e._pf &&
                            (e._pf = {
                                empty: !1,
                                unusedTokens: [],
                                unusedInput: [],
                                overflow: -2,
                                charsLeftOver: 0,
                                nullInput: !1,
                                invalidEra: null,
                                invalidMonth: null,
                                invalidFormat: !1,
                                userInvalidated: !1,
                                iso: !1,
                                parsedDateParts: [],
                                era: null,
                                meridiem: null,
                                rfc2822: !1,
                                weekdayMismatch: !1,
                            }),
                        e._pf
                    );
                }
                function L(e) {
                    if (null == e._isValid) {
                        var t = M(e),
                            a = n.call(t.parsedDateParts, function(e) {
                                return null != e;
                            }),
                            s =
                                !isNaN(e._d.getTime()) &&
                                t.overflow < 0 &&
                                !t.empty &&
                                !t.invalidEra &&
                                !t.invalidMonth &&
                                !t.invalidWeekday &&
                                !t.weekdayMismatch &&
                                !t.nullInput &&
                                !t.invalidFormat &&
                                !t.userInvalidated &&
                                (!t.meridiem || (t.meridiem && a));
                        if (
                            (e._strict &&
                                (s =
                                    s &&
                                    0 === t.charsLeftOver &&
                                    0 === t.unusedTokens.length &&
                                    void 0 === t.bigHour),
                            null != Object.isFrozen && Object.isFrozen(e))
                        )
                            return s;
                        e._isValid = s;
                    }
                    return e._isValid;
                }
                function Y(e) {
                    var t = h(NaN);
                    return (
                        null != e ? c(M(t), e) : (M(t).userInvalidated = !0), t
                    );
                }
                n = Array.prototype.some
                    ? Array.prototype.some
                    : function(e) {
                          var t,
                              a = Object(this),
                              n = a.length >>> 0;
                          for (t = 0; t < n; t++)
                              if (t in a && e.call(this, a[t], t, a)) return !0;
                          return !1;
                      };
                var f = (s.momentProperties = []),
                    y = !1;
                function p(e, t) {
                    var a,
                        n,
                        s,
                        r = f.length;
                    if (
                        (o(t._isAMomentObject) ||
                            (e._isAMomentObject = t._isAMomentObject),
                        o(t._i) || (e._i = t._i),
                        o(t._f) || (e._f = t._f),
                        o(t._l) || (e._l = t._l),
                        o(t._strict) || (e._strict = t._strict),
                        o(t._tzm) || (e._tzm = t._tzm),
                        o(t._isUTC) || (e._isUTC = t._isUTC),
                        o(t._offset) || (e._offset = t._offset),
                        o(t._pf) || (e._pf = M(t)),
                        o(t._locale) || (e._locale = t._locale),
                        r > 0)
                    )
                        for (a = 0; a < r; a++)
                            o((s = t[(n = f[a])])) || (e[n] = s);
                    return e;
                }
                function k(e) {
                    p(this, e),
                        (this._d = new Date(
                            null != e._d ? e._d.getTime() : NaN
                        )),
                        this.isValid() || (this._d = new Date(NaN)),
                        !1 === y && ((y = !0), s.updateOffset(this), (y = !1));
                }
                function D(e) {
                    return (
                        e instanceof k ||
                        (null != e && null != e._isAMomentObject)
                    );
                }
                function g(e) {
                    !1 === s.suppressDeprecationWarnings &&
                        'undefined' != typeof console &&
                        console.warn &&
                        console.warn('Deprecation warning: ' + e);
                }
                function T(e, t) {
                    var a = !0;
                    return c(function() {
                        if (
                            (null != s.deprecationHandler &&
                                s.deprecationHandler(null, e),
                            a)
                        ) {
                            var n,
                                r,
                                i,
                                _ = [],
                                o = arguments.length;
                            for (r = 0; r < o; r++) {
                                if (
                                    ((n = ''), 'object' == typeof arguments[r])
                                ) {
                                    for (i in ((n += '\n[' + r + '] '),
                                    arguments[0]))
                                        d(arguments[0], i) &&
                                            (n +=
                                                i +
                                                ': ' +
                                                arguments[0][i] +
                                                ', ');
                                    n = n.slice(0, -2);
                                } else n = arguments[r];
                                _.push(n);
                            }
                            g(
                                e +
                                    '\nArguments: ' +
                                    Array.prototype.slice.call(_).join('') +
                                    '\n' +
                                    new Error().stack
                            ),
                                (a = !1);
                        }
                        return t.apply(this, arguments);
                    }, t);
                }
                var w,
                    v = {};
                function b(e, t) {
                    null != s.deprecationHandler && s.deprecationHandler(e, t),
                        v[e] || (g(t), (v[e] = !0));
                }
                function S(e) {
                    return (
                        ('undefined' != typeof Function &&
                            e instanceof Function) ||
                        '[object Function]' ===
                            Object.prototype.toString.call(e)
                    );
                }
                function H(e, t) {
                    var a,
                        n = c({}, e);
                    for (a in t)
                        d(t, a) &&
                            (i(e[a]) && i(t[a])
                                ? ((n[a] = {}), c(n[a], e[a]), c(n[a], t[a]))
                                : null != t[a]
                                ? (n[a] = t[a])
                                : delete n[a]);
                    for (a in e)
                        d(e, a) && !d(t, a) && i(e[a]) && (n[a] = c({}, n[a]));
                    return n;
                }
                function j(e) {
                    null != e && this.set(e);
                }
                (s.suppressDeprecationWarnings = !1),
                    (s.deprecationHandler = null),
                    (w = Object.keys
                        ? Object.keys
                        : function(e) {
                              var t,
                                  a = [];
                              for (t in e) d(e, t) && a.push(t);
                              return a;
                          });
                function x(e, t, a) {
                    var n = '' + Math.abs(e),
                        s = t - n.length;
                    return (
                        (e >= 0 ? (a ? '+' : '') : '-') +
                        Math.pow(10, Math.max(0, s))
                            .toString()
                            .substr(1) +
                        n
                    );
                }
                var O = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,
                    P = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,
                    W = {},
                    A = {};
                function E(e, t, a, n) {
                    var s = n;
                    'string' == typeof n &&
                        (s = function() {
                            return this[n]();
                        }),
                        e && (A[e] = s),
                        t &&
                            (A[t[0]] = function() {
                                return x(s.apply(this, arguments), t[1], t[2]);
                            }),
                        a &&
                            (A[a] = function() {
                                return this.localeData().ordinal(
                                    s.apply(this, arguments),
                                    e
                                );
                            });
                }
                function F(e, t) {
                    return e.isValid()
                        ? ((t = z(t, e.localeData())),
                          (W[t] =
                              W[t] ||
                              (function(e) {
                                  var t,
                                      a,
                                      n,
                                      s = e.match(O);
                                  for (t = 0, a = s.length; t < a; t++)
                                      A[s[t]]
                                          ? (s[t] = A[s[t]])
                                          : (s[t] = (n = s[t]).match(/\[[\s\S]/)
                                                ? n.replace(/^\[|\]$/g, '')
                                                : n.replace(/\\/g, ''));
                                  return function(t) {
                                      var n,
                                          r = '';
                                      for (n = 0; n < a; n++)
                                          r += S(s[n]) ? s[n].call(t, e) : s[n];
                                      return r;
                                  };
                              })(t)),
                          W[t](e))
                        : e.localeData().invalidDate();
                }
                function z(e, t) {
                    var a = 5;
                    function n(e) {
                        return t.longDateFormat(e) || e;
                    }
                    for (P.lastIndex = 0; a >= 0 && P.test(e); )
                        (e = e.replace(P, n)), (P.lastIndex = 0), (a -= 1);
                    return e;
                }
                var C = {};
                function N(e, t) {
                    var a = e.toLowerCase();
                    C[a] = C[a + 's'] = C[t] = e;
                }
                function R(e) {
                    return 'string' == typeof e
                        ? C[e] || C[e.toLowerCase()]
                        : void 0;
                }
                function J(e) {
                    var t,
                        a,
                        n = {};
                    for (a in e) d(e, a) && (t = R(a)) && (n[t] = e[a]);
                    return n;
                }
                var U = {};
                function I(e, t) {
                    U[e] = t;
                }
                function G(e) {
                    return (e % 4 == 0 && e % 100 != 0) || e % 400 == 0;
                }
                function V(e) {
                    return e < 0 ? Math.ceil(e) || 0 : Math.floor(e);
                }
                function B(e) {
                    var t = +e,
                        a = 0;
                    return 0 !== t && isFinite(t) && (a = V(t)), a;
                }
                function $(e, t) {
                    return function(a) {
                        return null != a
                            ? (K(this, e, a), s.updateOffset(this, t), this)
                            : q(this, e);
                    };
                }
                function q(e, t) {
                    return e.isValid()
                        ? e._d['get' + (e._isUTC ? 'UTC' : '') + t]()
                        : NaN;
                }
                function K(e, t, a) {
                    e.isValid() &&
                        !isNaN(a) &&
                        ('FullYear' === t &&
                        G(e.year()) &&
                        1 === e.month() &&
                        29 === e.date()
                            ? ((a = B(a)),
                              e._d['set' + (e._isUTC ? 'UTC' : '') + t](
                                  a,
                                  e.month(),
                                  De(a, e.month())
                              ))
                            : e._d['set' + (e._isUTC ? 'UTC' : '') + t](a));
                }
                var Z,
                    Q = /\d/,
                    X = /\d\d/,
                    ee = /\d{3}/,
                    te = /\d{4}/,
                    ae = /[+-]?\d{6}/,
                    ne = /\d\d?/,
                    se = /\d\d\d\d?/,
                    re = /\d\d\d\d\d\d?/,
                    ie = /\d{1,3}/,
                    de = /\d{1,4}/,
                    _e = /[+-]?\d{1,6}/,
                    oe = /\d+/,
                    ue = /[+-]?\d+/,
                    me = /Z|[+-]\d\d:?\d\d/gi,
                    le = /Z|[+-]\d\d(?::?\d\d)?/gi,
                    ce = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i;
                function he(e, t, a) {
                    Z[e] = S(t)
                        ? t
                        : function(e, n) {
                              return e && a ? a : t;
                          };
                }
                function Me(e, t) {
                    return d(Z, e)
                        ? Z[e](t._strict, t._locale)
                        : new RegExp(
                              Le(
                                  e
                                      .replace('\\', '')
                                      .replace(
                                          /\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,
                                          function(e, t, a, n, s) {
                                              return t || a || n || s;
                                          }
                                      )
                              )
                          );
                }
                function Le(e) {
                    return e.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                }
                Z = {};
                var Ye = {};
                function fe(e, t) {
                    var a,
                        n,
                        s = t;
                    for (
                        'string' == typeof e && (e = [e]),
                            u(t) &&
                                (s = function(e, a) {
                                    a[t] = B(e);
                                }),
                            n = e.length,
                            a = 0;
                        a < n;
                        a++
                    )
                        Ye[e[a]] = s;
                }
                function ye(e, t) {
                    fe(e, function(e, a, n, s) {
                        (n._w = n._w || {}), t(e, n._w, n, s);
                    });
                }
                function pe(e, t, a) {
                    null != t && d(Ye, e) && Ye[e](t, a._a, a, e);
                }
                var ke;
                function De(e, t) {
                    if (isNaN(e) || isNaN(t)) return NaN;
                    var a,
                        n = ((t % (a = 12)) + a) % a;
                    return (
                        (e += (t - n) / 12),
                        1 === n ? (G(e) ? 29 : 28) : 31 - ((n % 7) % 2)
                    );
                }
                (ke = Array.prototype.indexOf
                    ? Array.prototype.indexOf
                    : function(e) {
                          var t;
                          for (t = 0; t < this.length; ++t)
                              if (this[t] === e) return t;
                          return -1;
                      }),
                    E('M', ['MM', 2], 'Mo', function() {
                        return this.month() + 1;
                    }),
                    E('MMM', 0, 0, function(e) {
                        return this.localeData().monthsShort(this, e);
                    }),
                    E('MMMM', 0, 0, function(e) {
                        return this.localeData().months(this, e);
                    }),
                    N('month', 'M'),
                    I('month', 8),
                    he('M', ne),
                    he('MM', ne, X),
                    he('MMM', function(e, t) {
                        return t.monthsShortRegex(e);
                    }),
                    he('MMMM', function(e, t) {
                        return t.monthsRegex(e);
                    }),
                    fe(['M', 'MM'], function(e, t) {
                        t[1] = B(e) - 1;
                    }),
                    fe(['MMM', 'MMMM'], function(e, t, a, n) {
                        var s = a._locale.monthsParse(e, n, a._strict);
                        null != s ? (t[1] = s) : (M(a).invalidMonth = e);
                    });
                var ge = 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
                        '_'
                    ),
                    Te = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split(
                        '_'
                    ),
                    we = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,
                    ve = ce,
                    be = ce;
                function Se(e, t, a) {
                    var n,
                        s,
                        r,
                        i = e.toLocaleLowerCase();
                    if (!this._monthsParse)
                        for (
                            this._monthsParse = [],
                                this._longMonthsParse = [],
                                this._shortMonthsParse = [],
                                n = 0;
                            n < 12;
                            ++n
                        )
                            (r = h([2e3, n])),
                                (this._shortMonthsParse[n] = this.monthsShort(
                                    r,
                                    ''
                                ).toLocaleLowerCase()),
                                (this._longMonthsParse[n] = this.months(
                                    r,
                                    ''
                                ).toLocaleLowerCase());
                    return a
                        ? 'MMM' === t
                            ? -1 !== (s = ke.call(this._shortMonthsParse, i))
                                ? s
                                : null
                            : -1 !== (s = ke.call(this._longMonthsParse, i))
                            ? s
                            : null
                        : 'MMM' === t
                        ? -1 !== (s = ke.call(this._shortMonthsParse, i)) ||
                          -1 !== (s = ke.call(this._longMonthsParse, i))
                            ? s
                            : null
                        : -1 !== (s = ke.call(this._longMonthsParse, i)) ||
                          -1 !== (s = ke.call(this._shortMonthsParse, i))
                        ? s
                        : null;
                }
                function He(e, t) {
                    var a;
                    if (!e.isValid()) return e;
                    if ('string' == typeof t)
                        if (/^\d+$/.test(t)) t = B(t);
                        else if (!u((t = e.localeData().monthsParse(t))))
                            return e;
                    return (
                        (a = Math.min(e.date(), De(e.year(), t))),
                        e._d['set' + (e._isUTC ? 'UTC' : '') + 'Month'](t, a),
                        e
                    );
                }
                function je(e) {
                    return null != e
                        ? (He(this, e), s.updateOffset(this, !0), this)
                        : q(this, 'Month');
                }
                function xe() {
                    function e(e, t) {
                        return t.length - e.length;
                    }
                    var t,
                        a,
                        n = [],
                        s = [],
                        r = [];
                    for (t = 0; t < 12; t++)
                        (a = h([2e3, t])),
                            n.push(this.monthsShort(a, '')),
                            s.push(this.months(a, '')),
                            r.push(this.months(a, '')),
                            r.push(this.monthsShort(a, ''));
                    for (n.sort(e), s.sort(e), r.sort(e), t = 0; t < 12; t++)
                        (n[t] = Le(n[t])), (s[t] = Le(s[t]));
                    for (t = 0; t < 24; t++) r[t] = Le(r[t]);
                    (this._monthsRegex = new RegExp(
                        '^(' + r.join('|') + ')',
                        'i'
                    )),
                        (this._monthsShortRegex = this._monthsRegex),
                        (this._monthsStrictRegex = new RegExp(
                            '^(' + s.join('|') + ')',
                            'i'
                        )),
                        (this._monthsShortStrictRegex = new RegExp(
                            '^(' + n.join('|') + ')',
                            'i'
                        ));
                }
                function Oe(e) {
                    return G(e) ? 366 : 365;
                }
                E('Y', 0, 0, function() {
                    var e = this.year();
                    return e <= 9999 ? x(e, 4) : '+' + e;
                }),
                    E(0, ['YY', 2], 0, function() {
                        return this.year() % 100;
                    }),
                    E(0, ['YYYY', 4], 0, 'year'),
                    E(0, ['YYYYY', 5], 0, 'year'),
                    E(0, ['YYYYYY', 6, !0], 0, 'year'),
                    N('year', 'y'),
                    I('year', 1),
                    he('Y', ue),
                    he('YY', ne, X),
                    he('YYYY', de, te),
                    he('YYYYY', _e, ae),
                    he('YYYYYY', _e, ae),
                    fe(['YYYYY', 'YYYYYY'], 0),
                    fe('YYYY', function(e, t) {
                        t[0] = 2 === e.length ? s.parseTwoDigitYear(e) : B(e);
                    }),
                    fe('YY', function(e, t) {
                        t[0] = s.parseTwoDigitYear(e);
                    }),
                    fe('Y', function(e, t) {
                        t[0] = parseInt(e, 10);
                    }),
                    (s.parseTwoDigitYear = function(e) {
                        return B(e) + (B(e) > 68 ? 1900 : 2e3);
                    });
                var Pe = $('FullYear', !0);
                function We(e, t, a, n, s, r, i) {
                    var d;
                    return (
                        e < 100 && e >= 0
                            ? ((d = new Date(e + 400, t, a, n, s, r, i)),
                              isFinite(d.getFullYear()) && d.setFullYear(e))
                            : (d = new Date(e, t, a, n, s, r, i)),
                        d
                    );
                }
                function Ae(e) {
                    var t, a;
                    return (
                        e < 100 && e >= 0
                            ? (((a = Array.prototype.slice.call(arguments))[0] =
                                  e + 400),
                              (t = new Date(Date.UTC.apply(null, a))),
                              isFinite(t.getUTCFullYear()) &&
                                  t.setUTCFullYear(e))
                            : (t = new Date(Date.UTC.apply(null, arguments))),
                        t
                    );
                }
                function Ee(e, t, a) {
                    var n = 7 + t - a;
                    return (-(7 + Ae(e, 0, n).getUTCDay() - t) % 7) + n - 1;
                }
                function Fe(e, t, a, n, s) {
                    var r,
                        i,
                        d = 1 + 7 * (t - 1) + ((7 + a - n) % 7) + Ee(e, n, s);
                    return (
                        d <= 0
                            ? (i = Oe((r = e - 1)) + d)
                            : d > Oe(e)
                            ? ((r = e + 1), (i = d - Oe(e)))
                            : ((r = e), (i = d)),
                        { year: r, dayOfYear: i }
                    );
                }
                function ze(e, t, a) {
                    var n,
                        s,
                        r = Ee(e.year(), t, a),
                        i = Math.floor((e.dayOfYear() - r - 1) / 7) + 1;
                    return (
                        i < 1
                            ? (n = i + Ce((s = e.year() - 1), t, a))
                            : i > Ce(e.year(), t, a)
                            ? ((n = i - Ce(e.year(), t, a)), (s = e.year() + 1))
                            : ((s = e.year()), (n = i)),
                        { week: n, year: s }
                    );
                }
                function Ce(e, t, a) {
                    var n = Ee(e, t, a),
                        s = Ee(e + 1, t, a);
                    return (Oe(e) - n + s) / 7;
                }
                E('w', ['ww', 2], 'wo', 'week'),
                    E('W', ['WW', 2], 'Wo', 'isoWeek'),
                    N('week', 'w'),
                    N('isoWeek', 'W'),
                    I('week', 5),
                    I('isoWeek', 5),
                    he('w', ne),
                    he('ww', ne, X),
                    he('W', ne),
                    he('WW', ne, X),
                    ye(['w', 'ww', 'W', 'WW'], function(e, t, a, n) {
                        t[n.substr(0, 1)] = B(e);
                    });
                function Ne(e, t) {
                    return e.slice(t, 7).concat(e.slice(0, t));
                }
                E('d', 0, 'do', 'day'),
                    E('dd', 0, 0, function(e) {
                        return this.localeData().weekdaysMin(this, e);
                    }),
                    E('ddd', 0, 0, function(e) {
                        return this.localeData().weekdaysShort(this, e);
                    }),
                    E('dddd', 0, 0, function(e) {
                        return this.localeData().weekdays(this, e);
                    }),
                    E('e', 0, 0, 'weekday'),
                    E('E', 0, 0, 'isoWeekday'),
                    N('day', 'd'),
                    N('weekday', 'e'),
                    N('isoWeekday', 'E'),
                    I('day', 11),
                    I('weekday', 11),
                    I('isoWeekday', 11),
                    he('d', ne),
                    he('e', ne),
                    he('E', ne),
                    he('dd', function(e, t) {
                        return t.weekdaysMinRegex(e);
                    }),
                    he('ddd', function(e, t) {
                        return t.weekdaysShortRegex(e);
                    }),
                    he('dddd', function(e, t) {
                        return t.weekdaysRegex(e);
                    }),
                    ye(['dd', 'ddd', 'dddd'], function(e, t, a, n) {
                        var s = a._locale.weekdaysParse(e, n, a._strict);
                        null != s ? (t.d = s) : (M(a).invalidWeekday = e);
                    }),
                    ye(['d', 'e', 'E'], function(e, t, a, n) {
                        t[n] = B(e);
                    });
                var Re = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
                        '_'
                    ),
                    Je = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
                    Ue = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
                    Ie = ce,
                    Ge = ce,
                    Ve = ce;
                function Be(e, t, a) {
                    var n,
                        s,
                        r,
                        i = e.toLocaleLowerCase();
                    if (!this._weekdaysParse)
                        for (
                            this._weekdaysParse = [],
                                this._shortWeekdaysParse = [],
                                this._minWeekdaysParse = [],
                                n = 0;
                            n < 7;
                            ++n
                        )
                            (r = h([2e3, 1]).day(n)),
                                (this._minWeekdaysParse[n] = this.weekdaysMin(
                                    r,
                                    ''
                                ).toLocaleLowerCase()),
                                (this._shortWeekdaysParse[
                                    n
                                ] = this.weekdaysShort(
                                    r,
                                    ''
                                ).toLocaleLowerCase()),
                                (this._weekdaysParse[n] = this.weekdays(
                                    r,
                                    ''
                                ).toLocaleLowerCase());
                    return a
                        ? 'dddd' === t
                            ? -1 !== (s = ke.call(this._weekdaysParse, i))
                                ? s
                                : null
                            : 'ddd' === t
                            ? -1 !== (s = ke.call(this._shortWeekdaysParse, i))
                                ? s
                                : null
                            : -1 !== (s = ke.call(this._minWeekdaysParse, i))
                            ? s
                            : null
                        : 'dddd' === t
                        ? -1 !== (s = ke.call(this._weekdaysParse, i)) ||
                          -1 !== (s = ke.call(this._shortWeekdaysParse, i)) ||
                          -1 !== (s = ke.call(this._minWeekdaysParse, i))
                            ? s
                            : null
                        : 'ddd' === t
                        ? -1 !== (s = ke.call(this._shortWeekdaysParse, i)) ||
                          -1 !== (s = ke.call(this._weekdaysParse, i)) ||
                          -1 !== (s = ke.call(this._minWeekdaysParse, i))
                            ? s
                            : null
                        : -1 !== (s = ke.call(this._minWeekdaysParse, i)) ||
                          -1 !== (s = ke.call(this._weekdaysParse, i)) ||
                          -1 !== (s = ke.call(this._shortWeekdaysParse, i))
                        ? s
                        : null;
                }
                function $e() {
                    function e(e, t) {
                        return t.length - e.length;
                    }
                    var t,
                        a,
                        n,
                        s,
                        r,
                        i = [],
                        d = [],
                        _ = [],
                        o = [];
                    for (t = 0; t < 7; t++)
                        (a = h([2e3, 1]).day(t)),
                            (n = Le(this.weekdaysMin(a, ''))),
                            (s = Le(this.weekdaysShort(a, ''))),
                            (r = Le(this.weekdays(a, ''))),
                            i.push(n),
                            d.push(s),
                            _.push(r),
                            o.push(n),
                            o.push(s),
                            o.push(r);
                    i.sort(e),
                        d.sort(e),
                        _.sort(e),
                        o.sort(e),
                        (this._weekdaysRegex = new RegExp(
                            '^(' + o.join('|') + ')',
                            'i'
                        )),
                        (this._weekdaysShortRegex = this._weekdaysRegex),
                        (this._weekdaysMinRegex = this._weekdaysRegex),
                        (this._weekdaysStrictRegex = new RegExp(
                            '^(' + _.join('|') + ')',
                            'i'
                        )),
                        (this._weekdaysShortStrictRegex = new RegExp(
                            '^(' + d.join('|') + ')',
                            'i'
                        )),
                        (this._weekdaysMinStrictRegex = new RegExp(
                            '^(' + i.join('|') + ')',
                            'i'
                        ));
                }
                function qe() {
                    return this.hours() % 12 || 12;
                }
                function Ke(e, t) {
                    E(e, 0, 0, function() {
                        return this.localeData().meridiem(
                            this.hours(),
                            this.minutes(),
                            t
                        );
                    });
                }
                function Ze(e, t) {
                    return t._meridiemParse;
                }
                E('H', ['HH', 2], 0, 'hour'),
                    E('h', ['hh', 2], 0, qe),
                    E('k', ['kk', 2], 0, function() {
                        return this.hours() || 24;
                    }),
                    E('hmm', 0, 0, function() {
                        return '' + qe.apply(this) + x(this.minutes(), 2);
                    }),
                    E('hmmss', 0, 0, function() {
                        return (
                            '' +
                            qe.apply(this) +
                            x(this.minutes(), 2) +
                            x(this.seconds(), 2)
                        );
                    }),
                    E('Hmm', 0, 0, function() {
                        return '' + this.hours() + x(this.minutes(), 2);
                    }),
                    E('Hmmss', 0, 0, function() {
                        return (
                            '' +
                            this.hours() +
                            x(this.minutes(), 2) +
                            x(this.seconds(), 2)
                        );
                    }),
                    Ke('a', !0),
                    Ke('A', !1),
                    N('hour', 'h'),
                    I('hour', 13),
                    he('a', Ze),
                    he('A', Ze),
                    he('H', ne),
                    he('h', ne),
                    he('k', ne),
                    he('HH', ne, X),
                    he('hh', ne, X),
                    he('kk', ne, X),
                    he('hmm', se),
                    he('hmmss', re),
                    he('Hmm', se),
                    he('Hmmss', re),
                    fe(['H', 'HH'], 3),
                    fe(['k', 'kk'], function(e, t, a) {
                        var n = B(e);
                        t[3] = 24 === n ? 0 : n;
                    }),
                    fe(['a', 'A'], function(e, t, a) {
                        (a._isPm = a._locale.isPM(e)), (a._meridiem = e);
                    }),
                    fe(['h', 'hh'], function(e, t, a) {
                        (t[3] = B(e)), (M(a).bigHour = !0);
                    }),
                    fe('hmm', function(e, t, a) {
                        var n = e.length - 2;
                        (t[3] = B(e.substr(0, n))),
                            (t[4] = B(e.substr(n))),
                            (M(a).bigHour = !0);
                    }),
                    fe('hmmss', function(e, t, a) {
                        var n = e.length - 4,
                            s = e.length - 2;
                        (t[3] = B(e.substr(0, n))),
                            (t[4] = B(e.substr(n, 2))),
                            (t[5] = B(e.substr(s))),
                            (M(a).bigHour = !0);
                    }),
                    fe('Hmm', function(e, t, a) {
                        var n = e.length - 2;
                        (t[3] = B(e.substr(0, n))), (t[4] = B(e.substr(n)));
                    }),
                    fe('Hmmss', function(e, t, a) {
                        var n = e.length - 4,
                            s = e.length - 2;
                        (t[3] = B(e.substr(0, n))),
                            (t[4] = B(e.substr(n, 2))),
                            (t[5] = B(e.substr(s)));
                    });
                var Qe = $('Hours', !0);
                var Xe,
                    et = {
                        calendar: {
                            sameDay: '[Today at] LT',
                            nextDay: '[Tomorrow at] LT',
                            nextWeek: 'dddd [at] LT',
                            lastDay: '[Yesterday at] LT',
                            lastWeek: '[Last] dddd [at] LT',
                            sameElse: 'L',
                        },
                        longDateFormat: {
                            LTS: 'h:mm:ss A',
                            LT: 'h:mm A',
                            L: 'MM/DD/YYYY',
                            LL: 'MMMM D, YYYY',
                            LLL: 'MMMM D, YYYY h:mm A',
                            LLLL: 'dddd, MMMM D, YYYY h:mm A',
                        },
                        invalidDate: 'Invalid date',
                        ordinal: '%d',
                        dayOfMonthOrdinalParse: /\d{1,2}/,
                        relativeTime: {
                            future: 'in %s',
                            past: '%s ago',
                            s: 'a few seconds',
                            ss: '%d seconds',
                            m: 'a minute',
                            mm: '%d minutes',
                            h: 'an hour',
                            hh: '%d hours',
                            d: 'a day',
                            dd: '%d days',
                            w: 'a week',
                            ww: '%d weeks',
                            M: 'a month',
                            MM: '%d months',
                            y: 'a year',
                            yy: '%d years',
                        },
                        months: ge,
                        monthsShort: Te,
                        week: { dow: 0, doy: 6 },
                        weekdays: Re,
                        weekdaysMin: Ue,
                        weekdaysShort: Je,
                        meridiemParse: /[ap]\.?m?\.?/i,
                    },
                    tt = {},
                    at = {};
                function nt(e, t) {
                    var a,
                        n = Math.min(e.length, t.length);
                    for (a = 0; a < n; a += 1) if (e[a] !== t[a]) return a;
                    return n;
                }
                function st(e) {
                    return e ? e.toLowerCase().replace('_', '-') : e;
                }
                function rt(t) {
                    var n = null;
                    if (
                        void 0 === tt[t] &&
                        e &&
                        e.exports &&
                        (function(e) {
                            return null != e.match('^[^/\\\\]*$');
                        })(t)
                    )
                        try {
                            (n = Xe._abbr), a(95126)('./' + t), it(n);
                        } catch (e) {
                            tt[t] = null;
                        }
                    return tt[t];
                }
                function it(e, t) {
                    var a;
                    return (
                        e &&
                            ((a = o(t) ? _t(e) : dt(e, t))
                                ? (Xe = a)
                                : 'undefined' != typeof console &&
                                  console.warn &&
                                  console.warn(
                                      'Locale ' +
                                          e +
                                          ' not found. Did you forget to load it?'
                                  )),
                        Xe._abbr
                    );
                }
                function dt(e, t) {
                    if (null !== t) {
                        var a,
                            n = et;
                        if (((t.abbr = e), null != tt[e]))
                            b(
                                'defineLocaleOverride',
                                'use moment.updateLocale(localeName, config) to change an existing locale. moment.defineLocale(localeName, config) should only be used for creating a new locale See http://momentjs.com/guides/#/warnings/define-locale/ for more info.'
                            ),
                                (n = tt[e]._config);
                        else if (null != t.parentLocale)
                            if (null != tt[t.parentLocale])
                                n = tt[t.parentLocale]._config;
                            else {
                                if (null == (a = rt(t.parentLocale)))
                                    return (
                                        at[t.parentLocale] ||
                                            (at[t.parentLocale] = []),
                                        at[t.parentLocale].push({
                                            name: e,
                                            config: t,
                                        }),
                                        null
                                    );
                                n = a._config;
                            }
                        return (
                            (tt[e] = new j(H(n, t))),
                            at[e] &&
                                at[e].forEach(function(e) {
                                    dt(e.name, e.config);
                                }),
                            it(e),
                            tt[e]
                        );
                    }
                    return delete tt[e], null;
                }
                function _t(e) {
                    var t;
                    if (
                        (e &&
                            e._locale &&
                            e._locale._abbr &&
                            (e = e._locale._abbr),
                        !e)
                    )
                        return Xe;
                    if (!r(e)) {
                        if ((t = rt(e))) return t;
                        e = [e];
                    }
                    return (function(e) {
                        for (var t, a, n, s, r = 0; r < e.length; ) {
                            for (
                                t = (s = st(e[r]).split('-')).length,
                                    a = (a = st(e[r + 1]))
                                        ? a.split('-')
                                        : null;
                                t > 0;

                            ) {
                                if ((n = rt(s.slice(0, t).join('-')))) return n;
                                if (a && a.length >= t && nt(s, a) >= t - 1)
                                    break;
                                t--;
                            }
                            r++;
                        }
                        return Xe;
                    })(e);
                }
                function ot(e) {
                    var t,
                        a = e._a;
                    return (
                        a &&
                            -2 === M(e).overflow &&
                            ((t =
                                a[1] < 0 || a[1] > 11
                                    ? 1
                                    : a[2] < 1 || a[2] > De(a[0], a[1])
                                    ? 2
                                    : a[3] < 0 ||
                                      a[3] > 24 ||
                                      (24 === a[3] &&
                                          (0 !== a[4] ||
                                              0 !== a[5] ||
                                              0 !== a[6]))
                                    ? 3
                                    : a[4] < 0 || a[4] > 59
                                    ? 4
                                    : a[5] < 0 || a[5] > 59
                                    ? 5
                                    : a[6] < 0 || a[6] > 999
                                    ? 6
                                    : -1),
                            M(e)._overflowDayOfYear &&
                                (t < 0 || t > 2) &&
                                (t = 2),
                            M(e)._overflowWeeks && -1 === t && (t = 7),
                            M(e)._overflowWeekday && -1 === t && (t = 8),
                            (M(e).overflow = t)),
                        e
                    );
                }
                var ut = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
                    mt = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d|))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
                    lt = /Z|[+-]\d\d(?::?\d\d)?/,
                    ct = [
                        ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
                        ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
                        ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
                        ['GGGG-[W]WW', /\d{4}-W\d\d/, !1],
                        ['YYYY-DDD', /\d{4}-\d{3}/],
                        ['YYYY-MM', /\d{4}-\d\d/, !1],
                        ['YYYYYYMMDD', /[+-]\d{10}/],
                        ['YYYYMMDD', /\d{8}/],
                        ['GGGG[W]WWE', /\d{4}W\d{3}/],
                        ['GGGG[W]WW', /\d{4}W\d{2}/, !1],
                        ['YYYYDDD', /\d{7}/],
                        ['YYYYMM', /\d{6}/, !1],
                        ['YYYY', /\d{4}/, !1],
                    ],
                    ht = [
                        ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
                        ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
                        ['HH:mm:ss', /\d\d:\d\d:\d\d/],
                        ['HH:mm', /\d\d:\d\d/],
                        ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
                        ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
                        ['HHmmss', /\d\d\d\d\d\d/],
                        ['HHmm', /\d\d\d\d/],
                        ['HH', /\d\d/],
                    ],
                    Mt = /^\/?Date\((-?\d+)/i,
                    Lt = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/,
                    Yt = {
                        UT: 0,
                        GMT: 0,
                        EDT: -240,
                        EST: -300,
                        CDT: -300,
                        CST: -360,
                        MDT: -360,
                        MST: -420,
                        PDT: -420,
                        PST: -480,
                    };
                function ft(e) {
                    var t,
                        a,
                        n,
                        s,
                        r,
                        i,
                        d = e._i,
                        _ = ut.exec(d) || mt.exec(d),
                        o = ct.length,
                        u = ht.length;
                    if (_) {
                        for (M(e).iso = !0, t = 0, a = o; t < a; t++)
                            if (ct[t][1].exec(_[1])) {
                                (s = ct[t][0]), (n = !1 !== ct[t][2]);
                                break;
                            }
                        if (null == s) return void (e._isValid = !1);
                        if (_[3]) {
                            for (t = 0, a = u; t < a; t++)
                                if (ht[t][1].exec(_[3])) {
                                    r = (_[2] || ' ') + ht[t][0];
                                    break;
                                }
                            if (null == r) return void (e._isValid = !1);
                        }
                        if (!n && null != r) return void (e._isValid = !1);
                        if (_[4]) {
                            if (!lt.exec(_[4])) return void (e._isValid = !1);
                            i = 'Z';
                        }
                        (e._f = s + (r || '') + (i || '')), gt(e);
                    } else e._isValid = !1;
                }
                function yt(e) {
                    var t = parseInt(e, 10);
                    return t <= 49 ? 2e3 + t : t <= 999 ? 1900 + t : t;
                }
                function pt(e) {
                    var t,
                        a,
                        n,
                        s,
                        r,
                        i,
                        d,
                        _,
                        o = Lt.exec(
                            e._i
                                .replace(/\([^()]*\)|[\n\t]/g, ' ')
                                .replace(/(\s\s+)/g, ' ')
                                .replace(/^\s\s*/, '')
                                .replace(/\s\s*$/, '')
                        );
                    if (o) {
                        if (
                            ((a = o[4]),
                            (n = o[3]),
                            (s = o[2]),
                            (r = o[5]),
                            (i = o[6]),
                            (d = o[7]),
                            (_ = [
                                yt(a),
                                Te.indexOf(n),
                                parseInt(s, 10),
                                parseInt(r, 10),
                                parseInt(i, 10),
                            ]),
                            d && _.push(parseInt(d, 10)),
                            (t = _),
                            !(function(e, t, a) {
                                return (
                                    !e ||
                                    Je.indexOf(e) ===
                                        new Date(t[0], t[1], t[2]).getDay() ||
                                    ((M(a).weekdayMismatch = !0),
                                    (a._isValid = !1),
                                    !1)
                                );
                            })(o[1], t, e))
                        )
                            return;
                        (e._a = t),
                            (e._tzm = (function(e, t, a) {
                                if (e) return Yt[e];
                                if (t) return 0;
                                var n = parseInt(a, 10),
                                    s = n % 100;
                                return ((n - s) / 100) * 60 + s;
                            })(o[8], o[9], o[10])),
                            (e._d = Ae.apply(null, e._a)),
                            e._d.setUTCMinutes(e._d.getUTCMinutes() - e._tzm),
                            (M(e).rfc2822 = !0);
                    } else e._isValid = !1;
                }
                function kt(e, t, a) {
                    return null != e ? e : null != t ? t : a;
                }
                function Dt(e) {
                    var t,
                        a,
                        n,
                        r,
                        i,
                        d = [];
                    if (!e._d) {
                        for (
                            n = (function(e) {
                                var t = new Date(s.now());
                                return e._useUTC
                                    ? [
                                          t.getUTCFullYear(),
                                          t.getUTCMonth(),
                                          t.getUTCDate(),
                                      ]
                                    : [
                                          t.getFullYear(),
                                          t.getMonth(),
                                          t.getDate(),
                                      ];
                            })(e),
                                e._w &&
                                    null == e._a[2] &&
                                    null == e._a[1] &&
                                    (function(e) {
                                        var t, a, n, s, r, i, d, _, o;
                                        null != (t = e._w).GG ||
                                        null != t.W ||
                                        null != t.E
                                            ? ((r = 1),
                                              (i = 4),
                                              (a = kt(
                                                  t.GG,
                                                  e._a[0],
                                                  ze(vt(), 1, 4).year
                                              )),
                                              (n = kt(t.W, 1)),
                                              ((s = kt(t.E, 1)) < 1 || s > 7) &&
                                                  (_ = !0))
                                            : ((r = e._locale._week.dow),
                                              (i = e._locale._week.doy),
                                              (o = ze(vt(), r, i)),
                                              (a = kt(t.gg, e._a[0], o.year)),
                                              (n = kt(t.w, o.week)),
                                              null != t.d
                                                  ? ((s = t.d) < 0 || s > 6) &&
                                                    (_ = !0)
                                                  : null != t.e
                                                  ? ((s = t.e + r),
                                                    (t.e < 0 || t.e > 6) &&
                                                        (_ = !0))
                                                  : (s = r)),
                                            n < 1 || n > Ce(a, r, i)
                                                ? (M(e)._overflowWeeks = !0)
                                                : null != _
                                                ? (M(e)._overflowWeekday = !0)
                                                : ((d = Fe(a, n, s, r, i)),
                                                  (e._a[0] = d.year),
                                                  (e._dayOfYear = d.dayOfYear));
                                    })(e),
                                null != e._dayOfYear &&
                                    ((i = kt(e._a[0], n[0])),
                                    (e._dayOfYear > Oe(i) ||
                                        0 === e._dayOfYear) &&
                                        (M(e)._overflowDayOfYear = !0),
                                    (a = Ae(i, 0, e._dayOfYear)),
                                    (e._a[1] = a.getUTCMonth()),
                                    (e._a[2] = a.getUTCDate())),
                                t = 0;
                            t < 3 && null == e._a[t];
                            ++t
                        )
                            e._a[t] = d[t] = n[t];
                        for (; t < 7; t++)
                            e._a[t] = d[t] =
                                null == e._a[t] ? (2 === t ? 1 : 0) : e._a[t];
                        24 === e._a[3] &&
                            0 === e._a[4] &&
                            0 === e._a[5] &&
                            0 === e._a[6] &&
                            ((e._nextDay = !0), (e._a[3] = 0)),
                            (e._d = (e._useUTC ? Ae : We).apply(null, d)),
                            (r = e._useUTC ? e._d.getUTCDay() : e._d.getDay()),
                            null != e._tzm &&
                                e._d.setUTCMinutes(
                                    e._d.getUTCMinutes() - e._tzm
                                ),
                            e._nextDay && (e._a[3] = 24),
                            e._w &&
                                void 0 !== e._w.d &&
                                e._w.d !== r &&
                                (M(e).weekdayMismatch = !0);
                    }
                }
                function gt(e) {
                    if (e._f !== s.ISO_8601)
                        if (e._f !== s.RFC_2822) {
                            (e._a = []), (M(e).empty = !0);
                            var t,
                                a,
                                n,
                                r,
                                i,
                                d,
                                _,
                                o = '' + e._i,
                                u = o.length,
                                m = 0;
                            for (
                                _ = (n = z(e._f, e._locale).match(O) || [])
                                    .length,
                                    t = 0;
                                t < _;
                                t++
                            )
                                (r = n[t]),
                                    (a = (o.match(Me(r, e)) || [])[0]) &&
                                        ((i = o.substr(0, o.indexOf(a)))
                                            .length > 0 &&
                                            M(e).unusedInput.push(i),
                                        (o = o.slice(o.indexOf(a) + a.length)),
                                        (m += a.length)),
                                    A[r]
                                        ? (a
                                              ? (M(e).empty = !1)
                                              : M(e).unusedTokens.push(r),
                                          pe(r, a, e))
                                        : e._strict &&
                                          !a &&
                                          M(e).unusedTokens.push(r);
                            (M(e).charsLeftOver = u - m),
                                o.length > 0 && M(e).unusedInput.push(o),
                                e._a[3] <= 12 &&
                                    !0 === M(e).bigHour &&
                                    e._a[3] > 0 &&
                                    (M(e).bigHour = void 0),
                                (M(e).parsedDateParts = e._a.slice(0)),
                                (M(e).meridiem = e._meridiem),
                                (e._a[3] = (function(e, t, a) {
                                    var n;
                                    return null == a
                                        ? t
                                        : null != e.meridiemHour
                                        ? e.meridiemHour(t, a)
                                        : null != e.isPM
                                        ? ((n = e.isPM(a)) &&
                                              t < 12 &&
                                              (t += 12),
                                          n || 12 !== t || (t = 0),
                                          t)
                                        : t;
                                })(e._locale, e._a[3], e._meridiem)),
                                null !== (d = M(e).era) &&
                                    (e._a[0] = e._locale.erasConvertYear(
                                        d,
                                        e._a[0]
                                    )),
                                Dt(e),
                                ot(e);
                        } else pt(e);
                    else ft(e);
                }
                function Tt(e) {
                    var t = e._i,
                        a = e._f;
                    return (
                        (e._locale = e._locale || _t(e._l)),
                        null === t || (void 0 === a && '' === t)
                            ? Y({ nullInput: !0 })
                            : ('string' == typeof t &&
                                  (e._i = t = e._locale.preparse(t)),
                              D(t)
                                  ? new k(ot(t))
                                  : (m(t)
                                        ? (e._d = t)
                                        : r(a)
                                        ? (function(e) {
                                              var t,
                                                  a,
                                                  n,
                                                  s,
                                                  r,
                                                  i,
                                                  d = !1,
                                                  _ = e._f.length;
                                              if (0 === _)
                                                  return (
                                                      (M(e).invalidFormat = !0),
                                                      void (e._d = new Date(
                                                          NaN
                                                      ))
                                                  );
                                              for (s = 0; s < _; s++)
                                                  (r = 0),
                                                      (i = !1),
                                                      (t = p({}, e)),
                                                      null != e._useUTC &&
                                                          (t._useUTC =
                                                              e._useUTC),
                                                      (t._f = e._f[s]),
                                                      gt(t),
                                                      L(t) && (i = !0),
                                                      (r += M(t).charsLeftOver),
                                                      (r +=
                                                          10 *
                                                          M(t).unusedTokens
                                                              .length),
                                                      (M(t).score = r),
                                                      d
                                                          ? r < n &&
                                                            ((n = r), (a = t))
                                                          : (null == n ||
                                                                r < n ||
                                                                i) &&
                                                            ((n = r),
                                                            (a = t),
                                                            i && (d = !0));
                                              c(e, a || t);
                                          })(e)
                                        : a
                                        ? gt(e)
                                        : (function(e) {
                                              var t = e._i;
                                              o(t)
                                                  ? (e._d = new Date(s.now()))
                                                  : m(t)
                                                  ? (e._d = new Date(
                                                        t.valueOf()
                                                    ))
                                                  : 'string' == typeof t
                                                  ? (function(e) {
                                                        var t = Mt.exec(e._i);
                                                        null === t
                                                            ? (ft(e),
                                                              !1 ===
                                                                  e._isValid &&
                                                                  (delete e._isValid,
                                                                  pt(e),
                                                                  !1 ===
                                                                      e._isValid &&
                                                                      (delete e._isValid,
                                                                      e._strict
                                                                          ? (e._isValid = !1)
                                                                          : s.createFromInputFallback(
                                                                                e
                                                                            ))))
                                                            : (e._d = new Date(
                                                                  +t[1]
                                                              ));
                                                    })(e)
                                                  : r(t)
                                                  ? ((e._a = l(
                                                        t.slice(0),
                                                        function(e) {
                                                            return parseInt(
                                                                e,
                                                                10
                                                            );
                                                        }
                                                    )),
                                                    Dt(e))
                                                  : i(t)
                                                  ? (function(e) {
                                                        if (!e._d) {
                                                            var t = J(e._i),
                                                                a =
                                                                    void 0 ===
                                                                    t.day
                                                                        ? t.date
                                                                        : t.day;
                                                            (e._a = l(
                                                                [
                                                                    t.year,
                                                                    t.month,
                                                                    a,
                                                                    t.hour,
                                                                    t.minute,
                                                                    t.second,
                                                                    t.millisecond,
                                                                ],
                                                                function(e) {
                                                                    return (
                                                                        e &&
                                                                        parseInt(
                                                                            e,
                                                                            10
                                                                        )
                                                                    );
                                                                }
                                                            )),
                                                                Dt(e);
                                                        }
                                                    })(e)
                                                  : u(t)
                                                  ? (e._d = new Date(t))
                                                  : s.createFromInputFallback(
                                                        e
                                                    );
                                          })(e),
                                    L(e) || (e._d = null),
                                    e))
                    );
                }
                function wt(e, t, a, n, s) {
                    var d,
                        o = {};
                    return (
                        (!0 !== t && !1 !== t) || ((n = t), (t = void 0)),
                        (!0 !== a && !1 !== a) || ((n = a), (a = void 0)),
                        ((i(e) && _(e)) || (r(e) && 0 === e.length)) &&
                            (e = void 0),
                        (o._isAMomentObject = !0),
                        (o._useUTC = o._isUTC = s),
                        (o._l = a),
                        (o._i = e),
                        (o._f = t),
                        (o._strict = n),
                        (d = new k(ot(Tt(o))))._nextDay &&
                            (d.add(1, 'd'), (d._nextDay = void 0)),
                        d
                    );
                }
                function vt(e, t, a, n) {
                    return wt(e, t, a, n, !1);
                }
                (s.createFromInputFallback = T(
                    'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.',
                    function(e) {
                        e._d = new Date(e._i + (e._useUTC ? ' UTC' : ''));
                    }
                )),
                    (s.ISO_8601 = function() {}),
                    (s.RFC_2822 = function() {});
                var bt = T(
                        'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
                        function() {
                            var e = vt.apply(null, arguments);
                            return this.isValid() && e.isValid()
                                ? e < this
                                    ? this
                                    : e
                                : Y();
                        }
                    ),
                    St = T(
                        'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
                        function() {
                            var e = vt.apply(null, arguments);
                            return this.isValid() && e.isValid()
                                ? e > this
                                    ? this
                                    : e
                                : Y();
                        }
                    );
                function Ht(e, t) {
                    var a, n;
                    if ((1 === t.length && r(t[0]) && (t = t[0]), !t.length))
                        return vt();
                    for (a = t[0], n = 1; n < t.length; ++n)
                        (t[n].isValid() && !t[n][e](a)) || (a = t[n]);
                    return a;
                }
                var jt = [
                    'year',
                    'quarter',
                    'month',
                    'week',
                    'day',
                    'hour',
                    'minute',
                    'second',
                    'millisecond',
                ];
                function xt(e) {
                    var t = J(e),
                        a = t.year || 0,
                        n = t.quarter || 0,
                        s = t.month || 0,
                        r = t.week || t.isoWeek || 0,
                        i = t.day || 0,
                        _ = t.hour || 0,
                        o = t.minute || 0,
                        u = t.second || 0,
                        m = t.millisecond || 0;
                    (this._isValid = (function(e) {
                        var t,
                            a,
                            n = !1,
                            s = jt.length;
                        for (t in e)
                            if (
                                d(e, t) &&
                                (-1 === ke.call(jt, t) ||
                                    (null != e[t] && isNaN(e[t])))
                            )
                                return !1;
                        for (a = 0; a < s; ++a)
                            if (e[jt[a]]) {
                                if (n) return !1;
                                parseFloat(e[jt[a]]) !== B(e[jt[a]]) &&
                                    (n = !0);
                            }
                        return !0;
                    })(t)),
                        (this._milliseconds =
                            +m + 1e3 * u + 6e4 * o + 1e3 * _ * 60 * 60),
                        (this._days = +i + 7 * r),
                        (this._months = +s + 3 * n + 12 * a),
                        (this._data = {}),
                        (this._locale = _t()),
                        this._bubble();
                }
                function Ot(e) {
                    return e instanceof xt;
                }
                function Pt(e) {
                    return e < 0 ? -1 * Math.round(-1 * e) : Math.round(e);
                }
                function Wt(e, t) {
                    E(e, 0, 0, function() {
                        var e = this.utcOffset(),
                            a = '+';
                        return (
                            e < 0 && ((e = -e), (a = '-')),
                            a + x(~~(e / 60), 2) + t + x(~~e % 60, 2)
                        );
                    });
                }
                Wt('Z', ':'),
                    Wt('ZZ', ''),
                    he('Z', le),
                    he('ZZ', le),
                    fe(['Z', 'ZZ'], function(e, t, a) {
                        (a._useUTC = !0), (a._tzm = Et(le, e));
                    });
                var At = /([\+\-]|\d\d)/gi;
                function Et(e, t) {
                    var a,
                        n,
                        s = (t || '').match(e);
                    return null === s
                        ? null
                        : 0 ===
                          (n =
                              60 *
                                  (a = ((s[s.length - 1] || []) + '').match(
                                      At
                                  ) || ['-', 0, 0])[1] +
                              B(a[2]))
                        ? 0
                        : '+' === a[0]
                        ? n
                        : -n;
                }
                function Ft(e, t) {
                    var a, n;
                    return t._isUTC
                        ? ((a = t.clone()),
                          (n =
                              (D(e) || m(e) ? e.valueOf() : vt(e).valueOf()) -
                              a.valueOf()),
                          a._d.setTime(a._d.valueOf() + n),
                          s.updateOffset(a, !1),
                          a)
                        : vt(e).local();
                }
                function zt(e) {
                    return -Math.round(e._d.getTimezoneOffset());
                }
                function Ct() {
                    return (
                        !!this.isValid() && this._isUTC && 0 === this._offset
                    );
                }
                s.updateOffset = function() {};
                var Nt = /^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/,
                    Rt = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;
                function Jt(e, t) {
                    var a,
                        n,
                        s,
                        r,
                        i,
                        _,
                        o = e,
                        m = null;
                    return (
                        Ot(e)
                            ? (o = {
                                  ms: e._milliseconds,
                                  d: e._days,
                                  M: e._months,
                              })
                            : u(e) || !isNaN(+e)
                            ? ((o = {}),
                              t ? (o[t] = +e) : (o.milliseconds = +e))
                            : (m = Nt.exec(e))
                            ? ((a = '-' === m[1] ? -1 : 1),
                              (o = {
                                  y: 0,
                                  d: B(m[2]) * a,
                                  h: B(m[3]) * a,
                                  m: B(m[4]) * a,
                                  s: B(m[5]) * a,
                                  ms: B(Pt(1e3 * m[6])) * a,
                              }))
                            : (m = Rt.exec(e))
                            ? ((a = '-' === m[1] ? -1 : 1),
                              (o = {
                                  y: Ut(m[2], a),
                                  M: Ut(m[3], a),
                                  w: Ut(m[4], a),
                                  d: Ut(m[5], a),
                                  h: Ut(m[6], a),
                                  m: Ut(m[7], a),
                                  s: Ut(m[8], a),
                              }))
                            : null == o
                            ? (o = {})
                            : 'object' == typeof o &&
                              ('from' in o || 'to' in o) &&
                              ((r = vt(o.from)),
                              (i = vt(o.to)),
                              (s =
                                  r.isValid() && i.isValid()
                                      ? ((i = Ft(i, r)),
                                        r.isBefore(i)
                                            ? (_ = It(r, i))
                                            : (((_ = It(
                                                  i,
                                                  r
                                              )).milliseconds = -_.milliseconds),
                                              (_.months = -_.months)),
                                        _)
                                      : { milliseconds: 0, months: 0 }),
                              ((o = {}).ms = s.milliseconds),
                              (o.M = s.months)),
                        (n = new xt(o)),
                        Ot(e) && d(e, '_locale') && (n._locale = e._locale),
                        Ot(e) && d(e, '_isValid') && (n._isValid = e._isValid),
                        n
                    );
                }
                function Ut(e, t) {
                    var a = e && parseFloat(e.replace(',', '.'));
                    return (isNaN(a) ? 0 : a) * t;
                }
                function It(e, t) {
                    var a = {};
                    return (
                        (a.months =
                            t.month() - e.month() + 12 * (t.year() - e.year())),
                        e
                            .clone()
                            .add(a.months, 'M')
                            .isAfter(t) && --a.months,
                        (a.milliseconds = +t - +e.clone().add(a.months, 'M')),
                        a
                    );
                }
                function Gt(e, t) {
                    return function(a, n) {
                        var s;
                        return (
                            null === n ||
                                isNaN(+n) ||
                                (b(
                                    t,
                                    'moment().' +
                                        t +
                                        '(period, number) is deprecated. Please use moment().' +
                                        t +
                                        '(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.'
                                ),
                                (s = a),
                                (a = n),
                                (n = s)),
                            Vt(this, Jt(a, n), e),
                            this
                        );
                    };
                }
                function Vt(e, t, a, n) {
                    var r = t._milliseconds,
                        i = Pt(t._days),
                        d = Pt(t._months);
                    e.isValid() &&
                        ((n = null == n || n),
                        d && He(e, q(e, 'Month') + d * a),
                        i && K(e, 'Date', q(e, 'Date') + i * a),
                        r && e._d.setTime(e._d.valueOf() + r * a),
                        n && s.updateOffset(e, i || d));
                }
                (Jt.fn = xt.prototype),
                    (Jt.invalid = function() {
                        return Jt(NaN);
                    });
                var Bt = Gt(1, 'add'),
                    $t = Gt(-1, 'subtract');
                function qt(e) {
                    return 'string' == typeof e || e instanceof String;
                }
                function Kt(e) {
                    return (
                        D(e) ||
                        m(e) ||
                        qt(e) ||
                        u(e) ||
                        (function(e) {
                            var t = r(e),
                                a = !1;
                            return (
                                t &&
                                    (a =
                                        0 ===
                                        e.filter(function(t) {
                                            return !u(t) && qt(e);
                                        }).length),
                                t && a
                            );
                        })(e) ||
                        (function(e) {
                            var t,
                                a,
                                n = i(e) && !_(e),
                                s = !1,
                                r = [
                                    'years',
                                    'year',
                                    'y',
                                    'months',
                                    'month',
                                    'M',
                                    'days',
                                    'day',
                                    'd',
                                    'dates',
                                    'date',
                                    'D',
                                    'hours',
                                    'hour',
                                    'h',
                                    'minutes',
                                    'minute',
                                    'm',
                                    'seconds',
                                    'second',
                                    's',
                                    'milliseconds',
                                    'millisecond',
                                    'ms',
                                ],
                                o = r.length;
                            for (t = 0; t < o; t += 1)
                                (a = r[t]), (s = s || d(e, a));
                            return n && s;
                        })(e) ||
                        null == e
                    );
                }
                function Zt(e) {
                    var t,
                        a = i(e) && !_(e),
                        n = !1,
                        s = [
                            'sameDay',
                            'nextDay',
                            'lastDay',
                            'nextWeek',
                            'lastWeek',
                            'sameElse',
                        ];
                    for (t = 0; t < s.length; t += 1) n = n || d(e, s[t]);
                    return a && n;
                }
                function Qt(e, t) {
                    if (e.date() < t.date()) return -Qt(t, e);
                    var a =
                            12 * (t.year() - e.year()) +
                            (t.month() - e.month()),
                        n = e.clone().add(a, 'months');
                    return (
                        -(
                            a +
                            (t - n < 0
                                ? (t - n) / (n - e.clone().add(a - 1, 'months'))
                                : (t - n) /
                                  (e.clone().add(a + 1, 'months') - n))
                        ) || 0
                    );
                }
                function Xt(e) {
                    var t;
                    return void 0 === e
                        ? this._locale._abbr
                        : (null != (t = _t(e)) && (this._locale = t), this);
                }
                (s.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ'),
                    (s.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]');
                var ea = T(
                    'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
                    function(e) {
                        return void 0 === e
                            ? this.localeData()
                            : this.locale(e);
                    }
                );
                function ta() {
                    return this._locale;
                }
                var aa = 1e3,
                    na = 6e4,
                    sa = 36e5,
                    ra = 126227808e5;
                function ia(e, t) {
                    return ((e % t) + t) % t;
                }
                function da(e, t, a) {
                    return e < 100 && e >= 0
                        ? new Date(e + 400, t, a) - ra
                        : new Date(e, t, a).valueOf();
                }
                function _a(e, t, a) {
                    return e < 100 && e >= 0
                        ? Date.UTC(e + 400, t, a) - ra
                        : Date.UTC(e, t, a);
                }
                function oa(e, t) {
                    return t.erasAbbrRegex(e);
                }
                function ua() {
                    var e,
                        t,
                        a = [],
                        n = [],
                        s = [],
                        r = [],
                        i = this.eras();
                    for (e = 0, t = i.length; e < t; ++e)
                        n.push(Le(i[e].name)),
                            a.push(Le(i[e].abbr)),
                            s.push(Le(i[e].narrow)),
                            r.push(Le(i[e].name)),
                            r.push(Le(i[e].abbr)),
                            r.push(Le(i[e].narrow));
                    (this._erasRegex = new RegExp(
                        '^(' + r.join('|') + ')',
                        'i'
                    )),
                        (this._erasNameRegex = new RegExp(
                            '^(' + n.join('|') + ')',
                            'i'
                        )),
                        (this._erasAbbrRegex = new RegExp(
                            '^(' + a.join('|') + ')',
                            'i'
                        )),
                        (this._erasNarrowRegex = new RegExp(
                            '^(' + s.join('|') + ')',
                            'i'
                        ));
                }
                function ma(e, t) {
                    E(0, [e, e.length], 0, t);
                }
                function la(e, t, a, n, s) {
                    var r;
                    return null == e
                        ? ze(this, n, s).year
                        : (t > (r = Ce(e, n, s)) && (t = r),
                          ca.call(this, e, t, a, n, s));
                }
                function ca(e, t, a, n, s) {
                    var r = Fe(e, t, a, n, s),
                        i = Ae(r.year, 0, r.dayOfYear);
                    return (
                        this.year(i.getUTCFullYear()),
                        this.month(i.getUTCMonth()),
                        this.date(i.getUTCDate()),
                        this
                    );
                }
                E('N', 0, 0, 'eraAbbr'),
                    E('NN', 0, 0, 'eraAbbr'),
                    E('NNN', 0, 0, 'eraAbbr'),
                    E('NNNN', 0, 0, 'eraName'),
                    E('NNNNN', 0, 0, 'eraNarrow'),
                    E('y', ['y', 1], 'yo', 'eraYear'),
                    E('y', ['yy', 2], 0, 'eraYear'),
                    E('y', ['yyy', 3], 0, 'eraYear'),
                    E('y', ['yyyy', 4], 0, 'eraYear'),
                    he('N', oa),
                    he('NN', oa),
                    he('NNN', oa),
                    he('NNNN', function(e, t) {
                        return t.erasNameRegex(e);
                    }),
                    he('NNNNN', function(e, t) {
                        return t.erasNarrowRegex(e);
                    }),
                    fe(['N', 'NN', 'NNN', 'NNNN', 'NNNNN'], function(
                        e,
                        t,
                        a,
                        n
                    ) {
                        var s = a._locale.erasParse(e, n, a._strict);
                        s ? (M(a).era = s) : (M(a).invalidEra = e);
                    }),
                    he('y', oe),
                    he('yy', oe),
                    he('yyy', oe),
                    he('yyyy', oe),
                    he('yo', function(e, t) {
                        return t._eraYearOrdinalRegex || oe;
                    }),
                    fe(['y', 'yy', 'yyy', 'yyyy'], 0),
                    fe(['yo'], function(e, t, a, n) {
                        var s;
                        a._locale._eraYearOrdinalRegex &&
                            (s = e.match(a._locale._eraYearOrdinalRegex)),
                            a._locale.eraYearOrdinalParse
                                ? (t[0] = a._locale.eraYearOrdinalParse(e, s))
                                : (t[0] = parseInt(e, 10));
                    }),
                    E(0, ['gg', 2], 0, function() {
                        return this.weekYear() % 100;
                    }),
                    E(0, ['GG', 2], 0, function() {
                        return this.isoWeekYear() % 100;
                    }),
                    ma('gggg', 'weekYear'),
                    ma('ggggg', 'weekYear'),
                    ma('GGGG', 'isoWeekYear'),
                    ma('GGGGG', 'isoWeekYear'),
                    N('weekYear', 'gg'),
                    N('isoWeekYear', 'GG'),
                    I('weekYear', 1),
                    I('isoWeekYear', 1),
                    he('G', ue),
                    he('g', ue),
                    he('GG', ne, X),
                    he('gg', ne, X),
                    he('GGGG', de, te),
                    he('gggg', de, te),
                    he('GGGGG', _e, ae),
                    he('ggggg', _e, ae),
                    ye(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function(
                        e,
                        t,
                        a,
                        n
                    ) {
                        t[n.substr(0, 2)] = B(e);
                    }),
                    ye(['gg', 'GG'], function(e, t, a, n) {
                        t[n] = s.parseTwoDigitYear(e);
                    }),
                    E('Q', 0, 'Qo', 'quarter'),
                    N('quarter', 'Q'),
                    I('quarter', 7),
                    he('Q', Q),
                    fe('Q', function(e, t) {
                        t[1] = 3 * (B(e) - 1);
                    }),
                    E('D', ['DD', 2], 'Do', 'date'),
                    N('date', 'D'),
                    I('date', 9),
                    he('D', ne),
                    he('DD', ne, X),
                    he('Do', function(e, t) {
                        return e
                            ? t._dayOfMonthOrdinalParse || t._ordinalParse
                            : t._dayOfMonthOrdinalParseLenient;
                    }),
                    fe(['D', 'DD'], 2),
                    fe('Do', function(e, t) {
                        t[2] = B(e.match(ne)[0]);
                    });
                var ha = $('Date', !0);
                E('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear'),
                    N('dayOfYear', 'DDD'),
                    I('dayOfYear', 4),
                    he('DDD', ie),
                    he('DDDD', ee),
                    fe(['DDD', 'DDDD'], function(e, t, a) {
                        a._dayOfYear = B(e);
                    }),
                    E('m', ['mm', 2], 0, 'minute'),
                    N('minute', 'm'),
                    I('minute', 14),
                    he('m', ne),
                    he('mm', ne, X),
                    fe(['m', 'mm'], 4);
                var Ma = $('Minutes', !1);
                E('s', ['ss', 2], 0, 'second'),
                    N('second', 's'),
                    I('second', 15),
                    he('s', ne),
                    he('ss', ne, X),
                    fe(['s', 'ss'], 5);
                var La,
                    Ya,
                    fa = $('Seconds', !1);
                for (
                    E('S', 0, 0, function() {
                        return ~~(this.millisecond() / 100);
                    }),
                        E(0, ['SS', 2], 0, function() {
                            return ~~(this.millisecond() / 10);
                        }),
                        E(0, ['SSS', 3], 0, 'millisecond'),
                        E(0, ['SSSS', 4], 0, function() {
                            return 10 * this.millisecond();
                        }),
                        E(0, ['SSSSS', 5], 0, function() {
                            return 100 * this.millisecond();
                        }),
                        E(0, ['SSSSSS', 6], 0, function() {
                            return 1e3 * this.millisecond();
                        }),
                        E(0, ['SSSSSSS', 7], 0, function() {
                            return 1e4 * this.millisecond();
                        }),
                        E(0, ['SSSSSSSS', 8], 0, function() {
                            return 1e5 * this.millisecond();
                        }),
                        E(0, ['SSSSSSSSS', 9], 0, function() {
                            return 1e6 * this.millisecond();
                        }),
                        N('millisecond', 'ms'),
                        I('millisecond', 16),
                        he('S', ie, Q),
                        he('SS', ie, X),
                        he('SSS', ie, ee),
                        La = 'SSSS';
                    La.length <= 9;
                    La += 'S'
                )
                    he(La, oe);
                function ya(e, t) {
                    t[6] = B(1e3 * ('0.' + e));
                }
                for (La = 'S'; La.length <= 9; La += 'S') fe(La, ya);
                (Ya = $('Milliseconds', !1)),
                    E('z', 0, 0, 'zoneAbbr'),
                    E('zz', 0, 0, 'zoneName');
                var pa = k.prototype;
                function ka(e) {
                    return e;
                }
                (pa.add = Bt),
                    (pa.calendar = function(e, t) {
                        1 === arguments.length &&
                            (arguments[0]
                                ? Kt(arguments[0])
                                    ? ((e = arguments[0]), (t = void 0))
                                    : Zt(arguments[0]) &&
                                      ((t = arguments[0]), (e = void 0))
                                : ((e = void 0), (t = void 0)));
                        var a = e || vt(),
                            n = Ft(a, this).startOf('day'),
                            r = s.calendarFormat(this, n) || 'sameElse',
                            i = t && (S(t[r]) ? t[r].call(this, a) : t[r]);
                        return this.format(
                            i || this.localeData().calendar(r, this, vt(a))
                        );
                    }),
                    (pa.clone = function() {
                        return new k(this);
                    }),
                    (pa.diff = function(e, t, a) {
                        var n, s, r;
                        if (!this.isValid()) return NaN;
                        if (!(n = Ft(e, this)).isValid()) return NaN;
                        switch (
                            ((s = 6e4 * (n.utcOffset() - this.utcOffset())),
                            (t = R(t)))
                        ) {
                            case 'year':
                                r = Qt(this, n) / 12;
                                break;
                            case 'month':
                                r = Qt(this, n);
                                break;
                            case 'quarter':
                                r = Qt(this, n) / 3;
                                break;
                            case 'second':
                                r = (this - n) / 1e3;
                                break;
                            case 'minute':
                                r = (this - n) / 6e4;
                                break;
                            case 'hour':
                                r = (this - n) / 36e5;
                                break;
                            case 'day':
                                r = (this - n - s) / 864e5;
                                break;
                            case 'week':
                                r = (this - n - s) / 6048e5;
                                break;
                            default:
                                r = this - n;
                        }
                        return a ? r : V(r);
                    }),
                    (pa.endOf = function(e) {
                        var t, a;
                        if (
                            void 0 === (e = R(e)) ||
                            'millisecond' === e ||
                            !this.isValid()
                        )
                            return this;
                        switch (((a = this._isUTC ? _a : da), e)) {
                            case 'year':
                                t = a(this.year() + 1, 0, 1) - 1;
                                break;
                            case 'quarter':
                                t =
                                    a(
                                        this.year(),
                                        this.month() - (this.month() % 3) + 3,
                                        1
                                    ) - 1;
                                break;
                            case 'month':
                                t = a(this.year(), this.month() + 1, 1) - 1;
                                break;
                            case 'week':
                                t =
                                    a(
                                        this.year(),
                                        this.month(),
                                        this.date() - this.weekday() + 7
                                    ) - 1;
                                break;
                            case 'isoWeek':
                                t =
                                    a(
                                        this.year(),
                                        this.month(),
                                        this.date() -
                                            (this.isoWeekday() - 1) +
                                            7
                                    ) - 1;
                                break;
                            case 'day':
                            case 'date':
                                t =
                                    a(
                                        this.year(),
                                        this.month(),
                                        this.date() + 1
                                    ) - 1;
                                break;
                            case 'hour':
                                (t = this._d.valueOf()),
                                    (t +=
                                        sa -
                                        ia(
                                            t +
                                                (this._isUTC
                                                    ? 0
                                                    : this.utcOffset() * na),
                                            sa
                                        ) -
                                        1);
                                break;
                            case 'minute':
                                (t = this._d.valueOf()),
                                    (t += na - ia(t, na) - 1);
                                break;
                            case 'second':
                                (t = this._d.valueOf()),
                                    (t += aa - ia(t, aa) - 1);
                        }
                        return (
                            this._d.setTime(t), s.updateOffset(this, !0), this
                        );
                    }),
                    (pa.format = function(e) {
                        e ||
                            (e = this.isUtc()
                                ? s.defaultFormatUtc
                                : s.defaultFormat);
                        var t = F(this, e);
                        return this.localeData().postformat(t);
                    }),
                    (pa.from = function(e, t) {
                        return this.isValid() &&
                            ((D(e) && e.isValid()) || vt(e).isValid())
                            ? Jt({ to: this, from: e })
                                  .locale(this.locale())
                                  .humanize(!t)
                            : this.localeData().invalidDate();
                    }),
                    (pa.fromNow = function(e) {
                        return this.from(vt(), e);
                    }),
                    (pa.to = function(e, t) {
                        return this.isValid() &&
                            ((D(e) && e.isValid()) || vt(e).isValid())
                            ? Jt({ from: this, to: e })
                                  .locale(this.locale())
                                  .humanize(!t)
                            : this.localeData().invalidDate();
                    }),
                    (pa.toNow = function(e) {
                        return this.to(vt(), e);
                    }),
                    (pa.get = function(e) {
                        return S(this[(e = R(e))]) ? this[e]() : this;
                    }),
                    (pa.invalidAt = function() {
                        return M(this).overflow;
                    }),
                    (pa.isAfter = function(e, t) {
                        var a = D(e) ? e : vt(e);
                        return (
                            !(!this.isValid() || !a.isValid()) &&
                            ('millisecond' === (t = R(t) || 'millisecond')
                                ? this.valueOf() > a.valueOf()
                                : a.valueOf() <
                                  this.clone()
                                      .startOf(t)
                                      .valueOf())
                        );
                    }),
                    (pa.isBefore = function(e, t) {
                        var a = D(e) ? e : vt(e);
                        return (
                            !(!this.isValid() || !a.isValid()) &&
                            ('millisecond' === (t = R(t) || 'millisecond')
                                ? this.valueOf() < a.valueOf()
                                : this.clone()
                                      .endOf(t)
                                      .valueOf() < a.valueOf())
                        );
                    }),
                    (pa.isBetween = function(e, t, a, n) {
                        var s = D(e) ? e : vt(e),
                            r = D(t) ? t : vt(t);
                        return (
                            !!(this.isValid() && s.isValid() && r.isValid()) &&
                            ('(' === (n = n || '()')[0]
                                ? this.isAfter(s, a)
                                : !this.isBefore(s, a)) &&
                            (')' === n[1]
                                ? this.isBefore(r, a)
                                : !this.isAfter(r, a))
                        );
                    }),
                    (pa.isSame = function(e, t) {
                        var a,
                            n = D(e) ? e : vt(e);
                        return (
                            !(!this.isValid() || !n.isValid()) &&
                            ('millisecond' === (t = R(t) || 'millisecond')
                                ? this.valueOf() === n.valueOf()
                                : ((a = n.valueOf()),
                                  this.clone()
                                      .startOf(t)
                                      .valueOf() <= a &&
                                      a <=
                                          this.clone()
                                              .endOf(t)
                                              .valueOf()))
                        );
                    }),
                    (pa.isSameOrAfter = function(e, t) {
                        return this.isSame(e, t) || this.isAfter(e, t);
                    }),
                    (pa.isSameOrBefore = function(e, t) {
                        return this.isSame(e, t) || this.isBefore(e, t);
                    }),
                    (pa.isValid = function() {
                        return L(this);
                    }),
                    (pa.lang = ea),
                    (pa.locale = Xt),
                    (pa.localeData = ta),
                    (pa.max = St),
                    (pa.min = bt),
                    (pa.parsingFlags = function() {
                        return c({}, M(this));
                    }),
                    (pa.set = function(e, t) {
                        if ('object' == typeof e) {
                            var a,
                                n = (function(e) {
                                    var t,
                                        a = [];
                                    for (t in e)
                                        d(e, t) &&
                                            a.push({ unit: t, priority: U[t] });
                                    return (
                                        a.sort(function(e, t) {
                                            return e.priority - t.priority;
                                        }),
                                        a
                                    );
                                })((e = J(e))),
                                s = n.length;
                            for (a = 0; a < s; a++)
                                this[n[a].unit](e[n[a].unit]);
                        } else if (S(this[(e = R(e))])) return this[e](t);
                        return this;
                    }),
                    (pa.startOf = function(e) {
                        var t, a;
                        if (
                            void 0 === (e = R(e)) ||
                            'millisecond' === e ||
                            !this.isValid()
                        )
                            return this;
                        switch (((a = this._isUTC ? _a : da), e)) {
                            case 'year':
                                t = a(this.year(), 0, 1);
                                break;
                            case 'quarter':
                                t = a(
                                    this.year(),
                                    this.month() - (this.month() % 3),
                                    1
                                );
                                break;
                            case 'month':
                                t = a(this.year(), this.month(), 1);
                                break;
                            case 'week':
                                t = a(
                                    this.year(),
                                    this.month(),
                                    this.date() - this.weekday()
                                );
                                break;
                            case 'isoWeek':
                                t = a(
                                    this.year(),
                                    this.month(),
                                    this.date() - (this.isoWeekday() - 1)
                                );
                                break;
                            case 'day':
                            case 'date':
                                t = a(this.year(), this.month(), this.date());
                                break;
                            case 'hour':
                                (t = this._d.valueOf()),
                                    (t -= ia(
                                        t +
                                            (this._isUTC
                                                ? 0
                                                : this.utcOffset() * na),
                                        sa
                                    ));
                                break;
                            case 'minute':
                                (t = this._d.valueOf()), (t -= ia(t, na));
                                break;
                            case 'second':
                                (t = this._d.valueOf()), (t -= ia(t, aa));
                        }
                        return (
                            this._d.setTime(t), s.updateOffset(this, !0), this
                        );
                    }),
                    (pa.subtract = $t),
                    (pa.toArray = function() {
                        var e = this;
                        return [
                            e.year(),
                            e.month(),
                            e.date(),
                            e.hour(),
                            e.minute(),
                            e.second(),
                            e.millisecond(),
                        ];
                    }),
                    (pa.toObject = function() {
                        var e = this;
                        return {
                            years: e.year(),
                            months: e.month(),
                            date: e.date(),
                            hours: e.hours(),
                            minutes: e.minutes(),
                            seconds: e.seconds(),
                            milliseconds: e.milliseconds(),
                        };
                    }),
                    (pa.toDate = function() {
                        return new Date(this.valueOf());
                    }),
                    (pa.toISOString = function(e) {
                        if (!this.isValid()) return null;
                        var t = !0 !== e,
                            a = t ? this.clone().utc() : this;
                        return a.year() < 0 || a.year() > 9999
                            ? F(
                                  a,
                                  t
                                      ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]'
                                      : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ'
                              )
                            : S(Date.prototype.toISOString)
                            ? t
                                ? this.toDate().toISOString()
                                : new Date(
                                      this.valueOf() +
                                          60 * this.utcOffset() * 1e3
                                  )
                                      .toISOString()
                                      .replace('Z', F(a, 'Z'))
                            : F(
                                  a,
                                  t
                                      ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'
                                      : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ'
                              );
                    }),
                    (pa.inspect = function() {
                        if (!this.isValid())
                            return 'moment.invalid(/* ' + this._i + ' */)';
                        var e,
                            t,
                            a,
                            n = 'moment',
                            s = '';
                        return (
                            this.isLocal() ||
                                ((n =
                                    0 === this.utcOffset()
                                        ? 'moment.utc'
                                        : 'moment.parseZone'),
                                (s = 'Z')),
                            (e = '[' + n + '("]'),
                            (t =
                                0 <= this.year() && this.year() <= 9999
                                    ? 'YYYY'
                                    : 'YYYYYY'),
                            '-MM-DD[T]HH:mm:ss.SSS',
                            (a = s + '[")]'),
                            this.format(e + t + '-MM-DD[T]HH:mm:ss.SSS' + a)
                        );
                    }),
                    'undefined' != typeof Symbol &&
                        null != Symbol.for &&
                        (pa[
                            Symbol.for('nodejs.util.inspect.custom')
                        ] = function() {
                            return 'Moment<' + this.format() + '>';
                        }),
                    (pa.toJSON = function() {
                        return this.isValid() ? this.toISOString() : null;
                    }),
                    (pa.toString = function() {
                        return this.clone()
                            .locale('en')
                            .format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
                    }),
                    (pa.unix = function() {
                        return Math.floor(this.valueOf() / 1e3);
                    }),
                    (pa.valueOf = function() {
                        return this._d.valueOf() - 6e4 * (this._offset || 0);
                    }),
                    (pa.creationData = function() {
                        return {
                            input: this._i,
                            format: this._f,
                            locale: this._locale,
                            isUTC: this._isUTC,
                            strict: this._strict,
                        };
                    }),
                    (pa.eraName = function() {
                        var e,
                            t,
                            a,
                            n = this.localeData().eras();
                        for (e = 0, t = n.length; e < t; ++e) {
                            if (
                                ((a = this.clone()
                                    .startOf('day')
                                    .valueOf()),
                                n[e].since <= a && a <= n[e].until)
                            )
                                return n[e].name;
                            if (n[e].until <= a && a <= n[e].since)
                                return n[e].name;
                        }
                        return '';
                    }),
                    (pa.eraNarrow = function() {
                        var e,
                            t,
                            a,
                            n = this.localeData().eras();
                        for (e = 0, t = n.length; e < t; ++e) {
                            if (
                                ((a = this.clone()
                                    .startOf('day')
                                    .valueOf()),
                                n[e].since <= a && a <= n[e].until)
                            )
                                return n[e].narrow;
                            if (n[e].until <= a && a <= n[e].since)
                                return n[e].narrow;
                        }
                        return '';
                    }),
                    (pa.eraAbbr = function() {
                        var e,
                            t,
                            a,
                            n = this.localeData().eras();
                        for (e = 0, t = n.length; e < t; ++e) {
                            if (
                                ((a = this.clone()
                                    .startOf('day')
                                    .valueOf()),
                                n[e].since <= a && a <= n[e].until)
                            )
                                return n[e].abbr;
                            if (n[e].until <= a && a <= n[e].since)
                                return n[e].abbr;
                        }
                        return '';
                    }),
                    (pa.eraYear = function() {
                        var e,
                            t,
                            a,
                            n,
                            r = this.localeData().eras();
                        for (e = 0, t = r.length; e < t; ++e)
                            if (
                                ((a = r[e].since <= r[e].until ? 1 : -1),
                                (n = this.clone()
                                    .startOf('day')
                                    .valueOf()),
                                (r[e].since <= n && n <= r[e].until) ||
                                    (r[e].until <= n && n <= r[e].since))
                            )
                                return (
                                    (this.year() - s(r[e].since).year()) * a +
                                    r[e].offset
                                );
                        return this.year();
                    }),
                    (pa.year = Pe),
                    (pa.isLeapYear = function() {
                        return G(this.year());
                    }),
                    (pa.weekYear = function(e) {
                        return la.call(
                            this,
                            e,
                            this.week(),
                            this.weekday(),
                            this.localeData()._week.dow,
                            this.localeData()._week.doy
                        );
                    }),
                    (pa.isoWeekYear = function(e) {
                        return la.call(
                            this,
                            e,
                            this.isoWeek(),
                            this.isoWeekday(),
                            1,
                            4
                        );
                    }),
                    (pa.quarter = pa.quarters = function(e) {
                        return null == e
                            ? Math.ceil((this.month() + 1) / 3)
                            : this.month(3 * (e - 1) + (this.month() % 3));
                    }),
                    (pa.month = je),
                    (pa.daysInMonth = function() {
                        return De(this.year(), this.month());
                    }),
                    (pa.week = pa.weeks = function(e) {
                        var t = this.localeData().week(this);
                        return null == e ? t : this.add(7 * (e - t), 'd');
                    }),
                    (pa.isoWeek = pa.isoWeeks = function(e) {
                        var t = ze(this, 1, 4).week;
                        return null == e ? t : this.add(7 * (e - t), 'd');
                    }),
                    (pa.weeksInYear = function() {
                        var e = this.localeData()._week;
                        return Ce(this.year(), e.dow, e.doy);
                    }),
                    (pa.weeksInWeekYear = function() {
                        var e = this.localeData()._week;
                        return Ce(this.weekYear(), e.dow, e.doy);
                    }),
                    (pa.isoWeeksInYear = function() {
                        return Ce(this.year(), 1, 4);
                    }),
                    (pa.isoWeeksInISOWeekYear = function() {
                        return Ce(this.isoWeekYear(), 1, 4);
                    }),
                    (pa.date = ha),
                    (pa.day = pa.days = function(e) {
                        if (!this.isValid()) return null != e ? this : NaN;
                        var t = this._isUTC
                            ? this._d.getUTCDay()
                            : this._d.getDay();
                        return null != e
                            ? ((e = (function(e, t) {
                                  return 'string' != typeof e
                                      ? e
                                      : isNaN(e)
                                      ? 'number' ==
                                        typeof (e = t.weekdaysParse(e))
                                          ? e
                                          : null
                                      : parseInt(e, 10);
                              })(e, this.localeData())),
                              this.add(e - t, 'd'))
                            : t;
                    }),
                    (pa.weekday = function(e) {
                        if (!this.isValid()) return null != e ? this : NaN;
                        var t =
                            (this.day() + 7 - this.localeData()._week.dow) % 7;
                        return null == e ? t : this.add(e - t, 'd');
                    }),
                    (pa.isoWeekday = function(e) {
                        if (!this.isValid()) return null != e ? this : NaN;
                        if (null != e) {
                            var t = (function(e, t) {
                                return 'string' == typeof e
                                    ? t.weekdaysParse(e) % 7 || 7
                                    : isNaN(e)
                                    ? null
                                    : e;
                            })(e, this.localeData());
                            return this.day(this.day() % 7 ? t : t - 7);
                        }
                        return this.day() || 7;
                    }),
                    (pa.dayOfYear = function(e) {
                        var t =
                            Math.round(
                                (this.clone().startOf('day') -
                                    this.clone().startOf('year')) /
                                    864e5
                            ) + 1;
                        return null == e ? t : this.add(e - t, 'd');
                    }),
                    (pa.hour = pa.hours = Qe),
                    (pa.minute = pa.minutes = Ma),
                    (pa.second = pa.seconds = fa),
                    (pa.millisecond = pa.milliseconds = Ya),
                    (pa.utcOffset = function(e, t, a) {
                        var n,
                            r = this._offset || 0;
                        if (!this.isValid()) return null != e ? this : NaN;
                        if (null != e) {
                            if ('string' == typeof e) {
                                if (null === (e = Et(le, e))) return this;
                            } else Math.abs(e) < 16 && !a && (e *= 60);
                            return (
                                !this._isUTC && t && (n = zt(this)),
                                (this._offset = e),
                                (this._isUTC = !0),
                                null != n && this.add(n, 'm'),
                                r !== e &&
                                    (!t || this._changeInProgress
                                        ? Vt(this, Jt(e - r, 'm'), 1, !1)
                                        : this._changeInProgress ||
                                          ((this._changeInProgress = !0),
                                          s.updateOffset(this, !0),
                                          (this._changeInProgress = null))),
                                this
                            );
                        }
                        return this._isUTC ? r : zt(this);
                    }),
                    (pa.utc = function(e) {
                        return this.utcOffset(0, e);
                    }),
                    (pa.local = function(e) {
                        return (
                            this._isUTC &&
                                (this.utcOffset(0, e),
                                (this._isUTC = !1),
                                e && this.subtract(zt(this), 'm')),
                            this
                        );
                    }),
                    (pa.parseZone = function() {
                        if (null != this._tzm)
                            this.utcOffset(this._tzm, !1, !0);
                        else if ('string' == typeof this._i) {
                            var e = Et(me, this._i);
                            null != e
                                ? this.utcOffset(e)
                                : this.utcOffset(0, !0);
                        }
                        return this;
                    }),
                    (pa.hasAlignedHourOffset = function(e) {
                        return (
                            !!this.isValid() &&
                            ((e = e ? vt(e).utcOffset() : 0),
                            (this.utcOffset() - e) % 60 == 0)
                        );
                    }),
                    (pa.isDST = function() {
                        return (
                            this.utcOffset() >
                                this.clone()
                                    .month(0)
                                    .utcOffset() ||
                            this.utcOffset() >
                                this.clone()
                                    .month(5)
                                    .utcOffset()
                        );
                    }),
                    (pa.isLocal = function() {
                        return !!this.isValid() && !this._isUTC;
                    }),
                    (pa.isUtcOffset = function() {
                        return !!this.isValid() && this._isUTC;
                    }),
                    (pa.isUtc = Ct),
                    (pa.isUTC = Ct),
                    (pa.zoneAbbr = function() {
                        return this._isUTC ? 'UTC' : '';
                    }),
                    (pa.zoneName = function() {
                        return this._isUTC ? 'Coordinated Universal Time' : '';
                    }),
                    (pa.dates = T(
                        'dates accessor is deprecated. Use date instead.',
                        ha
                    )),
                    (pa.months = T(
                        'months accessor is deprecated. Use month instead',
                        je
                    )),
                    (pa.years = T(
                        'years accessor is deprecated. Use year instead',
                        Pe
                    )),
                    (pa.zone = T(
                        'moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/',
                        function(e, t) {
                            return null != e
                                ? ('string' != typeof e && (e = -e),
                                  this.utcOffset(e, t),
                                  this)
                                : -this.utcOffset();
                        }
                    )),
                    (pa.isDSTShifted = T(
                        'isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information',
                        function() {
                            if (!o(this._isDSTShifted))
                                return this._isDSTShifted;
                            var e,
                                t = {};
                            return (
                                p(t, this),
                                (t = Tt(t))._a
                                    ? ((e = t._isUTC ? h(t._a) : vt(t._a)),
                                      (this._isDSTShifted =
                                          this.isValid() &&
                                          (function(e, t, a) {
                                              var n,
                                                  s = Math.min(
                                                      e.length,
                                                      t.length
                                                  ),
                                                  r = Math.abs(
                                                      e.length - t.length
                                                  ),
                                                  i = 0;
                                              for (n = 0; n < s; n++)
                                                  ((a && e[n] !== t[n]) ||
                                                      (!a &&
                                                          B(e[n]) !==
                                                              B(t[n]))) &&
                                                      i++;
                                              return i + r;
                                          })(t._a, e.toArray()) > 0))
                                    : (this._isDSTShifted = !1),
                                this._isDSTShifted
                            );
                        }
                    ));
                var Da = j.prototype;
                function ga(e, t, a, n) {
                    var s = _t(),
                        r = h().set(n, t);
                    return s[a](r, e);
                }
                function Ta(e, t, a) {
                    if (
                        (u(e) && ((t = e), (e = void 0)),
                        (e = e || ''),
                        null != t)
                    )
                        return ga(e, t, a, 'month');
                    var n,
                        s = [];
                    for (n = 0; n < 12; n++) s[n] = ga(e, n, a, 'month');
                    return s;
                }
                function wa(e, t, a, n) {
                    'boolean' == typeof e
                        ? (u(t) && ((a = t), (t = void 0)), (t = t || ''))
                        : ((a = t = e),
                          (e = !1),
                          u(t) && ((a = t), (t = void 0)),
                          (t = t || ''));
                    var s,
                        r = _t(),
                        i = e ? r._week.dow : 0,
                        d = [];
                    if (null != a) return ga(t, (a + i) % 7, n, 'day');
                    for (s = 0; s < 7; s++) d[s] = ga(t, (s + i) % 7, n, 'day');
                    return d;
                }
                (Da.calendar = function(e, t, a) {
                    var n = this._calendar[e] || this._calendar.sameElse;
                    return S(n) ? n.call(t, a) : n;
                }),
                    (Da.longDateFormat = function(e) {
                        var t = this._longDateFormat[e],
                            a = this._longDateFormat[e.toUpperCase()];
                        return t || !a
                            ? t
                            : ((this._longDateFormat[e] = a
                                  .match(O)
                                  .map(function(e) {
                                      return 'MMMM' === e ||
                                          'MM' === e ||
                                          'DD' === e ||
                                          'dddd' === e
                                          ? e.slice(1)
                                          : e;
                                  })
                                  .join('')),
                              this._longDateFormat[e]);
                    }),
                    (Da.invalidDate = function() {
                        return this._invalidDate;
                    }),
                    (Da.ordinal = function(e) {
                        return this._ordinal.replace('%d', e);
                    }),
                    (Da.preparse = ka),
                    (Da.postformat = ka),
                    (Da.relativeTime = function(e, t, a, n) {
                        var s = this._relativeTime[a];
                        return S(s) ? s(e, t, a, n) : s.replace(/%d/i, e);
                    }),
                    (Da.pastFuture = function(e, t) {
                        var a = this._relativeTime[e > 0 ? 'future' : 'past'];
                        return S(a) ? a(t) : a.replace(/%s/i, t);
                    }),
                    (Da.set = function(e) {
                        var t, a;
                        for (a in e)
                            d(e, a) &&
                                (S((t = e[a]))
                                    ? (this[a] = t)
                                    : (this['_' + a] = t));
                        (this._config = e),
                            (this._dayOfMonthOrdinalParseLenient = new RegExp(
                                (this._dayOfMonthOrdinalParse.source ||
                                    this._ordinalParse.source) +
                                    '|' +
                                    /\d{1,2}/.source
                            ));
                    }),
                    (Da.eras = function(e, t) {
                        var a,
                            n,
                            r,
                            i = this._eras || _t('en')._eras;
                        for (a = 0, n = i.length; a < n; ++a)
                            switch (
                                ('string' == typeof i[a].since &&
                                    ((r = s(i[a].since).startOf('day')),
                                    (i[a].since = r.valueOf())),
                                typeof i[a].until)
                            ) {
                                case 'undefined':
                                    i[a].until = 1 / 0;
                                    break;
                                case 'string':
                                    (r = s(i[a].until)
                                        .startOf('day')
                                        .valueOf()),
                                        (i[a].until = r.valueOf());
                            }
                        return i;
                    }),
                    (Da.erasParse = function(e, t, a) {
                        var n,
                            s,
                            r,
                            i,
                            d,
                            _ = this.eras();
                        for (
                            e = e.toUpperCase(), n = 0, s = _.length;
                            n < s;
                            ++n
                        )
                            if (
                                ((r = _[n].name.toUpperCase()),
                                (i = _[n].abbr.toUpperCase()),
                                (d = _[n].narrow.toUpperCase()),
                                a)
                            )
                                switch (t) {
                                    case 'N':
                                    case 'NN':
                                    case 'NNN':
                                        if (i === e) return _[n];
                                        break;
                                    case 'NNNN':
                                        if (r === e) return _[n];
                                        break;
                                    case 'NNNNN':
                                        if (d === e) return _[n];
                                }
                            else if ([r, i, d].indexOf(e) >= 0) return _[n];
                    }),
                    (Da.erasConvertYear = function(e, t) {
                        var a = e.since <= e.until ? 1 : -1;
                        return void 0 === t
                            ? s(e.since).year()
                            : s(e.since).year() + (t - e.offset) * a;
                    }),
                    (Da.erasAbbrRegex = function(e) {
                        return (
                            d(this, '_erasAbbrRegex') || ua.call(this),
                            e ? this._erasAbbrRegex : this._erasRegex
                        );
                    }),
                    (Da.erasNameRegex = function(e) {
                        return (
                            d(this, '_erasNameRegex') || ua.call(this),
                            e ? this._erasNameRegex : this._erasRegex
                        );
                    }),
                    (Da.erasNarrowRegex = function(e) {
                        return (
                            d(this, '_erasNarrowRegex') || ua.call(this),
                            e ? this._erasNarrowRegex : this._erasRegex
                        );
                    }),
                    (Da.months = function(e, t) {
                        return e
                            ? r(this._months)
                                ? this._months[e.month()]
                                : this._months[
                                      (this._months.isFormat || we).test(t)
                                          ? 'format'
                                          : 'standalone'
                                  ][e.month()]
                            : r(this._months)
                            ? this._months
                            : this._months.standalone;
                    }),
                    (Da.monthsShort = function(e, t) {
                        return e
                            ? r(this._monthsShort)
                                ? this._monthsShort[e.month()]
                                : this._monthsShort[
                                      we.test(t) ? 'format' : 'standalone'
                                  ][e.month()]
                            : r(this._monthsShort)
                            ? this._monthsShort
                            : this._monthsShort.standalone;
                    }),
                    (Da.monthsParse = function(e, t, a) {
                        var n, s, r;
                        if (this._monthsParseExact)
                            return Se.call(this, e, t, a);
                        for (
                            this._monthsParse ||
                                ((this._monthsParse = []),
                                (this._longMonthsParse = []),
                                (this._shortMonthsParse = [])),
                                n = 0;
                            n < 12;
                            n++
                        ) {
                            if (
                                ((s = h([2e3, n])),
                                a &&
                                    !this._longMonthsParse[n] &&
                                    ((this._longMonthsParse[n] = new RegExp(
                                        '^' +
                                            this.months(s, '').replace(
                                                '.',
                                                ''
                                            ) +
                                            '$',
                                        'i'
                                    )),
                                    (this._shortMonthsParse[n] = new RegExp(
                                        '^' +
                                            this.monthsShort(s, '').replace(
                                                '.',
                                                ''
                                            ) +
                                            '$',
                                        'i'
                                    ))),
                                a ||
                                    this._monthsParse[n] ||
                                    ((r =
                                        '^' +
                                        this.months(s, '') +
                                        '|^' +
                                        this.monthsShort(s, '')),
                                    (this._monthsParse[n] = new RegExp(
                                        r.replace('.', ''),
                                        'i'
                                    ))),
                                a &&
                                    'MMMM' === t &&
                                    this._longMonthsParse[n].test(e))
                            )
                                return n;
                            if (
                                a &&
                                'MMM' === t &&
                                this._shortMonthsParse[n].test(e)
                            )
                                return n;
                            if (!a && this._monthsParse[n].test(e)) return n;
                        }
                    }),
                    (Da.monthsRegex = function(e) {
                        return this._monthsParseExact
                            ? (d(this, '_monthsRegex') || xe.call(this),
                              e ? this._monthsStrictRegex : this._monthsRegex)
                            : (d(this, '_monthsRegex') ||
                                  (this._monthsRegex = be),
                              this._monthsStrictRegex && e
                                  ? this._monthsStrictRegex
                                  : this._monthsRegex);
                    }),
                    (Da.monthsShortRegex = function(e) {
                        return this._monthsParseExact
                            ? (d(this, '_monthsRegex') || xe.call(this),
                              e
                                  ? this._monthsShortStrictRegex
                                  : this._monthsShortRegex)
                            : (d(this, '_monthsShortRegex') ||
                                  (this._monthsShortRegex = ve),
                              this._monthsShortStrictRegex && e
                                  ? this._monthsShortStrictRegex
                                  : this._monthsShortRegex);
                    }),
                    (Da.week = function(e) {
                        return ze(e, this._week.dow, this._week.doy).week;
                    }),
                    (Da.firstDayOfYear = function() {
                        return this._week.doy;
                    }),
                    (Da.firstDayOfWeek = function() {
                        return this._week.dow;
                    }),
                    (Da.weekdays = function(e, t) {
                        var a = r(this._weekdays)
                            ? this._weekdays
                            : this._weekdays[
                                  e &&
                                  !0 !== e &&
                                  this._weekdays.isFormat.test(t)
                                      ? 'format'
                                      : 'standalone'
                              ];
                        return !0 === e
                            ? Ne(a, this._week.dow)
                            : e
                            ? a[e.day()]
                            : a;
                    }),
                    (Da.weekdaysMin = function(e) {
                        return !0 === e
                            ? Ne(this._weekdaysMin, this._week.dow)
                            : e
                            ? this._weekdaysMin[e.day()]
                            : this._weekdaysMin;
                    }),
                    (Da.weekdaysShort = function(e) {
                        return !0 === e
                            ? Ne(this._weekdaysShort, this._week.dow)
                            : e
                            ? this._weekdaysShort[e.day()]
                            : this._weekdaysShort;
                    }),
                    (Da.weekdaysParse = function(e, t, a) {
                        var n, s, r;
                        if (this._weekdaysParseExact)
                            return Be.call(this, e, t, a);
                        for (
                            this._weekdaysParse ||
                                ((this._weekdaysParse = []),
                                (this._minWeekdaysParse = []),
                                (this._shortWeekdaysParse = []),
                                (this._fullWeekdaysParse = [])),
                                n = 0;
                            n < 7;
                            n++
                        ) {
                            if (
                                ((s = h([2e3, 1]).day(n)),
                                a &&
                                    !this._fullWeekdaysParse[n] &&
                                    ((this._fullWeekdaysParse[n] = new RegExp(
                                        '^' +
                                            this.weekdays(s, '').replace(
                                                '.',
                                                '\\.?'
                                            ) +
                                            '$',
                                        'i'
                                    )),
                                    (this._shortWeekdaysParse[n] = new RegExp(
                                        '^' +
                                            this.weekdaysShort(s, '').replace(
                                                '.',
                                                '\\.?'
                                            ) +
                                            '$',
                                        'i'
                                    )),
                                    (this._minWeekdaysParse[n] = new RegExp(
                                        '^' +
                                            this.weekdaysMin(s, '').replace(
                                                '.',
                                                '\\.?'
                                            ) +
                                            '$',
                                        'i'
                                    ))),
                                this._weekdaysParse[n] ||
                                    ((r =
                                        '^' +
                                        this.weekdays(s, '') +
                                        '|^' +
                                        this.weekdaysShort(s, '') +
                                        '|^' +
                                        this.weekdaysMin(s, '')),
                                    (this._weekdaysParse[n] = new RegExp(
                                        r.replace('.', ''),
                                        'i'
                                    ))),
                                a &&
                                    'dddd' === t &&
                                    this._fullWeekdaysParse[n].test(e))
                            )
                                return n;
                            if (
                                a &&
                                'ddd' === t &&
                                this._shortWeekdaysParse[n].test(e)
                            )
                                return n;
                            if (
                                a &&
                                'dd' === t &&
                                this._minWeekdaysParse[n].test(e)
                            )
                                return n;
                            if (!a && this._weekdaysParse[n].test(e)) return n;
                        }
                    }),
                    (Da.weekdaysRegex = function(e) {
                        return this._weekdaysParseExact
                            ? (d(this, '_weekdaysRegex') || $e.call(this),
                              e
                                  ? this._weekdaysStrictRegex
                                  : this._weekdaysRegex)
                            : (d(this, '_weekdaysRegex') ||
                                  (this._weekdaysRegex = Ie),
                              this._weekdaysStrictRegex && e
                                  ? this._weekdaysStrictRegex
                                  : this._weekdaysRegex);
                    }),
                    (Da.weekdaysShortRegex = function(e) {
                        return this._weekdaysParseExact
                            ? (d(this, '_weekdaysRegex') || $e.call(this),
                              e
                                  ? this._weekdaysShortStrictRegex
                                  : this._weekdaysShortRegex)
                            : (d(this, '_weekdaysShortRegex') ||
                                  (this._weekdaysShortRegex = Ge),
                              this._weekdaysShortStrictRegex && e
                                  ? this._weekdaysShortStrictRegex
                                  : this._weekdaysShortRegex);
                    }),
                    (Da.weekdaysMinRegex = function(e) {
                        return this._weekdaysParseExact
                            ? (d(this, '_weekdaysRegex') || $e.call(this),
                              e
                                  ? this._weekdaysMinStrictRegex
                                  : this._weekdaysMinRegex)
                            : (d(this, '_weekdaysMinRegex') ||
                                  (this._weekdaysMinRegex = Ve),
                              this._weekdaysMinStrictRegex && e
                                  ? this._weekdaysMinStrictRegex
                                  : this._weekdaysMinRegex);
                    }),
                    (Da.isPM = function(e) {
                        return 'p' === (e + '').toLowerCase().charAt(0);
                    }),
                    (Da.meridiem = function(e, t, a) {
                        return e > 11 ? (a ? 'pm' : 'PM') : a ? 'am' : 'AM';
                    }),
                    it('en', {
                        eras: [
                            {
                                since: '0001-01-01',
                                until: 1 / 0,
                                offset: 1,
                                name: 'Anno Domini',
                                narrow: 'AD',
                                abbr: 'AD',
                            },
                            {
                                since: '0000-12-31',
                                until: -1 / 0,
                                offset: 1,
                                name: 'Before Christ',
                                narrow: 'BC',
                                abbr: 'BC',
                            },
                        ],
                        dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
                        ordinal: function(e) {
                            var t = e % 10;
                            return (
                                e +
                                (1 === B((e % 100) / 10)
                                    ? 'th'
                                    : 1 === t
                                    ? 'st'
                                    : 2 === t
                                    ? 'nd'
                                    : 3 === t
                                    ? 'rd'
                                    : 'th')
                            );
                        },
                    }),
                    (s.lang = T(
                        'moment.lang is deprecated. Use moment.locale instead.',
                        it
                    )),
                    (s.langData = T(
                        'moment.langData is deprecated. Use moment.localeData instead.',
                        _t
                    ));
                var va = Math.abs;
                function ba(e, t, a, n) {
                    var s = Jt(t, a);
                    return (
                        (e._milliseconds += n * s._milliseconds),
                        (e._days += n * s._days),
                        (e._months += n * s._months),
                        e._bubble()
                    );
                }
                function Sa(e) {
                    return e < 0 ? Math.floor(e) : Math.ceil(e);
                }
                function Ha(e) {
                    return (4800 * e) / 146097;
                }
                function ja(e) {
                    return (146097 * e) / 4800;
                }
                function xa(e) {
                    return function() {
                        return this.as(e);
                    };
                }
                var Oa = xa('ms'),
                    Pa = xa('s'),
                    Wa = xa('m'),
                    Aa = xa('h'),
                    Ea = xa('d'),
                    Fa = xa('w'),
                    za = xa('M'),
                    Ca = xa('Q'),
                    Na = xa('y');
                function Ra(e) {
                    return function() {
                        return this.isValid() ? this._data[e] : NaN;
                    };
                }
                var Ja = Ra('milliseconds'),
                    Ua = Ra('seconds'),
                    Ia = Ra('minutes'),
                    Ga = Ra('hours'),
                    Va = Ra('days'),
                    Ba = Ra('months'),
                    $a = Ra('years');
                var qa = Math.round,
                    Ka = { ss: 44, s: 45, m: 45, h: 22, d: 26, w: null, M: 11 };
                function Za(e, t, a, n, s) {
                    return s.relativeTime(t || 1, !!a, e, n);
                }
                var Qa = Math.abs;
                function Xa(e) {
                    return (e > 0) - (e < 0) || +e;
                }
                function en() {
                    if (!this.isValid()) return this.localeData().invalidDate();
                    var e,
                        t,
                        a,
                        n,
                        s,
                        r,
                        i,
                        d,
                        _ = Qa(this._milliseconds) / 1e3,
                        o = Qa(this._days),
                        u = Qa(this._months),
                        m = this.asSeconds();
                    return m
                        ? ((e = V(_ / 60)),
                          (t = V(e / 60)),
                          (_ %= 60),
                          (e %= 60),
                          (a = V(u / 12)),
                          (u %= 12),
                          (n = _ ? _.toFixed(3).replace(/\.?0+$/, '') : ''),
                          (s = m < 0 ? '-' : ''),
                          (r = Xa(this._months) !== Xa(m) ? '-' : ''),
                          (i = Xa(this._days) !== Xa(m) ? '-' : ''),
                          (d = Xa(this._milliseconds) !== Xa(m) ? '-' : ''),
                          s +
                              'P' +
                              (a ? r + a + 'Y' : '') +
                              (u ? r + u + 'M' : '') +
                              (o ? i + o + 'D' : '') +
                              (t || e || _ ? 'T' : '') +
                              (t ? d + t + 'H' : '') +
                              (e ? d + e + 'M' : '') +
                              (_ ? d + n + 'S' : ''))
                        : 'P0D';
                }
                var tn = xt.prototype;
                return (
                    (tn.isValid = function() {
                        return this._isValid;
                    }),
                    (tn.abs = function() {
                        var e = this._data;
                        return (
                            (this._milliseconds = va(this._milliseconds)),
                            (this._days = va(this._days)),
                            (this._months = va(this._months)),
                            (e.milliseconds = va(e.milliseconds)),
                            (e.seconds = va(e.seconds)),
                            (e.minutes = va(e.minutes)),
                            (e.hours = va(e.hours)),
                            (e.months = va(e.months)),
                            (e.years = va(e.years)),
                            this
                        );
                    }),
                    (tn.add = function(e, t) {
                        return ba(this, e, t, 1);
                    }),
                    (tn.subtract = function(e, t) {
                        return ba(this, e, t, -1);
                    }),
                    (tn.as = function(e) {
                        if (!this.isValid()) return NaN;
                        var t,
                            a,
                            n = this._milliseconds;
                        if (
                            'month' === (e = R(e)) ||
                            'quarter' === e ||
                            'year' === e
                        )
                            switch (
                                ((t = this._days + n / 864e5),
                                (a = this._months + Ha(t)),
                                e)
                            ) {
                                case 'month':
                                    return a;
                                case 'quarter':
                                    return a / 3;
                                case 'year':
                                    return a / 12;
                            }
                        else
                            switch (
                                ((t =
                                    this._days + Math.round(ja(this._months))),
                                e)
                            ) {
                                case 'week':
                                    return t / 7 + n / 6048e5;
                                case 'day':
                                    return t + n / 864e5;
                                case 'hour':
                                    return 24 * t + n / 36e5;
                                case 'minute':
                                    return 1440 * t + n / 6e4;
                                case 'second':
                                    return 86400 * t + n / 1e3;
                                case 'millisecond':
                                    return Math.floor(864e5 * t) + n;
                                default:
                                    throw new Error('Unknown unit ' + e);
                            }
                    }),
                    (tn.asMilliseconds = Oa),
                    (tn.asSeconds = Pa),
                    (tn.asMinutes = Wa),
                    (tn.asHours = Aa),
                    (tn.asDays = Ea),
                    (tn.asWeeks = Fa),
                    (tn.asMonths = za),
                    (tn.asQuarters = Ca),
                    (tn.asYears = Na),
                    (tn.valueOf = function() {
                        return this.isValid()
                            ? this._milliseconds +
                                  864e5 * this._days +
                                  (this._months % 12) * 2592e6 +
                                  31536e6 * B(this._months / 12)
                            : NaN;
                    }),
                    (tn._bubble = function() {
                        var e,
                            t,
                            a,
                            n,
                            s,
                            r = this._milliseconds,
                            i = this._days,
                            d = this._months,
                            _ = this._data;
                        return (
                            (r >= 0 && i >= 0 && d >= 0) ||
                                (r <= 0 && i <= 0 && d <= 0) ||
                                ((r += 864e5 * Sa(ja(d) + i)),
                                (i = 0),
                                (d = 0)),
                            (_.milliseconds = r % 1e3),
                            (e = V(r / 1e3)),
                            (_.seconds = e % 60),
                            (t = V(e / 60)),
                            (_.minutes = t % 60),
                            (a = V(t / 60)),
                            (_.hours = a % 24),
                            (i += V(a / 24)),
                            (d += s = V(Ha(i))),
                            (i -= Sa(ja(s))),
                            (n = V(d / 12)),
                            (d %= 12),
                            (_.days = i),
                            (_.months = d),
                            (_.years = n),
                            this
                        );
                    }),
                    (tn.clone = function() {
                        return Jt(this);
                    }),
                    (tn.get = function(e) {
                        return (
                            (e = R(e)), this.isValid() ? this[e + 's']() : NaN
                        );
                    }),
                    (tn.milliseconds = Ja),
                    (tn.seconds = Ua),
                    (tn.minutes = Ia),
                    (tn.hours = Ga),
                    (tn.days = Va),
                    (tn.weeks = function() {
                        return V(this.days() / 7);
                    }),
                    (tn.months = Ba),
                    (tn.years = $a),
                    (tn.humanize = function(e, t) {
                        if (!this.isValid())
                            return this.localeData().invalidDate();
                        var a,
                            n,
                            s = !1,
                            r = Ka;
                        return (
                            'object' == typeof e && ((t = e), (e = !1)),
                            'boolean' == typeof e && (s = e),
                            'object' == typeof t &&
                                ((r = Object.assign({}, Ka, t)),
                                null != t.s &&
                                    null == t.ss &&
                                    (r.ss = t.s - 1)),
                            (n = (function(e, t, a, n) {
                                var s = Jt(e).abs(),
                                    r = qa(s.as('s')),
                                    i = qa(s.as('m')),
                                    d = qa(s.as('h')),
                                    _ = qa(s.as('d')),
                                    o = qa(s.as('M')),
                                    u = qa(s.as('w')),
                                    m = qa(s.as('y')),
                                    l =
                                        (r <= a.ss && ['s', r]) ||
                                        (r < a.s && ['ss', r]) ||
                                        (i <= 1 && ['m']) ||
                                        (i < a.m && ['mm', i]) ||
                                        (d <= 1 && ['h']) ||
                                        (d < a.h && ['hh', d]) ||
                                        (_ <= 1 && ['d']) ||
                                        (_ < a.d && ['dd', _]);
                                return (
                                    null != a.w &&
                                        (l =
                                            l ||
                                            (u <= 1 && ['w']) ||
                                            (u < a.w && ['ww', u])),
                                    ((l = l ||
                                        (o <= 1 && ['M']) ||
                                        (o < a.M && ['MM', o]) ||
                                        (m <= 1 && ['y']) || ['yy', m])[2] = t),
                                    (l[3] = +e > 0),
                                    (l[4] = n),
                                    Za.apply(null, l)
                                );
                            })(this, !s, r, (a = this.localeData()))),
                            s && (n = a.pastFuture(+this, n)),
                            a.postformat(n)
                        );
                    }),
                    (tn.toISOString = en),
                    (tn.toString = en),
                    (tn.toJSON = en),
                    (tn.locale = Xt),
                    (tn.localeData = ta),
                    (tn.toIsoString = T(
                        'toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)',
                        en
                    )),
                    (tn.lang = ea),
                    E('X', 0, 0, 'unix'),
                    E('x', 0, 0, 'valueOf'),
                    he('x', ue),
                    he('X', /[+-]?\d+(\.\d{1,3})?/),
                    fe('X', function(e, t, a) {
                        a._d = new Date(1e3 * parseFloat(e));
                    }),
                    fe('x', function(e, t, a) {
                        a._d = new Date(B(e));
                    }),
                    (s.version = '2.29.4'),
                    (t = vt),
                    (s.fn = pa),
                    (s.min = function() {
                        return Ht('isBefore', [].slice.call(arguments, 0));
                    }),
                    (s.max = function() {
                        return Ht('isAfter', [].slice.call(arguments, 0));
                    }),
                    (s.now = function() {
                        return Date.now ? Date.now() : +new Date();
                    }),
                    (s.utc = h),
                    (s.unix = function(e) {
                        return vt(1e3 * e);
                    }),
                    (s.months = function(e, t) {
                        return Ta(e, t, 'months');
                    }),
                    (s.isDate = m),
                    (s.locale = it),
                    (s.invalid = Y),
                    (s.duration = Jt),
                    (s.isMoment = D),
                    (s.weekdays = function(e, t, a) {
                        return wa(e, t, a, 'weekdays');
                    }),
                    (s.parseZone = function() {
                        return vt.apply(null, arguments).parseZone();
                    }),
                    (s.localeData = _t),
                    (s.isDuration = Ot),
                    (s.monthsShort = function(e, t) {
                        return Ta(e, t, 'monthsShort');
                    }),
                    (s.weekdaysMin = function(e, t, a) {
                        return wa(e, t, a, 'weekdaysMin');
                    }),
                    (s.defineLocale = dt),
                    (s.updateLocale = function(e, t) {
                        if (null != t) {
                            var a,
                                n,
                                s = et;
                            null != tt[e] && null != tt[e].parentLocale
                                ? tt[e].set(H(tt[e]._config, t))
                                : (null != (n = rt(e)) && (s = n._config),
                                  (t = H(s, t)),
                                  null == n && (t.abbr = e),
                                  ((a = new j(t)).parentLocale = tt[e]),
                                  (tt[e] = a)),
                                it(e);
                        } else
                            null != tt[e] &&
                                (null != tt[e].parentLocale
                                    ? ((tt[e] = tt[e].parentLocale),
                                      e === it() && it(e))
                                    : null != tt[e] && delete tt[e]);
                        return tt[e];
                    }),
                    (s.locales = function() {
                        return w(tt);
                    }),
                    (s.weekdaysShort = function(e, t, a) {
                        return wa(e, t, a, 'weekdaysShort');
                    }),
                    (s.normalizeUnits = R),
                    (s.relativeTimeRounding = function(e) {
                        return void 0 === e
                            ? qa
                            : 'function' == typeof e && ((qa = e), !0);
                    }),
                    (s.relativeTimeThreshold = function(e, t) {
                        return (
                            void 0 !== Ka[e] &&
                            (void 0 === t
                                ? Ka[e]
                                : ((Ka[e] = t),
                                  's' === e && (Ka.ss = t - 1),
                                  !0))
                        );
                    }),
                    (s.calendarFormat = function(e, t) {
                        var a = e.diff(t, 'days', !0);
                        return a < -6
                            ? 'sameElse'
                            : a < -1
                            ? 'lastWeek'
                            : a < 0
                            ? 'lastDay'
                            : a < 1
                            ? 'sameDay'
                            : a < 2
                            ? 'nextDay'
                            : a < 7
                            ? 'nextWeek'
                            : 'sameElse';
                    }),
                    (s.prototype = pa),
                    (s.HTML5_FMT = {
                        DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm',
                        DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss',
                        DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS',
                        DATE: 'YYYY-MM-DD',
                        TIME: 'HH:mm',
                        TIME_SECONDS: 'HH:mm:ss',
                        TIME_MS: 'HH:mm:ss.SSS',
                        WEEK: 'GGGG-[W]WW',
                        MONTH: 'YYYY-MM',
                    }),
                    s
                );
            })();
        },
        67477: (e, t, a) => {
            'use strict';
            var n = a(18533);
            function s(e) {
                if ('string' != typeof e)
                    throw new TypeError(
                        'Path must be a string. Received ' + JSON.stringify(e)
                    );
            }
            function r(e, t) {
                for (
                    var a, n = '', s = 0, r = -1, i = 0, d = 0;
                    d <= e.length;
                    ++d
                ) {
                    if (d < e.length) a = e.charCodeAt(d);
                    else {
                        if (47 === a) break;
                        a = 47;
                    }
                    if (47 === a) {
                        if (r === d - 1 || 1 === i);
                        else if (r !== d - 1 && 2 === i) {
                            if (
                                n.length < 2 ||
                                2 !== s ||
                                46 !== n.charCodeAt(n.length - 1) ||
                                46 !== n.charCodeAt(n.length - 2)
                            )
                                if (n.length > 2) {
                                    var _ = n.lastIndexOf('/');
                                    if (_ !== n.length - 1) {
                                        -1 === _
                                            ? ((n = ''), (s = 0))
                                            : (s =
                                                  (n = n.slice(0, _)).length -
                                                  1 -
                                                  n.lastIndexOf('/')),
                                            (r = d),
                                            (i = 0);
                                        continue;
                                    }
                                } else if (2 === n.length || 1 === n.length) {
                                    (n = ''), (s = 0), (r = d), (i = 0);
                                    continue;
                                }
                            t &&
                                (n.length > 0 ? (n += '/..') : (n = '..'),
                                (s = 2));
                        } else
                            n.length > 0
                                ? (n += '/' + e.slice(r + 1, d))
                                : (n = e.slice(r + 1, d)),
                                (s = d - r - 1);
                        (r = d), (i = 0);
                    } else 46 === a && -1 !== i ? ++i : (i = -1);
                }
                return n;
            }
            var i = {
                resolve: function() {
                    for (
                        var e, t = '', a = !1, i = arguments.length - 1;
                        i >= -1 && !a;
                        i--
                    ) {
                        var d;
                        i >= 0
                            ? (d = arguments[i])
                            : (void 0 === e && (e = n.cwd()), (d = e)),
                            s(d),
                            0 !== d.length &&
                                ((t = d + '/' + t),
                                (a = 47 === d.charCodeAt(0)));
                    }
                    return (
                        (t = r(t, !a)),
                        a
                            ? t.length > 0
                                ? '/' + t
                                : '/'
                            : t.length > 0
                            ? t
                            : '.'
                    );
                },
                normalize: function(e) {
                    if ((s(e), 0 === e.length)) return '.';
                    var t = 47 === e.charCodeAt(0),
                        a = 47 === e.charCodeAt(e.length - 1);
                    return (
                        0 !== (e = r(e, !t)).length || t || (e = '.'),
                        e.length > 0 && a && (e += '/'),
                        t ? '/' + e : e
                    );
                },
                isAbsolute: function(e) {
                    return s(e), e.length > 0 && 47 === e.charCodeAt(0);
                },
                join: function() {
                    if (0 === arguments.length) return '.';
                    for (var e, t = 0; t < arguments.length; ++t) {
                        var a = arguments[t];
                        s(a),
                            a.length > 0 &&
                                (void 0 === e ? (e = a) : (e += '/' + a));
                    }
                    return void 0 === e ? '.' : i.normalize(e);
                },
                relative: function(e, t) {
                    if ((s(e), s(t), e === t)) return '';
                    if ((e = i.resolve(e)) === (t = i.resolve(t))) return '';
                    for (
                        var a = 1;
                        a < e.length && 47 === e.charCodeAt(a);
                        ++a
                    );
                    for (
                        var n = e.length, r = n - a, d = 1;
                        d < t.length && 47 === t.charCodeAt(d);
                        ++d
                    );
                    for (
                        var _ = t.length - d, o = r < _ ? r : _, u = -1, m = 0;
                        m <= o;
                        ++m
                    ) {
                        if (m === o) {
                            if (_ > o) {
                                if (47 === t.charCodeAt(d + m))
                                    return t.slice(d + m + 1);
                                if (0 === m) return t.slice(d + m);
                            } else
                                r > o &&
                                    (47 === e.charCodeAt(a + m)
                                        ? (u = m)
                                        : 0 === m && (u = 0));
                            break;
                        }
                        var l = e.charCodeAt(a + m);
                        if (l !== t.charCodeAt(d + m)) break;
                        47 === l && (u = m);
                    }
                    var c = '';
                    for (m = a + u + 1; m <= n; ++m)
                        (m !== n && 47 !== e.charCodeAt(m)) ||
                            (0 === c.length ? (c += '..') : (c += '/..'));
                    return c.length > 0
                        ? c + t.slice(d + u)
                        : ((d += u), 47 === t.charCodeAt(d) && ++d, t.slice(d));
                },
                _makeLong: function(e) {
                    return e;
                },
                dirname: function(e) {
                    if ((s(e), 0 === e.length)) return '.';
                    for (
                        var t = e.charCodeAt(0),
                            a = 47 === t,
                            n = -1,
                            r = !0,
                            i = e.length - 1;
                        i >= 1;
                        --i
                    )
                        if (47 === (t = e.charCodeAt(i))) {
                            if (!r) {
                                n = i;
                                break;
                            }
                        } else r = !1;
                    return -1 === n
                        ? a
                            ? '/'
                            : '.'
                        : a && 1 === n
                        ? '//'
                        : e.slice(0, n);
                },
                basename: function(e, t) {
                    if (void 0 !== t && 'string' != typeof t)
                        throw new TypeError('"ext" argument must be a string');
                    s(e);
                    var a,
                        n = 0,
                        r = -1,
                        i = !0;
                    if (void 0 !== t && t.length > 0 && t.length <= e.length) {
                        if (t.length === e.length && t === e) return '';
                        var d = t.length - 1,
                            _ = -1;
                        for (a = e.length - 1; a >= 0; --a) {
                            var o = e.charCodeAt(a);
                            if (47 === o) {
                                if (!i) {
                                    n = a + 1;
                                    break;
                                }
                            } else
                                -1 === _ && ((i = !1), (_ = a + 1)),
                                    d >= 0 &&
                                        (o === t.charCodeAt(d)
                                            ? -1 == --d && (r = a)
                                            : ((d = -1), (r = _)));
                        }
                        return (
                            n === r ? (r = _) : -1 === r && (r = e.length),
                            e.slice(n, r)
                        );
                    }
                    for (a = e.length - 1; a >= 0; --a)
                        if (47 === e.charCodeAt(a)) {
                            if (!i) {
                                n = a + 1;
                                break;
                            }
                        } else -1 === r && ((i = !1), (r = a + 1));
                    return -1 === r ? '' : e.slice(n, r);
                },
                extname: function(e) {
                    s(e);
                    for (
                        var t = -1,
                            a = 0,
                            n = -1,
                            r = !0,
                            i = 0,
                            d = e.length - 1;
                        d >= 0;
                        --d
                    ) {
                        var _ = e.charCodeAt(d);
                        if (47 !== _)
                            -1 === n && ((r = !1), (n = d + 1)),
                                46 === _
                                    ? -1 === t
                                        ? (t = d)
                                        : 1 !== i && (i = 1)
                                    : -1 !== t && (i = -1);
                        else if (!r) {
                            a = d + 1;
                            break;
                        }
                    }
                    return -1 === t ||
                        -1 === n ||
                        0 === i ||
                        (1 === i && t === n - 1 && t === a + 1)
                        ? ''
                        : e.slice(t, n);
                },
                format: function(e) {
                    if (null === e || 'object' != typeof e)
                        throw new TypeError(
                            'The "pathObject" argument must be of type Object. Received type ' +
                                typeof e
                        );
                    return (function(e, t) {
                        var a = t.dir || t.root,
                            n = t.base || (t.name || '') + (t.ext || '');
                        return a ? (a === t.root ? a + n : a + '/' + n) : n;
                    })(0, e);
                },
                parse: function(e) {
                    s(e);
                    var t = { root: '', dir: '', base: '', ext: '', name: '' };
                    if (0 === e.length) return t;
                    var a,
                        n = e.charCodeAt(0),
                        r = 47 === n;
                    r ? ((t.root = '/'), (a = 1)) : (a = 0);
                    for (
                        var i = -1,
                            d = 0,
                            _ = -1,
                            o = !0,
                            u = e.length - 1,
                            m = 0;
                        u >= a;
                        --u
                    )
                        if (47 !== (n = e.charCodeAt(u)))
                            -1 === _ && ((o = !1), (_ = u + 1)),
                                46 === n
                                    ? -1 === i
                                        ? (i = u)
                                        : 1 !== m && (m = 1)
                                    : -1 !== i && (m = -1);
                        else if (!o) {
                            d = u + 1;
                            break;
                        }
                    return (
                        -1 === i ||
                        -1 === _ ||
                        0 === m ||
                        (1 === m && i === _ - 1 && i === d + 1)
                            ? -1 !== _ &&
                              (t.base = t.name =
                                  0 === d && r ? e.slice(1, _) : e.slice(d, _))
                            : (0 === d && r
                                  ? ((t.name = e.slice(1, i)),
                                    (t.base = e.slice(1, _)))
                                  : ((t.name = e.slice(d, i)),
                                    (t.base = e.slice(d, _))),
                              (t.ext = e.slice(i, _))),
                        d > 0
                            ? (t.dir = e.slice(0, d - 1))
                            : r && (t.dir = '/'),
                        t
                    );
                },
                sep: '/',
                delimiter: ':',
                win32: null,
                posix: null,
            };
            (i.posix = i), (e.exports = i);
        },
        18533: e => {
            var t,
                a,
                n = (e.exports = {});
            function s() {
                throw new Error('setTimeout has not been defined');
            }
            function r() {
                throw new Error('clearTimeout has not been defined');
            }
            function i(e) {
                if (t === setTimeout) return setTimeout(e, 0);
                if ((t === s || !t) && setTimeout)
                    return (t = setTimeout), setTimeout(e, 0);
                try {
                    return t(e, 0);
                } catch (a) {
                    try {
                        return t.call(null, e, 0);
                    } catch (a) {
                        return t.call(this, e, 0);
                    }
                }
            }
            !(function() {
                try {
                    t = 'function' == typeof setTimeout ? setTimeout : s;
                } catch (e) {
                    t = s;
                }
                try {
                    a = 'function' == typeof clearTimeout ? clearTimeout : r;
                } catch (e) {
                    a = r;
                }
            })();
            var d,
                _ = [],
                o = !1,
                u = -1;
            function m() {
                o &&
                    d &&
                    ((o = !1),
                    d.length ? (_ = d.concat(_)) : (u = -1),
                    _.length && l());
            }
            function l() {
                if (!o) {
                    var e = i(m);
                    o = !0;
                    for (var t = _.length; t; ) {
                        for (d = _, _ = []; ++u < t; ) d && d[u].run();
                        (u = -1), (t = _.length);
                    }
                    (d = null),
                        (o = !1),
                        (function(e) {
                            if (a === clearTimeout) return clearTimeout(e);
                            if ((a === r || !a) && clearTimeout)
                                return (a = clearTimeout), clearTimeout(e);
                            try {
                                a(e);
                            } catch (t) {
                                try {
                                    return a.call(null, e);
                                } catch (t) {
                                    return a.call(this, e);
                                }
                            }
                        })(e);
                }
            }
            function c(e, t) {
                (this.fun = e), (this.array = t);
            }
            function h() {}
            (n.nextTick = function(e) {
                var t = new Array(arguments.length - 1);
                if (arguments.length > 1)
                    for (var a = 1; a < arguments.length; a++)
                        t[a - 1] = arguments[a];
                _.push(new c(e, t)), 1 !== _.length || o || i(l);
            }),
                (c.prototype.run = function() {
                    this.fun.apply(null, this.array);
                }),
                (n.title = 'browser'),
                (n.browser = !0),
                (n.env = {}),
                (n.argv = []),
                (n.version = ''),
                (n.versions = {}),
                (n.on = h),
                (n.addListener = h),
                (n.once = h),
                (n.off = h),
                (n.removeListener = h),
                (n.removeAllListeners = h),
                (n.emit = h),
                (n.prependListener = h),
                (n.prependOnceListener = h),
                (n.listeners = function(e) {
                    return [];
                }),
                (n.binding = function(e) {
                    throw new Error('process.binding is not supported');
                }),
                (n.cwd = function() {
                    return '/';
                }),
                (n.chdir = function(e) {
                    throw new Error('process.chdir is not supported');
                }),
                (n.umask = function() {
                    return 0;
                });
        },
        83210: (e, t) => {
            'use strict';
            var a = Object.prototype.hasOwnProperty;
            function n(e) {
                try {
                    return decodeURIComponent(e.replace(/\+/g, ' '));
                } catch (e) {
                    return null;
                }
            }
            function s(e) {
                try {
                    return encodeURIComponent(e);
                } catch (e) {
                    return null;
                }
            }
            (t.stringify = function(e, t) {
                t = t || '';
                var n,
                    r,
                    i = [];
                for (r in ('string' != typeof t && (t = '?'), e))
                    if (a.call(e, r)) {
                        if (
                            ((n = e[r]) || (null != n && !isNaN(n)) || (n = ''),
                            (r = s(r)),
                            (n = s(n)),
                            null === r || null === n)
                        )
                            continue;
                        i.push(r + '=' + n);
                    }
                return i.length ? t + i.join('&') : '';
            }),
                (t.parse = function(e) {
                    for (
                        var t, a = /([^=?#&]+)=?([^&]*)/g, s = {};
                        (t = a.exec(e));

                    ) {
                        var r = n(t[1]),
                            i = n(t[2]);
                        null === r || null === i || r in s || (s[r] = i);
                    }
                    return s;
                });
        },
        4234: e => {
            'use strict';
            e.exports = function(e, t) {
                if (((t = t.split(':')[0]), !(e = +e))) return !1;
                switch (t) {
                    case 'http':
                    case 'ws':
                        return 80 !== e;
                    case 'https':
                    case 'wss':
                        return 443 !== e;
                    case 'ftp':
                        return 21 !== e;
                    case 'gopher':
                        return 70 !== e;
                    case 'file':
                        return !1;
                }
                return 0 !== e;
            };
        },
        75158: (e, t, a) => {
            'use strict';
            var n = a(4234),
                s = a(83210),
                r = /^[\x00-\x20\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/,
                i = /[\n\r\t]/g,
                d = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//,
                _ = /:\d+$/,
                o = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\\/]+)?([\S\s]*)/i,
                u = /^[a-zA-Z]:/;
            function m(e) {
                return (e || '').toString().replace(r, '');
            }
            var l = [
                    ['#', 'hash'],
                    ['?', 'query'],
                    function(e, t) {
                        return M(t.protocol) ? e.replace(/\\/g, '/') : e;
                    },
                    ['/', 'pathname'],
                    ['@', 'auth', 1],
                    [NaN, 'host', void 0, 1, 1],
                    [/:(\d*)$/, 'port', void 0, 1],
                    [NaN, 'hostname', void 0, 1, 1],
                ],
                c = { hash: 1, query: 1 };
            function h(e) {
                var t,
                    n =
                        ('undefined' != typeof window
                            ? window
                            : void 0 !== a.g
                            ? a.g
                            : 'undefined' != typeof self
                            ? self
                            : {}
                        ).location || {},
                    s = {},
                    r = typeof (e = e || n);
                if ('blob:' === e.protocol) s = new Y(unescape(e.pathname), {});
                else if ('string' === r)
                    for (t in ((s = new Y(e, {})), c)) delete s[t];
                else if ('object' === r) {
                    for (t in e) t in c || (s[t] = e[t]);
                    void 0 === s.slashes && (s.slashes = d.test(e.href));
                }
                return s;
            }
            function M(e) {
                return (
                    'file:' === e ||
                    'ftp:' === e ||
                    'http:' === e ||
                    'https:' === e ||
                    'ws:' === e ||
                    'wss:' === e
                );
            }
            function L(e, t) {
                (e = (e = m(e)).replace(i, '')), (t = t || {});
                var a,
                    n = o.exec(e),
                    s = n[1] ? n[1].toLowerCase() : '',
                    r = !!n[2],
                    d = !!n[3],
                    _ = 0;
                return (
                    r
                        ? d
                            ? ((a = n[2] + n[3] + n[4]),
                              (_ = n[2].length + n[3].length))
                            : ((a = n[2] + n[4]), (_ = n[2].length))
                        : d
                        ? ((a = n[3] + n[4]), (_ = n[3].length))
                        : (a = n[4]),
                    'file:' === s
                        ? _ >= 2 && (a = a.slice(2))
                        : M(s)
                        ? (a = n[4])
                        : s
                        ? r && (a = a.slice(2))
                        : _ >= 2 && M(t.protocol) && (a = n[4]),
                    {
                        protocol: s,
                        slashes: r || M(s),
                        slashesCount: _,
                        rest: a,
                    }
                );
            }
            function Y(e, t, a) {
                if (((e = (e = m(e)).replace(i, '')), !(this instanceof Y)))
                    return new Y(e, t, a);
                var r,
                    d,
                    _,
                    o,
                    c,
                    f,
                    y = l.slice(),
                    p = typeof t,
                    k = this,
                    D = 0;
                for (
                    'object' !== p && 'string' !== p && ((a = t), (t = null)),
                        a && 'function' != typeof a && (a = s.parse),
                        r =
                            !(d = L(e || '', (t = h(t)))).protocol &&
                            !d.slashes,
                        k.slashes = d.slashes || (r && t.slashes),
                        k.protocol = d.protocol || t.protocol || '',
                        e = d.rest,
                        (('file:' === d.protocol &&
                            (2 !== d.slashesCount || u.test(e))) ||
                            (!d.slashes &&
                                (d.protocol ||
                                    d.slashesCount < 2 ||
                                    !M(k.protocol)))) &&
                            (y[3] = [/(.*)/, 'pathname']);
                    D < y.length;
                    D++
                )
                    'function' != typeof (o = y[D])
                        ? ((_ = o[0]),
                          (f = o[1]),
                          _ != _
                              ? (k[f] = e)
                              : 'string' == typeof _
                              ? ~(c =
                                    '@' === _
                                        ? e.lastIndexOf(_)
                                        : e.indexOf(_)) &&
                                ('number' == typeof o[2]
                                    ? ((k[f] = e.slice(0, c)),
                                      (e = e.slice(c + o[2])))
                                    : ((k[f] = e.slice(c)),
                                      (e = e.slice(0, c))))
                              : (c = _.exec(e)) &&
                                ((k[f] = c[1]), (e = e.slice(0, c.index))),
                          (k[f] = k[f] || (r && o[3] && t[f]) || ''),
                          o[4] && (k[f] = k[f].toLowerCase()))
                        : (e = o(e, k));
                a && (k.query = a(k.query)),
                    r &&
                        t.slashes &&
                        '/' !== k.pathname.charAt(0) &&
                        ('' !== k.pathname || '' !== t.pathname) &&
                        (k.pathname = (function(e, t) {
                            if ('' === e) return t;
                            for (
                                var a = (t || '/')
                                        .split('/')
                                        .slice(0, -1)
                                        .concat(e.split('/')),
                                    n = a.length,
                                    s = a[n - 1],
                                    r = !1,
                                    i = 0;
                                n--;

                            )
                                '.' === a[n]
                                    ? a.splice(n, 1)
                                    : '..' === a[n]
                                    ? (a.splice(n, 1), i++)
                                    : i &&
                                      (0 === n && (r = !0),
                                      a.splice(n, 1),
                                      i--);
                            return (
                                r && a.unshift(''),
                                ('.' !== s && '..' !== s) || a.push(''),
                                a.join('/')
                            );
                        })(k.pathname, t.pathname)),
                    '/' !== k.pathname.charAt(0) &&
                        M(k.protocol) &&
                        (k.pathname = '/' + k.pathname),
                    n(k.port, k.protocol) ||
                        ((k.host = k.hostname), (k.port = '')),
                    (k.username = k.password = ''),
                    k.auth &&
                        (~(c = k.auth.indexOf(':'))
                            ? ((k.username = k.auth.slice(0, c)),
                              (k.username = encodeURIComponent(
                                  decodeURIComponent(k.username)
                              )),
                              (k.password = k.auth.slice(c + 1)),
                              (k.password = encodeURIComponent(
                                  decodeURIComponent(k.password)
                              )))
                            : (k.username = encodeURIComponent(
                                  decodeURIComponent(k.auth)
                              )),
                        (k.auth = k.password
                            ? k.username + ':' + k.password
                            : k.username)),
                    (k.origin =
                        'file:' !== k.protocol && M(k.protocol) && k.host
                            ? k.protocol + '//' + k.host
                            : 'null'),
                    (k.href = k.toString());
            }
            (Y.prototype = {
                set: function(e, t, a) {
                    var r = this;
                    switch (e) {
                        case 'query':
                            'string' == typeof t &&
                                t.length &&
                                (t = (a || s.parse)(t)),
                                (r[e] = t);
                            break;
                        case 'port':
                            (r[e] = t),
                                n(t, r.protocol)
                                    ? t && (r.host = r.hostname + ':' + t)
                                    : ((r.host = r.hostname), (r[e] = ''));
                            break;
                        case 'hostname':
                            (r[e] = t),
                                r.port && (t += ':' + r.port),
                                (r.host = t);
                            break;
                        case 'host':
                            (r[e] = t),
                                _.test(t)
                                    ? ((t = t.split(':')),
                                      (r.port = t.pop()),
                                      (r.hostname = t.join(':')))
                                    : ((r.hostname = t), (r.port = ''));
                            break;
                        case 'protocol':
                            (r.protocol = t.toLowerCase()), (r.slashes = !a);
                            break;
                        case 'pathname':
                        case 'hash':
                            if (t) {
                                var i = 'pathname' === e ? '/' : '#';
                                r[e] = t.charAt(0) !== i ? i + t : t;
                            } else r[e] = t;
                            break;
                        case 'username':
                        case 'password':
                            r[e] = encodeURIComponent(t);
                            break;
                        case 'auth':
                            var d = t.indexOf(':');
                            ~d
                                ? ((r.username = t.slice(0, d)),
                                  (r.username = encodeURIComponent(
                                      decodeURIComponent(r.username)
                                  )),
                                  (r.password = t.slice(d + 1)),
                                  (r.password = encodeURIComponent(
                                      decodeURIComponent(r.password)
                                  )))
                                : (r.username = encodeURIComponent(
                                      decodeURIComponent(t)
                                  ));
                    }
                    for (var o = 0; o < l.length; o++) {
                        var u = l[o];
                        u[4] && (r[u[1]] = r[u[1]].toLowerCase());
                    }
                    return (
                        (r.auth = r.password
                            ? r.username + ':' + r.password
                            : r.username),
                        (r.origin =
                            'file:' !== r.protocol && M(r.protocol) && r.host
                                ? r.protocol + '//' + r.host
                                : 'null'),
                        (r.href = r.toString()),
                        r
                    );
                },
                toString: function(e) {
                    (e && 'function' == typeof e) || (e = s.stringify);
                    var t,
                        a = this,
                        n = a.host,
                        r = a.protocol;
                    r && ':' !== r.charAt(r.length - 1) && (r += ':');
                    var i =
                        r +
                        ((a.protocol && a.slashes) || M(a.protocol)
                            ? '//'
                            : '');
                    return (
                        a.username
                            ? ((i += a.username),
                              a.password && (i += ':' + a.password),
                              (i += '@'))
                            : a.password
                            ? ((i += ':' + a.password), (i += '@'))
                            : 'file:' !== a.protocol &&
                              M(a.protocol) &&
                              !n &&
                              '/' !== a.pathname &&
                              (i += '@'),
                        (':' === n[n.length - 1] ||
                            (_.test(a.hostname) && !a.port)) &&
                            (n += ':'),
                        (i += n + a.pathname),
                        (t =
                            'object' == typeof a.query
                                ? e(a.query)
                                : a.query) &&
                            (i += '?' !== t.charAt(0) ? '?' + t : t),
                        a.hash && (i += a.hash),
                        i
                    );
                },
            }),
                (Y.extractProtocol = L),
                (Y.location = h),
                (Y.trimLeft = m),
                (Y.qs = s),
                (e.exports = Y);
        },
    },
]);
//# sourceMappingURL=8101.8ebbb2f.js.map
