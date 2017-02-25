import {Subscribable} from "rxjs/Observable";
import {ISubscription} from "rxjs/subscription";

export interface IObservableCollection<T> extends Subscribable<T>, ISubscription {
}
