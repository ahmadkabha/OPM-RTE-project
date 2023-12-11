
import { AttributeModel } from './AttributeModel';
import { SignatureModel } from './SignatureModel';
export class FunctionModel{
    signature:SignatureModel;
    block:string;
    params:AttributeModel[];
    alone:boolean=false;
    constructor(signature:SignatureModel,block?:string,alone?:boolean){
        this.signature=signature;
        this.block=block.split('\n').join('\n  ');
        this.params=signature.params;
        this.alone=alone;
    }
    toCode(){
        this.signature.params=this.params;
       let res = this.signature.toCode() +'{\n';
       if(this.block!=null)res+=' ' + this.block + '}\n';
       else res+='}';
       //if(this.signature.authorization==Authorization.publicS)return res.split(/\n /g).join('\n').replace(' }','}');
       return res.replace('  }','}');
    }
    addParams(att:AttributeModel):void{
        let tempParams:AttributeModel[];
        if(this.params!=null){
            tempParams =  new Array(this.params.length+1);
            let i:number;
            for(i=0;i<this.params.length;i++){
                tempParams[i]=this.params[i];
            }
            tempParams[i]=att;
        }
        else{
            tempParams = new Array(1);
            tempParams[0]=att;
        }
        this.params=tempParams;
    }

    addBlock(block:string):void{
        if(this.block==null){
            this.block=block
        }
        else{
            this.block+=block;
        }
    }
}