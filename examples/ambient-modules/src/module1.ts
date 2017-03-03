export class Class1 {
    constructor(name: string){
        this.name = name;
    }

    private name: string;

    public WhoAreYou(): string {
        return this.name;
    }
}