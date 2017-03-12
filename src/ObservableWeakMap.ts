import {Subject} from "rxjs";
import {PartialObserver} from "rxjs/Observer";
import {Subscription} from "rxjs/Subscription";
import {toSubscriber} from "rxjs/util/toSubscriber";

import {IObservableCollection} from "./IObservableCollection";

export class ObservableWeakMap<K extends Object, V>
    extends WeakMap<K, V> implements IObservableCollection<WeakMap<K, V>> {
    static from<K, V>(entries?: Array<[K, V]>): ObservableWeakMap<K, V>;
    static from<K, V>(iterable: Iterable<[K, V]>): ObservableWeakMap<K, V>;
    static from<K, V>(iterable?: Iterable<[K, V]>) {
        return new ObservableWeakMap(<any> iterable);
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
    "delete",
    "set",
];

for (const mutableMethod of mutableMethods) {
    (<any> ObservableWeakMap).prototype[<any> mutableMethod] = function (...args: any[]) {
        (<any> WeakMap).prototype[<any> mutableMethod].apply(this, args);
        if (this.emit) {
            this.source.next(this);
        } else {
            this.changed = true;
        }
    };
};
