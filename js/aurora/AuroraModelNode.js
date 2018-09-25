class AuroraModelNode {

  constructor(){
    this.childNodes = [];
    this.controllers = [];
    this.position = {x: 0, y: 0, z: 0};
    this.quaternion = {x: 0, y: 0, z: 0, w: 1};
    this.roomStatic = true;
  }

  add(node){
    this.childNodes.push(node);
  }

  addController(controller){

  }

  getControllerByType(type = -1){

    for(let i = 0; i < this.controllers.length; i++){
      let cntrler = this.controllers[i];
      if(cntrler.type == type){
        return cntrler;
      }
    }

    return null;

  }

}

module.exports = AuroraModelNode;
