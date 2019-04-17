///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register(['lodash', 'angular', 'app/core/utils/datemath'], function(exports_1) {
    var lodash_1, angular_1, dateMath;
    var CacheFriendlyOpenTSDBDatasource;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (angular_1_1) {
                angular_1 = angular_1_1;
            },
            function (dateMath_1) {
                dateMath = dateMath_1;
            }],
        execute: function() {
            CacheFriendlyOpenTSDBDatasource = (function () {
                /** @ngInject */
                function CacheFriendlyOpenTSDBDatasource(instanceSettings, backendSrv, templateSrv, $q) {
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                    this.$q = $q;
                    this.type = 'opentsdb';
                    this.url = instanceSettings.url;
                    this.name = instanceSettings.name;
                    this.withCredentials = instanceSettings.withCredentials;
                    this.basicAuth = instanceSettings.basicAuth;
                    instanceSettings.jsonData = instanceSettings.jsonData || {};
                    this.tsdbVersion = instanceSettings.jsonData.tsdbVersion || 1;
                    this.tsdbResolution = instanceSettings.jsonData.tsdbResolution || 1;
                    this.roundNearestMillis = instanceSettings.jsonData.roundNearestMillis || 1;
                    this.disableCache = instanceSettings.jsonData.disableCache || false;
                    this.tagKeys = {};
                    console.log(instanceSettings);
                    this.aggregatorsPromise = null;
                    this.filterTypesPromise = null;
                }
                // Called once per panel (graph)
                CacheFriendlyOpenTSDBDatasource.prototype.query = function (options) {
                    var _this = this;
                    var start = this.convertToTSDBTime(options.rangeRaw.from, false, options.timezone);
                    var end = this.convertToTSDBTime(options.rangeRaw.to, true, options.timezone);
                    var qs = [];
                    lodash_1.default.each(options.targets, function (target) {
                        if (!target.metric) {
                            return;
                        }
                        qs.push(_this.convertTargetToQuery(target, options, _this.tsdbVersion));
                    });
                    var queries = lodash_1.default.compact(qs);
                    // No valid targets, return the empty result to save a round trip.
                    if (lodash_1.default.isEmpty(queries)) {
                        var d = this.$q.defer();
                        d.resolve({ data: [] });
                        return d.promise;
                    }
                    var groupByTags = {};
                    lodash_1.default.each(queries, function (query) {
                        if (query.filters && query.filters.length > 0) {
                            lodash_1.default.each(query.filters, function (val) {
                                groupByTags[val.tagk] = true;
                            });
                        }
                        else {
                            lodash_1.default.each(query.tags, function (val, key) {
                                groupByTags[key] = true;
                            });
                        }
                    });
                    options.targets = lodash_1.default.filter(options.targets, function (query) {
                        return query.hide !== true;
                    });
                    return this.performTimeSeriesQuery(queries, start, end).then(function (response) {
                        var metricToTargetMapping = _this.mapMetricsToTargets(response.data, options, _this.tsdbVersion);
                        var result = lodash_1.default.map(response.data, function (metricData, index) {
                            index = metricToTargetMapping[index];
                            if (index === -1) {
                                index = 0;
                            }
                            _this._saveTagKeys(metricData);
                            return _this.transformMetricData(metricData, groupByTags, options.targets[index], options, _this.tsdbResolution);
                        });
                        return { data: result };
                    });
                };
                CacheFriendlyOpenTSDBDatasource.prototype.annotationQuery = function (options) {
                    var start = this.convertToTSDBTime(options.rangeRaw.from, false, options.timezone);
                    var end = this.convertToTSDBTime(options.rangeRaw.to, true, options.timezone);
                    var qs = [];
                    var eventList = [];
                    qs.push({ aggregator: 'sum', metric: options.annotation.target });
                    var queries = lodash_1.default.compact(qs);
                    return this.performTimeSeriesQuery(queries, start, end).then(function (results) {
                        if (results.data[0]) {
                            var annotationObject = results.data[0].annotations;
                            if (options.annotation.isGlobal) {
                                annotationObject = results.data[0].globalAnnotations;
                            }
                            if (annotationObject) {
                                lodash_1.default.each(annotationObject, function (annotation) {
                                    var event = {
                                        text: annotation.description,
                                        time: Math.floor(annotation.startTime) * 1000,
                                        annotation: options.annotation,
                                    };
                                    eventList.push(event);
                                });
                            }
                        }
                        return eventList;
                    });
                };
                CacheFriendlyOpenTSDBDatasource.prototype.targetContainsTemplate = function (target) {
                    if (target.filters && target.filters.length > 0) {
                        for (var i = 0; i < target.filters.length; i++) {
                            if (this.templateSrv.variableExists(target.filters[i].filter)) {
                                return true;
                            }
                        }
                    }
                    if (target.tags && Object.keys(target.tags).length > 0) {
                        for (var tagKey in target.tags) {
                            if (this.templateSrv.variableExists(target.tags[tagKey])) {
                                return true;
                            }
                        }
                    }
                    return false;
                };
                CacheFriendlyOpenTSDBDatasource.prototype.performTimeSeriesQuery = function (queries, start, end) {
                    var msResolution = false;
                    if (this.tsdbResolution === 2) {
                        msResolution = true;
                    }
                    var reqBody = {
                        start: start,
                        queries: queries,
                        msResolution: msResolution,
                        globalAnnotations: true,
                    };
                    if (this.tsdbVersion === 3) {
                        reqBody.showQuery = true;
                    }
                    // Relative queries (e.g. last hour) don't include an end time
                    if (end) {
                        reqBody.end = end;
                    }
                    var options = {
                        method: 'POST',
                        url: this.url + '/api/query',
                        data: reqBody,
                        headers: []
                    };
                    this._addCredentialOptions(options);
                    if (this.disableCache) {
                        options.headers['Cache-Control'] = 'Public';
                        // This is actually not leggal but this is the easiest way to disable Pragma: no-cache
                        options.headers['Pragma'] = 'Public';
                    }
                    return this.backendSrv.datasourceRequest(options);
                };
                CacheFriendlyOpenTSDBDatasource.prototype.suggestTagKeys = function (metric) {
                    return this.$q.when(this.tagKeys[metric] || []);
                };
                CacheFriendlyOpenTSDBDatasource.prototype._saveTagKeys = function (metricData) {
                    var tagKeys = Object.keys(metricData.tags);
                    lodash_1.default.each(metricData.aggregateTags, function (tag) {
                        tagKeys.push(tag);
                    });
                    this.tagKeys[metricData.metric] = tagKeys;
                };
                CacheFriendlyOpenTSDBDatasource.prototype._performSuggestQuery = function (query, type) {
                    return this._get('/api/suggest', { type: type, q: query, max: 1000 }).then(function (result) {
                        return result.data;
                    });
                };
                CacheFriendlyOpenTSDBDatasource.prototype._performMetricKeyValueLookup = function (metric, keys) {
                    if (!metric || !keys) {
                        return this.$q.when([]);
                    }
                    var keysArray = keys.split(',').map(function (key) {
                        return key.trim();
                    });
                    var key = keysArray[0];
                    var keysQuery = key + '=*';
                    if (keysArray.length > 1) {
                        keysQuery += ',' + keysArray.splice(1).join(',');
                    }
                    var m = metric + '{' + keysQuery + '}';
                    return this._get('/api/search/lookup', { m: m, limit: 3000 }).then(function (result) {
                        result = result.data.results;
                        var tagvs = [];
                        lodash_1.default.each(result, function (r) {
                            if (tagvs.indexOf(r.tags[key]) === -1) {
                                tagvs.push(r.tags[key]);
                            }
                        });
                        return tagvs;
                    });
                };
                CacheFriendlyOpenTSDBDatasource.prototype._performMetricKeyLookup = function (metric) {
                    if (!metric) {
                        return this.$q.when([]);
                    }
                    return this._get('/api/search/lookup', { m: metric, limit: 1000 }).then(function (result) {
                        result = result.data.results;
                        var tagks = [];
                        lodash_1.default.each(result, function (r) {
                            lodash_1.default.each(r.tags, function (tagv, tagk) {
                                if (tagks.indexOf(tagk) === -1) {
                                    tagks.push(tagk);
                                }
                            });
                        });
                        return tagks;
                    });
                };
                CacheFriendlyOpenTSDBDatasource.prototype._get = function (relativeUrl, params) {
                    var options = {
                        method: 'GET',
                        url: this.url + relativeUrl,
                        params: params,
                    };
                    this._addCredentialOptions(options);
                    return this.backendSrv.datasourceRequest(options);
                };
                CacheFriendlyOpenTSDBDatasource.prototype._addCredentialOptions = function (options) {
                    if (this.basicAuth || this.withCredentials) {
                        options.withCredentials = true;
                    }
                    if (this.basicAuth) {
                        options.headers = { Authorization: this.basicAuth };
                    }
                };
                CacheFriendlyOpenTSDBDatasource.prototype.metricFindQuery = function (query) {
                    if (!query) {
                        return this.$q.when([]);
                    }
                    var interpolated;
                    try {
                        interpolated = this.templateSrv.replace(query, {}, 'distributed');
                    }
                    catch (err) {
                        return this.$q.reject(err);
                    }
                    var responseTransform = function (result) {
                        return lodash_1.default.map(result, function (value) {
                            return { text: value };
                        });
                    };
                    var metricsRegex = /metrics\((.*)\)/;
                    var tagNamesRegex = /tag_names\((.*)\)/;
                    var tagValuesRegex = /tag_values\((.*?),\s?(.*)\)/;
                    var tagNamesSuggestRegex = /suggest_tagk\((.*)\)/;
                    var tagValuesSuggestRegex = /suggest_tagv\((.*)\)/;
                    var metricsQuery = interpolated.match(metricsRegex);
                    if (metricsQuery) {
                        return this._performSuggestQuery(metricsQuery[1], 'metrics').then(responseTransform);
                    }
                    var tagNamesQuery = interpolated.match(tagNamesRegex);
                    if (tagNamesQuery) {
                        return this._performMetricKeyLookup(tagNamesQuery[1]).then(responseTransform);
                    }
                    var tagValuesQuery = interpolated.match(tagValuesRegex);
                    if (tagValuesQuery) {
                        return this._performMetricKeyValueLookup(tagValuesQuery[1], tagValuesQuery[2]).then(responseTransform);
                    }
                    var tagNamesSuggestQuery = interpolated.match(tagNamesSuggestRegex);
                    if (tagNamesSuggestQuery) {
                        return this._performSuggestQuery(tagNamesSuggestQuery[1], 'tagk').then(responseTransform);
                    }
                    var tagValuesSuggestQuery = interpolated.match(tagValuesSuggestRegex);
                    if (tagValuesSuggestQuery) {
                        return this._performSuggestQuery(tagValuesSuggestQuery[1], 'tagv').then(responseTransform);
                    }
                    return this.$q.when([]);
                };
                CacheFriendlyOpenTSDBDatasource.prototype.testDatasource = function () {
                    return this._performSuggestQuery('cpu', 'metrics').then(function () {
                        return { status: 'success', message: 'Data source is working' };
                    });
                };
                CacheFriendlyOpenTSDBDatasource.prototype.getAggregators = function () {
                    if (this.aggregatorsPromise) {
                        return this.aggregatorsPromise;
                    }
                    this.aggregatorsPromise = this._get('/api/aggregators').then(function (result) {
                        if (result.data && lodash_1.default.isArray(result.data)) {
                            return result.data.sort();
                        }
                        return [];
                    });
                    return this.aggregatorsPromise;
                };
                CacheFriendlyOpenTSDBDatasource.prototype.getFilterTypes = function () {
                    if (this.filterTypesPromise) {
                        return this.filterTypesPromise;
                    }
                    this.filterTypesPromise = this._get('/api/config/filters').then(function (result) {
                        if (result.data) {
                            return Object.keys(result.data).sort();
                        }
                        return [];
                    });
                    return this.filterTypesPromise;
                };
                CacheFriendlyOpenTSDBDatasource.prototype.transformMetricData = function (md, groupByTags, target, options, tsdbResolution) {
                    var metricLabel = this.createMetricLabel(md, target, groupByTags, options);
                    var dps = [];
                    // TSDB returns datapoints has a hash of ts => value.
                    // Can't use _.pairs(invert()) because it stringifies keys/values
                    lodash_1.default.each(md.dps, function (v, k) {
                        if (tsdbResolution === 2) {
                            dps.push([v, k * 1]);
                        }
                        else {
                            dps.push([v, k * 1000]);
                        }
                    });
                    return { target: metricLabel, datapoints: dps };
                };
                CacheFriendlyOpenTSDBDatasource.prototype.createMetricLabel = function (md, target, groupByTags, options) {
                    if (target.alias) {
                        var scopedVars = lodash_1.default.clone(options.scopedVars || {});
                        lodash_1.default.each(md.tags, function (value, key) {
                            scopedVars['tag_' + key] = { value: value };
                        });
                        return this.templateSrv.replace(target.alias, scopedVars);
                    }
                    var label = md.metric;
                    var tagData = [];
                    if (!lodash_1.default.isEmpty(md.tags)) {
                        lodash_1.default.each(lodash_1.default.toPairs(md.tags), function (tag) {
                            if (lodash_1.default.has(groupByTags, tag[0])) {
                                tagData.push(tag[0] + '=' + tag[1]);
                            }
                        });
                    }
                    if (!lodash_1.default.isEmpty(tagData)) {
                        label += '{' + tagData.join(', ') + '}';
                    }
                    return label;
                };
                CacheFriendlyOpenTSDBDatasource.prototype.convertTargetToQuery = function (target, options, tsdbVersion) {
                    if (!target.metric || target.hide) {
                        return null;
                    }
                    var query = {
                        metric: this.templateSrv.replace(target.metric, options.scopedVars, 'pipe'),
                        aggregator: 'avg',
                    };
                    if (target.aggregator) {
                        query.aggregator = this.templateSrv.replace(target.aggregator);
                    }
                    if (target.shouldComputeRate) {
                        query.rate = true;
                        query.rateOptions = {
                            counter: !!target.isCounter,
                        };
                        if (target.counterMax && target.counterMax.length) {
                            query.rateOptions.counterMax = parseInt(target.counterMax, 10);
                        }
                        if (target.counterResetValue && target.counterResetValue.length) {
                            query.rateOptions.resetValue = parseInt(target.counterResetValue, 10);
                        }
                        if (tsdbVersion >= 2) {
                            query.rateOptions.dropResets =
                                !query.rateOptions.counterMax && (!query.rateOptions.ResetValue || query.rateOptions.ResetValue === 0);
                        }
                    }
                    if (!target.disableDownsampling) {
                        var interval = this.templateSrv.replace(target.downsampleInterval || options.interval);
                        if (interval.match(/\.[0-9]+s/)) {
                            interval = parseFloat(interval) * 1000 + 'ms';
                        }
                        query.downsample = interval + '-' + target.downsampleAggregator;
                        if (target.downsampleFillPolicy && target.downsampleFillPolicy !== 'none') {
                            query.downsample += '-' + target.downsampleFillPolicy;
                        }
                    }
                    if (target.filters && target.filters.length > 0) {
                        query.filters = angular_1.default.copy(target.filters);
                        if (query.filters) {
                            for (var filterKey in query.filters) {
                                query.filters[filterKey].filter = this.templateSrv.replace(query.filters[filterKey].filter, options.scopedVars, 'pipe');
                            }
                        }
                    }
                    else {
                        query.tags = angular_1.default.copy(target.tags);
                        if (query.tags) {
                            for (var tagKey in query.tags) {
                                query.tags[tagKey] = this.templateSrv.replace(query.tags[tagKey], options.scopedVars, 'pipe');
                            }
                        }
                    }
                    if (target.explicitTags) {
                        query.explicitTags = true;
                    }
                    return query;
                };
                CacheFriendlyOpenTSDBDatasource.prototype.mapMetricsToTargets = function (metrics, options, tsdbVersion) {
                    var _this = this;
                    var interpolatedTagValue, arrTagV;
                    return lodash_1.default.map(metrics, function (metricData) {
                        if (tsdbVersion === 3) {
                            return metricData.query.index;
                        }
                        else {
                            return lodash_1.default.findIndex(options.targets, function (target) {
                                if (target.filters && target.filters.length > 0) {
                                    return target.metric === metricData.metric;
                                }
                                else {
                                    return (target.metric === metricData.metric &&
                                        lodash_1.default.every(target.tags, function (tagV, tagK) {
                                            interpolatedTagValue = _this.templateSrv.replace(tagV, options.scopedVars, 'pipe');
                                            arrTagV = interpolatedTagValue.split('|');
                                            return lodash_1.default.includes(arrTagV, metricData.tags[tagK]) || interpolatedTagValue === '*';
                                        }));
                                }
                            });
                        }
                    });
                };
                CacheFriendlyOpenTSDBDatasource.prototype.convertToTSDBTime = function (date, roundUp, timezone) {
                    if (date === 'now') {
                        return null;
                    }
                    date = dateMath.parse(date, roundUp).valueOf();
                    date = Math.round(date / this.roundNearestMillis) * this.roundNearestMillis;
                    return date;
                };
                return CacheFriendlyOpenTSDBDatasource;
            })();
            exports_1("default", CacheFriendlyOpenTSDBDatasource);
        }
    }
});
//# sourceMappingURL=datasource.js.map