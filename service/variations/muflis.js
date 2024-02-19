let _ = require('underscore');

let commonVariation = require('./common');

function Muflis() {
    let _options = {
        wininingPriority: {
            cardType: {
                "spade": {
                    priority: 1
                },
                "heart": {
                    priority: 2
                },
                "diamond": {
                    priority: 3
                },
                "club": {
                    priority: 4
                }
            },
            setType: {
                "highcard": {
                    type: 'highcard',
                    displayName: 'Low Card',
                    priority: 6
                },
                "pair": {
                    type: 'pair',
                    displayName: 'Pair',
                    priority: 5
                },
                "color": {
                    type: 'color',
                    displayName: 'Color',
                    priority: 4
                },
                "sequence": {
                    type: 'sequence',
                    displayName: 'Sequence',
                    priority: 3
                },
                "puresequence": {
                    type: 'puresequence',
                    displayName: 'Pure Sequence',
                    priority: 2
                },
                "trail": {
                    type: 'trail',
                    displayName: 'Trail',
                    priority: 1
                }
            }
        }
    }

    function compareTrail(sets, setProp) {
        let result = _.min(sets, function(obj) {
            return obj[setProp][0].priority;
        });
        return result;
    }

    function compareHighCard(sets, setProp) {
        let lowSet = sets[0];
        for (let count = 1, len = sets.length; count < len; count++) {
            let set2 = sets[count];
            if (!commonVariation.isHighSet(_options, set2[setProp], lowSet[setProp])) {
                lowSet = set2;
            }
        }
        return lowSet;
    }
    
    function compareColor(sets, setProp) {
        let lowSet = sets[0];
        for (let count = 1, len = sets.length; count < len; count++) {
            let set2 = sets[count];
            if (!commonVariation.isHighColor(_options, set2[setProp], lowSet[setProp])) {
                lowSet = set2;
            }
        }
        return lowSet;
    }

    function comparePair(sets, setProp) {
        let lowSet = sets[0];
        for (let count = 1, len = sets.length; count < len; count++) {
            let set2 = sets[count];
            if (!commonVariation.isHighPair(_options, set2[setProp], lowSet[setProp])) {
                lowSet = set2;
            }
        }
        return lowSet;
    }

    function compareSequence(sets, setProp) {
        let lowSet = sets[0];
        for (let count = 1, len = sets.length; count < len; count++) {
            let set2 = sets[count];
            if (!commonVariation.isHighSequence(_options, set2[setProp], lowSet[setProp])) {
                lowSet = set2;
            }
        }
        return lowSet;
    }

    function getGreatestFromType(type, sets, setProp) {
        setProp = setProp || 'set';
        switch (type) {
            case 'trail':
                return compareTrail(sets, setProp);
                break;
            case 'highcard':
                return compareHighCard(sets, setProp);
                break;
            case 'color':
                return compareColor(sets, setProp);
                break;
            case 'pair':
                return comparePair(sets, setProp);
                break;
            case 'sequence':
            case 'puresequence':
                return compareSequence(sets, setProp);
                break;
        }
        return sets[0];
    }

    this.getGreatest = function(sets, setProp) {
        setProp = setProp || 'set';
        let arrNew = [],
            sorted,
            maxP = -1;
        for (let count = 0, len = sets.length; count < len; count++) {
            let setType = commonVariation.getSetType(_options, sets[count][setProp]);
            sets[count].type = setType.type;
            sets[count].typeName = setType.displayName;
            arrNew.push({
                type: setType.type,
                typeName: setType.displayName,
                priority: commonVariation.getSetType(_options, sets[count][setProp]).priority,
                set: sets[count]
            });
        }
        
        sorted = _.sortBy(arrNew, 'priority').reverse();
        maxP = sorted[0].priority;
        let typeLeft = _.where(sorted, {
            priority: maxP
        });

        let winner = sorted[0].set;
        if (typeLeft.length > 1) {
            winner = getGreatestFromType(typeLeft[0].type, _.map(typeLeft, function(a) {
                return a.set;
            }));
        }
        
        return _.map(sets, function (set) {
            let isWinner = false;
            if (set.id === winner.id) {
                isWinner = true;
            } else if (winner.type === set.type) {
                let matchWithWinner = winner[setProp].filter(winnerset => set[setProp].some(newSet => winnerset.priority === newSet.priority));
                if (matchWithWinner.length === 3) {
                    isWinner = true;
                }
            }
            return {
                set,
                winner: isWinner
            }
        });
    }
}
module.exports = new Muflis();