var X = 0.02; //0.3
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
        print(term._id);
});
