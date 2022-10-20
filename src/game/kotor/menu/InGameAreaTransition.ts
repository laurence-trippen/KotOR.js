/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
*/

import { GameState } from "../../../GameState";
import { GameMenu, GUILabel } from "../../../gui";
import * as THREE from "three";

/* @file
* The InGameAreaTransition menu class.
*/

export class InGameAreaTransition extends GameMenu {

  LBL_ICON: GUILabel;
  LBL_TEXTBG: GUILabel;
  LBL_DESCRIPTION: GUILabel;

  constructor(){
    super();
    this.gui_resref = 'areatransition';
    this.background = '';
    this.voidFill = false;
  }

  async MenuControlInitializer() {
    await super.MenuControlInitializer();
    return new Promise<void>((resolve, reject) => {
      resolve();
    });
  }

  SetDescription(text = '') {
    this.LBL_DESCRIPTION.setText(text);
  }

  Update(delta: number = 0) {
    super.Update(delta);
    for (let i = 0; i < GameState.module.area.triggers.length; i++) {
      let trig = GameState.module.area.triggers[i];
      if (trig.getLinkedToModule() && trig.getTransitionDestin().length) {
        let vec3 = trig.position;
        let distance = GameState.getCurrentPlayer().position.distanceTo(vec3);
        if (distance < 5) {
          this.Show();
          this.SetDescription(trig.getTransitionDestin());
          return;
        }
      }
    }
    for (let i = 0; i < GameState.module.area.doors.length; i++) {
      let door = GameState.module.area.doors[i];
      if (!door.isOpen() && door.getLinkedToModule() && door.getTransitionDestin().length) {
        let vec3 = new THREE.Vector3(door.getX(), door.getY(), door.getZ());
        let distance = GameState.getCurrentPlayer().position.distanceTo(vec3);
        if (distance < 2) {
          this.Show();
          this.SetDescription(door.getTransitionDestin());
          return;
        }
      }
    }
    this.Hide();
  }
  
}
