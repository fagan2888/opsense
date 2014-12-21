var data = [];
var totals = {};

var 
    cNoMapping = "#1f77b4",
    chover = "#ff7f0e",
    cSelected = "#ff6c00", 
    cPositive = "#1f77b4", 
    cNegative = "#d7191c", 
    cNeutral = "#ffffbf"

var selectedFeature = {
    feature: "hostess",
    qualifier:"bitchy",
    modifier: null
}

loadDatabase("data1.json");
var scatter1 = {};
var scatter2 = {};
var scatter3 = {};
function loadDatabase(database){
     d3.json(database, function(error, d) {
        parseData(d);
        var reviewList = new ReviewsList("#reviewList");
         
        scatter1 = new Scatter("#mainScatter", data, "avg", "varianceW", "count", "_id");
        scatter1.draw(data);
        scatter1.onSelected = function(d){
            reviewList.loadreviews(d._id);
        }  
        scatter1.onHighlight = function(d){
            scatter2.draw(d.qualifiers);
        }
        scatter1.onClean = function(d){
            scatter2.draw(null);
        }
        
        scatter2 = new Scatter("#qualiScatter", null, "avg", "varianceW", "count", "_id", "small");
        scatter2.onSelected = function(d){
            reviewList.loadreviews(scatter1.selected._id, d._id);
        }  
        scatter2.onHighlight = function(d){
            scatter3.draw(d.modifiers);
        }
        scatter2.onClean = function(d){
            scatter3.draw(null);
        }
        scatter3 = new Scatter("#modiScatter", null, "avg", "varianceW", "count", "_id", "small");
        
         scatter3.onSelected = function(d){
            reviewList.loadreviews(scatter1.selected._id,scatter2.selected._id, d._id);
        }  
        
         
         
         
    });
}

