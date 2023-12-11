import { Prefix } from './../Enums';

export class Enum{
    name:string;
    prefix:Prefix;
    states:string[]=[];
    constructor(name:string, prefix:Prefix,states:string[]){
        this.name=name.replace(" ", "_");
        this.prefix=prefix;
        this.states=states;
    }
    toCode(){
        let res='';
        res += this.prefix + ' enum ' + this.name + ' {\n';
        for(let i=0;i<this.states.length;i++){
            if(i==this.states.length-1) res+=this.states[i]+'="'+this.states[i]+'"';
            else res+=this.states[i]+'="'+this.states[i]+'",';
        }
        res =res.split(',').join(',\n')
        return res+'\n}';
    }
}