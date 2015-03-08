var vizServices = angular.module('vizServices', ['elasticsearch']);

vizServices.service('client', function (esFactory) {
    return esFactory({
        host: 'localhost:9200',
        apiVersion: '1.4'
    });
});

//Database   --------------------------------------------------------------------------
vizServices.factory('db', function(client) {
        var self = this;
        var client = client;
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

    self.preProcess = function(raw){
        var results = raw.aggregations.Features.t1.Features.buckets;
        var result = [];
        results.forEach(function(f){
                obj = {
                    key: f.key,
                    count: f.doc_count,
                    rating: f.ratings.distribution.buckets,
                    min : f.ratings.stats.min,
                    max : f.ratings.stats.max,
                    sum : f.ratings.stats.sum,
                    sum_of_squares : f.ratings.stats.sum_of_squares,
                    variance : f.ratings.stats.variance,
                    std_deviation : f.ratings.stats.std_deviation,
                    avg : f.ratings.stats.avg,
                    std_deviation_bounds_upper : f.ratings.stats.std_deviation_bounds.upper,
                    std_deviation_bounds_lower : f.ratings.stats.std_deviation_bounds.lower,
                }
                
                result.push(obj);     
            });
            return result;
        }
    return self;
});