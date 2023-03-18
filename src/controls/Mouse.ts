/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 */

import * as THREE from "three";
import { GUIControl } from "../gui";

/* @file
 * The Mouse class.
 */

export enum MouseAxis {
  X = 1,
  Y = 2,
}


export enum MouseState {
  NONE = 0,
  LEFT = 1,
  MIDDLE = 2,
  RIGHT = 3,
  None
}

export class Mouse {
  static editor: any;
  static camera: any;
  static MouseX: number = 0;
  static MouseY: number = 0;
  static OldMouseX: number = 0;
  static OldMouseY: number = 0;
  static OffsetX: number = 0;
  static OffsetY: number = 0;
  static MouseDownX: number = 0;
  static MouseDownY: number = 0;
  static MouseDown: boolean = false;
  static ButtonState: MouseState;
  static MiddleMouseDown: boolean = false;
  static Dragging: boolean = false;
  static target: any;
  static CollisionPosition: THREE.Vector3 = new THREE.Vector3();
  static Vector: THREE.Vector2 = new THREE.Vector2();
  static Client: THREE.Vector2 = new THREE.Vector2();

  //button states
  static leftDown: boolean = false;
  static leftClick: boolean = false;
  static rightDown: boolean = false;
  static rightClick: boolean = false;

  //positions
  static position: THREE.Vector2 = new THREE.Vector2();

  //MouseEvent client x/y
  static positionClient: THREE.Vector2 = new THREE.Vector2();

  //Game UI mouse position
  static positionUI: THREE.Vector2 = new THREE.Vector2();

  //UI Control State
  static downItem: GUIControl;
  static clickItem: GUIControl;

  constructor(){

  }

  static Update(x: number, y: number){
    Mouse.positionClient.x = x;
    Mouse.positionClient.y = y;
    Mouse.position.x = Mouse.Vector.x = ( x / window.innerWidth ) * 2 - 1;
    Mouse.position.y = Mouse.Vector.y = - ( y / window.innerHeight ) * 2 + 1; 
    Mouse.positionUI.x = Mouse.Vector.x = ( x - (window.innerWidth/2) );
    Mouse.positionUI.y = Mouse.Vector.y = - ( y -(window.innerHeight/2) ); 
  }

  static getMouseAxis(axis: MouseAxis){
    if (axis == MouseAxis.X){
      if (Mouse.MouseX == Mouse.OldMouseX)
        return 0;
      else if (Mouse.MouseX > Mouse.OldMouseX)
        return 1;

      return -1;
    }else{
      if (Mouse.MouseY == Mouse.OldMouseY)
        return 0;
      else if (Mouse.MouseY < Mouse.OldMouseY)
        return 1;

      return -1;
    }
  }

}