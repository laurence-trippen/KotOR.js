import React, { ChangeEvent, useEffect, useState } from "react"
import { BaseTabProps } from "../../interfaces/BaseTabProps"
import { useEffectOnce } from "../../helpers/UseEffectOnce";

import { TabGFFEditorState, TabGFFEditorStateEventListenerTypes } from "../../states/tabs/TabGFFEditorState";

import * as KotOR from "../../KotOR";
import { Form, InputGroup } from "react-bootstrap";

export const TabGFFEditor = function(props: BaseTabProps){

  const tab: TabGFFEditorState = props.tab as TabGFFEditorState;
  const [gff, setGFF] = useState<KotOR.GFFObject>();
  const [selectedNode, setSelectedNode] = useState<KotOR.GFFField|KotOR.GFFStruct>();
  const [render, rerender] = useState<boolean>(true);

  const onEditorFileLoad = function(tab: TabGFFEditorState){
    setGFF(tab.gff);
  };

  const onNodeSelected = function(node: KotOR.GFFField|KotOR.GFFStruct){
    setSelectedNode(node);
    rerender(!render);
  };

  useEffectOnce( () => { //constructor
    tab.addEventListener<TabGFFEditorStateEventListenerTypes>('onEditorFileLoad', onEditorFileLoad);
    tab.addEventListener<TabGFFEditorStateEventListenerTypes>('onNodeSelected', onNodeSelected);

    return () => { //destructor
      tab.removeEventListener<TabGFFEditorStateEventListenerTypes>('onEditorFileLoad', onEditorFileLoad);
      tab.removeEventListener<TabGFFEditorStateEventListenerTypes>('onNodeSelected', onNodeSelected);
    };
  })

  return (
<>
  <div id="gffContainer" className="css-treeview container" style={{position: 'relative', overflow: 'hidden', height: '100%', width:'50%', float: 'left'}}>
    {
      (
        gff ? <GFFStructElement struct={ gff.RootNode } key={ gff.RootNode.uuid } open={true} tab={tab}  /> : <></>
      )
    }
  </div>
  <div id="gffProperties" className="container" style={{position: 'relative', overflow: 'auto', height: '100%', width:'50%', padding:'10px', float: 'left'}}>
    {(
      selectedNode ? (
        selectedNode instanceof KotOR.GFFField ? 
          <GFFFieldProperties node={selectedNode} /> :
        selectedNode instanceof KotOR.GFFStruct ? 
          <GFFStructProperties node={selectedNode} /> : 
        <></>
      ) : 
      <></>
    )}
  </div>
</>);

};

const GFFStructElement = function(props: any){
  const tab: TabGFFEditorState = props.tab as TabGFFEditorState;
  const [openState, setOpenState] = useState<boolean>(!!props.open);
  const struct: KotOR.GFFStruct = props.struct;
  const [render, rerender] = useState<boolean>(true);

  const onChangeCheckbox = (e: React.ChangeEvent<HTMLInputElement>, struct: KotOR.GFFStruct) => {
    setOpenState(!openState);
  };

  const onLabelClick = (e: React.MouseEvent<HTMLLabelElement>, struct: KotOR.GFFStruct) => {
    setOpenState(!openState);
    tab.setSelectedField(struct);
  }

  const onAddField = function(){
    struct.AddField(new KotOR.GFFField(KotOR.GFFDataType.BYTE, 'New Field [Untitled]', 0));
    rerender(!render);
  };

  if(struct){
    return (
      <li className="gff-struct">
        <input className="node-toggle" type="checkbox" onChange={(e) => onChangeCheckbox(e, props.struct)} />
        <label onClick={(e) => onLabelClick(e, props.struct)}>
          <span>[Struct ID: {struct.GetType()}]</span>
        </label>
        <ul className="gff-fields strt">
        {
          struct.GetFields().map( (field: KotOR.GFFField) => {
            return <GFFFieldElement field={ field } key={ field.uuid } tab={props.tab} />
          })
        }
        {( 
          <li className="gff-field add" onClick={(e) => onAddField()}>
            <span className="field-icon">
              <i className="fa-solid fa-plus"></i>
            </span>
            <span className="field-label">
              <a>[Add Field]</a>
            </span>
          </li> 
        )}
        </ul>
      </li>
    );
  }

  return <></>;
}

