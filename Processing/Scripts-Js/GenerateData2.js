function variance(arr)
{
    var len = 0;
    var sum=0;
    for(var i=0;i<arr.length;i++)
    {
          if (arr[i] == ""){}
     
          else
          {
             len = len + 1;
             sum = sum + parseFloat(arr[i]); 
          }
    }

    var v = 0;
    if (len > 1)
    {
        var mean = sum / len;
        for(var i=0;i<arr.length;i++)
        {
              if (arr[i] == ""){}
              else
              {
                  v = v + (arr[i] - mean) * (arr[i] - mean);              
              }        
        }
        
        return v / (len-1);
    }
    else
    {
         return 0;
    }    
}

var totals = db.business.aggregate([
    {$match: {"CategoryFirst": "Restaurants"}},
    {$sort: {"RealCount": -1}},
    {$limit: 200},
    {$unwind: "$reviews"},
    {$group: { 
        _id: "Total", 
        count: { $sum: 1 },
        is1: { $sum: { $cond: { if: { $eq:["$reviews.stars", 1 ]}, then: 1, else: 0 }}},
        is2: { $sum: { $cond: { if: { $eq:["$reviews.stars", 2 ]}, then: 1, else: 0 }}},
        is3: { $sum: { $cond: { if: { $eq:["$reviews.stars", 3 ]}, then: 1, else: 0 }}},
        is4: { $sum: { $cond: { if: { $eq:["$reviews.stars", 4 ]}, then: 1, else: 0 }}},
        is5: { $sum: { $cond: { if: { $eq:["$reviews.stars", 5 ]}, then: 1, else: 0 }}}
    }},
    {$project: {_id: 0, is1: "$is1",is2: "$is2",is3: "$is3",is4: "$is4",is5: "$is5"}}
]).result[0];

    
(function g() {  
    result.Total = totals;
    result.Itens = [];
    var max = 0;
    max = max < totals.is1 ? totals.is1 : max;
    max = max < totals.is2 ? totals.is2 : max;
    max = max < totals.is3 ? totals.is3 : max;
    max = max < totals.is4 ? totals.is4 : max;
    max = max < totals.is5 ? totals.is5 : max;
    totals.max = max;
  
    totals.w1 = totals.max/totals.is1;
    totals.w2 = totals.max/totals.is2;
    totals.w3 = totals.max/totals.is3;
    totals.w4 = totals.max/totals.is4;
    totals.w5 = totals.max/totals.is5;
})();

db.feturesQualifiers.aggregate([
    {$unwind: "$qualifiers"},
    {$sort : { _id : 1, "qualifiers.frequency": -1 }},
    {$group: { 
        _id : "$_id",
        frequency: {$first: "$frequency"},
        rating: {$first: "$rating"},
        is1: {$first: "$is1"},
        is2: {$first: "$is2"},
        is3: {$first: "$is3"},
        is4: {$first: "$is4"},
        is5: {$first: "$is5"},
        qualifiers: {$push: "$qualifiers"},
    }}
]).result.forEach(function(item){
    item.h1 = item.is1/item.frequency;
    item.h2 = item.is2/item.frequency;
    item.h3 = item.is3/item.frequency;
    item.h4 = item.is4/item.frequency;
    item.h5 = item.is5/item.frequency;
    
    item.v1 = item.is1/totals.is1;
    item.v2 = item.is2/totals.is2;
    item.v3 = item.is3/totals.is3;
    item.v4 = item.is4/totals.is4;
    item.v5 = item.is5/totals.is5;
    
    item.f1 = item.is1*totals.w1;
    item.f2 = item.is2*totals.w2;
    item.f3 = item.is3*totals.w3;
    item.f4 = item.is4*totals.w4;
    item.f5 = item.is5*totals.w5;
    
    var ftot = item.f1 + item.f2 + item.f3 + item.f4 + item.f5;
    item.f1 = item.f1/ftot;
    item.f2 = item.f2/ftot;
    item.f3 = item.f3/ftot;
    item.f4 = item.f4/ftot;
    item.f5 = item.f5/ftot;
    
    item.fv = variance([item.f1,item.f2,item.f3,item.f4,item.f5]);
    item.hv = variance([item.h1,item.h2,item.h3,item.h4,item.h5]);
    item.vv = variance([item.v1,item.v2,item.v3,item.v4,item.v5]);
   
    
    item.qualifiers.splice(10);
    //delete item.qualifiers;
    result.Itens.push(item);
});
print(result);