import {Subject} from "rxjs";
import {PartialObserver} from "rxjs/Observer";
import {Subscription} from "rxjs/Subscription";
import {toSubscriber} from "rxjs/util/toSubscriber";

import {IObservableCollection} from "./IObservableCollection";

export class ObservableWeakSet<T extends object> extends WeakSet<T> implements IObservableCollection<WeakSet<T>> {
    static from<T extends object>(entries?: T[]): ObservableWeakSet<T>;
    static from<T extends object>(iterable: Iterable<T>): ObservableWeakSet<T>;
    static from<T extends object>(iterable?: Iterable<T>) {
        return new ObservableWeakSet(iterable as any);
    }

    closed = false;
    get emit() { return this.preventEmitCount === 0; }
    private preventEmitCount = 0;
    private changed = false;

    private source = new Subject<WeakSet<T>>();

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
    "add",
    "delete",
];

for (const mutableMethod of mutableMethods) {
    (ObservableWeakSet as any).prototype[mutableMethod as any] = function(...args: any[]) {
        (WeakSet as any).prototype[mutableMethod as any].apply(this, args);
        if (this.emit) {
            this.source.next(this);
        } else {
            this.changed = true;
        }
    };
}
