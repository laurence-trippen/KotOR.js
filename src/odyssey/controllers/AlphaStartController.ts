import { OdysseyController } from "./OdysseyController";
import type { OdysseyModelAnimation, OdysseyModelAnimationManager } from "..";
import { OdysseyModelControllerType } from "../../enums/odyssey/OdysseyModelControllerType";
import { IOdysseyControllerFrameGeneric } from "../../interface/odyssey/controller/IOdysseyControllerFrameGeneric";
import { IOdysseyControllerGeneric } from "../../interface/odyssey/controller/IOdysseyControllerGeneric";

/**
 * AlphaStartController class.
 * 
 * KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 * 
 * @file AlphaStartController.ts
 * @author KobaltBlu <https://github.com/KobaltBlu>
 * @license {@link https://www.gnu.org/licenses/gpl-3.0.txt|GPLv3}
 */
export class AlphaStartController extends OdysseyController {

  type: OdysseyModelControllerType = OdysseyModelControllerType.AlphaStart;

  constructor( controller: IOdysseyControllerGeneric ){
    super(controller);
  }

  setFrame(manager: OdysseyModelAnimationManager, anim: OdysseyModelAnimation, data: IOdysseyControllerFrameGeneric){
    if(manager.modelNode.emitter){
      manager.modelNode.emitter.opacity[0] = data.value;
      manager.modelNode.emitter.material.uniforms.opacity.value.fromArray(manager.modelNode.emitter.opacity);
      manager.modelNode.emitter.material.uniformsNeedUpdate = true;
    }
  }

  animate(manager: OdysseyModelAnimationManager, anim: OdysseyModelAnimation, last: IOdysseyControllerFrameGeneric, next: IOdysseyControllerFrameGeneric, fl: number = 0){
    if(manager.modelNode.emitter){
      manager.modelNode.emitter.opacity[0] = ((next.value - last.value) * fl + last.value);
      manager.modelNode.emitter.material.uniforms.opacity.value.fromArray(manager.modelNode.emitter.opacity);
      manager.modelNode.emitter.material.uniformsNeedUpdate = true;
    }
  }

}
