/*******************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 ******************************************************************************/
/**
 * Created by sam on 10.02.2015.
 */

const context : any = {};

export function store(key: string, value: any) {
  var bak = context[key];
  context[key] = value;
  return bak;
}

export function remove(key: string) {
  delete context[key];
}

export function has(key: string) {
  return key in context;
}

export function retrieve<T>(key: string, default_ : T = null) : T {
  return has(key) ? context[key] : default_;
}
