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

function loadDatabase(database){
     d3.json(database, function(error, d) {
         parseData(d);
         //var list = new List("#featureList", data, "_id"); 
         var scatter1 = new Scatter("#mainScatter", data, "avg", "varianceW", "count", {}, "_id");
         var scatter2 = new Scatter("#childScatter", null, "avg", "varianceW", "count", {}, "_id");
         var scatter3 = new Scatter("#ModScatter", null, "avg", "varianceW", "count", {}, "_id");
         
         scatter1.hover = function(element, data){
             scatter2.draw(data.qualifiers)
            // list.highlight(data);
         }
         scatter1.out = function(element, data){
             console.log("out");
             scatter2.draw(data.qualifiers)
           //  list.highlight(data);
         }
         
         list.hover = function(element, data){
             scatter2.draw(data.qualifiers)
             scatter1.highlight(data);
         }
         
         list.out = function(element, data){
             console.log(data);
             scatter2.draw(data.qualifiers)
             scatter1.highlight(data);
         }
         
         scatter1.onSelected = function(element, data){
            // list.select(data);
         }
         
         scatter2.hover = function(element, data){
             scatter3.draw(data.modifiers)
         }
         
         loadreviews();
         
    });
}
function loadreviews(features){
    d3.json("http://localhost:8123/api/GetReviews/?f=" + selectedFeature.feature + "&q=" + selectedFeature.qualifier + ( selectedFeature.modifier ? "&m=" + selectedFeature.modifier: ""), function(error, d){
        plotReviews(d);
    })
}
function plotReviews(reviews){
    reviewlist = new ReviewsList("#listReviews", reviews);
}


