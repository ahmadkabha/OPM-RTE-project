import { AttributeModel } from "./AttributeModel";
import { ObjectModel } from "./ObjectModel";

export class ConstructorModel{
    parameters:AttributeModel[];
    block:string;
    name:string;
    par:boolean
    constructor(parameters?:AttributeModel[],name?:string,block?:string,par?:boolean){
        this.parameters=parameters;
        this.block=block;
        this.name=name;
        this.par=par
    }
    toCode(){
       let res:string = 'constructor(init?:Partial<'+this.name+'>'
       for(let i=0;i<this.parameters.length;i++){
           res+=','+this.parameters[i].name+':number'
       }
       let x=''
       if(this.par)x+='super();\n'
       x+='Object.assign(this, init);\n'
       return res +'){\n'+x + this.block + '}\n';
    }
    addParams(x:AttributeModel[]){
     if(this.parameters==null)this.parameters=[]
     this.parameters.concat(x);
    }
}