function Scatter(id, data, xField, yField, sField, label, type){
    var self = this;
    self.element = d3.select(id)
    self.isDraw = false;
  
    self.init = function(){
        console.log("init");

        //Init List---------------------------------------------------------------------------------
        self.list = self.element.append("div").attr("class", "scList");
        self.list.append("h1").text("words");
        self.list.ul = self.list.append("ul");

        //Init Title---------------------------------------------------------------------------------
        self.title = self.element.append("div").attr("class", "scTitle");
            self.title.details = self.title.append("div").attr("class", "titleDetails")
            self.title.details.word = self.title.details.append("span").attr("class", "titleLemma")
            self.title.details.avg = self.title.details.append("span").attr("class", "titleAttr")
            self.title.details.frequency = self.title.details.append("span").attr("class", "titleAttr")
        
        self.title.bar = self.title.append("div").attr("class", "titleBars")
            var b = self.title.bar;
            b.color = d3.scale.linear().range(["#ca0020", "#f4a582", "#f7f7f7", "#92c5de","#0571b0"]).domain([1,2,3,4,5]);
            b.width = b.style("width").replace('px','') *1;
            b.height = b.style("height").replace('px','');
            b.xScale = d3.scale.linear().rangeRound([0, b.width]).domain([0,1]);
            b.svg = b.append("svg")
                .attr("width", b.width)
                .attr("height", b.height)
            

        //Init Scatter---------------------------------------------------------------------------------
        self.scatter = self.element.append("div").attr("class", "scScatter");
            var s = self.scatter;
            if(type && type == "small"){
                s.margin = {top: 10, right: 0, bottom: 30, left: 40};
                s.width =  340;
                s.innerWidth = s.width - s.margin.left - s.margin.right;
                s.height =  210;
                s.innerHeight = s.height - s.margin.top - s.margin.bottom;
            }else {
                s.margin = {top: 20, right: 0, bottom: 30, left: 40};
                s.width =  s.style("width").replace('px','') - self.list.style("width").replace('px','');
                s.innerWidth = s.width - s.margin.left - s.margin.right;
                s.height =  s.style("height").replace('px','');
                s.innerHeight = s.height - s.margin.top - s.margin.bottom;
            }
            
            
            //X Axis
            s.xValue = function (d) { return d[xField]; }
            s.xScale = d3.scale.linear().range([s.margin.left, s.innerWidth]);
            s.xMap = function(d) { return s.xScale(s.xValue(d));};
            s.xAxis = d3.svg.axis().scale(s.xScale).orient("bottom");

            //Y Axis
            s.yValue = function (d) { return d[yField]; }
            s.yScale = d3.scale.linear().range([s.innerHeight+s.margin.top, s.margin.top]);
            s.yMap = function(d) { return s.yScale(s.yValue(d));};
            s.yAxis = d3.svg.axis().scale(s.yScale).orient("left");

            //Size
            s.sizeValue = function (d) { return d[sField]; }
            s.sizeScale = d3.scale.log().range([3, 12]);
            s.sizeMap = function(d) { return s.sizeScale(s.sizeValue(d));};
            //Create svg
            s.svg = s.append("svg")
                .attr("width", s.width)
                .attr("height", s.height)
         
            s.svg.append("g")
                .attr("transform", "translate(" + s.margin.left + "," + s.margin.top + ")");
    }

    self.init();
    
   //Interaction-------------------------------------------
   self.highlight = function(d){
        self.title.details.word.text(d._id);
        self.title.details.avg.text("avg: " + d.Wavg.toFixed(2) + " / "+ d.avg.toFixed(2))
        self.title.details.frequency.text("frequency: " + d.count)
        self.scatter.selectAll(".dot").attr("class", function(c){ 
            return (c._id == d._id ? "dot highlighted": "dot") 
                + ((self.selected && c._id == self.selected._id ) ? " selected" : "")
        }) ;
        self.list.selectAll("li").attr("class", function(c){ 
          return (c._id == d._id ? "dot highlighted": "dot") 
                + ((self.selected && c._id == self.selected._id ) ? " selected" : "")
        }) ;
        self.title.bar.style("display","block");
        self.DrawBar(d);
       
       if(self.onHighlight)
                self.onHighlight(d);
    }
    
    self.clean = function(d, clSelected){
        self.title.details.word.text("");
        self.title.details.avg.text("");
        self.title.details.frequency.text("");
        self.scatter.selectAll(".dot").attr("class", "dot") ;
        self.list.selectAll("li").attr("class", "") ;
        self.title.bar.style("display","none");
        
         if(self.onClean)
                self.onClean(d);
        
        if(!clSelected && self.selected)
            self.highlight(self.selected);
    }
    
    self.select = function(d){
        if(self.selected && self.selected._id == d._id){
            self.selected = undefined;
            self.highlight(d);
            if(self.onSelected)
                self.onSelected({});
        }
        else {
            self.selected = d;
            self.highlight(d);
            if(self.onSelected)
                self.onSelected(d);
        }
    }
    
    self.remove = function(d){
        for(i =0; i < self.data.length; i++){
            if(self.data[i]._id == d._id){
                break;
            }
        }
               
       if (i > -1) {
            self.data.splice(i, 1);
        }
        self.reDraw(self.data);
    }
    
    
    
    
    //Draw -------------------------------------------
    self.draw = function(data){
        self.data = data;
        
        if(!data){
            self.element.style("display", "none");
            return;
        } else {
            self.element.style("display", "inline-block");
        }
        if(self.isDraw)
            self.reDraw(data);
        //Draw List
        var l =  self.list.ul.selectAll("li").data(data);
        l.enter()
            .append("li")
            .text(function(d){return d[label]})
            .on("mouseover", function(d) {
                self.highlight(d);
            })
            .on("mouseout", function(d) {
                self.clean(d);
            }).on("click", function(d) {
                self.select(d);
            })
            .on("contextmenu",function(d){
                d3.event.preventDefault();
                d3.event.stopPropagation();
                self.remove(d);
            });
        
        l.exit().remove();
        //Draw Scatter
        self.DrawScatter(data);
        self.isDraw = true;
    }
    
    self.reDraw = function(data){
        self.data = data;
            
        if(!data){
            self.element.style("display", "none");
            return;
        } else {
            self.element.style("display", "inline-block");
        }
        //Draw List
        self.list.ul.selectAll("li").remove();
        var l =  self.list.ul.selectAll("li").data(data);
        l.enter()
            .append("li")
            .text(function(d){return d[label]})
            .on("mouseover", function(d) {
                self.highlight(d);
            })
            .on("mouseout", function(d) {
                self.clean(d);
            }).on("click", function(d) {
                self.select(d);
            })
            .on("contextmenu",function(d){
                d3.event.preventDefault();
                d3.event.stopPropagation();
                self.remove(d);
            });
        
        l.exit().remove();
        
        //Draw Scatter
        self.DrawScatter(data);
    }
    
    self.DrawBar = function(data){
        var b = self.title.bar;
        
        var stars = [data.isW1, data.isW2, data.isW3, data.isW4, data.isW5];
        var x0 = 0;
        stars = stars.map(function(value) { 
            return {v: value ,x0: x0, x1: x0 += b.xScale(value)}; 
        });
        
        if(b.isDraw){
            self.ReDrawBar(stars);
        }
        
        b.svg.selectAll("rect")
              .data(stars)
            .enter().append("rect")
                .attr("class", "avgBar")
                .attr("width", function(d,i){return d.x1 - d.x0} )
                .attr("x", function(d,i){return d.x0})
                .attr("height", b.height)
                .style("fill", function(d,i) { return b.color(i+1); })
                .append("title").text(function(d,i){return (d.v*100).toFixed(1) + "%"})
        
        b.isDraw = true;
    }
    self.ReDrawBar = function(stars){
       self.title.bar.svg.selectAll("rect").data(stars)
       var t = self.title.bar.svg.transition().duration(500);
       t.selectAll("rect")
            
            .attr("x", function(d,i){return d.x0})
            .attr("width", function(d,i){return d.x1 - d.x0} )
    }
    
    
    /*Scatter ----------------------------*/
    self.DrawScatter = function(data){
        var s = self.scatter;
        
        calc(data);
        s.xScale.domain([d3.min(data, s.xValue) - d3.min(data, s.xValue)/100 , d3.max(data, s.xValue) + d3.max(data, s.xValue)/100]);
        s.yScale.domain([d3.min(data, s.yValue) - d3.min(data, s.yValue)/100, d3.max(data, s.yValue) + d3.max(data, s.yValue)/100]);
        s.sizeScale.domain([d3.min(data,s.sizeValue), d3.max(data,s.sizeValue)])
        
        if(s.isDraw){
            self.ReDrawScatter(data);
            return;
        }
        s.svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + (s.innerHeight+ s.margin.top) + ")")
          .call(s.xAxis)
        .append("text")
          .attr("class", "label")
          .attr("x", s.innerWidth+ 7)
          .attr("y", 23)
          .style("text-anchor", "end")
          .text("rating");

        // y-axis
        s.svg.append("g")
            .attr("transform", "translate(" + s.margin.left + "," + 0 + ")")
            .attr("class", "y axis")
            .call(s.yAxis)
        .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("x",-20)
            .attr("y",5)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("variance");
        
        var dots = s.svg.selectAll(".dot").data(data);
        dots.enter().append("circle")
            .attr("class", "dot")
            .attr("r", s.sizeMap)
            .attr("cx", s.xMap)
            .attr("cy", s.yMap)
            .on("mouseover", function(d) {
                self.highlight(d);
            })
            .on("mouseout", function(d) {
                self.clean(d);
            })
            .on("click", function(d) {
                self.select(d);
            })
            .on("contextmenu",function(d){
                d3.event.preventDefault();
                d3.event.stopPropagation();
                self.remove(d);
            });
        dots.exit().remove();
        s.isDraw = true;
            
    }
    
    self.ReDrawScatter = function(data){
        
        var s = self.scatter;
        var dots = s.svg.selectAll(".dot").data(data);
        dots.enter().append("circle")
            .attr("class", "dot")
            .attr("r", s.sizeMap)
            .attr("cx", s.xMap)
            .attr("cy", s.yMap)
            .on("mouseover", function(d) {
                self.highlight(d);
            })
            .on("mouseout", function(d) {
                self.clean(d);
            })
            .on("click", function(d) {
                self.select(d);
            })
            .on("contextmenu",function(d){
                d3.event.preventDefault();
                d3.event.stopPropagation();
                self.remove(d);
            });
        dots.exit().remove();
        var t = s.svg.transition().duration(500);
            t.selectAll(".dot")
                .attr("cy", s.yMap)
                .attr("cx", s.xMap)
                .attr("r", s.sizeMap)
                
            
            t.selectAll(".y").call(s.yAxis) 
            t.selectAll(".x").call(s.xAxis) 
    }
        
    
    
}



