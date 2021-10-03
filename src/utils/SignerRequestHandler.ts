import { EventEmitter } from "events";

export type SignatureRequest = {
    fn: () => Promise<any>;
    message: string;
    data?: Record<string, string>;
};

export class SignatureRequestHandler {
    private events = new EventEmitter();

    public on(event: string, listener: any): void {
        this.events.on(event, listener);
    }
    public once(event: string, listener: any): void {
        this.events.once(event, listener);
    }
    public removeListener(event: string, listener: any): void {
        this.events.removeListener(event, listener);
    }
    public off(event: string, listener: any): void {
        this.events.off(event, listener);
    }
    public add(signatureRequestFunctions: SignatureRequest[]) {
        this.events.emit("onRequests", [signatureRequestFunctions]);
    }

    public done(result: any[]) {
        console.log("SignatureRequestHandler done()", result);
        this.events.emit("done", result);
    }

    handleDone(resolve: () => void) {
        resolve();
        this.events.removeListener("done", this.handleDone);
        this.clear();
    }

    async results() {
        return new Promise((resolve, reject) => {
            this.events.on("done", (event) => this.handleDone(() => resolve(event)));
        });
    }

    public clear() {
        this.events.emit("onClear", []);
    }
}
