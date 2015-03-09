var VizApp = angular.module('VizApp', ['vizServices']);

VizApp.controller('MainController', function ($scope, db, analytics) {
        $scope.data = [];
        $scope.scatter = new Scatter("#vizContainer");
        
        $scope.selectedCount = 0;
        $scope.init = function(){
            $scope.index = "yelp";
            $scope.gov = "nn";
            $scope.dep = "jj";
            $scope.inter = true;
            $scope.termFilter = "";
            $scope.load();
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
        
        $scope.load = function(){
            db.get($scope.index, $scope.gov, $scope.dep, $scope.inter).then(function(result){
                result = analytics.preProcess(result);
                $scope.setData(result);
                $scope.refresh();
            })
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
        field: "avg",
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
        field: "variance",
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
        field: "count",
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

                if (a.count > b.count) {
                    return -1;
                }
                if (a.count < b.count) {
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

































