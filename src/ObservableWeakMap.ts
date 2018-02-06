import {Subject} from "rxjs";
import {PartialObserver} from "rxjs/Observer";
import {Subscription} from "rxjs/Subscription";
import {toSubscriber} from "rxjs/util/toSubscriber";

import {IObservableCollection} from "./IObservableCollection";

export class ObservableWeakMap<K extends object, V>
    extends WeakMap<K, V> implements IObservableCollection<WeakMap<K, V>> {
    static from<K extends object, V>(entries?: Array<[K, V]>): ObservableWeakMap<K, V>;
    static from<K extends object, V>(iterable: Iterable<[K, V]>): ObservableWeakMap<K, V>;
    static from<K extends object, V>(iterable?: Iterable<[K, V]>) {
        return new ObservableWeakMap(iterable as any);
    }

    closed = false;
    get emit() { return this.preventEmitCount === 0; }
    private preventEmitCount = 0;
    private changed = false;

    private source = new Subject<WeakMap<K, V>>();

    subscribe(): Subscription;
    subscribe(observer: PartialObserver<WeakMap<K, V>>): Subscription;
    subscribe(next?: (value: WeakMap<K, V>) => void, error?: (error: any) => void, complete?: () => void): Subscription;
    subscribe(
        observerOrNext?: PartialObserver<WeakMap<K, V>> | ((value: WeakMap<K, V>) => void),
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
    "delete",
    "set",
];

for (const mutableMethod of mutableMethods) {
    (ObservableWeakMap as any).prototype[mutableMethod as any] = function(...args: any[]) {
        (WeakMap as any).prototype[mutableMethod as any].apply(this, args);
        if (this.emit) {
            this.source.next(this);
        } else {
            this.changed = true;
        }
    };
}
