import {Subject} from "rxjs";
import {PartialObserver} from "rxjs/Observer";
import {Subscription} from "rxjs/Subscription";
import {toSubscriber} from "rxjs/util/toSubscriber";

import {IObservableCollection} from "./IObservableCollection";

export class ObservableWeakSet<T> extends WeakSet<T> implements IObservableCollection<WeakSet<T>> {
    static from<T>(entries?: T[]): ObservableWeakSet<T>;
    static from<T>(iterable: Iterable<T>): ObservableWeakSet<T>;
    static from<T>(iterable?: Iterable<T>) {
        return new ObservableWeakSet(<any> iterable);
    }

    closed = false;
    emit = true;
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
        this.emit = false;
        routine();
        this.emit = true;
        if (this.changed) this.source.next(<any> this);
    }
}

const mutableMethods = [
    "add",
    "delete",
];

for (const mutableMethod of mutableMethods) {
    (<any> ObservableWeakSet).prototype[<any> mutableMethod] = function (...args: any[]) {
        (<any> WeakSet).prototype[<any> mutableMethod].apply(this, args);
        if (this.emit) this.source.next(this);
    };
};
