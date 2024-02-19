var Card = require("./card");

function Tossdeck() {
  var deck = [],
    types = {
      heart: {
        priority: 3,
      }
    };

  function makeCards() {
    for (var type in types) {
      for (var a = 1; a <= 13; a++) {
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
    var len = deck.length,
      tempVal,
      randIdx;
    while (0 !== len) {
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
    var randCards = [];
    var cardInserted = {},
      nCard = null;
    for (var count = 1; count <= num; ) {
      nCard = getRandomArbitrary(1, 13);
      if (!cardInserted[nCard]) {
        randCards.push(
          $.extend(
            {
              id: Math.random(),
            },
            deck[nCard - 1],
            deck = deck.map(ele => { ele !== randCards[0] })
          )
        );
        cardInserted[nCard] = true;
        count++;
      }
    }
    return randCards;
  }

  return {
    getCards: getCards,
    getRandomCards: getRandomCards,
    shuffle: shuffle,
  };
}

module.exports = new Tossdeck();






























// // .............create deck............method 1
// // function createDeck(){
// //   let deck1 = [];
// //   for (let i = 0; i < suits.length; i++) {
// //       for (let x = 0; x < values.length; x++) {
// //           let card = { Value: values[x], Suit: suits[i] };
// //           deck1.push(card);
// //       }
// //   }
// //   return deck1;
// // }

// //........create deck ..............method 2
// function createDeck() {
//   const suits = ['H', 'C', 'D', 'S'];
//   const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
//   switch (ranks) {
//     case '2': priority : 2;
//       break;

//     case '3': priority : 3;
//     break;

//     case '4': priority : 4;
//     break;

//     case '5': priority : 5;
//     break;

//     case '6': priority : 6;
//     break;

//     case '7': priority : 7;
//     break;

//     case '8': priority : 8;
//     break;

//     case '9': priority : 9;
//     break;

//     case '10': priority : 10;
//     break;

//     case 'J': priority : 11;
//     break;

//     case 'Q': priority : 12;
//     break;

//     case 'K': priority : 13;
//     break;

//     case 'A': priority : 14;
//     break;
  
//     default:
//       break;
//   }
//   const decks = ['Joker-1', 'Joker-2'];

//   for (let suit of suits) {
//       for (let rank of ranks) {
//           decks.push(`${suit}${rank}`)
//       };
//   };

//   return decks;
// }


// //.........create Deck for decide turn
// function createDeckForDecideTurn() {
//   const suits = ['S'];
//   const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
//   const decks = ['Joker-1', 'Joker-2'];

//   for (let suit of suits) {
//       for (let rank of ranks) {
//           decks.push(`${suit}${rank}`)
//       };
//   };

//   return decks;
// }

// // .........shuffle the DECK........method 1
// // function shuffle(deckName){
// //   for (let i = deckName.length - 1; i > 0; i--) {
// //       let j = Math.floor(Math.random() * i);
// //       let temp = deckName[i];
// //       deckName[i] = deckName[j];
// //       deckName[j] = temp;
// //   }
// //   return deckName;
// // }

// //.........shuffle deck .............method 2
// function shuffle(deck) {
//   for (let i = 0; i < deck.length; i++) {
//       // get a random card from the deck
//       let randomPosition = Math.floor(Math.random() * deck.length);
//       const randomCard = deck[randomPosition];
//       // swap the current card with the randomlly picked card
//       deck[randomPosition] = deck[i];
//       deck[i] = randomCard;
//   };

//   return deck;
// };

// // distribute 13 random cards to each player
// // function getRandomCards(deckName, playersNumber){
// //   let distributedCards = [];
// //   let playersLength = playersNumber;
// //   for(let k = 1; k <= playersLength; k++){
// //     for (let i = 0; i < 13; i++) {
// //         shuffle(deckName);
// //         const cardInfo = { suits : deckName[i].Suit, values : deckName[i].Value } 
// //         distributedCards.push(cardInfo);
// //         deckName.splice(deckName.findIndex(a => (a.Suit === cardInfo.suits && a.Value == cardInfo.values)) , 1)
// //       }
// //       let cardData = {
// //         distributedCards,
// //         deckName
// //       }
// //       return cardData;
// //     }
// // }

// function getCard(deck){
//   return deck
// }

// function getRandomCards(deckName){
//   let distributedCards = [];

//     for (let i = 0; i < 13; i++) {
//         shuffle(deckName);
//         const cardInfo = { suits : deckName[i].Suit, values : deckName[i].Value } 
//         distributedCards.push(cardInfo);
//         deckName.splice(deckName.findIndex(a => (a.Suit === cardInfo.suits && a.Value == cardInfo.values)) , 1)
//       }
//       let cardData = {
//         distributedCards,
//         deckName
//       }
//       return cardData;
    
// }
// // let deck1 = createDeck();
// // console.log(getRandomCards(deck1, 2));



// module.exports = { createDeck, shuffle, getCard, getRandomCards, createDeckForDecideTurn };