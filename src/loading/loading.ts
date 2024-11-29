import "./loading.css";

export class Loading {
    el?: HTMLDivElement;

    constructor() {
        this.create();
    }

    create() {
        this.el = document.createElement("div");
        this.el.classList.add("loader");
        document.body.append(this.el);
    }

    show() {
        this.el!.style.display = "grid";
    }
    
    hide() {
        this.el!.style.display = "none";
    }
}