const GFFFieldElement = function(props: any){
  const tab: TabGFFEditorState = props.tab as TabGFFEditorState;
  const [openState, setOpenState] = useState<boolean>(!!props.open);
  const [render, rerender] = useState<boolean>(true);

  const field: KotOR.GFFField = props.field;

  if(field){
    let is_list = false;
    let field_value = '';
    switch(field.GetType()){
      case KotOR.GFFDataType.BYTE:
      case KotOR.GFFDataType.CHAR:
      case KotOR.GFFDataType.WORD:
      case KotOR.GFFDataType.SHORT:
      case KotOR.GFFDataType.DWORD:
      case KotOR.GFFDataType.INT:
      case KotOR.GFFDataType.DWORD64:
      case KotOR.GFFDataType.DOUBLE:
      case KotOR.GFFDataType.FLOAT:
      case KotOR.GFFDataType.RESREF:
      case KotOR.GFFDataType.CEXOSTRING:
        field_value = `Value: ${field.GetValue()}`;
      break;
      case KotOR.GFFDataType.LIST:
        field_value = `Structs: ${field.GetChildStructs().length}`;
        is_list = true;
      break;
      case KotOR.GFFDataType.STRUCT:
        field_value = '';
        is_list = true;
      break;
      default:
        field_value = '';
      break;
    }

    const onChangeCheckbox = (e: React.ChangeEvent<HTMLInputElement>, field: KotOR.GFFField) => {
      setOpenState(!openState);
    };

    const onLabelClick = (e: React.MouseEvent<HTMLLabelElement>, field: KotOR.GFFField) => {
      setOpenState(!openState);
      tab.setSelectedField(field);
    }

    const onAddStruct = function(){
      if(field.GetType() == KotOR.GFFDataType.LIST){
        const struct = new KotOR.GFFStruct(-1);
        field.AddChildStruct(struct);
        rerender(!render);
      }
    };

    return (
      <li className="gff-field">
        <input type="checkbox" checked={!openState} onChange={(e) => onChangeCheckbox(e, props.field)}/>
        <label className={ !is_list ? `single` : `list` } onClick={(e) => onLabelClick(e, props.field)}>
          <span>
            <span className="field-label">{field.GetLabel()}</span>&nbsp;
            <span className={`field-type ${KotOR.GFFDataType[field.GetType()]}`}>{`[${ KotOR.GFFObject.TypeValueToString( field.GetType() ) }]`}</span>&nbsp;
            <span className="field-value">{field_value}</span>
          </span>
        </label>
        <ul className="gff-fields hasList">
          {
            field.GetChildStructs().map( 
              (struct: KotOR.GFFStruct) => {
                return <GFFStructElement struct={ struct } key={ struct.uuid } tab={props.tab} />
              }
            )
          }
          {( field.GetType() == KotOR.GFFDataType.LIST ? ( 
          <li className="gff-struct add" onClick={ (e) => onAddStruct() }>
            <span className="struct-icon">
              <i className="fa-solid fa-plus"></i>
            </span>
            <span className="struct-label">
              <a>[Add Struct]</a>
            </span>
          </li> ) : <></> )}
        </ul>
      </li>
    );
  }
  return <></>;
}

const GFFStructProperties = function(props: any){
  const node: KotOR.GFFStruct = props.node;

  return <></>;
}

