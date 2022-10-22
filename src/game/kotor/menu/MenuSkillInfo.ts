/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
*/

import { GameState } from "../../../GameState";
import { GameMenu, GUILabel, GUIListBox, GUIButton } from "../../../gui";

/* @file
* The MenuSkillInfo menu class.
*/

export class MenuSkillInfo extends GameMenu {

  LBL_MESSAGE: GUILabel;
  LB_SKILLS: GUIListBox;
  BTN_OK: GUIButton;

  constructor(){
    super();
    this.gui_resref = 'skillinfo';
    this.background = '';
    this.voidFill = false;
  }

  async MenuControlInitializer(skipInit: boolean = false) {
    await super.MenuControlInitializer();
    if(skipInit) return;
    return new Promise<void>((resolve, reject) => {
      resolve();
    });
}
  
}
