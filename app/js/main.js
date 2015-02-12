var data = [];
var totals = {};
var countLimit = 5;
var showMaster = true;
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
var pGlobal = new Loader("#mLoading");
pGlobal.show();
var pReview = new Loader("#rLoading");

loadDatabase("Discriminative");
var scatter1 = {};
var scatter2 = {};
var scatter3 = {};
var reviewList = {};


function setFreqLimit(){
    reload();
}

function Loader(element){
    var self = this;
    self.show = function(){
        $(element).show();
    }
    
    self.hide = function(){
        $(element).hide();
        $(element).html("Loading...");
    }
    
    self.update = function(progress){
        $(element).html("Loading...</br>" + (progress*100).toFixed(0) + "%");
    }
}

function reload(db){
    pGlobal.show();
   d3.json('/data/'+ db, function(error, d) {
        parseData(d);
        
        reviewList.clean();
        scatter1.clean(data);
        scatter1.draw(data);
        
        scatter2.draw();
        scatter3.draw();
         pGlobal.hide();
    }).on('progress', function(){
         pGlobal.update(d3.event.loaded/ d3.event.total);
     });
}

function chageDb(a){
    reload(a.value);
}

function CountChange(e){
    countLimit = e.value;
    
    scatter1.draw(data);
    if(scatter1.selected && scatter1.selected._id)
        scatter2.draw(scatter1.selected.qualifiers);
        //scatter2.draw(scatter1.selected.qualifiers);
    if(scatter2.selected && scatter2.selected._id)
        scatter3.draw(scatter2.selected.modifiers);
}

function changeListType(){
    var sel = document.getElementById("slctReview").value;
    
    if(scatter1.selected && scatter1.selected._id)
        var f = scatter1.selected._id;
    if(scatter2.selected && scatter2.selected._id)
        var q = scatter2.selected._id;
    if(scatter3.selected && scatter3.selected._id)
        var m = scatter3.selected._id;
    
    var s = document.getElementById("slctSort").value;
    
    reviewList.loadreviews(undefined, s, f,q,m);
}

function loadReviewsByBusiness(id){
    var sel = document.getElementById("slctReview").value;
    if(sel != "reviews") {
        document.getElementById("slctSort").style.display = "none"; 
        document.getElementById("lblSort").style.display = "none"; 
    } else {
        document.getElementById("slctSort").style.display = "inline"; 
        document.getElementById("lblSort").style.display = "inline"; 
    }
    

    
    if(scatter1.selected && scatter1.selected._id)
        var f = scatter1.selected._id;
    if(scatter2.selected && scatter2.selected._id)
        var q = scatter2.selected._id;
    if(scatter3.selected && scatter3.selected._id)
        var m = scatter3.selected._id;
    
    var s = document.getElementById("slctSort").value;
    
    reviewList.loadreviews(id,s,f,q,m);
}

function loadDatabase(database){
    pGlobal.show();
     d3.json('/data/'+ database, function(error, d) {
        parseData(d);
        
        reviewList = new ReviewsList("#reviewList"); 
        scatter1 = new Scatter("#mainScatter", data, "avg", "varianceW", "count", "_id", null, "feature");
        scatter1.draw(data);
        scatter1.onSelected = function(d){
            var s = document.getElementById("slctSort").value;
            reviewList.loadreviews(undefined, s, d._id);
            scatter2.clean({},true);
        }  
        scatter1.onHighlight = function(d){
            scatter2.draw(d.qualifiers);

        }
        scatter1.onClean = function(d){
            scatter2.draw(null);
        }
        
        scatter2 = new Scatter("#qualiScatter", null, "avg", "varianceW", "count", "_id", "small", "qualifier", scatter1);
         scatter2.draw();
        scatter2.onSelected = function(d){
             var s = document.getElementById("slctSort").value;
            reviewList.loadreviews(undefined,s,scatter1.selected._id, d._id);
            scatter3.clean();
        }  
        scatter2.onHighlight = function(d){
            scatter3.draw(d.modifiers);
        }
        scatter2.onClean = function(d){
            scatter3.draw(null);
        }
        scatter3 = new Scatter("#modiScatter", null, "avg", "varianceW", "count", "_id", "small", "modifier", scatter2);
        scatter3.draw();
         scatter3.onSelected = function(d){
            var s = document.getElementById("slctSort").value;
            reviewList.loadreviews(undefined,s, scatter1.selected._id,scatter2.selected._id, d._id);
        }  
         pGlobal.hide();
    }).on('progress', function(){
         pGlobal.update(d3.event.loaded/ d3.event.total);
     });
}