function ReviewsList(id, data) {
    var self = this;
    self.create = function(){
        var element = d3.select(id);
        element.selectAll().remove();
        var ul = element.append("ul");
        ul.selectAll("li")
            .data(data)
            .enter()
            .append("li")
            .html(function(d){return '@' + d.business + " - " + self.snnipet(d, selectedFeature)})
    }
    
    self.snnipet = function(d, s){
        var result = "";
        var fs = {};
        var qs = {};
        
        for(i=0; i< d.features.length; i++)
        {
            var f = d.features[i]
            
            
            if(f.qualifiers.length == 0)
                continue;
            if(f.feature.lemma == s.feature){
                
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
        
        
        
        //var feature = '<span class="feature">' + d.text.substring(fs.start, fs.end); +'</span>'
        
        //console.log(fs);
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
    
    self.create();
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

function List(id, data, field, params) {
    var self = this;
    self.create = function(){
        var element = d3.select(id);
        element.selectAll().remove();
        var ul = element.append("ul");
        ul.selectAll("li")
            .data(data)
            .enter()
            .append("li")
            .text(function(d){return d[field]})
        .on("mouseover", function(d) {
            if(self.selected._id)
                return;
            self.highlight(d);
            if(self.hover)
                self.hover(this,d);
        })
        .on("mouseout", function(d) {
            if(self.selected._id)
                return;
            self.highlight({_id:""});
            if(self.out)
                self.out(this,{_id:""});
        })
    }
    
    self.selected = {};
    self.select = function(item){
        self.selected = item;
        self.highlight(d);
    }
    self.highlight = function(item){
        d3.selectAll("li")
            .attr("class", function(d) {return d._id == item._id ? "selected" : ""})     
    }
    
    self.create();
}

function Scatter(id, data, xField, yField, sField, params, label){
    var self = this;
    self.element = d3.select(id)
    self.isDraw = false;
    self.margin = {top: 20, right: 20, bottom: 30, left: 40};
    self.width =  self.element.style("width").replace('px','');;
    self.innerWidth = self.width - self.margin.left - self.margin.right;
    self.height =  self.element.style("height").replace('px','');;
    self.innerHeight = self.height - self.margin.top - self.margin.bottom;
    
    //X Axis
    self.xValue = function (d) { return d[xField]; }
    self.xScale = d3.scale.linear().range([self.margin.left, self.innerWidth]);
    self.xMap = function(d) { return self.xScale(self.xValue(d));};
    self.xAxis = d3.svg.axis().scale(self.xScale).orient("bottom");
    
    //Y Axis
    self.yValue = function (d) { return d[yField]; }
    self.yScale = d3.scale.linear().range([self.innerHeight, 0]);
    self.yMap = function(d) { return self.yScale(self.yValue(d));};
    self.yAxis = d3.svg.axis().scale(self.yScale).orient("left");
    
    
    //Size
    self.sizeValue = function (d) { return d[sField]; }
    self.sizeScale = d3.scale.log().range([2, 10]);
    self.sizeMap = function(d) { return self.sizeScale(self.sizeValue(d));};
    

    // setup fill color
    self.color = d3.scale.category10();
    
    self.selected = {};
    self.select = function(item){
        self.selected = item;
        var t = self.svg.transition().duration(500);
        t.selectAll(".dot")
            .style("fill", function(d) { return d._id == item._id ? cSelected : cNoMapping})
    }
   
    self.highlight = function(item){
        var t = self.svg.transition().duration(1);
            t.selectAll(".dot")
            .style("fill", function(d) { return d._id == item._id ? cSelected : cNoMapping}) ;  
    }
    
    self.create = function(){
        self.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        
        self.svg = d3.select(id).append("svg")
            .attr("width", self.width)
            .attr("height", self.height)
         
        self.svg.append("g")
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");
        if(data)
            self.draw(data);
    }
    
    self.draw = function(data){
        if(!data){
            self.element.style("display", "none");
            return;
        } else {
            self.element.style("display", "block");
        }
        
        
        calc(data);
        self.xScale.domain([d3.min(data, self.xValue) - d3.min(data, self.xValue)/50 , d3.max(data, self.xValue) + d3.max(data, self.xValue)/50]);
        self.yScale.domain([d3.min(data, self.yValue) - d3.min(data, self.yValue)/50, d3.max(data, self.yValue) + d3.max(data, self.yValue)/50]);
        self.sizeScale.domain([d3.min(data,self.sizeValue), d3.max(data,self.sizeValue)])
       
        var dots = self.svg.selectAll(".dot").data(data);
        if(self.isDraw){
            self.redraw(data);
            return;
        }
        
        // x-axis
        self.svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + self.innerHeight + ")")
          .call(self.xAxis)
        .append("text")
          .attr("class", "label")
          .attr("x", self.innerWidth)
          .attr("y", 27)
          .style("text-anchor", "end")
          .text("Stars");

        // y-axis
        self.svg.append("g")
            .attr("transform", "translate(" + self.margin.left + ",0)")
          .attr("class", "y axis")
          .call(self.yAxis)
        .append("text")
          .attr("class", "label")
          .attr("transform", "rotate(-90)")
          .attr("y", 16)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("Variable");
        
        
        dots.enter().append("circle")
            .attr("class", "dot")
            .attr("r", self.sizeMap)
            .attr("cx", self.xMap)
            .attr("cy", self.yMap)
            .style("fill", function(d) { return cNoMapping}) 
            .on("mouseover", function(d) {
                if(self.selected._id)
                    return;
            
                d3.select(this).style("fill", function(d) { return chover}) 
                    self.tooltip.transition()
                           .duration(200)
                           .style("opacity", .9);
                    self.tooltip.html(d[label] + ":"+ d.count)
                           .style("left", (d3.event.pageX + 5) + "px")
                           .style("top", (d3.event.pageY - 28) + "px");
                    if(self.hover)
                        self.hover(this,d);
              })
            .on("mouseout", function(d) {
                d3.select(this).style("fill", function(d) { return d._id == self.selected._id ? cSelected  : cNoMapping}) ;
                if(!self.selected._id)
                    self.tooltip.transition()
                           .duration(500)
                           .style("opacity", 0);
                if(self.out)
                    self.out(this,{_id:""});
            })
            .on("click", function(d) {
                if(self.selected._id == d._id){
                    self.selected = {};
                }
                else
                    self.select(d);
                
                if(self.onSelected)
                    self.onSelected(this, d);
            })
        dots.exit().remove();
        self.isDraw = true;

    }
    
    self.redraw = function(){
         var t = self.svg.transition().duration(500);
            t.selectAll(".dot")
                .attr("cy", self.yMap)
                .attr("cx", self.xMap)
                .attr("r", self.sizeMap)
                
            
            t.selectAll(".y").call(self.yAxis) 
            t.selectAll(".x").call(self.xAxis) 
           
    }
    
    self.create();
    
            

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

































