var VizApp = angular.module('VizApp', ['vizServices', 'ui.bootstrap', 'ngSanitize']);

VizApp.controller('MainController', function ($scope, db, analytics, $modal, $log) {
        $scope.data = [];
        $scope.scatter = new Scatter("#vizContainer");
        
        $scope.selectedCount = 0;
        $scope.init = function(){
            $scope.reviews = [];
            $scope.index = "yelphealth";
            $scope.pattern = "";
            $scope.searchTerm = "";
            $scope.inter = true;
            $scope.termFilter = "";
            $scope.starters = {
                yelphealth: "stars",
                zocodoc: "Overall",
                myworld: "priorities",
            }
            $scope.loadMeta(function (result){
                $scope.load();
            })
           
            //$scope.load();
        }
        
       
        
        $scope.$watch('index', function(newValue, oldValue) {
            $scope.reloadAll();  
        });
    
        $scope.getHiglited = function(){
            return $scope.data.filter(function (d) { return d._highlight})[0];
        }
        
        $scope.openReview = function (review) {
            $scope.showModal = true;
            $scope.selectedReview = review;
        }
        $scope.hideModal = function(){
            $scope.showModal = false;
            $scope.selectedReview = undefined;
        }
        
        //Public----------------------------------
        $scope.highlight = function(i){ i._highlight = true; $scope.refresh();}
        $scope.unhighlight = function(i){ i._highlight = false; $scope.refresh();}
        $scope.select = function(i,event) {
            if(!event.shiftKey)
                $scope.clear();

            i._selected = !i._selected;
            $scope.setSimilar();
            $scope.refresh(true);
            $scope.loadreviews();
        }
        
        $scope.reloadAll = function(){
            $scope.pattern = "";
            $scope.loadMeta();
            $scope.searchTerm = "";
            $scope.inter = true;
            $scope.termFilter = "";
            $scope.reviews = [];
            $scope.setData({buckets:[]});
            $scope.refresh();
        }
        
        $scope.remove = function(d){
            var newBuckets = $scope.data.filter(function(item) { return item.key !== d.key});
            $scope.mainData.buckets = newBuckets;
            $scope.setData($scope.mainData);
            $scope.refresh();
        }
        
        $scope.setSimilar = function(){
            for(i=0; i< $scope.data.length; i++){
                $scope.data[i]._similar = -1;
            }
            var selected = $scope.getSelected();
            selected.forEach(function(s){
                var words = s.key.split(" ");
                for(i=0; i< $scope.data.length; i++){
                    var testing = $scope.data[i].key.split(" ");
                    
                    for(k=0; k< words.length; k++){
                        if(words[k] == testing[k]){
                            $scope.data[i]._similar = k+1;
                        }
                    }
                }
            });
        }
        
        $scope.getSelected = function(){
            return $scope.data.filter(function (d) { return d._selected});
        }
        
        $scope.clear = function(){
            for(i=0; i< $scope.data.length; i++){
                $scope.data[i]._selected = false;
                $scope.data[i]._highlight = false;
                $scope.data[i]._similar = 0;
            }
        }
        
        $scope.clearAndRefresh = function(){
            $scope.clear();
            $scope.refresh(true);
        }
        
        $scope.classes = function(fixed,d) {
            
            if(d._similar && d._similar > -1){
                fixed += " similar" + d._similar;
          
            if(d._selected)
                fixed += " selected";
            }
            if(d._highlight){
                fixed += " highlight";  
            }
            
            if($scope.selectedCount > 0){
                fixed += " inSelection";  
            }
            return fixed;
        }
        
        $scope.setData = function (newData){
            $scope.mainData = newData;
            $scope.data = newData.buckets;
            $scope.scatter.setData($scope.mainData, $scope.xOperation, $scope.yOperation);
           
        }
        
        $scope.refresh = function(sort){
            $scope.selectedCount = $scope.getSelected().length;
            $scope.scatter.refresh(sort);
        }
        
        $scope.getValue = function(review, axis){
            if(axis == 'y'){
                return review.source[$scope.yOperation.field.type.toLowerCase()][$scope.yOperation.field.text];
            }
            if(axis == 'x'){
                return review.source[$scope.xOperation.field.type.toLowerCase()][$scope.xOperation.field.text];
            }
        }
        
        $scope.loadreviews = function(){
            $scope.reviews = [];
            var selecteds = $scope.getSelected()
            db.loadReviews($scope.index, $scope.searchTerm, selecteds)
            .then(function(result){
                result.hits.hits.forEach(function(r){
                    r = r._source;
                    cardinality = 2;
                    var feature = r.terms.filter(function (rl){
                        var candKey1 = rl.g.lm + " " + rl.d.lm;
                        var candKey2 = rl.d.lm + " " + rl.g.lm;
                        
                        for(i=0;i < selecteds.length; i++){
                            if(selecteds[i].key.split(" ").length == 1)
                            {
                                cardinality = 1;
                                candKey1 = rl.g.lm;
                                candKey2 = rl.d.lm;
                                if(selecteds[i].key == candKey1){
                                    rl.g.class = "similar1";
                                    rl.d.class = "similar2";
                                } else if (selecteds[i].key == candKey2) {
                                    rl.g.class = "similar2";
                                    rl.d.class = "similar1";
                                }
                            }
                     
                            if(selecteds[i].key == candKey1 || selecteds[i].key == candKey2)
                                return true;
                        }
                        return false;
                    })
                    
                    var words = [];
                    feature.forEach(function(f){
                        f.g.start = f.g.ed - f.g.wd.length;
                        f.d.start = f.d.ed - f.d.wd.length;
                        if(f.d.tg < f.g.tg){
                            f.d.class = f.d.class ? f.d.class : "similar1";
                            f.g.class = f.g.class ? f.g.class : "similar2";
                        }
                        else {
                            f.d.class = f.d.class ? f.d.class : "similar2";
                            f.g.class = f.g.class ? f.g.class : "similar1";
                        }
                        
                        
                        if(words.filter(function(wk) { return wk.start == f.g.start;}).length == 0)
                            words.push(f.g);
                        if(words.filter(function(wk) { return wk.start == f.d.start;}).length == 0)
                            words.push(f.d);
                    })
                    words.sort(function(a,b){
                        return a.start - b.start;
                    })
                    
                    var newText = "";
                    var last = 0;
                    words.forEach(function(w){
                        newText += r.document.text.substr(last,w.start-last) + '<span class="' + w.class + '">' + w.wd + "</span>";
                        last = w.ed;
                    })
                    newText +=  r.document.text.substr(last);
                    
                    
                    var splited = newText.split(" ");
                    var sniStart = 0;
                    if($scope.searchTerm.length >0){
                        for(i =0; i < splited.length; i++){
                            var w = splited[i];
                            $scope.searchTerm.split(" ").forEach(function(sh){
                                if(w == sh){
                                    
                                    w = '<span class="searchTerm">' + w + "</span>";
                                    splited[i] = w;
                                    if(sniStart == 0)
                                    {
                                        var total = 0;
                                        for(j=0; j < i; j++){
                                            total += splited[j].length;
                                        }
                                        sniStart = total -50 < 0? 0: total -50;
                                    }
                                }
                            });
                        }
                    }
                    if(words.length > 0)
                    {
                        var sniStart = words[0].start -50 > 0 ?  words[0].start -50 : 0;
                        var sniEnd = sniStart + 140 < newText.length ?  sniStart+144 : newText.length;
                    } 
                    newText = splited.join(" ");
                    
                    var snippet = newText.substr(sniStart, 200);
                    
                    var review = { text: newText, snippet: snippet,entity: r.entity.name, source: r};
                    $scope.reviews.push(review);
                })
                
            }); 
        }
        $scope.load = function(){
            var pattern = $scope.pattern;
            if(pattern.length == 0){
                pattern = "Noun|Adjective|Verb+Noun|Adjective|Verb";
            }
            db.get2($scope.index, $scope.searchTerm,pattern,$scope.xOperation , $scope.yOperation).then(function(result){
                result = analytics.preProcess(result, $scope.xOperation.operation, $scope.yOperation.operation);
                $scope.setData(result);
                $scope.loadreviews();
                $scope.refresh();
            })
        }
        $scope.loadMeta = function(callback){
            
            db.mapping($scope.index).then(function(result){
                if(!result[$scope.index]){
                    alert('Sorry! one problem occurred. The page will be reloaded');
                    location.reload();
                }
                
                result = result[$scope.index].mappings.documents.properties;
                $scope.fields = [];
                $scope.xOperation = {field: "", operation: "avg"};
                $scope.yOperation = {field: "", operation: "variance"};
                for(f in result.author.properties){
                    if(result.author.properties[f].type == "long" ||  result.author.properties[f].type == "double" ){
                        $scope.fields.push({value: "author."+f, text: f, type: "Author"});
                        if(f == $scope.starters[$scope.index]){
                            $scope.xOperation.field = doc;
                            $scope.yOperation.field = doc;
                        }
                    }
                }
                for(f in result.document.properties){
                     if(result.document.properties[f].type == "long" ||  result.document.properties[f].type == "double" ||  result.document.properties[f].type == "string"){
                         doc = {value: "document."+f, text: f, type: "Document"};
                        $scope.fields.push(doc);
                        if(f == $scope.starters[$scope.index]){
                            $scope.xOperation.field = doc;
                            $scope.yOperation.field = doc;
                        }
                     }
                }
                for(f in result.entity.properties){
                     if(result.entity.properties[f].type == "long" ||  result.entity.properties[f].type == "double"){
                        $scope.fields.push({value: "entity."+f, text: f, type: "Entity"});
                         if(f == $scope.starters[$scope.index]){
                            $scope.xOperation.field = doc;
                            $scope.yOperation.field = doc;
                        }
                    }
                }
                //$scope.xOperation = {field: $scope.fields[0], operation: "avg"};
                //$scope.yOperation = {field: $scope.fields[0], operation: "variance"};
                
                if(callback)
                    callback(result);
                

            });
            
           
        }
                
        //Events -------------------------------------------------------------
        $scope.scatter.onMouseOver = util.apply($scope.highlight, $scope);
        $scope.scatter.onMouseOut = util.apply($scope.unhighlight, $scope);
        $scope.scatter.onClick = util.apply($scope.select, $scope);
        $scope.scatter.classes = $scope.classes;
        $scope.scatter.onBackClick = util.apply($scope.clearAndRefresh, $scope);
        $scope.scatter.onRightClick = util.apply($scope.remove, $scope);
    });


