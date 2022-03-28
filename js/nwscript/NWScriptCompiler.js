
//const util = require('util');
const {
  OP_CPDOWNSP, OP_RSADD, OP_CPTOPSP, OP_CONST, OP_ACTION, OP_LOGANDII, OP_LOGORII, OP_INCORII, OP_EXCORII,
  OP_BOOLANDII, OP_EQUAL, OP_NEQUAL, OP_GEQ, OP_GT, OP_LT, OP_LEQ, OP_SHLEFTII, OP_SHRIGHTII, OP_USHRIGHTII,
  OP_ADD, OP_SUB, OP_MUL, OP_DIV, OP_MODII, OP_NEG, OP_COMPI, OP_MOVSP, OP_STORE_STATEALL, OP_JMP,   OP_JSR,
  OP_JZ, OP_RETN, OP_DESTRUCT, OP_NOTI, OP_DECISP, OP_INCISP, OP_JNZ, OP_CPDOWNBP, OP_CPTOPBP, OP_DECIBP, OP_INCIBP,
  OP_SAVEBP, OP_RESTOREBP, OP_STORE_STATE, OP_NOP, OP_T
} = require('./NWScriptOPCodes.js');

const NWEngineTypeUnaryTypeOffset = 0x10;
const NWEngineTypeBinaryTypeOffset = 0x30;

const NWCompileDataTypes = {
  'I' : 0x03,
  'F' : 0x04,
  'S' : 0x05,
  'O' : 0x06,
  'V' : 0x07,
  'STRUCT': 0x08,
  'II': 0x20,
  'FF': 0x21,
  'OO': 0x22,
  'SS': 0x23,
  'TT': 0x24,
  'IF': 0x25,
  'FI': 0x26,

  'VV': 0x3A,
  'VF': 0x3B,
  'FV': 0x3C,
};

class NWScriptCompiler {

  ast = null;
  basePointer = 0;
  stackPointer = 0;
  log = [];

  _eventListeners = {
    log: [],
    compile_start: [],
    compile_fail: [],
    compile_end: [],
  };

  constructor(ast = undefined){

    this.ast = ast;
    this.scopes = [];
    this.silent = false;

  }

  addEventListener(type, callback){
    const evList = this.getEventListenerListByType(type);
    if(evList){
      const evExists = this.getEventListener(type, callback);
      if(!evExists){
        evList.push(callback);
        return true;
      }
    }
    return false;
  }

