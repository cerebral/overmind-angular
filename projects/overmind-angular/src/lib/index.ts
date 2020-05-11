import { NgModule } from '@angular/core'

import { OVERMIND_INSTANCE, OvermindTrackDirective } from './directive'
import { OvermindService } from './service'

@NgModule({
  declarations: [OvermindTrackDirective],
  exports: [OvermindTrackDirective],
  imports: [],
  providers: [
    {
      provide: OvermindService,
      useFactory: (overmind) => new OvermindService(overmind),
      deps: [OVERMIND_INSTANCE],
    },
  ],
})
export class OvermindModule {}
