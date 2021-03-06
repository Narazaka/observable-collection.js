# [observable-collection.js - ObserbableCollection like classes for RxJS](https://github.com/Narazaka/observable-collection.js)

- `ObservableArray<T>`
- `ObservableMap<K, V>`
- `ObservableWeakMap<K, V>`
- `ObservableSet<T>`
- `ObservableWeakSet<T>`

## Synopsys

```typescript
import { ObservableArray } from "observable-collection";

const array = new ObservableArray(1, 2, 3);
const array2 = ObservableArray.from([1, 2, 3]);

console.log(array instanceof Array);
// > true

array.subscribe(arr => console.log(arr));
array.push(4);
// > [1, 2, 3, 4]

```

## See also

- [reactiveproperty](https://github.com/Narazaka/reactiveproperty.js)

## License

This is released under [MIT License](http://narazaka.net/license/MIT?2017).
