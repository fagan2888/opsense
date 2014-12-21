db.MiniBusinessTop50.aggregate([
    { $unwind: "$reviews"},
    { $project: {_id : "$reviews._id", tuples: "$reviews.tuples", votes: "$reviews.votes", stars: "$reviews.stars"}},
    { $out: "reviews_Top50Search"}
])
db.reviews_Top50Search.ensureIndex({ "tuples.feature": 1, "tuples.qualifier": 1, "tuples.modifier": 1})


