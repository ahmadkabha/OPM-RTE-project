import { Type } from '../Enums';
import { Authorization } from '../Enums';

export class AttributeModel{
    name:string;
    type:string;
    authorization:Authorization;
    value:string;
    constructor(name:string , type:string, authorization:Authorization,value?:string){
        this.name=name.replace(" ", "_").replace("@", " ");
        this.type=type;
        this.authorization=authorization;
        this.value=value;
    }
    toCode(){
        let res='';
        if(this.authorization!=null && this.authorization!=Authorization.notSpecefied)res+= this.authorization +' '
        res+=this.name;
        if(this.type!='')res+=':'+this.type;
        if(this.value!=null){
            if( this.type=='number' || this.type=='any' || this.type=='boolean') return res + ' = '+this.value+';';
            if(this.type=='string')return res + ' = "'+this.value+'";';
            return res + ' = '+this.type+'.'+this.value+';';
        }
        return res + ';';
    }
}