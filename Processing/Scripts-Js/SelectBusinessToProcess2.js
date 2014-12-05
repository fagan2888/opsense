db.business.find({CategoryFirst: "Restaurants", RealCount: {$gte: 300}, city: "Las Vegas"}).forEach(function (item){
    item.reviews.sort(function(a, b) {
        if (a.date > b.date) {
            return -1;
        }
        if (a.date < b.date) {
            return 1;
        }
        
            return 0;
    });
    
    item.reviews.splice(300);
    db.businessToProcess.insert(item);
});