  removeEventListener(type, callback){
    const evList = this.getEventListenerListByType(type);
    if(evList){
      const evExists = this.getEventListener(type, callback);
      if(evExists){
        const i = evList.indexOf(callback);
        evList.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  triggerEventListener(type){
    const evList = this.getEventListenerListByType(type);
    if(evList){
      for(let i = 0; i < evList.length; i++){
        if(typeof evList[i] == 'function')
          evList[i]();
      }
      return true;
    }
    return false;
  }

  getEventListenerListByType(type){
    const evList = this._eventListeners[type];
    if(typeof evList == 'object' && Array.isArray(evList)){
      return evList;
    }
    return undefined;
  }

  getEventListener(type, callback){
    const evList = this.getEventListenerListByType(type);
    if(evList){
      const i = evList.indexOf(callback);
      return evList[i];
    }
    return undefined;
  }

  opcodeDebug(name, buffer){
    if( this._silent ) return;
    console.log( (name + "                ").slice(0, 16), buffer );
  }

  scopePush( scope = undefined ){
    if(scope instanceof NWScriptScope){
      this.scopes.push( scope );
      this.scope = this.scopes[this.scopes.length-1];
    }
  }

  scopePop(){
    this.scopes.pop();
    this.scope = this.scopes[this.scopes.length-1];
  }

  scopeAddBytesWritten( nNumBytes = 0 ){
    //if( this._silent ) return;
    if(this.scope instanceof NWScriptScope){
      this.scope.bytes_written += nNumBytes;
    }
  }

  compile(){
    this.log = [];
    if(typeof this.ast === 'object' && this.ast.type == 'program'){
      if(this.ast.main){
        return this.compileMain();
      }else if(this.ast.startingConditional){
        return this.compileStartingConditional();
      }
    }
  }

  getStatementLength( statement ){
    const bpCache = this.basePointer;
    const spCache = this.stackPointer;
    this._silent = true;
    const buffer = this.compileStatement( statement );
    this._silent = false;
    this.basePointer = bpCache;
    this.spCache = spCache;
    return buffer.length;
  }

  getBlockOffset( func = undefined ){
    let offset = this.main_offset_start + this.ast.main.offset;
    let index = this.ast.functions.indexOf(func);
    for(let i = 0; i < index; i++){
      //offset
    }

    return offset;
  }

  compileMain(){
    this.basePointer  = 0;
    this.stackPointer = 0;
    this.scopes = [];
    if(typeof this.ast === 'object' && this.ast.type == 'program'){
      console.log('CompileMain: Begin');
      const buffer = Buffer.alloc(0);
      const buffers = [buffer];

      this.program_bytes_written = 0;
      this.scopePush( new NWScriptScope() );

      const globalStatements = this.ast.statements.filter( s => {
        return (s.type == 'variable' && s.is_const == false) || s.type == 'struct';
      });

      const hasGlobalBlock = globalStatements.length ? true : false;

      //MAIN or Global
      buffers.push( 
        this.writeJSR(
          this.getInstructionLength(OP_JSR) + 
          this.getInstructionLength(OP_RETN)
        ) 
      );
      buffers.push( this.writeRETN() );

      this.basePointerWriting = true;

      if(globalStatements.length){
        for(let i = 0; i < globalStatements.length; i++){
          buffers.push( this.compileStatement( globalStatements[i]) );
        }

        this.basePointerWriting = false;
        
        this.basePointer = this.stackPointer;
        this.stackPointer = 0;
      
        buffers.push( this.writeSAVEBP() );
        buffers.push( 
          this.writeJSR(
            this.getInstructionLength(OP_JSR) + 
            this.getInstructionLength(OP_RESTOREBP) + 
            ( (this.basePointer > 0) ? this.getInstructionLength(OP_MOVSP) : 0 ) + 
            this.getInstructionLength(OP_RETN)
          ) 
        );
      }

      //this.ast.main.blockSize = this.getStatementLength( this.ast.main );
      //console.log('main', this.ast.main.name, this.getStatementLength( this.ast.main ) );
      // for(let i = 0; i < this.ast.functions.length; i++){
      //   const global_function = this.ast.functions[i];
      //   global_function.blockSize = this.getStatementLength( global_function );
      //   console.log('global_function', global_function.name, global_function.blockSize);
      // }

      if(globalStatements.length){
        buffers.push( this.writeRESTOREBP() );
      }

      if(this.basePointer > 0){
        buffers.push( this.writeMOVSP( -this.basePointer ) );
        buffers.push( this.writeRETN() );
      }

      this.ast.main.blockSize = this.getStatementLength( this.ast.main );
      //console.log('main', this.ast.main.name, this.scope.bytes_written, this.ast.main.blockSize );

      this.program_bytes_written = this.scope.bytes_written;
      this.main_offset_start = this.scope.bytes_written;
      this.ast.main.blockOffset = this.main_offset_start;
      this.functionBlockStartOffset = this.ast.main.blockOffset + this.ast.main.blockSize;

      this.functionBlockOffset = this.functionBlockStartOffset;
      for(let i = 0; i < this.ast.functions.length; i++){
        const global_function = this.ast.functions[i];
        if(global_function.called){
          global_function.blockOffset = this.functionBlockOffset;
          global_function.blockSize = this.getStatementLength( global_function );

          //console.log('global_function', global_function.name, this.functionBlockOffset, global_function.blockSize);
          this.functionBlockOffset += global_function.blockSize;
        }
      }

      this.stackPointer = 0;

      //Compile MAIN
      buffers.push( this.compileFunction( this.ast.main ) );
      this.program_bytes_written += this.ast.main.blockSize;

      //Compile Global Functions
      for(let i = 0; i < this.ast.functions.length; i++){
        const global_function = this.ast.functions[i];
        if(global_function.called){
          buffers.push( this.compileFunction( global_function ) );
          this.program_bytes_written += global_function.blockSize;
        }
      }

      const program = Buffer.concat(buffers);
      this.scopePop();

      const NCS_Header = Buffer.alloc(8);
      NCS_Header.writeUInt8(0x4E, 0) // N
      NCS_Header.writeUInt8(0x43, 1) // C
      NCS_Header.writeUInt8(0x53, 2) // S
      NCS_Header.writeUInt8(0x20, 3) //  
      NCS_Header.writeUInt8(0x56, 4) // V
      NCS_Header.writeUInt8(0x31, 5) // 1
      NCS_Header.writeUInt8(0x2E, 6) // .
      NCS_Header.writeUInt8(0x30, 7) // 0
      
      const T = this.writeT(program.length + 13);
      console.log('CompileMain: Complete');
      return Buffer.concat([NCS_Header, T, program]);
    }
  }

  compileStartingConditional(){
    this.basePointer  = 0;
    this.stackPointer = 0;
    this.scopes = [];
    if(typeof this.ast === 'object' && this.ast.type == 'program'){
      console.log('CompileMain: Begin');
      const buffer = Buffer.alloc(0);
      const buffers = [buffer];

      this.program_bytes_written = 0;
      this.scopePush( new NWScriptScope() );

      const globalStatements = this.ast.statements.filter( s => {
        return (s.type == 'variable' && s.is_const == false) || s.type == 'struct';
      });

      const hasGlobalBlock = globalStatements.length ? true : false;

      buffers.push( this.writeRSADD(NWCompileDataTypes.I) );

      //JSR or Global
      buffers.push( 
        this.writeJSR(
          //this.getInstructionLength(OP_RSADD) + 
          this.getInstructionLength(OP_JSR) + 
          this.getInstructionLength(OP_RETN)
        ) 
      );
      buffers.push( this.writeRETN() );

      this.basePointerWriting = true;

      this.basePointer = 0;
      this.stackPointer = 0;

      if(globalStatements.length){
        let globalStatementsLength = 0;
        for(let i = 0; i < globalStatements.length; i++){
          //globalStatementsLength += this.getStatementLength(globalStatements[i]);
          buffers.push( this.compileStatement( globalStatements[i]) );
        }
      
        buffers.push( this.writeSAVEBP() );
        buffers.push( this.writeRSADD(NWCompileDataTypes.I) );

        this.basePointer = this.stackPointer - 4;
        this.stackPointer = 8;
        this.basePointerWriting = false;

        buffers.push( 
          this.writeJSR(
            this.getInstructionLength(OP_JSR) + 
            this.getInstructionLength(OP_CPDOWNSP) +   //
            this.getInstructionLength(OP_MOVSP) +      //
            this.getInstructionLength(OP_RESTOREBP) + 
            ( (this.basePointer > 0) ? this.getInstructionLength(OP_MOVSP) : 0 ) + 
            this.getInstructionLength(OP_RETN)
          ) 
        );

        buffers.push( this.writeCPDOWNSP( -(12 + this.basePointer) ) );
        buffers.push( this.writeMOVSP( -4 ) ); 
        buffers.push( this.writeRESTOREBP() );
        if(this.basePointer > 0) { buffers.push( this.writeMOVSP( -this.basePointer ) ); }
        buffers.push( this.writeRETN() );

      }else{
        this.basePointer = this.stackPointer - 4;
        this.stackPointer = 4;
        this.basePointerWriting = false;

        // buffers.push( this.writeCPDOWNSP( -(12 + this.basePointer) ) );
        // buffers.push( this.writeMOVSP( -4 ) ); 
        // buffers.push( this.writeRESTOREBP() );
        // buffers.push( this.writeMOVSP( -this.basePointer ) );
        // buffers.push( this.writeRETN() );

      }

      this.ast.startingConditional.blockSize = this.getStatementLength( this.ast.startingConditional );
      //console.log('startingConditional', this.ast.startingConditional.name, this.scope.bytes_written, this.ast.startingConditional.blockSize );

      this.program_bytes_written = this.scope.bytes_written;
      this.main_offset_start = this.scope.bytes_written;
      this.ast.startingConditional.blockOffset = this.main_offset_start;
      this.functionBlockStartOffset = this.ast.startingConditional.blockOffset + this.ast.startingConditional.blockSize;

      this.functionBlockOffset = this.functionBlockStartOffset;
      for(let i = 0; i < this.ast.functions.length; i++){
        const global_function = this.ast.functions[i];
        if(global_function.called){
          global_function.blockOffset = this.functionBlockOffset;
          global_function.blockSize = this.getStatementLength( global_function );

          //console.log('global_function', global_function.name, this.functionBlockOffset, global_function.blockSize);
          this.functionBlockOffset += global_function.blockSize;
        }
      }

      this.stackPointer = 0;

      //Compile MAIN
      buffers.push( this.compileFunction( this.ast.startingConditional ) );
      this.program_bytes_written += this.ast.startingConditional.blockSize;

      //Compile Global Functions
      for(let i = 0; i < this.ast.functions.length; i++){
        const global_function = this.ast.functions[i];
        if(global_function.called){
          buffers.push( this.compileFunction( global_function ) );
          this.program_bytes_written += global_function.blockSize;
        }
      }

      const program = Buffer.concat(buffers);
      this.scopePop();

      const NCS_Header = Buffer.alloc(8);
      NCS_Header.writeUInt8(0x4E, 0) // N
      NCS_Header.writeUInt8(0x43, 1) // C
      NCS_Header.writeUInt8(0x53, 2) // S
      NCS_Header.writeUInt8(0x20, 3) //  
      NCS_Header.writeUInt8(0x56, 4) // V
      NCS_Header.writeUInt8(0x31, 5) // 1
      NCS_Header.writeUInt8(0x2E, 6) // .
      NCS_Header.writeUInt8(0x30, 7) // 0
      
      const T = this.writeT(program.length + 13);
      console.log('CompileMain: Complete');
      return Buffer.concat([NCS_Header, T, program]);
    }
  }

  getDataTypeStackLength( datatype = null ){
    if(datatype && datatype.type == 'datatype'){
      switch(datatype.value){
        case 'void':    return 0;
        case 'vector':  return 12;
        case 'int':     return 4;
        case 'float':   return 4;
        case 'string':  return 4;
        case 'object':  return 4;
        default:        return 4;
      }
    }
    throw 'Invalid datatype object';
  }

  getStatementDataTypeSize( statement ){
    if(statement){
      if(statement.datatype) return this.getDataTypeStackLength(statement.datatype);
      if(statement.returntype) return this.getDataTypeStackLength(statement.returntype);
      if(statement.function_reference) return this.getDataTypeStackLength(statement.function_reference.returntype);
    }
    throw 'Invalid statement object';
  }

  compileStatement( statement ){
    if(statement){
      switch(statement.type){
        case 'literal':       return this.compileLiteral( statement );
        case 'variable':      return this.compileVariable( statement );
        case 'argument':      return this.compileArgument( statement );
        case 'struct':        return this.compileStruct( statement );
        case 'compare':       return this.compileCompare( statement );
        case 'function':      return this.compileFunction( statement );
        case 'function_call': return this.compileFunctionCall( statement );
        case 'block':         return this.compileAnonymousBlock( statements );
        case 'return':        return this.compileReturn( statement );
        case 'if':            return this.compileIf( statement );
        case 'switch':        return this.compileSwitch( statement );
        case 'do':            return this.compileDoWhileLoop( statement );
        case 'while':         return this.compileWhileLoop( statement );
        case 'for':           return this.compileForLoop( statement );
        case 'incor':         return this.compileINCOR( statement );
        case 'xor':           return this.compileEXCOR( statement );
        case 'comp':          return this.compileComp( statement );
        case 'add':           return this.compileAdd( statement );
        case 'sub':           return this.compileSub( statement );
        case 'mul':           return this.compileMul( statement );
        case 'div':           return this.compileDiv( statement );
        case 'neg':           return this.compileNEG( statement );
        case 'not':           return this.compileNOT( statement );
        case 'inc':           return this.compileINC( statement );
        case 'dec':           return this.compileDEC( statement );
        case 'continue':      return this.compileContinue( statement );
        case 'break':         return Buffer.alloc(0);
        default: console.error('unhandled statement', statement.type);
      }
    }
  }

  compileLiteral( statement = undefined ){
    const buffers = [];
    if(statement && statement.type == 'literal'){
      if(statement.datatype.value == 'vector'){
        buffers.push( this.writeCONST(NWCompileDataTypes.F, statement.value.x) );
        buffers.push( this.writeCONST(NWCompileDataTypes.F, statement.value.y) );
        buffers.push( this.writeCONST(NWCompileDataTypes.F, statement.value.z) );
      }else{
        buffers.push( this.writeCONST(statement.datatype.unary, statement.value) );
      }
    }
    return Buffer.concat(buffers);
  }

  getDataType( value ){
    if(typeof value == 'object'){
      if(value.type == 'literal') return value.datatype;
      if(value.type == 'variable') { return value.datatype || value?.variable_reference?.datatype || value?.variable_reference?.datatype; }
      if(value.type == 'argument') return value.datatype;
      if(value.type == 'property') return value.datatype;
      if(value.type == 'function_call') return value.function_reference.returntype;
      if(value.type == 'add') return this.getDataType(value.left);
      if(value.type == 'sub') return this.getDataType(value.left);
      if(value.type == 'mul') return this.getDataType(value.left);
      if(value.type == 'div') return this.getDataType(value.left);
      if(value.type == 'compare') return this.getDataType(value.left);
    }
  }

  compileVariable( statement = undefined ){
    const buffers = [];
    if(statement && statement.type == 'variable'){
      //console.log('variable', util.inspect(statement, {showHidden: false, depth: null, colors: true}));
      if(statement.struct){
        if(statement.declare === true){
          statement.stackPointer = this.stackPointer;
          statement.is_global = this.basePointerWriting;
          //console.log('struct.declare', statement);

          for(let i = 0; i < statement.struct_reference.properties.length; i++){
            const prop = statement.struct_reference.properties[i];
            if( this.getDataType(prop).value == 'vector'){
              buffers.push( this.writeRSADD( NWCompileDataTypes.F ) );
            }else{
              buffers.push( this.writeRSADD( this.getDataType(prop).unary ) );
            }
          }

        }else{
          if(statement.struct_reference && statement.variable_reference){
            if(statement.value){ //assigning
              //console.log('struct.assign', statement);
              buffers.push( this.compileStatement(statement.value) );
              const propertyStackPointer = (statement.struct_reference.stackPointer + statement.variable_reference.offsetPointer);
              if(statement.struct_reference.is_global){
                buffers.push( this.writeCPDOWNBP( (propertyStackPointer - this.basePointer), this.getDataTypeStackLength(statement.datatype) ) );
              }else{
                buffers.push( this.writeCPDOWNSP( (propertyStackPointer - this.stackPointer), this.getDataTypeStackLength(statement.datatype) ) );
              }
              buffers.push( this.writeMOVSP( -this.getDataTypeStackLength(statement.datatype) ) );
            }else{ //retrieving
              //console.log('struct.retrieve', statement);
              if(statement.struct_reference.is_global){
                buffers.push( this.writeCPTOPBP( statement.struct_reference.stackPointer - this.basePointer, statement.struct_reference.struct_reference.structDataLength ) );
              }else{
                buffers.push( this.writeCPTOPSP( statement.struct_reference.stackPointer - this.stackPointer, statement.struct_reference.struct_reference.structDataLength ) );
              }
              buffers.push( 
                this.writeDESTRUCT( 
                  statement.struct_reference.struct_reference.structDataLength, 
                  statement.variable_reference.offsetPointer, 
                  this.getDataTypeStackLength( statement.variable_reference.datatype ) 
                )
              );
            }
          }
        }
      }else{
        if(statement.declare === true){
          statement.stackPointer = this.stackPointer;
          statement.is_global = this.basePointerWriting;
          if(statement.datatype.value == 'vector'){
            buffers.push( this.writeRSADD( NWCompileDataTypes.F ) );
            buffers.push( this.writeRSADD( NWCompileDataTypes.F ) );
            buffers.push( this.writeRSADD( NWCompileDataTypes.F ) );
          }else{
            buffers.push( this.writeRSADD( statement.datatype.unary ) );
          }
          if(statement.value){
            buffers.push( this.compileStatement(statement.value) );
            buffers.push( this.writeCPDOWNSP( (statement.stackPointer - this.stackPointer), this.getDataTypeStackLength(statement.datatype) ) );
            buffers.push( this.writeMOVSP( -this.getDataTypeStackLength(statement.datatype) ) );
          }
        }else{
          if(statement.value){ //assigning
            buffers.push( this.compileStatement(statement.value) );
            if(statement.variable_reference.is_global){
              buffers.push( this.writeCPDOWNBP( (statement.variable_reference.stackPointer - this.basePointer), this.getDataTypeStackLength(statement.datatype) ) );
            }else{
              buffers.push( this.writeCPDOWNSP( (statement.variable_reference.stackPointer - this.stackPointer), this.getDataTypeStackLength(statement.datatype) ) );
            }
            buffers.push( this.writeMOVSP( -this.getDataTypeStackLength(statement.datatype) ) );
          }else{ //retrieving
            if(statement.is_global){
              if(statement.variable_reference.value.type == 'literal'){
                buffers.push( this.compileLiteral( statement.variable_reference.value ) );
              }else{
                buffers.push( this.writeCPTOPBP( statement.variable_reference.stackPointer - this.basePointer, this.getDataTypeStackLength(statement.datatype) ) );
              }
            }else{
              if(statement.variable_reference.is_engine_constant && statement.variable_reference.value.type == 'literal'){
                buffers.push( this.compileLiteral( statement.variable_reference.value ) );
              }else{
                buffers.push( this.writeCPTOPSP( statement.variable_reference.stackPointer - this.stackPointer, this.getDataTypeStackLength(statement.datatype) ) );
              }
            }
          }
        }
      }
    }
    return Buffer.concat(buffers);
  }

  compileStruct( statement = undefined ){
    const buffers = [];
    if(statement && statement.type == 'struct'){
      statement.stackPointer = this.stackPointer;
      statement.is_global = this.basePointerWriting;
      statement.structDataLength = 0;
      for(let i = 0; i < statement.properties.length; i++){
        const prop = statement.properties[i];
        prop.stackPointer = this.stackPointer;
        prop.offsetPointer = statement.structDataLength;
        if(prop.datatype.value == 'vector'){
          // commented this out because we don't add struct definitions to the stack
          // buffers.push( this.writeRSADD( NWCompileDataTypes.F ) );
          // buffers.push( this.writeRSADD( NWCompileDataTypes.F ) );
          // buffers.push( this.writeRSADD( NWCompileDataTypes.F ) );
          statement.structDataLength += 12;
        }else{
          // commented this out because we don't add struct definitions to the stack
          // buffers.push( this.writeRSADD( prop.datatype.unary ) );
          statement.structDataLength += 4;
        }
      }
    }
    return Buffer.concat(buffers);
  }

  compileArgument( statement = undefined ){
    const buffers = [];
    if(statement && statement.type == 'argument'){

    }
    return Buffer.concat(buffers);
  }

  compileReturn( statement = undefined ){
    const buffers = [];
    //Get the size of the return value of this block
    const nReturnDataSize = this.getStatementDataTypeSize(this.scope.block);
    //Push the return value to the stack if we have one
    if(statement.value){
      buffers.push( this.compileStatement( statement.value ) );
      const returnStackOffset = this.scope.block.spLengthCache - nReturnDataSize;
      const returnStackPointer = returnStackOffset - this.stackPointer;
      //Copy the return value down to the return value pointer of this block
      buffers.push( this.writeCPDOWNSP( returnStackPointer, nReturnDataSize ) );
    }

    //Clear the stack
    const stackOffset = (this.stackPointer - this.scope.block.spLengthCache);
    if(stackOffset){
      const postMOVSPStackPointer = this.stackPointer - nReturnDataSize;
      buffers.push( this.writeMOVSP( -stackOffset ) );
      this.stackPointer = postMOVSPStackPointer;
    }

    //Jump to the end of the current executing block
    const jmpOffset = (this.scope.block.jmp || 0) - this.scope.bytes_written;
    // console.log( jmpOffset.toString(16), 0x7FFFFFFF )
    buffers.push( this.writeJMP( this.scope.block.jmp ? jmpOffset : 0x7FFFFFFF ) );

    return Buffer.concat(buffers);
  }

  compileFunction( block = undefined ){
    const buffers = [];
    this.scopePush( new NWScriptScope() );
    this.scope.block = block;

    block.spLengthCache = this.stackPointer;
    // console.log('spLengthCache', block.spLengthCache);

    for(let i = 0; i < block.statements.length; i++){
      buffers.push( this.compileStatement( block.statements[i] ) );
    }

    //Clean up the block stack before exiting by 
    //removing any left over local variables created by this function
    const nStackOffset = (this.stackPointer - block.spLengthCache);
    if(nStackOffset){
      buffers.push( this.writeMOVSP(-nStackOffset));
    }

    const nReturnDataSize = this.getStatementDataTypeSize(this.scope.block);
    if(nReturnDataSize){
      buffers.push( this.writeMOVSP(-nReturnDataSize) );
    }

    block.jmp = this.scope.bytes_written;

    //Close out this function block with a RETN statement
    buffers.push( this.writeRETN() );

    this.scopePop();
    return Buffer.concat(buffers);
  }

  compileFunctionCall( statement = undefined ){
    const buffers = [];
    
    //console.log('function_call', util.inspect(statement, {showHidden: false, depth: null, colors: true}));
    if(statement && statement.type == "function_call"){
      //RETURNTYPE
      if(statement.function_reference.returntype){
        if(statement.function_reference.returntype.value != 'void'){
          //only call RSADD if this function has a return value and it isn't an engine routine
          if(!statement.function_reference.is_engine_action){
            if(statement.function_reference.returntype.unary == NWCompileDataTypes.V){
              buffers.push( this.writeRSADD(NWCompileDataTypes.F) );
              buffers.push( this.writeRSADD(NWCompileDataTypes.F) );
              buffers.push( this.writeRSADD(NWCompileDataTypes.F) );
            }else{
              buffers.push( this.writeRSADD(statement.function_reference.returntype.unary) );
            }
          }
        }
      }

      //ARGUMENTS
      const _arguments = statement.arguments.slice(0).reverse();
      const __arguments = statement.function_reference.arguments.slice(0).reverse();
      let argumentsDataSize = 0;
      for(let i = 0; i < __arguments.length; i++){
        let arg = _arguments[i];
        const arg_ref = __arguments[i];

        if(!arg){
          throw 'missing argument';
        }

        if(arg_ref.datatype.value == 'action'){
          buffers.push( this.writeSTORE_STATE( this.basePointer, this.stackPointer ) );
          buffers.push(
            this.writeJMP( 
              this.getInstructionLength(OP_JMP) + 
              this.getStatementLength( arg ) + 
              this.getInstructionLength(OP_RETN) 
            ) 
          );
          buffers.push( this.compileStatement(arg) );
          buffers.push( this.writeRETN() );
        }else{
          buffers.push( this.compileStatement(arg) );
        }
        argumentsDataSize += this.getStatementDataTypeSize(arg_ref);
      }

      //FUNCTIONCALL
      if(statement.action_id >= 0){ //ENGINE ROUTINE
        const returnSize = this.getDataTypeStackLength(statement.function_reference.returntype);
        buffers.push( this.writeACTION(0x00, statement.action_id, statement.arguments.length, returnSize, argumentsDataSize) );
      }else{ //LOCAL FUNCTION
        const jsrOffset = statement.function_reference.blockOffset - (this.program_bytes_written + this.scope.bytes_written);
        buffers.push( this.writeJSR(jsrOffset) );
      }
    }
    
    return Buffer.concat(buffers);
  }

  compileAnonymousBlock( statement = undefined ){
    const buffers = [];

    if(statement && statement.type == 'block'){
      statement.block_start = this.scope.bytes_written;

      statement.preStatementsSPCache = this.stackPointer;
      for(let i = 0; i < statement.statements.length; i++){
        buffers.push( this.compileStatement( statement.statements[i] ) );
      }

      const stackElementsToRemove = this.stackPointer - statement.preStatementsSPCache;
      if(stackElementsToRemove){
        buffers.push( this.writeMOVSP( -stackElementsToRemove ) );
      }

      statement.block_end = this.scope.bytes_written;
    }
    return Buffer.concat(buffers);
  }

  compileAdd( statement = undefined ){
    const buffers = [];
    if(statement && statement.type == 'add'){
      buffers.push( this.compileStatement(statement.left) );
      buffers.push( this.compileStatement(statement.right) );
      if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
        buffers.push( this.writeADD( NWCompileDataTypes.II ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
        buffers.push( this.writeADD( NWCompileDataTypes.IF ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
        buffers.push( this.writeADD( NWCompileDataTypes.FI ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
        buffers.push( this.writeADD( NWCompileDataTypes.FF ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.S && this.getDataType(statement.right).unary == NWCompileDataTypes.S){
        buffers.push( this.writeADD( NWCompileDataTypes.SS ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.V && this.getDataType(statement.right).unary == NWCompileDataTypes.V){
        buffers.push( this.writeADD( NWCompileDataTypes.VV ) );
      }else{
        //unsupported add
      }
    }
    return Buffer.concat(buffers);
  }

  compileSub( statement = undefined ){
    const buffers = [];
    if(statement && statement.type == 'sub'){
      buffers.push( this.compileStatement(statement.left) );
      buffers.push( this.compileStatement(statement.right) );
      if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
        buffers.push( this.writeSUB( NWCompileDataTypes.II ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
        buffers.push( this.writeSUB( NWCompileDataTypes.IF ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
        buffers.push( this.writeSUB( NWCompileDataTypes.FI ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
        buffers.push( this.writeSUB( NWCompileDataTypes.FF ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.S && this.getDataType(statement.right).unary == NWCompileDataTypes.S){
        buffers.push( this.writeSUB( NWCompileDataTypes.SS ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.V && this.getDataType(statement.right).unary == NWCompileDataTypes.V){
        buffers.push( this.writeSUB( NWCompileDataTypes.VV ) );
      }else{
        //unsupported sub
      }
    }
    return Buffer.concat(buffers);
  }

  compileMul( statement = undefined ){
    const buffers = [];
    if(statement && statement.type == 'mul'){
      buffers.push( this.compileStatement(statement.left) );
      buffers.push( this.compileStatement(statement.right) );
      if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
        buffers.push( this.writeMUL( NWCompileDataTypes.II ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
        buffers.push( this.writeMUL( NWCompileDataTypes.IF ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
        buffers.push( this.writeMUL( NWCompileDataTypes.FI ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
        buffers.push( this.writeMUL( NWCompileDataTypes.FF ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.V && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
        buffers.push( this.writeMUL( NWCompileDataTypes.VF ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.V){
        buffers.push( this.writeMUL( NWCompileDataTypes.FV ) );
      }else{
        //unsupported mul
      }
    }
    return Buffer.concat(buffers);
  }

  compileDiv( statement = undefined ){
    const buffers = [];
    if(statement && statement.type == 'div'){
      buffers.push( this.compileStatement(statement.left) );
      buffers.push( this.compileStatement(statement.right) );
      if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
        buffers.push( this.writeDIV( NWCompileDataTypes.II ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
        buffers.push( this.writeDIV( NWCompileDataTypes.IF ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
        buffers.push( this.writeDIV( NWCompileDataTypes.FI ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
        buffers.push( this.writeDIV( NWCompileDataTypes.FF ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.V && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
        buffers.push( this.writeDIV( NWCompileDataTypes.VF ) );
      }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.V){
        buffers.push( this.writeDIV( NWCompileDataTypes.FV ) );
      }else{
        //unsupported div
      }
    }   
    return Buffer.concat(buffers);
  }

  compileCompare( statement = undefined ){
    const buffers = [];
    if(statement && statement.type == 'compare'){
      buffers.push( this.compileStatement(statement.left) );
      buffers.push( this.compileStatement(statement.right) );
      if(statement.operator.value == '=='){
        if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
          buffers.push( this.writeEQUAL(NWCompileDataTypes.II) );
        }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
          buffers.push( this.writeEQUAL(NWCompileDataTypes.FF) );
        }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.S && this.getDataType(statement.right).unary == NWCompileDataTypes.S){
          buffers.push( this.writeEQUAL(NWCompileDataTypes.SS) );
        }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.O && this.getDataType(statement.right).unary == NWCompileDataTypes.O){
          buffers.push( this.writeEQUAL(NWCompileDataTypes.OO) );
        }else{
          //TODO: STRUCT support
        }
      }else if(statement.operator.value == '!='){
        if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
          buffers.push( this.writeNEQUAL(NWCompileDataTypes.II) );
        }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
          buffers.push( this.writeNEQUAL(NWCompileDataTypes.FF) );
        }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.S && this.getDataType(statement.right).unary == NWCompileDataTypes.S){
          buffers.push( this.writeNEQUAL(NWCompileDataTypes.SS) );
        }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.O && this.getDataType(statement.right).unary == NWCompileDataTypes.O){
          buffers.push( this.writeNEQUAL(NWCompileDataTypes.OO) );
        }else{
          //TODO: STRUCT support
        }
      }else if(statement.operator.value == '&&'){
        if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
          buffers.push( this.writeLOGANDII() );
        }else{
          //ERROR: unsupported datatypes to compare
          console.error('Unsupported: LOGANDII datatypes', this.getDataType(statement.left), this.getDataType(statement.right) );
        }
      }else if(statement.operator.value == '||'){
        if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
          buffers.push( this.writeLOGORII() );
        }else{
          //ERROR: unsupported datatypes to compare
          console.error('Unsupported: LOGORII datatypes', this.getDataType(statement.left), this.getDataType(statement.right) );
        }
      }else if(statement.operator.value == '>='){
        if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
          buffers.push( this.writeGEQ(NWCompileDataTypes.II) );
        }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
          buffers.push( this.writeGEQ(NWCompileDataTypes.FF) );
        }else{
          //ERROR: unsupported datatypes to compare
          console.error('Unsupported: GEQ datatypes', this.getDataType(statement.left), this.getDataType(statement.right) );
        }
      }else if(statement.operator.value == '>'){
        if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
          buffers.push( this.writeGT(NWCompileDataTypes.II) );
        }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
          buffers.push( this.writeGT(NWCompileDataTypes.FF) );
        }else{
          //ERROR: unsupported datatypes to compare
          console.error('Unsupported: GT datatypes', this.getDataType(statement.left), this.getDataType(statement.right) );
        }
      }else if(statement.operator.value == '<'){
        if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
          buffers.push( this.writeLT(NWCompileDataTypes.II) );
        }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
          buffers.push( this.writeLT(NWCompileDataTypes.FF) );
        }else{
          //ERROR: unsupported datatypes to compare
          console.error('Unsupported: LT datatypes', this.getDataType(statement.left), this.getDataType(statement.right) );
        }
      }else if(statement.operator.value == '<='){
        if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
          buffers.push( this.writeLEQ(NWCompileDataTypes.II) );
        }else if(this.getDataType(statement.left).unary == NWCompileDataTypes.F && this.getDataType(statement.right).unary == NWCompileDataTypes.F){
          buffers.push( this.writeLEQ(NWCompileDataTypes.FF) );
        }else{
          //ERROR: unsupported datatypes to compare
          console.error('Unsupported: LEQ datatypes', this.getDataType(statement.left), this.getDataType(statement.right) );
        }
      }
    }
    
    return Buffer.concat(buffers);
  }

  compileIf( statement = undefined ){
    const buffers = [];

    if(statement && statement.type == 'if'){
      const ifelses = [];
      let current_ifelse = statement;

      //Flatten the ifelse tree into a flat array
      while(true){
        ifelses.push(current_ifelse);
        current_ifelse = current_ifelse.else;
        if(!current_ifelse){
          break;
        }
      }

      for(let i = 0; i < ifelses.length; i++){
        const ifelse = ifelses[i];

        //Compile the condition statements
        if(ifelse.condition && ifelse.condition.length){
          for(let j = 0; j < ifelse.condition.length; j++){
            buffers.push( this.compileStatement( ifelse.condition[j] ) );
          }
        }
        
        //the offset prior to writing the JZ statement
        ifelse.jz_start = this.scope.bytes_written;

        //write the JZ statement
        if(ifelse.type != 'else'){
          buffers.push( this.writeJZ(ifelse.jz ? ifelse.jz : 0x7FFFFFFF) ); //jump to next ifelse or else statement if condition is false
        }

        //the offset prior to writing the statements
        ifelse.block_start = this.scope.bytes_written;

        //Compile if statements
        for(let j = 0; j < ifelse.statements.length; j++){
          buffers.push( this.compileStatement( ifelse.statements[j] ) );
        }
        
        //the offset prior to writing the JMP statement
        ifelse.jmp_start = this.scope.bytes_written;
        //write the JMP statement
        if(ifelse.type != 'else'){
          buffers.push( this.writeJMP( ifelses[i].jmp ? ifelses[i].jmp : 0x7FFFFFFF ) ); //jump to the end of the else if chain
        }

        //the offset that marks the end of this ifelse block
        ifelse.block_end = this.scope.bytes_written;

        if(ifelse.type != 'else'){
          if(!ifelse.jz){
            ifelse.jz = ifelse.block_end - ifelse.jz_start;
            //console.log('jz', ifelse.jz.toString(16));
          }
        }
      }

      //Calculate JMP offsets
      for(let i = 0; i < ifelses.length; i++){
        ifelses[i].end_of_if_else_block = this.scope.bytes_written;
        if(!ifelses[i].jmp){
          ifelses[i].jmp = ifelses[i].end_of_if_else_block - ifelses[i].jmp_start;
          //console.log('jmp', ifelses[i].jmp.toString(16));
        }
      }

    }
    
    return Buffer.concat(buffers);
  }

  compileSwitch( statement = undefined ){
    const buffers = [];

    if(statement && statement.type == 'switch'){

      statement.block_start = this.scope.bytes_written;

      const switchCondition = statement.condition;
      const has_default = statement.default && statement.default.type == 'default' ? true : false;
      
      //save the pointer to the switch varaible location on the stack
      const switch_condition_sp = this.stackPointer;
      //push the switch variable onto the stack
      buffers.push( this.compileStatement(switchCondition) );
      
      for(let i = 0; i < statement.cases.length; i++){
        const _case = statement.cases[i];
        buffers.push( this.writeCPTOPSP( (switch_condition_sp - this.stackPointer), 0x04) );
        buffers.push( this.compileStatement( _case.condition ) );
        buffers.push( this.writeEQUAL(NWCompileDataTypes.II) );
        buffers.push( this.writeJNZ( _case.block_start ? _case.block_start - this.scope.bytes_written : 0x7FFFFFFF ) );
      }

      if(has_default){
        buffers.push( this.writeJMP( statement.default.block_start - this.scope.bytes_written ) );
      }else{
        buffers.push( this.writeJMP( statement.block_end - this.scope.bytes_written ) );
      }

      //Compile the case statements
      for(let i = 0; i < statement.cases.length; i++){
        const _case = statement.cases[i];
        _case.block_start = this.scope.bytes_written;

        for(let j = 0; j < _case.statements.length; j++){
          buffers.push( this.compileStatement( _case.statements[j] ) );
        }

        if(!_case.fallthrough){
          buffers.push( this.writeJMP( statement.block_end - this.scope.bytes_written ) );
        }

        _case.block_end = this.scope.bytes_written;
      }

      //Compile the default statements
      if(has_default){
        const _default = statement.default;
        _default.block_start = this.scope.bytes_written;

        for(let i = 0; i < _default.statements.length; i++){
          buffers.push( this.compileStatement( _default.statements[i] ) );
        }

        buffers.push( this.writeJMP( statement.block_end - this.scope.bytes_written ) );

        _default.block_end = this.scope.bytes_written;
      }

      //mark the end of the switch block
      statement.block_end = this.scope.bytes_written;

      //clear the switch variable off the stack
      buffers.push( this.writeMOVSP( -4 ) );
      
    }
    return Buffer.concat(buffers);
  }

  compileDoWhileLoop( statement = undefined ){
    const buffers = [];

    if(statement && statement.type == 'do'){
      const nested_state = new NWScriptNestedState( statement );
      this.scope.addNestedState( nested_state );

      statement.block_start = this.scope.bytes_written;
      statement.preStatementsSPCache = this.stackPointer;

      statement.statements_start = this.scope.bytes_written;
      for(let i = 0; i < statement.statements.length; i++){
        buffers.push( this.compileStatement( statement.statements[i] ) );
      }

      const stackElementsToRemove = this.stackPointer - statement.preStatementsSPCache;
      if(stackElementsToRemove){
        buffers.push( this.writeMOVSP( -stackElementsToRemove ) );
      }
      statement.statements_end = this.scope.bytes_written;

      statement.continue_start = this.scope.bytes_written;

      statement.condition_start = this.scope.bytes_written;
      for(let i = 0; i < statement.condition.length; i++){
        buffers.push( this.compileStatement( statement.condition[i] ) );
      }

      //If the condition is false Jump out of the loop
      buffers.push( 
        this.writeJZ( 
          this.getInstructionLength(OP_JZ) + 
          this.getInstructionLength(OP_JMP)
        )
      );

      //JMP back to the beginning of the DO-While statement
      buffers.push(
        this.writeJMP( 
          -(this.scope.bytes_written - statement.block_start) 
        )
      );

      statement.condition_end = this.scope.bytes_written;

      statement.block_end = this.scope.bytes_written;
      this.scope.removeNestedState( nested_state );
    }
    
    return Buffer.concat(buffers);
  }

  compileWhileLoop( statement = undefined ){
    
    const buffers = [];

    if(statement && statement.type == 'while'){
      const nested_state = new NWScriptNestedState( statement );
      this.scope.addNestedState( nested_state );
      //Cache the byte offset of the beginning of this code block
      statement.block_start = this.scope.bytes_written;

      statement.continue_start = this.scope.bytes_written;

      //Compile the while condition statements
      for(let i = 0; i < statement.condition.length; i++){
        buffers.push( this.compileStatement( statement.condition[i] ) );
        if(i) buffers.push( this.writeEQUAL(NWCompileDataTypes.II) );
      }

      //If the condition is false Jump out of the loop
      buffers.push( 
        this.writeJZ( statement.block_end ? (statement.block_end - this.scope.bytes_written) : 0x7FFFFFFF )
      );
      
      //Cache the current stack pointer
      statement.preStatementsSPCache = this.stackPointer;

      //Compile the block statements
      for(let i = 0; i < statement.statements.length; i++){
        buffers.push( this.compileStatement( statement.statements[i] ) );
      }

      //Get stack elements that should be removed from this scope
      const stackElementsToRemove = this.stackPointer - statement.preStatementsSPCache;
      if(stackElementsToRemove){
        buffers.push( this.writeMOVSP( -stackElementsToRemove ) );
      }

      //JMP back to the beginning of the DO-While statement
      buffers.push( 
        this.writeJMP( 
          -(this.scope.bytes_written - statement.block_start)
        )
      );

      statement.block_end = this.scope.bytes_written;
      this.scope.removeNestedState( nested_state );
    }
    
    return Buffer.concat(buffers);
  }

  compileForLoop( statement = undefined ){
    const buffers = [];

    if(statement && statement.type == 'for'){
      const nested_state = new NWScriptNestedState( statement );
      this.scope.addNestedState( nested_state );

      //Cache the byte offset of the beginning of this code block
      statement.block_start = this.scope.bytes_written;

      //Begin initializer
      statement.initializer_start = this.scope.bytes_written;

      buffers.push( this.compileStatement( statement.initializer ) );

      statement.initializer_end = this.scope.bytes_written;
      //End initializer
      


      //Begin condition
      statement.condition_start = this.scope.bytes_written;
      statement.continue_start = this.scope.bytes_written;

      for(let i = 0; i < statement.condition.length; i++){
        buffers.push( this.compileStatement( statement.condition[i] ) );
        if(i) buffers.push( this.writeEQUAL(NWCompileDataTypes.II) );
      }
      buffers.push( 
        this.writeJZ( 
          statement.block_end ? (statement.block_end - this.scope.bytes_written) : 0x7FFFFFFF 
        )
      );

      statement.condition_end = this.scope.bytes_written;
      //End condition



      //Begin statements
      statement.statements_start = this.scope.bytes_written;

      statement.preStatementsSPCache = this.stackPointer;
      for(let i = 0; i < statement.statements.length; i++){
        buffers.push( this.compileStatement( statement.statements[i] ) );
      }
      const stackOffset = this.stackPointer - statement.preStatementsSPCache;
      if(stackOffset) buffers.push( this.writeMOVSP( -stackOffset ) );

      statement.statements_end = this.scope.bytes_written;
      //End statements



      //Begin incrementor
      statement.incrementor_start = this.scope.bytes_written;

      buffers.push( this.compileStatement( statement.incrementor ) );

      statement.incrementor_end = this.scope.bytes_written;
      //End incrementor

      buffers.push( 
        this.writeJMP( 
          statement.condition_start ? -(this.scope.bytes_written - statement.condition_start) : 0x7FFFFFFF 
        )
      );

      statement.block_end = this.scope.bytes_written;
      this.scope.removeNestedState( nested_state );
    }
    
    return Buffer.concat(buffers);
  }

  compileContinue( statement = undefined ){
    const buffers = [];
    if(statement.type == 'continue'){
      statement.block_start = this.scope.bytes_written;

      const active_loop = this.scope.getTopContinueableNestedState();
      if(active_loop){
        const stackOffset = this.stackPointer - active_loop.statement.preStatementsSPCache;
        if(stackOffset){
          buffers.push( this.writeMOVSP( -stackOffset ) );
          //return the stack pointer to it's previous state so that the outer loop is not affected
          this.stackPointer += stackOffset;
        }else{
          //console.log('noting to remove')
        }
        buffers.push( 
          this.writeJMP( 
            active_loop.statement.continue_start ? -(this.scope.bytes_written - active_loop.statement.continue_start) : 0x7FFFFFFF 
          )
        );  
      }else{
        //console.log('no active loop');
        //can't use continue outside of a loop
      }

      statement.block_end = this.scope.bytes_written;
    }
    
    return Buffer.concat(buffers);
  }

  compileTernery( statement = undefined ){
    const buffers = [];

    if(statement && statement.type == 'ternery'){
      
    }
    
    return Buffer.concat(buffers);
  }

  //Not the value
  compileNOT( statement = undefined ){
    const buffers = [];
    buffers.push( this.compileStatement( statement.value ) );
    buffers.push( this.writeNOTI( ) );
    return Buffer.concat(buffers);
  }

  compileINC( statement = undefined ){
    const buffers = [];
    if(statement && statement.type == 'inc'){
      //buffers.push( this.compileStatement( statement.variable_reference ) );
      if(statement.variable_reference.is_global){
        buffers.push( 
          this.writeCPTOPBP(
            statement.variable_reference.stackPointer - this.basePointer,
            this.getDataTypeStackLength(statement.variable_reference.datatype)
          )
        );
        buffers.push( 
          this.writeINCIBP( statement.variable_reference.stackPointer - this.basePointer, this.getDataTypeStackLength(statement.variable_reference.datatype) ) 
        );
      }else{
        buffers.push( 
          this.writeCPTOPSP(
            statement.variable_reference.stackPointer - this.stackPointer,
            this.getDataTypeStackLength(statement.variable_reference.datatype)
          )
        );
        buffers.push( 
          this.writeINCISP( statement.variable_reference.stackPointer - this.stackPointer, this.getDataTypeStackLength(statement.variable_reference.datatype) ) 
        );
      }
      buffers.push( this.writeMOVSP( -this.getDataTypeStackLength(statement.variable_reference.datatype) ) );
    }
    return Buffer.concat(buffers);
  }

  compileDEC( statement = undefined ){
    const buffers = [];
    if(statement && statement.type == 'dec'){
      //buffers.push( this.compileStatement( statement.variable_reference ) );
      if(statement.variable_reference.is_global){
        buffers.push( 
          this.writeINCIBP( statement.variable_reference.stackPointer - this.basePointer, this.getDataTypeStackLength(statement.variable_reference.datatype) ) 
        );
      }else{
        buffers.push( 
          this.writeINCISP( statement.variable_reference.stackPointer - this.stackPointer, this.getDataTypeStackLength(statement.variable_reference.datatype) ) 
        );
      }
    }
    return Buffer.concat(buffers);
  }

  //Negate the number
  compileNEG( statement = undefined ){
    const buffers = [];

    buffers.push( this.compileStatement( statement.value ) );
    buffers.push( this.writeNEG( this.getDataType( statement.value ).unary ) );
    
    return Buffer.concat(buffers);
  }

  //Ones compliment
  compileComp( statement = undefined ){
    const buffers = [];

    buffers.push( this.compileStatement( statement.value ) );
    buffers.push( this.writeCOMPI( ) );
    
    return Buffer.concat(buffers);
  }

  //Inclusive OR
  compileINCOR( statement = undefined ){
    const buffers = [];
    if(statement && statement.type == 'incor'){
      buffers.push( this.compileStatement(statement.left) );
      buffers.push( this.compileStatement(statement.right) );
      if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
        buffers.push( this.writeINCORII( ) );
      }
    }
    return Buffer.concat(buffers);
  }

  //Exclusive OR
  compileEXCOR( statement = undefined ){
    const buffers = [];
    if(statement && statement.type == 'xor'){
      buffers.push( this.compileStatement(statement.left) );
      buffers.push( this.compileStatement(statement.right) );
      if(this.getDataType(statement.left).unary == NWCompileDataTypes.I && this.getDataType(statement.right).unary == NWCompileDataTypes.I){
        buffers.push( this.writeEXCORII( ) );
      }
    }
    return Buffer.concat(buffers);
  }

  writeCPDOWNSP( offsetRelativeToTopOfStack = 0, numBytesToCopy = 4 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_CPDOWNSP));
    buffer.writeInt8(OP_CPDOWNSP, 0);
    buffer.writeInt8(0x01, 1);
    buffer.writeInt32BE(offsetRelativeToTopOfStack, 2);
    buffer.writeInt16BE(numBytesToCopy, 6);
    //The value of SP remains unchanged.
    this.opcodeDebug('OP_CPDOWNSP', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeRSADD( type = 0x03 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_RSADD));
    buffer.writeInt8(OP_RSADD, 0);
    buffer.writeInt8(type, 1);
    this.stackPointer += 4; //The value of SP is increased by the size of the type reserved.  (Always 4)
    this.opcodeDebug('OP_RSADD', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeCPTOPSP( offsetRelativeToTopOfStack = 0, numBytesToCopy = 4 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_CPTOPSP));
    buffer.writeInt8(OP_CPTOPSP, 0);
    buffer.writeInt8(0x01, 1);
    buffer.writeInt32BE(offsetRelativeToTopOfStack, 2);
    buffer.writeInt16BE(numBytesToCopy, 6);
    this.stackPointer += numBytesToCopy;
    this.opcodeDebug('OP_CPTOPSP', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeCONST( type = 0x03, value = undefined ){
    let data_length = this.getInstructionLength(OP_CONST);
    if(type == NWCompileDataTypes.S) data_length += value.length - 2;

    const buffer = Buffer.alloc(data_length);
    buffer.writeInt8(OP_CONST, 0);
    buffer.writeInt8(type, 1);
    switch(type){
      case NWCompileDataTypes.I: //INT
        buffer.writeInt32BE(value, 2);
      break;
      case NWCompileDataTypes.F: //Float
        buffer.writeFloatBE(value, 2);
      break;
      case NWCompileDataTypes.S: //String
        buffer.writeInt16BE(value.length, 2);
        for(let i = 0; i < value.length; i++){
          buffer.writeInt8(value.charCodeAt(i), 4 + i);
        }
      break;
      case NWCompileDataTypes.O: //Object
        buffer.writeInt32BE(value, 2);
      break;
    }
    this.stackPointer += 4; //The value of SP is increased by the size of the type reserved.  (Always 4)
    this.opcodeDebug('OP_CONST', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeACTION( type = 0x00, routineNumber = 0, numArguments = 0, returnSize = 4, nArgumentDataSize = undefined ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_ACTION));
    buffer.writeInt8(OP_ACTION, 0);
    buffer.writeInt8(0x00, 1);
    buffer.writeUInt16BE(routineNumber, 2);
    buffer.writeInt8(numArguments, 4);
    // console.log('writeACTION', routineNumber, returnSize, nArgumentDataSize, this.stackPointer);
    this.stackPointer += returnSize;//Increase by size of return value
    this.stackPointer -= nArgumentDataSize;//Decrease by the size of the arguments;
    this.opcodeDebug('OP_ACTION', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeLOGANDII( ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_LOGANDII));
    buffer.writeInt8(OP_LOGANDII, 0);
    buffer.writeInt8(0x20, 1);
    this.stackPointer += 4;//Increase by size of return value
    this.stackPointer -= (4 * 2);//Decrease by size of both operands
    this.opcodeDebug('OP_LOGANDII', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer; 
  }

  writeLOGORII( ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_LOGORII));
    buffer.writeInt8(OP_LOGORII, 0);
    buffer.writeInt8(0x20, 1);
    this.stackPointer += 4;//Increase by size of return value
    this.stackPointer -= (4 * 2);//Decrease by size of both operands
    this.opcodeDebug('OP_LOGORII', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer; 
  }

  writeINCORII( ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_INCORII));
    buffer.writeInt8(OP_INCORII, 0);
    buffer.writeInt8(0x20, 1);
    this.stackPointer += 4;//Increase by size of return value
    this.stackPointer -= (4 * 2);//Decrease by size of both operands
    this.opcodeDebug('OP_INCORII', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer; 
  }

  writeEXCORII( ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_EXCORII));
    buffer.writeInt8(OP_EXCORII, 0);
    buffer.writeInt8(0x20, 1);
    this.stackPointer += 4;//Increase by size of return value
    this.stackPointer -= (4 * 2);//Decrease by size of both operands
    this.opcodeDebug('OP_EXCORII', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer; 
  }

  writeBOOLANDII( ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_BOOLANDII));
    buffer.writeInt8(OP_BOOLANDII, 0);
    buffer.writeInt8(0x20, 1);
    this.stackPointer += 4;//Increase by size of return value
    this.stackPointer -= (4 * 2);//Decrease by size of both operands
    this.opcodeDebug('OP_BOOLANDII', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer; 
  }

  writeEQUAL( type = 0x20 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_EQUAL));
    buffer.writeInt8(OP_EQUAL, 0);
    buffer.writeInt8(type, 1);
    this.stackPointer += 4;//Increase by size of return value
    this.stackPointer -= (4 * 2);//Decrease by size of both operands
    this.opcodeDebug('OP_EQUAL', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer; 
  }

  writeNEQUAL( type = 0x20 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_NEQUAL));
    buffer.writeInt8(OP_NEQUAL, 0);
    buffer.writeInt8(type, 1);
    this.stackPointer += 4;//Increase by size of return value
    this.stackPointer -= (4 * 2);//Decrease by size of both operands
    this.opcodeDebug('OP_NEQUAL', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer; 
  }

  writeGEQ( type = 0x20 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_GEQ));
    buffer.writeInt8(OP_GEQ, 0);
    buffer.writeInt8(type, 1);
    this.stackPointer += 4;//Increase by size of return value
    this.stackPointer -= (4 * 2);//Decrease by size of both operands
    this.opcodeDebug('OP_GEQ', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer; 
  }

  writeGT( type = 0x20 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_GT));
    buffer.writeInt8(OP_GT, 0);
    buffer.writeInt8(type, 1);
    this.stackPointer += 4;//Increase by size of return value
    this.stackPointer -= (4 * 2);//Decrease by size of both operands
    this.opcodeDebug('OP_GT', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer; 
  }

  writeLT( type = 0x20 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_LT));
    buffer.writeInt8(OP_LT, 0);
    buffer.writeInt8(type, 1);
    this.stackPointer += 4;//Increase by size of return value
    this.stackPointer -= (4 * 2);//Decrease by size of both operands
    this.opcodeDebug('OP_LT', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer; 
  }

  writeLEQ( type = 0x20 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_LEQ));
    buffer.writeInt8(OP_LEQ, 0);
    buffer.writeInt8(type, 1);
    this.stackPointer += 4;//Increase by size of return value
    this.stackPointer -= (4 * 2);//Decrease by size of both operands
    this.opcodeDebug('OP_LEQ', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer; 
  }

  writeSHLEFTII( ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_SHLEFTII));
    buffer.writeInt8(OP_SHLEFTII, 0);
    buffer.writeInt8(0x20, 1);
    this.stackPointer += 4;//Increase by size of return value
    this.stackPointer -= (4 * 2);//Decrease by size of both operands
    this.opcodeDebug('OP_SHLEFTII', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer; 
  }

  writeSHRIGHTII( ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_SHRIGHTII));
    buffer.writeInt8(OP_SHRIGHTII, 0);
    buffer.writeInt8(0x20, 1);
    this.stackPointer += 4;//Increase by size of return value
    this.stackPointer -= (4 * 2);//Decrease by size of both operands
    this.opcodeDebug('OP_SHRIGHTII', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer; 
  }

  writeUSHRIGHTII( ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_USHRIGHTII));
    buffer.writeInt8(OP_USHRIGHTII, 0);
    buffer.writeInt8(0x20, 1);
    this.stackPointer += 4;//Increase by size of return value
    this.stackPointer -= (4 * 2);//Decrease by size of both operands
    this.opcodeDebug('OP_USHRIGHTII', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer; 
  }

  writeADD( type = 0x20 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_ADD));
    buffer.writeInt8(OP_ADD, 0);
    buffer.writeInt8(type, 1);

    //Increase by size of return value && Decrease by size of both operands
    if(type == NWCompileDataTypes.II){ this.stackPointer += 4; this.stackPointer -= (4 * 2); }
    if(type == NWCompileDataTypes.IF){ this.stackPointer += 4; this.stackPointer -= (4 * 2); }
    if(type == NWCompileDataTypes.FI){ this.stackPointer += 4; this.stackPointer -= (4 * 2); }
    if(type == NWCompileDataTypes.FF){ this.stackPointer += 4; this.stackPointer -= (4 * 2); }
    if(type == NWCompileDataTypes.SS){ this.stackPointer += 4; this.stackPointer -= (4 * 2); }
    if(type == NWCompileDataTypes.VV){ this.stackPointer += 12; this.stackPointer -= (12 * 2); }
    this.opcodeDebug('OP_ADD', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeSUB( type = 0x20 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_SUB));
    buffer.writeInt8(OP_SUB, 0);
    buffer.writeInt8(type, 1);

    //Increase by size of return value && Decrease by size of both operands
    if(type == NWCompileDataTypes.II){ this.stackPointer += 4; this.stackPointer -= (4 * 2); }
    if(type == NWCompileDataTypes.IF){ this.stackPointer += 4; this.stackPointer -= (4 * 2); }
    if(type == NWCompileDataTypes.FI){ this.stackPointer += 4; this.stackPointer -= (4 * 2); }
    if(type == NWCompileDataTypes.FF){ this.stackPointer += 4; this.stackPointer -= (4 * 2); }
    if(type == NWCompileDataTypes.VV){ this.stackPointer += 12; this.stackPointer -= (12 * 2); }
    this.opcodeDebug('OP_SUB', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeMUL( type = 0x20 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_MUL));
    buffer.writeInt8(OP_MUL, 0);
    buffer.writeInt8(type, 1);

    //Increase by size of return value && Decrease by size of both operands
    if(type == NWCompileDataTypes.II){ this.stackPointer += 4;  this.stackPointer -=  (4 * 2);  }
    if(type == NWCompileDataTypes.IF){ this.stackPointer += 4;  this.stackPointer -=  (4 * 2);  }
    if(type == NWCompileDataTypes.FI){ this.stackPointer += 4;  this.stackPointer -=  (4 * 2);  }
    if(type == NWCompileDataTypes.FF){ this.stackPointer += 4;  this.stackPointer -=  (4 * 2);  }
    if(type == NWCompileDataTypes.VF){ this.stackPointer += 12; this.stackPointer -= (12 + 4);  }
    if(type == NWCompileDataTypes.FV){ this.stackPointer += 12; this.stackPointer -= (4  + 12); }
    this.opcodeDebug('OP_MUL', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeDIV( type = 0x20 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_DIV));
    buffer.writeInt8(OP_DIV, 0);
    buffer.writeInt8(type, 1);

    //Increase by size of return value && Decrease by size of both operands
    if(type == NWCompileDataTypes.II){ this.stackPointer += 4;  this.stackPointer -=  (4 * 2);  }
    if(type == NWCompileDataTypes.IF){ this.stackPointer += 4;  this.stackPointer -=  (4 * 2);  }
    if(type == NWCompileDataTypes.FI){ this.stackPointer += 4;  this.stackPointer -=  (4 * 2);  }
    if(type == NWCompileDataTypes.FF){ this.stackPointer += 4;  this.stackPointer -=  (4 * 2);  }
    if(type == NWCompileDataTypes.VF){ this.stackPointer += 12; this.stackPointer -= (12 + 4);  }
    if(type == NWCompileDataTypes.FV){ this.stackPointer += 12; this.stackPointer -= (4  + 12); }
    this.opcodeDebug('OP_DIV', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeMODII( ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_MODII));
    buffer.writeInt8(OP_MODII, 0);
    buffer.writeInt8(NWCompileDataTypes.II, 1);
    this.stackPointer += 4;//Increase by size of return value
    this.stackPointer -= (4 * 2);//Decrease by size of both operands
    this.opcodeDebug('OP_MODII', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeNEG( type = 0x03 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_NEG));
    buffer.writeInt8(OP_NEG, 0);
    buffer.writeInt8(type, 1);
    //SP remains unchanged because both the return value and the operand cosumed are of the same length
    this.opcodeDebug('OP_NEG', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeCOMPI( ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_COMPI));
    buffer.writeInt8(OP_COMPI, 0);
    buffer.writeInt8(0x03, 1);
    //SP remains unchanged because both the return value and the operand cosumed are of the same length
    this.opcodeDebug('OP_COMPI', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeMOVSP( nSize = 0 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_MOVSP));
    buffer.writeInt8(OP_MOVSP, 0);
    buffer.writeInt8(0x00, 1);
    buffer.writeInt32BE(nSize, 2);
    this.stackPointer += nSize;//Increase by size of return value; This should be a negative value so the stackPointer will actually go down
    this.opcodeDebug('OP_MOVSP', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeSTORE_STATEALL( nSize = 0 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_STORE_STATEALL));
    buffer.writeInt8(OP_STORE_STATEALL, 0);
    buffer.writeInt8(nSize, 1);
    //SP remains unchanged
    this.opcodeDebug('OP_STORE_STATEALL', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;  
  }

  writeJMP( nOffset = 0 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_JMP));
    buffer.writeInt8(OP_JMP, 0);
    buffer.writeInt8(0x00, 1);
    buffer.writeInt32BE(nOffset, 2);
    //SP remains unchanged.
    this.opcodeDebug('OP_JMP', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;  
  }

  writeJSR( nOffset = 0 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_JSR));
    buffer.writeInt8(OP_JSR, 0);
    buffer.writeInt8(0x00, 1);
    buffer.writeInt32BE(nOffset, 2);
    //SP remains unchanged.  The return value is NOT placed on the stack.
    this.opcodeDebug('OP_JSR', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;  
  }

  writeJZ( nOffset = 0 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_JZ));
    buffer.writeInt8(OP_JZ, 0);
    buffer.writeInt8(0x00, 1);
    buffer.writeInt32BE(nOffset, 2);
    this.stackPointer -= 4;
    this.opcodeDebug('OP_JZ', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;  
  }

  writeRETN( ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_RETN));
    buffer.writeInt8(OP_RETN, 0);
    buffer.writeInt8(0x00, 1);
    //SP remains unchanged.  The return value is NOT placed on the stack.
    this.opcodeDebug('OP_RETN', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;  
  }

  writeDESTRUCT( nTotalSizeToDestory = 0, nOffsetOfElementToKeep = 0, nSizeOfElementToKeep = 4 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_DESTRUCT));
    buffer.writeInt8(OP_DESTRUCT, 0);
    buffer.writeInt8(0x01, 1);
    buffer.writeInt16BE(nTotalSizeToDestory, 2); //total size of structure properties
    buffer.writeInt16BE(nOffsetOfElementToKeep, 4);  //offset of structure property to keep on stack
    buffer.writeInt16BE(nSizeOfElementToKeep, 6); //size of structure property to keep on stack
    this.stackPointer -= (nTotalSizeToDestory - nSizeOfElementToKeep);
    this.opcodeDebug('OP_DESTRUCT', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;  
  }

