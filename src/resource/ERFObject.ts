/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 */

import isBuffer from "is-buffer";
import * as path from "path";
import { BinaryReader } from "../BinaryReader";
import { BinaryWriter } from "../BinaryWriter";
import { AsyncLoop } from "../utility/AsyncLoop";
import { GameFileSystem } from "../utility/GameFileSystem";
import { ResourceTypes } from "./ResourceTypes";

/* @file
 * The ERFObject class.
 */

export interface ERFObjectHeader {
  fileType: string;
  fileVersion: string;
  languageCount: number;
  localizedStringSize: number;
  entryCount: number;
  offsetToLocalizedString: number;
  offsetToKeyList: number;
  offsetToResourceList: number;
  buildYear: number;
  buildDay: number;
  DescriptionStrRef: number;
  reserved: Buffer;
}

export interface ERFLanguage {
  languageId: number;
  stringSize: number;
  value: string;
}

export interface ERFKeyEntry {
  resRef: string;
  resId: number;
  resType: number;
  unused: number;
}

export interface ERFResource {
  offset: number;
  size: number;
  data: Buffer;
}
  
const ERF_HEADER_SIZE = 160;

export class ERFObject {
  resource_path: string;
  buffer: Buffer;
  inMemory: boolean = false;
  
  localizedStrings: ERFLanguage[] = [];
  keyList: ERFKeyEntry[] = [];
  resources: ERFResource[] = [];
  header: ERFObjectHeader;
  pathInfo: path.ParsedPath;
  reader: BinaryReader;
  erfDataOffset: number;
  group: string = 'erf';

  constructor(file?: string|Buffer){
    this.localizedStrings = [];
    this.keyList = [];
    this.resources = [];

    this.header = {
      fileType: 'MOD ',
      fileVersion: 'V1.0'
    } as ERFObjectHeader;

    if(isBuffer(file)){
      this.inMemory = true;
      this.buffer = file as Buffer;
    }else if(typeof file === 'string'){
      this.resource_path = file;
      this.inMemory = false;
      this.pathInfo = path.parse(file);
    }
  }

  async load(): Promise<ERFObject> {
    if(!this.inMemory){
      await this.loadFromDisk();
      return this;
    }else{
      await this.loadFromBuffer();
      return this;
    }
  }

  async loadFromDisk(): Promise<void> {
    try{
      const fd = await GameFileSystem.open(this.resource_path, 'r');
      let header = Buffer.alloc(ERF_HEADER_SIZE);
      await GameFileSystem.read(fd, header, 0, ERF_HEADER_SIZE, 0);
      this.reader = new BinaryReader(header);

      this.header.fileType = this.reader.readChars(4);
      this.header.fileVersion = this.reader.readChars(4);

      this.header.languageCount = this.reader.readUInt32();
      this.header.localizedStringSize = this.reader.readUInt32();
      this.header.entryCount = this.reader.readUInt32();
      this.header.offsetToLocalizedString = this.reader.readUInt32();
      this.header.offsetToKeyList = this.reader.readUInt32();
      this.header.offsetToResourceList = this.reader.readUInt32();
      this.header.buildYear = this.reader.readUInt32();
      this.header.buildDay = this.reader.readUInt32();
      this.header.DescriptionStrRef = this.reader.readUInt32();
      this.header.reserved = this.reader.readBytes(116);               //Byte 116

      header = Buffer.allocUnsafe(0);

      //Enlarge the buffer to the include the entire structre up to the beginning of the image file data
      this.erfDataOffset = (this.header.offsetToResourceList + (this.header.entryCount * 8));
      header = Buffer.alloc(this.erfDataOffset);
      await GameFileSystem.read(fd, header, 0, this.erfDataOffset, 0);
      this.reader.reuse(header);

      this.reader.seek(this.header.offsetToLocalizedString);

      for (let i = 0; i < this.header.languageCount; i++) {
        let language: ERFLanguage = {} as ERFLanguage;
        language.languageId = this.reader.readUInt32();
        language.stringSize = this.reader.readUInt32();
        language.value = this.reader.readChars(language.stringSize);
        this.localizedStrings.push(language);
      }

      this.reader.seek(this.header.offsetToKeyList);

      for (let i = 0; i < this.header.entryCount; i++) {
        let key: ERFKeyEntry = {} as ERFKeyEntry;
        key.resRef = this.reader.readChars(16).replace(/\0[\s\S]*$/g,'').trim().toLowerCase();
        key.resId = this.reader.readUInt32();
        key.resType = this.reader.readUInt16();
        key.unused = this.reader.readUInt16();
        this.keyList.push(key);
      }

      this.reader.seek(this.header.offsetToResourceList);

      for (let i = 0; i < this.header.entryCount; i++) {
        let resource: ERFResource = {} as ERFResource;
        resource.offset = this.reader.readUInt32();
        resource.size = this.reader.readUInt32();
        this.resources.push(resource);
      }

      header = Buffer.allocUnsafe(0);
      this.reader.dispose();

      await GameFileSystem.close(fd);
    }catch(e){
      console.error(e);
    }
  }

