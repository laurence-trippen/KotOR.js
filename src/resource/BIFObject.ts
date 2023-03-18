/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 */

import { BinaryReader } from "../BinaryReader";
import * as fs from 'fs';
import * as path from 'path';
import { Utility } from "../utility/Utility";
import { KEYManager } from "../managers/KEYManager";
import { ResourceTypes } from "./ResourceTypes";
import isBuffer from "is-buffer";
import { GameFileSystem } from "../utility/GameFileSystem";

/* @file
 * The BIFObject class.
 */

export interface IResourceDiskInfo {
  pathInfo: path.ParsedPath;
  path: string;
  existsOnDisk: boolean;
}

export interface BIFResource {
  ID: number;
  Offset: number;
  FileSize: number;
  ResType: number;
}

export class BIFObject {
  FileType: any;
  FileVersion: any;
  VariableResourceCount: any;
  FixedResourceCount: any;
  VariableTableOffset: any;
  VariableTableRowSize: number;
  VariableTableSize: number;
  reader: BinaryReader;

  resourceDiskInfo: IResourceDiskInfo;
  HeaderSize: number = 20;
  resources: BIFResource[];
  file: string;

  constructor(file: Buffer|string, onComplete?: Function){

    this.resourceDiskInfo = {
      path: '',
      existsOnDisk: false,
    } as IResourceDiskInfo;

    this.resources = [];

    if(isBuffer(file)){
      this.resourceDiskInfo.path = '';
      this.resourceDiskInfo.existsOnDisk = false;
      this.ReadFromMemory();
      if(typeof onComplete == 'function')
        onComplete(this);
    }else if(typeof file === 'string'){
      this.file = file;
      this.resourceDiskInfo.path = file;
      this.resourceDiskInfo.existsOnDisk = true;
      this.resourceDiskInfo.pathInfo = path.parse(this.resourceDiskInfo.path);
      try{
        this.ReadFromDisk(onComplete);
      }catch(e){
        if(typeof onComplete == 'function')
          onComplete(this);
        console.error(e);
      }
    }else{
      if(typeof onComplete == 'function')
        onComplete(this);
    }

  }

  ReadFromMemory(){
    //TODO
  }

  ReadFromDisk(onComplete?: Function){
    GameFileSystem.open(this.resourceDiskInfo.path, 'r').then((fd) => {
      const header = Buffer.alloc(this.HeaderSize);
      GameFileSystem.read(fd, header, 0, this.HeaderSize, 0).then( (buffer) => {
        this.reader = new BinaryReader(header);

        this.FileType = this.reader.readChars(4);
        this.FileVersion = this.reader.readChars(4);
        this.VariableResourceCount = this.reader.readUInt32();
        this.FixedResourceCount = this.reader.readUInt32();
        this.VariableTableOffset = this.reader.readUInt32();

        this.VariableTableRowSize = 16;
        this.VariableTableSize = this.VariableResourceCount * this.VariableTableRowSize;

        //Read variable tabs blocks
        const variableTable: Buffer = Buffer.alloc(this.VariableTableSize);
        GameFileSystem.read(fd, variableTable, 0, this.VariableTableSize, this.VariableTableOffset).then( () => {
          this.reader.reuse(variableTable);
          for(let i = 0; i < this.VariableResourceCount; i++){
            this.resources[i] = {
              ID: this.reader.readUInt32(),
              Offset: this.reader.readUInt32(),
              FileSize: this.reader.readUInt32(),
              ResType: this.reader.readUInt32()
            } as BIFResource;
          }

          this.reader.dispose();

          GameFileSystem.close(fd).then( () => {
            if(typeof onComplete == 'function')
              onComplete(this);
          }).catch( (err) => {
            if (err) {
              console.error("close error:  " + err.message);
              if(typeof onComplete == 'function')
                onComplete(this);
            }
          })
        }).catch( () => {
          if(typeof onComplete == 'function')
            onComplete(this);
        })
      }).catch( () => {
        if(typeof onComplete == 'function')
          onComplete(this);
      })
    }).catch((e) => {
      if (e) {
        console.error(e);
        throw 'BIFObject: Failed to open '+this.resourceDiskInfo.path+' for reading.';
      }
    });
  }

  GetResourceById(id: number){
    if(id != null){
      for(let i = 0; i < this.VariableResourceCount; i++){
        if(this.resources[i].ID == id){
          return this.resources[i];
        }
      }
    }
    return null;
  }

