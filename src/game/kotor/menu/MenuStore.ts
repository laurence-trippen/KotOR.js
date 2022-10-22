/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
*/

import { GameState } from "../../../GameState";
import { GameMenu, GUIListBox, GUILabel, GUIButton } from "../../../gui";
import { TextureLoader } from "../../../loaders/TextureLoader";
import { InventoryManager } from "../../../managers/InventoryManager";
import { PartyManager } from "../../../managers/PartyManager";
import { TLKManager } from "../../../managers/TLKManager";
import { ModuleCreature, ModuleItem, ModuleStore } from "../../../module";

/* @file
* The MenuStore menu class.
*/

export class MenuStore extends GameMenu {

  LB_INVITEMS: GUIListBox;
  LB_DESCRIPTION: GUIListBox;
  LB_SHOPITEMS: GUIListBox;
  LBL_BUYSELL: GUILabel;
  LBL_CREDITS_VALUE: GUILabel;
  LBL_CREDITS: GUILabel;
  LBL_COST_VALUE: GUILabel;
  LBL_COST: GUILabel;
  LBL_STOCK: GUILabel;
  LBL_STOCK_VALUE: GUILabel;
  BTN_Examine: GUIButton;
  BTN_Cancel: GUIButton;
  BTN_Accept: GUIButton;
  storeObject: ModuleStore;
  creature: ModuleCreature;
  bonusMarkUp: number;
  bonusMarkDown: number;
  sellMode: any;

  constructor(){
    super();
    this.gui_resref = 'store';
    this.background = '1600x1200store';
    this.voidFill = true;
  }

  async MenuControlInitializer(skipInit: boolean = false) {
    await super.MenuControlInitializer();
    if(skipInit) return;
    return new Promise<void>((resolve, reject) => {
      resolve();
    });
  }

  getItemSellPrice(item: ModuleItem) {
    return item.cost + item.cost * this.storeObject.getMarkUp();
  }

  getItemBuyPrice(item: ModuleItem) {
    return item.cost + item.cost * this.storeObject.getMarkDown();
  }

  setStoreObject(storeObject: ModuleStore){
    this.storeObject = storeObject;
  }

  setCustomerObject(creature: ModuleCreature){
    this.creature = creature;
  }

  setBonusMarkUp(bonusMarkUp: number = 0){
    this.bonusMarkUp = bonusMarkUp;
  }

  setBonusMarkDown(bonusMarkDown: number = 0){
    this.bonusMarkDown = bonusMarkDown;
  }

  Show() {
    super.Show();
    GameState.MenuActive = true;
    if (this.storeObject instanceof ModuleStore) {
      this.LB_DESCRIPTION.clearItems();
      this.LB_DESCRIPTION.hide();
      this.LB_INVITEMS.hide();
      this.LB_SHOPITEMS.hide();
      if (this.sellMode) {
        this.BTN_Examine.setText(TLKManager.GetStringById(41937));
        this.LBL_COST.setText(TLKManager.GetStringById(41945));
        this.LBL_BUYSELL.setText(TLKManager.GetStringById(32130));
        this.BTN_Accept.setText(TLKManager.GetStringById(32130));
        this.LB_INVITEMS.clearItems();
        let inv = InventoryManager.getSellableInventory();
        for (let i = 0; i < inv.length; i++) {
          this.LB_INVITEMS.addItem(inv[i], (item: ModuleItem) => {
            this.LBL_COST_VALUE.setText(this.getItemSellPrice(item));
            this.LB_DESCRIPTION.clearItems();
            this.LB_DESCRIPTION.addItem(item.getDescription());
            this.LB_DESCRIPTION.updateList();
            this.LB_DESCRIPTION.show();
          });
        }
        this.LB_INVITEMS.select(this.LB_INVITEMS.children[0]);
        this.LB_INVITEMS.show();
      } else {
        this.BTN_Examine.setText(TLKManager.GetStringById(41938));
        this.LBL_COST.setText(TLKManager.GetStringById(41943));
        this.LBL_BUYSELL.setText(TLKManager.GetStringById(32132));
        this.BTN_Accept.setText(TLKManager.GetStringById(32132));
        this.LB_SHOPITEMS.clearItems();
        let inv = this.storeObject.getInventory();
        for (let i = 0; i < inv.length; i++) {
          this.LB_SHOPITEMS.addItem(inv[i], (item: ModuleItem) => {
            this.LBL_COST_VALUE.setText(this.getItemBuyPrice(item));
            this.LB_DESCRIPTION.clearItems();
            this.LB_DESCRIPTION.addItem(item.getDescription());
            this.LB_DESCRIPTION.updateList();
            this.LB_DESCRIPTION.show();
          });
        }
        this.LB_SHOPITEMS.select(this.LB_SHOPITEMS.children[0]);
        this.LB_SHOPITEMS.show();
      }
      this.LBL_CREDITS_VALUE.setText(PartyManager.Gold || 0);
      TextureLoader.LoadQueue();
    } else {
      this.Close();
    }
  }
  
}
