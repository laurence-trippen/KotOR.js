import type { OdysseyModelAnimation, OdysseyModelAnimationManager } from "..";
import { IOdysseyControllerGeneric } from "../../interface/odyssey/controller/IOdysseyControllerGeneric";
import { OdysseyController } from "./OdysseyController";
import { IOdysseyControllerFrameGeneric } from "../../interface/odyssey/controller/IOdysseyControllerFrameGeneric";
import { OdysseyModelControllerType } from "../../enums/odyssey/OdysseyModelControllerType";

/**
 * LightningSubDivController class.
 * 
 * KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 * 
 * @file LightningSubDivController.ts
 * @author KobaltBlu <https://github.com/KobaltBlu>
 * @license {@link https://www.gnu.org/licenses/gpl-3.0.txt|GPLv3}
 */
export class LightningSubDivController extends OdysseyController {

  type: OdysseyModelControllerType = OdysseyModelControllerType.LightningSubDiv;

  constructor( controller: IOdysseyControllerGeneric ){
    super(controller);
  }

  setFrame(manager: OdysseyModelAnimationManager, anim: OdysseyModelAnimation, data: IOdysseyControllerFrameGeneric){
    
  }

  animate(manager: OdysseyModelAnimationManager, anim: OdysseyModelAnimation, last: IOdysseyControllerFrameGeneric, next: IOdysseyControllerFrameGeneric, fl: number = 0){
    
  }

}

