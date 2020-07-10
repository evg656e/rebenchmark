import { equal, deepEqual, ok } from 'assert';
import { Suite } from '../lib/core/Suite';
import StringReporter from '../lib/core/reporters/StringReporter';

const b1 = () => 'Hello World!'.indexOf('o') > -1;

describe('suite', function () {
    let root: Suite;

    beforeEach(() => root = new Suite('root', { reporter: new StringReporter({ sep: ',' }) }));

    it('name, path, isRoot, root', function () {
        equal(root.name, 'root');
        equal(root.path, ':root');
        equal(root.isRoot, true);
        equal(root.root, root);
        equal(root.length, 0);
        return equal(root.hasBenchmarks, false);
    });

    describe('nested', function () {
        let s1: Suite;
        beforeEach(() => s1 = new Suite('s1', { parent: root }));

        it('has parent, root, full path', function () {
            equal(s1.parent, root);
            equal(s1.isRoot, false);
            equal(root.children.length, 1);
            equal(root.children[0], s1);
            return equal(s1.path, ':root:s1');
        });

        return describe('additional nesting', function () {
            let s2: Suite;
            beforeEach(() => s2 = new Suite('s2', { parent: s1 }));

            return it('has parent, root, full path', function () {
                equal(s2.root, root);
                equal(s2.parent, s1);
                equal(s2.isRoot, false);
                equal(s1.children.length, 1);
                equal(s1.children[0], s2);
                return equal(s2.path, ':root:s1:s2');
            });
        });
    });

    describe('reporter', function () {
        it('has a default reporter', () => ok(root.reporter));

        return describe('nested suites', () => it('share root reporter', function () {
            const s1 = new Suite('s1', { parent: root });
            return equal(root.reporter, s1.reporter);
        }));
    });

    return describe('benchmark', function () {
        let res: string[];

        beforeEach(function () {
            res = [];
            return ['before', 'beforeEach', 'afterEach', 'after'].forEach(e => root.on(e, s => res.push(`${e}${s ? ':' + s.name : ''}`)));
        });

        it('length > 0 & hasBenchmarks', function () {
            root.add('b1', b1);
            ok(root.length > 0);
            return ok(root.hasBenchmarks);
        });

        it('invokes hooks, without benchmark', () => root.run().then(() => deepEqual(res, ['before', 'after'])));

        it('invokes hooks, with benchmark', function () {
            this.timeout(25000);
            root.add('b1', b1);
            return root.run().then(() => deepEqual(res, ['before', 'beforeEach:b1', 'afterEach:b1', 'after']));
        });

        return describe('reporter hooks', function () {
            it('no benchmarks', () => root.run().then(() => equal(root.reporter.toString(), ":root:before,:root:after")));

            return it('with benchmark', function () {
                this.timeout(25000);
                root.add('b1', b1);
                root.add('b2', b1);
                return root.run().then(() => equal(root.reporter.toString(), ":root:before,:root:b1:beforeEach,:root:b1:afterEach,:root:b2:beforeEach,:root:b2:afterEach,:root:after"));
            });
        });
    });
});
