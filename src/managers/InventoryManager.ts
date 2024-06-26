import { GFFDataType } from "../enums/resource/GFFDataType";
import { GFFField } from "../resource/GFFField";
import { GFFObject } from "../resource/GFFObject";
import * as path from "path";
import { CurrentGame } from "../CurrentGame";
import type { ModuleCreature, ModuleItem } from "../module";
import { GameState } from "../GameState";
// import { PartyManager } from "./PartyManager";

/**
 * InventoryManager class.
 * 
 * KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 * 
 * @file InventoryManager.ts
 * @author KobaltBlu <https://github.com/KobaltBlu>
 * @license {@link https://www.gnu.org/licenses/gpl-3.0.txt|GPLv3}
 */
export class InventoryManager {
  static inventory: any[] = [];

  static getInventory( slot = 0, creature?: ModuleCreature ){
    if(!slot){
      return InventoryManager.inventory;
    }else{
      let equippable = [];
      for(let i = 0; i < InventoryManager.inventory.length; i++){
        let item = InventoryManager.inventory[i];
        if( InventoryManager.isItemUsableInSlot(item, slot) && InventoryManager.isItemUsableBy(item, creature)){
          equippable.push(item);
        }
      }
      return equippable;
    }
  }

  static getNonQuestInventory( slot = 0, creature?: ModuleCreature ){
    if(!slot){
      let equippable = [];
      for(let i = 0; i < InventoryManager.inventory.length; i++){
        let item = InventoryManager.inventory[i];
        if(!item.Plot){
          equippable.push(item);
        }
      }
      return equippable;
    }else{
      let equippable = [];
      for(let i = 0; i < InventoryManager.inventory.length; i++){
        let item = InventoryManager.inventory[i];
        if(InventoryManager.isItemUsableInSlot(item, slot) && InventoryManager.isItemUsableBy(item, creature)){
          equippable.push(item);
        }
      }
      return equippable;
    }
  }

  static getQuestInventory(slot = 0, creature?: ModuleCreature){
    if(!slot){
      let equippable = [];
      for(let i = 0; i < InventoryManager.inventory.length; i++){
        let item = InventoryManager.inventory[i];
        if(item.Plot){
          equippable.push(item);
        }
      }
      return equippable;
    }else{
      let equippable = [];
      for(let i = 0; i < InventoryManager.inventory.length; i++){
        let item = InventoryManager.inventory[i];
        if(InventoryManager.isItemUsableInSlot(item, slot) && InventoryManager.isItemUsableBy(item, creature)){
          equippable.push(item);
        }
      }
      return equippable;
    }
  }

  static getSellableInventory(slot = 0, creature?: ModuleCreature){
    return InventoryManager.getNonQuestInventory(slot, creature);
  }

  static isItemUsableBy( item?: ModuleItem, creature?: ModuleCreature): boolean {
    // if(!(item instanceof ModuleItem) || !(creature instanceof ModuleCreature))
      // return false;

    let droidorhuman = item.baseItem.droidOrHuman;
    
    return !droidorhuman || (
      (droidorhuman == 1 && creature.getRace() == 6) ||
      (droidorhuman == 2 && creature.getRace() == 5)
    );
    
  }

  static isItemUsableInSlot( item: ModuleItem, slot: any ): boolean {
    let baseItem = item.baseItem;
    return (baseItem.equipableSlots & slot || baseItem.equipableSlots === slot) ? true : false;
  }

