import { EventEmitter } from "events";
export interface ErrorResponse {
    code: number;
    message: string;
    data?: string;
}
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

    public reject(reason?: ErrorResponse) {
        console.log("SignatureRequestHandler reject()", reason);
        this.events.emit("rejected", reason);
    }

    handleDone(resolve: () => void) {
        resolve();
        this.clear();
    }

    handleRejected(reject: () => void) {
        reject();
        this.clear();
    }

    async results() {
        return new Promise((resolve, reject) => {
            this.events.on("done", (event) => this.handleDone(() => resolve(event)));
            this.events.on("rejected", (event) => this.handleRejected(() => reject(event)));
        });
    }

    public clear() {
        this.events.emit("onClear", []);
        this.events.removeListener("done", this.handleDone);
        this.events.removeListener("rejected", this.handleDone);
    }
}
