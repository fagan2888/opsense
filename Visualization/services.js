var vizServices = angular.module('vizServices', ['elasticsearch']);

vizServices.service('client', function (esFactory) {
    return esFactory({
        host: 'vgc.poly.edu/projects/r2sense',
        apiVersion: '1.4'
    });
});

//Database   --------------------------------------------------------------------------
vizServices.factory('db', function(client) {
    var self = this;
    var client = client;

    self.get2 = function(index, filter, pattern, x, y, count){
        var limit = count | 500;
        var query = {};
        if(filter && filter.length > 0){
            query.query = { "match_phrase" : { "document.text" : filter }}
        }
        
        if(pattern.split("+").length > 1){
            query.aggs = {
                "stats_x":getOperation(x),
                "stats_y":getOperation(y),
                "termsList" : {
                    "nested" : {
                        "path" : "terms"
                    },
                    "aggs" : {
                        "list" : { 
                            "filter": getTagFilter(pattern),
                            "aggs" : {
                                "terms" : { 
                                    "terms" : { 
                                        "exclude":"be .*|.* be|null .*|.* null",
                                        "script":"doc['terms.g.tg'].value < doc['terms.d.tg'].value ? doc['terms.g.lm'].value + ' ' + doc['terms.d.lm'].value : doc['terms.d.lm'].value + ' ' + doc['terms.g.lm'].value",
                                        "size":limit
                                    },
                                    "aggs":{
                                        "stats":{
                                            "reverse_nested":{},
                                            "aggs":{
                                                "stats_x":getOperation(x,y),
                                                "stats_y":getOperation(y,x)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            query.aggs = {
                "termsList" : {
                    "nested" : {
                        "path" : "terms"
                    },
                    "aggs" : {
                        "list" : { 
                            "filter": getTagFilter(pattern),
                            "aggs" : {
                                "terms" : { 
                                    "terms" : { 
                                        "exclude":"be .*|.* be|null .*|.* null",
                                        "script":"def tags = ["+listOfTags(pattern)+"]; doc['terms.g.tg'].value.length() == 1 ? doc['terms.d.lm'].value : (tags.contains(doc['terms.g.tg'].value.substring(0,2)) ? doc['terms.g.lm'].value : doc['terms.d.lm'].value)",            
                                        "size":limit
                                    },
                                    "aggs":{
                                        "stats":{
                                            "reverse_nested":{},
                                            "aggs":{
                                                "stats_x":getOperation(x,y),
                                                "stats_y":getOperation(y,x)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return client.search({
          index: index,
          type: 'documents',
          size: 0,
          body: query
        });
    }
    
    self.mapping = function(index){
        return client.indices.getMapping({index:index, type:"documents"});
    }
    
    self.loadReviews = function(index, filter, keys){
        var filters = [];
        if(keys && keys.length > 0)
        {
            keys.forEach(function(k){
                var words = k.key.split(" ");
                if(words.length > 1){
                    var fil = {
                        "or" : [
                            {"and": [{"term" : {"terms.g.lm" : words[0]}},{"term" : {"terms.d.lm" : words[1]}}]},
                            {"and": [{"term" : {"terms.d.lm" : words[0]}},{"term" : {"terms.g.lm" : words[1]}}]}
                        ]
                    }
                } else {
                    var fil = {
                        "or" : [
                            {"and": [{"term" : {"terms.g.lm" : words[0]}}]},
                            {"and": [{"term" : {"terms.d.lm" : words[0]}}]}
                        ]
                    }
                }
                filters.push(fil);
            })
        
            var query =
            {
                "query": 
                {
                    "filtered" : {

                        "filter" : {
                            "nested" : {
                                "path" : "terms",
                                "filter" : {
                                    "or" : filters
                                },
                                "_cache" : true
                            }
                        }
                    }
                }
            };
            if(filter && filter.length > 0){
                query.query.filtered.query = { "match_phrase" : { "document.text" : filter }}
            }
        } else {
            var query =
            {
                "query": 
                {
                    "filtered" : {

                    }
                }
            };
            if(filter && filter.length > 0){
                query.query.filtered.query = { "match_phrase" : { "document.text" : filter }}
            }
        }
        
        return client.search({
          index: index,
          type: 'documents',
            size: 100,
          body: query
        });
            
    }
    
    
    function listOfTags(pattern){
        var res = "";
        pattern.split("|").forEach(function(i){
            res += "'" + getTag(i) + "',";
        })
        return res;
    }
    
    
    function getOperation(op, otherOp){
        switch(op.operation){
            case "avg":
            case "min":
            case "max":
            case "sum":
            case "value_count":
                var aggs = {};
                aggs[op.operation] = { "field" : op.field.value };
                return aggs;
                break;
            
            case "variance":
            case "std_deviation":
                var aggs = {};
                aggs["extended_stats"] = { "field" : op.field.value };
                return aggs;
                break;
                
            case "percentiles":
            case "terms":
            case "significant_terms":
                var aggs = {};
                aggs[op.operation] = { "field" : op.field.value, "size":20 };
                if(otherOp){
                    aggs.aggs = { stats_y : {}};
                    aggs.aggs.stats_y = getOperation(otherOp);
                }
                return aggs;
                break;
            
            case "date_histogram":
            case "histogram":
                var aggs = {};
                aggs[op.operation] = { "field" : op.field.value, "interval":op.interval };
                return aggs;
                break;
        }
    }
    
    function getTag(value){
        value = value.toLowerCase();
        switch (value) {
            case "n":
            case "nn":
            case "noun":
                return "NN"
                break;
         
            case "v":
            case "vb":
            case "verb":
                return "VB"
                break;
                
            case "p":
            case "pr":
            case "pronoun":
                return "PR"
                break;
                
            case "a":
            case "adj":
            case "jj":
            case "adjective":
                return "JJ"
                break;
          default:
            return value;
        }
    }

    function getTagFilter(pattern){
        inter = true;
        if(pattern.split("+").length > 1){
            gov = pattern.split("+")[0];
            dep = pattern.split("+")[1];

            govFilter = [];
            gov.split("|").forEach(function (op){
                op = getTag(op);
                t = {"prefix" : { "terms.g.tg" : op} }
                govFilter.push(t);
            })

            depFilter = [];
            dep.split("|").forEach(function (op){
                op = getTag(op);
                t = {"prefix" : { "terms.d.tg" : op} }
                depFilter.push(t);
            })

            and = [{"or": govFilter}, {"or": depFilter}];
            globalOr = [{"and":and}];

            if(inter == true){
                lgovFilter = [];
                gov.split("|").forEach(function (op){
                    op = getTag(op);
                    t = {"prefix" : { "terms.d.tg" : op} }
                    lgovFilter.push(t);
                })

                ldepFilter = [];
                dep.split("|").forEach(function (op){
                    op = getTag(op);
                    t = {"prefix" : { "terms.g.tg" : op} }
                    ldepFilter.push(t);
                })

                land = [{"or": lgovFilter}, {"or": ldepFilter}];  
                 globalOr.push({"and":land});
            }
        } else {
            filter = [];
            pattern.split("|").forEach(function (op){
                op = getTag(op);
                t = {"prefix" : { "terms.g.tg" : op} }
                filter.push(t);
            })
            pattern.split("|").forEach(function (op){
                op = getTag(op);
                t = {"prefix" : { "terms.d.tg" : op} }
                filter.push(t);
            })
            return { "or" : filter}
        }
        return { "or" : globalOr};
    }

    self.get = function(index,gov,dep,inter){
        govFilter = [];
        gov.split(" ").forEach(function (op){
            t = {"prefix" : { "terms.g.tg" : op} }
            govFilter.push(t);
        })

        depFilter = [];
        dep.split(" ").forEach(function (op){
            t = {"prefix" : { "terms.d.tg" : op} }
            depFilter.push(t);
        })

        and = [{"or": govFilter}, {"or": depFilter}];
        globalOr = [{"and":and}];

        if(inter == true){
            lgovFilter = [];
            gov.split(" ").forEach(function (op){
                t = {"prefix" : { "terms.d.tg" : op} }
                lgovFilter.push(t);
            })

            ldepFilter = [];
            dep.split(" ").forEach(function (op){
                t = {"prefix" : { "terms.g.tg" : op} }
                ldepFilter.push(t);
            })

            land = [{"or": lgovFilter}, {"or": ldepFilter}];  
             globalOr.push({"and":land});
        }

        return client.search({
          index: index,
          type: 'reviews',
          size: 0,
          body: {
                "aggs" : {
                    "Features" : {
                        "nested" : {
                            "path" : "terms"
                        },
                        "aggs" : {
                            "t1": {
                                "filter" : { "or": globalOr},
                                "aggs" : {
                                    "Features" : { 
                                        "terms" : {"exclude" : "be .*|.* be|null .*|.* null", "script" : "doc['terms.g.tg'].value < doc['terms.d.tg'].value ? doc['terms.g.lm'].value + ' ' + doc['terms.d.lm'].value : doc['terms.d.lm'].value + ' ' + doc['terms.g.lm'].value", "size" :500} ,
                                        "aggs": {
                                            "ratings": {
                                                "reverse_nested": {}, 
                                                "aggs": {
                                                    "distribution": {
                                                        "terms": {"field": "rating", "order" : { "_term" : "asc" }}
                                                    },
                                                    "stats" : {
                                                        "extended_stats" : {"field": "rating"}
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
             }
        })
    } 
    return self; 
});

//DataProcess--------------------------------------------------------------------------
vizServices.factory('analytics', function() {
    var self = this;
    
    self.getValues = function(func, statsField){
        if(func == 'variance'){
            return statsField[func];
        }
        if(func == 'terms'){
            return statsField["buckets"];
        }
        
        return statsField.value;
    }
    
    
    
    self.preProcess = function(raw, xfunc, yfunc){
        var result = {
            x: raw.aggregations.stats_x,
            y: raw.aggregations.stats_y,
            hits: raw.hits.total,
            buckets:[]
        };
        
        //Handle terms
        if(xfunc == 'terms'){
            raw.aggregations.stats_x.buckets.sort(function(a,b){
                if(a.key > b.key)
                    return 1;
                if(a.key < b.key)
                    return -1;
                return 0;
            })
            console.log(raw.aggregations.stats_x.buckets);
            result.x_termsIndex = [];
            result.x_terms = []; 
            result.x_terms_number = true;
            raw.aggregations.stats_x.buckets.forEach(function (item){
                result.x_terms.push(item);
                result.x_termsIndex.push(item.key);
            });
        }
        
        var results = raw.aggregations.termsList.list.terms.buckets;
        
        results.forEach(function(f){
            obj = {
                key: f.key,
                termFreqeuncy: f.doc_count,
                review_count: f.stats.doc_count,
                x: self.getValues(xfunc, f.stats.stats_x),
                y: self.getValues(yfunc, f.stats.stats_y)
            }
            result.buckets.push(obj);     
        });
        console.log(result);
        return result;
        
    }
    return self;
});














