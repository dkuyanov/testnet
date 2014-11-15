var app = angular.module("TestNetApp", []);

app.controller("TestNetController", function($scope, $http, $filter) {
    $scope.nodes = [];
    $scope.map = [];
    $scope.n = 0;

    var events = [];
    var filter = $filter("orderBy");
    var currentTime = 0;

    $scope.recreateNodes = function() {
        createMap();
        $scope.nodes = [];
        for (var i = 0; i < $scope.n; i++) {
            addNode(i);
        }
    };

    $scope.pathChanged = function (from, to) {
        if ($scope.map[from][to].val == 0 || $scope.map[from][to].val === "") {
            $scope.map[from][to].val = null;
        }
        $scope.map[to][from].val = $scope.map[from][to].val;
        pathChanged(from, to);
        pathChanged(to, from);
        loopEvents();
    };

    function loopEvents() {
        events = filter(events, "time");
        while (events.length > 0) {
            var currentEvent = events.pop();
            var fun = currentEvent.fun;
            var args = currentEvent.args;
            currentTime = currentEvent.time;
            fun(args[0], args[1], args[2], args[3], args[4]);
            events = filter(events, "time");
        }
    }

    // Событие 1 / 2
    function pathChanged(from, to) {
        var newPath = parseInt($scope.map[from][to].val);
        if (isNaN(newPath))
            newPath = null;
        var oldPath = parseInt($scope.nodes[from].costTable[to][to].dist);
        if (oldPath != newPath) {
            $scope.nodes[from].costTable[to][to].dist = newPath;
            changeMin(from, to);
        }
    }
    
    function changeMin(from, to) {
        var min = null;
        var next = null;
        for (var i = 0; i < $scope.n; i++) {
            if(i == from)
                continue;
            var dist = $scope.nodes[from].costTable[to][i].dist;
            if (min == null || (dist != null && dist < min)) {
                min = dist;
                next = i + 1;
            }
        }
        var oldMin = $scope.nodes[from].distTable[to].dist;
        if (min == null) {
            next = null;
        }
        $scope.nodes[from].distTable[to].next = next;
        $scope.nodes[from].distTable[to].dist = min;
        if (oldMin != min)
            sendDistChangeMessage(from, to, min);
    }

    function sendDistChangeMessage(from, to, dist) {
        var messageText = "от узла " + (from + 1) + " [" + (to + 1) + "; " + dist + "]";
        for (var i = 0; i < $scope.n; i++) {
            if (i == from)
                continue;
            if ($scope.map[from][i].val != null && $scope.map[from][i].val != 0) {
                $scope.nodes[from].outputMessages.push(messageText + " в узел " + (i + 1));
                var time = currentTime + $scope.map[from][i].val;
                addEvent(time, receiveDistChangeMessage, [i, from, to, dist, messageText]);
            }
        }
    }

    // Событие 3
    function receiveDistChangeMessage(nodeIndex, from, to, dist, messageText) {
        if (nodeIndex == to) {
            $scope.nodes[nodeIndex].inputMessages.push(messageText + " отклонено");
        } else {
            $scope.nodes[nodeIndex].inputMessages.push(messageText + " принято");
            var distToFrom = $scope.nodes[nodeIndex].costTable[from][from].dist;
            $scope.nodes[nodeIndex].costTable[to][from].dist = dist + distToFrom;
            changeMin(nodeIndex, to);
        }
    }

    function createMap() {
        $scope.map = [];
        for (var i = 0; i < $scope.n; i++) {
            $scope.map[i] = [];
            for (var j = 0; j < $scope.n; j++) {
                $scope.map[i].push({
                    from: i,
                    to: j,
                    val: null
                });
            }
        }
    }

    function addEvent(time, fun, args) {
        events.push({
            time: time,
            fun: fun,
            args: args
        });
    }

    function addNode(index) {
        var node = {
            costTable: [],
            distTable: [],
            inputMessages: [],
            outputMessages: []
        };
        for (var i = 0; i < $scope.n; i++) {
            if(i == index)
                continue;
            node.costTable[i] = [];
            for (var j = 0; j < $scope.n; j++) {
                if(j == index)
                    continue;
                node.costTable[i][j] = addRowCost(i+1, j+1, null);
            }
            node.distTable[i] = addRowCost(i+1, null, null);
        }
        $scope.nodes.push(node);
    };
    
    function addRowCost(i, j, cost) {
        return {
            to: i,
            next: j,
            dist: cost
        };
    }
})