/*global angular, d3 */
var OpSense = angular.module('OpSense', ['OpServices', 'ngSanitize']);


OpSense.controller('mainCtrl', function ($scope, db, $sce) {
    'use strict';
/* State ----------------------------------------------------------------------- */
    $scope.state = {};
    var state = $scope.state;
    
    $scope.resetState = function () {
        $scope.state = {};
        state = $scope.state;
    };
    
/* Constants ----------------------------------------------------------------------- */
    $scope.indices = [
        { index: "yelphealth", desc: "Yelp Health", type: "documents", init: {xField: "document.stars", xMetric: "avg", yField: "document.stars", yMetric: "variance", pattern: "", search: ""}},
        { index: "myworld2", desc: "My World", type: "documents", init: {xMetric: "terms", xField: "document.priorities", yField: "document.id", yMetric: "value_count", pattern: "", search: ""}}
    ];
    
    $scope.metrics = [
        { metric: "avg", categorical: false, desc: "Average", allowed: ['long', 'float', 'double'], x: true, y: true },
        { metric: "min", categorical: false, desc: "Min", allowed: ['long', 'float', 'double'], x: true, y: true },
        { metric: "max", categorical: false, desc: "Max", allowed: ['long', 'float', 'double'], x: true, y: true },
        { metric: "sum", categorical: false, desc: "Sum", allowed: ['long', 'float', 'double'], x: true, y: true },
        { metric: "value_count", categorical: false, desc: "Count", allowed: ['long', 'float', 'double', 'string'], x: true, y: true },
        { metric: "variance", categorical: false, desc: "Variance", allowed: ['long', 'float', 'double'], x: true, y: true },
        { metric: "terms", categorical: true, desc: "Categories", allowed: ['long', 'string'], x: true, y: false }
    ];
    
    $scope.termSortOptions = [
        { field: 'count', reverse: true, desc: 'Count (dec)' },
        { field: 'key', reverse: false, desc: 'Lexicographic' },
        { field: 'x', reverse: false, desc: "" },
        { field: 'y', reverse: false, desc: "" }
    ];
    
/* Constructor ----------------------------------------------------------------------- */
    $scope.init = function () {
        /* Set defaults */
        state.index = $scope.indices[1];
        state.termSort = $scope.termSortOptions[0];
        state.visualization = 'heatMapMultiple';
        $scope.fields = [];
        $scope.loading = 0;
        
        db.params({
            host: "vgc.poly.edu/projects/r2sense",
            user: "user",
            password: "123456"
        });
    };
    
/*Properties  ----------------------------------------------------------------------- */
    $scope.allowedMetrics = function (type) {
        return $scope.metrics.filter(function (i) {
            return i.allowed.indexOf(type) >= 0;
        });
    };
    
    $scope.selectedTerms = function () {
        if (!$scope.data || !$scope.data.terms) {
            return 0;
        }
        return $scope.data.terms.filter(function (term) { return term.selected; });
    };
    
    $scope.context = function () {
        var dataContext = {
            search: state.search || "",
            pattern: state.pattern || "",
            xField: state.xField,
            xMetric: state.xMetric,
            yField: state.yField,
            yMetric: state.yMetric
        };
        return dataContext;
    };
    
    $scope.filteredTerms = function () {
        if (!$scope.data) {
            return [];
        }
        return $scope.data.terms.filter(function (term) {
            return term.count >= state.limit
                && term.key.indexOf(state.termFilter) > -1;
        });
    };
    
    $scope.trustHTML = function (html) {
        return $sce.trustAsHtml(html);
    };
    
    $scope.dataStats = function () {
        var result = {
            x: {
                max: d3.max($scope.data.terms, function (t) {return t.x; }),
                min: d3.min($scope.data.terms, function (t) {return t.x; })
            },
            y: {
                max: d3.max($scope.data.terms, function (t) {return t.y; }),
                min: d3.min($scope.data.terms, function (t) {return t.y; })
            },
            count: {
                max: d3.max($scope.data.terms, function (t) {return t.count; }),
                min: d3.min($scope.data.terms, function (t) {return t.count; })
            }
        };
        
        return result;
    };
    
/* Data Events ----------------------------------------------------------------------- */
    $scope.onIndexChange = function () {
        db.params({index: state.index});
        
        state.limit = 0;
        state.termFilter = "";
        
        state.search = state.index.init.search;
        state.pattern = state.index.init.pattern;
        
        
        $scope.loadMetadata().then(function () {
            state.xField = state.fields.find(function (field) {
                return field.field === state.index.init.xField.split('.')[1] && field.group === state.index.init.xField.split('.')[0];
            });
            
            state.yField = state.fields.find(function (field) {
                return field.field === state.index.init.yField.split('.')[1] && field.group === state.index.init.yField.split('.')[0];
            });
            
            state.xMetric = $scope.metrics.find(function (metric) {
                return metric.metric === state.index.init.xMetric;
            });
            
            state.yMetric = $scope.metrics.find(function (metric) {
                return metric.metric === state.index.init.yMetric;
            });
            
            $scope.loadData();
        });
    };
    
    $scope.onxMetricChange = function (newValue, oldValue) {
        $scope.termSortOptions.find(function (d) {return d.field === "x"; }).desc = state.xMetric ? state.xMetric.desc : "";
    };
    
    $scope.onyMetricChange = function (newValue, oldValue) {
        $scope.termSortOptions.find(function (d) {return d.field === "y"; }).desc = state.yMetric ? state.yMetric.desc : "";
    };
    
    $scope.onSelectedCountChange = function (newValue, oldValue) {
        document.getElementById("termList").style.top = (100 + newValue * 19 + (newValue > 0 ? 20 : 0)) + "px";
    };
    
    $scope.onSelectedChange = function () {
        $scope.selectSimilar();
        db.getDocuments($scope.context(), $scope.selectedTerms()).then(function (docs) {
            $scope.data.documents = docs;
        });
        $scope.emit($scope.onSelect);
        $scope.refresh();
    };
    
    $scope.onLimitChange = function () {
        $scope.emit($scope.paramChange);
        $scope.refresh();
    };
    
/* Data Actions ----------------------------------------------------------------------- */
    $scope.loadMetadata = function () {
        $scope.loading += 1;
        return db.getMetaData().then(function (result) {
            state.fields = result;
            $scope.loading -= 1;
            return state.fields;
        });
    };
    
    $scope.loadData = function () {
        $scope.loading += 1;
        db.getData($scope.context()).then(function (data) {
            $scope.data = data;
            $scope.dataChanged();
            $scope.loading -= 1;
        });
    };
    
    $scope.reset = function () {
        $scope.onIndexChange();
    };
    
    $scope.refresh = function () {
        if (!$scope.$$phase) { $scope.$apply(); }
    };
    
/* UI Events ----------------------------------------------------------------------- */
    $scope.$watch(function () { return state.index; }, $scope.onIndexChange);
    $scope.$watch(function () { return state.xMetric; }, $scope.onxMetricChange);
    $scope.$watch(function () { return state.yMetric; }, $scope.onyMetricChange);
    $scope.$watch(function () { return state.limit; }, $scope.onLimitChange);
    
    $scope.$watch(function () { return $scope.selectedTerms().length; }, $scope.onSelectedCountChange);
    $scope.dataChanged = function () {
        $scope.data.stats = $scope.dataStats();
        $scope.emit($scope.onDataUpdated);
    };
    $scope.onRemove = [];
    $scope.onSelect = [];
    $scope.onClear = [];
    $scope.onHighlight = [];
    $scope.onUnHighlight = [];
    $scope.onDataUpdated = [];
    $scope.paramChange = [];
    $scope.emit = function (arr) {
        arr.forEach(function (func) {func(); });
    };
    
    
/* UI Actions ----------------------------------------------------------------------- */
    $scope.clearSelection = function (prevent) {
        $scope.data.terms.forEach(function (term) {
            term.selected = false;
        });
        if (!prevent) {
            $scope.onSelectedChange();
        }
    };
    
    $scope.removeSelected = function () {
        $scope.selectedTerms().forEach(function (term) {
            $scope.remove(term, true);
        });
        $scope.dataChanged();
        $scope.selectSimilar();
        $scope.emit($scope.onRemove);
        $scope.refresh();
    };
    
    $scope.remove = function (term, prevent) {
        var idx = $scope.data.terms.findIndex(function (t) {
            return t.key === term.key;
        });
        $scope.data.terms.splice(idx, 1);
        if (!prevent) {
            $scope.selectSimilar();
            $scope.dataChanged();
            $scope.emit($scope.onRemove);
            $scope.refresh();
        }
    };
    
    $scope.select = function (term, event) {
        if (!event.shiftKey) {
            $scope.clearSelection(true);
        }
        term.selected = true;
        $scope.onSelectedChange();
        $scope.refresh();
    };
    
    $scope.unSelect = function (term) {
        term.selected = false;
        $scope.refresh();
    };
    
    $scope.selectSimilar = function () {
        
        var s1 = {}, s2 = {},
            selected = $scope.selectedTerms();
        if (!selected) {
            return;
        }
        
        selected.forEach(function (term) {
            var split = term.key.split(" ");
            if (split[0]) {
                s1[split[0]] = 1;
            }
            if (split[1]) {
                s2[split[1]] = 1;
            }
        });
        
        $scope.data.terms.forEach(function (term) {
            if (!term.selected) {
                var split = term.key.split(" ");

                if (split[0] && Object.keys(s1).indexOf(split[0]) > -1) {
                    term.similar1 = true;
                } else {
                    term.similar1 = false;
                }
                if (split[1] && Object.keys(s2).indexOf(split[1]) > -1) {
                    term.similar2 = true;
                } else {
                    term.similar2 = false;
                }
            }
        });
    };
    
    $scope.highlight = function (term) {
        term.highlighted = true;
        state.highlighted = term;
        $scope.emit($scope.onHighlight);
        $scope.refresh();
    };
    
    $scope.unHighlight = function (term) {
        term.highlighted = false;
        state.highlighted = undefined;
        $scope.emit($scope.onUnHighlight);
        $scope.refresh();
    };
    
});

OpSense.directive('ngEnter', function () {
    'use strict';
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});

OpSense.directive('ngRightClick', function ($parse) {
    'use strict';
    return function (scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function (event) {
            scope.$apply(function () {
                event.preventDefault();
                fn(scope, {$event: event});
            });
        });
    };
});