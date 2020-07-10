import { BaseResultsHandler } from './BaseResultsHandler';
import NullReporter from '../NullReporter';

export class NullResultsHandler extends BaseResultsHandler<NullReporter> {
    static get instance() {
        if (staticInstance === undefined) {
            staticInstance = new NullResultsHandler(new NullReporter());
        }
        return staticInstance;
    }
}

let staticInstance: NullResultsHandler | undefined;
