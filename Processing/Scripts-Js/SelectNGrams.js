//wfofFm3AqtyK_ujNQ893mQ
db.ngrams.aggregate([
    {$project: {reviews: "$reviews"}},
    {$unwind:"$reviews"},
    {$project: {_id:"$reviews.review_id", stars: "$reviews.stars",  bigrams: "$reviews.bigrams"}},
    {$unwind:"$bigrams"},
    {$project: {_id:"$_id", stars: "$stars", ngram: "$bigrams.ngram", size: {$size: "$bigrams.tokens"}}},
    {$match: {size: 2}},
    {$group: {
            _id: "$ngram", 
            count: {$sum:1},
            rating: {$avg: "$stars"}
    }},
    {$sort: { count: -1}},
    {$limit: 500},
    {$out: "temp_bigramsEx"}
], {allowDiskUse:true});