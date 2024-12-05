import {Router as GouiRouter, RouterMethod} from "@intermesh/goui";

/**
 * Router adapter class that uses the old router
 */
class Router extends GouiRouter {
	public add(re: RegExp | RouterMethod, handler?: RouterMethod) {
		go.Router.add(re, handler);
		return this;
	}

	getParams(): string[] {
		return go.Router.getParams();
	}

	public setPath(...pathParts: any[]) {
		const path = pathParts.map(p => p ?? "").join("/");

		const oldPath = this.getPath();
		go.Router.setPath(path);
		this.fire("change", this.getPath(), oldPath);
	}

	public start(): Promise<void> {
		return Promise.resolve();
	}

	public reload() {
		go.Router.check();
	}
}

export const router = new Router();