///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register([], function(exports_1) {
    var CacheFriendlyOpenTSDBConfigCtrl;
    return {
        setters:[],
        execute: function() {
            CacheFriendlyOpenTSDBConfigCtrl = (function () {
                function CacheFriendlyOpenTSDBConfigCtrl($scope) {
                    this.tsdbVersions = [{ name: '<=2.1', value: 1 }, { name: '==2.2', value: 2 }, { name: '==2.3', value: 3 }];
                    this.tsdbResolutions = [{ name: 'second', value: 1 }, { name: 'millisecond', value: 2 }];
                    this.current.jsonData = this.current.jsonData || {};
                    this.current.jsonData.tsdbVersion = this.current.jsonData.tsdbVersion || 1;
                    this.current.jsonData.tsdbResolution = this.current.jsonData.tsdbResolution || 1;
                    this.current.jsonData.roundNearestMillis = this.current.jsonData.roundNearestMillis || 1;
                    this.current.jsonData.disableCache = this.current.jsonData.disableCache || false;
                }
                CacheFriendlyOpenTSDBConfigCtrl.templateUrl = 'partials/config.html';
                return CacheFriendlyOpenTSDBConfigCtrl;
            })();
            exports_1("CacheFriendlyOpenTSDBConfigCtrl", CacheFriendlyOpenTSDBConfigCtrl);
        }
    }
});
//# sourceMappingURL=config_ctrl.js.map