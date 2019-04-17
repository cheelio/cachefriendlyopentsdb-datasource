/// <reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
export default class CacheFriendlyOpenTSDBDatasource {
    private backendSrv;
    private templateSrv;
    private $q;
    type: any;
    url: any;
    name: any;
    withCredentials: any;
    basicAuth: any;
    tsdbVersion: any;
    tsdbResolution: any;
    tagKeys: any;
    roundNearestMillis: any;
    disableCache: any;
    aggregatorsPromise: any;
    filterTypesPromise: any;
    /** @ngInject */
    constructor(instanceSettings: any, backendSrv: any, templateSrv: any, $q: any);
    query(options: any): any;
    annotationQuery(options: any): any;
    targetContainsTemplate(target: any): boolean;
    performTimeSeriesQuery(queries: any, start: any, end: any): any;
    suggestTagKeys(metric: any): any;
    _saveTagKeys(metricData: any): void;
    _performSuggestQuery(query: any, type: any): any;
    _performMetricKeyValueLookup(metric: any, keys: any): any;
    _performMetricKeyLookup(metric: any): any;
    _get(relativeUrl: any, params?: any): any;
    _addCredentialOptions(options: any): void;
    metricFindQuery(query: any): any;
    testDatasource(): any;
    getAggregators(): any;
    getFilterTypes(): any;
    transformMetricData(md: any, groupByTags: any, target: any, options: any, tsdbResolution: any): {
        target: any;
        datapoints: any[];
    };
    createMetricLabel(md: any, target: any, groupByTags: any, options: any): any;
    convertTargetToQuery(target: any, options: any, tsdbVersion: any): any;
    mapMetricsToTargets(metrics: any, options: any, tsdbVersion: any): any;
    convertToTSDBTime(date: any, roundUp: any, timezone: any): any;
}