//Scatter    --------------------------------------------------------------------------
var util = {
    apply: function(f, scope){
        return function(d,k){
            scope.$apply(f(d,k));
        }
    }
}

function Scatter(selector){
    var self = this;
    var built = false;
    var data = [];
    var mainData = {};
    var dom = {
        element: d3.select(selector)
    }
    
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = dom.element.node().getBoundingClientRect().width, 
        height = 500,
        innerWidth = width - margin.left - margin.right,
        innerHeight = height - margin.top - margin.bottom
    
    var x = {
        field: "x",
        operation: {operation: "", field: ""},
        value: function(d) { return d[x.field];}, 
        scale: d3.scale.linear().range([0, innerWidth]),
        map: function(d) { return x.scale(x.value(d));},
    }
    x.axis = d3.svg.axis().scale(x.scale).orient("bottom")
        .innerTickSize(-innerHeight)
        .outerTickSize(0)
        .tickPadding(10);
    
    x.catSxis = d3.svg.axis().scale(x.scale).orient("bottom")
        .innerTickSize(-innerHeight)
        .outerTickSize(0)
        .tickPadding(10);

    var y = {
        field: "y",
        operation: {operation: "", field: ""},
        value: function(d) { return d[y.field];}, 
        scale: d3.scale.linear().range([innerHeight, 0]),
        map: function(d) { return y.scale(y.value(d));},
    }
    y.axis = d3.svg.axis().scale(y.scale).orient("left")
        .innerTickSize(-innerWidth)
        .outerTickSize(0)
        .tickPadding(10);
    var s = {
        field: "review_count",
        desc: "Frequency",
        value: function(d) { return d[s.field];}, 
        scale: d3.scale.log().range([2, 20]),
        map: function(d) { return s.scale(s.value(d));},
    }
    
    var zoom = d3.behavior.zoom()
        .x(x.scale)
        .y(y.scale)
        .scaleExtent([1, 10])
        .on("zoom", zoomed);

    //Private----------------------------------------------------------------------------------
    function init(){
        dom.svg = dom.element.append("svg")
            .on("click", backClick)
        dom.body = dom.svg.append("g").attr("class","vizBody");
        
        self.setBounds();
        
        //Build x Axis
        dom.xAxis = dom.body.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + innerHeight + ")");
        dom.xAxisLabel = dom.xAxis.append("text")
            .attr("class", "label")
            .attr("x", innerWidth)
            .attr("y", -6)
            .style("text-anchor", "end")
            .text("");
        
        //Build yAxis
        dom.yAxis = dom.body.append("g")
            .attr("class", "y axis")
        dom.yAxisLabel = dom.yAxis.append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(""); 
        
        dom.board = dom.body.append("g").call(zoom);
        var area = dom.board.append("rect")
            .attr("width", innerWidth)
            .attr("height", innerHeight);
        
       
        
        built = true;
    }
    function doSelect(selection) { // performs the actual selection
        cs.style({
            "fill": "white"
        });
        selection.forEach(function(c) {
            c.sel.style({
                "fill": "cornflowerblue"
            });
        });
    }
    
    function setDomains(data, xOperation){
        x.scale.domain([d3.min(data, x.value), d3.max(data, x.value)]);
        y.scale.domain([d3.min(data, y.value), d3.max(data, y.value)]);
        s.scale.domain([d3.min(data, s.value), d3.max(data, s.value)]);
        zoom.x(x.scale);
        zoom.y(y.scale);
    }    
    function mouseOver(d){
        self.plotSiblings(d);
        if(self.onMouseOver)
            self.onMouseOver(d);
    }
    function mouseLeave(d){
        if(self.onMouseOut)
            self.onMouseOut(d);
    }
    function click(d){
        d3.event.stopPropagation();
        if(self.onClick)
            self.onClick(d,d3.event);
    }
    function backClick(d){
        if(self.onBackClick){
            self.onBackClick(d);
        }
    }
    function rightClick(d){
        d3.event.preventDefault();
        d3.event.stopPropagation();
        if(self.onRightClick)
            self.onRightClick(d);
    }
    function zoomed(){
        dom.xAxis.call(x.axis);
        dom.yAxis.call(y.axis);
        dom.dotSet.attr("cx", x.map).attr("cy", y.map)
        
                
    }

    
    
    //Function change Type
    function changeTo(operation, axis){
        if(self["to_"+operation])
            self["to_"+operation] (operation, axis);
        else
            axis.value = function(d) {return d[x.field]};
            axis.scale = d3.scale.linear().range([0, innerWidth]);
            axis.map = function(d) { return x.scale(x.value(d))};
            axis.axis = d3.svg.axis().scale(x.scale).orient("bottom")
                .innerTickSize(-innerHeight)
                .outerTickSize(0)
                .tickPadding(10);
       
    }
    
    self.to_terms = function(operation, axis, axisName){
        axis.value = function(d) {
            return mainData.x_termsIndex.indexOf(d.x[0].key);
        };
        axis.scale = d3.scale.ordinal().range([0, innerWidth])
        axis.map = function(d) { return x.scale(x.value(d))};
        axis.axis = d3.svg.axis().scale(x.scale).orient("bottom")
            .innerTickSize(-innerHeight)
            .outerTickSize(0)
            .tickValues(mainData.x_termsIndex.map( function(d,ix) { console.log('mapping'); return ix; }))
            .tickPadding(10);
        // TODO 
    }
    
    
    self.plotSiblings = function(word){
        console.log(word);
        var delay = 100;
        dom.siblingSet = dom.board.selectAll(".dotSibling").data(word.x, function(d) {return d.key});
        dom.siblingSet
            .enter()
            .append("circle")
            .attr("class", "dotSibling")
            .attr("r", 0)
          
        dom.siblingSet.transition().duration(delay).attr("r",s.map)
                .attr("cx",  x.map)
                .attr("cy", y.map)
        
        dom.dotSet
            .exit()
            .transition().duration(delay)
            .attr("r", 0)
            .remove();
        
    }
    
    //Public----------------------------------------------------------------------------------
    self.setBounds = function(bounds) {
        dom.svg
            .attr("width", width)
            .attr("height", height);
        dom.body
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");    
    } 
    self.refresh = function(sorting){
        if(!built)
            return;
         
        var delay = 500;
        if(sorting){
            data.sort(function (a,b){
               if(a._selected)
                   return 1;
                if(b._selected)
                   return -1;

                if(a._similar > 0)
                   return 1;
                if(b._similar > 0)
                   return -1;

                if (a.review_count > b.review_count) {
                    return -1;
                }
                if (a.review_count < b.review_count) {
                    return 1;
                }
                return 0;
            })
            dom.board.selectAll(".dot").remove();
            delay = 0;
        }
        
        
        dom.dotSet = dom.board.selectAll(".dot").data(data, function(d) { return d.key});
        dom.dotSet
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("r", 0)
            .on("mouseover",mouseOver)
            .on("mouseout",mouseLeave)
            .on("click",click)
            .on("contextmenu", rightClick);
      
        dom.dotSet.attr("class", function(d) { return self.classes("dot",d)});
        dom.dotSet.transition().duration(delay).attr("r",s.map)
                .attr("cx", x.map)
                .attr("cy", y.map)
                
        dom.dotSet
            .exit()
            .transition().duration(delay)
            .attr("r", 0)
            .remove();
        
        dom.xAxis.transition().duration(delay).call(x.axis);
        if(mainData.x_termsIndex){
            height = 800;
            margin.bottom= 330;
            dom.svg
                .attr("width", width)
                .attr("height", height);
            d3.selectAll("g.vizBody>g.x>g.tick>text").each(function() {
                var sel = d3.select(this);
                sel.text(mainData.x_termsIndex[+sel.text()]);
                var w = -10;//-sel.node().getBBox().width + 100;
                sel.attr({
                    "transform": "rotate(-90) translate("+w+" -12)",
                    "style": "text-anchor:end"
                });
            });
        }
        dom.yAxis.transition().duration(delay).call(y.axis);
        if(x.operation){
            dom.xAxisLabel.text(x.operation.operation + "(" + x.operation.field.text + ")" );
        }
        if(y.operation){
            dom.yAxisLabel.text(y.operation.operation + "(" + y.operation.field.text + ")" );
        }
        
    }
    
    
    
    self.setData = function(newData, xOperation, yOperation){
        if(!built)
            init();
        x.operation = xOperation;
        y.operation = yOperation;
        mainData = newData;
        data = newData.buckets.slice(0);
        if(x.operation) {
            changeTo(x.operation.operation, x, 'x');
            setDomains(data, x.operation.operation);
        } else {
            setDomains(data);
        }
    }
}

































