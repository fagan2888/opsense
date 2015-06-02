/*global OpSense, d3, console, Utils*/
OpSense.directive("vizTitle", function () {
    'use strict';
    return {
        restrict: "EA",
        scope: false,
        link: function (scope, elem, attrs) {
            var label, keyword, xValue, yValue, countValue, legend,
                ready = false,
                data = scope.data,
                state = scope.state,
                board = d3.select(elem[0]).append("svg").attr("height", 60),
                parent = elem[0].parentNode,
                
                /*Properties ----------------------------------------*/
                width = function () {
                    return parent.clientWidth;
                },
                
                /*Actions -------------------------------------------*/
                reDraw = function () {
                    board.attr("width", width());
                    xValue.attr("x", width() / 2);
                    yValue.attr("x", width() / 2);
                    
                    if (state.highlighted) {
                        keyword.text(state.highlighted.key);
                        xValue.text(state.xMetric.metric + ": " + (!isNaN(state.highlighted.x) ? Utils.numberFormat(state.highlighted.x, 1) : state.highlighted.x));
                        yValue.text(state.yMetric.metric + ": " + Utils.numberFormat(state.highlighted.y, 1));
                        countValue.text("count: " + state.highlighted.count);
                        
                        label.style({visibility: 'visible'});
                    } else {
                        label.style({visibility: 'hidden'});
                    }
                    
                },
            
                dataChanged = function () {
                
                },
            
                register = function () {
                    scope.onHighlight.push(reDraw);
                    scope.onUnHighlight.push(reDraw);
                },
                
                build = function () {
                    label = board.append("g");
                    keyword = label.append("text")
                        .style({
                            'font-size': "20px"
                        })
                        .attr("x", 20)
                        .attr("y", 30)
                        .attr("class", "label");
                
                    xValue = label
                        .append("text")
                        .attr("x", width() / 2)
                        .attr("y", 20)
                        .attr("class", "valueLabel");
                    yValue = label
                        .append("text")
                        .attr("x", width() / 2)
                        .attr("y", 35)
                        .attr("class", "valueLabel");
                    
                    countValue = label
                        .append("text")
                        .attr("x", width() / 2)
                        .attr("y", 50)
                        .attr("class", "valueLabel");
    
                    register();
                    ready = true;
                };
            
            build();
        }
    };
});

