/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
*/

import * as fs from "fs";
import * as path from "path";
import { recursive } from "./utility/RecursiveDirectoryReader";
import { GameState } from "./GameState";
import { LoadingScreen } from "./LoadingScreen";
import { ERFObject } from "./resource/ERFObject";
import { ERFManager } from "./managers/ERFManager";
import { KEYManager } from "./managers/KEYManager";
import { TLKManager } from "./managers/TLKManager";
import { TwoDAManager } from "./managers/TwoDAManager";
import { ResourceLoader } from "./resource/ResourceLoader";
import { ResourceTypes } from "./resource/ResourceTypes";
import { RIMObject } from "./resource/RIMObject";
import { ApplicationProfile } from "./utility/ApplicationProfile";
import { AsyncLoop } from "./utility/AsyncLoop";
import { RIMManager } from "./managers/RIMManager";

/* @file
* The GameInitializer class. Handles the loading of game archives for use later during runtime
*/

export class GameInitializer {

  static currentGame: any;
  static files: string[] = [];

  static Init(props: any){

    props = Object.assign({
      game: null,
      onLoad: null,
      onError: null
    }, props);

    if(GameInitializer.currentGame != props.game){
      GameInitializer.currentGame = props.game;
      
      LoadingScreen.main.SetMessage("Loading Keys");
      KEYManager.Load(path.join(ApplicationProfile.directory, 'chitin.key'), () => {
        LoadingScreen.main.SetMessage("Loading Game Resources");
        GameInitializer.LoadGameResources( () => {
          //Load the TLK File
          LoadingScreen.main.SetMessage("Loading TLK File");
          TLKManager.LoadTalkTable(path.join(ApplicationProfile.directory, 'dialog.tlk')).then( () => {
            if(typeof props.onLoad === 'function'){
              props.onLoad();
            }
          })
          //   if(props.onLoad != null)
          //     props.onLoad();
          // }, function(num: any, total: any){
          //   //onProgress
          //   LoadingScreen.main.SetMessage("Loading TLK File: "+num+" / "+total);
          // });
        });
      });

    }else{
      if(props.onLoad != null)
        props.onLoad();
    }

  }

  static LoadGameResources(onSuccess?: Function){

    LoadingScreen.main.SetMessage("Loading BIF's");

    LoadingScreen.main.SetMessage("Loading RIM's");
    GameInitializer.LoadRIMs( () => {

      GameInitializer.LoadModules( () => {

        //Load all of the 2da files into memory
        GameInitializer.Load2DAs( () => {
          LoadingScreen.main.SetMessage('Loading: Texture Packs');
          GameInitializer.LoadTexturePacks( () => {

            GameInitializer.LoadGameAudioResources( {
              folder: 'streammusic',
              name: 'StreamMusic',
              onSuccess: () => {
                GameInitializer.LoadGameAudioResources( {
                  folder: 'streamsounds',
                  name: 'StreamSounds',
                  onSuccess: () => {
                    if(GameState.GameKey != 'TSL'){
                      GameInitializer.LoadGameAudioResources( {
                        folder: 'streamwaves',
                        name: 'StreamWaves',
                        onSuccess: () => {

                          if(onSuccess != null)
                            onSuccess();
                        }
                      });
                    }else{
                      GameInitializer.LoadGameAudioResources( {
                        folder: 'streamvoice',
                        name: 'StreamSounds',
                        onSuccess: () => {

                          if(onSuccess != null)
                            onSuccess();
                        }
                      });
                    }
                  }
                });
              }
            });
          });
        });

      });

    });


  }

  static LoadRIMs(onSuccess?: Function){
    if(GameState.GameKey != 'TSL'){
      let data_dir = path.join(ApplicationProfile.directory, 'rims');
      LoadingScreen.main.SetMessage('Loading: RIM Archives');

      fs.readdir(data_dir, (err, filenames) => {
        if (err){
          console.warn('GameInitializer.LoadRIMs', err);
          if(typeof onSuccess === 'function')
            onSuccess();
            
          return;
        }

        let rims: any[] = filenames.map(function(file) {
          let filename = file.split(path.sep).pop();
          let args = filename.split('.');
          return {
            ext: args[1].toLowerCase(), 
            name: args[0], 
            filename: filename
          } as any;
        }).filter(function(file_obj){
          return file_obj.ext == 'rim';
        });

        RIMManager.Load(rims).then( () => {
          if(typeof onSuccess === 'function')
            onSuccess();
        });
      });
    }else{
      if(onSuccess != null)
        onSuccess();
    }
  }