  writeNOTI( ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_NOTI));
    buffer.writeInt8(OP_NOTI, 0);
    buffer.writeInt8(0x03, 1);
    //The value of SP remains unchanged since the operand and result are of the same size.
    this.opcodeDebug('OP_NOTI', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;  
  }

  writeDECISP( nOffset = 0 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_DECISP));
    buffer.writeInt8(OP_DECISP, 0);
    buffer.writeInt8(0x03, 1);
    buffer.writeInt32BE(nOffset, 2);
    //The value of SP remains unchanged.
    this.opcodeDebug('OP_DECISP', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;  
  }

  writeINCISP( nOffset = 0 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_INCISP));
    buffer.writeInt8(OP_INCISP, 0);
    buffer.writeInt8(0x03, 1);
    buffer.writeInt32BE(nOffset, 2);
    //The value of SP remains unchanged.
    this.opcodeDebug('OP_INCISP', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;  
  }

  writeJNZ( nOffset = 0 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_JNZ));
    buffer.writeInt8(OP_JNZ, 0);
    buffer.writeInt8(0x00, 1);
    buffer.writeInt32BE(nOffset, 2);
    this.stackPointer -= 4; //The value of SP is decremented by the size of the integer.
    this.opcodeDebug('OP_JNZ', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;  
  }

  writeCPDOWNBP( nOffset = 0, nSize = 0 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_CPDOWNBP));
    buffer.writeInt8(OP_CPDOWNBP, 0);
    buffer.writeInt8(0x01, 1);
    buffer.writeInt32BE(nOffset, 2);
    buffer.writeInt16BE(nSize, 6);
    //The value of SP remains unchanged.
    this.opcodeDebug('OP_CPDOWNBP', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeCPTOPBP( nOffset = 0, nSize = 0 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_CPTOPBP));
    buffer.writeInt8(OP_CPTOPBP, 0);
    buffer.writeInt8(0x01, 1);
    buffer.writeInt32BE(nOffset, 2);
    buffer.writeInt16BE(nSize, 6);
    this.stackPointer += nSize; //The value of SP is increased by the number of copied bytes.
    this.opcodeDebug('OP_CPTOPBP', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeDECIBP( nOffset = 0 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_DECIBP));
    buffer.writeInt8(OP_DECIBP, 0);
    buffer.writeInt8(0x03, 1);
    buffer.writeInt32BE(nOffset, 2);
    //The value of SP remains unchanged.
    this.opcodeDebug('OP_DECIBP', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;  
  }

  writeINCIBP( nOffset = 0 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_INCIBP));
    buffer.writeInt8(OP_INCIBP, 0);
    buffer.writeInt8(0x03, 1);
    buffer.writeInt32BE(nOffset, 2);
    //The value of SP remains unchanged.
    this.opcodeDebug('OP_INCIBP', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;  
  }

  writeSAVEBP( ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_SAVEBP));
    buffer.writeInt8(OP_SAVEBP, 0);
    buffer.writeInt8(0x00, 1);
    //The value of SP remains unchanged.
    this.opcodeDebug('OP_SAVEBP', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;  
  }

  writeRESTOREBP( ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_RESTOREBP));
    buffer.writeInt8(OP_RESTOREBP, 0);
    buffer.writeInt8(0x00, 1);
    //The value of SP remains unchanged.
    this.opcodeDebug('OP_RESTOREBP', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;  
  }

  writeSTORE_STATE( nBStackSize = 0, nStackSize = 0 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_STORE_STATE));
    buffer.writeInt8(OP_STORE_STATE, 0);
    buffer.writeInt8(0x10, 1);
    buffer.writeInt32BE(nBStackSize, 2);
    buffer.writeInt32BE(nStackSize, 6);
    //The value of SP remains unchanged.
    this.opcodeDebug('OP_STORE_STATE', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;  
  }

  writeNOP( ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_NOP));
    buffer.writeInt8(OP_NOP, 0);
    buffer.writeInt8(0x00, 1);
    //The value of SP remains unchanged.
    this.opcodeDebug('OP_NOP', buffer);
    this.scopeAddBytesWritten(buffer.length);
    return buffer;
  }

  writeT( nScriptSize = 0 ){
    const buffer = Buffer.alloc(this.getInstructionLength(OP_T));
    buffer.writeInt8(OP_T, 0);
    buffer.writeInt32BE(nScriptSize, 1);
    //The value of SP remains unchanged.
    //this.opcodeDebug('OP_T', buffer);
    return buffer;
  }

  getInstructionLength( instr = 0x00 ){
    switch(instr){
      case OP_CPDOWNSP: return 8;
      case OP_RSADD: return 2;
      case OP_CPTOPSP: return 8;
      case OP_CONST: return 6;
      case OP_ACTION: return 5;
      case OP_LOGANDII: return 2;
      case OP_LOGORII: return 2;
      case OP_INCORII: return 2;
      case OP_EXCORII: return 2;
      case OP_BOOLANDII: return 2;
      case OP_EQUAL: return 2;
      case OP_NEQUAL: return 2;
      case OP_GEQ: return 2;
      case OP_GT: return 2;
      case OP_LT: return 2;
      case OP_LEQ: return 2;
      case OP_SHLEFTII: return 2;
      case OP_SHRIGHTII: return 2;
      case OP_USHRIGHTII: return 2;
      case OP_ADD: return 2;
      case OP_SUB: return 2;
      case OP_MUL: return 2;
      case OP_DIV: return 2;
      case OP_MODII: return 2;
      case OP_NEG: return 2;
      case OP_COMPI: return 2;
      case OP_MOVSP: return 6;
      case OP_STORE_STATEALL: return 2;
      case OP_JMP: return 6;
      case OP_JSR: return 6;
      case OP_JZ: return 6;
      case OP_RETN: return 2;
      case OP_DESTRUCT: return 8;
      case OP_NOTI: return 2;
      case OP_DECISP: return 6;
      case OP_INCISP: return 6;
      case OP_JNZ: return 6;
      case OP_CPDOWNBP: return 8;
      case OP_CPTOPBP: return 8;
      case OP_DECIBP: return 6;
      case OP_INCIBP: return 6;
      case OP_SAVEBP: return 2;
      case OP_RESTOREBP: return 2;
      case OP_STORE_STATE: return 10;
      case OP_NOP : return 2;
      case OP_T: return 5;
    }
    return -1;
  }

  getInstructionLabel( instr = 0x00 ){
    switch(instr){
      case OP_CPDOWNSP: return 'CPDOWNSP';
      case OP_RSADD: return 'RSADD';
      case OP_CPTOPSP: return 'CPTOPSP';
      case OP_CONST: return 'CONST';
      case OP_ACTION: return 'ACTION';
      case OP_LOGANDII: return 'LOGANDII';
      case OP_LOGORII: return 'LOGORII';
      case OP_INCORII: return 'INCORII';
      case OP_EXCORII: return 'EXCORII';
      case OP_BOOLANDII: return 'BOOLANDII';
      case OP_EQUAL: return 'EQUAL';
      case OP_NEQUAL: return 'NEQUAL';
      case OP_GEQ: return 'GEQ';
      case OP_GT: return 'GT';
      case OP_LT: return 'LT';
      case OP_LEQ: return 'LEQ';
      case OP_SHLEFTII: return 'SHIFTII';
      case OP_SHRIGHTII: return 'SHRIGHTII';
      case OP_USHRIGHTII: return 'USHRIGHTII';
      case OP_ADD: return 'ADD';
      case OP_SUB: return 'SUB';
      case OP_MUL: return 'MUL';
      case OP_DIV: return 'DIV';
      case OP_MODII: return 'MODII';
      case OP_NEG: return 'NEG';
      case OP_COMPI: return 'COMPI';
      case OP_MOVSP: return 'MOVSP';
      case OP_STORE_STATEALL: return 'STORE_STATEALL';
      case OP_JMP: return 'JMP';
      case OP_JSR: return 'JSR';
      case OP_JZ: return 'JZ';
      case OP_RETN: return 'RETN';
      case OP_DESTRUCT: return 'DESTRUCT';
      case OP_NOTI: return 'NOTI';
      case OP_DECISP: return 'DECISP';
      case OP_INCISP: return 'INCISP';
      case OP_JNZ: return 'JNZ';
      case OP_CPDOWNBP: return 'CPDOWNBP';
      case OP_CPTOPBP: return 'CPTOPBP';
      case OP_DECIBP: return 'DECIBP';
      case OP_INCIBP: return 'INCIBP';
      case OP_SAVEBP: return 'SAVEBP';
      case OP_RESTOREBP: return 'RESTOREBP';
      case OP_STORE_STATE: return 'STORE_STATE';
      case OP_NOP : return 'NOP';
      case OP_T: return 'T';
    }
    return -1;
  }

}

class NWScriptScope {
  is_global = false;
  bytes_written = 0;
  nested_states = [];

  constructor( ){
    
  }

  addNestedState( state ){
    if(state instanceof NWScriptNestedState){
      this.nested_states.push(state);
    }
  }

  removeNestedState( state ){
    const idx = this.nested_states.indexOf( state );
    if(idx >= 0) this.nested_states.splice(idx, 1);
  }

  getTopContinueableNestedState( ){
    return this.nested_states.slice(0).reverse().find( s => { return (s.statement.type == 'for' || s.statement.type == 'while' || s.statement.type == 'do') } );
  }

  getTopBreakableNestedState( ){
    return this.nested_states.slice(0).reverse().find( s => s.statement.type == 'if' );
  }

  popped(){
    //
  }

}

class NWScriptNestedState {

  statement = undefined;
  constructor( statement ){
    this.statement = statement;
  }

}

module.exports = { NWScriptCompiler: NWScriptCompiler, NWScriptScope: NWScriptScope };
