import {Subject} from "rxjs";
import {PartialObserver} from "rxjs/Observer";
import {Subscription} from "rxjs/Subscription";
import {toSubscriber} from "rxjs/util/toSubscriber";

import {IObservableCollection} from "./IObservableCollection";

export class ObservableMap<K, V> extends Map<K, V> implements IObservableCollection<Map<K, V>> {
    static from<K, V>(entries?: Array<[K, V]>): ObservableMap<K, V>;
    static from<K, V>(iterable: Iterable<[K, V]>): ObservableMap<K, V>;
    static from<K, V>(iterable?: Iterable<[K, V]>) {
        return new ObservableMap(iterable as any);
    }

    closed = false;
    get emit() { return this.preventEmitCount === 0; }
    private preventEmitCount = 0;
    private changed = false;

    private source = new Subject<Map<K, V>>();

    subscribe(): Subscription;
    subscribe(observer: PartialObserver<Map<K, V>>): Subscription;
    subscribe(next?: (value: Map<K, V>) => void, error?: (error: any) => void, complete?: () => void): Subscription;
    subscribe(
        observerOrNext?: PartialObserver<Map<K, V>> | ((value: Map<K, V>) => void),
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
    "clear",
    "delete",
    "set",
];

for (const mutableMethod of mutableMethods) {
    (ObservableMap as any).prototype[mutableMethod as any] = function(...args: any[]) {
        (Map as any).prototype[mutableMethod as any].apply(this, args);
        if (this.emit) {
            this.source.next(this);
        } else {
            this.changed = true;
        }
    };
}
