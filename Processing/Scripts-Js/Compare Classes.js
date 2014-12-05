var numHealth = db.business.aggregate([
    {$match: {CategoryFirst: "Health & Medical"}},
    {$sort: {RealCount: -1} },
    {$limit: 200},
    {$group: { _id: 1, "result" : {  $sum: "$RealCount"}}}
]).result[0].result;

var numAutomotive = db.business.aggregate([
    {$match: {CategoryFirst: "Automotive"}},
    {$sort: {RealCount: -1} },
    {$limit: 200},
    {$group: { _id: 1, "result" : {  $sum: "$RealCount"}}}
]).result[0].result;

var numRestaurants = db.business.aggregate([
    {$match: {CategoryFirst: "Restaurants"}},
    {$sort: {RealCount: -1} },
    {$limit: 200},
    {$group: { _id: 1, "result" : {  $sum: "$RealCount"}}}
]).result[0].result;
    
var garbage = db.procBusiness_Restaurants.aggregate([
    { $unwind: "$features" },
    { $group: { 
        _id: "$features.word", 
        reviews: {$sum: "$features.reviews"}, 
        count: {$sum: "$features.count"}
        }
     },
    {$sort: { "count": -1}},
    {$limit: 2000}, 
    {$out : "temp_featMain" }  
]);

var garbage = db.procBusiness_Health.aggregate([
    { $unwind: "$features" },
    { $group: { 
        _id: "$features.word", 
        reviews: {$sum: "$features.reviews"}, 
        count: {$sum: "$features.count"}
        }
     },
    {$sort: { "count": -1}},
    {$limit: 2000}, 
    {$out : "temp_featC2" }  
])
    
var garbage = db.procBusiness_Automotive.aggregate([
    { $unwind: "$features" },
    { $group: { 
        _id: "$features.word", 
        reviews: {$sum: "$features.reviews"}, 
        count: {$sum: "$features.count"}
        }
     },
    {$sort: { "count": -1}},
    {$limit: 2000}, 
    {$out : "temp_featC3" }  
])
    
    
var rest_map = function() {
  emit(this._id, { Restaurants:  this.reviews/numRestaurants,  Health : 0, Automotive : 0 });
}

var health_map = function() {
  emit(this._id, { Restaurants:  0,  Health : this.reviews/numHealth, Automotive : 0 });
}

var auto_map = function() {
  emit(this._id, { Restaurants:  0,  Health : 0, Automotive : this.reviews/numAutomotive  });
}

var r = function(key, values) {
  var result = {
      "Restaurants" : 0,
      "Health" : 0,
      "Automotive" : 0
    };

    values.forEach(function(value) {
        result.Restaurants += value.Restaurants || 0;
        result.Health += value.Health || 0;
        result.Automotive += value.Automotive || 0; 
    });

    return result;
}

db.temp_ClassJoined.remove();

//db.temp_ClassJoined.mapReduce(rest_map, r, {out: {inline : 1}, scope: { numRestaurants: numRestaurants }});
var res = db.temp_featMain.mapReduce(rest_map, r, {out: {reduce : 'temp_ClassJoined'}, scope: { numRestaurants: numRestaurants }});
var res = db.temp_featC3.mapReduce(auto_map, r, {out: {reduce : 'temp_ClassJoined'}, scope: { numAutomotive: numAutomotive }});
var res = db.temp_featC2.mapReduce(health_map, r, {out: {reduce : 'temp_ClassJoined'}, scope: { numHealth: numHealth }});


var X = 0.025; //0.3
var C = 3;
var df = 2; //2

db.temp_finalterms.remove();
db.temp_ClassJoined.find().forEach(function(term){
      var c = 0;
        term.Restaurants = term.value.Restaurants;
    term.Health = term.value.Health;
    term.Automotive = term.value.Automotive;
    
      if(term.Restaurants >= X)
          c++;
      if(term.Health >= X)
          c++;
      if(term.Automotive >= X)
          c++;
      
      var icf = C/c;
      term.icf = icf;
      term.R_tficf = term.Restaurants*icf;
      term.A_tficf = term.Automotive*icf;
      term.H_tficf = term.Health*icf;
      
      term.isR = (term.R_tficf > df*term.A_tficf && term.R_tficf > df*term.H_tficf) ? 1 : 0;
      term.isA = (term.A_tficf > df*term.R_tficf && term.A_tficf > df*term.H_tficf) ? 1 : 0;
      term.isH = (term.H_tficf > df*term.A_tficf && term.H_tficf > df*term.R_tficf) ? 1 : 0;
      if(icf < 100 && term.isR ==1)
        db.FeatureList.insert(term);
});
