import type { SuiteFunction, BenchFunction, HookFunction } from './builder';

declare global {
    var suite: SuiteFunction;
    var bench: BenchFunction;
    var benchmark: BenchFunction;
    var before: HookFunction;
    var after: HookFunction;
    var beforeEach: HookFunction;
    var afterEach: HookFunction;
}
