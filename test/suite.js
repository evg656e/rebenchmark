import assert from 'assert';
import Suite from '../lib/suite';
import StringReporter from '../lib/reporters/StringReporter';

const b1 = () => 'Hello World!'.indexOf('o') > -1;

describe('suite', function () {
    let root = null;

    beforeEach(() => root = new Suite('root', { reporter: new StringReporter({ sep: ',' }) }));

    it('name, path, isRoot, root', function () {
        assert.equal(root.name, 'root');
        assert.equal(root.path, ':root');
        assert.equal(root.isRoot, true);
        assert.equal(root.root, root);
        assert.equal(root.length, 0);
        return assert.equal(root.hasBenchmarks, false);
    });

    describe('nested', function () {
        let s1 = null;
        beforeEach(() => s1 = new Suite('s1', { parent: root }));

        it('has parent, root, full path', function () {
            assert.equal(s1.parent, root);
            assert.equal(s1.isRoot, false);
            assert.equal(root.children.length, 1);
            assert.equal(root.children[0], s1);
            return assert.equal(s1.path, ':root:s1');
        });

        return describe('additional nesting', function () {
            let s2 = null;
            beforeEach(() => s2 = new Suite('s2', { parent: s1 }));

            return it('has parent, root, full path', function () {
                assert.equal(s2.root, root);
                assert.equal(s2.parent, s1);
                assert.equal(s2.isRoot, false);
                assert.equal(s1.children.length, 1);
                assert.equal(s1.children[0], s2);
                return assert.equal(s2.path, ':root:s1:s2');
            });
        });
    });

    describe('reporter', function () {
        it('has a default reporter', () => assert(root.reporter));

        return describe('nested suites', () => it('share root reporter', function () {
            const s1 = new Suite('s1', { parent: root });
            return assert.equal(root.reporter, s1.reporter);
        }));
    });

    return describe('benchmark', function () {
        let res = null;

        beforeEach(function () {
            res = [];
            return ['before', 'beforeEach', 'afterEach', 'after'].forEach(e => root.on(e, s => res.push(`${e}${s ? ':' + s.name : ''}`)));
        });

        it('length > 0 & hasBenchmarks', function () {
            root.add('b1', b1);
            assert(root.length > 0);
            return assert(root.hasBenchmarks);
        });

        it('invokes hooks, without benchmark', () => root.run().then(() => assert.deepEqual(res, ['before', 'after'])));

        it('invokes hooks, with benchmark', function () {
            this.timeout(25000);
            root.add('b1', b1);
            return root.run().then(() => assert.deepEqual(res, ['before', 'beforeEach:b1', 'afterEach:b1', 'after']));
        });

        return describe('reporter hooks', function () {
            it('no benchmarks', () => root.run().then(() => assert.equal(root.reporter.toString(), ":root:before,:root:after")));

            return it('with benchmark', function () {
                this.timeout(25000);
                root.add('b1', b1);
                root.add('b2', b1);
                return root.run().then(() => assert.equal(root.reporter.toString(), ":root:before,:root:b1:beforeEach,:root:b1:afterEach,:root:b2:beforeEach,:root:b2:afterEach,:root:after"));
            });
        });
    });
});