//ListReview
function ReviewsList(id) {
    var self = this;
    self.element = d3.select(id);
    self.color = d3.scale.linear().range(["#ca0020", "#f4a582", "#f7f7f7", "#92c5de","#0571b0"]).domain([1,2,3,4,5]);
    self.loadreviews = function(f,q,m){
        if(self.ul)
            self.ul.selectAll("li").remove();
        
        if(!f && self.ul){
           self.ul.selectAll("li").remove();
            return;
        }
            
        
       d3.json("http://localhost:8123/api/GetReviews/?f=" + f + ( q ? "&q=" + q: "")  + ( m ? "&m=" + m: ""), function(error, d){
            self.draw(d);
        })
       self.key = { feature: f, qualifier: q, m: m};
    }
    
    
    self.draw = function(data){
        if(self.isDraw){
            self.reDraw(data);
            return;
        }
        
        self.ul = self.element.append("ul");
        var el =  self.ul.selectAll("li").data(data);
        el.enter()
            .append("li")
            .style("border-left", function(d) {return "solid 5px " + self.color(d.stars) })
            .html(function(d){return '<span class="business">@' + d.business + "</span> - " + self.snnipet(d, self.key)})
        el.exit().remove();
        
        self.isDraw = true;
    }
    
    self.clean = function(){
        if(self.ul)
            self.ul.selectAll("li").remove();
    }
    
    self.reDraw = function(data){
        self.ul.selectAll("li").remove();
        
        var el =  self.ul.selectAll("li").data(data);
        el.enter()
            .append("li")
            .style("border-left", function(d) {return "solid 5px " + self.color(d.stars) })
            .html(function(d){return '<span class="business">@' + d.business + "</span> - " + self.snnipet(d, self.key)})
        el.exit().remove();
        
        
    }
    
    self.snnipet = function(d, s){
        var result = "";
        var fs = {};
        var qs = {};
        var fsFull = {};
         for(i=0; i< d.features.length; i++)
        {
            var f = d.features[i]
            
             if(f.qualifiers.length == 0)
                    continue;
            
            if(f.feature.lemma == s.feature){
                if(!s.q){
                    fs = f.feature;
                    for(q =0; q < f.qualifiers.length; q++){
                        if(!qs.dist)
                            qs = f.qualifiers[q];
                        else if (f.qualifiers[q].dist < qs.dist)
                            qs = f.qualifiers[q];
                    }
                    break;
                }
                    
               
                for(k =0; k < f.qualifiers.length; k++)
                {
                    var qc = f.qualifiers[k];

                    if(qc.lemma == s.qualifier)
                    {
                        fs = f.feature;
                        qs = qc;
                        break;
                    }
                }
            }
        }

        var order = [];
        fs.class = "feature";
        qs.class = "qualifier";
        var span = 50;
        if(fs.start < qs.start){
            order[0] = self.getSpanElm(fs);
            order[1] = self.getSpanElm(qs);
        }else{
            order[1] = self.getSpanElm(fs);
            order[0] = self.getSpanElm(qs);
        }
        var result = "...";
        result += d.text.substring(order[0].start, order[0].start-span);
        
        result += order[0].span;
        result += d.text.substring(order[0].end, order[1].start);
        result += order[1].span;
        
        result += d.text.substring(order[1].end, order[1].end+span) + "..."
        

        return result;
    }
    
    self.getSpanElm = function(item){
        if(item.class == "qualifier" && item.modifier)
            return {
                start: item.modifier.start,
                end: item.end,
                span: '<span class="modifier">' + item.modifier.lemma + '</span> ' + ' <span class="' + item.class+'">' + item.lemma + '</span>'
            }
            
        return {
            start: item.start,
            end: item.end,
            span: '<span class="' + item.class+'">' + item.lemma + '</span>'
        }
    }
}


