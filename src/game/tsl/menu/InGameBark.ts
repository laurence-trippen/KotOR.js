/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
*/

import { GameState } from "../../../GameState";
import { GUILabel, MenuManager } from "../../../gui";
import { InGameBark as K1_InGameBark } from "../../kotor/KOTOR";
import * as THREE from "three";
import { LIPObject } from "../../../resource/LIPObject";
import { ModuleCreature } from "../../../module";

/* @file
* The InGameBark menu class.
*/

export class InGameBark extends K1_InGameBark {

  declare LBL_BARKTEXT: GUILabel;

  constructor(){
    super();
    this.gui_resref = 'barkbubble_p';
    this.background = '';
    this.voidFill = false;
  }

  async MenuControlInitializer(skipInit: boolean = false) {
    await super.MenuControlInitializer(true);
    if(skipInit) return;
    return new Promise<void>((resolve, reject) => {
      this.LBL_BARKTEXT.addEventListener('click', (e: any) => {
        e.stopPropagation();
        this.Close();
      });
      resolve();
    });
  }

  bark(entry: any) {
    if (entry) {
      this.Show();
      this.LBL_BARKTEXT.setText(entry.text);
      let size = new THREE.Vector3();
      this.LBL_BARKTEXT.text.geometry.boundingBox?.getSize(size);
      this.tGuiPanel.extent.height = Math.ceil(size.y) + 14;
      this.tGuiPanel.resizeControl();
      this.tGuiPanel.widget.position.x = -window.innerWidth / 2 + this.tGuiPanel.extent.width / 2 + 10;
      this.tGuiPanel.widget.position.y = window.innerHeight / 2 - this.tGuiPanel.extent.height / 2 - 134;
      this.LBL_BARKTEXT.setText(entry.text);
      if (entry.sound != '') {
        console.log('lip', entry.sound);
        LIPObject.Load(entry.sound).then((lip: LIPObject) => {
          if (entry.speaker instanceof ModuleCreature) {
            entry.speaker.setLIP(lip);
          }
        });
        MenuManager.InGameDialog.audioEmitter.PlayStreamWave(entry.sound, undefined, (error = false) => {
          if (!error) {
            this.Close();
          } else {
            setTimeout(() => {
              this.Close();
            }, 3000);
          }
        });
      } else if (entry.vo_resref != '') {
        console.log('lip', entry.vo_resref);
        LIPObject.Load(entry.vo_resref).then((lip: LIPObject) => {
          if (entry.speaker instanceof ModuleCreature) {
            entry.speaker.setLIP(lip);
          }
        });
        MenuManager.InGameDialog.audioEmitter.PlayStreamWave(entry.vo_resref, undefined, (error = false) => {
          if (!error) {
            this.Close();
          } else {
            setTimeout(() => {
              this.Close();
            }, 3000);
          }
        });
      } else {
        console.error('VO ERROR', entry);
        setTimeout(() => {
          this.Close();
        }, 3000);
      }
    }
  }
  
}