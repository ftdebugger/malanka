import {TrimSpacesOptimizer} from '../lib/Template/optimizer/TrimSpacesOptimizer';
import {TemplateCompiler} from '../lib/Template/TemplateCompiler';
import {StringRenderer} from '../lib/Renderer/StringRenderer';
import {Environment} from '../lib/Environment';

export function pathFixture(path) {
    return {
        type: 'Path',
        path
    };
}

/**
 * Create compiler for easy test
 *
 * @param {{}} [options]
 * @returns {{compile: compile, render: render}}
 */
export function createCompiler(options) {
    let env = new Environment({
        renderer: new StringRenderer()
    });

    let compiler = new TemplateCompiler(Object.assign({
        components: {
            Component: require.resolve('../lib/Components/Component'),
            ValueProxy: require.resolve('../lib/Data/ValueProxy')
        },
        helpers: {
            json: require.resolve('./fixture/json.js')
        },
        optimize: {
            plugins: [
                new TrimSpacesOptimizer()
            ]
        }
    }, options));

    /**
     * Compile template
     *
     * @param string
     * @returns {string}
     */
    function compile(string) {
        let moduleContent = compiler.compileString(string);

        let module = {};
        eval(moduleContent);

        return module.exports;
    }

    /**
     * Render template in context
     *
     * @param {string} templateString
     * @param {{}} context
     *
     * @returns {string}
     */
    function render(templateString, context) {
        let template = compile(templateString),
            result = template(context);

        if (Array.isArray(result)) {
            return result.map(component => env.render(component)).join('');
        } else if (typeof result !== 'object') {
            return result;
        } else {
            return env.render(result).toString();
        }
    }

    return {compile, render};
}
