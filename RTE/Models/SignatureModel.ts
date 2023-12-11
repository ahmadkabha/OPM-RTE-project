import { AttributeModel } from './AttributeModel';
import { Type } from '../Enums';
import { Authorization } from '../Enums';
import { Prefix } from '../Enums';
export class SignatureModel{
    prefix:Prefix;
    authorization:Authorization;
    type:Type;
    name:string;
    params:AttributeModel[]=[];
    returnVal:string;
    superClass:string;
    constructor(name:string, type:Type,superclass:string, prefix?:Prefix, authorization?:Authorization, params?:AttributeModel[],returnVal?:string){
        this.name=name.replace(" ()",'').replace(" ", "_");
        this.type=type
        this.prefix=prefix;
        this.authorization=authorization;
        this.params=params;
        this.returnVal=returnVal;
        this.superClass=superclass;
    }
    changeAlias(){
        let temp = this.name.split('{');
        if(temp[1]!='' && temp[1]!=null){
            this.name=temp[1].substring(0,temp[1].length-1);
        }    
    }
    toCode(){
        this.changeAlias();
        let res ='';
        if(this.prefix!=null && this.prefix!=Prefix.nothing)res += this.prefix + ' ';
        if(this.authorization!=null && this.authorization!=Authorization.notSpecefied && (this.type==Type.class || this.type==Type.function))res += this.authorization;
        if(this.authorization!=null && this.authorization!=Authorization.notSpecefied && (this.type!=Type.class && this.type!=Type.function))res += this.authorization+' ';
        res += this.type + ' ' + this.name;
        if(this.type==Type.class){
            if(this.superClass!=null) res = res + ' extends ' + this.superClass;
            return res;
        }
        else{
            res += '('
            if(this.params!=null){
                for(let i=0;i<this.params.length;i++){
                    if(i<this.params.length-1) res += ' '+this.params[i].toCode().split('=')[0].replace(';','') + ',';
                    else res+= ' '+this.params[i].toCode().split('=')[0].replace(';',' ');
                }
            }
            if(this.returnVal!=null) return res + '):' + this.returnVal.replace(" ", "_");
            else    return res + ')';
            }
        }
    }