OpSense.directive("scatter", function () {
    'use strict';
    return {
        restrict: "EA",
        scope: false,
        link: function (scope, elem, attrs) {
            var scales, axis, xAxis, yAxis, dotBoard, tickValues,
                state = scope.state,
                data = scope.data,
                xValue = function (d) { return d.x; },
                yValue = function (d) { return d.y; },
                sizeValue = function (d) { return !d.count ? 0 : Math.sqrt(d.count / Math.PI); },
                ready = false,
                terms = [],
                board = d3.select(elem[0]).append("svg").attr("height", 300),
                parent = elem[0].parentNode,
                margin = {top: 20, left: 30, right: 20, bottom: 20},
                
                
                
                /*Properties ----------------------------------------*/
                height = function () {
                    return 300;
                },
                
                width = function () {
                    return parent.clientWidth;
                },
                
                innerWidth = function () {
                    return width() - margin.left - margin.right;
                },
                innerHeight = function () {
                    return height() - margin.top - margin.bottom;
                },
                
                /* UI Events */
                onClick = function (d) {
                    d3.event.stopPropagation();
                    scope.select(d, d3.event);
                },
                
                categorical = function () {
                    if (!state.xMetric) {
                        return false;
                    }
                    return state.xMetric.categorical;
                },
                
                /*Actions -------------------------------------------*/
                filter = function () {
                    function accept(term) {
                        var ok = true;
                        return term.count >= state.limit;
                    }
                    dotBoard.selectAll(".dot").classed({hidden: function (d) {return !accept(d); }});
                },
                
                refreshDots = function () {
                    dotBoard.dotSet = dotBoard.selectAll(".dot").data(terms, function (d) { return d.key; });
                    dotBoard.dotSet
                        .enter()
                        .append("circle")
                        .attr("class", "dot")
                        .attr("r", 0)
                        .on("mouseover", scope.highlight)
                        .on("mouseout", scope.unHighlight)
                        .classed({hidden: function (d) { return isNaN(d.y); }})
                        .on("click", onClick)
                        .on("contextmenu", function (d) {
                            d3.event.preventDefault();
                            d3.event.stopPropagation();
                            scope.remove(d);
                        });
                    
                    dotBoard.dotSet
                        .exit()
                        .transition().duration(500)
                        .attr("r", 0)
                        .remove();
                    
                    dotBoard.selectAll(".dot").classed({
                        selected: function (d) { return d.selected; },
                        similar1: function (d) { return d.similar1; },
                        similar2: function (d) { return d.similar2; }
                    });
                },
            
                reOrder = function () {
                    terms.sort(function (a, b) {
                        if (a.selected === true && b.selected === true) {
                            return b.count - a.count;
                        }
                        if (a.selected) {
                            return 1;
                        }
                        if (b.selected) {
                            return -1;
                        }

                        if ((a.similar1 || a.similar2) && (b.similar1 || b.similar2)) {
                            return a.count - b.count;
                        }
                        if ((a.similar1 || a.similar2)) {
                            return 1;
                        }
                        if ((b.similar1 || b.similar2)) {
                            return -1;
                        }
                        return b.count - a.count;
                    });
                    
                    dotBoard.selectAll(".dot").remove();
                    refreshDots();
                    
                    filter();
                    dotBoard.selectAll(".dot").attr("r", function (d) { return isNaN(scales.size(sizeValue(d))) ? 0 : scales.size(sizeValue(d)); })
                            .attr("cx", function (d) { return scales.x()(xValue(d)); })
                            .attr("cy", function (d) { return isNaN(scales.y(yValue(d))) ? 0 : scales.y(yValue(d)); });
                    
                },
                
                
                reDraw = function () {
                    board.attr("width", width());
                    scales.y.range([innerHeight(), 0]);
                    
                    Utils.smooth(yAxis).call(axis.y);
                    Utils.smooth(xAxis).call(axis.x());
                    xAxis.label.text(state.xMetric.desc + ": " + state.xField.field);
                    yAxis.label.text(state.yMetric.desc + ": " + state.yField.field);
                    
                    if (categorical()) {
                        board.attr("height", height() + 300);
                        xAxis.selectAll("text")
                            .attr("transform", "rotate(-90) translate(-10, -12)")
                            .attr("style", "text-anchor:end");
                    }
                    
                    filter();
                    dotBoard.selectAll(".dot").attr("r", function (d) { return isNaN(scales.size(sizeValue(d))) ? 0 : scales.size(sizeValue(d)); })
                            .attr("cx", function (d) { return scales.x()(xValue(d)); })
                            .attr("cy", function (d) { return isNaN(scales.y(yValue(d))) ? 0 : scales.y(yValue(d)); });
                },
                
                
                
                showSiblings = function (word) {
                    if (categorical()) {
                        if (word) {
                            dotBoard.siblingSet = dotBoard.selectAll(".sibling").data(word.others.slice(1));
                            dotBoard.siblingSet
                                .enter()
                                .append("circle")
                                .attr("class", "sibling")
                                .attr("r", 0);

                            dotBoard.siblingSet
                                .exit()
                                .transition().duration(500)
                                .attr("r", 0)
                                .remove();

                            dotBoard.siblingSet.attr("r", function (d) { return isNaN(scales.size(sizeValue(d))) ? 0 : scales.size(sizeValue(d));  })
                                .attr("cx", function (d) { return scales.x()(xValue(d)); })
                                .attr("cy", function (d) { return scales.y(yValue(d)); });
                        } else {
                            if (dotBoard.siblingSet) {
                                dotBoard.siblingSet.remove();
                            }
                        }
                        
                    }
                },
                
                /*Events --------------------------------------------*/
                
                dataChanged = function () {
                   
                    if (categorical()) {
                        tickValues = scope.data.global.x.map(function (d) { return d.key; });
                        scales.xCategorical.domain(tickValues);
                        axis.xCategorical.scale(scales.xCategorical)
                            .tickValues(tickValues);
                    } else {
                        scales.xNumber.domain([scope.data.stats.x.min, scope.data.stats.x.max]);
                    }
                    scales.y.domain([scope.data.stats.y.min, scope.data.stats.y.max]);
                    
                    scales.size.domain([Math.sqrt(scope.data.stats.count.min / Math.PI), Math.sqrt(scope.data.stats.count.max / Math.PI)]);
                    
                    terms = scope.data.terms.slice(0);
                    
                    refreshDots();
                    
                    reDraw();
                },
            
                onHighlight = function () {
                    dotBoard.selectAll(".dot").classed({highlight: function (d) { return d.highlighted; }});
                    showSiblings(terms.find(function (d) { return d.highlighted; }));
                },
                
                onSelect = function () {
                    reOrder();
                    dotBoard.selectAll(".dot").classed({
                        selected: function (d) { return d.selected; },
                        similar1: function (d) { return d.similar1; },
                        similar2: function (d) { return d.similar2; }
                    });
                },
                
                onClear = function () {
                    reOrder();
                },
                
                register = function () {
                    scope.onHighlight.push(onHighlight);
                    scope.onUnHighlight.push(onHighlight);
                    scope.onSelect.push(onSelect);
                    scope.onClear.push(onClear);
                    scope.onDataUpdated.push(dataChanged);
                    scope.paramChange.push(filter);
                },
                
                build = function () {
                    board.on("click", function () {
                        if (d3.event.detail > 1) {
                            return;
                        }
                        scope.clearSelection();
                    });
                    /*Scales and Axis base----------------------------------------*/
                    scales = {
                        x: function () { return categorical() ? scales.xCategorical : scales.xNumber; },
                        xNumber: d3.scale.linear().range([0, innerWidth()]),
                        xCategorical: d3.scale.ordinal().rangePoints([0, innerWidth()]),
                        y: d3.scale.linear().range([innerHeight(), 0]),
                        size: d3.scale.linear().range([5, 20])
                    };
                    
                    axis = {
                        x: function () { return categorical() ? axis.xCategorical : axis.xNumeric; },
                        xNumeric: d3.svg.axis().scale(scales.x()).orient("bottom")
                                .innerTickSize(-innerHeight())
                                .tickPadding(10)
                                .outerTickSize(5),
                        xCategorical: d3.svg.axis().scale(scales.x()).orient("bottom")
                                .innerTickSize(-innerHeight())
                                .tickPadding(10)
                                .outerTickSize(5),
                        y: d3.svg.axis().scale(scales.y).orient("left")
                                .innerTickSize(-innerWidth())
                                .tickPadding(5)
                                .outerTickSize(3)
                    };
                    
                    /*Axis ---------------------------------------------------------*/
                    xAxis = board.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(" + margin.left + "," + (innerHeight() + margin.top) + ")")
                        .call(axis.x());
                    xAxis.label = xAxis
                        .append("text")
                          .attr("class", "label")
                          .attr("x", innerWidth())
                          .attr("y", -6)
                          .style("text-anchor", "end")
                          .text("");

                    yAxis = board.append("g")
                        .attr("class", "y axis")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                        .call(axis.y);
                    yAxis.label = yAxis
                        .append("text")
                          .attr("class", "label")
                          .attr("transform", "rotate(-90)")
                          .attr("y", 6)
                          .attr("dy", ".71em")
                          .style("text-anchor", "end")
                          .text("");
                    
                    dotBoard = board.append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                    
                    register();
                    ready = true;
                };
            build();
        }
    };
});

