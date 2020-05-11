import {
  InjectionToken,
  Directive,
  ViewContainerRef,
  TemplateRef,
  Renderer2,
  OnInit,
  OnDestroy,
  Input,
  Inject,
} from '@angular/core'
import { EventType, Overmind, MODE_SSR } from 'overmind'
import { IS_PROXY } from 'proxy-state-tree'

export const OVERMIND_INSTANCE = new InjectionToken('OVERMIND')

// @ts-ignore
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

let nextComponentId = 0

@Directive({ selector: '[track]' })
export class OvermindTrackDirective implements OnInit, OnDestroy {
  protected templateBindings = {}
  protected dispose: any
  protected view: any
  protected tree: any
  protected componentDetails: any
  protected component: any
  protected overmind: any
  @Input() track

  constructor(
    protected templateRef: TemplateRef<any>,
    protected viewContainer: ViewContainerRef,
    protected renderer: Renderer2,
    @Inject(OVERMIND_INSTANCE) overmind: Overmind<any>
  ) {
    this.component = (this.viewContainer as any)._view ? (this.viewContainer as any)._view.component : (this.viewContainer as any)._hostView[8]
    this.overmind = overmind
    if (this.overmind.mode.mode === MODE_SSR) {
      return
    }

    this.tree = this.overmind.proxyStateTree.getTrackStateTreeWithProxifier()
  }
  rescope() {
    let hasRescoped = false
    for (let key in this.component) {
      if (this.component[key] && this.component[key][IS_PROXY]) {
        this.component[key] = this.overmind.proxyStateTree.rescope(
          this.component[key],
          this.tree
        )
        hasRescoped = true
      }
    }

    if (!hasRescoped) {
      throw new Error(
        'OVERMIND - You are tracking in a component that has nothing to track: ' +
          this.component.constructor.name
      )
    }
  }
  ngOnInit() {
    if (this.overmind.mode.mode === MODE_SSR) {
      return
    }

    this.rescope()
    this.view = this.viewContainer.createEmbeddedView(this.templateRef)

    this.tree.track(this.onUpdate)

    if (IS_PRODUCTION) {
      return
    }

    const Component = this.component.constructor

    const componentId = nextComponentId++
    let componentInstanceId = 0

    this.componentDetails = {
      componentId,
      componentInstanceId: componentInstanceId++,
      name: Component.name,
    }
    ;(window['__zone_symbol__setTimeout'] || setTimeout)(() => {
      this.overmind.eventHub.emitAsync(EventType.COMPONENT_ADD, {
        componentId: this.componentDetails.componentId,
        componentInstanceId: this.componentDetails.componentInstanceId,
        name: this.componentDetails.name,
        paths: Array.from(this.tree.pathDependencies) as any,
      })
    })
  }

  private onUpdate = (mutations, paths, flushId) => {
    this.tree.track(this.onUpdate)
    this.view.detectChanges()
    if (this.componentDetails) {
      ;(window['__zone_symbol__setTimeout'] || setTimeout)(() => {
        this.overmind.eventHub.emitAsync(EventType.COMPONENT_UPDATE, {
          componentId: this.componentDetails.componentId,
          componentInstanceId: this.componentDetails.componentInstanceId,
          name: this.componentDetails.name,
          paths: Array.from(this.tree.pathDependencies) as any,
          flushId,
        })
      })
    }
  }

  ngOnDestroy() {
    if (this.overmind.mode.mode === MODE_SSR) {
      return
    }

    this.overmind.proxyStateTree.disposeTree(this.tree)
    if (this.componentDetails) {
      this.overmind.eventHub.emitAsync(EventType.COMPONENT_REMOVE, {
        componentId: this.componentDetails.componentId,
        componentInstanceId: this.componentDetails.componentInstanceId,
        name: this.componentDetails.name,
      })
    }
  }
}
