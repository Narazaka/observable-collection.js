import {Subject} from "rxjs";
import {PartialObserver} from "rxjs/Observer";
import {Subscription} from "rxjs/Subscription";
import {toSubscriber} from "rxjs/util/toSubscriber";

import {IObservableCollection} from "./IObservableCollection";

export class ObservableArray<T> extends Array<T> implements IObservableCollection<T[]> {
    static from<T>(array: T[]) {
        return new ObservableArray(...array);
    }

    closed = false;
    get emit() { return this.preventEmitCount === 0; }
    private preventEmitCount = 0;
    private changed = false;

    private source = new Subject<T[]>();

    subscribe(): Subscription;
    subscribe(observer: PartialObserver<T[]>): Subscription;
    subscribe(next?: (value: T[]) => void, error?: (error: any) => void, complete?: () => void): Subscription;
    subscribe(
        observerOrNext?: PartialObserver<T[]> | ((value: T[]) => void),
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

    atomic(routine: () => void) {
        this.preventEmitCount++;
        routine();
        this.preventEmitCount--;
        if (this.changed && this.emit) {
            this.source.next(this as any);
            this.changed = false;
        }
    }
}

const mutableMethods = [
    "copyWithin",
    "fill",
    "pop",
    "push",
    "reverse",
    "shift",
    "sort",
    "splice",
    "unshift",
];

for (const mutableMethod of mutableMethods) {
    ObservableArray.prototype[mutableMethod as any] = function(...args: any[]) {
        Array.prototype[mutableMethod as any].apply(this, args);
        if (this.emit) {
            this.source.next(this);
        } else {
            this.changed = true;
        }
    };
}