  static LoadModules(onSuccess?: Function){
    let data_dir = path.join(ApplicationProfile.directory, 'modules');
    LoadingScreen.main.SetMessage('Loading: Module Archives');
    
    fs.readdir(data_dir, (err, filenames) => {
      if (err){
        console.warn('GameInitializer.LoadModules', err);
        if(typeof onSuccess === 'function')
          onSuccess();
          
        return;
      }

      let modules = filenames.map(function(file) {
        let filename = file.split(path.sep).pop();
        let args = filename.split('.');
        return {ext: args[1].toLowerCase(), name: args[0], filename: filename};
      }).filter(function(file_obj){
        return file_obj.ext == 'rim' || file_obj.ext == 'mod';
      });

      let loop = new AsyncLoop({
        array: modules,
        onLoop: (module_obj: any, asyncLoop: AsyncLoop) => {
          switch(module_obj.ext){
            case 'rim':
              new RIMObject(path.join(data_dir, module_obj.filename), (rim: RIMObject) => {
                if(rim instanceof RIMObject){
                  rim.group = 'Module';
                  RIMManager.addRIM(module_obj.name, rim);
                }
                asyncLoop.next();
              });
            break;
            case 'mod':
              new ERFObject(path.join(data_dir, module_obj.filename), (mod: ERFObject) => {
                if(mod instanceof ERFObject){
                  mod.group = 'Module';
                  ERFManager.addERF(module_obj.name, mod);
                }
                asyncLoop.next();
              });
            break;
            default:
              console.warn('GameInitializer.LoadModules', 'Encountered incorrect filetype', module_obj);
              asyncLoop.next();
            break;
          }
        }
      });
      loop.iterate(() => {
        if(typeof onSuccess === 'function')
          onSuccess();
      });
    });
  }

  static Load2DAs(onSuccess?: Function){
    LoadingScreen.main.SetMessage('Loading: 2DA\'s');
    TwoDAManager.Load2DATables(() => {
      if(typeof onSuccess === 'function')
        onSuccess();
    });
  }

  static LoadTexturePacks(onSuccess?: Function){
    let data_dir = path.join(ApplicationProfile.directory, 'TexturePacks');

    fs.readdir(data_dir, (err, filenames) => {
      if (err){
        console.warn('GameInitializer.LoadTexturePacks', err);
        if(typeof onSuccess === 'function')
          onSuccess();

        return;
      }

      let erfs = filenames.map(function(file) {
        let filename = file.split(path.sep).pop();
        let args = filename.split('.');
        return {ext: args[1].toLowerCase(), name: args[0], filename: filename};
      }).filter(function(file_obj){
        return file_obj.ext == 'erf';
      });

      let loop = new AsyncLoop({
        array: erfs,
        onLoop: (erf_obj: any, asyncLoop: AsyncLoop) => {
          new ERFObject(path.join(data_dir, erf_obj.filename), (erf: ERFObject) => {
            if(erf instanceof ERFObject){
              erf.group = 'Textures';
              ERFManager.addERF(erf_obj.name, erf);
            }
            asyncLoop.next();
          });
        }
      });
      loop.iterate(() => {
        if(typeof onSuccess === 'function')
          onSuccess();
      });
    });
  }

  static LoadGameAudioResources( args: any = {} ){

    args = Object.assign({
      folder: null,
      name: null,
      onSuccess: null,
    }, args);

    //console.log('Searching For Audio Files', args);
    let root = path.join(ApplicationProfile.directory, args.folder);
    let dir: any = {name: args.folder, dirs: [], files: []};

    recursive(root).then((files: string[]) => {
      // Files is an array of filename
      GameInitializer.files = files;
      for(let i = 0; i!=files.length; i++){
        let f = files[i];

        let _parsed = path.parse(f);

        let ext = _parsed.ext.substr(1,  _parsed.ext.length);

        if(typeof ResourceTypes[ext] != 'undefined'){
          //console.log(ext);
          ResourceLoader.setResource(ResourceTypes[ext], _parsed.name.toLowerCase(), {
            inArchive: false,
            file: f,
            resref: _parsed.name,
            resid: ResourceTypes[ext],
            ext: ext,
            offset: 0,
            length: 0
          });
        }

      }

      if(typeof args.onSuccess === 'function')
        args.onSuccess();
    }).catch( () => {
      
      if(typeof args.onSuccess === 'function')
        args.onSuccess();
    })
  }

}
