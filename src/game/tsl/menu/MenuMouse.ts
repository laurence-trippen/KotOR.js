/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
*/

import { GameState } from "../../../GameState";
import { GUILabel, GUIListBox, GUISlider, GUICheckBox, GUIButton } from "../../../gui";
import { MenuMouse as K1_MenuMouse } from "../../kotor/KOTOR";
import { EngineMode } from "../../../enums/engine/EngineMode";

/* @file
* The MenuMouse menu class.
*/

export class MenuMouse extends K1_MenuMouse {

  declare LBL_BAR4: GUILabel;
  declare LBL_TITLE: GUILabel;
  declare LB_DESC: GUIListBox;
  declare SLI_MOUSESEN: GUISlider;
  declare LBL_MOUSESEN: GUILabel;
  declare CB_REVBUTTONS: GUICheckBox;
  declare LBL_BAR1: GUILabel;
  declare LBL_BAR2: GUILabel;
  declare LBL_BAR3: GUILabel;
  declare BTN_BACK: GUIButton;
  declare BTN_DEFAULT: GUIButton;

  constructor(){
    super();
    this.gui_resref = 'optmouse_p';
    this.background = '';
    this.voidFill = false;
  }

  async MenuControlInitializer(skipInit: boolean = false) {
    await super.MenuControlInitializer(true);
    if(skipInit) return;
    return new Promise<void>((resolve, reject) => {
      resolve();
    });
  }
  
}