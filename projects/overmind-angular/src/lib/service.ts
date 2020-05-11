import { Injectable } from '@angular/core'
import { IConfiguration, Overmind } from 'overmind'

@Injectable()
export class OvermindService<Config extends IConfiguration> {
  private overmind: any
  actions: Overmind<Config>['actions']
  effects: Overmind<Config>['effects']
  addMutationListener: Overmind<Config>['addMutationListener']
  reaction: Overmind<Config>['reaction']
  constructor(overmind: Overmind<Config>) {
    this.overmind = overmind
    this.actions = this.overmind.actions
    this.addMutationListener = this.overmind.addMutationListener
    this.reaction = this.overmind.reaction
  }
  select<T>(expr: (state: Overmind<Config>['state']) => T): T
  select(): Overmind<Config>['state']
  select(...args) {
    return args[0] ? args[0](this.overmind.state) : this.overmind.state
  }
}
