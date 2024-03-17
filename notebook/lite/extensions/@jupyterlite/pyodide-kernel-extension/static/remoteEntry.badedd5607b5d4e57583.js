var _JUPYTERLAB;
(() => {
    'use strict';
    var e,
        r,
        t,
        n,
        o,
        i,
        a,
        l,
        u,
        f,
        c,
        d,
        s,
        p,
        h,
        b,
        v,
        y,
        m,
        g,
        j,
        w,
        k = {
            624: (e, r, t) => {
                var n = {
                        './index': () =>
                            Promise.all([t.e(756), t.e(154)]).then(() => () =>
                                t(260)
                            ),
                        './extension': () =>
                            Promise.all([t.e(756), t.e(154)]).then(() => () =>
                                t(260)
                            ),
                    },
                    o = (e, r) => (
                        (t.R = r),
                        (r = t.o(n, e)
                            ? n[e]()
                            : Promise.resolve().then(() => {
                                  throw new Error(
                                      'Module "' +
                                          e +
                                          '" does not exist in container.'
                                  );
                              })),
                        (t.R = void 0),
                        r
                    ),
                    i = (e, r) => {
                        if (t.S) {
                            var n = 'default',
                                o = t.S[n];
                            if (o && o !== e)
                                throw new Error(
                                    'Container initialization failed as it has already been initialized with a different share scope'
                                );
                            return (t.S[n] = e), t.I(n, r);
                        }
                    };
                t.d(r, { get: () => o, init: () => i });
            },
        },
        P = {};
    function _(e) {
        var r = P[e];
        if (void 0 !== r) return r.exports;
        var t = (P[e] = { exports: {} });
        return k[e](t, t.exports, _), t.exports;
    }
    (_.m = k),
        (_.c = P),
        (_.amdO = {}),
        (r = Object.getPrototypeOf
            ? e => Object.getPrototypeOf(e)
            : e => e.__proto__),
        (_.t = function(t, n) {
            if ((1 & n && (t = this(t)), 8 & n)) return t;
            if ('object' == typeof t && t) {
                if (4 & n && t.__esModule) return t;
                if (16 & n && 'function' == typeof t.then) return t;
            }
            var o = Object.create(null);
            _.r(o);
            var i = {};
            e = e || [null, r({}), r([]), r(r)];
            for (
                var a = 2 & n && t;
                'object' == typeof a && !~e.indexOf(a);
                a = r(a)
            )
                Object.getOwnPropertyNames(a).forEach(e => (i[e] = () => t[e]));
            return (i.default = () => t), _.d(o, i), o;
        }),
        (_.d = (e, r) => {
            for (var t in r)
                _.o(r, t) &&
                    !_.o(e, t) &&
                    Object.defineProperty(e, t, { enumerable: !0, get: r[t] });
        }),
        (_.f = {}),
        (_.e = e =>
            Promise.all(
                Object.keys(_.f).reduce((r, t) => (_.f[t](e, r), r), [])
            )),
        (_.u = e =>
            e +
            '.' +
            {
                128: 'fd6a7bd994d997285906',
                154: '44c9e2db1c8a2cc6b5da',
                576: 'ee3d77f00b3c07797681',
                600: '0dd7986d3894bd09e26d',
                728: '6b8799045b98075c7a8f',
                756: 'c5b140c3c030cc345b8b',
            }[e] +
            '.js?v=' +
            {
                128: 'fd6a7bd994d997285906',
                154: '44c9e2db1c8a2cc6b5da',
                576: 'ee3d77f00b3c07797681',
                600: '0dd7986d3894bd09e26d',
                728: '6b8799045b98075c7a8f',
                756: 'c5b140c3c030cc345b8b',
            }[e]),
        (_.g = (function() {
            if ('object' == typeof globalThis) return globalThis;
            try {
                return this || new Function('return this')();
            } catch (e) {
                if ('object' == typeof window) return window;
            }
        })()),
        (_.o = (e, r) => Object.prototype.hasOwnProperty.call(e, r)),
        (t = {}),
        (n = '@jupyterlite/pyodide-kernel-extension:'),
        (_.l = (e, r, o, i) => {
            if (t[e]) t[e].push(r);
            else {
                var a, l;
                if (void 0 !== o)
                    for (
                        var u = document.getElementsByTagName('script'), f = 0;
                        f < u.length;
                        f++
                    ) {
                        var c = u[f];
                        if (
                            c.getAttribute('src') == e ||
                            c.getAttribute('data-webpack') == n + o
                        ) {
                            a = c;
                            break;
                        }
                    }
                a ||
                    ((l = !0),
                    ((a = document.createElement('script')).charset = 'utf-8'),
                    (a.timeout = 120),
                    _.nc && a.setAttribute('nonce', _.nc),
                    a.setAttribute('data-webpack', n + o),
                    (a.src = e)),
                    (t[e] = [r]);
                var d = (r, n) => {
                        (a.onerror = a.onload = null), clearTimeout(s);
                        var o = t[e];
                        if (
                            (delete t[e],
                            a.parentNode && a.parentNode.removeChild(a),
                            o && o.forEach(e => e(n)),
                            r)
                        )
                            return r(n);
                    },
                    s = setTimeout(
                        d.bind(null, void 0, { type: 'timeout', target: a }),
                        12e4
                    );
                (a.onerror = d.bind(null, a.onerror)),
                    (a.onload = d.bind(null, a.onload)),
                    l && document.head.appendChild(a);
            }
        }),
        (_.r = e => {
            'undefined' != typeof Symbol &&
                Symbol.toStringTag &&
                Object.defineProperty(e, Symbol.toStringTag, {
                    value: 'Module',
                }),
                Object.defineProperty(e, '__esModule', { value: !0 });
        }),
        (() => {
            _.S = {};
            var e = {},
                r = {};
            _.I = (t, n) => {
                n || (n = []);
                var o = r[t];
                if ((o || (o = r[t] = {}), !(n.indexOf(o) >= 0))) {
                    if ((n.push(o), e[t])) return e[t];
                    _.o(_.S, t) || (_.S[t] = {});
                    var i = _.S[t],
                        a = '@jupyterlite/pyodide-kernel-extension',
                        l = (e, r, t, n) => {
                            var o = (i[e] = i[e] || {}),
                                l = o[r];
                            (!l ||
                                (!l.loaded &&
                                    (!n != !l.eager ? n : a > l.from))) &&
                                (o[r] = { get: t, from: a, eager: !!n });
                        },
                        u = [];
                    return (
                        'default' === t &&
                            (l(
                                '@jupyterlite/pyodide-kernel-extension',
                                '0.2.3',
                                () =>
                                    Promise.all([
                                        _.e(756),
                                        _.e(154),
                                    ]).then(() => () => _(260))
                            ),
                            l('@jupyterlite/pyodide-kernel', '0.2.3', () =>
                                Promise.all([
                                    _.e(128),
                                    _.e(600),
                                    _.e(756),
                                ]).then(() => () => _(952))
                            )),
                        (e[t] = u.length
                            ? Promise.all(u).then(() => (e[t] = 1))
                            : 1)
                    );
                }
            };
        })(),
        (() => {
            var e;
            _.g.importScripts && (e = _.g.location + '');
            var r = _.g.document;
            if (!e && r && (r.currentScript && (e = r.currentScript.src), !e)) {
                var t = r.getElementsByTagName('script');
                if (t.length)
                    for (var n = t.length - 1; n > -1 && !e; ) e = t[n--].src;
            }
            if (!e)
                throw new Error(
                    'Automatic publicPath is not supported in this browser'
                );
            (e = e
                .replace(/#.*$/, '')
                .replace(/\?.*$/, '')
                .replace(/\/[^\/]+$/, '/')),
                (_.p = e);
        })(),
        (o = e => {
            var r = e => e.split('.').map(e => (+e == e ? +e : e)),
                t = /^([^-+]+)?(?:-([^+]+))?(?:\+(.+))?$/.exec(e),
                n = t[1] ? r(t[1]) : [];
            return (
                t[2] && (n.length++, n.push.apply(n, r(t[2]))),
                t[3] && (n.push([]), n.push.apply(n, r(t[3]))),
                n
            );
        }),
        (i = (e, r) => {
            (e = o(e)), (r = o(r));
            for (var t = 0; ; ) {
                if (t >= e.length)
                    return t < r.length && 'u' != (typeof r[t])[0];
                var n = e[t],
                    i = (typeof n)[0];
                if (t >= r.length) return 'u' == i;
                var a = r[t],
                    l = (typeof a)[0];
                if (i != l)
                    return ('o' == i && 'n' == l) || 's' == l || 'u' == i;
                if ('o' != i && 'u' != i && n != a) return n < a;
                t++;
            }
        }),
        (a = e => {
            var r = e[0],
                t = '';
            if (1 === e.length) return '*';
            if (r + 0.5) {
                t +=
                    0 == r
                        ? '>='
                        : -1 == r
                        ? '<'
                        : 1 == r
                        ? '^'
                        : 2 == r
                        ? '~'
                        : r > 0
                        ? '='
                        : '!=';
                for (var n = 1, o = 1; o < e.length; o++)
                    n--,
                        (t +=
                            'u' == (typeof (l = e[o]))[0]
                                ? '-'
                                : (n > 0 ? '.' : '') + ((n = 2), l));
                return t;
            }
            var i = [];
            for (o = 1; o < e.length; o++) {
                var l = e[o];
                i.push(
                    0 === l
                        ? 'not(' + u() + ')'
                        : 1 === l
                        ? '(' + u() + ' || ' + u() + ')'
                        : 2 === l
                        ? i.pop() + ' ' + i.pop()
                        : a(l)
                );
            }
            return u();
            function u() {
                return i.pop().replace(/^\((.+)\)$/, '$1');
            }
        }),
        (l = (e, r) => {
            if (0 in e) {
                r = o(r);
                var t = e[0],
                    n = t < 0;
                n && (t = -t - 1);
                for (var i = 0, a = 1, u = !0; ; a++, i++) {
                    var f,
                        c,
                        d = a < e.length ? (typeof e[a])[0] : '';
                    if (i >= r.length || 'o' == (c = (typeof (f = r[i]))[0]))
                        return !u || ('u' == d ? a > t && !n : ('' == d) != n);
                    if ('u' == c) {
                        if (!u || 'u' != d) return !1;
                    } else if (u)
                        if (d == c)
                            if (a <= t) {
                                if (f != e[a]) return !1;
                            } else {
                                if (n ? f > e[a] : f < e[a]) return !1;
                                f != e[a] && (u = !1);
                            }
                        else if ('s' != d && 'n' != d) {
                            if (n || a <= t) return !1;
                            (u = !1), a--;
                        } else {
                            if (a <= t || c < d != n) return !1;
                            u = !1;
                        }
                    else 's' != d && 'n' != d && ((u = !1), a--);
                }
            }
            var s = [],
                p = s.pop.bind(s);
            for (i = 1; i < e.length; i++) {
                var h = e[i];
                s.push(
                    1 == h ? p() | p() : 2 == h ? p() & p() : h ? l(h, r) : !p()
                );
            }
            return !!p();
        }),
        (u = (e, r) => {
            var t = _.S[e];
            if (!t || !_.o(t, r))
                throw new Error(
                    'Shared module ' + r + " doesn't exist in shared scope " + e
                );
            return t;
        }),
        (f = (e, r) => {
            var t = e[r];
            return Object.keys(t).reduce(
                (e, r) => (!e || (!t[e].loaded && i(e, r)) ? r : e),
                0
            );
        }),
        (c = (e, r, t, n) =>
            'Unsatisfied version ' +
            t +
            ' from ' +
            (t && e[r][t].from) +
            ' of shared singleton module ' +
            r +
            ' (required ' +
            a(n) +
            ')'),
        (d = (e, r, t, n) => {
            var o = f(e, t);
            return l(n, o) || p(c(e, t, o, n)), h(e[t][o]);
        }),
        (s = (e, r, t) => {
            var n = e[r];
            return (
                (r = Object.keys(n).reduce(
                    (e, r) => (!l(t, r) || (e && !i(e, r)) ? e : r),
                    0
                )) && n[r]
            );
        }),
        (p = e => {
            'undefined' != typeof console && console.warn && console.warn(e);
        }),
        (h = e => ((e.loaded = 1), e.get())),
        (v = (b = e =>
            function(r, t, n, o) {
                var i = _.I(r);
                return i && i.then
                    ? i.then(e.bind(e, r, _.S[r], t, n, o))
                    : e(r, _.S[r], t, n, o);
            })((e, r, t, n) => (u(e, t), d(r, 0, t, n)))),
        (y = b((e, r, t, n, o) => {
            var i = r && _.o(r, t) && s(r, t, n);
            return i ? h(i) : o();
        })),
        (m = {}),
        (g = {
            240: () => v('default', '@jupyterlite/kernel', [2, 0, 2, 0]),
            281: () => v('default', '@jupyterlab/coreutils', [1, 6, 0, 12]),
            540: () => v('default', '@jupyterlite/contents', [2, 0, 2, 0]),
            976: () => v('default', '@jupyterlite/server', [2, 0, 2, 0]),
            464: () => v('default', '@lumino/coreutils', [1, 2, 0, 0]),
            728: () =>
                y('default', '@jupyterlite/pyodide-kernel', [2, 0, 2, 3], () =>
                    Promise.all([_.e(128), _.e(600)]).then(() => () => _(952))
                ),
        }),
        (j = { 154: [540, 976], 600: [464], 728: [728], 756: [240, 281] }),
        (w = {}),
        (_.f.consumes = (e, r) => {
            _.o(j, e) &&
                j[e].forEach(e => {
                    if (_.o(m, e)) return r.push(m[e]);
                    if (!w[e]) {
                        var t = r => {
                            (m[e] = 0),
                                (_.m[e] = t => {
                                    delete _.c[e], (t.exports = r());
                                });
                        };
                        w[e] = !0;
                        var n = r => {
                            delete m[e],
                                (_.m[e] = t => {
                                    throw (delete _.c[e], r);
                                });
                        };
                        try {
                            var o = g[e]();
                            o.then ? r.push((m[e] = o.then(t).catch(n))) : t(o);
                        } catch (e) {
                            n(e);
                        }
                    }
                });
        }),
        (() => {
            _.b = document.baseURI || self.location.href;
            var e = { 480: 0 };
            _.f.j = (r, t) => {
                var n = _.o(e, r) ? e[r] : void 0;
                if (0 !== n)
                    if (n) t.push(n[2]);
                    else if (/^7(28|56)$/.test(r)) e[r] = 0;
                    else {
                        var o = new Promise((t, o) => (n = e[r] = [t, o]));
                        t.push((n[2] = o));
                        var i = _.p + _.u(r),
                            a = new Error();
                        _.l(
                            i,
                            t => {
                                if (
                                    _.o(e, r) &&
                                    (0 !== (n = e[r]) && (e[r] = void 0), n)
                                ) {
                                    var o =
                                            t &&
                                            ('load' === t.type
                                                ? 'missing'
                                                : t.type),
                                        i = t && t.target && t.target.src;
                                    (a.message =
                                        'Loading chunk ' +
                                        r +
                                        ' failed.\n(' +
                                        o +
                                        ': ' +
                                        i +
                                        ')'),
                                        (a.name = 'ChunkLoadError'),
                                        (a.type = o),
                                        (a.request = i),
                                        n[1](a);
                                }
                            },
                            'chunk-' + r,
                            r
                        );
                    }
            };
            var r = (r, t) => {
                    var n,
                        o,
                        [i, a, l] = t,
                        u = 0;
                    if (i.some(r => 0 !== e[r])) {
                        for (n in a) _.o(a, n) && (_.m[n] = a[n]);
                        l && l(_);
                    }
                    for (r && r(t); u < i.length; u++)
                        (o = i[u]), _.o(e, o) && e[o] && e[o][0](), (e[o] = 0);
                },
                t = (self.webpackChunk_jupyterlite_pyodide_kernel_extension =
                    self.webpackChunk_jupyterlite_pyodide_kernel_extension ||
                    []);
            t.forEach(r.bind(null, 0)), (t.push = r.bind(null, t.push.bind(t)));
        })();
    var S = _(624);
    (_JUPYTERLAB = void 0 === _JUPYTERLAB ? {} : _JUPYTERLAB)[
        '@jupyterlite/pyodide-kernel-extension'
    ] = S;
})();
//# sourceMappingURL=remoteEntry.badedd5607b5d4e57583.js.map
