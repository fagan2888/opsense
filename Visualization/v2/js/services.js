/*global angular, Utils*/
/*jslint nomen: true*/
var OpServices = angular.module('OpServices', ['elasticsearch']);
OpServices.factory('db', function (esFactory) {
    'use strict';
    var self = {};
    
    self.params = function (params) {
        Object.keys(params).forEach(function (p) {
            self[p] = params[p];
        });
      
    };
    
    self.client = function () {
        if (self._client) {
            return self._client;
        }
        
        var host = "";
        if (self.user && self.user.length > 0) {
            host = "http://" + self.user + ":" + self.password + "@" + self.host;
        } else {
            host = "http://" + self.host;
        }
        
        
        self._client = esFactory({
            host: host,
            apiVersion: '1.4'
        });
        return self._client;
    };
    
    self.getMetaData = function () {
        return self.client().indices
            .getMapping({index: self.index.index, type: self.index.type})
            .then(function (result) {
                var base = result[self.index.index].mappings[self.index.type].properties,
                    fields = [];
                Object.keys(base).forEach(function (key) {
                    if (key !== "terms") {
                        Object.keys(base[key].properties).forEach(function (prop) {
                            if (base[key].properties[prop].type) {
                                fields.push({field: prop, group: key, type: base[key].properties[prop].type});
                            }
                        });
                        
                    }
                });
                return fields;
            });
    };
    
    self.getData = function (context) {
        if (context.pattern.length === 0) {
            context.pattern = "Noun|Adjective|Verb+Noun|Adjective|Verb";
        }
        
        var query = self.getQuery(context.search),
            aggs = self.getAggs(context);
        
        query.aggs = aggs;
        
        return self.client().search({
            index: self.index.index,
            type: self.index.type,
            size: 200,
            body: query
        }).then(function (result) {
            var data = {},
                searchWords = self.getSearchWords(context.search);
            
            data.global = {};
            data.global.x = result.aggregations.stats_x.buckets ? result.aggregations.stats_x.buckets.map(function (i) {
                i.count = i.doc_count;
                delete i.doc_count;
                return i;
            }) : self.getValue(result.aggregations.stats_x, context.xMetric);
            data.global.xHash = {};
            if (result.aggregations.stats_x.buckets) {
                data.global.x.sort(Utils.fieldSort('key'));
                data.global.x.forEach(function (gc) {
                    data.global.xHash[gc.key] = gc.count;
                });
            }
            data.global.y = result.aggregations.stats_y.value;
            data.global.count = result.hits.total;
            
            
            data.terms = result.aggregations.termsList.list.terms.buckets.map(function (m) { return self.formatTerm(m, context, data.global); });
            
            data.documents = result.hits.hits.map(function (hit) {
                hit._source.highlight = hit.highlight;
                hit._source.snippet = self.highlightWords(self.getSnippet(hit._source), searchWords);
                hit._source.html = self.highlightWords(hit._source.document.text, searchWords);
                return hit._source;
            });
            return data;
            
        });
        
    };
    
    self.getDocuments = function (context, keys) {
        var filters = [], fil, query,
            queryDocs = self.getQuery(context.search),
            searchWords = self.getSearchWords(context.search);
        if (keys && keys.length > 0) {
            keys.forEach(function (k) {
                var words = k.key.split(" ");
                if (words.length > 1) {
                    fil = {
                        "or" : [
                            {"and": [{"term" : {"terms.g.lm" : words[0]}}, {"term" : {"terms.d.lm" : words[1]}}]},
                            {"and": [{"term" : {"terms.d.lm" : words[0]}}, {"term" : {"terms.g.lm" : words[1]}}]}
                        ]
                    };
                } else {
                    fil = {
                        "or" : [
                            {"and": [{"term" : {"terms.g.lm" : words[0]}}]},
                            {"and": [{"term" : {"terms.d.lm" : words[0]}}]}
                        ]
                    };
                }
                filters.push(fil);
            });
        }
        delete queryDocs.highlight;
        query =
            {
                "query": {
                    "filtered" : queryDocs
                }
            };
        query.query.filtered.filter = {
            "nested" : {
                "path" : "terms",
                "filter" : {
                    "or" : filters
                },
                "_cache" : true
            }
        };
        
        return self.client().search({
            index: self.index.index,
            type: self.index.type,
            size: 1,
            body: query
        }).then(function (result) {
            if (!result.hits) {
                return [];
            }
            return result.hits.hits.map(function (hit) {
                var html, high;
                hit._source.highlight = hit.highlight;
                
                html = self.getHtml(hit._source, keys);
                high = self.highlightWords(html, searchWords);
                hit._source.snippet =   self.getSnippetHTML(high);
                hit._source.html =  high;
                return hit._source;
            });
        });
        
    };
    
    /* Utils ---------------------------------------------------------*/
    self.getQuery = function (search) {
        var query = {};
        
        if (search && search.length > 0) {
            query.query = { "match_phrase" : { "document.text" : search }};
        }
        
        if (search && search.length > 0 && search[0] === "_") {
            query.query = {
                "query_string" : {
                    default_field : "document.text",
                    query : search.substring(1)
                }
            };
        }
        query.highlight = {"fields": {"document.text": {}}};
        return query;
    };
    
    self.getAggs = function (context) {
        var aggs, limit = 200,
            exclude = ".*ORGANIZATION.*|.*PERSON.*|.*LOCATION.*|be .*|.* be|null .*|.* null",
            x = {
                field: context.xField,
                metric: context.xMetric
            },
            y = {
                field: context.yField,
                metric: context.yMetric
            };
        
        if (context.pattern.split("+").length > 1) {
            aggs = {
                "stats_x": self.getOperation(x),
                "stats_y": self.getOperation(y),
                "termsList" : {
                    "nested" : {
                        "path" : "terms"
                    },
                    "aggs" : {
                        "list" : {
                            "filter": self.getFilter(context.pattern),
                            "aggs" : {
                                "terms" : {
                                    "terms" : {
                                        "exclude": exclude,
                                        "script": "doc['terms.g.tg'].value < doc['terms.d.tg'].value ? doc['terms.g.lm'].value + ' ' + doc['terms.d.lm'].value : doc['terms.d.lm'].value + ' ' + doc['terms.g.lm'].value",
                                        "size": limit
                                    },
                                    "aggs": {
                                        "stats": {
                                            "reverse_nested": {},
                                            "aggs": {
                                                "stats_x": self.getOperation(x, y),
                                                "stats_y": self.getOperation(y, x)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };
        } else {
            aggs = {
                "termsList" : {
                    "nested" : {
                        "path" : "terms"
                    },
                    "aggs" : {
                        "list" : {
                            "filter": self.getFilter(context.pattern),
                            "aggs" : {
                                "terms" : {
                                    "terms" : {
                                        "exclude": exclude,
                                        "script": "def tags = [" + self.listOfTags(context.pattern) + "]; doc['terms.g.tg'].value.length() == 1 ? doc['terms.d.lm'].value : (tags.contains(doc['terms.g.tg'].value.substring(0,2)) ? doc['terms.g.lm'].value : doc['terms.d.lm'].value)",
                                        "size": limit
                                    },
                                    "aggs": {
                                        "stats": {
                                            "reverse_nested": {},
                                            "aggs": {
                                                "stats_x": self.getOperation(x, y),
                                                "stats_y": self.getOperation(y, x)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };
        }
        return aggs;
        
    };
    
    self.getTag = function (value) {
        value = value.toLowerCase();
        switch (value) {
        case "n":
        case "nn":
        case "noun":
            return "NN";
         
        case "v":
        case "vb":
        case "verb":
            return "VB";

        case "p":
        case "pr":
        case "pronoun":
            return "PR";

        case "a":
        case "adj":
        case "jj":
        case "adjective":
            return "JJ";

        case "adv":
        case "rb":
        case "adverb":
            return "RB";
            
        default:
            return value;
        }
    };
    
    self.getFilter = function (pattern) {
        var inter = true, gov, dep, govFilter, depFilter, t, and, globalOr, lgovFilter, ldepFilter, land, filter;
        if (pattern.split("+").length > 1) {
            gov = pattern.split("+")[0];
            dep = pattern.split("+")[1];

            govFilter = [];
            gov.split("|").forEach(function (op) {
                op = self.getTag(op);
                t = {"prefix" : { "terms.g.tg" : op} };
                govFilter.push(t);
            });

            depFilter = [];
            dep.split("|").forEach(function (op) {
                op = self.getTag(op);
                t = {"prefix" : { "terms.d.tg" : op} };
                depFilter.push(t);
            });

            and = [{"or": govFilter}, {"or": depFilter}];
            globalOr = [{"and": and}];

            if (inter === true) {
                lgovFilter = [];
                gov.split("|").forEach(function (op) {
                    op = self.getTag(op);
                    t = {"prefix" : { "terms.d.tg" : op} };
                    lgovFilter.push(t);
                });

                ldepFilter = [];
                dep.split("|").forEach(function (op) {
                    op = self.getTag(op);
                    t = {"prefix" : { "terms.g.tg" : op} };
                    ldepFilter.push(t);
                });

                land = [{"or": lgovFilter}, {"or": ldepFilter}];
                globalOr.push({"and": land});
            }
        } else {
            filter = [];
            pattern.split("|").forEach(function (op) {
                op = self.getTag(op);
                t = {"prefix" : { "terms.g.tg" : op} };
                filter.push(t);
            });
            pattern.split("|").forEach(function (op) {
                op = self.getTag(op);
                t = {"prefix" : { "terms.d.tg" : op} };
                filter.push(t);
            });
            return { "or" : filter};
        }
        return { "or" : globalOr};
    };
    
    self.getOperation = function (op, otherOp) {
        var aggs = {};
        switch (op.metric.metric) {
        case "avg":
        case "min":
        case "max":
        case "sum":
        case "value_count":
            aggs[op.metric.metric] = { "field" : op.field.field };
            return aggs;

        case "variance":
        case "std_deviation":
            aggs.extended_stats = { "field" : op.field.field };
            return aggs;

        case "percentiles":
        case "terms":
        case "significant_terms":
            aggs[op.metric.metric] = { "field" : op.field.field, "size": 50 };
            if (otherOp) {
                aggs.aggs = { stats_y : {}};
                aggs.aggs.stats_y = self.getOperation(otherOp);
            }
            return aggs;

        case "date_histogram":
        case "histogram":
            aggs[op.metric.metric] = { "field" : op.field.field, "interval": op.interval };
            return aggs;
        }
    };
    
    self.listOfTags = function (pattern) {
        var res = "";
        pattern.split("|").forEach(function (i) {
            res += "'" + self.getTag(i) + "',";
        });
        return res;
    };
    
    self.formatTerm = function (term, context, global) {
        var main, others,
            result = {
                key: term.key,
                count: term.stats.doc_count,
                x: self.getValue(term.stats.stats_x, context.xMetric.metric),
                y: self.getValue(term.stats.stats_y, context.yMetric.metric)
            };
        
        if (result.x.length > 0) {
            result.x.forEach(function (t) {
                if (context.yMetric.metric === "value_count") {
                    t.stats_y.value = t.stats_y.value / global.xHash[t.key];
                }
            });
            if (context.yMetric.metric === "value_count") {
                result.x.sort(function (a, b) {
                    return a.stats_y.value > b.stats_y.value ? -1 : 1;
                });
            }
            others = result.x;
            main = result.x[0];
            result.x = main.key;
            result.y = main.stats_y.value;
            result.others = others.map(function (o) {
                var result = {
                    key: term.key,
                    count: o.doc_count,
                    x: o.key,
                    y: o.stats_y.value
                };
                return result;
            });
        }
            
        return result;
    };
    
    self.getValue = function (stats, metric) {
        switch (metric) {
        case "avg":
        case "min":
        case "max":
        case "sum":
        case "value_count":
            return stats.value;

        case "variance":
        case "std_deviation":
            return stats[metric];

        case "percentiles":
        case "terms":
        case "significant_terms":
            return stats.buckets;

        case "date_histogram":
        case "histogram":
            return "";
        }
        
        return "";
    };
    
    self.getSnippet = function (hit) {
        var m,
            re = /((?:(\S+\s+){1,20})\w+)/,
            str = hit.document.text;
        if ((m = re.exec(str)) !== null) {
            if (m.index === re.lastIndex) {
                re.lastIndex += 1;
            }
        }
        if (m[0].length < str.length) {
            m[0] += " ...";
        }
        return m[0];
    };
    
    self.getSnippetHTML = function (html) {
        var m,
            re = /((\S+\s+){1,20})(<i>|<b>)((?:(\S+\s+){1,20})\w+)/,
            str = html;
        if ((m = re.exec(str)) !== null) {
            if (m.index === re.lastIndex) {
                re.lastIndex += 1;
            }
            if (m[0].length < str.length) {
                m[0] += " ...";
            }
            return m[0];
        }
        return html;
        
    };
    
    self.getHtml = function (hit, keys) {
        keys = keys.map(function (k) { return k.key; });
        var newText = "",
            text = hit.document.text,
            last = 0,
            highlight = [],
            selectedTerms =  hit.terms.filter(function (term) {
                var i, parts;
                for (i = 0; i < keys.length; i += 1) {
                    parts = keys[i].split(" ");
                    if (parts.length === 1) {
                        if (term.d.lm === parts[0]) {
                            highlight.push({c: "similar1", term: term.d});
                            return true;
                        } else if (term.g.lm === parts[0]) {
                            highlight.push({c: "similar2", term: term.g});
                            return true;
                        }
                    } else {
                        if (term.d.lm === parts[0] && term.g.lm === parts[1]) {
                            highlight.push({c: "similar1", term: term.d});
                            highlight.push({c: "similar2", term: term.g});
                            return true;
                        } else if (term.d.lm === parts[1] && term.g.lm === parts[0]) {
                            highlight.push({c: "similar1", term: term.g});
                            highlight.push({c: "similar2", term: term.d});
                            return true;
                        }
                    }

                }
                return false;
            });
        
        highlight.sort(function (a, b) {
            return a.term.ed - b.term.ed;
        });
        highlight.forEach(function (h) {
            var part = text.substring(last, h.term.ed - h.term.wd.length);
            newText += part;
            if (h.c === "similar1") {
                newText += "<i>" + h.term.wd + "</i>";
            } else {
                newText += "<b>" + h.term.wd + "</b>";
            }
            last = h.term.ed;
        });
        newText += text.substring(last);
        return newText;
    };
    
    self.highlightWords = function (text, words) {
        if (!words || words.length === 0) {
            return text;
        }
        var pattern = "(" + words.join("|") + ")",
            regex = new RegExp(pattern, "ig"),
            res = text.replace(regex, "<em>$1</em>");
        return res;
    };
    
    self.getSearchWords = function (search, ignore) {
        if (!search || search.length === 0) {
            return [];
        }
        ignore = ignore || [];
        ignore = ignore.concat(["OR", "AND"]);
        if (search[0] === "_") {
            search = search.substring(1);
        }
        return search.split(" ").filter(function (w) {
            return ignore.indexOf(w) === -1;
        });
    };
    
    return self;
});













