var globalDistribution = db.baseToFeatures.aggregate([
    {$group: { 
        _id: null, 
        frequency: {$sum: 1},
        star1: { $sum: { $cond: { if: { $eq:["$stars", 1 ]}, then: 1, else: 0 }}},
        star2: { $sum: { $cond: { if: { $eq:["$stars", 2 ]}, then: 1, else: 0 }}},
        star3: { $sum: { $cond: { if: { $eq:["$stars", 3 ]}, then: 1, else: 0 }}},
        star4: { $sum: { $cond: { if: { $eq:["$stars", 4 ]}, then: 1, else: 0 }}},
        star5: { $sum: { $cond: { if: { $eq:["$stars", 5 ]}, then: 1, else: 0 }}}
    }}
]).result[0]

db.baseToFeatures.aggregate([
    {$limit: 100},
    {$unwind: "$features"},
    {$unwind: "$features.qualifiers"},
    {$group: { 
        _id: { feature: "$features.feature.lemma", qualifier: "$features.qualifiers.word" //change to lemma later
        frequency: {$sum: 1},
        star1: { $sum: { $cond: { if: { $eq:["$stars", 1 ]}, then: 1, else: 0 }}},
        star2: { $sum: { $cond: { if: { $eq:["$stars", 2 ]}, then: 1, else: 0 }}},
        star3: { $sum: { $cond: { if: { $eq:["$stars", 3 ]}, then: 1, else: 0 }}},
        star4: { $sum: { $cond: { if: { $eq:["$stars", 4 ]}, then: 1, else: 0 }}},
        star5: { $sum: { $cond: { if: { $eq:["$stars", 5 ]}, then: 1, else: 0 }}},
        qualifiers: { $push: "$features.qualifiers" }
    }},
    {$sort: {frequency: -1}}
]).result[0]