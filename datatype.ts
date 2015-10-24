/**
 * Created by Samuel Gratzl on 04.08.2014.
 */

'use strict';
/// <reference path="../../tsd.d.ts" />
import C = require('./main');
import idtypes = require('./idtype');
import ranges = require('./range');

/**
 * basic description elements
 */
export interface IDataDescription {
  name: string;
  fqname: string;
  id: string;
  type: string;

  [extras: string]: any;
}

/**
 * basic data type interface
 */
export interface IDataType extends idtypes.SelectAble, C.IPersistable {
  desc: IDataDescription;
  /**
   * dimensions of this datatype
   * rows, cols, ....
   */
  dim: number[];


  idView(idRange?: ranges.Range) : Promise<IDataType>;
}

export function isDataType(v: any) {
  if (v instanceof DataTypeBase) {
    return true;
  }
  //sounds good
  return (v instanceof idtypes.SelectAble && C.isFunction(v.idView) && C.isFunction(v.persist) && C.isFunction(v.restore) && ('desc' in v) && ('dim' in v));
}

export function assignData(node: Element, data: IDataType) {
  (<any>node).__data__ = data;
}
/**
 * dummy data type just holding the description
 */
export class DataTypeBase extends idtypes.SelectAble implements IDataType {
  constructor(public desc: IDataDescription) {
    super();
  }

  get dim() {
    return [];
  }

  ids(range:ranges.Range = ranges.all()) : Promise<ranges.Range> {
    return Promise.resolve(ranges.none());
  }

  idView(idRange?: ranges.Range) : Promise<DataTypeBase> {
    return Promise.resolve(this);
  }

  get idtypes() {
    return [];
  }

  persist() {
    return this.desc.id;
  }

  restore(persisted: any) {
    return this;
  }

  toString() {
    return this.persist();
  }
}

/**
 * transpose the given matrix
 * @param m
 * @returns {*}
 */
export function transpose(m: any[][]) {
  if (m.length === 0 || m[0].length === 0) {
    return [];
  }
  var r = m[0].map((i) => [i]);
  for(var i = 1; i < m.length; ++i) {
     m[i].forEach((v,i) => r[i].push(v));
  }
  return r;
}


/**
 * converts the given categorical data to a grouped range
 * @param data
 * @param categories
 * @param options
 * @return {any}
 */
export function categorical2partitioning(data: string[], categories: string[], options = {}) {
  const m = C.mixin({
    skipEmptyCategories : true,
    colors: ['gray'],
    name: 'Partitioning'
  }, options);
  var groups = categories.map((d, i) => {
    return {
      name: d,
      color: m.colors[Math.min(i,m.colors.length-1)],
      indices: []
    };
  });
  data.forEach((d, j) => {
    var i = categories.indexOf(d);
    if (i>=0) {
      groups[i].indices.push(j);
    }
  });
  if (m.skipEmptyCategories) {
    groups = groups.filter((g) => g.indices.length > 0);
  }
  var granges = groups.map((g) => {
    return new ranges.Range1DGroup(g.name, g.color, ranges.Range1D.from(g.indices));
  });
  return ranges.composite(m.name, granges);
}

/**
 * utility function to create a datatype, designed for JavaScript usage
 * @param name
 * @param functions the functions to add
 * @return {function(IDataDescription): undefined}
 */
export function defineDataType(name: string, functions: any) {
  function DataType(desc: IDataDescription) {
    DataTypeBase.call(this, desc);
    if (C.isFunction(this.init)) {
      this.init.apply(this, C.argList(arguments));
    }
  }
  C.extendClass(DataType, DataTypeBase);
  DataType.prototype.toString = () => name;
  DataType.prototype = C.mixin(DataType.prototype, functions);

  return DataType;
}

