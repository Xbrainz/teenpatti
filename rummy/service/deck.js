const Card = require('./card');

function Deck() {
    // #########  JOKERS ==>> { type:"*", rank: 15, name: "Joker", priority: 15 }, { type:"*", rank: 15, name: "Joker", priority: 15 }
    // #########  JOKERS ==>> { type:"joker", rank: 15, name: "joker", priority: 15 }, { type:"joker", rank: 15, name: "joker", priority: 15 }
    const deck = [{ type:"joker", rank: 15, name: "joker", priority: 15 ,id2 : Math.random().toString(35).slice(2)}, { type:"joker", rank: 15, name: "joker", priority: 15, id2 : Math.random().toString(35).slice(2) }];
    const types = {
        heart: {
            priority: 3,
        },
        spade: {
            priority: 4,
        },
        diamond: {
            priority: 2,
        },
        club: {
            priority: 1,
        },
    };

    function makeCards() {
        for (const type in types) {
            for (let a = 1; a <= 13; a += 1) {
                deck.push(new Card(type, a));
            }
        }
    }
    makeCards();
    function getCards() {
        return deck;
    }

    function getRandomArbitrary(min, max) {
        return parseInt(Math.random() * (max - min) + min, 0);
    }

    function shuffle() {
		
        let len = deck.length;
        let tempVal;
        let randIdx;
        while (len !== 0) {
            randIdx = Math.floor(Math.random() * len);
            len--;
            deck[len].id = Math.random();
            deck[randIdx].id = Math.random();
            tempVal = deck[len];
            deck[len] = deck[randIdx];
            deck[randIdx] = tempVal;
        }
    }

    function getRandomCards(num) {
        const randCards = [];
        const cardInserted = {};
        let nCard = null;
        for (let count = 1; count <= num;) {
            nCard = getRandomArbitrary(1, 52);
            if (!cardInserted[nCard]) {
                randCards.push(
                    $.extend(
                        {
                            id: Math.random(),
                        },
                        deck[nCard - 1],
                    ),
                );
                cardInserted[nCard] = true;
                count += 1;
            }
        }
        return randCards;
    }

    return {
        getCards,
        getRandomCards,
		makeCards,
        shuffle,
    };
}

let Deck1 = new Deck();
let Deck2 = new Deck();
let Deck3 = new Deck();
module.exports = {Deck1, Deck2, Deck3};