  static addItem(template: GFFObject|ModuleItem = new GFFObject(), limitOne = false): ModuleItem {

    let item: ModuleItem;
    if(template instanceof GFFObject){
      item = new GameState.Module.ModuleArea.ModuleItem(template);
    }else if(template instanceof GameState.Module.ModuleArea.ModuleItem){
      item = template;
    }

    if(item instanceof GameState.Module.ModuleArea.ModuleItem){
      if(item.getBaseItemId() == 57){ //Credits
        GameState.PartyManager.Gold += item.getStackSize();
      }else{
        item.load();
        let hasItem = InventoryManager.getItemByTag(item.getTag());
        if(hasItem){

          if(!limitOne){
            hasItem.setStackSize(hasItem.getStackSize() + item.getStackSize());
          }else{
            hasItem.setStackSize(hasItem.getStackSize() + 1);
          }

          return hasItem;
        }else{

          if(limitOne)
            item.setStackSize(1);

          InventoryManager.inventory.push(item);
          return item;
        }
      }
    }else{
      throw 'You can only add an item of type ModuleItem to an inventory';
    }


    


    /*itm = Object.assign({
      AddCost: 100,
      BaseItem: 0,
      Charges: 0,
      Cost: 100,
      DELETING: 0,
      DescIdentified: new CExoLocString(),
      Description: new CExoLocString(),
      Dropable: 1,
      Identified: 1,
      LocalizedName: new CExoLocString(),
      MaxCharges: 0,
      ModelVariation: 1,
      NewItem: 1,
      NonEquippable: 0,
      Pickpocketable: 1,
      Plot: 0,
      PropertiesList: [],
      StackSize: 1,
      Stolen: 0,
      Tag: '',
      Upgrades: 0,
      XOrientation: 0,
      XPosition: 0,
      YOrientation: 0,
      YPosition: 0,
      ZOrientation: 0,
      ZPosition: 0
    }, itm);*/

  }

  static removeItemByResRef(resRef = '', nCount = 1){
    let item = InventoryManager.getItemByTag(resRef);
    if(item){
      let idx = InventoryManager.inventory.indexOf(item);
      if(nCount < item.getStackSize()){
        item.setStackSize( (item.getStackSize() - nCount) || 1 );
      }else{
        InventoryManager.inventory.splice(idx, 1);
      }
    }
  }

  static removeItem(item?: string|ModuleItem, nCount = 1){
    if(typeof item === 'string'){
      InventoryManager.removeItemByResRef(item, nCount);
    }else if(item instanceof GameState.Module.ModuleArea.ModuleItem){
      let idx = InventoryManager.inventory.indexOf(item);
      if(idx >= 0){
        if(nCount >= item.getStackSize()){
          InventoryManager.inventory.splice(idx, 1);
        }else{
          item.setStackSize( (item.getStackSize() - nCount) || 1 );
        }
      }else{
        //Item not in inventory
      }
    }else{
      console.warn('InventoryManager.removeItem() unknown item', item, nCount);
    }
  }

  static getItemByTag(sTag = ''){
    for(let i = 0; i < InventoryManager.inventory.length; i++){
      let item = InventoryManager.inventory[i];
      if(item.getTag().toLowerCase() == sTag.toLowerCase())
        return item;
    }
    return false;
  }

  static itemFromJSON(json: any = {}){
    let item: any = {};
    let props = json.fields;
    for(let fieldName in props){
      let field = props[fieldName];
      if(field.type == 15){
        item[fieldName] = [];
        for(let i = 0; i < field.structs.length; i++){
          item[fieldName].push(InventoryManager.itemFromJSON(field.structs[i]));
        }
      }else{
        item[fieldName] = field.value;
      }
    }
    return item;
  }

  static Save(){
    return new Promise( async (resolve, reject) => {
      //console.log('InventoryManager.Save()', 'Exporting...');
      let gff = new GFFObject();
      gff.FileType = 'INV ';

      let itemList = gff.RootNode.addField( new GFFField( GFFDataType.LIST, 'ItemList' ));
      for(let i = 0; i < InventoryManager.inventory.length; i++){
        itemList.addChildStruct( InventoryManager.inventory[i].save() );
      }

      await gff.export( path.join( CurrentGame.gameinprogress_dir, 'INVENTORY.res') );
      resolve(gff);
    });
  }

}
