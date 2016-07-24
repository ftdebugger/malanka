import {Document} from 'camo';

export class Task extends Document {

    constructor() {
        super();

        this.title = String;
        this.list = String;
        this.done = Boolean;
    }

}