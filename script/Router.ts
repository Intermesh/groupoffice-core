import {Router as GouiRouter, RouterMethod} from "@intermesh/goui";

/**
 * Router adapter class that uses the old router
 */
class Router extends GouiRouter {
	
	public newMainLayout = false;
	public add(re: RegExp | RouterMethod, handler?: RouterMethod) {

		if(!this.newMainLayout)
			go.Router.add(re, handler);
		else
			super.add(re, handler);

		return this;
	}

	getParams(): string[] {

		return !this.newMainLayout ? go.Router.getParams() : super.getParams();
	}

	public setPath(...pathParts: any[]) {
		if(this.newMainLayout) {
			super.setPath(...pathParts);
			return;
		}

		const path = pathParts.map(p => p ?? "").join("/");

		const oldPath = this.getPath();
		go.Router.setPath(path);
		this.fire("change", {path: this.getPath(), oldPath});
	}

	public start(): Promise<void> {
		if(this.newMainLayout) {
			return super.start();
		}
		return Promise.resolve();
	}

	public async reload() {
		if(this.newMainLayout) {
			return super.reload();
		}
		go.Router.check();
	}
}
export const router = new Router();