  async loadFromBuffer(): Promise<void> {
    let header = Buffer.from(this.buffer, 0, ERF_HEADER_SIZE);
    this.reader = new BinaryReader(header);

    this.header.fileType = this.reader.readChars(4);
    this.header.fileVersion = this.reader.readChars(4);

    this.header.languageCount = this.reader.readUInt32();
    this.header.localizedStringSize = this.reader.readUInt32();
    this.header.entryCount = this.reader.readUInt32();
    this.header.offsetToLocalizedString = this.reader.readUInt32();
    this.header.offsetToKeyList = this.reader.readUInt32();
    this.header.offsetToResourceList = this.reader.readUInt32();
    this.header.buildYear = this.reader.readUInt32();
    this.header.buildDay = this.reader.readUInt32();
    this.header.DescriptionStrRef = this.reader.readUInt32();
    this.header.reserved = this.reader.readBytes(116);                 //Byte 116

    header = Buffer.allocUnsafe(0);
    this.reader.dispose();

    //Enlarge the buffer to the include the entire structre up to the beginning of the image file data
    this.erfDataOffset = (this.header.offsetToResourceList + (this.header.entryCount * 8));
    header = Buffer.from(this.buffer, 0, this.erfDataOffset);
    this.reader.reuse(header);

    this.reader.seek(this.header.offsetToLocalizedString);

    for (let i = 0; i < this.header.languageCount; i++) {
      let language: ERFLanguage = {} as ERFLanguage;
      language.languageId = this.reader.readUInt32();
      language.stringSize = this.reader.readUInt32();
      language.value = this.reader.readChars(language.stringSize);
      this.localizedStrings.push(language);
    }

    this.reader.seek(this.header.offsetToKeyList);

    for (let i = 0; i < this.header.entryCount; i++) {
      let key: ERFKeyEntry = {} as ERFKeyEntry;
      key.resRef = this.reader.readChars(16).replace(/\0[\s\S]*$/g,'').trim().toLowerCase();
      key.resId = this.reader.readUInt32();
      key.resType = this.reader.readUInt16();
      key.unused = this.reader.readUInt16();
      this.keyList.push(key);
    }

    this.reader.seek(this.header.offsetToResourceList);

    for (let i = 0; i < this.header.entryCount; i++) {
      let resource: ERFResource = {} as ERFResource;
      resource.offset = this.reader.readUInt32();
      resource.size = this.reader.readUInt32();
      this.resources.push(resource);
    }

    header = Buffer.allocUnsafe(0);
    this.reader.dispose();
  }

  getResource(resRef: string, resType: number): ERFResource{
    resRef = resRef.toLowerCase();
    for(let i = 0; i < this.keyList.length; i++){
      let key = this.keyList[i];
      if (key.resRef == resRef && key.resType == resType) {
        return this.resources[key.resId];
      }
    };
    return undefined;
  }

  async getResourceBuffer(resource: ERFResource): Promise<Buffer> {
    if (typeof resource == 'undefined') {
      return Buffer.allocUnsafe(0);
    }


    if(!resource.size){
      return Buffer.allocUnsafe(0);
    }

    const buffer = Buffer.alloc(resource.size);

    if(this.inMemory){
      this.buffer.copy(buffer, 0, resource.offset, resource.offset + (resource.size - 1));
      return buffer;
    }else{
      const fd = await GameFileSystem.open(this.resource_path, 'r');
      await GameFileSystem.read(fd, buffer, 0, buffer.length, resource.offset);
      await GameFileSystem.close(fd);
    }

    return buffer;
  }

  async getResourceBufferByResRef(resRef: string, resType: number): Promise<Buffer> {
    const resource = this.getResource(resRef, resType);
    if (typeof resource === 'undefined') {
      console.error('getResourceBufferByResRef', resRef, resType, resource);
      return Buffer.allocUnsafe(0);
    }

    return await this.getResourceBuffer(resource);
  }

  getResourcesByType(resType: number): ERFResource[] {
    const resources: ERFResource[] = [];
    for(let i = 0; i < this.keyList.length; i++){
      const key = this.keyList[i];
      if (key.resType == resType) {
        resources.push(this.resources[key.resId]);
      }
    };
    return resources;
  }

