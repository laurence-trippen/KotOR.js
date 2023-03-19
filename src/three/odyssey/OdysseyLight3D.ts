import { GameState } from "../../GameState";
import { OdysseyObject3D } from "./";
import * as THREE from "three";
import { OdysseyModelNodeLight } from "../../odyssey";


//THREE.js representation of an OdysseyLight
export class OdysseyLight3D extends OdysseyObject3D {

  worldPosition: THREE.Vector3 = new THREE.Vector3();
  sphere: THREE.Sphere = new THREE.Sphere();
  isAnimated: boolean = false;
  parentUUID: string;
  priority: number = 0;

  isAmbient: boolean = false;
  isDynamic: boolean = false;
  affectDynamic: boolean = false;
  isFading: number = 0;

  genFlare: boolean = false;

  intensity: number = 0;
  maxIntensity: number = 0.5;

  color: THREE.Color = new THREE.Color(1, 1, 1);
  multiplier: number = 0;
  radius: number = 0;
  shadowRadius: number = 0;
  verticalDisplacement: number = 0;

  cameraDistance: number = 0;

  constructor(node: OdysseyModelNodeLight){
    super(node);
    this.type = 'OdysseyLight';
  }

  getIntensity(){
    return this.multiplier;
    // if(this.odysseyModelNode)
    //   //return this.odysseyModelNode.multiplier;
    //   return 0.5;//(this.odysseyModelNode.multiplier > 1 && (Number(this.odysseyModelNode.multiplier) === this.odysseyModelNode.multiplier && this.odysseyModelNode.multiplier % 1 === 0) ? this.odysseyModelNode.multiplier : this.odysseyModelNode.multiplier);
    // else
    //   return 0;
  }

  getRadius(){
    return this.radius * this.multiplier;
    // if(this.odysseyModelNode)
    //   return (this.odysseyModelNode as OdysseyModelNodeLight).radius;
    // else
    //   return 0;
  }

  getShadowRadius(){
    return this.shadowRadius;
  }

  isOnScreen( frustum = GameState.viewportFrustum ){
    if(!this.odysseyModel.visible)
      return false;

    this.sphere.center.copy(this.worldPosition);
    this.sphere.radius = this.getRadius();
    return frustum.intersectsSphere(this.sphere);
  }

}