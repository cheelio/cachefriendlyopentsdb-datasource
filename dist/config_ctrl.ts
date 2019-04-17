///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

export class CacheFriendlyOpenTSDBConfigCtrl {
  static templateUrl = 'partials/config.html';
  current: any;

  constructor($scope) {
    this.current.jsonData = this.current.jsonData || {};
    this.current.jsonData.tsdbVersion = this.current.jsonData.tsdbVersion || 1;
    this.current.jsonData.tsdbResolution = this.current.jsonData.tsdbResolution || 1;
    this.current.jsonData.roundNearestMillis = this.current.jsonData.roundNearestMillis || 1;
    this.current.jsonData.disableCache = this.current.jsonData.disableCache || false;
  }

  tsdbVersions = [{ name: '<=2.1', value: 1 }, { name: '==2.2', value: 2 }, { name: '==2.3', value: 3 }];
  tsdbResolutions = [{ name: 'second', value: 1 }, { name: 'millisecond', value: 2 }];

}
