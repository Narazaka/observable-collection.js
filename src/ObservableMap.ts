import {Subject} from "rxjs";
import {PartialObserver} from "rxjs/Observer";
import {Subscription} from "rxjs/subscription";
import {toSubscriber} from "rxjs/util/toSubscriber";

import {IObservableCollection} from "./IObservableCollection";

export class ObservableMap<K, V> extends Map<K, V> implements IObservableCollection<Map<K, V>> {
    static from<K, V>(entries?: Array<[K, V]>): ObservableMap<K, V>;
    static from<K, V>(iterable: Iterable<[K, V]>): ObservableMap<K, V>;
    static from<K, V>(iterable?: Iterable<[K, V]>) {
        return new ObservableMap(<any> iterable);
    }

    closed = false;

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
}

const mutableMethods = [
    "clear",
    "delete",
    "set",
];

for (const mutableMethod of mutableMethods) {
    (<any> ObservableMap).prototype[<any> mutableMethod] = function (...args: any[]) {
        (<any> Map).prototype[<any> mutableMethod].apply(this, args);
        this.source.next(this);
    };
};