OpSense.directive("heatmap", function () {
    'use strict';
    return {
        restrict: "EA",
        scope: false,
        link: function (scope, elem, attrs) {
            var lines,
                state = scope.state,
                ready = false,
                terms = [],
                board = d3.select(elem[0]).append("svg").attr("height", 300),
                parent = elem[0].parentNode,
                margin = {top: 20, left: 30, right: 20, bottom: 20},
                squareSize = 10,
                squareSpace = 1,
                scales = {
                    y: d3.scale.ordinal(),
                    color: d3.scale.linear().range(['#e2f2f7', '#0bbaf4'])
                },
                /*Properties ----------------------------------------*/
                height = function () {
                    return 300;
                },
                
                width = function () {
                    return parent.clientWidth;
                },
                
                innerWidth = function () {
                    return width() - margin.left - margin.right;
                },
                innerHeight = function () {
                    return height() - margin.top - margin.bottom;
                },
                
                squarePadding = function () {
                    return squareSize + squareSpace;
                },
                
                getLinks = function () {
                    var
                        x = scope.data.terms.map(function (t) {
                            return t.key;
                        }),
                    
                        y = scope.data.global.x.map(function (t) {
                            return t.key;
                        });
                },
                categorical = function () {
                    if (!state.xMetric) {
                        return false;
                    }
                    return state.xMetric.categorical;
                },
                
                
                /* UI Actions -------------------------------------------*/
                refreshSquares = function () {
                    board.selectAll('.line').remove();
                    lines = board.selectAll('.line').data(scope.data.terms);
                    
                    lines.enter().append("g")
                        .attr("class", "line")
                        .attr("transform", function (d, i) { return "translate(" + margin.left + "," + (squareSize + squareSpace) * i + ")"; })
                        .each(function (dp, ip) {
                            d3.select(this).selectAll(".square").data(dp.others).enter()
                                .append("rect")
                                .attr("height", squareSize)
                                .attr("width", squareSize)
                                .attr("fill", function (d) {return scales.color(d.y); })
                                .classed({hidden: function (d) {return isNaN(d.y); }})
                                .attr("transform", function (d, i) { return "translate(" + scales.y(d.x)  + ",0)"; })
                                .on("mouseover", function (d) { scope.highlight(d); })
                                .on("mouseout", function (d) { scope.unHighlight(d); });
                        });
                        
                },
                
                /*Events ----------------------------------------*/
                dataChanged = function () {
                    if (categorical()) {
                        console.log(scope.data);
                        board.attr("height", scope.data.terms.length * squarePadding());
                        scales.y
                            .domain(scope.data.global.x.map(function (g, i) { return g.key; }))
                            .range(scope.data.global.x.map(function (g, i) { return i * squarePadding(); }));

                        scales.color.domain([scope.data.stats.y.min, scope.data.stats.y.max]);
                        console.log(scales.color.domain());
                        refreshSquares();
                    }
                },
                
                /* Build -------------------------------------------*/
                register = function () {
                    scope.onDataUpdated.push(dataChanged);
                },
                
                build = function () {
                    register();
                    ready = true;
                    board.attr("width", width());
                    
                };
            build();
        }
    };
});

