class ActionDropItem extends Action {

  constructor( groupId = 0 ){
    super(groupId);
    this.type = Action.TYPE.ActionDropItem;
  }

}

module.exports = ActionDropItem;