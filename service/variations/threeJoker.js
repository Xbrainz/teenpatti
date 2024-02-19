var _ = require("underscore");
var Card = require("../card");

function ThreeJoker() {
  var _options = {
    wininingPriority: {
      cardType: {
        spade: {
          priority: 4,
        },
        heart: {
          priority: 3,
        },
        diamond: {
          priority: 2,
        },
        club: {
          priority: 1,
        },
      },
      setType: {
        highcard: {
          type: "highcard",
          displayName: "High Card",
          priority: 1,
        },
        pair: {
          type: "pair",
          displayName: "Pair",
          priority: 2,
        },
        color: {
          type: "color",
          displayName: "Color",
          priority: 3,
        },
        sequence: {
          type: "sequence",
          displayName: "Sequence",
          priority: 4,
        },
        puresequence: {
          type: "puresequence",
          displayName: "Pure Sequence",
          priority: 5,
        },
        trail: {
          type: "trail",
          displayName: "Trail",
          priority: 6,
        },
      },
    },
  };

  function isTrail(cardSet) {
    return (
      cardSet[0].rank === cardSet[1].rank && cardSet[2].rank === cardSet[0].rank
    );
  }

  function isPureSeq(cardSet) {
    var sorted = _.sortBy(cardSet, "priority");
    var sortedRank = _.sortBy(cardSet, "rank");
    return (
      ((sorted[0].priority + 1 === sorted[1].priority &&
        sorted[1].priority + 1 === sorted[2].priority) ||
        (sortedRank[0].rank + 1 === sortedRank[1].rank &&
          sortedRank[1].rank + 1 === sortedRank[2].rank)) &&
      sorted[0].type === sorted[1].type &&
      sorted[1].type === sorted[2].type
    );
  }

  function isSeq(cardSet) {
    var sorted = _.sortBy(cardSet, "priority");
    var sortedRank = _.sortBy(cardSet, "rank");
    return (
      (sorted[0].priority + 1 === sorted[1].priority &&
        sorted[1].priority + 1 === sorted[2].priority) ||
      (sortedRank[0].rank + 1 === sortedRank[1].rank &&
        sortedRank[1].rank + 1 === sortedRank[2].rank)
    );
  }

  function isColor(cardSet) {
    return (
      cardSet[0].type === cardSet[1].type && cardSet[1].type === cardSet[2].type
    );
  }

  function isPair(cardSet) {
    return (
      cardSet[0].rank === cardSet[1].rank ||
      cardSet[1].rank === cardSet[2].rank ||
      cardSet[0].rank === cardSet[2].rank
    );
  }

  this.getSetType = function (cardSet) {
    // console.log(cardSet)
    if (isTrail(cardSet)) {
      return _options.wininingPriority.setType.trail;
    }
    if (isPureSeq(cardSet)) {
      return _options.wininingPriority.setType.puresequence;
    }
    if (isSeq(cardSet)) {
      return _options.wininingPriority.setType.sequence;
    }
    if (isColor(cardSet)) {
      return _options.wininingPriority.setType.color;
    }
    if (isPair(cardSet)) {
      return _options.wininingPriority.setType.pair;
    }
    return _options.wininingPriority.setType.highcard;
  };

  function compareTrail(sets, setProp) {
    var result = _.max(sets, function (obj) {
      return obj[setProp][0].priority;
    });
    return result;
  }

  function isHighSet(set1, set2) {
    var set1D = _.sortBy(set1, "priority").reverse();
    var set2D = _.sortBy(set2, "priority").reverse();
    if (set1D[0].priority > set2D[0].priority) {
      return true;
    } else if (set1D[0].priority < set2D[0].priority) {
      return false;
    } else {
      if (set1D[1].priority > set2D[1].priority) {
        return true;
      } else if (set1D[1].priority < set2D[1].priority) {
        return false;
      } else {
        if (set1D[2].priority > set2D[2].priority) {
          return true;
        } else if (set1D[2].priority < set2D[2].priority) {
          return false;
        } else {
          return (
            _options.wininingPriority.cardType[set1D[2].type].priority >
            _options.wininingPriority.cardType[set2D[2].type].priority
          );
        }
      }
    }

    return true;
  }

  function compareHighCard(sets, setProp) {
    var firstSet,
      highSet = sets[0];
    for (var count = 1, len = sets.length; count < len; count++) {
      var set2 = sets[count];
      if (isHighSet(set2[setProp], highSet[setProp])) {
        highSet = set2;
      }
    }
    return highSet;
  }

  function isHighColor(set1, set2) {
    var set1D = _.sortBy(set1, "priority").reverse();
    var set2D = _.sortBy(set2, "priority").reverse();
    if (set1D[0].priority > set2D[0].priority) {
      return true;
    } else if (set1D[0].priority < set2D[0].priority) {
      return false;
    } else {
      if (set1D[1].priority > set2D[1].priority) {
        return true;
      } else if (set1D[1].priority < set2D[1].priority) {
        return false;
      } else {
        if (set1D[2].priority > set2D[2].priority) {
          return true;
        } else if (set1D[2].priority < set2D[2].priority) {
          return false;
        } else {
          return (
            _options.wininingPriority.cardType[set1D[2].type].priority >
            _options.wininingPriority.cardType[set2D[2].type].priority
          );
        }
      }
    }
    return true;
  }

  function compareColor(sets, setProp) {
    var firstSet,
      highSet = sets[0];
    for (var count = 1, len = sets.length; count < len; count++) {
      var set2 = sets[count];
      if (isHighColor(set2[setProp], highSet[setProp])) {
        highSet = set2;
      }
    }
    return highSet;
  }

  function getPairRank(set) {
    if (set[0].priority === set[1].priority) {
      return set[0].priority;
    } else if (set[1].priority === set[2].priority) {
      return set[1].priority;
    } else if (set[0].priority === set[2].priority) {
      return set[0].priority;
    }
    return -1;
  }

  function getOddCardForPair(set) {
    if (set[0].priority === set[1].priority) {
      return set[2];
    } else if (set[1].priority === set[2].priority) {
      return set[0];
    } else if (set[0].priority === set[2].priority) {
      return set[1];
    }
  }

  function isHighPair(set1, set2) {
    var pair1Rank = getPairRank(set1);
    var pair2Rank = getPairRank(set2);
    var last1Card = getOddCardForPair(set1);
    var last2Card = getOddCardForPair(set2);
    if (pair1Rank > pair2Rank) {
      return true;
    } else if (pair1Rank < pair2Rank) {
      return false;
    } else {
      if (last1Card.priority > last2Card.priority) {
        return true;
      } else if (last1Card.priority < last2Card.priority) {
        return false;
      } else {
        return (
          _options.wininingPriority.cardType[last1Card.type].priority >
          _options.wininingPriority.cardType[last2Card.type].priority
        );
      }
    }
    return true;
  }

  function comparePair(sets, setProp) {
    var firstSet,
      highSet = sets[0];
    for (var count = 1, len = sets.length; count < len; count++) {
      var set2 = sets[count];
      if (isHighPair(set2[setProp], highSet[setProp])) {
        highSet = set2;
      }
    }
    return highSet;
  }

  function isHighSequence(set1, set2) {
    var set1D = _.sortBy(set1, "priority").reverse();
    var set2D = _.sortBy(set2, "priority").reverse();
    if (set1D[0].priority > set2D[0].priority) {
      return true;
    } else if (set1D[0].priority < set2D[0].priority) {
      return false;
    } else {
      if (set1D[1].priority > set2D[1].priority) {
        return true;
      } else if (set1D[1].priority < set2D[1].priority) {
        return false;
      } else {
        if (set1D[2].priority > set2D[2].priority) {
          return true;
        } else if (set1D[2].priority < set2D[2].priority) {
          return false;
        } else {
          return (
            _options.wininingPriority.cardType[set1D[2].type].priority >
            _options.wininingPriority.cardType[set2D[2].type].priority
          );
        }
      }
    }
    return true;
  }

  function compareSequence(sets, setProp) {
    var firstSet,
      highSet = sets[0];
    for (var count = 1, len = sets.length; count < len; count++) {
      var set2 = sets[count];
      if (isHighSequence(set2[setProp], highSet[setProp])) {
        highSet = set2;
      }
    }

    return highSet;
  }

  function getGreatestFromType(type, sets, setProp) {
    var setProp = setProp || "newSet";
    switch (type) {
      case "trail":
        return compareTrail(sets, setProp);
        break;
      case "highcard":
        return compareHighCard(sets, setProp);
        break;
      case "color":
        return compareColor(sets, setProp);
        break;
      case "pair":
        return comparePair(sets, setProp);
        break;
      case "sequence":
      case "puresequence":
        return compareSequence(sets, setProp);
        break;
    }
    return sets[0];
  }

  this.getGreatest = function (sets, jokers) {
    var arrNew = [],
      sorted,
      setProp = "newSet",
      maxP = -1;
    
    sets = convertCardAsPerJoker(sets, jokers);
    
    for (var count = 0, len = sets.length; count < len; count++) {
      var setType = this.getSetType(sets[count][setProp]);
      sets[count].type = setType.type;
      sets[count].typeName = setType.displayName;
      arrNew.push({
        type: setType.type,
        typeName: setType.displayName,
        priority: this.getSetType(sets[count][setProp]).priority,
        set: sets[count],
      });
    }
    sorted = _.sortBy(arrNew, "priority").reverse();
    maxP = sorted[0].priority;
    let typeLeft = _.where(sorted, {
      priority: maxP,
    });
    let winner = sorted[0].set;
    if (typeLeft.length > 1) {
      winner = getGreatestFromType(
        typeLeft[0].type,
        _.map(typeLeft, function (a) {
          return a.set;
        })
      );
    }

    return _.map(sets, function (set) {
      let isWinner = false;
      if(set.id === winner.id) {
        isWinner = true;
      } else if(winner.type === set.type) {
        let matchWithWinner = winner.newSet.filter(winnerset => set.newSet.some(newSet => winnerset.priority === newSet.priority));
        if(matchWithWinner.length === 3) {
          isWinner = true;
        }
      }
      return {
        set,
        winner: isWinner
      }
    });
  };

  this.getPriority = function (set) {
    return this.getSetType(set);
  };

  function convertCardAsPerJoker(sets, jokers) {
    for (var count = 0, len = sets.length; count < len; count++) {
      let newCards = [];
      let remainCards = [];
      let noOfJoker = 0;
      for(let i = 0; i < sets[count].set.length; i++) {
        let matchedJoker = jokers.filter(j => j.rank == sets[count].set[i].rank)
        if(matchedJoker.length > 0) {
          noOfJoker++;
        } else {
          newCards[i] = sets[count].set[i];
          remainCards.push(sets[count].set[i]);
        }
      }

      if(noOfJoker === 3) {
        // three joners
        //newCards.push(new Card('spade', "1"));
        //newCards.push(new Card('heart', "1"));
        //newCards.push(new Card('diamond', "1"));
		
        if(sets[count].set[0].rank === 1 && sets[count].set[1].rank === 1 && sets[count].set[2].rank === 1) {
          newCards.push(sets[count].set[0]);
          newCards.push(sets[count].set[1]);
          newCards.push(sets[count].set[2]);
        } else {
          newCards.push(new Card('spade', "1"));
          newCards.push(new Card('heart', "1"));
          newCards.push(new Card('diamond', "1"));
        }
		
		
      } else if(noOfJoker === 2) {
        // two jokers
        let joker1, joker2;
        if(remainCards[0].type === 'spade') {
          joker1 = new Card('heart', remainCards[0].rank);
          joker2 = new Card('diamond', remainCards[0].rank);
        } else if(remainCards[0].type === 'heart') {
          joker1 = new Card('spade', remainCards[0].rank);
          joker2 = new Card('diamond', remainCards[0].rank);
        } else {
          joker1 = new Card('spade', remainCards[0].rank);
          joker2 = new Card('heart', remainCards[0].rank);
        }
        if(newCards[0] != undefined) {
          newCards[1] = joker1;
          newCards[2] = joker2;
        } else if(newCards[1] != undefined) {
          newCards[0] = joker1;
          newCards[2] = joker2;
        } else {
          newCards[0] = joker1;
          newCards[1] = joker2;
        }
      } else if(noOfJoker === 1) {
        let joker1;
        let sorted = _.sortBy(remainCards, "priority");
        let sortedRank = _.sortBy(remainCards, "rank");
        if(remainCards[0].rank === remainCards[1].rank) {
          // one joker with same card
          if(remainCards[0].type !== 'spade' && remainCards[1].type !== 'spade') {
            joker1 = new Card('spade', remainCards[0].rank);
          } else if(remainCards[0].type !== 'heart' && remainCards[1].type !== 'heart') {
            joker1 = new Card('heart', remainCards[0].rank);
          } else {
            joker1 = new Card('diamond', remainCards[0].rank);
          } 
        } else if(sorted[0].priority + 1 === sorted[1].priority || sorted[0].priority + 2 === sorted[1].priority
              || sortedRank[0].rank + 1 === sortedRank[1].rank || sortedRank[0].rank + 2 === sortedRank[1].rank) {
          // one joker with pure sequence and sequence
          if(sorted[0].priority === 13 && sorted[1].priority === 14) {
            joker1 = new Card(remainCards[1].type, 12);
          } else if(sorted[0].priority === 12 && sorted[1].priority === 14) {
            joker1 = new Card(remainCards[1].type, 13);
          } else if(sortedRank[0].rank === 1 && sortedRank[1].rank === 2) {
            joker1 = new Card(remainCards[1].type, 3);
          } else if(sortedRank[0].rank === 1 && sortedRank[1].rank === 3) {
            joker1 = new Card(remainCards[1].type, 2);
          } else if((sorted[0].rank === 12 && sorted[1].rank === 13) || (sorted[0].rank === 2 && sorted[1].rank === 3)) {
            joker1 = new Card(remainCards[1].type, 1);
          } else {
            if ((sorted[1].priority - sorted[0].priority) === 1) {
              joker1 = new Card(remainCards[1].type, (sorted[1].rank + 1));  
            } else {
              joker1 = new Card(remainCards[1].type, (sorted[0].rank + 1));  
            }
          }
        } else if(remainCards[0].type === remainCards[1].type) {
          // one joker with color
          if(sorted[1].rank !== 1) {
            joker1 = new Card(remainCards[1].type, 1);
          } else if(sorted[1].rank !== 13) {
            joker1 = new Card(remainCards[1].type, 13);
          } else {
            joker1 = new Card(remainCards[1].type, 12);
          }
        } else {
          joker1 = new Card(sorted[0].type, sorted[1].rank);
        }
        if(newCards[0] == undefined) {
          newCards[0] = joker1;
        } else if(newCards[1] == undefined) {
          newCards[1] = joker1;
        } else {
          newCards[2] = joker1;
        }
      }
      sets[count].newSet = newCards;
    }
    return sets;
  }
}

module.exports = new ThreeJoker();