  GetResourcesByType(ResType: number){
    let arr: BIFResource[] = []
    if(ResType != null){
      for(let i = 0; i < this.VariableResourceCount; i++){
        if(this.resources[i].ResType == ResType){
          arr.push(this.resources[i]);
        }
      }
    }
    return arr;
  }

  GetResourceByLabel(label: string, ResType: number): BIFResource|undefined {
    if(label != null){
      let len = KEYManager.Key.keys.length;
      for(let i = 0; i < len; i++){
        let key = KEYManager.Key.keys[i];
        if(key.ResRef == label && key.ResType == ResType){
          for(let j = 0; j != this.resources.length; j++){
            let res = this.resources[j];
            if(res.ID == key.ResID && res.ResType == ResType){
              return res;
            }
          }
        }
      }
    }
    return undefined;
  }

  GetResourceData(res?: BIFResource, onComplete?: Function, onError?: Function){
    if(!!res){
      if(res.FileSize){
        GameFileSystem.open(this.resourceDiskInfo.path, 'r').then( (fd) => {
          let buffer = Buffer.alloc(res.FileSize);
          GameFileSystem.read(fd, buffer, 0, buffer.length, res.Offset).then( () => {
            GameFileSystem.close(fd).then( () => {
              if(typeof onComplete === 'function')
                onComplete(buffer);
            });
          }).catch( (err) => {
            console.error(err);
            if(typeof onComplete == 'function')
              onComplete(Buffer.alloc(0));
          });
        }).catch( (err) => {
          console.error(err);
          if(typeof onComplete == 'function')
            onComplete(Buffer.alloc(0));
        })
      }else{
        if(typeof onComplete == 'function')
          onComplete(Buffer.alloc(0));
      }
    }else{
      if(typeof onError == 'function')
        onError();
    }
  }

  async GetResourceDataAsync(res: BIFResource){
    return new Promise<Buffer>( (resolve, reject) => {
      if(res){
        if(res.FileSize){
          GameFileSystem.open(this.resourceDiskInfo.path, 'r').then( (fd) => {
            let buffer = Buffer.alloc(res.FileSize);
            GameFileSystem.read(fd, buffer, 0, buffer.length, res.Offset).then( () => {
              GameFileSystem.close(fd).then( () => {
                resolve(buffer);
              }).catch( () => {
                resolve(Buffer.allocUnsafe(0))
              });
            }).catch( (err) => {
              resolve(Buffer.allocUnsafe(0))
            })
          }).catch( () => {
            resolve(Buffer.allocUnsafe(0))
          })
        }else{
          resolve(Buffer.alloc(0));
        }
      }else{
        reject();
      }

    });
  }

  load( path: string, onLoad?: Function, onError?: Function ){

    let pathInfo = Utility.filePathInfo(path);

    if(pathInfo.location == 'archive' && pathInfo.archive.type == 'bif'){
      let key = KEYManager.Key.GetFileKey(pathInfo.file.name, ResourceTypes[pathInfo.file.ext]);
      if(key != null){
        const res = this.GetResourceByLabel(pathInfo.file.name, ResourceTypes[pathInfo.file.ext]);
        if(res){
          this.GetResourceData(res, (buffer: Buffer) => {
            if(typeof onLoad === 'function')
              onLoad(buffer);
          }, (e: any) => {
            if(typeof onError === 'function')
              onError('Resource not found in BIF archive '+pathInfo.archive.name);
          });
        }else{
          if(typeof onError === 'function')
            onError('Resource not found in BIF archive '+pathInfo.archive.name);
        }
      }
    }else{
      if(typeof onError === 'function')
        onError('Path is not pointing to a resource inside of a BIF archive');
    }

  }

  loadBifs(onComplete?: Function){

  }

  /*static load( path, onLoad = null, onError = null ){

    let pathInfo = Utility.filePathInfo(path);

    if(pathInfo.location == 'archive' && pathInfo.archive.type == 'bif'){
      let key = KEYManager.KEY.GetFileKey(pathInfo.file.name, ResourceTypes[pathInfo.file.ext]);
      if(key != null){

        Global.kotorBIF[pathInfo.archive.name].GetResourceData(Global.kotorBIF[pathInfo.archive.name].GetResourceByLabel(pathInfo.file.name, ResourceTypes[pathInfo.file.ext]), (buffer) => {
          if(typeof onLoad === 'function')
            onLoad(buffer);
        });

      }
    }else{
      if(typeof onError === 'function')
        onError('Path is not pointing to a resource inside of a BIF archive');
    }

  }*/

}