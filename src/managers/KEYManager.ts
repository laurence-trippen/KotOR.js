import { AsyncLoop } from "../utility/AsyncLoop";
import { BIFObject } from "../resource/BIFObject";
import { KEYObject } from "../resource/KEYObject";
import * as path from 'path';
import { BIFManager } from "./BIFManager";
import { IBIFEntry } from "../interface/resource/IBIFEntry";

/**
 * KEYManager class.
 * 
 * KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 * 
 * @file KEYManager.ts
 * @author KobaltBlu <https://github.com/KobaltBlu>
 * @license {@link https://www.gnu.org/licenses/gpl-3.0.txt|GPLv3}
 */
export class KEYManager {

  static Key: KEYObject = new KEYObject();

  static Load( filepath: string, onComplete?: Function ){
    KEYManager.Key = new KEYObject();
    KEYManager.Key.loadFile(filepath, () => {
      KEYManager.LoadBIFs(onComplete);
    });
  }

  static LoadBIFs(onComplete?: Function){
    new AsyncLoop({
      array: KEYManager.Key.bifs,
      onLoop: async (bifRes: IBIFEntry, loop: AsyncLoop, index: number, count: number) => {
        const bifPath: string = bifRes.filename;
        const bif = new BIFObject(bifPath);
        await bif.load()
        BIFManager.bifIndexes.set( path.parse(bifRes.filename).name, index );
        BIFManager.bifs.set(index, bif);
        loop.next();
      }
    }).iterate(onComplete);
  }

}