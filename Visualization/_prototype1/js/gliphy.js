function Glyph(selector, title, obj){
    var self = this;
    self.element = obj ? d3.select(obj) : d3.select(selector);
    self.selector = selector;
    self.color = d3.scale.ordinal().domain([1,2,3,4,5]).range(["#d7191c", "#fdae61", "#ffffbf", "#abd9e9", "#2c7bb6"]);
    
    
    self.draw = function(data, child, main){
       
        data.sort(function(a, b) {
           return b.count - a.count;
        });
        
        var arcs = [{cat:1, value: 20},{cat:2, value: 20},{cat:3, value: 20},{cat:4, value: 20},{cat:5, value: 20}]
        
        if(main)
        {
            arcs[0].count = main.is1;
            arcs[1].count = main.is2;
            arcs[2].count = main.is3;
            arcs[3].count = main.is4;
            arcs[4].count = main.is5;
        }
        var 
            width = $(selector).width(),
            height = $(selector).height(),
            radius = Math.min(width, height) / 2,
            diameter = Math.min(width, height),
            radiusIn = radius-(radius/ 5),
            radiusOut = radius;
        if(!main)
            radiusIn = radius-(radius/ 20)
            
        if(main)
            var arc = d3.svg.arc()
                //.outerRadius(radiusOut)
                .outerRadius(
                    function (d) { 
                        var max = d3.max(arcs, function(e) { return e.count }); 
                        return radiusIn + ((radiusOut-radiusIn)*(d.data.count/max) ) })
                .innerRadius(radiusIn);
        else
            var arc = d3.svg.arc()
                .outerRadius(radiusOut)
                .innerRadius(radiusIn);
        
        var arcInner = d3.svg.arc()
            .outerRadius(radiusIn)
            .innerRadius(0);

        var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) { return d.value; });
        
        self.element.append("div").attr("class","title").text(title);
        var svg = self.element.append("svg").attr("width", diameter)
            .attr("height", diameter)
          .append("g")
            .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");
        
        var tooltip = self.element
            .append("div")
            .attr("class", "tooltip")
            .text("teste");
       
        
        var xMap = function(d) {
            var total = d.is1 + d.is2 + d.is3 + d.is4 + d.is5;
            var x2 = 
                 0 + ((d.is5/total)*(radiusIn)) * Math.cos(126 * (Math.PI/180))
                    + ((d.is4/total)*(radiusIn)) * Math.cos(198 * (Math.PI/180))
                    + ((d.is3/total)*(radiusIn)) * Math.cos(270 * (Math.PI/180))
                    + ((d.is2/total)*(radiusIn)) * Math.cos(342 * (Math.PI/180))
                    + ((d.is1/total)*(radiusIn)) * Math.cos(54 * (Math.PI/180))
            return x2;
        }
        var yMap = function(d) {
            var total = d.is1 + d.is2 + d.is3 + d.is4 + d.is5;
            var x2 = 
                 0 + ((d.is5/total)*(radiusIn)) * Math.sin(126 * (Math.PI/180))
                    + ((d.is4/total)*(radiusIn)) * Math.sin(198 * (Math.PI/180))
                    + ((d.is3/total)*(radiusIn)) * Math.sin(270 * (Math.PI/180))
                    + ((d.is2/total)*(radiusIn)) * Math.sin(342 * (Math.PI/180))
                    + ((d.is1/total)*(radiusIn)) * Math.sin(54 * (Math.PI/180))
            return x2*-1;
        }
        
        var d = {is1: 10, is2: 10, is3:10, is4: 10, is5: 100}
       
        
        var g = svg.selectAll(".arc")
             .data(pie(arcs))
             .enter().append("g")
             .attr("class", "arc");

         g.append("path")
             .attr("d", arc)
             .style("fill", function (d) {
                 return self.color(d.data.cat);
             });
        
        var sizeScale = d3.scale.log().range([1, (radius > 100 ? radius/20 : radius/10)]);
        sizeScale.domain([d3.min(data,function(d){return d.count}), d3.max(data,function(d){return d.count})])
        
        var g = svg.selectAll(".arcInner")
             .data(pie(arcs))
             .enter().append("g")
             .attr("class", "arcInner");

         g.append("path")
             .attr("d", arcInner)
             .style("fill", function (d) {
                 return self.color(d.data.cat);
             });
        
        var numlines = 4;
        for(i =1; i <= numlines; i++){
            var step = (radiusIn)/(numlines+1);
            
            g.append("circle") 
                .attr("class", "circleGrid")
                .attr("r", step*i)
        }
        
        //console.log(data);
        var gDots = svg.append("g");
        gDots.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", function(d) {return sizeScale(d.count)})
            .attr("cx", function(d) { return xMap(d)} )
            .attr("cy", function(d) { return yMap(d)} )
            .on("mouseover",function (d){
                tooltip.html("<b>" + d._id + "</b><br>" + "Avg: " + d.avg.toFixed(2) + "</br>"  
                            + "1 star:" + d.is1 + "</br>"
                            + "2 star:" + d.is2 + "</br>"
                            + "3 star:" + d.is3 + "</br>"
                            + "4 star:" + d.is4 + "</br>"
                            + "5 star:" + d.is5 + "</br>");
                tooltip.style("display","block");
            })
            .on("mouseout",function (d){
                tooltip.style("display","none");
            })
        
        if(!child){
            var divBar = self.element.append("div").attr("class","barContainer").style("width", function(d){ return  width });;
            divBar.append("div").attr("class","countBar").style("width", function(d){ return (d.relCount* width ) });
        }
        
        if(child){
            self.element.append("hr")
            var list = self.element.append("div").attr("class","smallList");
            list.selectAll(".smallGlyph")
                .data(data)
                .enter()
                .append("div")
                .attr("class","smallGlyph")
                .call(function(d){
                    d.forEach(function(list){
                        var countMax = d3.max(list, function(k) { return k.__data__.count});
                        list.forEach(function(elm){
                            var dataS = elm.__data__;
                            dataS.relCount = dataS.count/ countMax;
                            var _glyph = new Glyph(".smallGlyph", dataS._id, elm);
                            _glyph.draw(dataS.qualifiers, undefined, dataS);
                        })

                    });

                })
        }
        
        
        
        
        
        
     }
           
    
    return self;
}