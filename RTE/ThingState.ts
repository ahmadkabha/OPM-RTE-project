
export class ThingState {
    id?:string;
    name:string;
    type?:string;
    childrenObjects?:ThingState[]=[];
    childrenProcesses?:ThingState[]=[];
    superId?:string; 
    superName?:string;
    block?:string;
    varType?:string;
    varValue?:string;
    multiplicity?:{ key: number, cond: string, variables: string[], value: string };
    constructor(name:string,type:string,id:string,block?:string,varType?:string,varValue?:string,mul?:{ key: number, cond: string, variables: string[], value: string }){
        this.name=name;
        this.type=type;
        this.id=id;
        this.block=block;
        this.varType=varType;
        this.varValue=varValue;
        this.multiplicity=mul
    }

}