import { Class1 } from "./module1";
//import math = require("mathjs");

class Class2 {
    constructor(){
        let t: Class1 = new Class1("test");
        console.log(t.WhoAreYou());

        let fraction: any = math.fraction(1,4);
    }
}
