import { AttributeModel } from "./AttributeModel";
import { ConstructorModel } from "./ConstructorModel";
import { FunctionModel } from "./FunctionModel";
import { SignatureModel } from "./SignatureModel";
import { Enum } from "./StateEnums";
import {Import} from "./ImportsModel";

export class ClassFile {
    signature: SignatureModel;
    attributes: AttributeModel[];
    functions: FunctionModel[];
    constructors: ConstructorModel;
    enums:Enum[];
    lid:string;
    imports:Import[];

    constructor( lid:string,signature:SignatureModel, attributes?:AttributeModel[], constructors?:ConstructorModel, functions?:FunctionModel[], Enum?:Enum[],Imports?:Import[])
    {
        this.signature=signature;
        this.attributes=attributes;
        this.constructors=constructors;
        this.functions=functions;
        this.lid=lid;
        this.enums=Enum;
        this.imports=Imports;
    }

    toCode(){
        let res='';
        if(this.imports+''!='undefined' && this.imports!=null){
            for(let i=0; i<this.imports.length;i++){
                if(this.imports[i]==null || this.imports[i]+''=='undefined')continue
                res+=this.imports[i].toCode();
            }
        }
        
        if(this.enums+''!='undefined' &&this.enums!=null){
            for(let i=0;i<this.enums.length;i++){
                res+=this.enums[i].toCode() + '\n';
            }
        }
        res += this.signature.toCode();
        res+='{\n'
        if(this.attributes!=null){
            for(let i=0;i<this.attributes.length;i++){
                if(this.attributes[i]==null)continue;
                res +=(this.attributes[i].toCode()).replace('protected ','protected _') + '\n';
            }
        }
        res+='\n';
        if(this.signature.superClass!=null)this.constructors.par=true;
        if(this.constructors!=null)res +=this.constructors.toCode() + '\n\n';
        if(this.functions!=null)for(let i=0;i<this.functions.length;i++)res +=this.functions[i].toCode() + '\n\n';
        return res + '}';
    }

    addAttribute(att:AttributeModel):void{
        let tempAttributes:AttributeModel[];
        if(this.attributes!=null){
        tempAttributes =  new Array(this.attributes.length+1);
        let i:number;
        for(i=0;i<this.attributes.length;i++){
            tempAttributes[i]=this.attributes[i];
        }
        tempAttributes[i]=att;
        }
        else{
            tempAttributes = new Array(1);
            tempAttributes[0]=att;
        }
        this.attributes=tempAttributes;
    }

    addFunc(att:FunctionModel):void{
        let tempAttributes:FunctionModel[];
        if(this.functions!=null){
        tempAttributes =  new Array(this.functions.length+1);
        let i:number;
        for(i=0;i<this.functions.length;i++){
            tempAttributes[i]=this.functions[i];
        }
        tempAttributes[i]=att;
        }
        else{
            tempAttributes = new Array(1);
            tempAttributes[0]=att;
        }
        this.functions=tempAttributes;
    }
    
}