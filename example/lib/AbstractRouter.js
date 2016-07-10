import {ValueProxy} from '../../es5';

export class AbstractRouter {

    /**
     * @param {{}} routes
     */
    constructor({routes}) {
        this._route = new ValueProxy({
            get: () => {
                return this._lastEvent && this._lastEvent.name;
            }
        });
        
        this.routes = [];
        this.index = {};
        this.middlewares = [];

        this.buildRoutes(routes);
    }

    /**
     * @param {{}} routes
     */
    buildRoutes(routes) {
        Object.keys(routes).forEach(route => {
            this.addRoute(routes[route], route);
        });
    }

    /**
     * @param {string} name
     * @param {string} route
     */
    addRoute(name, route) {
        let names = [];

        this.index[name] = route;

        route = route.replace(/\(([^)]+)\)/g, (match, value) => {
            return '(?:' + value + ')?';
        });

        route = route.replace(/:([^/()]+)/g, (match, value) => {
            names.push(value);

            return '([^/]+)';
        });

        let regExp = new RegExp('^' + route + '$');

        this.routes.push((url, query, hash) => {
            let match = url.match(regExp),
                params = {};

            if (match) {
                names.forEach((name, index) => params[name] = this.normalizeParam(match[index + 1]));

                return {
                    name,
                    params,
                    query,
                    hash
                };
            }
        });
    }

    /**
     * @param {string} input
     *
     * @returns {Promise<{name: string}>}
     */
    match(input) {
        let [baseUrl, hash = ''] = input.replace(/^https?:\/\/[^\/]+/, '').split('#'),
            [url, queryString = ''] = baseUrl.split('?'),
            queryParts = queryString.split('&'),
            query = {},
            event;

        if (queryString.length) {
            for (let index = 0; index < queryParts.length; index++) {
                let [key, value] = queryParts[index].split('=');

                key = decodeURIComponent(key);

                query[key] = this.normalizeParam(value);
            }
        }

        for (let index = 0; index < this.routes.length && !event; index++) {
            event = this.routes[index](url, query, hash);
        }

        if (event) {
            this._lastEvent = event;
            this._route.emit(event.name);
            
            return this.middlewares.reduce((promise, middleware) => {
                return promise.then(middleware).then(() => event);
            }, Promise.resolve(event));
        } else {
            return Promise.reject(new Error('Cannot match url "' + url + '"'));
        }
    }

    /**
     * @param {string} value
     * @returns {boolean|number|string}
     */
    normalizeParam(value) {
        if (typeof value != 'string') {
            return value;
        }

        value = decodeURIComponent(value);

        if (value === 'true' || value === 'false') {
            return value === 'true';
        } else {
            let num = Number(value);

            if (String(num) === value && num === num) {
                return num;
            }
        }

        return value;
    }

    /**
     * @param {string} route
     * @param {{}} params
     * 
     * @returns {string}
     */
    reverse(route, params){
        return this.index[route];
    }

    /**
     * @param {function} middleware
     */
    use(middleware) {
        this.middlewares.push(middleware);
    }

    /**
     * @returns {Promise<{name: string}>}
     */
    start() {
        window.addEventListener('popstate', () => {
            this.matchCurrentUrl();
        });

        document.body.addEventListener('click', (event) => {
            if (event.target.tagName.toLowerCase() === 'a') {
                event.preventDefault();
                this.navigate(event.target.href);
            }
        });

        return this.matchCurrentUrl();
    }

    /**
     * @returns {Promise<{name: string}>}
     */
    matchCurrentUrl() {
        return this.match(location.href);
    }

    /**
     * @param {string} url
     * @param {boolean} replace
     * @param {boolean} trigger
     * @param {{}} state
     */
    navigate(url, {replace = false, trigger = true, state = null} = {}) {
        let currentUrl = location.href;

        if (replace) {
            history.replaceState(state, '', url);
        } else {
            history.pushState(state, '', url);
        }

        if (trigger) {
            return this.match(url).catch(err => {
                history.replaceState(null, '', currentUrl);
                throw err;
            })
        } else {
            return Promise.resolve()
        }
    }

    /**
     * @param {string} name
     * 
     * @returns {ValueProxy}
     */
    isRoute(name) {
        return this._route.mutate(route => {
            return route === name;
        });
    }
}