db.selectedReviews.aggregate([
    {$sort: { "votes.useful": 1, "votes.cool":1, "votes.funny":1, "date": -1} }, //Try different sorts later
    {$group: { 
        _id: "$business_id",
        name: {$first: "$business"},
        categories: {$first: "$categories"},
        category: {$first: "$CategoryFirst"},
        subCategory: {$first: "$CategorySecond"},
        city: {$first: "$city"},
        review_count: {$sum:1},
        reviews: { $push: { 
            _id: "$review_id",
            votes: "$votes",
            stars: "$stars",
            date: "$date",
            text: "$text",
            featCount: "$features_count",
            features: "$features"
        }}
    }},
    {$out: "selectedReviewsByBusiness"}
], {allowDiskUse:true})