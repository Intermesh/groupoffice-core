import {Router as GouiRouter, RouterMethod} from "@goui/Router.js";

/**
 * Router adapter class that uses the old router
 */
class Router extends GouiRouter {
	public add(re: RegExp | RouterMethod, handler?: RouterMethod) {
		go.Router.add(re, handler);
		return this;
	}
	public start(): Promise<void> {
		return Promise.resolve();
	}
}

export const router = new Router();