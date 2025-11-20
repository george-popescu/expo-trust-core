import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ExpoTrustCore.types';

type ExpoTrustCoreModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExpoTrustCoreModule extends NativeModule<ExpoTrustCoreModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ExpoTrustCoreModule, 'ExpoTrustCoreModule');
