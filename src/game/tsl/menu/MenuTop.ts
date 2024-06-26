import { GameState } from "../../../GameState";
import type { GUIControl, GUIButton, GUILabel, GUIProgressBar } from "../../../gui";
import { TextureLoader } from "../../../loaders";
import { OdysseyTexture } from "../../../three/odyssey/OdysseyTexture";
import { MenuTop as K1_MenuTop } from "../../kotor/KOTOR";

/**
 * MenuTop class.
 * 
 * KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 * 
 * @file MenuTop.ts
 * @author KobaltBlu <https://github.com/KobaltBlu>
 * @license {@link https://www.gnu.org/licenses/gpl-3.0.txt|GPLv3}
 */
export class MenuTop extends K1_MenuTop {

  declare LBLH_EQU: GUIControl;
  declare LBLH_INV: GUIControl;
  declare LBLH_CHA: GUIControl;
  declare LBLH_ABI: GUIControl;
  declare LBLH_MSG: GUIControl;
  declare LBLH_JOU: GUIControl;
  declare LBLH_MAP: GUIControl;
  declare LBLH_OPT: GUIControl;
  declare BTN_EQU: GUIButton;
  declare BTN_INV: GUIButton;
  declare BTN_CHAR: GUIButton;
  declare BTN_ABI: GUIButton;
  declare BTN_MSG: GUIButton;
  declare BTN_JOU: GUIButton;
  declare BTN_MAP: GUIButton;
  declare BTN_OPT: GUIButton;
  declare LBL_CHARNAME: GUILabel;
  declare LBL_TOP_CLASS1: GUILabel;
  declare LBL_TOP_CLASS2: GUILabel;
  declare LBL_TOP_CLASS1LEVEL: GUILabel;
  declare LBL_TOP_CLASS2LEVEL: GUILabel;
  declare LBL_SECTITLE: GUILabel;
  declare LBL_BACK3: GUILabel;
  declare LBL_BACK2: GUILabel;
  declare LBL_BACK1: GUILabel;
  declare LBL_CHAR1: GUILabel;
  declare LBL_DISABLE1: GUILabel;
  declare LBL_DEBILATATED1: GUILabel;
  declare LBL_CMBTEFCTINC1: GUILabel;
  declare LBL_CMBTEFCTRED1: GUILabel;
  declare LBL_LEVELUP1: GUILabel;
  declare LBL_CHAR2: GUILabel;
  declare LBL_LEVELUP2: GUILabel;
  declare BTN_CHANGE2: GUIButton;
  declare LBL_CHAR3: GUILabel;
  declare LBL_LEVELUP3: GUILabel;
  declare BTN_CHANGE3: GUIButton;
  declare PB_VIT1: GUIProgressBar;
  declare PB_FORCE1: GUIProgressBar;

  constructor(){
    super();
    this.gui_resref = 'top_p';
    this.background = '';
    this.voidFill = false;
  }

  async menuControlInitializer(skipInit: boolean = false) {
    await super.menuControlInitializer(true);
    if(skipInit) return;
    return new Promise<void>((resolve, reject) => {

      this.LBLH_OPT.widget.position.z = 5;
      this.LBLH_MAP.widget.position.z = 5;
      this.LBLH_JOU.widget.position.z = 5;
      this.LBLH_MSG.widget.position.z = 5;
      this.LBLH_ABI.widget.position.z = 5;
      this.LBLH_CHA.widget.position.z = 5;
      this.LBLH_INV.widget.position.z = 5;
      this.LBLH_EQU.widget.position.z = 5;

      this.BTN_MSG.addEventListener('click', (e: any) => {
        e.stopPropagation();
        this.CloseAllOtherMenus();
        this.manager.MenuPartySelection.open();
      });

      this.BTN_JOU.addEventListener('click', (e: any) => {
        e.stopPropagation();
        this.CloseAllOtherMenus();
        this.manager.MenuJournal.open();
      });

      this.BTN_MAP.addEventListener('click', (e: any) => {
        e.stopPropagation();
        this.CloseAllOtherMenus();
        this.manager.MenuMap.open();
      });

      this.BTN_OPT.addEventListener('click', (e: any) => {
        e.stopPropagation();
        this.CloseAllOtherMenus();
        this.manager.MenuOptions.open();
      });

      this.BTN_CHAR.addEventListener('click', (e: any) => {
        e.stopPropagation();
        this.CloseAllOtherMenus();
        this.manager.MenuCharacter.open();
      });

      this.BTN_ABI.addEventListener('click', (e: any) => {
        e.stopPropagation();
        this.CloseAllOtherMenus();
        this.manager.MenuAbilities.open();
      });

      this.BTN_INV.addEventListener('click', (e: any) => {
        e.stopPropagation();
        this.CloseAllOtherMenus();
        this.manager.MenuInventory.open();
      });

      this.BTN_EQU.addEventListener('click', (e: any) => {
        e.stopPropagation();
        this.CloseAllOtherMenus();
        this.manager.MenuEquipment.open();
      });

      this.BTN_CHANGE2.addEventListener('click', (e: any) => {
        GameState.PartyManager.party.unshift(GameState.PartyManager.party.splice(1, 1)[0]);
        this.UpdatePartyUI();
      });

      this.BTN_CHANGE3.addEventListener('click', (e: any) => {
        GameState.PartyManager.party.unshift(GameState.PartyManager.party.splice(2, 1)[0]);
        this.UpdatePartyUI();
      });

      this.recalculatePosition();
      resolve();
    });
  }

