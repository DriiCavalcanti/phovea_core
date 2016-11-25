/**
 * Created by sam on 12.02.2015.
 */
/**
 * Created by Samuel Gratzl on 22.10.2014.
 */
import {mixin, IPersistable, flagId, uniqueId} from '../index';
import {sendAPI} from '../ajax';
import {SelectAble, SelectOperation, resolve as idtypes_resolve} from '../idtype';
import {DataTypeBase, IDataDescription} from '../datatype';
import {all, none, Range, list} from '../range';
import {EventHandler, IEvent} from '../event';

export class GraphProxy extends DataTypeBase {
  private _impl:Promise<AGraph> = null;
  private _loaded:AGraph = null;

  constructor(desc:IDataDescription) {
    super(desc);
  }

  get nnodes(): number {
    if (this._loaded) {
      return this._loaded.nnodes;
    }
    var size = (<any>this.desc).size;
    return size[0] || 0;
  }

  get nedges(): number {
    if (this._loaded) {
      return this._loaded.nedges;
    }
    var size = (<any>this.desc).size;
    return size[1] || 0;
  }

  get dim() {
    return [this.nnodes, this.nedges];
  }

  impl(factory: IGraphFactory = defaultGraphFactory): Promise<AGraph> {
    if (this._impl) {
      return this._impl;
    }
    const type = (<any>this.desc).storage || 'remote';
    if (type === 'memory') {
      //memory only
      this._loaded = new MemoryGraph(this.desc, [],[], factory);
      this._impl = Promise.resolve(this._loaded);
    } else if (type === 'local') {
      this._loaded = LocalStorageGraph.load(this.desc, factory, localStorage);
      this._impl = Promise.resolve(this._loaded);
    } else if (type === 'session') {
      this._loaded = LocalStorageGraph.load(this.desc, factory, sessionStorage);
      this._impl = Promise.resolve(this._loaded);
    } else if (type === 'given' && (<any>this.desc).graph instanceof GraphBase) {
      this._loaded = (<any>this.desc).graph;
      this._impl = Promise.resolve(this._loaded);
    } else {
      this._impl = RemoteStoreGraph.load(this.desc, factory).then((graph: AGraph) => {
        return this._loaded = graph;
      });
    }
    return this._impl;
  }

  ids(range:Range = all()) {
    if (this._impl) {
      return this._impl.then((i) => i.ids(range));
    }
    return Promise.resolve(none());
  }

  get idtypes() {
    return ['_nodes', '_edges'].map(idtypes_resolve);
  }
}

/**
 * module entry point for creating a datatype
 * @param desc
 * @returns {IMatrix}
 */
export function create(desc:IDataDescription):GraphProxy {
  return new GraphProxy(desc);
}
