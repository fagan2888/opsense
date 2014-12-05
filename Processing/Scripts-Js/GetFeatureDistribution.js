db.pairCollection.aggregate([
    {$group: {
       _id: { noun : "$noun", review_id: "$review_id" } , 
       rating: { $avg: "$rating" },
       qualifiers : { $addToSet:  { adj:"$adjetive", rating:"$rating" } }
    }},
    {$group: {
       _id: "$_id.noun" , 
       Frequency: { $sum: 1 },
       rating: { $avg: "$rating" },
       is1 : { $sum: { $cond: { if: { $eq:["$rating", 1 ]}, then: 1, else: 0 }}},
       is2 : { $sum: { $cond: { if: { $eq:["$rating", 2 ]}, then: 1, else: 0 }}},
       is3 : { $sum: { $cond: { if: { $eq:["$rating", 3 ]}, then: 1, else: 0 }}},
       is4 : { $sum: { $cond: { if: { $eq:["$rating", 4 ]}, then: 1, else: 0 }}},
       is5 : { $sum: { $cond: { if: { $eq:["$rating", 5 ]}, then: 1, else: 0 }}},
       qualifiers : { $push:  "$qualifiers" } 
    }},
    {$unwind: "$qualifiers"},
    {$unwind: "$qualifiers"},
    {$group: {
       _id: { feature: "$_id", qualifier: "$qualifiers.adj" },
       frequency: { $first: "$Frequency" },
       rating: { $first: "$rating" },
       is1: { $first: "$is1" },
       is2: { $first: "$is2" },
       is3: { $first: "$is3" },
       is4: { $first: "$is4" },
       is5: { $first: "$is5" },
       q_frequency: { $sum: 1 },
       q_rating: { $avg: "$qualifiers.rating" },
       q_is1 : { $sum: { $cond: { if: { $eq:["$qualifiers.rating", 1 ]}, then: 1, else: 0 }}},
       q_is2 : { $sum: { $cond: { if: { $eq:["$qualifiers.rating", 2 ]}, then: 1, else: 0 }}},
       q_is3 : { $sum: { $cond: { if: { $eq:["$qualifiers.rating", 3 ]}, then: 1, else: 0 }}},
       q_is4 : { $sum: { $cond: { if: { $eq:["$qualifiers.rating", 4 ]}, then: 1, else: 0 }}},
       q_is5 : { $sum: { $cond: { if: { $eq:["$qualifiers.rating", 5 ]}, then: 1, else: 0 }}}
    }},
    {$group: {
       _id: "$_id.feature",
       frequency: { $first: "$frequency" },
       rating: { $first: "$rating" },
       is1: { $first: "$is1" },
       is2: { $first: "$is2" },
       is3: { $first: "$is3" },
       is4: { $first: "$is4" },
       is5: { $first: "$is5" },
       qualifiers: { $push: {
           qualifier : "$_id.qualifier",
           frequency: "$q_frequency",
           relFrequency: { $divide: [ "$q_frequency", "$frequency" ] },
           rating:  "$q_rating",
           is1 : "$q_is1",
           is2 : "$q_is2",
           is3 : "$q_is3",
           is4 : "$q_is4",
           is5 : "$q_is5"
       }}
    }},
     { $out : "FeturesQualifiers" }
], {allowDiskUse:true});