'use strict';
(self['webpackChunkcommunication_extension'] =
  self['webpackChunkcommunication_extension'] || []).push([
  ['lib_index_js'],
  {
    /***/ './lib/index.js':
      /*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
      /***/ (
        __unused_webpack_module,
        __webpack_exports__,
        __webpack_require__
      ) => {
        __webpack_require__.r(__webpack_exports__);
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
          /* harmony export */ default: () => __WEBPACK_DEFAULT_EXPORT__
          /* harmony export */
        });
        /* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
          /*! @jupyterlab/apputils */ 'webpack/sharing/consume/default/@jupyterlab/apputils'
        );
        /* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/ __webpack_require__.n(
          _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__
        );

        /**
         * Initialization data for the jupyterlab-iframe-bridge-example extension.
         */
        const plugin = {
          id: 'jupyterlab-iframe-bridge-example:plugin',
          autoStart: true,
          requires: [
            _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__.IThemeManager
          ],
          activate: (app, themeManager) => {
            console.log(
              'JupyterLab extension jupyterlab-iframe-bridge-example is activated!'
            );
            /* Incoming messages management */
            window.addEventListener(
              'message',
              event => {
                if (event.data.type === 'from-host-to-iframe') {
                  console.log('Message received in the iframe:', event.data);
                  if (themeManager.theme === 'JupyterLab Dark') {
                    themeManager.setTheme('JupyterLab Light');
                  } else {
                    themeManager.setTheme('JupyterLab Dark');
                  }
                }
              },
              false
            );
            /* Outgoing messages management */
            const notifyThemeChanged = () => {
              const message = {
                type: 'from-iframe-to-host',
                theme: themeManager.theme
              };
              window.parent.postMessage(message, '*');
              console.log('Message sent to the host:', message);
            };
            themeManager.themeChanged.connect(notifyThemeChanged);
          }
        };
        /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = plugin;

        /***/
      }
  }
]);
//# sourceMappingURL=lib_index_js.a55949f4c762e13d1865.js.map
