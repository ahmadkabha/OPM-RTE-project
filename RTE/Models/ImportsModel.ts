export class Import{
    imp:string;
    location:string;
    constructor(imp:string,location:string){
        this.imp=imp;
        this.location=location;
    }
    toCode(){
        return 'import { '+this.imp+' } from "./'+this.location+'";\n';
    }

}