  async exportRawResource(directory: string, resref: string, restype: number = 0x000F): Promise<Buffer> {
    if(directory == null){
      return Buffer.allocUnsafe(0);
    }

    const resource = this.getResource(resref, restype);
    if(!resource){
      return Buffer.allocUnsafe(0);
    }
    
    if(this.inMemory){
      const buffer = Buffer.from(this.buffer, resource.offset, resource.offset + (resource.size - 1));
      await GameFileSystem.writeFile(path.join(directory, resref+'.'+ResourceTypes.getKeyByValue(restype)), buffer);
      return buffer;
    }else{
      let buffer = Buffer.alloc(resource.size);
      const fd = await GameFileSystem.open(this.resource_path, 'r');
      await GameFileSystem.read(fd, buffer, 0, resource.size, resource.offset);
      console.log('ERF Export', 'Writing File', path.join(directory, resref+'.'+ResourceTypes.getKeyByValue(restype)));
      await GameFileSystem.writeFile(
        path.join(directory, resref+'.'+ResourceTypes.getKeyByValue(restype)), buffer
      );
      return buffer;
    }
  }

  addResource(resRef: string, resType: number, buffer: Buffer){

    const resId = this.resources.push({
      offset: -1,
      size: buffer.length,
      data: buffer
    }) - 1;

    this.keyList.push({
      resRef: resRef,
      resId: resId,
      resType: resType,
      unused: 0
    });

  }

  export( file: string, onExport?: Function, onError?: Function ){
    return new Promise( (resolve: Function, reject: Function) => {

      if(!file){
        reject('Failed to export: Missing file path.');
        return;
      }

      let buffer = this.getExportBuffer();
      GameFileSystem.writeFile( file, buffer ).then( () => {
        if(typeof onExport === 'function')
          onExport();

        resolve();
      }).catch( (err) => {
        console.error(err);
        if(typeof onError === 'function')
          onError(err);
        reject();
      });

    });
  }

  getExportBuffer(){

    let output = new BinaryWriter();

    let keyEleLen = 24;
    let resEleLen = 8;
    let locStringsLen = 0;

    for(let i = 0; i < this.localizedStrings.length; i++){
      locStringsLen += (this.localizedStrings[i].value.length + 8);
    }

    this.header.offsetToLocalizedString = ERF_HEADER_SIZE;
    this.header.languageCount = this.localizedStrings.length;
    this.header.entryCount = this.keyList.length;
    this.header.offsetToKeyList = ERF_HEADER_SIZE + locStringsLen;
    this.header.offsetToResourceList = ERF_HEADER_SIZE + locStringsLen + (this.header.entryCount * keyEleLen);

    //Offset to the beginning of the data block
    let offset = this.header.offsetToResourceList + (this.header.entryCount * resEleLen);
    //Update the resource data offsets
    for(let i = 0; i < this.resources.length; i++){
      this.resources[i].offset = offset;
      offset += this.resources[i].size;
    }

    output.writeString(this.header.fileType);
    output.writeString(this.header.fileVersion);
    output.writeUInt32(this.header.languageCount);
    output.writeUInt32(this.header.localizedStringSize);
    output.writeUInt32(this.header.entryCount);
    output.writeUInt32(this.header.offsetToLocalizedString);
    output.writeUInt32(this.header.offsetToKeyList);
    output.writeUInt32(this.header.offsetToResourceList);
    output.writeUInt32(new Date().getFullYear() - 1900);
    output.writeUInt32(ERFObject.DayOfTheYear());
    output.writeUInt32(0);
    output.writeBytes(Buffer.alloc(116));

    //LocalStrings
    for(let i = 0; i < this.localizedStrings.length; i++){
      output.writeUInt32(this.localizedStrings[i].languageId);
      output.writeUInt32(this.localizedStrings[i].stringSize);
      output.writeString(this.localizedStrings[i].value);
    }

    //Key List
    for(let i = 0; i < this.keyList.length; i++){
      output.writeString( this.keyList[i].resRef.padEnd(16, '\0').substr(0, 16) );
      output.writeUInt32( this.keyList[i].resId );
      output.writeUInt16( this.keyList[i].resType );
      output.writeUInt16( 0 );
    }

    //Resource List
    for(let i = 0; i < this.resources.length; i++){
      output.writeUInt32( this.resources[i].offset );
      output.writeUInt32( this.resources[i].size );
    }

    //Data
    for(let i = 0; i < this.resources.length; i++){
      output.writeBytes( this.resources[i].data );
    }

    return output.buffer;
  }
  
  static DayOfTheYear(date?: Date) {
    if(!date){
      date = new Date(Date.now());
    }
  
    return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
  };

}
