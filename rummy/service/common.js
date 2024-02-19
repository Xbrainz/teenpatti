
   
const Table = require("../model/table");

function getPlayerBySlot(slot, players) {
	for (let player in players) {
		if (players[player].slot === slot) {
			console.log("active slottt  " + slot );
			return players[player];
		}
	}
	return undefined;
};

function getNextActivePlayer(id, players, availableSlots, maxPlayer, cb) {
	let slot = players[id].slot,
		num = slot.substr(4) * 1;
		
		console.log("Current slot   " + slot);

	for (let count = 1; count <= maxPlayer; count++) {
		num++;
		if (num > maxPlayer) {
			num = num % maxPlayer;
		}
		if (availableSlots['slot' + num]) {
			continue;
		}
		if (getPlayerBySlot('slot' + num, players)) {
			if (!getPlayerBySlot('slot' + num, players).active || getPlayerBySlot('slot' + num, players).packed  ) {
				continue;
			} else {
				break;
			}
		}
	}
	return getPlayerBySlot('slot' + num, players);
};

async function packPlayer(id, players, availableSlots, maxPlayer, tableId) {


	players[id].packed = true;
	if (players[id].turn == true) {
		return getNextSlotForTurn(id, players, availableSlots, maxPlayer, tableId);
	}
	return players;
};

async function getNextSlotForTurn(id, players, availableSlots, maxPlayer,tableId) {

	players[id].turn = false;
	let newPlayer = getNextActivePlayer(id, players, availableSlots, maxPlayer);
	players[newPlayer.id].turn = true;

    await Table.update(
		{ _id:tableId},
		{
		  $set: {
			turnplayerId: newPlayer.id,
		  },
		}
	  );
      console.warn("old player turn : ", id);
      console.warn("new player turn : ", newPlayer.id);

	return players;
};

function isValidGroups(data) {
	let msgArr = [];
	let pure = 0;
	let impure = 0;

	for (let i = 0; i < data.length; i++) {
		if (data[i].msg) {
			msgArr.push(data[i].msg);
		}
	};

	for (let i = 0; i < msgArr.length; i++) {
		if (msgArr[i] == "Pure Sequence") {
			pure++;
		} else if (msgArr[i] == "Impure Sequence") {
			impure++;
		}
	}

	if (pure > 0 && impure > 0) {
		return true;
	} else if (pure > 1) {
		return true;
	} else {
		return false;
	}
};

let staticCards = [
    {
        cards: [{
            "type": "spade",
            "rank": 5,
            "name": "5",
            "priority": 5,
        },
        {
            "type": "spade",
            "rank": 6,
            "name": "6",
            "priority": 6,
        },
        {
            "type": "spade",
            "rank": 7,
            "name": "7",
            "priority": 7,
        },
        {
            "type": "spade",
            "rank": 8,
            "name": "8",
            "priority": 8,
        }
        ],
        msg: "Pure Sequence"
    },
    {
        cards: [{
            "type": "heart",
            "rank": 12,
            "name": "Q",
            "priority": 12,
        },
        {
            "type": "heart",
            "rank": 13,
            "name": "K",
            "priority": 13,
        },
        {
            "type": "heart",
            "rank": 1,
            "name": "A",
            "priority": 14,
        }],
        msg: "Pure Sequence"
    },
    {
        cards: [{
            "type": "heart",
            "rank": 3,
            "name": "3",
            "priority": 3,
        },
        {
            "type": "spade",
            "rank": 3,
            "name": "3",
            "priority": 3,
        },
        {
            "type": "club",
            "rank": 3,
            "name": "3",
            "priority": 3,
        }],
        msg: "Proper Set."
    },
    {
        cards: [{
            "type": "heart",
            "rank": 10,
            "name": "10",
            "priority": 10,
        },
        {
            "type": "spade",
            "rank": 10,
            "name": "10",
            "priority": 10,
        },
        {
            "type": "club",
            "rank": 10,
            "name": "10",
            "priority": 10,
        }],
        msg: "Proper Set."
    },
    {
        cards: [],
    },
    {
        cards: [],
    }
];

module.exports = { getPlayerBySlot, getNextActivePlayer, packPlayer, getNextSlotForTurn, isValidGroups };