function addFeature(){
    var feature = document.getElementById("txtAddFeature").value;
    if(feature.length > 0)
    {
        d3.json("http://localhost:8123/api/GetFeature?f=" + feature, function(error, d){
            if(d && d != null){
                var exist = false;
                for(i =0; i < data.length; i++)
                {
                    if(data[i]._id == d._id){
                        exist = true;
                        d = data[i];
                        break;
                    }
                        
                }
                if(!exist)
                    data.push(d);

                scatter1.draw(data);
                scatter1.select(d);
            }else {
                alert('Not Found!');
            }
            console.log(d);
            //self.draw(d);
        })
    }
   
}


//---------------------------------------------------------------------------------------------------------------------------------
function variance(arr)
{
    var len = 0;
    var sum=0;
    for(var i=0;i<arr.length;i++)
    {
          if (arr[i] == ""){}
          else if (!isNum(arr[i]))
          {
              alert(arr[i] + " is not number, Variance Calculation failed!");
              return 0;
          }
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

//Check whether is a number or not
function isNum(args)
{
    args = args.toString();

    if (args.length == 0) return false;

    for (var i = 0;  i<args.length;  i++)
    {
        if ((args.substring(i,i+1) < "0" || args.substring(i, i+1) > "9") && args.substring(i, i+1) != "."&& args.substring(i, i+1) != "-")
        {
            return false;
        }
    }

    return true;
}

//calculate the mean of a number array
function mean(arr)
{
    var len = 0;
    var sum = 0;
    
    for(var i=0;i<arr.length;i++)
    {
          if (arr[i] == ""){}
          else if (!isNum(arr[i]))
          {
              alert(arr[i] + " is not number!");
              return;
          }
          else
          {
             len = len + 1;
             sum = sum + parseFloat(arr[i]); 
          }
    }

    return sum / len;    
}

//Data Manipulation --------------------------------------------------------------------------------------------    
function parseData(d){
    data = d.data;
    totals = d.totals;
    
    totals.is1P = totals.is1/totals.count;
    totals.is2P = totals.is2/totals.count;
    totals.is3P = totals.is3/totals.count;
    totals.is4P = totals.is4/totals.count;
    totals.is5P = totals.is5/totals.count;
    
    totals.Maxstars = d3.max([totals.is1,totals.is2,totals.is3,totals.is4, totals.is5])
    
    totals.is1W = totals.Maxstars/totals.is1; 
    totals.is2W = totals.Maxstars/totals.is2; 
    totals.is3W = totals.Maxstars/totals.is3; 
    totals.is4W = totals.Maxstars/totals.is4; 
    totals.is5W = totals.Maxstars/totals.is5; 
    
    calc(data);
}
function calc(data)
{
    if(!data)
        return;
     data.forEach(function(feature){
        feature.isH1 = feature.is1/feature.count;
        feature.isH2 = feature.is2/feature.count; 
        feature.isH3 = feature.is3/feature.count; 
        feature.isH4 = feature.is4/feature.count; 
        feature.isH5 = feature.is5/feature.count; 
        feature.varianceH = variance([ feature.isH1,  feature.isH2,  feature.isH3,  feature.isH4,  feature.isH5])
        
        feature.isV1 = feature.is1/totals.is1;
        feature.isV2 = feature.is2/totals.is2; 
        feature.isV3 = feature.is3/totals.is3; 
        feature.isV4 = feature.is4/totals.is4; 
        feature.isV5 = feature.is5/totals.is5; 
        
        feature.Wtotal = 
            feature.is1*totals.is1W + 
            feature.is2*totals.is2W + 
            feature.is3*totals.is3W + 
            feature.is4*totals.is4W + 
            feature.is4*totals.is5W 
        
        feature.isW1 = feature.is1*totals.is1W/feature.Wtotal;
        feature.isW2 = feature.is2*totals.is2W/feature.Wtotal;
        feature.isW3 = feature.is3*totals.is3W/feature.Wtotal;
        feature.isW4 = feature.is4*totals.is4W/feature.Wtotal;
        feature.isW5 = feature.is5*totals.is5W/feature.Wtotal;
        feature.varianceW = variance([ feature.isW1,  feature.isW2,  feature.isW3,  feature.isW4,  feature.isW5])
        
        feature.Wavg = 
            (feature.is1*totals.is1W*1 +
            feature.is2*totals.is2W*2 +
            feature.is3*totals.is3W*3 +
            feature.is4*totals.is4W*4 +
            feature.is5*totals.is5W*5) / feature.Wtotal;
        
    })

}































