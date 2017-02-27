/**
 * Created by sam on 12.02.2015.
 */
import {GraphNode, isType} from '../graph/graph';
import ActionNode from './ActionNode';
import ObjectNode from './ObjectNode';
import {diff, VNode} from 'virtual-dom';
import * as vdomAsJson from 'vdom-as-json';
import VPatch = VirtualDOM.VPatch;

/**
 * a state node is one state in the visual exploration consisting of an action creating it and one or more following ones.
 * In addition, a state is characterized by the set of active object nodes
 */
export default class StateNode extends GraphNode {
  private _stateTokenTree:VNode;

  constructor(name: string, description = '') {
    super('state');
    super.setAttr('name', name);
    super.setAttr('description', description);
  }

  get stateTokenTree():VNode {
    // use object cache if already defined
    if(this._stateTokenTree) {
      return this._stateTokenTree;
    }

    // otherwise use try to use sessionStorage and decode json
    const jsonTokenTree:Object = this.getAttr('stateTokenTree', null);

    if(jsonTokenTree) {
      this._stateTokenTree = vdomAsJson.fromJson(jsonTokenTree);

    } else {
      // use first element and assume that only the application returns a full `stateTokenTree`
      this._stateTokenTree = this.consistsOf
        .map((objectNode) => objectNode.stateTokenTree)
        .filter((d) => d !== null && d !== undefined)[0]; // note the [0]
      this.setAttr('stateTokenTree', vdomAsJson.toJson(this._stateTokenTree));
    }

    return this._stateTokenTree;
  }

  getSimilarityTo(other:StateNode):VPatch[] {
    return diff(other.stateTokenTree, this.stateTokenTree);
  }

  get name(): string {
    return super.getAttr('name');
  }

  set name(value: string) {
    super.setAttr('name', value);
  }

  get description(): string {
    return super.getAttr('description', '');
  }

  set description(value: string) {
    super.setAttr('description', value);
  }

  static restore(p: any) {
    const r = new StateNode(p.attrs.name);
    return r.restore(p);
  }

  /**
   * this state consists of the following objects
   * @returns {ObjectNode<any>[]}
   */
  get consistsOf(): ObjectNode<any>[] {
    return this.outgoing.filter(isType('consistsOf')).map((e) => <ObjectNode<any>>e.target);
  }

  /**
   * returns the actions leading to this state
   * @returns {ActionNode[]}
   */
  get resultsFrom(): ActionNode[] {
    return this.incoming.filter(isType('resultsIn')).map((e) => <ActionNode>e.source);
  }

  /**
   *
   * @returns {any}
   */
  get creator() {
    //results and not a inversed actions
    const from = this.incoming.filter(isType('resultsIn')).map((e) => <ActionNode>e.source).filter((s) => !s.isInverse);
    if (from.length === 0) {
      return null;
    }
    return from[0];
  }

  get next(): ActionNode[] {
    return this.outgoing.filter(isType('next')).map((e) => <ActionNode>e.target).filter((s) => !s.isInverse);
  }

  get previousState(): StateNode {
    const a = this.creator;
    if (a) {
      return a.previous;
    }
    return null;
  }

  get previousStates(): StateNode[] {
    return this.resultsFrom.map((n) => n.previous);
  }

  get nextStates(): StateNode[] {
    return this.next.map((n) => n.resultsIn);
  }

  get nextState(): StateNode {
    const r = this.next[0];
    return r ? r.resultsIn : null;
  }

  get path(): StateNode[] {
    const p = this.previousState,
      r: StateNode[] = [];
    r.unshift(this);
    if (p) {
      p.pathImpl(r);
    }
    return r;
  }

  private pathImpl(r: StateNode[]) {
    const p = this.previousState;
    r.unshift(this);
    if (p && r.indexOf(p) < 0) { //no loop
      //console.log(p.toString() + ' path '+ r.join(','));
      p.pathImpl(r);
    }
  }

  toString() {
    return this.name;
  }
}
