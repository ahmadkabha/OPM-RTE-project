import { ObjectModel } from './models/ObjectModel';
import { OpmLogicalState } from './../../models/LogicalPart/OpmLogicalState';
import { OpmTaggedRelation } from './../../models/LogicalPart/OpmTaggedRelation';
import { ConstructorModel } from './models/ConstructorModel';
import { OpmProceduralRelation } from './../../models/LogicalPart/OpmProceduralRelation';
import { ThingState } from './ThingState';
import { AttributeModel } from './models/AttributeModel';
import { OpmFundamentalRelation } from './../../models/LogicalPart/OpmFundamentalRelation';
import { FunctionModel } from './models/FunctionModel';
import { SignatureModel } from './models/SignatureModel';
import { ClassFile } from './models/ClassFileModel';
import { OpmLogicalProcess } from './../../models/LogicalPart/OpmLogicalProcess';
import { OpmLogicalObject } from './../../models/LogicalPart/OpmLogicalObject';
import { InitRappidService } from './../../rappid-components/services/init-rappid.service';
import { getInitRappidShared, initRappidShared } from './../../configuration/rappidEnviromentFunctionality/shared';
import { Injectable } from '@angular/core';
import { OpmOpd } from '../../models/OpmOpd';
import { OpmStructuralLink } from '../../models/VisualPart/OpmStructuralLink';
import { Type, Authorization } from './Enums';
import { Prefix } from './Enums';
import { Enum } from './models/StateEnums';
import { Direct } from 'protractor/built/driverProviders';
import { OpmVisualProcess } from '../../models/VisualPart/OpmVisualProcess';
import { Import } from './models/ImportsModel';

type process = {
  name: string;
  height: number;
};
export class ForwardEngineeringService {
  private myModel: OpmOpd;
  private initRappid: InitRappidService;
  private ThingType;
  private StaticType;
  private instanceType;
  private processes: string[];
  private names:string[];
  private mainEnums:string[];
  private functions:string[];
  private vars:string[];


  constructor() {
    this.initRappid = getInitRappidShared();
    this.myModel = this.initRappid.getOpmModel().currentOpd;
    this.ThingType = new Map();
    this.StaticType = new Map();
    this.instanceType = new Map();
    this.processes = <string[]>Array();

  }

