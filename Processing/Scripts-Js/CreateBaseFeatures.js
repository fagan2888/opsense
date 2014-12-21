//3719
db.baseToFeatures.remove();
db.selectedReviewsByBusiness.find({review_count: {$gte: 50}}, {reviews: {$slice: 50}}).forEach(function (item){
    item.reviews.forEach(function(review){
        review.business = item;
        delete review.business.reviews;
        db.baseToFeatures.insert(review)
    });
    //
})