const GFFFieldProperties = function(props: any){
  const node: KotOR.GFFField = props.node;

  const [value, setValue] = useState<any>( '' );
  const [valueX, setValueX] = useState<any>( 0 );
  const [valueY, setValueY] = useState<any>( 0 );
  const [valueZ, setValueZ] = useState<any>( 0 );
  const [valueW, setValueW] = useState<any>( 0 );

  useEffect( () => {
    if(node instanceof KotOR.GFFField){
      setValue(node.GetValue());
      if(node.GetType() == KotOR.GFFDataType.VECTOR){
        setValueX(node.GetVector().x);
        setValueY(node.GetVector().y);
        setValueZ(node.GetVector().z);
      }
      
      if(node.GetType() == KotOR.GFFDataType.ORIENTATION){
        setValueX(node.GetOrientation().x);
        setValueY(node.GetOrientation().y);
        setValueZ(node.GetOrientation().z);
        setValueW(node.GetOrientation().w);
      }
    }
  });

  const onSimpleValueChange = function(e: ChangeEvent<HTMLInputElement>){
    let value: any = e.target.value;
    if(node.GetType() == KotOR.GFFDataType.RESREF){
      value = value.substring(0, 16);
    }

    if(node.GetType() == KotOR.GFFDataType.CEXOSTRING){
      value = new String(value);
    }

    if(node.GetType() == KotOR.GFFDataType.FLOAT){
      value = parseFloat(value);
    }

    if(node.GetType() == KotOR.GFFDataType.DOUBLE){
      value = parseFloat(value);
    }

    if(node.GetType() == KotOR.GFFDataType.BYTE){
      value = parseInt(value) & 0xFF;
    }

    if(node.GetType() == KotOR.GFFDataType.CHAR){
      value = parseInt(value) << 24 >> 24;
    }

    if(node.GetType() == KotOR.GFFDataType.WORD){
      value = parseInt(value) & 0xFFFF;
    }

    if(node.GetType() == KotOR.GFFDataType.SHORT){
      value = parseInt(value) << 16 >> 16;
    }

    if(node.GetType() == KotOR.GFFDataType.DWORD){
      value = parseInt(value) & 0xFFFFFFFF;
    }

    if(node.GetType() == KotOR.GFFDataType.INT){
      value = parseInt(value) << 0 >> 0;
    }

    if(node.GetType() == KotOR.GFFDataType.DWORD64){
      value = value;
    }

    if(node.GetType() == KotOR.GFFDataType.INT64){
      value = value;
    }

    node.SetValue(value);
    setValue(node.GetValue());
  }

  const onVectorValueChange = function(e: ChangeEvent<HTMLInputElement>, mode: 'x'|'y'|'z'){
    node.GetVector()[mode] = parseFloat(e.target.value);
    switch(mode){
      case 'x':
        setValueX(parseFloat(e.target.value));
      break;
      case 'y':
        setValueY(parseFloat(e.target.value));
      break;
      case 'z':
        setValueZ(parseFloat(e.target.value));
      break;
    }
  }

  const onOrientationValueChange = function(e: ChangeEvent<HTMLInputElement>, mode: 'x'|'y'|'z'|'w'){
    node.GetOrientation()[mode] = parseFloat(e.target.value);
    switch(mode){
      case 'x':
        setValueX(parseFloat(e.target.value));
      break;
      case 'y':
        setValueY(parseFloat(e.target.value));
      break;
      case 'z':
        setValueZ(parseFloat(e.target.value));
      break;
      case 'w':
        setValueW(parseFloat(e.target.value));
      break;
    }
  }

  if(node instanceof KotOR.GFFField){
    switch(node.GetType()){
      case KotOR.GFFDataType.BYTE:
      case KotOR.GFFDataType.CHAR:
      case KotOR.GFFDataType.WORD:
      case KotOR.GFFDataType.SHORT:
      case KotOR.GFFDataType.DWORD:
      case KotOR.GFFDataType.INT:
      case KotOR.GFFDataType.DWORD64:
      case KotOR.GFFDataType.INT64:
      case KotOR.GFFDataType.DOUBLE:
      case KotOR.GFFDataType.FLOAT:
      case KotOR.GFFDataType.RESREF:
      case KotOR.GFFDataType.CEXOSTRING:
        return (
          <fieldset>
            <legend>[{KotOR.GFFDataType[node.GetType()]}] - {node.GetLabel()}</legend>
            <InputGroup>
              <InputGroup.Text>Value</InputGroup.Text>
              <Form.Control
                placeholder=""
                aria-label=""
                aria-describedby="basic-addon1"
                type="text"
                value={value}
                onChange={ (e: ChangeEvent<HTMLInputElement>) => onSimpleValueChange(e) }
              />
            </InputGroup>
          </fieldset>
        );
      break;
      case KotOR.GFFDataType.LIST:
        return (
          <fieldset>
            <legend>[{KotOR.GFFDataType[node.GetType()]}]</legend>
          </fieldset>
        );
      break;
      case KotOR.GFFDataType.STRUCT:
        return (
          <fieldset>
            <legend>[{KotOR.GFFDataType[node.GetType()]}]</legend>
          </fieldset>
        );
      break;
      case KotOR.GFFDataType.VECTOR:
        return (
          <fieldset>
            <legend>[{KotOR.GFFDataType[node.GetType()]}]</legend>
            <InputGroup>
              <InputGroup.Text>X</InputGroup.Text>
              <Form.Control
                placeholder=""
                aria-label=""
                aria-describedby="basic-addon1"
                type="number"
                value={valueX}
                onChange={ (e: ChangeEvent<HTMLInputElement>) => onVectorValueChange(e, 'x') }
              />
            </InputGroup>
            <InputGroup>
              <InputGroup.Text>Y</InputGroup.Text>
              <Form.Control
                placeholder=""
                aria-label=""
                aria-describedby="basic-addon1"
                type="number"
                value={valueY}
                onChange={ (e: ChangeEvent<HTMLInputElement>) => onVectorValueChange(e, 'y') }
              />
            </InputGroup>
            <InputGroup>
              <InputGroup.Text>Z</InputGroup.Text>
              <Form.Control
                placeholder=""
                aria-label=""
                aria-describedby="basic-addon1"
                type="number"
                value={valueZ}
                onChange={ (e: ChangeEvent<HTMLInputElement>) => onVectorValueChange(e, 'z') }
              />
            </InputGroup>
          </fieldset>
        );
      break;
      case KotOR.GFFDataType.ORIENTATION:
        return (
          <fieldset>
            <legend>[{KotOR.GFFDataType[node.GetType()]}]</legend>
            <InputGroup>
              <InputGroup.Text>X</InputGroup.Text>
              <Form.Control
                placeholder=""
                aria-label=""
                aria-describedby="basic-addon1"
                type="number"
                value={valueX}
                onChange={ (e: ChangeEvent<HTMLInputElement>) => onOrientationValueChange(e, 'x') }
              />
            </InputGroup>
            <InputGroup>
              <InputGroup.Text>Y</InputGroup.Text>
              <Form.Control
                placeholder=""
                aria-label=""
                aria-describedby="basic-addon1"
                type="number"
                value={valueY}
                onChange={ (e: ChangeEvent<HTMLInputElement>) => onOrientationValueChange(e, 'y') }
              />
            </InputGroup>
            <InputGroup>
              <InputGroup.Text>Z</InputGroup.Text>
              <Form.Control
                placeholder=""
                aria-label=""
                aria-describedby="basic-addon1"
                type="number"
                value={valueZ}
                onChange={ (e: ChangeEvent<HTMLInputElement>) => onOrientationValueChange(e, 'z') }
              />
            </InputGroup>
            <InputGroup>
              <InputGroup.Text>W</InputGroup.Text>
              <Form.Control
                placeholder=""
                aria-label=""
                aria-describedby="basic-addon1"
                type="number"
                value={valueW}
                onChange={ (e: ChangeEvent<HTMLInputElement>) => onOrientationValueChange(e, 'w') }
              />
            </InputGroup>
          </fieldset>
        );
      break;
      default:
        return (
          <><b>Invalid Field Type: {node.GetType()}</b></>
        );
      break;
    }
  }

  return <></>
}