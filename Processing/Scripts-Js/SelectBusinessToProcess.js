db.business.aggregate([
    {$match: {CategoryFirst: "Restaurants", RealCount: {$gte: 300}, city: "Las Vegas"}},
    {$unwind: "$reviews"},
    {$sort: {business_id: 1, "reviews.useful": -1, "reviews.date":-1}},
    {$group: {
        _id: "business_id", 
        name: { $first: "$name"},
        stars: { $first: "$stars"},
        RealCount: { $first: "$RealCount"},
        count: {$sum: 1},
        reviews: { $push: "$reviews"}
    }},
    {$out: "businessToProcess"}    
], {allowDiskUse:true})