  show() {
    super.show();
    this.toggleNavUI(true);
    this.UpdatePartyUI();
  }

  toggleNavUI(visible = true) {
    if (!visible) {
      this.LBLH_OPT.hide();
      this.LBLH_MAP.hide();
      this.LBLH_JOU.hide();
      this.LBLH_MSG.hide();
      this.LBLH_ABI.hide();
      this.LBLH_CHA.hide();
      this.LBLH_INV.hide();
      this.LBLH_EQU.hide();
      this.BTN_OPT.hide();
      this.BTN_MAP.hide();
      this.BTN_JOU.hide();
      this.BTN_MSG.hide();
      this.BTN_ABI.hide();
      this.BTN_CHAR.hide();
      this.BTN_INV.hide();
      this.BTN_EQU.hide();
    } else {
      this.LBLH_OPT.show();
      this.LBLH_MAP.show();
      this.LBLH_JOU.show();
      this.LBLH_MSG.show();
      this.LBLH_ABI.show();
      this.LBLH_CHA.show();
      this.LBLH_INV.show();
      this.LBLH_EQU.show();
      this.BTN_OPT.show();
      this.BTN_MAP.show();
      this.BTN_JOU.show();
      this.BTN_MSG.show();
      this.BTN_ABI.show();
      this.BTN_CHAR.show();
      this.BTN_INV.show();
      this.BTN_EQU.show();
    }
  }

  UpdatePartyUI() {
    for (let i = 0; i < GameState.PartyManager.party.length; i++) {
      let partyMember = GameState.PartyManager.party[i];
      let portraitId = partyMember.getPortraitId();
      
      let portrait = GameState.TwoDAManager.datatables.get('portraits')?.rows[portraitId];
      this.TogglePartyMember(i, true);
      let pmBG = this.getControlByName('LBL_CHAR' + (i + 1));
      if (pmBG.getFillTextureName() != portrait.baseresref) {
        pmBG.setFillTextureName(portrait.baseresref);
        TextureLoader.Load(portrait.baseresref).then((texture: OdysseyTexture) => {
          pmBG.setFillTexture(texture);
        });
      }
      if (i == 0) {
        (this.getControlByName('PB_VIT' + (i + 1)) as GUIProgressBar).setProgress(partyMember.getHP() / partyMember.getMaxHP() * 100);
      }
    }
  }

  TogglePartyMember(nth = 0, bVisible = false) {
    switch (nth) {
    case 0:
      this.getControlByName('LBL_CMBTEFCTRED' + (nth + 1)).hide();
      this.getControlByName('LBL_CMBTEFCTINC' + (nth + 1)).hide();
      this.getControlByName('LBL_DEBILATATED' + (nth + 1)).hide();
      this.getControlByName('LBL_DISABLE' + (nth + 1)).hide();
      this.getControlByName('LBL_LEVELUP' + (nth + 1)).hide();
      this.getControlByName('LBL_BACK' + (nth + 1)).show();
      this.getControlByName('LBL_CHAR' + (nth + 1)).show();
      this.getControlByName('LBL_BACK' + (nth + 1)).show();
      this.getControlByName('PB_FORCE' + (nth + 1)).show();
      this.getControlByName('PB_VIT' + (nth + 1)).show();
      break;
    default:
      if (!bVisible) {
        this.getControlByName('LBL_LEVELUP' + (nth + 1)).hide();
        this.getControlByName('LBL_CHAR' + (nth + 1)).hide();
        this.getControlByName('BTN_CHANGE' + (nth + 1)).hide();
      } else {
        this.getControlByName('LBL_LEVELUP' + (nth + 1)).hide();
        this.getControlByName('LBL_CHAR' + (nth + 1)).show();
        this.getControlByName('BTN_CHANGE' + (nth + 1)).show();
      }
      break;
    }
  }

  CloseAllOtherMenus() {
    let currentMenu = this.manager.GetCurrentMenu();
    if (currentMenu == this.manager.MenuAbilities || currentMenu == this.manager.MenuInventory || currentMenu == this.manager.MenuJournal || currentMenu == this.manager.MenuMap || currentMenu == this.manager.MenuMessages || currentMenu == this.manager.MenuFeedback || currentMenu == this.manager.MenuOptions || currentMenu == this.manager.MenuCharacter || currentMenu == this.manager.MenuPartySelection || currentMenu == this.manager.MenuEquipment) {
      currentMenu.close();
    }
  }
  
}
