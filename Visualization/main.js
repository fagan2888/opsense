var VizApp = angular.module('VizApp', ['vizServices']);

VizApp.controller('MainController', function ($scope, db, analytics) {
        $scope.data = [];
        $scope.scatter = new Scatter("#vizContainer");
        
        $scope.selectedCount = 0;
        $scope.init = function(){
            $scope.reviews = [];
            $scope.index = "yelp_health2";
            $scope.pattern = "Noun+Adjective";
            $scope.loadMeta();
            
            $scope.searchTerm = "";
            $scope.inter = true;
            $scope.termFilter = "";
            //$scope.load();
        }
        
        $scope.$watch('index', function(newValue, oldValue) {
            $scope.reloadAll();  
        });
    
        $scope.getHiglited = function(){
            return $scope.data.filter(function (d) { return d._highlight})[0];
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
            $scope.pattern = "Noun+Adjective";
            $scope.loadMeta();
            $scope.searchTerm = "";
            $scope.inter = true;
            $scope.termFilter = "";
            $scope.reviews = [];
            $scope.setData([]);
            $scope.refresh();
        }
        
        $scope.remove = function(d){
            $scope.setData($scope.data.filter(function(item) { return item.key !== d.key}));
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
            $scope.data = newData;
            $scope.scatter.setData($scope.data);
           
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
                console.log($scope.yOperation.field.type);
                console.log(review);
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
                    
                    var feature = r.terms.filter(function (rl){
                        var candKey1 = rl.g.lm + " " + rl.d.lm;
                        var candKey2 = rl.d.lm + " " + rl.g.lm;
                        for(i=0;i < selecteds.length; i++){
                     
                            if(selecteds[i].key == candKey1 || selecteds[i].key == candKey2)
                                return true;
                        }
                        return false;
                    })
                   
                    var text = "";
                    var wStart;
                    if(feature[0].g.ed > feature[0].d.ed){
                        wStart = feature[0].d;
                        wEnd = feature[0].g;
                    } else {
                        wStart = feature[0].g;
                        wEnd = feature[0].d;
                    }
                    var start = wStart.ed- wStart.wd.length;
                    var end = wEnd.ed;
                        
                        
                    if(start-50 < 0)
                        start = 0;
                    text = r.document.text.substr(start,100);
                    
                    
                    var review = { text: text, entity: r.entity.name, source: r};
                    $scope.reviews.push(review);
                })
                
            }); 
        }
        $scope.load = function(){
            db.get2($scope.index, $scope.searchTerm,$scope.pattern,$scope.xOperation , $scope.yOperation).then(function(result){
                result = analytics.preProcess(result, $scope.xOperation.operation, $scope.yOperation.operation);
                $scope.setData(result);
                $scope.refresh();
            })
        }
        $scope.loadMeta = function(){
            $scope.fields = [];
            db.mapping($scope.index).then(function(result){
                result = result[$scope.index].mappings.documents.properties;

                for(f in result.author.properties){
                    if(result.author.properties[f].type == "long" ||  result.author.properties[f].type == "double")
                        $scope.fields.push({value: "author."+f, text: f, type: "Author"});
                }
                for(f in result.document.properties){
                     if(result.document.properties[f].type == "long" ||  result.document.properties[f].type == "double")
                        $scope.fields.push({value: "document."+f, text: f, type: "Document"});
                }
                for(f in result.entity.properties){
                     if(result.entity.properties[f].type == "long" ||  result.entity.properties[f].type == "double")
                        $scope.fields.push({value: "entity."+f, text: f, type: "Entity"});
                }
                $scope.xOperation = {field: $scope.fields[0], operation: "avg"};
                $scope.yOperation = {field: $scope.fields[0], operation: "value_count"};

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
        desc: "Average",
        value: function(d) { return d[x.field];}, 
        scale: d3.scale.linear().range([0, innerWidth]),
        map: function(d) { return x.scale(x.value(d));},
    }
    x.axis = d3.svg.axis().scale(x.scale).orient("bottom")
        .innerTickSize(-innerHeight)
        .outerTickSize(0)
        .tickPadding(10);

    var y = {
        field: "y",
        desc: "Frequency",
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
        dom.xAxis.append("text")
            .attr("class", "label")
            .attr("x", innerWidth)
            .attr("y", -6)
            .style("text-anchor", "end")
            .text("x");
        
        //Build yAxis
        dom.yAxis = dom.body.append("g")
            .attr("class", "y axis")
        dom.yAxis.append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("y"); 
        
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
    
    function setDomains(data){
        x.scale.domain([d3.min(data, x.value), d3.max(data, x.value)]);
        y.scale.domain([d3.min(data, y.value), d3.max(data, y.value)]);
        s.scale.domain([d3.min(data, s.value), d3.max(data, s.value)]);
        zoom.x(x.scale);
        zoom.y(y.scale);
    }    
    function mouseOver(d){
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
        dom.yAxis.transition().duration(delay).call(y.axis);
        
    }
    self.setData = function(newData){
        if(!built)
            init();
        data = newData.slice(0);
        setDomains(data);

    }
}

































