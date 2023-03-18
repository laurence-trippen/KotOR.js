/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 */

import { OdysseyModel, OdysseyModelNode } from ".";
import { OdysseyModelNodeType } from "../enums/odyssey/OdysseyModelNodeType";

/* @file
 * The OdysseyModelNodeReference
 */

export class OdysseyModelNodeReference extends OdysseyModelNode {
  modelName: string;
  reattachable: number;

  constructor(parent: OdysseyModelNode){
    super(parent);
    this.type |= OdysseyModelNodeType.Reference;
  }

  readBinary(odysseyModel: OdysseyModel){
    super.readBinary(odysseyModel);

    this.modelName = this.odysseyModel.mdlReader.readChars(32);
    this.reattachable = this.odysseyModel.mdlReader.readInt32();
  }

}