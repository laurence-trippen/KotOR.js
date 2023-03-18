/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 */

import * as THREE from "three";
import { OdysseyModel, OdysseyModelNode, OdysseyModelNodeMesh } from ".";
import { OdysseyModelNodeType } from "../enums/odyssey/OdysseyModelNodeType";
import { OdysseyArrayDefinition } from "../interface/odyssey/OdysseyArrayDefinition";

/* @file
 * The OdysseyModelNodeDangly
 */

export class OdysseyModelNodeDangly extends OdysseyModelNodeMesh {
  danglyDisplacement: number;
  danglyTightness: number;
  danglyPeriod: number;
  danglyMDLOffset: number;
  constraints: number[];
  danglyVec4: number[];
  contraintArrayDefinition: OdysseyArrayDefinition;

  constructor(parent: OdysseyModelNode){
    super(parent);
    this.type |= OdysseyModelNodeType.Dangly;
  }

  readBinary(odysseyModel: OdysseyModel){
    super.readBinary(odysseyModel);

    this.contraintArrayDefinition = OdysseyModel.ReadArrayDefinition(this.odysseyModel.mdlReader);

    this.danglyDisplacement = this.odysseyModel.mdlReader.readSingle();
    this.danglyTightness = this.odysseyModel.mdlReader.readSingle();
    this.danglyPeriod = this.odysseyModel.mdlReader.readSingle();

    this.danglyMDLOffset = this.odysseyModel.mdlReader.readUInt32();
    
    this.constraints = OdysseyModel.ReadArrayFloats(this.odysseyModel.mdlReader, this.odysseyModel.fileHeader.modelDataOffset + this.contraintArrayDefinition.offset, this.contraintArrayDefinition.count);
    this.odysseyModel.mdlReader.seek(this.odysseyModel.fileHeader.modelDataOffset + this.danglyMDLOffset);
    this.danglyVec4 = [];
    for(let i = 0; i < this.contraintArrayDefinition.count; i++){
      this.danglyVec4.push(
        this.odysseyModel.mdlReader.readSingle(), 
        this.odysseyModel.mdlReader.readSingle(), 
        this.odysseyModel.mdlReader.readSingle(), 
        this.constraints[i]
      );
    }

  }

}