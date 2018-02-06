import {Subject} from "rxjs";
import {PartialObserver} from "rxjs/Observer";
import {Subscription} from "rxjs/Subscription";
import {toSubscriber} from "rxjs/util/toSubscriber";

import {IObservableCollection} from "./IObservableCollection";

export class ObservableWeakSet<T extends object> extends WeakSet<T> implements IObservableCollection<WeakSet<T>> {
    static from<T extends object>(entries?: T[]): ObservableWeakSet<T>;
    static from<T extends object>(iterable: Iterable<T>): ObservableWeakSet<T>;
    static from<T extends object>(iterable?: Iterable<T>) {
        return new ObservableWeakSet(<any> iterable);
    }

    closed = false;
    get emit() { return this.preventEmitCount === 0; }
    private preventEmitCount = 0;
    private changed = false;

    private source = new Subject<WeakSet<T>>();

    subscribe(): Subscription;
    subscribe(observer: PartialObserver<WeakSet<T>>): Subscription;
    subscribe(next?: (value: WeakSet<T>) => void, error?: (error: any) => void, complete?: () => void): Subscription;
    subscribe(
        observerOrNext?: PartialObserver<WeakSet<T>> | ((value: WeakSet<T>) => void),
        error?: (error: any) => void,
        complete?: () => void,
    ) {
        const observer = toSubscriber(observerOrNext, error, complete);
        observer.next(this);
        return this.source.subscribe(observer);
    }

    unsubscribe() {
        if (this.closed) return;
        this.source.complete();
        this.source.unsubscribe();
    }

    atomic(routine: Function) {
        this.preventEmitCount++;
        routine();
        this.preventEmitCount--;
        if (this.changed && this.emit) {
            this.source.next(<any> this);
            this.changed = false;
        }
    }
}

const mutableMethods = [
    "add",
    "delete",
];

for (const mutableMethod of mutableMethods) {
    (<any> ObservableWeakSet).prototype[<any> mutableMethod] = function (...args: any[]) {
        (<any> WeakSet).prototype[<any> mutableMethod].apply(this, args);
        if (this.emit) {
            this.source.next(this);
        } else {
            this.changed = true;
        }
    };
};
