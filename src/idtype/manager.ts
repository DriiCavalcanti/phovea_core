/**
 * Created by sam on 26.12.2016.
 */


import {getAPIJSON} from '../ajax';
import {fire as global_fire} from '../event';
import {defaultSelectionType, IIDType} from './IIDType';
import IDType from './IDType';
import ProductIDType from './ProductIDType';

const cache = new Map<string, IDType|ProductIDType>();
let filledUp = false;


export const EVENT_REGISTER_IDTYPE = 'register.idtype';

function fillUpData(entries) {
  entries.forEach(function (row) {
    let entry = cache.get(row.id);
    let new_ = false;
    if (entry) {
      if (entry instanceof IDType) {
        (<any>entry).name = row.name;
        (<any>entry).names = row.names;
      }
    } else {
      entry = new IDType(row.id, row.name, row.names);
      new_ = true;
    }
    cache.set(row.id, entry);
    if (new_) {
      global_fire(EVENT_REGISTER_IDTYPE, entry);
    }
  });
}


function toPlural(name: string) {
  if (name[name.length - 1] === 'y') {
    return name.slice(0, name.length - 1) + 'ies';
  }
  return name + 's';
}

export declare type IDTypeLike = string|IDType;

export function resolve(id: IDTypeLike): IDType {
  if (id instanceof IDType) {
    return id;
  } else {
    const sid = <string>id;
    return <IDType>register(sid, new IDType(sid, sid, toPlural(sid)));
  }
}
export function resolveProduct(...idtypes: IDType[]): ProductIDType {
  const p = new ProductIDType(idtypes);
  return <ProductIDType>register(p.id, p);
}

/**
 * list currently resolved idtypes
 * @returns {Array<IDType|ProductIDType>}
 */
export function list(): IIDType[] {
  return Array.from(cache.values());
}


/**
 * see list but with also the server side available ones
 * @returns {any}
 */
export function listAll(): Promise<IIDType[]> {
  if (filledUp) {
    return Promise.resolve(list());
  }
  filledUp = true;
  return getAPIJSON('/idtype', {}, []).then((c) => {
    fillUpData(c);
    return list();
  });
}

export function register(id: string, idtype: IDType|ProductIDType): IDType|ProductIDType {
  if (cache.has(id)) {
    return cache.get(id);
  }
  cache.set(id, idtype);
  global_fire('register.idtype', idtype);
  return idtype;
}

export function persist() {
  let r = {};

  cache.forEach((v, id) => {
    r[id] = v.persist();
  });
  return r;
}

export function restore(persisted: any) {
  Object.keys(persisted).forEach((id) => {
    resolve(id).restore(persisted[id]);
  });
}

export function clearSelection(type = defaultSelectionType) {
  cache.forEach((v) => v.clear(type));
}
