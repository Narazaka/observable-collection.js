import {Subject} from "rxjs";
import {PartialObserver} from "rxjs/Observer";
import {Subscription} from "rxjs/Subscription";
import {toSubscriber} from "rxjs/util/toSubscriber";

import {IObservableCollection} from "./IObservableCollection";

export class ObservableSet<T> extends Set<T> implements IObservableCollection<Set<T>> {
    static from<T>(entries?: T[]): ObservableSet<T>;
    static from<T>(iterable: Iterable<T>): ObservableSet<T>;
    static from<T>(iterable?: Iterable<T>) {
        return new ObservableSet(<any> iterable);
    }

    closed = false;
    get emit() { return this.preventEmitCount === 0; }
    private preventEmitCount = 0;
    private changed = false;

    private source = new Subject<Set<T>>();

    subscribe(): Subscription;
    subscribe(observer: PartialObserver<Set<T>>): Subscription;
    subscribe(next?: (value: Set<T>) => void, error?: (error: any) => void, complete?: () => void): Subscription;
    subscribe(
        observerOrNext?: PartialObserver<Set<T>> | ((value: Set<T>) => void),
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
    "clear",
    "delete",
];

for (const mutableMethod of mutableMethods) {
    (<any> ObservableSet).prototype[<any> mutableMethod] = function (...args: any[]) {
        (<any> Set).prototype[<any> mutableMethod].apply(this, args);
        if (this.emit) {
            this.source.next(this);
        } else {
            this.changed = true;
        }
    };
};
