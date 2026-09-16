/**
 * Wrapper for the pre-JMAP API, e,g. projects2 module, email-module pre 27.x, files, et cetera
 */
import {AclLevel} from "./auth";
import {client} from "./jmap";
import {EntityID} from "@intermesh/goui";


export class LegacyApi {

	private baseUrl: string;

	constructor(module: string, model: string) {
		this.baseUrl = "legacy.php?r=" + module + "/" + model;
	}


	/**
	 * Generic function for a store call (in BREAD terms: Browse)
	 *
	 * @param permissionLevel
	 * @param params
	 */
	public async store(permissionLevel: number = AclLevel.READ, params: any = {}): Promise<any> {
		// TODO: Validate whether permission level exists?
		let url = this.baseUrl + "store";
		params['permissionLevel'] = permissionLevel;
		(Object.keys(params) as Array<keyof typeof params>).forEach(key => {
			url += `&${String(key)}=${encodeURIComponent(params[key])}`;
		});
		const response = await fetch(url, {
			method: "POST",
			mode: "cors",
			credentials: "include",
			headers: this.getHeaders(true)
		});
		return response.json();
	}

	/**
	 * YAOGNI?: add an active record from within GOUI Implement when needed
	 */
	// public create(v: any): Promise<any> {
	//
	// }


	/**
	 * Generic function for loading a single mudel (In CRUD / BREAD terms: Read)
	 * @param id
	 * @param params
	 */
	public async read(id: EntityID, params: any = {}): Promise<any> {
		params['id'] = id;

		const response = await fetch(this.baseUrl + "/load", {
			method: "POST",
			mode: "cors",
			credentials: "include",
			headers: this.getHeaders(true),
			body: params
		});
		return response.json();
	}

	/**
	 * YAOGNI?: update an active record model from within GOUI Implement when needed
	 */
	// public update(id: EntityID, v: any): Promise<any> {
	//
	// }

	/**
	 * Generic function for deleting a single active record model (In CRUD / BREAD terms: Delete)
	 * @param ids
	 * @see EmailTemplateSettingsPanel
	 */
	public delete(ids: EntityID[]): Promise<any> {
		let url = this.baseUrl + "/store&delete_keys="+encodeURIComponent('['+ids.join(",")+']');
		return fetch(url, {
			method: "POST",
			mode: "cors",
			credentials: "include",
			headers: this.getHeaders(true)
		});
	}

	public async call(route :string = "") {
		let url = this.baseUrl + (route.length > 0 ? "/" : "") + route
		const response = await fetch(url, {
			method: "GET",
			mode: "cors",
			credentials: "include",
			headers: this.getHeaders(false),
		});
		return response.json();
	}


	private getHeaders(isPost: boolean = false): Record<string, string> {
		const headers: Record<string, string> = {};

		if (isPost) {
			headers['Content-Type'] = 'application/json';
		}
		if (client.session?.accessToken) {
			headers.Authorization = "Bearer " + client.session.accessToken;
		}

		if (client.session?.CSRFToken) {
			headers['X-CSRF-Token'] = client.session.CSRFToken;
		}
		return headers;
	}
}