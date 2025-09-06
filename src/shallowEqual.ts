/* eslint-disable -- this is a fork of a library */
var has = Object.prototype.hasOwnProperty;

function find(iter: any[], tar: any, key?: any) {
  for (key of iter.keys()) {
    if (key === tar) return key;
  }
}

/** shallow equal version of https://github.com/lukeed/dequal */
export function shallowEqual(foo: any, bar: any): boolean {
  var ctor, len, tmp;
  if (foo === bar) return true;

  if (foo && bar && (ctor = foo.constructor) === bar.constructor) {
    if (ctor === Date) return shallowEqual(foo.getTime(), bar.getTime());
    if (ctor === RegExp) return foo.toString() === bar.toString();

    if (ctor === Array) {
      if ((len = foo.length) === bar.length) {
        while (len-- && foo[len] === bar[len]);
      }
      return len === -1;
    }

    if (ctor === Set) {
      if (foo.size !== bar.size) {
        return false;
      }
      for (len of foo) {
        tmp = len;
        if (tmp && typeof tmp === 'object') {
          tmp = find(bar, tmp);
          if (!tmp) return false;
        }
        if (!bar.has(tmp)) return false;
      }
      return true;
    }

    if (ctor === Map) {
      if (foo.size !== bar.size) {
        return false;
      }
      for (len of foo) {
        tmp = len[0];
        if (tmp && typeof tmp === 'object') {
          tmp = find(bar, tmp);
          if (!tmp) return false;
        }
        if (len[1] !== bar.get(tmp)) {
          return false;
        }
      }
      return true;
    }

    if (!ctor || typeof foo === 'object') {
      len = 0;
      for (ctor in foo) {
        if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) return false;
        if (!(ctor in bar) || !(foo[ctor] === bar[ctor])) return false;
      }
      return Object.keys(bar).length === len;
    }
  }

  return foo !== foo && bar !== bar;
}
