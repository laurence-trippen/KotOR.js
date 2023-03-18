import { GameEffect } from "../effects";
import { GameEventType } from "../enums/events/GameEventType";
import { GFFDataType } from "../enums/resource/GFFDataType";
import { ModuleObject } from "../module";
import { GFFField } from "../resource/GFFField";
import { GFFStruct } from "../resource/GFFStruct";
import { GameEvent } from "./GameEvent";

export class EventRemoveEffect extends GameEvent {
  effect: GameEffect;
  constructor(){
    super();

    //Event Type
    this.type = GameEventType.EventRemoveEffect;

    this.effect = undefined;

  }

  setEffect(effect: GameEffect){
    if(effect instanceof GameEffect){
      this.effect = effect;
    }
  }

  getEffect(){
    return this.effect;
  }

  eventDataFromStruct(struct: GFFStruct){
    if(struct instanceof GFFStruct){
      
    }
  }

  execute(){
    
  }

  export(){
    let struct = new GFFStruct( 0xABCD );

    struct.AddField( new GFFField(GFFDataType.DWORD, 'CallerId') ).SetValue( this.script.caller instanceof ModuleObject ? this.script.caller.id : 2130706432 );
    struct.AddField( new GFFField(GFFDataType.DWORD, 'Day') ).SetValue(this.day);
    let eventData = struct.AddField( new GFFField(GFFDataType.STRUCT, 'EventData') );
    if(this.effect instanceof GameEffect){
      let effectStruct = this.effect.save();
      effectStruct.SetType(0x1111);
      eventData.AddChildStruct( effectStruct );
    }
    struct.AddField( new GFFField(GFFDataType.DWORD, 'EventId') ).SetValue(this.id);
    struct.AddField( new GFFField(GFFDataType.DWORD, 'ObjectId') ).SetValue( this.script.object instanceof ModuleObject ? this.script.object.id : 2130706432 );
    struct.AddField( new GFFField(GFFDataType.DWORD, 'Time') ).SetValue(this.time);

    return struct;
  }

}
