/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 */

import { ModuleCreature } from ".";
import { PartyManager } from "../managers/PartyManager";
import { GFFObject } from "../resource/GFFObject";

/* @file
 * The ModulePlayer class.
 */

export class ModulePlayer extends ModuleCreature {
  isPlayer: boolean = true;
  constructor ( gff = new GFFObject() ) {
    super(gff);
  }

  update(delta: number = 0){
    super.update(delta);
  }

  save(){
    let gff = super.save();


    PartyManager.Player = gff;
    this.template = gff;
    return gff;
  }

}
