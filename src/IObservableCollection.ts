import {Subscribable} from "rxjs/Observable";
import {ISubscription} from "rxjs/Subscription";

export interface IObservableCollection<T> extends Subscribable<T>, ISubscription {
    readonly emit: boolean;
    atomic(routine: () => void): void;
}
