var debugObject;
var VizApp = angular.module('VizApp', ['vizServices', 'ui.bootstrap', 'ngSanitize']);

VizApp.controller('MainController', function ($scope, db, analytics, $modal, $log) {
        $scope.data = [];
        $scope.scatter = new Scatter("#vizContainer");
        $scope.preventReload = false;
        $scope.currentStates = {};
    
        $scope.selectedCount = 0;
        $scope.init = function(){
            $scope.loading = 0;
            $scope.reviews = [];
            $scope.index = "yelphealth";
            $scope.pattern = "";
            $scope.searchTerm = "";
            $scope.inter = true;
            $scope.termFilter = "";
            $scope.starters = {
                yelphealth: {
                    xMetric: "avg",
                    xField: "document.stars",
                    yMetric: "variance",
                    yField: "document.stars"
                },
                zocodoc: {
                    xMetric: "avg",
                    xField: "document.Overall",
                    yMetric: "variance",
                    yField: "document.Overall"
                },

                myworld2: {
                    xMetric: "terms",
                    xField: "document.priorities",
                    yMetric: "value_count",
                    yField: "document.priorities"
                },
                ratemyprofessor: {
                    xMetric: "avg",
                    xField: "document.rating_Avg",
                    yMetric: "variance",
                    yField: "document.rating_Avg",
                    pattern: "Noun+Adjective",
                    searchTerm: ""
                },
                yelprestaurants: {
                    xMetric: "avg",
                    xField: "document.stars",
                    yMetric: "variance",
                    pattern: "Noun+Adjective",
                    yField: "document.stars",
                    searchTerm: "service"
                },
                whs: {
                    xMetric: "value_count",
                    xField: "document.id",
                    yMetric: "value_count",
                    yField: "document.id",
                    password: true
                }
            }
            window.onpopstate = function(event) {
                $scope.back(event);
            };
        }

        $scope.$watch('index', function(newValue, oldValue) {
            if($scope.starters[newValue].password){
                var pass = prompt('Please enter the password');
                if(!pass){
                    $scope.index = oldValue;
                    return;
                } else {
                    db.password("whs_usr2", pass);
                }
                
            } else {
                db.password();  
            }
            
            if(!$scope.preventReload)
                $scope.reloadAll();  
        });
    
        $scope.saveState = function(type, value){
            var state = {
                type: type,
                index: $scope.index,
                pattern: $scope.pattern,
                searchTerm: $scope.searchTerm,
                termFilter: $scope.termFilter,
                xOperation: $scope.xOperation,
                yOperation: $scope.yOperation,
                data: $scope.mainData
            }
            
            var Title = null;
            switch (type){
                case 'remove':
                    Title = "Removed: " + (value.length == 1 ? value[0].key: value.length) ;
                    break;
                case 'load':
                    Title = "Refreshed: " + state.index;
                    break;
                case 'index':
                    Title = "Loaded: " + state.index;
                    break;
                case 'select':
                    Title = "Selected: " + value.key;
                    break;
            }
            document.title = Title;
            $scope.currentStates = state;
            history.pushState(state, Title, null);
            document.title = "OpSense";
        }
    
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
        
        
        $scope.updateWindow = function(){

            $scope.scatter.resize();
        }
        window.onresize = $scope.updateWindow;
        
        //Public----------------------------------
        $scope.highlight = function(i){ i._highlight = true; $scope.refresh();}
        $scope.unhighlight = function(i){ i._highlight = false; $scope.refresh();}
        $scope.select = function(i,event) {
            if(!event.shiftKey){
                $scope.clear(true);
            }

            i._selected = !i._selected;
            $scope.setSimilar();
            $scope.refresh(true);
            $scope.loadreviews();
            $scope.saveState("select", i);
        }
        
        $scope.reloadAll = function(){
            $scope.pattern = "";
            $scope.searchTerm = "";
            $scope.inter = true;
            $scope.termFilter = "";
            
            $scope.loadMeta(function (result){
                $scope.load(true);
            })
        }
        
        $scope.remove = function(d){
            var newBuckets = $scope.data.filter(function(item) { return item.key !== d.key});
            $scope.mainData.buckets = newBuckets;
            $scope.setData($scope.mainData);
            $scope.refresh();
            $scope.saveState("remove",[d]);
        }
        
        $scope.removeSelected = function(){
            var newBuckets = $scope.data.filter(function(item) { 
                var result = true;
                $scope.getSelected().forEach(function(d){
                    if(item.key == d.key){
                        result = false;
                        $scope.saveState("remove",item);
                    }
                })
                return result;
            });
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
        
        $scope.clear = function(noSave){
            for(i=0; i< $scope.data.length; i++){
                $scope.data[i]._selected = false;
                $scope.data[i]._highlight = false;
                $scope.data[i]._similar = 0;
            }
            if(!noSave)
                $scope.saveState("clear");
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
            if($scope.limit > 0){
                if(d.review_count){
                    if(d.review_count < $scope.limit){
                        fixed += " dotHidden";
                    }
                }
            }
            
            return fixed;
        }
        
        $scope.setData = function (newData){
            $scope.mainData = newData;
            $scope.mainData.limit = $scope.limit;
            $scope.data = newData.buckets;
            $scope.scatter.setData($scope.mainData, $scope.xOperation, $scope.yOperation);
           
        }
        
        $scope.refresh = function(sort){
            $scope.selectedCount = $scope.getSelected().length;
            $scope.scatter.refresh(sort);
        }
        $scope.debug = function(){
            console.log($scope.data);
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
                    
                    var text = r.document.text;
                    
                    var feature = r.terms.filter(function (rl){
                        var candKey1 = rl.g.lm + " " + rl.d.lm;
                        var candKey2 = rl.d.lm + " " + rl.g.lm;

                        for(i=0;i < selecteds.length; i++){
                            if(selecteds[i].key.split(" ").length == 1)
                            {
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
                    });
                    
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
                    });
                    
                    var newText = "";
                    var last = 0;
                    words.forEach(function(w){
                        newText += r.document.text.substr(last,w.start-last) + '<span class="' + w.class + '">' + w.wd + "</span>";
                        last = w.ed;
                    })
                    newText +=  text.substr(last);
                    
                    if($scope.searchTerm.length > 0){
                        var serachExp = new RegExp('('+$scope.searchTerm+')','i');
                        newText = newText.replace(serachExp, '<span class="searchTerm">$1</span>')
                        sniStart = newText.search(serachExp);
                    }
                    
                    if(words.length > 0)
                    {
                        var sniStart = words[0].start > 0 ?  words[0].start : 0;
                    } 
                    
                    if(words.length >0 || $scope.searchTerm.length > 0){ 
                        var last = newText.lastIndexOf('</span>');
                        last = newText.length < last+50 ? newText.length : last+50;

                        var sniStart = newText.indexOf('<span class=');
                        sniStart = 0 > sniStart-50 ? 0 : sniStart-50;
                    } else {
                        sniStart = 0;
                        last = 150;
                    }
                    
                    debugObject = newText.trim();
                    var review = { text: newText, snippet: newText.slice(sniStart,last).trim() ,entity: r.entity.name, source: r};
                    $scope.reviews.push(review);
                });
            });
        }
        $scope.load = function(ReloadedAll){
            if(!$scope.preventReload){
                $scope.loading++;

                var pattern = $scope.pattern;
                if(pattern.length == 0){
                    pattern = "Noun|Adjective|Verb+Noun|Adjective|Verb";
                }
                db.get2($scope.index, $scope.searchTerm,pattern,$scope.xOperation , $scope.yOperation).then(function(result){
                    result = analytics.preProcess(result, $scope.xOperation.operation, $scope.yOperation.operation);
                    $scope.setData(result);
                    $scope.loadreviews();
                    $scope.refresh();
                    $scope.loading--;
                    if(ReloadedAll)
                        $scope.saveState('index');
                    else
                        $scope.saveState('load');

                }).catch(function(error){
                    alert('Sorry! a problem occurred');
                    $scope.loading--;
                })
            }
        }
        $scope.reset = function(){
            $scope.reloadAll();
        }
        $scope.back = function(event){
            var newState = event.state;
            var oldState = $scope.currentStates;
            $scope.setState(newState);    
        }
        
        $scope.goBack = function(){
            window.history.back();
        }
        
        $scope.setState = function(state){
            $scope.preventReload = true;
            $scope.index = state.index;
            $scope.pattern = state.pattern;
            $scope.searchTerm = state.searchTerm;
            $scope.termFilter = state.termFilter;
            
            $scope.starters[state.index] = {
                    xMetric: state.xOperation.operation ,
                    xField: state.xOperation.field.value,
                    yMetric: state.yOperation.operation,
                    yField: state.yOperation.field.value
            }
          
           // $scope.loadMeta(function(result){
                $scope.setData(state.data);
                $scope.loadreviews();
                $scope.refresh();
                $scope.preventReload = false; 
                //console.log('loades');
          //  })
        }
        
        $scope.loadMeta = function(callback){
            $scope.loading++;
            db.mapping($scope.index).then(function(result){
                if(result.status == 401)
                {
                    alert('Authentication problem');
                    location.reload();
                }
                
                if(!result){
                    alert('Sorry! a problem occurred. The page will be reloaded');
                    location.reload();
                }
                
                
                result = result[$scope.index].mappings.documents.properties;
                $scope.fields = [];
                var xSelected;
                var ySelected;
                for(f in result.author.properties){
                    if(result.author.properties[f].type == "long" ||  result.author.properties[f].type == "double" ||  result.author.properties[f].type == "string"){
                        doc = {value: "author."+f, text: f, type: "Author"};
                        $scope.fields.push(doc);
                        if("document."+f ==  $scope.starters[$scope.index].xField)
                            xSelected = doc;
                        if("document."+f ==  $scope.starters[$scope.index].yField)
                            ySelected = doc;
                    }
                }
                for(f in result.document.properties){
                     if(result.document.properties[f].type == "long" ||  result.document.properties[f].type == "double" ||  result.document.properties[f].type == "string"){
                        doc = {value: "document."+f, text: f, type: "Document"};
                        $scope.fields.push(doc);
                        if("document."+f ==  $scope.starters[$scope.index].xField)
                            xSelected = doc;
                        if("document."+f ==  $scope.starters[$scope.index].yField)
                            ySelected = doc;
                     }
                }
                for(f in result.entity.properties){
                     if(result.entity.properties[f].type == "long" ||  result.entity.properties[f].type == "double" ||  result.entity.properties[f].type == "string"){
                        doc = {value: "entity."+f, text: f, type: "Entity"};
                        $scope.fields.push(doc);
                        if("document."+f ==  $scope.starters[$scope.index].xField)
                            xSelected = doc;
                        if("document."+f ==  $scope.starters[$scope.index].yField)
                            ySelected = doc;
                    }
                }
                
                $scope.xOperation = { field: xSelected, operation: $scope.starters[$scope.index].xMetric};
                $scope.yOperation = { field: ySelected, operation: $scope.starters[$scope.index].yMetric};
                
                if($scope.starters[$scope.index].pattern){
                    $scope.pattern = $scope.starters[$scope.index].pattern;
                }
                if($scope.starters[$scope.index].searchTerm){
                    $scope.searchTerm = $scope.starters[$scope.index].searchTerm;
                }
                
                
                
                
                if(callback)
                    callback(result);
                
                $scope.loading--;
                
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
        value: function(d) { return Math.sqrt(d[s.field]/Math.PI);}, 
        scale: d3.scale.log().range([2, 20]),
        map: function(d) { return s.scale(s.value(d));},
    }
    
    var zoom = d3.behavior.zoom()
        .x(x.scale)
        .y(y.scale)
        .scaleExtent([1, 10])
        .on("zoom", zoomed);
    
    var zoomInitTranslate = zoom.translate();
    var zoomInitScale = zoom.scale();

    //Private----------------------------------------------------------------------------------
    function init(){
        dom.svg = dom.element.append("svg")
            .on("click", backClick)
            .on("dblclick", function() {
                zoom.translate(zoomInitTranslate);
                zoom.scale(zoomInitScale);
                zoomed(true);
            });
        dom.body = dom.svg.append("g").attr("class","vizBody");
        
        dom.legend = dom.element.select("#legend")
            .append("svg")
            .attr("width", 300)
            .attr("height", 60);
        
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
        dom.board.on("dblclick.zoom", null);
        
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
        
        if(mainData.x_termsIndex){
            var  minY = Infinity, minS =Infinity,  maxY = 0, maxS =0;
            data.forEach(function(c){
                 c.x.forEach(function(d){
                    if(minY > d.stats_y.value)
                        minY = d.stats_y.value;
                    if(maxY < d.stats_y.value)
                        maxY = d.stats_y.value
                        
                    if(minS > d.doc_count)
                        minS = d.doc_count;
                        
                    if(maxS < d.doc_count)
                        maxS = d.doc_count;
                   
                });
            });
 
            
            y.scale.domain([minY, maxY]);
            s.scale.domain([minS, maxS]);   
        }
        
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
        if(d3.event.detail > 1) return;
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
    function zoomed(isSmooth){
        
        function convert(sel) {
            return isSmooth ? sel.transition().duration(500).ease("easeInOutCubic") : sel;
        }
        
        convert(dom.xAxis).call(x.axis);
        convert(dom.yAxis).call(y.axis);
        convert(dom.dotSet).attr("cx", x.map).attr("cy", y.map)
        if(mainData.x_termsIndex){
            height = 800;
            margin.bottom= 330;
            dom.svg
                .attr("width", width)
                .attr("height", height);
            d3.selectAll("g.vizBody>g.x>g.tick>text").each(function() {
                var sel = d3.select(this);
                sel.text(mainData.x_termsIndex[+sel.text()]);
                var w = -10;
                sel.attr({
                    "transform": "rotate(-90) translate("+w+" -12)",
                    "style": "text-anchor:end"
                });
            });
        }
                
    }

    
    
    //Function change Type
    function changeTo(operation, axis){
        if(self["to_"+operation])
            self["to_"+operation] (operation, axis);
        else {
            y.value = function(d) { return d[y.field];}; 
            s.value = function(d) {
                return d[s.field];
            }
            //-------
            axis.value = function(d) {return d[x.field]};
        }
            axis.scale = d3.scale.linear().range([0, innerWidth]);
            axis.map = function(d) { return x.scale(x.value(d))};
            axis.axis = d3.svg.axis().scale(x.scale).orient("bottom")
                .innerTickSize(-innerHeight)
                .outerTickSize(0)
                .tickPadding(10);
       
    }
    
    self.to_terms = function(operation){
        x.value = function(d) {
            if(!d.x[0])
                return -1;
            return mainData.x_termsIndex.indexOf(d.x[0].key);
        };
        x.scale = d3.scale.ordinal().range([150, innerWidth])
        x.map = function(d) { return x.scale(x.value(d))};
        x.axis = d3.svg.axis().scale(x.scale).orient("bottom")
            .innerTickSize(-innerHeight)
            .outerTickSize(0)
            .tickValues(mainData.x_termsIndex.map( function(d,ix) { return ix; }))
            .tickPadding(10);
        
        y.value = function(d) {
           
            if(!d.x[0])
                return 0;
            return d.x[0].stats_y.value;
        }
        
        s.value = function(d) {
             if(!d.x[0])
                return 0;
            return d.x[0].doc_count;
        }
        
        
        // TODO 
    }
    
    self.resize = function(){
        width = dom.element.node().getBoundingClientRect().width;
        innerWidth = width - margin.left - margin.right,
        x.scale.range([0, innerWidth]),
        y.axis.innerTickSize(-innerWidth);
            
        self.setBounds();
        dom.xAxisLabel.attr("x", innerWidth);        
        
        
        self.refresh();
    }
    
    
    
    
    self.plotSiblings = function(word){
        
        if(mainData.x_termsIndex){
            var delay = 0;
            
            var line = d3.svg.line()
                .x(function(d){return x.scale(mainData.x_termsIndex.indexOf(d.key))})
                .y(function(d) { return y.scale(d.stats_y.value);});
            
            var localData = word.x.slice(0).sort(function(a,b){
                return mainData.x_termsIndex.indexOf(a.key) - mainData.x_termsIndex.indexOf(b.key);
            })
            if(dom.trendline)
                dom.trendline.remove();
            dom.trendline = dom.board.append("path")
              .datum(localData)
              .attr("class", "trendLine")
              .attr("d", line);
            
            dom.siblingSet = dom.board.selectAll(".dotSibling").data(word.x.slice(1), function(d) {return word.key + "_" + d.key});
            dom.siblingSet
                .enter()
                .append("circle")
                .attr("class", "dotSibling")
                .attr("r", function(d) { return s.scale(d.doc_count);})
            
            dom.siblingSet.transition().duration(delay).attr("r",function(d) { return s.scale(d.doc_count);})
                    .attr("cx", function(d){return x.scale(mainData.x_termsIndex.indexOf(d.key))})
                    .attr("cy", function(d) { return y.scale(d.stats_y.value);})
            
            dom.siblingSet
                .exit()
                .transition().duration(delay)
                .attr("r", 0)
                .remove();
        }
        
    }
    self.removeSiblings  = function(word){
        
        if(mainData.x_termsIndex){
            var delay = 100;
            dom.siblingSet = dom.board.selectAll(".dotSibling").data([]);
            if(dom.trendline)
                dom.trendline.remove();
            dom.siblingSet
                .exit()
                .transition().duration(delay)
                .attr("r", 0)
                .remove();
        }
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
        
        if(mainData.x_termsIndex)
            x.axis.tickValues(mainData.x_termsIndex.map(function(l,i) { return i })); 
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
                var w = -10;
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
       
        self.removeSiblings();
        data.filter(function (d) {return d._highlight}).forEach(function(d) { self.plotSiblings(d)});
        
        legendData = s.scale.ticks();
        
        while (legendData.length > 5){
            result = [];
            for(i =0; i < legendData.length-1; i+=2){
                result.push(legendData[i]);
            }
            result.push(legendData[legendData.length-1]);
            legendData = result;
        }
        legendData.sort(function (a,b) {return b-a});
        
        dom.legend.selectAll(".dotLegend").remove();
        legendD = dom.legend.selectAll(".dotLegend").data(legendData);
        legendD.exit().remove();
        legendG = legendD.enter().append("g").attr("class", "dotLegend");
        legendG.append("circle")
            .attr("r", function(d) { return s.scale(d)})
            .attr("cx", function(d,i) { return 280 - i*50})
            .attr("cy", 20)
        legendG.append("text")
            .text(function(d) { return d})
            .attr("x", function(d,i) { return 280 - i*50})
            .attr("y", 55)
            .attr("style", "text-anchor:middle")
        
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

































