import { AttributeModel } from './AttributeModel';
import { Type } from '../Enums';
import { Authorization } from '../Enums';

export class ObjectModel extends AttributeModel{
    protected params:AttributeModel[];
    protected groups;

    constructor(name:string , type:string, authorization:Authorization,params?:AttributeModel[]){
        super(name,type,authorization,null)
        this.params=params;
        this.groups=new Map();
    }
    toCode():string{
        this.checkMultiplicity();
        let x=super.toCode().replace(';','');
        x+= ' = new '+this.type+' ({'
        let leng = ''
        for(let i=0;i<x.length;i++)leng+=' '
        x+='\n'+leng
        if(this.params!=null){
            for(let i=0;i<this.params.length;i++){
                if(!(this.params[i] instanceof ObjectModel)){
                    let arr = this.groups.get(this.params[i].name)
                    if(arr==null)continue
                    if(arr.length>1) {
                        x+=this.params[i].name+':'
                        x+=this.printArr(arr)+',';
                    }
                    else x+=arr[0]
                    this.groups.set(this.params[i].name,null)
                }
                else{
                    let arr = this.groups.get(this.params[i].type)
                    if(arr==null)continue
                    if(arr.length>1) {
                        x+=this.params[i].type+':\n'+leng
                        x+=this.printArr(arr)+',';
                    }
                    else x+=arr[0]
                    this.groups.set(this.params[i].type,null)
                }
            }
            x=x.substr(0,x.length-1)+'\n  '+leng+'});'
        }
        else x+='});'
        return x.split(',').join(',\n'+leng);
    }
    checkMultiplicity(){
        for(let i=0;i<this.params.length;i++){
            if(!(this.params[i] instanceof ObjectModel)){
                if(this.groups.has(this.params[i].name)){
                    let arr = this.groups.get(this.params[i].name)
                    arr.push(' '+this.params[i].name+':'+this.params[i].toCode().replace(';',',').split('=')[1])
                    this.groups.set(this.params[i].name,arr)
                }
                else{
                    let arr = new Array();
                    arr.push(' '+this.params[i].name+':'+this.params[i].toCode().replace(';',',').split('=')[1])
                    this.groups.set(this.params[i].name,arr)
                }
            }
            else{
                if(this.groups.has(this.params[i].type)){
                    let arr = this.groups.get(this.params[i].type)
                    arr.push(' '+this.params[i].type+':'+this.params[i].name)
                    this.groups.set(this.params[i].type,arr)
                }
                else{
                    let arr = new Array();
                    arr.push(' '+this.params[i].type+':'+this.params[i].name)
                    this.groups.set(this.params[i].type,arr)
                }
            }
        }
    }
    printArr(arr:any[]){
        let res='['
        for(let i=0;i<arr.length;i++){
            if(i==arr.length-1)res+=arr[i].split(':')[1]
            else res+=arr[i].split(':')[1]+', '
        }
        return res+'] '
    }
}