function Scatter(id, data, xField, yField, sField, label, type, part, master){
    var self = this;
    self.element = d3.select(id)
    self.isDraw = false;
  
    self.init = function(){
        console.log("init");
        self.part = part;
        self.type = type;
        self.master = master;

        //Init List---------------------------------------------------------------------------------
        self.list = self.element.append("div").attr("class", "scList");
        
        self.list.append("h1").text(part);
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
            s.xGrid = d3.svg.axis().scale(s.xScale).orient("bottom");
           
            //Y Axis
            s.yValue = function (d) { return d[yField]; }
            s.yScale = d3.scale.linear().range([s.innerHeight+s.margin.top, s.margin.top]);
            s.yMap = function(d) { return s.yScale(s.yValue(d));};
            s.yAxis = d3.svg.axis().scale(s.yScale).orient("left");
            s.yGrid = d3.svg.axis().scale(s.yScale).orient("left");
            //Size
            s.sizeValue = function (d) { return d[sField]; }
            s.sizeScale = d3.scale.log().range([3, 12]);
            s.sizeMap = function(d) {  if(d.count < countLimit && self.type != "small") return 0; else return s.sizeScale(s.sizeValue(d));};
            s.sizeMapNoCount = function(d) { return s.sizeScale(s.sizeValue(d));};
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
        if(self.type == "small"){
            self.title.details.word.text(d._id + " ("+ d.count +")");
            self.title.details.avg.text("")
            self.title.details.frequency.text("")
        }
        else {
            self.title.details.word.text(d._id);
            self.title.details.avg.text("avg: " + d.avg.toFixed(2))
            self.title.details.frequency.text("frequency: " + d.count)
        }
       
        self.scatter.selectAll(".dot").attr("class", function(c){ 
            return (c._id == d._id ? "dot highlighted": (c.isMaster ? "dot master" : "dot")) 
                + ((self.selected && c._id == self.selected._id ) ? " selected" : "")
        }) ;
        self.list.selectAll("li").attr("class", function(c){ 
          return (c._id == d._id ? "dot highlighted": (c.isMaster ? "dot master" : "dot")) 
                + ((self.selected && c._id == self.selected._id ) ? " selected" : "")
        }) ;
        self.title.bar.style("display","block");
        self.DrawBar(d);
       self.highlighted = d;
       if(self.onHighlight)
                self.onHighlight(d);
    }
   
    self.colorFix = function(d){
        self.scatter.selectAll(".dot").attr("class", function(c){ 
            return (c._id == d._id ? "dot highlighted": (c.isMaster ? "dot master" : "dot")) 
                + ((self.selected && c._id == self.selected._id ) ? " selected" : "")
        }) ;
        self.list.selectAll("li").attr("class", function(c){ 
          return (c._id == d._id ? "dot highlighted": (c.isMaster ? "dot master" : "dot")) 
                + ((self.selected && c._id == self.selected._id ) ? " selected" : "")
        }) ;
    }
    
   
    
    self.clean = function(d, clSelected){
        self.title.details.word.text("");
        self.title.details.avg.text("");
        self.title.details.frequency.text("");
        self.scatter.selectAll(".dot").attr("class", function(c) { return c.isMaster ? "dot master" : "dot"}) ;
        self.list.selectAll("li").attr("class", function(c) { return c.isMaster ? "dot master" : "dot"}) ;
        self.title.bar.style("display","none");
        
         if(self.onClean)
                self.onClean(d);
        
        //self.selected = {};
        
        if(!clSelected && self.selected)
            self.highlight(self.selected);
        else {
            self.selected = undefined;
        }
    }
    
    self.select = function(d){
        if(self.selected && self.selected._id == d._id){
            self.selected = undefined;
            self.colorFix(d);
            if(self.onSelected)
                self.onSelected({});
        }
        else {
            self.selected = d;
            self.colorFix(d);
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
        
        
        if(!data){
            self.element.style("display", "none");
            return;
        } else {
            self.element.style("display", "inline-block");
        }
        //data = data.filter(function(e){ return e.count >= countLimit });
        data.sort(function(a, b) {
            if(a.isMaster){
                return 1;
            }
            if(b.isMaster){
                return -1;
            }
            
          return b.count - a.count;
        });
       
        
        if(showMaster)
            if(self.master) {
            var masterValue = self.master.highlighted || self.master.selected;
                if(masterValue && masterValue._id){
                    var mst = JSON.parse(JSON.stringify(masterValue));
                    mst.isMaster = true;
                    if(data.filter(function(i) { return i[label] == mst[label]}).length == 0)
                        data.push(mst);
                }
            }
        
        self.data = data;
        
        if(self.isDraw){
            self.reDraw(data);
            self.clean();
            return;
        }
        //Draw List
        
        var l =  self.list.ul.selectAll("li").data(data);
        l.enter()
            .append("li")
            .attr("class", function(d) { return d.isMaster ? "dot master" : "dot"})
            .text(function(d){return d[label]})
            .style("display", function(d){ return ((self.type != "small" && d.count < countLimit) || d.isMaster) ? "none": "list-item" })
            .on("mouseover", function(d) {
                if(!d.isMaster && d != self.selected)
                    self.highlight(d);
            })
            .on("mouseout", function(d) {
                if(!d.isMaster && d != self.selected)
                    self.clean(d);
            }).on("click", function(d) {
                if(!d.isMaster)
                    self.select(d);
            })
            .on("contextmenu",function(d){
                d3.event.preventDefault();
                d3.event.stopPropagation();
                if(!d.isMaster)
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
            .attr("class", function(d) { return d.isMaster ? "dot master" : "dot"})
            .text(function(d){return d[label]})
            .style("display", function(d){ return ((self.type != "small" && d.count < countLimit) || d.isMaster) ? "none": "list-item" })
            .on("mouseover", function(d) {
                if(!d.isMaster && d != self.selected)
                    self.highlight(d);
            })
            .on("mouseout", function(d) {
                if(!d.isMaster && d != self.selected)
                    self.clean(d);
            }).on("click", function(d) {
                if(!d.isMaster)
                    self.select(d);
            })
            .on("contextmenu",function(d){
                d3.event.preventDefault();
                d3.event.stopPropagation();
                if(!d.isMaster)
                    self.remove(d);
            });
        
        l.exit().remove();
        
        //Draw Scatter
        self.DrawScatter(data);
        
    }
    
    self.DrawBar = function(data){
        var b = self.title.bar;
        console.log(data);
        var stars = [data.isH1, data.isH2, data.isH3, data.isH4, data.isH5];
        var x0 = 0;
        console.log(stars)
        console.log(b.width)
        stars = stars.map(function(value) { 
            return {v: value ,x0: x0, x1: x0 += b.xScale(value)}; 
        });
        console.log(stars)
        
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
            self.colorFix({});
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

         s.svg.append("g")
          .attr("class", "grid xg")
          .attr("transform", "translate(0," + (s.innerHeight+ s.margin.top) + ")")
          .call(s.xGrid.tickSize(- s.innerHeight, 0, 0).tickFormat(""))
        
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
        
        s.svg.append("g")
          .attr("class", "grid yg")
          .attr("transform", "translate(" + s.margin.left + "," + 0 + ")")
          .call(s.yGrid.tickSize(-(s.innerWidth - 40), 0, 0).tickFormat(""))
        
        var dots = s.svg.selectAll(".dot").data(data);
        
        dots.enter().append("circle")
            .attr("class", function(d) { return d.isMaster ? "dot master" : "dot"})
            .attr("r", s.sizeMap)
            .attr("cx", s.xMap)
            .attr("cy", s.yMap)
            //.style("visibility", function(d) { return d.count >= countLimit ? "visible": "hidden";})
            
            .on("mouseover", function(d) {
                if(!d.isMaster && d != self.selected)
                    self.highlight(d);
            })
            .on("mouseout", function(d) {
                if(!d.isMaster && d != self.selected)
                    self.clean(d);
            })
            .on("click", function(d) {
                if(!d.isMaster)
                    self.select(d);
            })
            .on("contextmenu",function(d){
                d3.event.preventDefault();
                d3.event.stopPropagation();
                self.remove(d);
            });
        dots.exit().remove();
        
        s.isDraw = true;
            self.colorFix({});
    }
    
    self.ReDrawScatter = function(data){
        var s = self.scatter;
        var dots = s.svg.selectAll(".dot").data(data);
        dots.enter().append("circle")
            .attr("class", function(d) { return d.isMaster ? "dot master" : "dot"})
            .attr("r", s.sizeMap)
            .attr("cx", s.xMap)
            .attr("cy", s.yMap)
            .style("visibility", function(d) { console.log(d.count); return d.count >= countLimit ? "visible": "hidden";})
            .on("mouseover", function(d) {
                if(!d.isMaster)
                    self.highlight(d);
            })
            .on("mouseout", function(d) {
                self.clean(d);
            })
            .on("click", function(d) {
                if(!d.isMaster)
                    self.select(d);
            })
            .on("contextmenu",function(d){
                d3.event.preventDefault();
                d3.event.stopPropagation();
                if(!d.isMaster)
                    self.remove(d);
            });
        dots.exit().remove();
        var t = s.svg.transition().duration(500);
            t.selectAll(".dot")
                .attr("class", function(d) { return d.isMaster ? "dot master" : "dot"})
                .attr("cy", s.yMap)
                .attr("cx", s.xMap)
                .attr("r", s.sizeMap)
                //.style("visibility", function(d) { console.log(d.count); return d.count >= countLimit ? "visible": "hidden";})
                
            
            t.selectAll(".y").call(s.yAxis) 
            t.selectAll(".x").call(s.xAxis) 
            
            t.selectAll(".yg").call(s.yGrid.tickSize(-(s.innerWidth - 40), 0, 0).tickFormat(""))
            t.selectAll(".xg").call(s.xGrid.tickSize(- s.innerHeight, 0, 0).tickFormat(""))
        console.log('redrwan'); 
        
        self.colorFix({});    
    }
        
    
    
}
function showModal(Title, msg){
    //modal-title
    //modal-body
    $('#modalReviews .modal-title').html(Title);
    $('#modalReviews .modal-body').html(msg);
    $('#modalReviews').modal('show');
}


//ListReview
function ReviewsList(id) {
    var self = this;
    self.element = d3.select(id);
    self.color = d3.scale.linear().range(["#ca0020", "#f4a582", "#f7f7f7", "#92c5de","#0571b0"]).domain([1,2,3,4,5]);
    self.currentXhr = null;
    self.abortIfLoading = function(){
        if(self.currentXhr){
            self.currentXhr.abort();
            self.currentXhr = null;
            pReview.hide();
        }
    }
    self.loadreviews = function(idBus, s,f,q,m){
        self.abortIfLoading();
        
        if(self.ul)
            self.ul.selectAll("li").remove();
        
        if(!f && self.ul){
           self.ul.selectAll("li").remove();
            return;
        }
        
        pReview.show();
        
        
        var sel = document.getElementById("slctReview").value;
        if(sel == "reviews") {
           self.currentXhr = d3.json("/api/GetReviews/?col=" + collectionSearch + "&id="+ idBus +"&s="+ s +"&f=" + f + ( q ? "&q=" + q: "")  + ( m ? "&m=" + m: ""), function(error, d){
               self.key = { feature: f, qualifier: q, m: m}; 
               self.draw(d);
               pReview.hide();
            }).on('progress', function(){
                 pReview.update(d3.event.loaded/ d3.event.total);
            });
           self.key = { feature: f, qualifier: q, m: m};
        }
        else {
            self.currentXhr = d3.json("/api/GetBusiness/?s="+ s +"&f=" + f + ( q ? "&q=" + q: "")  + ( m ? "&m=" + m: ""), function(error, d){
                self.key = { feature: f, qualifier: q, m: m}; 
                self.drawBusiness(d);
                pReview.hide();
            }).on('progress', function(){
                 pReview.update(d3.event.loaded/ d3.event.total);
            });
           self.key = { feature: f, qualifier: q, m: m};
        }
       
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
            .on('click',function(d){
                showModal('<span class="business">@' + d.business + "</span> - " + d.stars + (d.stars == 1? "star": " stars"), self.fullTxt(d, self.key));
            })
        el.exit().remove();
        
        self.isDraw = true;
    }
    
    self.drawBusiness = function(data){
        if(self.isDraw){
            self.reDrawBusiness(data);
            return;
        }
        
        self.ul = self.element.append("ul");
        var el =  self.ul.selectAll("li").data(data);
        el.enter()
            .append("li")
            .style("border-left", function(d) {return "solid 5px " + self.color(d.stars) })
            .html(function(d){return '<span class="business">@' + d.name + "</span> - " + d.count})
            .on('click',function(d){
                showModal('<span class="business">@' + d.business +  "</span>", "sss");
            })
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
            .on('click',function(d){
                showModal('<span class="business">@' + d.business + "</span> - " + d.stars + (d.stars == 1? "star": " stars"), self.fullTxt(d, self.key));
            })
        el.exit().remove();
        
        
    }
    
    self.reDrawBusiness = function(data){
        self.ul.selectAll("li").remove();
        
        var el =  self.ul.selectAll("li").data(data);
        var ul = el.enter()
            .append("ul")
            .style("border-left", function(d) {return "solid 5px " + self.color(d.stars) })
            .attr("class", "ulBusiness");
        ul.append("li")
            .html(function(d){return '<span class="business">' + d.name + " ("+d.avg.toFixed(2)+")</span> - " + d.count})
            .on('click',function(d){
                
            })
        ul.selectAll(".reviewBusiness")
            .data(function(d){console.log(d.reviews); return d.reviews})
            .enter()
            .append("li")
            .attr("class", "reviewBusiness")
            .style("border-left", function(d) {return "solid 5px " + self.color(d.stars) })
            .html(function(d){return self.snnipet(d, self.key)})
            .on('click',function(d){
                showModal('<span class="business">@' + d.business + "</span> - " + d.stars + (d.stars == 1? "star": " stars"), self.fullTxt(d, self.key));
            })
        el.exit().remove();
        
        
    }
    
    self.fullTxt = function(d, s){
        return self.txt(d,s);
        fOcurrences = d.features.filter(function(d){ return d.feature.lemma == s.feature });
        if(s.q){
            fOcurrences.forEach(function(f){
                f = f.qualifiers.filter(function(q) { return q.lemma == s.q; })
            })
        }
        
        fOcurrences.sort(function(f1,f2) { return f1.feature.start - f2.feature.start;});
        console.log(fOcurrences);
        
        var result = "";
        result += d.text.substring(0,fOcurrences[0].feature.start);
        for(i=0; i< fOcurrences.length; i++){
            var fs = fOcurrences[i].feature;
            fs.class = "feature";
            result += self.getFullSpanElm(fOcurrences[i]).span;
            if(i < fOcurrences.length-1)
                result += d.text.substring(fs.end, fOcurrences[i+1].feature.start);
            else
               result += d.text.substring(fs.end, d.text.length); 
        }
        
        return result;// + "<hr>"+ d.text;
    }
    
    self.txt = function(d, s){
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
        var span = 5000;
        if(fs.start < qs.start){
            order[0] = self.getSpanElm(fs);
            order[1] = self.getSpanElm(qs);
        }else{
            order[1] = self.getSpanElm(fs);
            order[0] = self.getSpanElm(qs);
        }
        var result = "";
        result += d.text.substring(order[0].start, order[0].start-span);
        
        result += order[0].span;
        result += d.text.substring(order[0].end, order[1].start);
        result += order[1].span;
        
        result += d.text.substring(order[1].end, order[1].end+span) + ""
        

        return result;
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
                if(!s.qualifier){
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
                        if(!(
                            (s.m && !qc.modifier) || 
                            (s.m && qc.modifier && qc.modifier.lemma != s.m)
                        )){
                            fs = f.feature;
                            qs = qc;
                            break;
                        }
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
                span: '<span class="modifier">' + item.modifier.word + '</span> ' + ' <span class="' + item.class+'">' + item.word + '</span>'
            }
            
        return {
            start: item.start,
            end: item.end,
            span: '<span class="' + item.class+'">' + item.word + '</span>'
        }
    }
    
   
}


function addFeature(){
    var feature = document.getElementById("txtAddFeature").value;
    if(feature.length > 0)
    {
        d3.json("/api/GetFeature?f=" + feature, function(error, d){
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
    collectionSearch = d.collectionSearch;
    
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































