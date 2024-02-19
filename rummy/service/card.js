function Card(type, rank) {
  this.type = type;

  this.rank = rank;
  this.name = this.getName(rank);
  this.id2 = Math.random().toString(35).slice(2);
  console.log("new cardds : ", type, rank ,"   id2 : " ,this.id2);
  this.priority = this.getPriority(rank);
}
Card.prototype.getName = function () {
  switch (this.rank) {
    case 1:
      return "A";
    case 11:
      return "J";
    case 12:
      return "Q";
    case 13:
      return "K";
    default:
      return this.rank.toString();
  }
};
Card.prototype.getPriority = function () {
  let y = this.rank;
  if (this.rank == 1) {
    y = 14;
  }
  return y;
};

module.exports = Card;