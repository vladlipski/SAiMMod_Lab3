'use strict';

var p1, p2;
function findWhere(array, condition) {
    for (var i = 0; i < array.length; i++) {
        var obj = array[i],
            key = Object.keys(condition)[0],
            value = condition[key];

        if (obj[key] === value) {
            return obj;
        }
    }
    return undefined;
}

function substitute(formula) {
    var f = formula;
    f = f.replace(/p1/g, p1);
    f = f.replace(/p2/g, p2);

    f = (new Function('', 'return ' + f))();

    f = f.toFixed(2);

    return f;
}

function evaluateTree(tree) {
    var map = [];

    Object.keys(tree).forEach(function (state) {
        var nodes = tree[state];
        var row = {
            state: state,
            nodes: []
        };

        nodes.forEach(function (node) {

            row.nodes.push({
                state: node.state,
                value: Number(substitute(node.formula))
            });

        });

        map.push(row);
    });

    return map;
}

function tableizeMap(map) {
    var tableMap = [];

    map.forEach(function (outerItem) {

        var nodes = outerItem.nodes;
        var values = [];

        map.forEach(function (innerItem) {

            var node = findWhere(nodes, { state: innerItem.state });
            if (node) {
                values.push({
                    state: innerItem.state,
                    value: node.value
                });
            } else {
                values.push({
                    state: null,
                    value: 0
                });
            }

        });

        tableMap.push({
            state: outerItem.state,
            nodes: values
        });
    });

    return tableMap;
}



$('#generate').on('click', function() {
    var initialState = '2000n';
    p1 = parseFloat($('#p1').val());
    p2 = parseFloat($('#p2').val());

    var customTree = {"1000n":[{"state":"2100n","formula":"1"}],"1001n":[{"state":"2101n","formula":"p2"},{"state":"2100n","formula":"(1 - p2)"}],"1011n":[{"state":"2111n","formula":"p2"},{"state":"2101n","formula":"(1 - p2)"}],"1100n":[{"state":"0100n","formula":"p1"},{"state":"2101n","formula":"(1 - p1)"}],"1x11n":[{"state":"2111n","formula":"(1 - p2)"},{"state":"0x11n","formula":"p2"}],"1101n":[{"state":"0101n","formula":"p1 * p2"},{"state":"2111n","formula":"(1 - p1) * p2"},{"state":"0100n","formula":"p1 * (1 - p2)"},{"state":"2101n","formula":"(1 - p1) * (1 - p2)"}],"1111n":[{"state":"0101n","formula":"p1 * (1 - p2)"},{"state":"2111n","formula":"(1 - p1) * (1 - p2)"},{"state":"0111n","formula":"p1 * p2"},{"state":"0x11n","formula":"(1 - p1) * p2"}],"2000n":[{"state":"1000n","formula":"1"}],"2100n":[{"state":"1100n","formula":"p1"},{"state":"1001n","formula":"(1 - p1)"}],"2101n":[{"state":"1101n","formula":"p1 * p2"},{"state":"1011n","formula":"(1 - p1) * p2"},{"state":"1100n","formula":"p1 * (1 - p2)"},{"state":"1001n","formula":"(1 - p1) * (1 - p2)"}],"2111n":[{"state":"1101n","formula":"p1 * (1 - p2)"},{"state":"1011n","formula":"(1 - p1) * (1 - p2)"},{"state":"1111n","formula":"p1 * p2"},{"state":"1x11n","formula":"(1 - p1) * p2"}],"0100n":[{"state":"0100n","formula":"p1"},{"state":"2101n","formula":"(1 - p1)"}],"0x11n":[{"state":"2111n","formula":"(1 - p2)"},{"state":"0x11n","formula":"p2"}],"0101n":[{"state":"0101n","formula":"p1 * p2"},{"state":"2111n","formula":"(1 - p1) * p2"},{"state":"0100n","formula":"p1 * (1 - p2)"},{"state":"2101n","formula":"(1 - p1) * (1 - p2)"}],"0111n":[{"state":"0101n","formula":"p1 * (1 - p2)"},{"state":"2111n","formula":"(1 - p1) * (1 - p2)"},{"state":"0111n","formula":"p1 * p2"},{"state":"0x11n","formula":"(1 - p1) * p2"}]};
    var evaluatedMap = evaluateTree(customTree);
    var tableizedMap = tableizeMap(evaluatedMap);

    var rangeMap = tableizedMap.map(function (tableRow) {
        var ranges = [];
        var top = 0, bottom = 0;

        tableRow.nodes.forEach(function (tableNode) {
            if (!tableNode.value) { return; }

            bottom = top;
            top = Number((top + tableNode.value).toFixed(2));

            ranges.push({
                state: tableNode.state,
                bottom: bottom,
                top: top
            });
        });

        return {
            state: tableRow.state,
            count: 0,
            ranges: ranges
        };
    });

    function move(steps, state) {
        steps = steps || 10;

        var moves = [],
            currentState = state,
            ranges,
            randomNumber,
            move;

        for (var i = 0; i < steps; i++) {

            randomNumber = Math.random();

            var currentStateObject = findWhere(rangeMap, { state: currentState });
            currentStateObject.count++;
            ranges = currentStateObject.ranges;
            var move = {
                fromState: currentState,
                randomNumber: randomNumber
            };

            ranges.forEach(function (range) {
                if (range.top < randomNumber || range.bottom > randomNumber) {
                    return;
                }

                currentState = range.state;
                move.top = range.top;
                move.bottom = range.bottom;
                move.toState = range.state;
            });

            moves.push(move);
        }

        return moves;
    }

    var iterations = $('#iterations').val();

    var moves = move(iterations, initialState);

    rangeMap = rangeMap.map(function (stateObject) {
        stateObject.probability =  stateObject.count/iterations;
        $('#values').val($('#values').val() + "\n" + "State: " + stateObject.state.slice(0, -1)
            + "     P = " + stateObject.probability);
        return stateObject;
    });

    function findProbability(state) {
        return rangeMap.find(function (stateObject) {
            return stateObject.state === state;
        }).probability;
    }
    var A = (1 - p1) * (findProbability("1101n") + findProbability("1001n") + findProbability("1111n")
        + findProbability("1011n") + findProbability("2111n") + findProbability("0111n") + findProbability("0101n")
        + findProbability("2101n") + findProbability("1x11n") + findProbability("0x11n"));
    var L = findProbability("1111n") + findProbability("1011n") + findProbability("2111n")
    + findProbability("0111n") + findProbability("1x11n") + findProbability("0x11n");
    var W = (2 * findProbability("1101n") + findProbability("1001n") + 3 * findProbability("1111n")
    + 2 * findProbability("1011n") + 3 * findProbability("2111n") + 3 * findProbability("0111n")
    + 2 * findProbability("0101n") + findProbability("2100n") + findProbability("1100n")
    + 2 * findProbability("2101n") + 3 * findProbability("1x11n") + 3 * findProbability("0x11n")
    + findProbability("0100n")) / A;

    $('#a').html(A);
    $('#l').html(L);
    $('#w').html(W);
});
