import {Subject} from "rxjs";
import {PartialObserver} from "rxjs/Observer";
import {Subscription} from "rxjs/subscription";
import {toSubscriber} from "rxjs/util/toSubscriber";

import {IObservableCollection} from "./IObservableCollection";

export class ObservableArray<T> extends Array<T> implements IObservableCollection<T> {
    static from<T>(array: T[]) {
        return new ObservableArray(...array);
    }

    closed = false;

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
    ObservableArray.prototype[<any> mutableMethod] = function (...args: any[]) {
        Array.prototype[<any> mutableMethod].apply(this, args);
        this.source.next(this);
    };
};
