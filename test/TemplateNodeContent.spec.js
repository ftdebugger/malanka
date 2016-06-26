import {expect} from 'chai';

import {pathFixture} from './fixtures';
import {TemplateNodeContent} from '../lib/Template/nodes/TemplateNodeContent';
import {TemplateEnvironment} from '../lib/Template/TemplateEnvironment';

describe('TemplateNodeContent', function () {
    let env;

    beforeEach(function () {
        env = new TemplateEnvironment({})
    });

    it('optimize string literals', function () {
        let ast = [
            'test',
            'test2'
        ];

        let node = TemplateNodeContent.factory(ast, env);

        expect(node.compile()).to.equal('"testtest2"');
    });

    it('optimize string literals with variable', function () {
        let ast = [
            'test',
            {
                type: 'Expression',
                value: 'test'
            }
        ];

        let node = TemplateNodeContent.factory(ast, env);

        expect(node.compile()).to.equal('"testtest2"');
    });

});