  getObjects():string[] {
    this.names=new Array();
    this.mainEnums=new Array();
    this.functions=new Array();
    this.vars=new Array();
    this.getHeirarchy();
    let elements = this.myModel.visualElements;
    let classes: ClassFile[] = [];
    let processes: FunctionModel[] = [];
    let instances: AttributeModel[] = [];
    let enumsArr: Enum[] = [];
    let commands: string = '';
    let mainRes:string='';
    let classResult: string[]=[];

    for (let i = 0; i < elements.length; i++) {
      let currElem = elements[i].logicalElement;
      if (currElem instanceof OpmLogicalObject) {
        let id = (<OpmLogicalObject>currElem).lid;
        let temp: ThingState = this.ThingType.get(id);
        let tempcall: ThingState = this.ThingType.get(id + 'call');
        let name = (<OpmLogicalObject>currElem).text;

        if (temp == null && tempcall == null) {
          let sig = new SignatureModel(name, Type.class, null, Prefix.exported);
          classes.push(new ClassFile(id, sig));
        }
        if (temp != null) {
          if (temp.type == 'Class') {
            let imports:Import[]=[];
            let sig = new SignatureModel(this.excludeAlias(name), Type.class, this.changeAlias(temp.superName), Prefix.exported);
            if(temp.superName!=null && temp.superName+''!='undefined')imports.push(new Import(this.changeAlias(temp.superName),this.changeAlias(temp.superName)))
            let atts: AttributeModel[] = [];
            let cons: ConstructorModel=null;
            let funcs: FunctionModel[] = [];
            let enums: Enum[] = [];
            let enumless: boolean = true;
            
            

            if (temp.childrenObjects != null) {
              let params: AttributeModel[] = [];
              let Sparams: AttributeModel[] = [];
              let conBlock:string='';
              for (let i = 0; i < temp.childrenObjects.length; i++) {
                let att: AttributeModel
                let impo: Import;
                if (temp.childrenObjects[i].type == 'ArrayClass') {
                  let mulCase = temp.childrenObjects[i].multiplicity;
                  if(mulCase==null)continue;
                  impo=new Import(this.excludeAlias(temp.childrenObjects[i].name),this.excludeAlias(temp.childrenObjects[i].name));
                  imports.push(impo);
                  if (mulCase.key == 1) {
                    att = new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), this.excludeAlias(temp.childrenObjects[i].name), Authorization.notSpecefied);
                    temp.childrenObjects[i].type = 'Class';
                  }
                  if (mulCase.key == 2) {
                    att = new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), this.excludeAlias(temp.childrenObjects[i].name) + '[] = new Array()', Authorization.protected);
                  }
                  if (mulCase.key == 3) {
                    att = new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), this.excludeAlias(temp.childrenObjects[i].name) + '[] = new Array(' + mulCase.value + ')', Authorization.protected);
                      conBlock+= 'if( this.'+this.changeAlias( temp.childrenObjects[i].name)+'.length!='+ mulCase.value+'){\nthrow new Error("Array length mismatch");\n}\n';
                  }
                  if (mulCase.key == 4) {
                    att = new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), this.excludeAlias(temp.childrenObjects[i].name) + '[]', Authorization.protected);
                    for (let i = 0; i < mulCase.variables.length; i++){
                      params.push(new AttributeModel(mulCase.variables[i], 'number', Authorization.notSpecefied));
                      this.vars.push(mulCase.variables[i])
                    }
                    conBlock+= 'if( this.'+this.changeAlias( temp.childrenObjects[i].name)+'.length!='+ mulCase.value+'){\nthrow new Error("Array length mismatch");\n}\n';
                  }
                  if (mulCase.key == 5) {
                    att = new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), this.excludeAlias(temp.childrenObjects[i].name) + '[]', Authorization.protected);
                    for (let i = 0; i < mulCase.variables.length; i++){
                      params.push(new AttributeModel(mulCase.variables[i], 'number', Authorization.notSpecefied));
                      this.vars.push(mulCase.variables[i])
                    }
                      conBlock+= 'if(!' + mulCase.cond.split('range').join('this.'+this.changeAlias(temp.childrenObjects[i].name)+'.length') + ' ){\nthrow new Error("Array length mismatch");\n}\n';
                  }
                  if (mulCase.key == 6 || mulCase.key == 7) {
                    att = new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), this.excludeAlias(temp.childrenObjects[i].name) + '[]', Authorization.protected);
                    for (let j = 0; j < mulCase.variables.length; j++){
                      params.push(new AttributeModel(mulCase.variables[j], 'number', Authorization.notSpecefied));
                      this.vars.push(mulCase.variables[i])
                    }
                    conBlock+= 'if(!' + mulCase.cond.split('range').join('this.'+this.changeAlias(temp.childrenObjects[i].name)+'.length') + ' ){\nthrow new Error("Array length mismatch");\n}\n';
                    
                  } 

                }

                if (temp.childrenObjects[i].type == 'ArrayAttribute') {
                  let mulCase = temp.childrenObjects[i].multiplicity;
                  if(mulCase==null)continue;
                  if (mulCase.key == 1) {
                    if (temp.childrenObjects[i].varValue != '') {
                      att = new AttributeModel(this.changeAlias(temp.childrenObjects[i].name), temp.childrenObjects[i].varType, Authorization.protected, temp.childrenObjects[i].varValue);
                    }
                    else att = new AttributeModel(this.changeAlias(temp.childrenObjects[i].name), temp.childrenObjects[i].varType, Authorization.protected);
                    temp.childrenObjects[i].type = 'attribute';
                  }
                  if (mulCase.key == 2) {
                    att = new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), temp.childrenObjects[i].varType + '[] = new Array()', Authorization.protected);
                  }
                  if (mulCase.key == 3) {
                    att = new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), temp.childrenObjects[i].varType + '[] = new Array(' + mulCase.value + ')', Authorization.protected);
                    conBlock+= 'if( this.'+this.changeAlias( temp.childrenObjects[i].name)+'.length!='+ mulCase.value+'){\nthrow new Error("Array length mismatch");\n}\n';
                  }
                  if (mulCase.key == 4) {
                    att = new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), temp.childrenObjects[i].varType + '[]', Authorization.protected);
                    for (let i = 0; i < mulCase.variables.length; i++){
                      params.push(new AttributeModel(mulCase.variables[i], 'number', Authorization.notSpecefied));
                      this.vars.push(mulCase.variables[i])
                    }
                      conBlock+= 'if( this.'+this.changeAlias( temp.childrenObjects[i].name)+'.length!='+ mulCase.value+'){\nthrow new Error("Array length mismatch");\n}\n';
                  }
                  if (mulCase.key == 5) {
                    att = new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), temp.childrenObjects[i].varType + '[]', Authorization.protected);
                    for (let i = 0; i < mulCase.variables.length; i++){
                      params.push(new AttributeModel(mulCase.variables[i], 'number', Authorization.notSpecefied));
                      this.vars.push(mulCase.variables[i])
                    }
                      conBlock+='if(!' + mulCase.cond.split('range').join('this.'+this.changeAlias(temp.childrenObjects[i].name)+'.length') + ' ){\nthrow new Error("Array length mismatch");\n}\n';
                  }
                  if (mulCase.key == 6 || mulCase.key == 7) {
                    att = new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), temp.childrenObjects[i].varType + '[]', Authorization.protected);
                    for (let j = 0; j < mulCase.variables.length; j++){
                      params.push(new AttributeModel(mulCase.variables[j], 'number', Authorization.notSpecefied));
                      this.vars.push(mulCase.variables[i])
                    }
                      conBlock+= 'if(!' + mulCase.cond.split('range').join('this.'+this.changeAlias(temp.childrenObjects[i].name)+'.length') + ' ){\nthrow new Error("Array length mismatch");\n}\n';
                  }

                }

                if (temp.childrenObjects[i].type == 'Class'){
                  att = new AttributeModel(this.changeAlias(temp.childrenObjects[i].name), this.excludeAlias(temp.childrenObjects[i].name), Authorization.protected);
                  impo=new Import(this.excludeAlias(temp.childrenObjects[i].name),this.excludeAlias(temp.childrenObjects[i].name));
                  imports.push(impo);
                }

                if (temp.childrenObjects[i].type == 'attribute') {
                  if (temp.childrenObjects[i].varValue != '') {
                    att = new AttributeModel(this.changeAlias(temp.childrenObjects[i].name), temp.childrenObjects[i].varType, Authorization.protected, temp.childrenObjects[i].varValue);
                  }
                  else att = new AttributeModel(this.changeAlias(temp.childrenObjects[i].name), temp.childrenObjects[i].varType, Authorization.protected);
                }
                if (temp.childrenObjects[i].type == 'state' && temp.childrenObjects[i].childrenObjects[0] != null) {
                  enumless = false;
                  att = new AttributeModel(this.changeAlias( temp.childrenObjects[i].name) , this.excludeAlias(temp.childrenObjects[i].name.toLowerCase()) , Authorization.protected);
                  let states: string[] = [];
                  for (let j = 0; j < temp.childrenObjects[i].childrenObjects.length; j++) {
                    states.push(temp.childrenObjects[i].childrenObjects[j].name);
                  }
                  enums.push(new Enum(this.excludeAlias(temp.childrenObjects[i].name.toLowerCase()) , Prefix.exported, states));
                }
                atts.push(att);
                att.authorization=Authorization.protected;
                // params.push(att);
              }
              cons=new ConstructorModel(params,this.changeAlias(temp.name),conBlock);
              for (let i = 0; i < temp.childrenObjects.length; i++) {
                let consParam=params
                let getSig: SignatureModel
                let setSig: SignatureModel
                let funcSet: FunctionModel
                let funcGet: FunctionModel
                if (temp.childrenObjects[i].type == 'Class') {
                  let params: AttributeModel[] = [];
                  params.push(new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), this.excludeAlias(temp.childrenObjects[i].name), Authorization.notSpecefied));
                  getSig = new SignatureModel(this.changeAlias( temp.childrenObjects[i].name), Type.getter, null, Prefix.nothing, Authorization.public, null, this.excludeAlias(temp.childrenObjects[i].name));
                  setSig = new SignatureModel(this.changeAlias( temp.childrenObjects[i].name), Type.setter, null, Prefix.nothing, Authorization.public, params);
                  funcGet = new FunctionModel(getSig, 'return this.' + this.changeAlias( temp.childrenObjects[i].name) + ';\n');
                  funcSet = new FunctionModel(setSig,'this.' + this.changeAlias( temp.childrenObjects[i].name) + '=' + this.changeAlias(temp.childrenObjects[i].name) + ';\n');
                }
                if (temp.childrenObjects[i].type == 'ArrayClass') {
                  let mulCase = temp.childrenObjects[i].multiplicity;
                  if(mulCase==null)continue;
                  let params: AttributeModel[] = [];
                  params.push(new AttributeModel(this.changeAlias(temp.childrenObjects[i].name), this.excludeAlias(temp.childrenObjects[i].name) + '[]', Authorization.notSpecefied));
                  getSig = new SignatureModel(this.changeAlias( temp.childrenObjects[i].name), Type.getter, null, Prefix.nothing, Authorization.public, null, this.excludeAlias(temp.childrenObjects[i].name) + '[]');
                  setSig = new SignatureModel(this.changeAlias( temp.childrenObjects[i].name), Type.setter, null, Prefix.nothing, Authorization.public, params.concat(consParam));
                  funcGet = new FunctionModel(getSig, 'return this.' + this.changeAlias( temp.childrenObjects[i].name) + ';\n');
                  let con=''
                  if(mulCase.key!=1 && mulCase.key!=2)con='if(!' + mulCase.cond.split('range').join(this.changeAlias(temp.childrenObjects[i].name)+'.length') + ' ){\nthrow new Error("Array length mismatch");\n}\n';
                  funcSet = new FunctionModel(setSig, con+'this.' + this.changeAlias( temp.childrenObjects[i].name) + '=' + this.changeAlias(temp.childrenObjects[i].name) + ';\n');
                }
                if (temp.childrenObjects[i].type == 'ArrayAttribute') {
                  let mulCase = temp.childrenObjects[i].multiplicity;
                  if(mulCase==null)continue;
                  let params: AttributeModel[] = [];
                  params.push(new AttributeModel(this.changeAlias(temp.childrenObjects[i].name), temp.childrenObjects[i].varType + '[]', Authorization.notSpecefied));
                  getSig = new SignatureModel(this.changeAlias( temp.childrenObjects[i].name), Type.getter, null, Prefix.nothing, Authorization.public, null, temp.childrenObjects[i].varType + '[]');
                  setSig = new SignatureModel(this.changeAlias( temp.childrenObjects[i].name), Type.setter, null, Prefix.nothing, Authorization.public, params.concat(consParam));
                  funcGet = new FunctionModel(getSig, 'return this.' + this.changeAlias( temp.childrenObjects[i].name) + ';\n');
                  let con=''
                  if(mulCase.key!=1 && mulCase.key!=2)con='if(!' + mulCase.cond.split('range').join(this.changeAlias(temp.childrenObjects[i].name)+'.length') + ' ){\nthrow new Error("Array length mismatch");\n}\n';
                  funcSet = new FunctionModel(setSig, con+'this.' + this.changeAlias( temp.childrenObjects[i].name) + '=' + this.changeAlias(temp.childrenObjects[i].name) + ';\n');
                }
                if (temp.childrenObjects[i].type == 'attribute') {
                  let params: AttributeModel[] = [];
                  params.push(new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), temp.childrenObjects[i].varType, Authorization.notSpecefied));
                  getSig = new SignatureModel(this.changeAlias( temp.childrenObjects[i].name), Type.getter, null, Prefix.nothing, Authorization.public, null, temp.childrenObjects[i].varType);
                  setSig = new SignatureModel(this.changeAlias( temp.childrenObjects[i].name), Type.setter, null, Prefix.nothing, Authorization.public, params);
                  funcGet = new FunctionModel(getSig, 'return this.' + this.changeAlias( temp.childrenObjects[i].name) + ';\n');
                  funcSet = new FunctionModel(setSig, 'this.' +this.changeAlias( temp.childrenObjects[i].name) + '=' + this.changeAlias(temp.childrenObjects[i].name) + ';\n');
                }
                if (temp.childrenObjects[i].type == 'state' && temp.childrenObjects[i].childrenObjects[0] != null) {
                  let params: AttributeModel[] = [];
                  params.push(new AttributeModel(this.changeAlias( temp.childrenObjects[i].name) , this.excludeAlias(temp.childrenObjects[i].name.toLowerCase()) , Authorization.notSpecefied));
                  getSig = new SignatureModel(this.changeAlias( temp.childrenObjects[i].name) , Type.getter, null, Prefix.nothing, Authorization.public, null, this.excludeAlias(temp.childrenObjects[i].name.toLowerCase()) );
                  setSig = new SignatureModel(this.changeAlias( temp.childrenObjects[i].name) , Type.setter, null, Prefix.nothing, Authorization.public, params);
                  funcGet = new FunctionModel(getSig, 'return this.' + this.changeAlias( temp.childrenObjects[i].name)  + ';\n');
                  funcSet = new FunctionModel(setSig, this.changeAlias( temp.childrenObjects[i].name)  + '=' + this.changeAlias(temp.childrenObjects[i].name)  + ';\n');
                }
                this.vars.push(this.changeAlias(temp.childrenObjects[i].name))
                funcs.push(funcGet);
                funcs.push(funcSet);
              }
            }
            if (temp.childrenProcesses != null) {
              for (let i = 0; i < temp.childrenProcesses.length; i++) {
                let func = this.BuildExistingFunction(temp.childrenProcesses[i].id, id, temp.childrenProcesses[i].block);
                funcs.push(func);
              }
            }
            let tempclass: ClassFile;
            if (enumless) tempclass = new ClassFile(id, sig, atts, cons, funcs,null,imports);
            else tempclass = new ClassFile(id, sig, atts, cons, funcs, enums,imports);
            classes.push(tempclass);
          }
          if (temp.type == 'object') {
            let params=this.MakeObjectParams(temp.id)
            if(temp.superName==null)continue;
            let obj = new ObjectModel(this.changeAlias(temp.name), this.changeAlias((temp.superName)), Authorization.notSpecefied,params);
            instances.push(obj);
          }
          if (temp.type == 'enum' || temp.type == 'enum1') {
            let states: string[] = [];
            for (let j = 0; j < temp.childrenObjects.length; j++) {
              states.push(temp.childrenObjects[j].name);
            }
            enumsArr.push(new Enum(this.changeAlias(temp.name.toLowerCase()), Prefix.exported, states));
          }
        }
        if (tempcall != null) {
          let value = this.Invoke(tempcall.superId, '')
          let att;
          let v = this.changeAlias((tempcall.varType).toLowerCase())
          if (value != null && value != '') att = new AttributeModel(this.changeAlias(tempcall.name), v, Authorization.notSpecefied, value.replace(';',''));
          else {
             att = new AttributeModel(this.changeAlias(tempcall.name), v, Authorization.notSpecefied);
          }
          if (tempcall.childrenProcesses.length == 2) {
            let val1 = this.Invoke(tempcall.childrenProcesses[0].id, '')
            let val2 = this.Invoke(tempcall.childrenProcesses[1].id, '')
            if (tempcall.childrenProcesses[0].varValue != null) val1 = tempcall.childrenProcesses[0].varValue + ' = ' + val1
            if (tempcall.childrenProcesses[1].varValue != null) val1 = tempcall.childrenProcesses[1].varValue + ' = ' + val2
            commands += ' if(' + this.changeAlias( tempcall.name) + ' == ' + this.excludeAlias((tempcall.childrenProcesses[0].type).toLowerCase()) + '.' + tempcall.childrenProcesses[0].superName + '){\n' + val1 + '\n}\nelse{\n' + val2 + '\n}\n'
          }
          if (tempcall.childrenProcesses.length > 2) {
            commands += ' switch(' + this.changeAlias( tempcall.name) + '){\n'
            for (let i = 0; i < tempcall.childrenProcesses.length; i++) {
              commands += 'case ' + tempcall.childrenProcesses[i].type+'.'+tempcall.childrenProcesses[i].superName + ':\n  '
              let val2 = this.Invoke(tempcall.childrenProcesses[i].id, '')
              if (tempcall.childrenProcesses[i].varValue != null) val2 = tempcall.childrenProcesses[i].varValue + ' = ' + val2
              commands += val2 + '\n  '
              commands += 'break;\n'
            }
            commands += 'default:\n  break;\n}\n'
          }
          instances.push(att);
        }

      }
      if (currElem instanceof OpmLogicalProcess) {
        let id = (<OpmLogicalProcess>currElem).lid;
        let temp: ThingState = null
        if (this.ThingType.has(id)) temp = this.ThingType.get(id);
        if (temp == null) {
          let name = (<OpmLogicalProcess>currElem).text;
          let sig = new SignatureModel(name, Type.function, null, Prefix.exported, Authorization.publicS);
          processes.push(new FunctionModel(sig, ((<{ functionInput: string, parameters: string }><unknown>(currElem.insertedFunction)).functionInput + '').replace('undefined', '').split('Return').join('return') + '\n'));
        }
        else {
          let name = (<OpmLogicalProcess>currElem).text;
          if (this.IsARoot(temp.id)) {
            let func = this.BuildExistingFunction(temp.id, '', temp.block);
            processes.push(func);
          }
        }
      }
    }
    instances.sort((a, b) => (this.getInstanceHeirarchy(a.type) < this.getInstanceHeirarchy(b.type)) ? 1 : -1)

    for (let i = 0; i < enumsArr.length; i++) {
      mainRes=mainRes+enumsArr[i].toCode()+'\n';
      this.mainEnums.push(enumsArr[i].name)
    }
    for (let i = 0; i < processes.length; i++) {
      mainRes=mainRes+processes[i].toCode()+'\n';
      this.functions.push(this.changeAlias(processes[i].signature.name))
    }
    for (let i = 0; i < instances.length; i++) {
      mainRes=mainRes+'let ' + instances[i].toCode()+'\n';
    }
    mainRes=mainRes+commands
    this.names.push('main');
    classResult.push(mainRes)
    for (let i = 0; i < classes.length; i++) {
      classResult.push(classes[i].toCode());
      this.names.push(classes[i].signature.name)
      if(classes[i].attributes!=null)for(let j=0;j<classes[i].attributes.length;j++)this.vars.push(classes[i].attributes[j].name)
      if(classes[i].enums!=null)for(let j=0;j<classes[i].enums.length;j++)this.mainEnums.push(classes[i].enums[j].name)
    }
    return classResult;
  }

  getNames(){
    return this.names;
  }

  getEnums():string[]{
    return this.mainEnums;
  }
  getFuncs(){
    return this.functions;
  }
  getVars(){
    return this.vars;
  }

  getHeirarchy(): any {
    let elements = this.myModel.visualElements;
    let procs = <process[]>Array();

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmTaggedRelation) {//check unidirectional relation
        let a = (<OpmTaggedRelation>currElement).sourceLogicalElement;
        let c = (<OpmTaggedRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmTaggedRelation>currElement).linkType.toString();
        let multiplicity = (<OpmTaggedRelation>currElement).visualElements[0].targetMultiplicity
        let mul = this.getMultiplicity(multiplicity + ''.toString())
        let tag = (<OpmTaggedRelation>currElement).visualElements[0].tag

        if (relationtype == '9') {
          if (a instanceof OpmLogicalObject) {
            if(tag=='is of type'){
              let temp = new ThingState((<OpmLogicalObject>a).text, 'attribute',a.lid);
              if (this.ThingType.has(a.lid)) temp = this.ThingType.get(a.lid);
              temp.varType=(<OpmLogicalObject>c[0]).text;
              this.ThingType.set(a.lid, temp);
              continue;
            }
            let temp = new ThingState((<OpmLogicalObject>a).text, 'Class',a.lid);
            if (this.ThingType.has(a.lid)) temp = this.ThingType.get(a.lid);
            for (let i = 0; i < c.length; i++) {

              if (multiplicity + '' != 'undefined' && multiplicity!=null) temp.childrenObjects.push(new ThingState((<OpmLogicalObject>c[i]).text, 'ArrayClass', null, null, null, null, mul));
              else temp.childrenObjects.push(new ThingState((<OpmLogicalObject>c[i]).text, 'Class',c[i].lid));

              let temp2 = new ThingState((<OpmLogicalObject>c[i]).text, 'Class',c[i].lid);
              if (this.ThingType.has(c[i].lid)) temp2 = this.ThingType.get(c[i].lid);
              temp2.type = 'Class'
              this.ThingType.set(c[i].lid, temp2);
            }
            this.ThingType.set(a.lid, temp);
          }
          if (a instanceof OpmLogicalProcess) {

            let temp = new ThingState((<OpmLogicalProcess>a).text, null, a.lid, (<{ functionInput: string, parameters: string }><unknown>(a.insertedFunction)).functionInput);
            if (this.ThingType.has(a.lid)) temp = this.ThingType.get(a.lid);
            for (let i = 0; i < c.length; i++) {
              if (multiplicity + '' != 'undefined' && multiplicity!=null) temp.childrenProcesses.push(new ThingState((<OpmLogicalProcess>c[i]).text, 'ArrayFunction', c[i].lid, null, null, null, mul));
              else temp.childrenProcesses.push(new ThingState((<OpmLogicalProcess>c[i]).text, 'function', c[i].lid));

              let temp2 = new ThingState((<OpmLogicalObject>c[i]).text, null, c[i].lid, (<{ functionInput: string, parameters: string }><unknown>((<OpmLogicalProcess>c[i]).insertedFunction)).functionInput);
              if (this.ThingType.has(c[i].lid)) temp2 = this.ThingType.get(c[i].lid);

              this.ThingType.set(c[i].lid, temp2);
            }
            this.ThingType.set(a.lid, temp);
          }
        }
      }

      if (currElement instanceof OpmFundamentalRelation) { // searches for all structural link elements
        let a = (<OpmFundamentalRelation>currElement).sourceLogicalElement;
        let c = (<OpmFundamentalRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmFundamentalRelation>currElement).linkType.toString();
        let multiplicity = (<OpmFundamentalRelation>currElement).visualElements[0].targetMultiplicity
        let mul = this.getMultiplicity(multiplicity + ''.toString())

        if (relationtype == '11') { // if the current link is aggregation
          if (a instanceof OpmLogicalObject) {
            let t='Class'
            if(this.IsInstance(a.lid))t='object'
            let temp = new ThingState((<OpmLogicalObject>a).text, t,a.lid);
            if (this.ThingType.has(a.lid)) temp = this.ThingType.get(a.lid);
            for (let i = 0; i < c.length; i++) {
              if (multiplicity + '' != 'undefined' && multiplicity!=null) temp.childrenObjects.push(new ThingState((<OpmLogicalObject>c[i]).text, 'Array'+t,c[i].lid,null,(<OpmLogicalObject>c[i]).text,'', mul));
              else temp.childrenObjects.push(new ThingState((<OpmLogicalObject>c[i]).text, t,c[i].lid));

              let temp2 = new ThingState((<OpmLogicalObject>c[i]).text, t,c[i].lid);
              if (this.ThingType.has(c[i].lid)) temp2 = this.ThingType.get(c[i].lid);
              temp2.type = t
              this.ThingType.set(c[i].lid, temp2);
            }
            this.ThingType.set(a.lid, temp);
          }
          if (a instanceof OpmLogicalProcess) {
            let temp = new ThingState((<OpmLogicalProcess>a).text, null, a.lid, (<{ functionInput: string, parameters: string }><unknown>(a.insertedFunction)).functionInput);
            temp.id = a.lid;
            if (this.ThingType.has(a.lid)) temp = this.ThingType.get(a.lid);
            for (let i = 0; i < c.length; i++) {
              let variab = ''
              if (this.IsParent(a.lid, this.getResSon(c[i].lid))) variab = this.changeAlias( this.getName(this.getResSon(c[i].lid))) + ' = '
              if (multiplicity + '' != 'undefined' && multiplicity!=null) temp.childrenProcesses.push(new ThingState((<OpmLogicalProcess>c[i]).text, 'ArrayFunction', c[i].lid, null, null, variab, mul));
              else temp.childrenProcesses.push(new ThingState((<OpmLogicalProcess>c[i]).text, 'function', c[i].lid, null, null, variab));
              let temp2 = new ThingState((<OpmLogicalObject>c[i]).text, null, c[i].lid, (<{ functionInput: string, parameters: string }><unknown>((<OpmLogicalProcess>c[i]).insertedFunction)).functionInput);
              if (this.ThingType.has(c[i].lid)) temp2 = this.ThingType.get(c[i].lid);

              this.ThingType.set(c[i].lid, temp2);
            }
            this.ThingType.set(a.lid, temp);
          }
        }

        if (relationtype == '12') {// if the current link is exhibition
          if (a instanceof OpmLogicalObject) {
            let t='Class'
            if(this.IsInstance(a.lid))t='object'
            let temp = new ThingState((<OpmLogicalObject>a).text, t,a.lid);
            if (this.ThingType.has(a.lid)) temp = this.ThingType.get(a.lid);
            for (let i = 0; i < c.length; i++) {
              if (c[i] instanceof OpmLogicalObject) {
                if (this.IsALeaf(c[i].lid)) {

                  let temp2 = new ThingState((<OpmLogicalObject>c[i]).text, 'attribute',c[i].lid);
                  if (this.ThingType.has(c[i].lid)) temp2 = this.ThingType.get(c[i].lid);

                  if ((<OpmLogicalObject>c[i]).isComputational()) {
                    temp2.varType = this.getVarType((<OpmLogicalObject>c[i]).units)
                    temp2.varValue = ('' + (<OpmLogicalObject>c[i]).value).replace('value','')
                  }
                  else {
                    if ((<OpmLogicalObject>c[i]).states.length >= 1) {
                      temp2.varValue = ''
                      temp2.varType = (<OpmLogicalObject>c[i]).text ;
                      let states = (<OpmLogicalObject>c[i]).states;
                      for (let i = 0; i < states.length; i++) {
                        if (states[i].text == '') break;
                        let temp5 = new ThingState(states[i].text,'stateVal',i.toString());
                        temp2.childrenObjects.push(temp5);
                      }
                      temp2.type = 'state'
                    }
                    else {
                      if(temp2.varType+''=='undefined' || temp2.varType=='')temp2.varType = 'any';
                      temp2.varValue = ''
                    }
                  }

                  this.ThingType.set(c[i].lid, temp2);
                  if ((<OpmLogicalObject>c[i]).states.length >= 1 && (<OpmLogicalObject>c[i]).states[0]._text!='value') { temp.childrenObjects.push(temp2) }
                  else {
                    if (multiplicity + '' != 'undefined' && multiplicity!=null) temp.childrenObjects.push(new ThingState((<OpmLogicalObject>c[i]).text, 'ArrayAttribute', null, null, temp2.varType, temp2.varValue.replace('value', ''), mul));
                    else temp.childrenObjects.push(new ThingState((<OpmLogicalObject>c[i]).text, 'attribute', null, null, temp2.varType, temp2.varValue.replace('value', '')))
                  }
                }
                else {
                  let temp2 = new ThingState((<OpmLogicalObject>c[i]).text, t,c[i].lid);
                  if (this.ThingType.has(c[i].lid)) temp2 = this.ThingType.get(c[i].lid);
                  this.ThingType.set(c[i].lid, temp2);
                  if (multiplicity + '' != 'undefined' && multiplicity!=null) temp.childrenObjects.push(new ThingState((<OpmLogicalObject>c[i]).text, 'Array'+t,c[i].lid,null,(<OpmLogicalObject>c[i]).text,'', mul));
                  else temp.childrenObjects.push(new ThingState((<OpmLogicalObject>c[i]).text, t,c[i].lid));
                }
              }
              if (c[i] instanceof OpmLogicalProcess) {
                let temp2 = new ThingState((<OpmLogicalObject>c[i]).text, null, c[i].lid, (<{ functionInput: string, parameters: string }><unknown>((<OpmLogicalProcess>c[i]).insertedFunction)).functionInput);
                if (this.ThingType.has(c[i].lid)) temp2 = this.ThingType.get(c[i].lid);
                this.ThingType.set(c[i].lid, temp2);
                temp.childrenProcesses.push(new ThingState((<OpmLogicalObject>c[i]).text, '', c[i].lid, (<{ functionInput: string, parameters: string }><unknown>((<OpmLogicalProcess>c[i]).insertedFunction)).functionInput));
              }
            }
            this.ThingType.set(a.lid, temp);
          }
          if (a instanceof OpmLogicalProcess) {
            let temp = new ThingState((<OpmLogicalProcess>a).text, null, a.lid, (<{ functionInput: string, parameters: string }><unknown>(a.insertedFunction)).functionInput);
            if (this.ThingType.has(a.lid)) temp = this.ThingType.get(a.lid);
            for (let i = 0; i < c.length; i++) {
              if (c[i] instanceof OpmLogicalObject) {
                if (this.IsALeaf(c[i].lid)) {
                  let temp2 = new ThingState((<OpmLogicalObject>c[i]).text, 'attribute',c[i].lid);
                  if (this.ThingType.has(c[i].lid)) temp2 = this.ThingType.get(c[i].lid);

                  if ((<OpmLogicalObject>c[i]).isComputational()) {
                    temp2.varType = this.getVarType((<OpmLogicalObject>c[i]).units)
                    temp2.varValue = ('' + (<OpmLogicalObject>c[i]).value).replace('value','')
                  }
                  else {
                    if ((<OpmLogicalObject>c[i]).states.length > 1) {
                      temp2.varValue = '' + (<OpmLogicalObject>c[i]).value
                      temp2.varType = (<OpmLogicalObject>c[i]).text;
                    }
                    else {
                      if(temp2.varType+''=='undefined' || temp2.varType=='')temp2.varType = 'any';
                      temp2.varValue = '';
                    }
                  }
                  this.ThingType.set(c[i].lid, temp2);
                  if (multiplicity != null) temp.childrenObjects.push(new ThingState((<OpmLogicalObject>c[i]).text, 'ArrayAttribute', c[i].lid, null, temp2.varType, temp2.varValue.replace('value', ''), mul));
                  else temp.childrenObjects.push(new ThingState((<OpmLogicalObject>c[i]).text, 'attribute', c[i].lid, null, temp2.varType, temp2.varValue.replace('value', '')));
                }
                else {
                  let t='Class'
                  if(this.IsInstance(c[i].lid))t='object'
                  let temp2 = new ThingState((<OpmLogicalObject>c[i]).text, t,c[i].lid);
                  temp2.varType = (<OpmLogicalObject>c[i]).text
                  if (this.ThingType.has(c[i].lid)) temp2 = this.ThingType.get(c[i].lid);
                  if(t=='Class')this.ThingType.set(c[i].lid, temp2);
                  if (multiplicity + '' != 'undefined' && multiplicity!=null) temp.childrenObjects.push(new ThingState((<OpmLogicalObject>c[i]).text, 'Array'+t, c[i].lid, null, (<OpmLogicalObject>c[i]).text, null, mul));
                  else temp.childrenObjects.push(new ThingState((<OpmLogicalObject>c[i]).text, t, c[i].lid, null, (<OpmLogicalObject>c[i]).text));
                }
              }
              if (c[i] instanceof OpmLogicalProcess) {
                let temp2 = new ThingState((<OpmLogicalObject>c[i]).text, null, c[i].lid);
                if (this.ThingType.has(c[i].lid)) temp2 = this.ThingType.get(c[i].lid);
                this.ThingType.set(c[i].lid, temp2);
                temp.childrenObjects.push(new ThingState((<OpmLogicalProcess>c[i]).text, 'function', c[i].lid, (<{ functionInput: string, parameters: string }><unknown>((<OpmLogicalProcess>c[i]).insertedFunction)).functionInput));
              }
            }
            this.ThingType.set(a.lid, temp);
          }
        }

        if (relationtype == '13') {// if the current link is generalization
          if (a instanceof OpmLogicalObject) {
            for (let i = 0; i < c.length; i++) {
              let temp = new ThingState((<OpmLogicalObject>c[i]).text, 'Class',c[i].lid);
              if (this.ThingType.has(c[i].lid)) temp = this.ThingType.get(c[i].lid);
              temp.superId = a.lid;
              temp.superName = (<OpmLogicalObject>a).text;
              temp.type = 'Class';
              this.ThingType.set(c[i].lid, temp);
            }
            let temp = new ThingState((<OpmLogicalObject>a).text, 'Class',a.lid);
            if (this.ThingType.has(a.lid)) temp = this.ThingType.get(a.lid);
            this.ThingType.set(a.lid, temp);
          }
          if (a instanceof OpmLogicalProcess) {
            for (let i = 0; i < c.length; i++) {
              let temp = new ThingState((<OpmLogicalProcess>c[i]).text, '', c[i].lid, (<{ functionInput: string, parameters: string }><unknown>((<OpmLogicalProcess>c[i]).insertedFunction)).functionInput);
              if (this.ThingType.has(c[i].lid)) temp = this.ThingType.get(c[i].lid);
              temp.superId = a.lid;
              temp.superName = (<OpmLogicalProcess>a).text;
              this.ThingType.set(c[i].lid, temp);
            }
            let temp = new ThingState((<OpmLogicalProcess>a).text, '', a.lid, (<{ functionInput: string, parameters: string }><unknown>(a.insertedFunction)).functionInput);
            if (this.ThingType.has(a.lid)) temp = this.ThingType.get(a.lid);
            this.ThingType.set(a.lid, temp);
          }
        }

        if (relationtype == '14') {// if the current link is classification
          if (a instanceof OpmLogicalObject) {
            let temp = new ThingState((<OpmLogicalObject>a).text, 'Class',a.lid);
            if (this.ThingType.has(a.lid)) temp = this.ThingType.get(a.lid);
            for (let i = 0; i < c.length; i++) {
              if(this.GetParentId2(c[i].lid)!='')continue;
              let temp2 = new ThingState((<OpmLogicalObject>c[i]).text, 'object',c[i].lid);
              if(this.ThingType.has(c[i].lid))temp2=this.ThingType.get(c[i].lid)
              temp2.superName = (<OpmLogicalObject>a).text;
              this.ThingType.set(c[i].lid, temp2);
            }
            this.ThingType.set(a.lid, temp);
          }
          if (a instanceof OpmLogicalProcess) {
            alert('we dont know what an instance of a function is');
          }
        }

      }

      if (currElement instanceof OpmProceduralRelation) {// searches for all procedural link elements
        let a = (<OpmProceduralRelation>currElement).sourceLogicalElement;
        let c = (<OpmProceduralRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmProceduralRelation>currElement).linkType.toString();
        let multiplicity = (<OpmProceduralRelation>currElement).visualElements[0].sourceMultiplicity
        let mul = this.getMultiplicity(multiplicity + ''.toString())

        if (relationtype == '2' || relationtype == '4') { // if the current link is comsumption or effect
          let temp: ThingState;
          let requirement: string;

          if (this.IsALeaf(a.lid)) {
            requirement = 'usedParam';
            temp = new ThingState((<OpmLogicalObject>a).text, 'usedParam',a.lid);
            if ((<OpmLogicalObject>a).isComputational()) {
              temp.varType = this.getVarType((<OpmLogicalObject>a).units)
              temp.varValue = ('' + (<OpmLogicalObject>a).value).replace('value','')
            }
            else {
              temp.varType = 'any';
              temp.varValue = '';
            }
          }
          else {
            requirement = 'Class';
            temp = new ThingState((<OpmLogicalObject>a).text, 'Class',a.lid);
          }
          if (this.ThingType.has(a.lid)) temp = this.ThingType.get(a.lid);

          for (let i = 0; i < c.length; i++) {
            let temp2
            if ((<OpmLogicalProcess>c[i]).code.toString() == '1') temp2 = new ThingState((<OpmLogicalProcess>c[i]).text, 'function', c[i].lid, (<OpmLogicalProcess>c[i]).insertedFunction.toString());
            else temp2 = new ThingState((<OpmLogicalProcess>c[i]).text, 'function', c[i].lid, (<{ functionInput: string, parameters: string }><unknown>((<OpmLogicalProcess>c[i]).insertedFunction)).functionInput);
            if (this.ThingType.has(c[i].lid)) temp2 = this.ThingType.get(c[i].lid);
            if (requirement == 'usedParam') {
              if (multiplicity + '' != 'undefined' && multiplicity!=null) temp2.childrenObjects.push(new ThingState((<OpmLogicalObject>a).text, 'ArrayParam', a.lid, null, temp.varType, temp.varValue, mul));
              else {
                if ((<OpmLogicalProcess>c[0]).isComputational() && (<OpmLogicalProcess>c[0]).code == 1) temp2.childrenObjects.push(new ThingState((<OpmLogicalObject>a).text, 'usedParam', null, null, temp.varType, temp.varValue));
                else temp2.childrenObjects.push(new ThingState((<OpmLogicalObject>a).text, requirement, a.lid, null, temp.varType, temp.varValue));
              }
            }
            else {
              if (multiplicity + '' != 'undefined' && multiplicity!=null) temp2.childrenObjects.push(new ThingState((<OpmLogicalObject>a).text, 'ArrayClass', a.lid, null, null, null, mul));
              else temp2.childrenObjects.push(new ThingState((<OpmLogicalObject>a).text, requirement, a.lid, null, null, null));
            }
            this.ThingType.set(c[i].lid, temp2);
          }
          this.ThingType.set(a.lid, temp);
        }
        if (relationtype == '3' || relationtype == '4') { // if the current link is Result or effect
          let p, cc;
          if (relationtype == '3') {
            p = a
            cc = c[0]
          }
          if (relationtype == '4') {
            p = c[0]
            cc = a
          }
          if (cc instanceof OpmLogicalState) {
            break;
          }
          let temp: ThingState;
          let x1=this.GetParentId3(this.GetParentId(cc.lid))
          let x2=this.GetParentId(p.lid)
          if ((this.GetParentId2(cc.lid) == this.GetParentId2(p.lid) && this.GetParentId2(cc.lid) != '') || x1==x2 && x1!='') continue;
          if ((this.GetParentId(cc.lid) == this.GetParentId(p.lid) && this.GetParentId(cc.lid) != '') || this.IsParent(p.lid, this.GetParentId(cc.lid))) {
            if (this.IsALeaf(cc.lid)) {
              temp = new ThingState((<OpmLogicalObject>cc).text, 'return', cc.lid)
              if ((<OpmLogicalObject>cc).states.length > 1) temp.varType = (<OpmLogicalObject>cc).text;
              else {
                if ((<OpmLogicalObject>cc).isComputational()) temp.varType = this.getVarType((<OpmLogicalObject>cc).units)
                else temp.varType = 'any';
              }
            }
            else temp = new ThingState((<OpmLogicalObject>cc).text, 'returnClass', cc.lid, null, (<OpmLogicalObject>cc).text)
            let temp2 = new ThingState((<OpmLogicalProcess>p).text, 'function', p.lid)
            if (this.ThingType.get(p.lid) != null) temp2 = this.ThingType.get(p.lid)
            temp2.childrenObjects.push(temp)
            this.ThingType.set(p.lid, temp2)
          }
          else {
            if (this.IsALeaf(cc.lid)) {
              temp = new ThingState((<OpmLogicalObject>cc).text, 'call', cc.lid)
              if (this.ThingType.has(cc.lid + 'call')) temp = this.ThingType.get(cc.lid + 'call')
              if ((<OpmLogicalObject>cc).states.length > 1) temp.varType = (<OpmLogicalObject>cc).text;
              else {
                if ((<OpmLogicalObject>cc).isComputational()) temp.varType = this.getVarType((<OpmLogicalObject>cc).units)
                else temp.varType = 'any';
              }
            }
            else temp = new ThingState((<OpmLogicalObject>cc).text, 'call', cc.lid, null, (<OpmLogicalObject>cc).text)
            let cond = this.CheckConditional(p.lid);
            let temp2 = new ThingState((<OpmLogicalProcess>p).text, 'function', p.lid)
            temp2.superId = ''
            if (this.ThingType.get(p.lid) != null) temp2 = this.ThingType.get(p.lid)
            if (cond && temp2.superId != '' && temp2.superId != null) {
              temp.superName = ''
              temp.superId = ''
              let condParent: ThingState = this.ThingType.get(temp2.superId + 'call')
              for (let i = 0; i < condParent.childrenProcesses.length; i++) {
                if (condParent.childrenProcesses[i].name == (<OpmLogicalProcess>p).text) condParent.childrenProcesses[i].varValue = this.changeAlias( temp.name);
              }
            }
            else {
              temp.superName = (<OpmLogicalProcess>p).text
              temp.superId = (<OpmLogicalObject>p).lid
            }
            this.ThingType.set(cc.lid + 'call', temp);
            this.ThingType.set(p.lid, temp2)
          }
        }
        if (relationtype == '0' || relationtype == '1') { // if the current link is Agent or Instrument
          if ((<OpmProceduralRelation>currElement).event) continue;
          if ((<OpmProceduralRelation>currElement).condition) {
            let parent = (<OpmLogicalState>a).parent
            let temp: ThingState = new ThingState(parent.text, 'variable',parent.lid);
            if (this.ThingType.has(parent.lid + 'call')) temp = this.ThingType.get(parent.lid + 'call');
            let temp2: ThingState = new ThingState((<OpmLogicalProcess>c[0]).text, parent.text, c[0].lid)
            temp2.superId = parent.lid
            this.ThingType.set(c[0].lid, temp2)
            temp2.superName = (<OpmLogicalState>a).text;
            temp.childrenProcesses.push(temp2);
            this.ThingType.set(parent.lid + 'call', temp)
          }
          else {
            let temp: ThingState;
            let requirement: string;
            if (relationtype == '1' && this.IsALeaf(a.lid)) {
              requirement = 'requiredAtt';
              temp = new ThingState((<OpmLogicalObject>a).text, 'usedParam',a.lid);
              if ((<OpmLogicalObject>a).isComputational()) {
                temp.varType = this.getVarType((<OpmLogicalObject>a).units)
                temp.varValue = ('' + (<OpmLogicalObject>a).value).replace('value','')
              }
              else {
                temp.varType = 'any';
                temp.varValue = '';
              }
            }
            else {
              requirement = 'required';
              temp = new ThingState((<OpmLogicalObject>a).text, 'Class',a.lid);
            }
            if (this.ThingType.has(a.lid)) temp = this.ThingType.get(a.lid);
            for (let i = 0; i < c.length; i++) {
              let temp2
              if ((<OpmLogicalProcess>c[i]).code.toString() == '1') temp2 = new ThingState((<OpmLogicalProcess>c[i]).text, 'function', c[i].lid, (<OpmLogicalProcess>c[i]).insertedFunction.toString());
              else temp2 = new ThingState((<OpmLogicalProcess>c[i]).text, 'function', c[i].lid, (<{ functionInput: string, parameters: string }><unknown>((<OpmLogicalProcess>c[i]).insertedFunction)).functionInput);
              if (this.ThingType.has(c[i].lid)) temp2 = this.ThingType.get(c[i].lid);
              if (requirement == 'requiredAtt') {
                if (multiplicity + '' != 'undefined' && multiplicity!=null) temp2.childrenObjects.push(new ThingState((<OpmLogicalObject>a).text, 'requiredAttArray', a.lid, null, temp.varType, temp.varValue, mul));
                else {
                  if ((<OpmLogicalProcess>c[0]).isComputational() && (<OpmLogicalProcess>c[0]).code == 1) temp2.childrenObjects.push(new ThingState((<OpmLogicalObject>a).text, 'usedParam', null, null, temp.varType, temp.varValue));
                  else temp2.childrenObjects.push(new ThingState((<OpmLogicalObject>a).text, requirement, a.lid, null, temp.varType, temp.varValue));
                }
              }
              else {
                if (multiplicity + '' != 'undefined'&& multiplicity!=null) temp2.childrenObjects.push(new ThingState((<OpmLogicalObject>a).text, 'requiredClassArray', a.lid, null, null, null, mul));
                else temp2.childrenObjects.push(new ThingState((<OpmLogicalObject>a).text, requirement, a.lid, null, null, null));
              }
              this.ThingType.set(c[i].lid, temp2);
            }
            this.ThingType.set(a.lid, temp);
          }
        }
        if (relationtype == '5') {
          let temp = new ThingState((<OpmLogicalProcess>a).text, null, a.lid, (<{ functionInput: string, parameters: string }><unknown>((<OpmLogicalProcess>a).insertedFunction)).functionInput);
          temp.id = a.lid;
          if (this.ThingType.has(a.lid)) temp = this.ThingType.get(a.lid);
          for (let i = 0; i < c.length; i++) {
            if (multiplicity + '' != 'undefined' && multiplicity!=null) temp.childrenProcesses.push(new ThingState((<OpmLogicalProcess>c[i]).text, 'ArrayFunction', c[i].lid, null, null, null, mul));
            else temp.childrenProcesses.push(new ThingState((<OpmLogicalProcess>c[i]).text, 'function', c[i].lid));
            let temp2 = new ThingState((<OpmLogicalObject>c[i]).text, null, c[i].lid, (<{ functionInput: string, parameters: string }><unknown>((<OpmLogicalProcess>c[i]).insertedFunction)).functionInput);
            if (this.ThingType.has(c[i].lid)) temp2 = this.ThingType.get(c[i].lid);

            this.ThingType.set(c[i].lid, temp2);
          }
          this.ThingType.set(a.lid, temp);
        }
      }

      if (currElement instanceof OpmLogicalObject) {// searches for all states
        if ((<OpmLogicalObject>currElement).states.length >= 1 && (<OpmLogicalObject>currElement).value=='None') {
          let res = this.GetEnumType(currElement.lid)
          if (res == 'Class') {
            let t='Class'
            if(this.IsInstance(currElement.lid))t='object'
            let temp:ThingState = new ThingState((<OpmLogicalObject>currElement).text, t,currElement.lid);
            if (this.ThingType.has(currElement.lid)) temp = this.ThingType.get(currElement.lid);
            let c = (<OpmLogicalObject>currElement).states;
            let temp2 = new ThingState(temp.name+'State', 'state','-1');
            for (let i = 0; i < c.length; i++) {
              if (c[i].text == '') break;
              let temp1 = new ThingState(c[i].text,'StateVal',i.toString());
              temp2.childrenObjects.push(temp1);
            }
            //alert(temp.name)
            if(t=='object'){
              let superName=this.getName(this.GetParentId3(temp.id))
              temp2.name=this.changeAlias(superName)+'State';
              temp2.varType=this.changeAlias(superName)+'State';
            }
            temp.childrenObjects.push(temp2);
            this.ThingType.set(currElement.lid, temp);
          }
          if (res == 'variable') {
            let c = (<OpmLogicalObject>currElement).states;
            let temp2 = new ThingState((<OpmLogicalObject>currElement).text, 'enum1',currElement.lid);
            for (let i = 0; i < c.length; i++) {
              if (c[i].text == '') break;
              let temp1 = new ThingState(c[i].text,'stateVal',i.toString());
              temp2.childrenObjects.push(temp1);
            }
            this.ThingType.set(currElement.lid, temp2)
          }
        }
      }

      if (currElement instanceof OpmLogicalProcess) {//takes the position of all the processes
        type process = {
          name: string;
          height: number;
        };
        let x: process = <process>new Object();
        x.name = currElement.lid;
        x.height = (<OpmVisualProcess>elements[i]).yPos
        procs.push(x)
      }
    }
    procs.sort((a, b) => (a.height > b.height) ? 1 : -1)
    procs.forEach(element => {
      this.processes.push(element.name)
    });
  }

  IsALeaf(id: string): Boolean {
    let elements = this.myModel.visualElements;
    

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmFundamentalRelation) { // searches for all link elements
        let a = (<OpmFundamentalRelation>currElement).sourceLogicalElement;
        let relationtype = (<OpmFundamentalRelation>currElement).linkType.toString();
        if (a.lid == id) return false;
      }
      if (currElement instanceof OpmProceduralRelation) {
        let a = (<OpmProceduralRelation>currElement).sourceLogicalElement;
        let relationtype = (<OpmProceduralRelation>currElement).linkType.toString();
        if (a.lid == id && relationtype == '0') return false;
      }
    }
    return true;
  }

  IsARoot(id: string): Boolean {
    let elements = this.myModel.visualElements;
    

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmFundamentalRelation) { // searches for all link elements
        let a = (<OpmFundamentalRelation>currElement).sourceLogicalElement;
        let c = (<OpmFundamentalRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmFundamentalRelation>currElement).linkType.toString();
        if (relationtype == '12' && a instanceof OpmLogicalObject) {
          for (let i = 0; i < c.length; i++) {
            if (c[i].lid == id) return false;
          }
        }
      }
    }
    this.StaticType.set(id, 'Static');
    return true;
  }
  IsInstance(id: string): Boolean {
    let elements = this.myModel.visualElements;
    

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmFundamentalRelation) { // searches for all link elements
        let a = (<OpmFundamentalRelation>currElement).sourceLogicalElement;
        let c = (<OpmFundamentalRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmFundamentalRelation>currElement).linkType.toString();
        if (relationtype == '14' && a instanceof OpmLogicalObject) {
          for (let i = 0; i < c.length; i++) {
            if (c[i].lid == id) return true;
          }
        }
      }
    }
    return false;
  }

  Access(UserId: string, ToolId: string, ParentId: string): string {
    let User: ThingState = this.ThingType.get(UserId);

    if (ParentId == '') {
      for (let i = 0; i < User.childrenObjects.length; i++) {
        if (User.childrenObjects[i].type == 'Class' && this.IsParent(User.childrenObjects[i].id, ToolId)) return 'Given';
      }
      return 'Static'
    }

    if (  (this.IsParent(ParentId, UserId) && this.IsParent(ParentId, ToolId))
          ||
          (this.IsParent(ParentId, UserId) && ParentId==this.GetParentId3(this.GetParentId(ToolId)))
          ||
          (this.IsParent(ParentId, UserId)&&this.IsParent(this.GetParentId5(ParentId),ToolId)) ){
      if (this.StaticType.get(ToolId) != null) return 'NotRequired'
      if (this.getMul(UserId) == this.getMul(ToolId,ParentId)) return 'Direct'
      if (this.getMul2(ToolId,UserId) == this.getMul(ToolId,ParentId)) return 'Direct'
      return 'Static';
    }

    if (this.IsParent(ParentId, this.GetParentId(ToolId))) {
      if (this.getMul(UserId) == this.getMul(this.GetParentId(ToolId))) return 'Given';
      return 'Static'
    }
    for (let i = 0; i < User.childrenObjects.length; i++) {
      if (User.childrenObjects[i].type == 'Class' && this.IsParent(User.childrenObjects[i].id, ToolId)) return 'Given';
      if (User.childrenObjects[i].type == 'function' && User.childrenObjects[i].id == ToolId) return 'Direct';
    }
    return 'Static';
  }

  IsParent(id1: string, id2: string): boolean {
    let elements = this.myModel.visualElements;
    

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmFundamentalRelation) { // searches for all link elements
        let a = (<OpmFundamentalRelation>currElement).sourceLogicalElement;
        let c = (<OpmFundamentalRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmFundamentalRelation>currElement).linkType.toString();
        if ((relationtype == '12' || relationtype == '11') && a.lid == id1) {
          for (let i = 0; i < c.length; i++) {
            if (c[i].lid == id2) return true;
          }
        }
      }
    }
    return false;
  }

  getResSon(id1: string): string {
    let elements = this.myModel.visualElements;
    

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmProceduralRelation) { // searches for all link elements
        let a = (<OpmProceduralRelation>currElement).sourceLogicalElement;
        let c = (<OpmProceduralRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmProceduralRelation>currElement).linkType.toString();
        if ((relationtype == '3') && a.lid == id1) {
          return c[0].lid;
        }
        if ((relationtype == '4') && c[0].lid == id1) {
          return a.lid;
        }
      }
    }
    return '';
  }

  getName(id1: string): string {
    let elements = this.myModel.visualElements;
    

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmLogicalObject && currElement.lid == id1) return currElement.text
    }
    return '';
  }


  IsParam(id1: string, id2: string): boolean {
    let elements = this.myModel.visualElements;
    

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmProceduralRelation) { // searches for all link elements
        let a = (<OpmProceduralRelation>currElement).sourceLogicalElement;
        let c = (<OpmProceduralRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmProceduralRelation>currElement).linkType.toString();
        if ((relationtype == '2' || relationtype == '4') && a.lid == id1) {
          for (let i = 0; i < c.length; i++) {
            if (c[i].lid == id2) return true;
          }
        }
        if ((relationtype == '1') && c[0].lid == id1) {
          if (a.lid == id2) return true;
        }
      }
    }
    return false;
  }

  GetParentId(id: string): string {
    let elements = this.myModel.visualElements;
    

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmFundamentalRelation) { // searches for all link elements
        let a = (<OpmFundamentalRelation>currElement).sourceLogicalElement;
        let c = (<OpmFundamentalRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmFundamentalRelation>currElement).linkType.toString();
        if ((relationtype == '12' || relationtype == '11') && a instanceof OpmLogicalObject) {
          for (let i = 0; i < c.length; i++) {
            if (c[i].lid == id) return a.lid;
          }
        }
      }
    }
    return '';
  }
  

  GetParentId2(id: string): string {
    let elements = this.myModel.visualElements;
    

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmFundamentalRelation) { // searches for all link elements
        let a = (<OpmFundamentalRelation>currElement).sourceLogicalElement;
        let c = (<OpmFundamentalRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmFundamentalRelation>currElement).linkType.toString();
        if ((relationtype == '12' || relationtype == '11') && a instanceof OpmLogicalProcess) {
          for (let i = 0; i < c.length; i++) {
            if (c[i].lid == id) return a.lid;
          }
        }
      }
    }
    return '';
  }

  GetParentId3(id: string): string {
    let elements = this.myModel.visualElements;
    

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmFundamentalRelation) { // searches for all link elements
        let a = (<OpmFundamentalRelation>currElement).sourceLogicalElement;
        let c = (<OpmFundamentalRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmFundamentalRelation>currElement).linkType.toString();
        if ((relationtype == '14') && a instanceof OpmLogicalObject) {
          for (let i = 0; i < c.length; i++) {
            if (c[i].lid == id) return a.lid;
          }
        }
      }
    }
    return '';
  }
  GetParentId4(id: string): string {
    let elements = this.myModel.visualElements;
    

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmProceduralRelation) { // searches for all link elements
        let a = (<OpmProceduralRelation>currElement).sourceLogicalElement;
        let c = (<OpmProceduralRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmProceduralRelation>currElement).linkType.toString();
        if (relationtype == '0' || relationtype == '1') {
          if((<OpmProceduralRelation>currElement).event && c[0].lid==id)return a.lid
        }
      }
    }
    return '';
  }
  GetParentId5(id: string): string {
    let elements = this.myModel.visualElements;
    

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmFundamentalRelation) { // searches for all link elements
        let a = (<OpmFundamentalRelation>currElement).sourceLogicalElement;
        let c = (<OpmFundamentalRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmFundamentalRelation>currElement).linkType.toString();
        if ((relationtype == '13') && a instanceof OpmLogicalObject) {
          for (let i = 0; i < c.length; i++) {
            if (c[i].lid == id) return a.lid;
          }
        }
      }
    }
    return '';
  }

  getCode(id: string): string {
    let elements = this.myModel.visualElements;
    

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmProceduralRelation) { // searches for all link elements
        let a = (<OpmProceduralRelation>currElement).sourceLogicalElement;
        let c = (<OpmProceduralRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmProceduralRelation>currElement).linkType.toString();
        if (relationtype == '1') {
          for (let i = 0; i < c.length; i++) {
            if (c[i].lid == id) return (<OpmLogicalProcess>c[i]).code.toString();
          }
        }
      }
    }
    return '';
  }

  IsStatic(id: string) {
    if (this.StaticType.get(id) != null) return;
    let temp: ThingState = this.ThingType.get(id);
    if (temp == null) return;
    let elements = this.myModel.visualElements;
    

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmFundamentalRelation) { // searches for all link elements
        let a = (<OpmFundamentalRelation>currElement).sourceLogicalElement;
        let c = (<OpmFundamentalRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmFundamentalRelation>currElement).linkType.toString();
        let multiplicity = (<OpmFundamentalRelation>currElement).visualElements[0].targetMultiplicity
        if (relationtype == '11' && a instanceof OpmLogicalProcess) {
          for (let i = 0; i < c.length; i++) {
            if (this.Access(a.lid, c[i].lid, this.GetParentId(a.lid)) == 'Static') {
              this.StaticType.set(c[i].lid, 'Static');
            }
          }
        }
        if (a instanceof OpmLogicalProcess && a.lid == id) {
          if ((relationtype == '11' || relationtype == '12')) {
            for (let i = 0; i < c.length; i++) {
              if (c[i] instanceof OpmLogicalProcess) {
                this.IsStatic(c[i].lid)
                if (this.StaticType.get(c[i].lid) == null) {
                  if (this.StaticType.has(a.lid)) {
                    this.StaticType.delete(a.lid)
                  }
                  return;
                }
                if (i == c.length - 1) this.StaticType.set(a.lid, 'Static');
                continue;
              }
              else {
                if (this.GetParentId(a.lid) == this.GetParentId(c[i].lid)) {
                  if (this.StaticType.has(a.lid)) {
                    this.StaticType.delete(a.lid)
                  }
                  return;
                }
              }
              this.StaticType.set(a.lid, 'Static');
            }
          }
        }
      }
      if (currElement instanceof OpmProceduralRelation) { // searches for all link elements
        let a = (<OpmProceduralRelation>currElement).sourceLogicalElement;
        let c = (<OpmProceduralRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmProceduralRelation>currElement).linkType.toString();
        if (a instanceof OpmLogicalProcess && a.lid == id && (relationtype=='1' || relationtype=='0')) {
          if (c[0] instanceof OpmLogicalProcess) {
            this.IsStatic(c[0].lid)
            if (this.StaticType.get(c[0].lid) == null && this.Access(a.lid, c[0].lid, this.GetParentId(a.lid)) == 'Direct') {
              if (this.StaticType.has(a.lid)) {
                this.StaticType.delete(a.lid)
              }
              return;
            }
            this.StaticType.set(a.lid, 'Static');
          }
          else {
            if (this.GetParentId(a.lid) == this.GetParentId(c[0].lid) && this.getMul(a.lid) == this.getMul(c[0].lid)) {
              if (this.StaticType.has(a.lid)) {
                this.StaticType.delete(a.lid)
              }
              return;
            }
          }
          this.StaticType.set(a.lid, 'Static');
        }
        if (c[0] instanceof OpmLogicalProcess && c[0].lid == id) {
          if (a instanceof OpmLogicalProcess) {
            this.IsStatic(a.lid)
            if (this.StaticType.get(a.lid) == null && this.getMul(a.lid) == this.getMul(c[0].lid)) {
              if (this.StaticType.has(c[0].lid)) {
                this.StaticType.delete(c[0].lid)
              }
              return;
            }
            this.StaticType.set(c[0].lid, 'Static');
          }
          else {
            if (this.GetParentId(c[0].lid) == this.GetParentId(a.lid) && this.getMul(a.lid) == this.getMul(c[0].lid)) {
              if (this.StaticType.has(c[0].lid)) {
                this.StaticType.delete(c[0].lid)
              }
              return;
            }
          }
          this.StaticType.set(c[0].lid, 'Static');
        }
      }
    }
    if (this.IsALeaf(id)) this.StaticType.set(id, 'Static');
  }

  BuildFuncAsParam(id: string): string {
    if (id == '') return ''
    let temp: ThingState = this.ThingType.get(id);
    let superFunc = this.ThingType.get(temp.superId);
    let sig = this.getSig(temp, id, superFunc)
    sig.name = '';
    sig.authorization = Authorization.notSpecefied;
    let ret = sig.toCode().replace(' ', '');
    return ret + '=>any';
  }

  getSig(temp: ThingState, id: string, superFunc: ThingState): SignatureModel {
    let params: AttributeModel[] = [];
    let mergeParams:ThingState[];
    let sig: SignatureModel;
    if (superFunc != null) {
      for (let i = 0; i < superFunc.childrenObjects.length; i++) {
        if (this.Access(id, superFunc.childrenObjects[i].id, this.GetParentId(id)) == 'Direct') continue
        if (superFunc.childrenObjects[i].type == 'ArrayClass') {
          let mulCase = superFunc.childrenObjects[i].multiplicity;
          params.push(new AttributeModel(this.changeAlias( superFunc.childrenObjects[i].name), this.excludeAlias(superFunc.childrenObjects[i].name) + '[]', Authorization.notSpecefied))
          for (let i = 0; i < mulCase.variables.length; i++) {
            if (mulCase.variables[i] != 'range'){
              params.push(new AttributeModel(mulCase.variables[i], 'number', Authorization.notSpecefied));
              this.vars.push(mulCase.variables[i])
            }
          }
        }
        if (superFunc.childrenObjects[i].type == 'ArrayParam') {
          let mulCase = superFunc.childrenObjects[i].multiplicity;
          params.push(new AttributeModel(this.changeAlias( superFunc.childrenObjects[i].name), this.excludeAlias(superFunc.childrenObjects[i].varType) + '[]', Authorization.notSpecefied))
          for (let i = 0; i < mulCase.variables.length; i++) {
            if (mulCase.variables[i] != 'range'){
              params.push(new AttributeModel(mulCase.variables[i], 'number', Authorization.notSpecefied));
              this.vars.push(mulCase.variables[i])
            }
          }
        }
        if (superFunc.childrenObjects[i].type == 'ArrayAttribute') {
          let mulCase = superFunc.childrenObjects[i].multiplicity;
          params.push(new AttributeModel(this.changeAlias( superFunc.childrenObjects[i].name), this.excludeAlias(superFunc.childrenObjects[i].varType) + '[]', Authorization.notSpecefied))
          for (let i = 0; i < mulCase.variables.length; i++) {
            if (mulCase.variables[i] != 'range'){
              params.push(new AttributeModel(mulCase.variables[i], 'number', Authorization.notSpecefied));
              this.vars.push(mulCase.variables[i])
            }
          }
        }
        if (superFunc.childrenObjects[i].type == 'required')
        params.push(new AttributeModel(this.changeAlias( superFunc.childrenObjects[i].name), this.changeAlias(superFunc.childrenObjects[i].name), Authorization.notSpecefied))
        if (superFunc.childrenObjects[i].type == 'requiredAtt' ||superFunc.childrenObjects[i].type == 'usedParam')
          params.push(new AttributeModel(this.changeAlias( superFunc.childrenObjects[i].name), this.excludeAlias(superFunc.childrenObjects[i].varType), Authorization.notSpecefied))
        if (superFunc.childrenObjects[i].type == 'function')
          params.push(new AttributeModel(this.changeAlias(superFunc.childrenObjects[i].name), this.BuildFuncAsParam(superFunc.childrenObjects[i].id), Authorization.notSpecefied));
          
          if(superFunc.childrenObjects[i].type!='stateVal') this.vars.push(this.changeAlias( superFunc.childrenObjects[i].name))      
        }
      mergeParams=superFunc.childrenObjects;
      for (let i = 0; i < superFunc.childrenProcesses.length; i++) {
        let mul = superFunc.childrenProcesses[i].multiplicity
        if (superFunc.childrenProcesses[i].type == 'ArrayFunction') {
          if(mul==null)continue;
          if (mul.key == 1) continue;
          if (mul.key == 2) {
            params.push(new AttributeModel('range', 'number', Authorization.notSpecefied));
          }
          for (let i = 0; i < mul.variables.length; i++) {
            params.push(new AttributeModel(mul.variables[i], 'number', Authorization.notSpecefied));
          }
        }
      }
    }
    
    for (let i = 0; i < temp.childrenObjects.length; i++) {
      if (this.Access(id, temp.childrenObjects[i].id, this.GetParentId(id)) == 'Direct') continue
      if (temp.childrenObjects[i].type == 'requiredClassArray') {
        let mulCase = temp.childrenObjects[i].multiplicity;
        if(mulCase==null)continue;
        params.push(new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), this.excludeAlias(temp.childrenObjects[i].name) + '[]', Authorization.notSpecefied))
        for (let i = 0; i < mulCase.variables.length; i++) {
          if (mulCase.variables[i] != 'range'){
            params.push(new AttributeModel(mulCase.variables[i], 'number', Authorization.notSpecefied));
            this.vars.push(mulCase.variables[i])
          }
        }
      }
      if (temp.childrenObjects[i].type == 'requiredAttArray') {
        let mulCase = temp.childrenObjects[i].multiplicity;
        if(mulCase==null)continue;
        params.push(new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), this.excludeAlias(temp.childrenObjects[i].varType) + '[]', Authorization.notSpecefied))
        for (let i = 0; i < mulCase.variables.length; i++) {
          if (mulCase.variables[i] != 'range'){
            params.push(new AttributeModel(mulCase.variables[i], 'number', Authorization.notSpecefied));
            this.vars.push(mulCase.variables[i])
          }
        }
      }
      if (temp.childrenObjects[i].type == 'required')
        params.push(new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), this.changeAlias(temp.childrenObjects[i].name), Authorization.notSpecefied))
      if (temp.childrenObjects[i].type == 'requiredAtt' || temp.childrenObjects[i].type == 'usedParam')
        params.push(new AttributeModel(this.changeAlias( temp.childrenObjects[i].name), temp.childrenObjects[i].varType, Authorization.notSpecefied))
      if (temp.childrenObjects[i].type == 'function')
        params.push(new AttributeModel(this.changeAlias(temp.childrenObjects[i].name), this.BuildFuncAsParam(temp.childrenObjects[i].id), Authorization.notSpecefied));
        if(temp.childrenObjects[i].type!='stateVal')this.vars.push(this.changeAlias( temp.childrenObjects[i].name))  
    }
    for (let i = 0; i < temp.childrenProcesses.length; i++) {
      let mul = temp.childrenProcesses[i].multiplicity
      
      if (temp.childrenProcesses[i].type == 'ArrayFunction') {
        if(mul==null)continue;
        if (mul.key == 1) continue;
        if (mul.key == 2) {
          params.push(new AttributeModel('range', 'number', Authorization.notSpecefied));
        }
        for (let i = 0; i < mul.variables.length; i++) {
          params.push(new AttributeModel(mul.variables[i], 'number', Authorization.notSpecefied));
        }
      }
    }
    if(mergeParams!=null)temp.childrenObjects=temp.childrenObjects.concat(mergeParams)
    if (this.StaticType.has(id)) sig = new SignatureModel(temp.name, Type.function, null, Prefix.nothing, Authorization.publicS, params);
    else sig = new SignatureModel(temp.name, Type.function, null, Prefix.nothing, Authorization.public, params);
    this.functions.push(this.changeAlias(temp.name))
    return sig;
  }

  getBlock(temp: ThingState, Parent: string, definedblock?: string, id?): string {
    if (temp.id == null) return ''
    let block: string = '';
    for (let i = 0; i < temp.childrenObjects.length; i++) {
      if (temp.childrenObjects[i].type == 'attribute') {
        if (temp.childrenObjects[i].varValue != '' && temp.childrenObjects[i].varValue + '' != 'undefined')
          block += 'let ' + this.changeAlias( temp.childrenObjects[i].name) + ':' + temp.childrenObjects[i].varType + ' = ' + temp.childrenObjects[i].varValue + ';\n';
        else
          block += 'let ' + this.changeAlias( temp.childrenObjects[i].name) + ':' + this.excludeAlias(temp.childrenObjects[i].varType) + ';\n';
      }
      if (temp.childrenObjects[i].type == 'Class') {
        block += 'let ' + this.changeAlias( temp.childrenObjects[i].name) + ':' + this.changeAlias( temp.childrenObjects[i].name) + ';\n';
      }
      if (temp.childrenObjects[i].type == 'ArrayAttribute' || temp.childrenObjects[i].type == 'ArrayClass') {
        let mul = temp.childrenObjects[i].multiplicity
        if(mul==null)continue;
        if (mul.key == 1) {
          if (temp.childrenObjects[i].varValue != '' && temp.childrenObjects[i].varValue + '' != 'undefined')
            block += 'let ' + this.changeAlias( temp.childrenObjects[i].name) + ':' + temp.childrenObjects[i].varType + ' = ' + temp.childrenObjects[i].varValue + ';\n';
          else
            block += 'let ' + this.changeAlias( temp.childrenObjects[i].name) + ':' + this.changeAlias(temp.childrenObjects[i].varType) + ';\n';
        }
        if (mul.key == 2) {
          if (temp.childrenObjects[i].varValue != '' && temp.childrenObjects[i].varValue + '' != 'undefined')
            block += 'let ' + this.changeAlias( temp.childrenObjects[i].name) + ':' + temp.childrenObjects[i].varType + '[] = ' + temp.childrenObjects[i].varValue + ';\n';
          else
            block += 'let ' + this.changeAlias( temp.childrenObjects[i].name) + ':' + temp.childrenObjects[i].varType + '[];\n';
        }
        if (mul.key == 3 || mul.key == 4) {
          if (temp.childrenObjects[i].varValue != '' && temp.childrenObjects[i].varValue + '' != 'undefined')
            block += 'let ' + this.changeAlias( temp.childrenObjects[i].name) + ':' + temp.childrenObjects[i].varType + '[' + mul.value + '] = ' + temp.childrenObjects[i].varValue + ';\n';
          else
            block += 'let ' + this.changeAlias( temp.childrenObjects[i].name) + ':' + temp.childrenObjects[i].varType + '[' + mul.value + '];\n';
        }
        if (mul.key == 5) {
          block += 'if(!(' + mul.cond + ') ){\nthrow new Error("Array length mismatch");\n}\n';
          if (temp.childrenObjects[i].varValue != '' && temp.childrenObjects[i].varValue + '' != 'undefined')
            block += 'let ' + this.changeAlias( temp.childrenObjects[i].name) + ':' + temp.childrenObjects[i].varType + '[' + mul.value + '] = ' + temp.childrenObjects[i].varValue + ';\n';
          else
            block += 'let ' + this.changeAlias( temp.childrenObjects[i].name) + ':' + temp.childrenObjects[i].varType + '[' + mul.value + '];\n';
        }
        if (mul.key == 6 || mul.key == 7) {
          block += 'if( !( ' + mul.cond + ' ) ){\nthrow new Error("Array length mismatch");\n}\n';
          if (temp.childrenObjects[i].varValue != '' && temp.childrenObjects[i].varValue + '' != 'undefined')
            block += 'let ' + this.changeAlias( temp.childrenObjects[i].name) + ':' + temp.childrenObjects[i].varType + '[range] = ' + temp.childrenObjects[i].varValue + ';\n';
          else
            block += 'let ' + this.changeAlias( temp.childrenObjects[i].name) + ':' + temp.childrenObjects[i].varType + '[range];\n';
        }
      }
      if (temp.childrenObjects[i].type == 'requiredClassArray' || temp.childrenObjects[i].type == 'requiredAttArray') {
        let staticity = this.Access(temp.id,temp.childrenObjects[i].id, Parent);
        if(staticity == 'Direct'){
          block += 'if(this.' + this.changeAlias( temp.childrenObjects[i].name) + '==null){\nthrow new Error("Missing instrument and/or agent");\n}\n';
        }
        if(staticity == 'Indirect'){
          let medium: ThingState = this.ThingType.get(this.GetParentId(temp.childrenObjects[i].id));
          block += 'if(this.' +medium.name+'.'+ this.changeAlias( temp.childrenObjects[i].name) + '==null){\nthrow new Error("Missing instrument and/or agent");\n}\n';
        }
        if(staticity == 'Given'){
          let medium: ThingState = this.ThingType.get(this.GetParentId(temp.childrenObjects[i].id));
          block += 'if(' +medium.name+'.'+ this.changeAlias( temp.childrenObjects[i].name) + '==null){\nthrow new Error("Missing instrument and/or agent");\n}\n';
        }
        if(this.getMul2(temp.childrenObjects[i].id,temp.id)==this.getMul(temp.childrenObjects[i].id,Parent)&&staticity=='Static')continue;
        if(staticity == 'NotRequired' || staticity == 'Static'){
        block += 'if(' + this.changeAlias( temp.childrenObjects[i].name) + '==null){\nthrow new Error("Missing instrument and/or agent");\n}\n';
        }
        let mul = temp.childrenObjects[i].multiplicity
        if(mul==null)continue;
        if (mul.key == 1 || mul.key == 2) {
          continue;
        }
        if (mul.key == 3 || mul.key == 4) {
          block += 'if(' + this.changeAlias( temp.childrenObjects[i].name) + '.length!=' + mul.value + '){\nthrow new Error("Array length mismatch");\n}\n';
        }
        if (mul.key == 5) {
          block += 'if(' + this.changeAlias( temp.childrenObjects[i].name) + '.length!=' + mul.value + '|| !(' + mul.cond + ') ){\nthrow new Error("Array length mismatch");\n}\n';
        }
        if (mul.key == 6 || mul.key == 7) {
          block += 'if( !( ' + mul.cond.split('range').join( this.changeAlias(temp.childrenObjects[i].name) + '.length') + ' ) ){\nthrow new Error("Array length mismatch");\n}\n';
        }
      }
      if (temp.childrenObjects[i].type == 'required' || temp.childrenObjects[i].type == 'requiredAtt'){
        let staticity = this.Access(temp.id, temp.childrenObjects[i].id, Parent);
        if(staticity == 'Direct'){
          block += 'if(this.' + this.changeAlias( temp.childrenObjects[i].name) + '==null){\nthrow new Error("Missing instrument and/or agent");\n}\n';
        }
        if(staticity == 'Indirect'){
          let medium: ThingState = this.ThingType.get(this.GetParentId(temp.childrenObjects[i].id));
          block += 'if(this.' +medium.name+'.'+ this.changeAlias( temp.childrenObjects[i].name) + '==null){\nthrow new Error("Missing instrument and/or agent");\n}\n';
        }
        if(staticity == 'Given'){
          let medium: ThingState = this.ThingType.get(this.GetParentId(temp.childrenObjects[i].id));
          block += 'if(' +medium.name+'.'+ this.changeAlias( temp.childrenObjects[i].name) + '==null){\nthrow new Error("Missing instrument and/or agent");\n}\n';
        }
        if(staticity == 'NotRequired' || staticity == 'Static'){
        block += 'if(' + this.changeAlias( temp.childrenObjects[i].name) + '==null){\nthrow new Error("Missing instrument and/or agent");\n}\n';
        }
      }
    }
    for (let i = 0; i < temp.childrenProcesses.length; i++) {
      let staticity = this.Access(temp.id, temp.childrenProcesses[i].id, Parent);

      if (temp.childrenProcesses[i].type == 'function') {
        block += this.getBlockHelper(staticity, temp, i)
      }
      else {
        let mul = temp.childrenProcesses[i].multiplicity
        if(mul==null)continue;
        if (mul.key == 1) {
          block += this.getBlockHelper(staticity, temp, i)
        }
        if (mul.key == 2) {
          let decider = 0;
          if (mul.value == '+') decider = 1;
          block += 'if(range<' + decider + '){\nthrow new Error("length mismatch");\n}\n';
          block += 'for(let i=0;i<range;i++){\n' + this.getBlockHelper(staticity, temp, i) + '\n}\n'
        }
        if (mul.key == 3 || mul.key == 4) {
          block += 'for(let i=0;i<' + mul.value + ';i++){\n' + this.getBlockHelper(staticity, temp, i) + '\n}\n'
        }
        if (mul.key == 5) {
          block += 'if(!(' + mul.cond + ')){\nthrow new Error("length mismatch");\n}\n';
          block += 'for(let i=0;i<' + mul.value + ';i++){\n' + this.getBlockHelper(staticity, temp, i) + '\n}\n'
        }
        if (mul.key == 6 || mul.key == 7) {
          block += 'if(!(' + mul.cond + ')){\nthrow new Error("length mismatch");\n}\n';
          block += 'for(let i=0;i<range;i++){\n' + this.getBlockHelper(staticity, temp, i) + '\n}\n'
        }
      }
    }
    //definedblock=definedblock.replace('undefined','')
    if (this.getCode(temp.id) == '1') {
      let params: string[] = [];
      for (let i = 0; i < temp.childrenObjects.length; i++)
        if (temp.childrenObjects[i].type == 'usedParam' || temp.childrenObjects[i].type == 'requiredAttArray') params.push(this.changeAlias(temp.childrenObjects[i].name))
      return block + ' return ' + this.predefinedToBlock(temp.block, params) + '\n'
    }
    else {
      if (typeof block === 'undefined') block = '';
      let newBlock = '' + this.ProcessUserBlock(id, definedblock);
      return block + newBlock;
    }
  }

  getBlockHelper(staticity, temp: ThingState, i) {
    let block = (temp.childrenProcesses[i].varValue + '').replace('undefined', '')
    if (staticity == 'NotRequired')
      block += this.getName(this.GetParentId(temp.id))+'.'+this.Invoke(temp.childrenProcesses[i].id, temp.id) + '\n';
    if (staticity == 'Direct')
      block += 'this.' + this.Invoke(temp.childrenProcesses[i].id, temp.id) + '\n';
    if (staticity == 'Indirect') {
      let medium: ThingState = this.ThingType.get(this.GetParentId(temp.childrenProcesses[i].id));
      block += 'this.' + medium.name.replace(" ()", '').replace(" ", "_") + '.' + this.Invoke(temp.childrenProcesses[i].id, temp.id) + '\n';
    }
    if (staticity == 'Given') {
      let medium: ThingState = this.ThingType.get(this.GetParentId4(temp.childrenProcesses[i].id));
      block += medium.name.replace(" ()", '').replace(" ", "_") + '.' + this.Invoke(temp.childrenProcesses[i].id, temp.id) + '\n';
    }
    if (staticity == 'Static') {
      let par = this.GetParentId(temp.childrenProcesses[i].id);
      if (par == '') block += this.Invoke(temp.childrenProcesses[i].id, temp.id) + '\n';
      else {
        let medium: ThingState = this.ThingType.get(this.GetParentId(temp.childrenProcesses[i].id));
        block += this.changeAlias( medium.name.replace(" ()", '')) + '.' + this.Invoke(temp.childrenProcesses[i].id, temp.id) + '\n';
      }
    }
    return block
  }

  BuildExistingFunction(id: string, Parent: string, definedblock?: string): FunctionModel {
    let func: FunctionModel;
    let sig: SignatureModel;
    let block: string;
    let superSig:SignatureModel;
    let temp: ThingState = this.ThingType.get(id);
    temp.childrenProcesses.sort((a, b) => (this.processes.indexOf(a.id) > this.processes.indexOf(b.id)) ? 1 : -1)
    let superFunc:ThingState = this.ThingType.get(temp.superId);
    this.IsStatic(id);
    if (temp == null) { alert('null function'); return; }
    sig = this.getSig(temp, id, superFunc);
    block=''
    let override:boolean=this.check_for_supercall(temp);
    if(override){
      superSig=this.getSig(temp, id, superFunc);
      superSig.authorization=Authorization.notSpecefied;
      let superCall=superSig.toCode().replace(' ','');
      let superBlock='super.'+superCall+';\n'
      block+=superBlock;
    }
// if (temp.superId != null && temp.superId != '' && this.IsProcess(temp.superId)) block += this.getBlock(superFunc, Parent,'',temp.superId);
    block += this.getBlock(temp, Parent, definedblock + '\n', id);
    
    func = new FunctionModel(sig, block);
    return func;
  }
  check_for_supercall(temp:ThingState):boolean{
    let elements = this.myModel.visualElements;
    

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmProceduralRelation) { // searches for all link elements
        let a = (<OpmProceduralRelation>currElement).sourceLogicalElement;
        let c = (<OpmProceduralRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmProceduralRelation>currElement).linkType.toString();
        if (relationtype == '5') {
          if(a.lid==temp.id && a instanceof OpmLogicalProcess){
            if((<OpmLogicalProcess>a).text==(<OpmLogicalProcess>c[0]).text){
              let apar:ThingState=this.ThingType.get(this.GetParentId(a.lid));
              let cpar:ThingState=this.ThingType.get(this.GetParentId(c[0].lid));
              if(apar==null || cpar==null || apar+''=='undefined' || cpar+''=='undefined')return false;
              if(cpar.id==apar.superId){
                for(let j=0;j<temp.childrenProcesses.length;j++){
                  if(temp.childrenProcesses[j].id==c[0].lid){temp.childrenProcesses.forEach((element,index)=>{if(index==j) temp.childrenProcesses.splice(index,1);});return true;}
                }
              }
            }
          }
        }
      }
    }
    return false;
  }

  IsProcess(id:string){
    let elements = this.myModel.visualElements;
    
    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmLogicalProcess) { 
        if(currElement.lid==id)return true;
      }
    }
    return false;
  }

  changeAlias(name) {
    let res;
    if(name==null)return;
    let unitlessName = name.split(/ [[a-zA-Z0-9/]+] /gm)
    if (unitlessName[1] == null) {
      let temp = unitlessName[0].split('{');
      if (temp[1] != '' && temp[1] != null) {
        res = temp[1].substring(0, temp[1].length - 1);
        if (res == '') res = name.split(/ [[a-zA-Z]+] /gm)[0]
        return res.replace(' ', '_');
      }
      else return unitlessName[0].replace(' ', '_');
    }
    let temp = unitlessName[1].split('{');
    if (temp[1] != '' && temp[1] != null) {
      res = temp[1].substring(0, temp[1].length - 1);
      if (res == '') res = name.split(/ [[a-zA-Z]+] /gm)[0]
    }
    return res.replace(' ', '_');
  }

  excludeAlias(name) {
    let unitlessName = name.split(/ [[a-zA-Z]+] /gm).join('')
    let temp:string = unitlessName.split('{')[0];
    return temp.trim().replace(' ', '_');
  }

  getVarType(unit: string): string {
    var units: Array<string> = ['cm', 'm', 'mm', 'km', 'in', 'yd', 'ft', 'mi', 'mm2', 'cm2', 'm2', 'ha', 'km2', 'in2', 'yd2', 'ft2', 'ac', 'mi2', 'mcg', 'mg', 'g', 'kg', 'mt', 'oz', 'lb', 't', 'mm3', 'cm3', 'ml', 'cl', 'dl', 'l', 'kl', 'm3', 'km3', 'krm', 'tsk', 'msk', 'kkp', 'glas', 'kanna', 'tsp', 'Tbs', 'in3', 'cup', 'pnt', 'qt', 'gal', 'ft3', 'yd3', 'ea', 'dz', 'C', 'K', 'F', 'R', 'ns', 'mu', 'ms', 's', 'min', 'h', 'd', 'week', 'month', 'year', 'b', 'Kb', 'Mb', 'Gb', 'Tb', 'B', 'KB', 'MB', 'GB', 'TB', 'ppm', 'ppb', 'ppt', 'ppq', 'm/s', 'km/h', 'm/h', 'knot', 'ft/s', 'min/km', 's/m', 'min/mi', 's/ft', 'Pa', 'kPa', 'MPa', 'hPa', 'bar', 'torr', 'psi', 'ksi', 'A', 'mA', 'kA', 'V', 'mV', 'kV', 'W', 'mW', 'kW', 'MW', 'GW', 'VAR', 'mVAR', 'kVAR', 'MVAR', 'GVAR', 'VA', 'mVA', 'kVA', 'MVA', 'GVA', 'Wh', 'mWh', 'kWh', 'MWh', 'GWh', 'J', 'kJ', 'VARh', 'mVARh', 'kVARh', 'MVARh', 'GVARh', 'mm3/s', 'cm3/s', 'ml/s', 'cl/s', 'dl/s', 'l/s', 'l/min', 'l/h', 'kl/s', 'kl/min', 'kl/h', 'm3/s', 'm3/min', 'm3/h', 'km3/s', 'tsp/s', 'Tbs/s', 'in3/s', 'in3/min', 'in3/h', 'cup/s', 'pnt/s', 'pnt/min', 'pnt/h', 'qt/s', 'gal/s', 'gal/min', 'gal/h', 'ft3/s', 'ft3/min', 'ft3/h', 'yd3/s', 'yd3/min', 'yd3/h', 'lx', 'mHz', 'Hz', 'kHz', 'MHz', 'GHz', 'THz', 'rpm', 'deg/s', 'rad/s', 'rad', 'deg', 'grad', 'arcmin', 'arcsec', 'number', 'int', 'float', 'decimal', 'numeric', 'fraction'];
    if (units.includes(unit.toLowerCase())) return 'number';
    if (unit.toLowerCase() == 'boolean' || unit.toLowerCase() == 'bool') return 'boolean';
    return 'string'
  }

  getMultiplicity(exp: string) {//Translates multiplicity to condition/value and paramaters
    let res = <{ key: number, cond: string, variables: string[], value: string }>new Object();
    res.cond = ''
    res.variables = new Array()
    if (exp == '' || exp == 'undefined') {
      res.key = 1;
      res.cond = '';
      res.variables = [];
      return res;
    }
    if (exp == '*' || exp == '+') {
      res.key = 2;
      res.cond = '';
      res.variables = [];
      res.value = exp;
      return res;
    }
    if (/^([ 0-9]+)$/.test(exp)) {
      res.key = 3;
      res.cond = '';
      res.variables = [];
      res.value = exp;
      return res;
    }
    if (/^([ 0-9]*\*[ a-zA-z]*)$/.test(exp)) {
      res.key = 4;
      res.cond = '';
      res.variables.push(exp.replace(/[0-9]*\*/g, '').replace(' ', ''))
      res.value = exp
      return res;
    }
    if (/^([ 0-9*a-zA-Z]+;[ >=<*0-9a-zA-Z]+)$/g.test(exp)) {
      res.key = 5;
      let temp = exp.split(';');
      let exper = this.getMultiplicity(temp[0]);
      res.variables.push(exper.variables[0])
      res.cond = '('+temp[1]+' && range=='+exper.value+')'
      res.value = exper.value
      return res;
    }
    if (/^([ ><=*;0-9a-zA-z]+\.\.[ ><=;*0-9a-zA-Z]+)$/.test(exp)) {
      res.key = 6;
      let temp = exp.split('..');
      let exp1 = this.getMultiplicity(temp[0]);
      let exp2 = this.getMultiplicity(temp[1]);
      if (exp1.key == 5) {
        // res.variables.push('range')
        res.value = 'range'
        res.variables = res.variables.concat(exp1.variables)
        res.cond = exp1.cond + ' && (range>=' + exp1.value

        if (exp2.key == 5) {
          res.cond += ' && range<=' + exp2.value + ') && ' + exp2.cond
          res.variables = res.variables.concat(exp2.variables)
        }
        if (exp2.key == 4) {
          res.cond += ' && range<=' + exp2.value + ')'
          res.variables.push(exp2.variables[0])
        }
        if (exp2.key == 3) res.cond += ' && range<=' + exp2.value + ')'

      }
      if (exp1.key == 4) {
        // res.variables.push('range')
        res.value = 'range'
        res.variables.push(exp1.variables[0])
        res.cond = ' (range>=' + exp1.value

        if (exp2.key == 5) {
          res.cond += ' && range<=' + exp2.value + ') && ' + exp2.cond
          res.variables = res.variables.concat(exp2.variables)
        }
        if (exp2.key == 4) {
          res.cond += ' && range<=' + exp2.value + ')'
          res.variables.push(exp2.variables[0])
        }
        if (exp2.key == 3) res.cond += ' && range<=' + exp2.value + ')'

      }
      if (exp1.key == 3) {
        // res.variables.push('range')
        res.value = 'range'
        res.cond = ' (range>=' + exp1.value

        if (exp2.key == 5) {
          res.cond += ' && range<=' + exp2.value + ') && ' + exp2.cond
          res.variables = res.variables.concat(exp2.variables)
        }
        if (exp2.key == 4) {
          res.cond += ' && range<=' + exp2.value + ')'
          res.variables.push(exp2.variables[0])
        }
        if (exp2.key == 3) res.cond += ' && range<=' + exp2.value + ')'

      }
      res.variables = res.variables.filter((value, index, self) => {
        return self.indexOf(value) === index;
      })
      return res;
    }
    if (/.+[,]{1}.+/g.test(exp)) {
      res.key = 6;
      let temp = exp.split(',')
      for (let i = 0; i < temp.length; i++) {
        let exper = this.getMultiplicity(temp[i]);
        if (exper.cond == '' && exper.value == '') continue;
        if (exper.cond == '') {
          if (i == 0) res.cond += ' range==' + exper.value
          if (i > 0) res.cond += ' || range==' + exper.value
        }
        else {
          if (i == 0) res.cond += exper.cond
          if (i > 0) res.cond += ' || ' + exper.cond
        }
        res.value = 'range'
        res.variables = res.variables.concat(exper.variables)
      }
      res.variables = res.variables.filter((value, index, self) => {
        return self.indexOf(value) === index;
      })
      return res
    }
  }

  predefinedToBlock(block: string, params: string[]): string {
    let type = this.translateBlock(block)
    if (type == 'Unknown') {
      if (block == 'Dividing') {
        let last = params.pop()
        return this.div(params, last)
      }
      if (block == 'Average') return this.div(params, (params.length).toString())
      let sign = '';
      if (block == 'Adding') sign = ' + '
      if (block == 'Subtracting') sign = ' - '
      if (block == 'Multiplying') sign = ' * '
      if (block == 'Concat') sign = '.toString() + '
      let res = ''
      for (let i = 0; i < params.length; i++) {
        if (i == params.length - 1) res += params[i]
        else res += params[i] + sign
      }
      if (block == 'Concat') return res += '.toString();'
      return res + ' ;'
    }
    else {
      if (block == 'Exponent') return type + params[0]
      let res = type + '(';
      for (let i = 0; i < params.length; i++) {
        if (i == params.length - 1) res += params[i]
        else res += params[i] + ', '
      }
      return res + ');';
    }
  }

  translateBlock(block: string) {
    switch (block) {
      case 'Abs':
        return 'Math.abs'
      case 'Cos':
        return 'Math.cos'
      case 'Power':
        return 'Math.pow'
      case 'Log':
        return 'Math.log'
      case 'Max':
        return 'Math.max'
      case 'Min':
        return 'Math.min'
      case 'Sin':
        return 'Math.sin'
      case 'Sqrt':
        return 'Math.sqrt'
      case 'Tan':
        return 'Math.tan'
      case 'Round':
        return 'Math.round'
      case 'Exponent':
        return '2**'
      default:
        return 'Unknown'
    }
  }

  div(num: string[], denom: string) {
    let res = '('
    for (let i = 0; i < num.length; i++) {
      if (i == num.length - 1) res += num[i]
      else res += num[i] + ' + '
    }
    return res + ')/' + denom
  }

  ProcessUserBlock(id, block) {
    let temp: ThingState = this.ThingType.get(id)
    block += ''
    block = block.replace('undefined', '')
    if (block == '\n') return '\n'
    block = block.split('Return').join('return')
    for (let i = 0; i < temp.childrenObjects.length; i++) {
      let stats = this.Access(id, temp.childrenObjects[i].id, this.GetParentId(id))
      let prefix = '';
      if (stats == 'Direct') prefix = 'this.'
      if (stats == 'Given') prefix = 'this.' + this.changeAlias( this.ThingType.get(this.GetParentId(temp.childrenObjects[i].id)).name) + '.'
      let varName = this.changeAlias( temp.childrenObjects[i].name)
      let lastvarName=''
      if(i!=0)lastvarName = this.changeAlias( temp.childrenObjects[i-1].name)
      if (temp.childrenObjects[i].type == 'return' || temp.childrenObjects[i].type == 'returnClass') {
        let str: string[] = block.match(/return([ a-zA-z._0-9+\-*/()])+[ ;\\n]*/g)
        if(str!=null){
          let split = block.split('return')
          for (let i = 0; i < str.length; i++) {
            split[i] = split[i] + str[i].replace('return', prefix + varName + ' = ') + '\n'
          }
          block = split.join('return')
          continue;
        }
      }
      if(varName!=lastvarName){
        let regex = '\\b' + varName + '\\b'
        var re = new RegExp(regex, "g");
        block = block.split(re).join(prefix + varName)
      }
    }
    
    let lines:string[] = block.split('\n');
    for(let i=0;i<lines.length;i++){
      let str: string[] = lines[i].match(/updateValue\(\'[(a-zA-z._0-9)]+\',[\'a-zA-z._\-\*\+0-9]+,aliasArr\);/g)
      if(str!=null){
        lines[i]=lines[i].replace('updateValue(\'','');
        lines[i]=lines[i].replace(',aliasArr)','');
        lines[i]=lines[i].replace('\',','=');
      }

    }
    block=lines.join('\n')
    // let st: string[] = block.match(/return([ a-zA-z._0-9+\-/()])+[ ;\\n]/g)
    // if (str != null) {
    //   for (let i = 0; i < str.length; i++) {
    //     if (st != null) {
    //       //if there is return
    //       block = block.replace(str[i], '');
    //     } else {
    //       let x = str[i].split(',');
    //       let a = x[0].split('(')[1];
    //       let b = x[1].split(')')[0];
    //       block = block.replace(str[i], (a + '=' + b));
    //     }
    //   }
    // }
    return block;
  }

  GetEnumType(id: string) {
    let elements = this.myModel.visualElements;

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmFundamentalRelation) { // searches for all link elements
        let a = (<OpmFundamentalRelation>currElement).sourceLogicalElement;
        let c = (<OpmFundamentalRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmFundamentalRelation>currElement).linkType.toString();
        if ((relationtype == '12' || relationtype == '11') && a instanceof OpmLogicalObject) {
          if (a.lid == id) return 'Class'
          for (let i = 0; i < c.length; i++) {
            if (c[i].lid == id) return 'attribute';
          }
        }
      }
    }
    return 'variable';
  }

  CheckConditional(id: string) {
    let elements = this.myModel.visualElements;

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;
      if (currElement instanceof OpmProceduralRelation) {
        if ((<OpmProceduralRelation>currElement).targetLogicalElements[0].lid == id) {
          return (<OpmProceduralRelation>currElement).condition;
        }
      }
    }
  }

  Invoke(id: string, tempParentid: string): string {
    let temp: ThingState = this.ThingType.get(id)
    if (temp === undefined) return ''
    let value = this.changeAlias((temp.name + '').replace(' ()', ''))
    let param = this.BuildFuncAsParam(temp.id)
    let params=param.split(/[:]{1}[a-zA-Z: ,_0-9()=> ]+?[,]{1}/g).join(',')
    params=params.split(/[:]{1}[a-zA-Z:0-9 ,_()=> ]+?[)]{1}/g).join(' )')
    params=params.replace('=>any', '')
    for (let i = 0; i < temp.childrenObjects.length; i++) {
      if (temp.childrenObjects[i].varValue != '' && temp.childrenObjects[i].varValue + '' != 'undefined' && temp.childrenObjects[i].varValue + '' != 'null' && !this.SharedParent(temp.id, tempParentid, temp.childrenObjects[i].id)) {
        params = params.replace(this.changeAlias(temp.childrenObjects[i].name), temp.childrenObjects[i].varValue)
      }
    }
    return value + params+';';
  }

  SharedParent(id1: string, id2: string, id3: string) {
    if (id2 == '') return false
    let par1 = this.IsParam(id1, id3)
    let par2 = this.IsParam(id2, id3)
    return par1 && par2;
  }

  getMul(id: string, parent?:string):string {
    let elements = this.myModel.visualElements;
    
    let mul = '';

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmFundamentalRelation) { // searches for all link elements
        let a = (<OpmFundamentalRelation>currElement).sourceLogicalElement;
        let c = (<OpmFundamentalRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmFundamentalRelation>currElement).linkType.toString();
        if ((relationtype == '11' || relationtype == '12')&&a.lid==parent) {
          for (let i = 0; i < c.length; i++) {
            if (c[i].lid == id && (<OpmFundamentalRelation>currElement).visualElements[0].targetMultiplicity + '' != 'undefined' && (<OpmFundamentalRelation>currElement).visualElements[0].targetMultiplicity != null) mul = (<OpmFundamentalRelation>currElement).visualElements[0].targetMultiplicity + ''
          }
        }
      }
    }
    return mul
  }
  getMul2(id: string, parent?:string):string {
    let elements = this.myModel.visualElements;
    
    let mul = '';

    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;
      if (currElement instanceof OpmProceduralRelation) { // searches for all link elements
        let a = (<OpmProceduralRelation>currElement).sourceLogicalElement;
        let c = (<OpmProceduralRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmProceduralRelation>currElement).linkType.toString();
        if ((relationtype == '0' || relationtype == '1')&&c[0].lid==parent) {
          if (a.lid == id && (<OpmProceduralRelation>currElement).visualElements[0].sourceMultiplicity + '' != 'undefined' && (<OpmProceduralRelation>currElement).visualElements[0].sourceMultiplicity != null) mul = (<OpmProceduralRelation>currElement).visualElements[0].sourceMultiplicity + ''
        }
      }
    }
  return mul
  }

  MakeObjectParams(id:string):AttributeModel[]{
    let temp:ThingState = this.ThingType.get(id);
    let res =[]
    if(temp==null)return res;
    for(let j=0;j<temp.childrenObjects.length;j++){
      let att:AttributeModel;
      if(this.IsInstance(temp.childrenObjects[j].id)) {
        let tempe:ThingState =this.ThingType.get(temp.childrenObjects[j].id);
        if(tempe==null)alert('object not initiated')
        else att=new ObjectModel(this.changeAlias(temp.childrenObjects[j].name),this.changeAlias(tempe.superName),Authorization.notSpecefied,this.MakeObjectParams(temp.childrenObjects[j].id));
      }
      else {
        if(temp.childrenObjects[j].childrenObjects[0]!=null)att=new AttributeModel(this.changeAlias(temp.childrenObjects[j].name),this.changeAlias(temp.childrenObjects[j].name.toLowerCase()),Authorization.notSpecefied,temp.childrenObjects[j].childrenObjects[0].name);
        else att=new AttributeModel(this.changeAlias(temp.childrenObjects[j].name),this.changeAlias(temp.childrenObjects[j].varType),Authorization.notSpecefied,temp.childrenObjects[j].varValue);
      }
      res.push(att);
    }
    return res;
  }

  getInstanceHeirarchy(name:string){
    if(this.instanceType.has(name))return this.instanceType.get(name)

    let elements = this.myModel.visualElements;
    
    for (let i = 0; i < elements.length; i++) {
      let currElement = elements[i].logicalElement;

      if (currElement instanceof OpmFundamentalRelation) { // searches for all link elements
        let a = (<OpmFundamentalRelation>currElement).sourceLogicalElement;
        let c = (<OpmFundamentalRelation>currElement).targetLogicalElements;
        let relationtype = (<OpmFundamentalRelation>currElement).linkType.toString();
        if (relationtype == '11') {
          for(let j=0;j<c.length;j++){
            if(this.changeAlias((<OpmLogicalObject>c[j]).text)==name) {
              this.instanceType.set(name,this.getInstanceHeirarchy(this.changeAlias((<OpmLogicalObject>a).text))+1)
              return;
            }
          }
        }
      }
    }
    this.instanceType.set(name,0)
  }
}