OpSense.directive("heatmapMultiple", function () {
    'use strict';
    return {
        restrict: "EA",
        scope: false,
        link: function (scope, elem, attrs) {
            var categories,
                state = scope.state,
                ready = false,
                terms = [],
                board = d3.select(elem[0]).append("div").attr("id", "heatMapMultiple").attr("height", 300),
                parent = elem[0].parentNode,
                margin = {top: 20, left: 30, right: 20, bottom: 20},
                squareSize = 10,
                squareSpace = 1,
                
                scales = {
                    y: d3.scale.ordinal(),
                    color: d3.scale.linear().range(['#e2f2f7', '#0bbaf4'])
                },
                /*Properties ----------------------------------------*/
                height = function () {
                    return 300;
                },
                
                width = function () {
                    return parent.clientWidth;
                },
                
                innerWidth = function () {
                    return width() - margin.left - margin.right;
                },
                innerHeight = function () {
                    return height() - margin.top - margin.bottom;
                },
                
                squarePadding = function () {
                    return squareSize + squareSpace;
                },
                
                squarePerLine = function () {
                    return 20;
                },
                
                getLinks = function () {
                    var
                        x = scope.data.terms.map(function (t) {
                            return t.key;
                        }),
                    
                        y = scope.data.global.x.map(function (t) {
                            return t.key;
                        });
                },
                categorical = function () {
                    if (!state.xMetric) {
                        return false;
                    }
                    return state.xMetric.categorical;
                },
                
                termsKeys = function () {
                    return scope.data.terms.map(function (t) {
                        return t.key;
                    });
                },
                
                catKeys = function () {
                    return scope.data.global.x.map(function (g, i) { return g.key; });
                },
                
                getY = function (term, category) {
                    var sel = scope.data.terms.find(function (t) {
                        return t.key === term;
                    }).others.find(function (tc) {
                        return tc.x === category;
                    });
                    return sel ? sel.y : 0;
                },
                
                /* UI Actions -------------------------------------------*/
                refreshSquares = function () {
                    board.selectAll('.category').remove();
                    categories = board.selectAll('.category').data(catKeys());
                    
                    var cats = categories.enter().append("div")
                        .attr("class", "category");
                    cats.append("span").text(function (d) {return d; });
                    cats
                        .each(function (dp, ip) {
                            d3.select(this).selectAll(".square").data(termsKeys()).enter()
                                .append("div")
                                .attr("class", "square")
                                .style("background-color", function (d) { return scales.color(getY(d, dp)); })
                                .on('mouseover', function (d) {
                                    var term = scope.data.terms.find(function (t) {
                                        return t.key === d;
                                    });
                                    scope.highlight(term);
                                })
                                .on('mouseleave', function (d) {
                                    var term = scope.data.terms.find(function (t) {
                                        return t.key === d;
                                    });
                                    scope.unHighlight(term);
                                });
                        });
                        
                },
                
                /*Events ----------------------------------------*/
                dataChanged = function () {
                    if (categorical()) {
                        console.log(scope.data);
                        board.attr("height", scope.data.terms.length * squarePadding());
                        
                        scales.color.domain([scope.data.stats.y.min, scope.data.stats.y.max]);
                        refreshSquares();
                    }
                },
                
                onHighlight = function () {
                    var key = "";
                    if (scope.state.highlighted) {
                        key = scope.state.highlighted.key;
                    }
                    board.selectAll(".square").classed({highlighted: function (d) { return d === key; }});
                    
                },
                
                /* Build -------------------------------------------*/
                register = function () {
                    scope.onDataUpdated.push(dataChanged);
                    scope.onHighlight.push(onHighlight);
                    scope.onUnHighlight.push(onHighlight);
                },
                
                build = function () {
                    console.log("building");
                    register();
                    ready = true;
                    board.attr("width", width());
                    
                };
            build();
        }
    };
});

OpSense.directive("vizBase", function () {
    'use strict';
    return {
        restrict: "EA",
        scope: false,
        link: function (scope, elem, attrs) {
            var ready = false,
                data = scope.data,
                state = scope.sate,
            
                build = function () {
                    ready = true;
                },
            
                reDraw = function () {
                },
            
                dataChanged = function () {
                },
            
                register = function () {
                    scope.onHighlight.push(reDraw);
                    scope.onUnHighlight.push(reDraw);
                    scope.onSelect.push(reDraw);
                    scope.onClear.push(reDraw);
                    scope.onDataUpdated.push(dataChanged);
                };
        }
    };
});
