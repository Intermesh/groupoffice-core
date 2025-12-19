/**
 * @license https://github.com/Intermesh/goui/blob/main/LICENSE MIT License
 * @copyright Copyright 2023 Intermesh BV
 * @author Merijn Schering <mschering@intermesh.nl>
 */

import {DateTime, EntityID, Format, FunctionUtil, Observable, ObservableEventMap, Timezone} from "@intermesh/goui";

import {fetchEventSource} from "@fortaine/fetch-event-source";
import {jmapds} from "./JmapDataSource.js";
import {User, userDS} from "../auth/index.js";
import {customFields} from "../customfields/CustomFields.js";
import {modules} from "../Modules";


export interface LoginData {
	action?: "login"
	username?: string
	password?: string
	loginToken?: string
	authenticators?: {
		otpauthenticator?: {
			code: string
		} | undefined
	}
}


export interface RegisterData {
	action: "register",
	user: Partial<User>
}

export interface ForgottenData {
	action: "forgotten",
	email: String
}

interface ClientEventMap  extends ObservableEventMap {
	authenticated: {session: any}
	logout: {}
}



export type UploadResponse = {
	id: string,
	size: number,
	type: string,
	name: string,
	file: File,
	subfolder: string | undefined
}

export type JmapSession = {
	version: string
	auth: any
	accounts: any[]
	capabilities: any[]
	apiUrl: string
	downloadUrl: string
	pageUrl: string
	uploadUrl: string
	eventSourceUrl: string
	userId: EntityID
	state: any,
	accessToken: string,
	CSRFToken:string
}

/**
 * Result reference
 *
 * @link https://jmap.io/spec-core.html#references-to-previous-method-results
 */
export interface ResultReference  {
	/**
	 * The method call id (see Section 3.1.1) of a previous method call in the current request.
	 */
	resultOf: string,
	/**
	 * The required name of a response to that method call.
	 */
	name: string,
	/**
	 * A pointer into the arguments of the response selected via the name and resultOf properties. This is a JSON
	 * Pointer [@!RFC6901], except it also allows the use of * to map through an array (see the description below).
	 *
	 */
	path: string
}

export class Client extends Observable<ClientEventMap> {
	private _lastCallCounter = 0;

	private _lastCallId?:string;
	private _requests: [method: string, params: any, callid: string][] = [];
	private _requestData: any = {};
	private _session?: JmapSession;

	private debugParam = "";// "XDEBUG_SESSION=1"

	private _user: User | undefined;

	/**
	 * Full URI to API without jmap.php
	 */
	public uri = "";

	public CSRFToken = "";

	/**
	 * Either a cookie + CSRFToken are used when the API is on the same site. If it's not then an access token can be used
	 *
	 * @private
	 */
	public accessToken = "";
	private delayedJmap: (...args: any[]) => void;
	private SSEABortController?: AbortController;
	private pollInterval?: number;
	private SSEEventsRegistered: boolean = false;
	private SSELastEntities?: string[];


	/**
	 * The network request timeout in milliseconds
	 *
	 * @private
	 */
	public requestTimeout = 30000;

	constructor() {
		super();


		this.delayedJmap = FunctionUtil.buffer(0, () => {
			this.doJmap();
		})
	}

	set session(session: JmapSession) {

		if(session.accessToken) {
			this.accessToken = session.accessToken;
			sessionStorage.setItem("accessToken", this.accessToken);

		}

		this._session = session;

		if(session.CSRFToken) {
			this.CSRFToken = session.CSRFToken;
		}

		// this.fire("authenticated", this, session);
	}

	/**
	 * The session object.
	 *
	 * this.authenticate() has to be called first.
	 */
	get session(): JmapSession | undefined {
		return this._session;
	}

	/**
	 * Get the current user.
	 *
	 * this.authenticate() as to be called first.
	 */
	get user() : User {
		// We assume a user is here but this is not always true. When not authenticated yet the user is undefined.
		// But because it's annoying to have to do client.user!.id everywhere we pretend to always have user.
		return this._user!;
	}

	/**
	 * Validates the current session.
	 *
	 * this.session can be preset by a login dialog or other logic like in Group-Office.
	 * If it's not set it will call the JMAP API to retrieve the session using the accessToken.
	 */
	public async authenticate() {

		if(this._user) {
			return true;
		}

		if(!this.accessToken) {
			this.accessToken = sessionStorage.getItem("accessToken") || "";
		}

		if(!this._session) {
			this._session = await this.request().then(response => response.json())
				.catch(e => {
					console.log(e);
				})

			if(this._session && this._session.CSRFToken) {
				this.CSRFToken = this._session.CSRFToken;
			}
		}

		if(!this._session) {
			return false;
		}

		// make sure we update user
		await userDS.reset();

		await Promise.all([
			userDS.single(this._session.userId).then(user => {
				this.setUser(user);
			})
			])

		this.fire("authenticated", {session: this._session});

		return true;
	}

	private setUser(user:User) {

		this._user = user;

		Format.dateFormat = this._user.dateFormat;
		Format.timeFormat = this._user.timeFormat;
		Format.timezone = this._user.timezone.toLowerCase() as Timezone;
		DateTime.defaultTimezone = Format.timezone;
		Format.currency = this._user.currency;
		Format.thousandsSeparator = this._user.thousandsSeparator;
		Format.decimalSeparator = this._user.decimalSeparator;


		userDS.on("change", async ( {target, changes}) => {

			if(changes.updated && changes.updated.indexOf(this._user!.id) > -1) {
				const user =  await target.single(this._user!.id);
				if(user) {
					this.setUser(user);
				}
			}
		})
	}

	/**
	 * This function is only used up to 6.8. In 6.9 authenticate() is called in mainlayout.js
	 */
	public fireAuth() {
		// this.session = go.User.session;
		// this._user = go.User;

		this.fire("authenticated", {session: this._session});
	}

	/**
	 * The ID of the last JMAP method call
	 */
	get lastCallId() {
		return this._lastCallId;
	}

	public isLoggedIn(): boolean {
		return !!this._user;
	}

	private nextRequestTimeout:number|undefined;

	/**
	 * Raises the timeout for the next HTTP request. A HTTP requests contains multiple JMAP calls.
	 *
	 * @param nextTimeout
	 */
	public raiseNextRequestTimeout(nextTimeout:number) {
		this.nextRequestTimeout = nextTimeout;
	}

	private requestsInProgress = 0;

	public isBusy() {
		return this.requestsInProgress > 0;
	}

	private async request(data?: Object, tries = 1) : Promise<Response> {

		this.requestsInProgress++;
		try {
			const response = await fetch(this.uri + "jmap.php" + (this.debugParam ? '?' + this.debugParam : ''), {
				signal: AbortSignal.timeout(this.nextRequestTimeout ?? this.requestTimeout),
				method: data ? "POST" : "GET",
				mode: "cors",
				credentials: "include", // for cookie auth
				headers: this.buildHeaders(),
				body: data ? JSON.stringify(data) : undefined
			});

			this.nextRequestTimeout = undefined;

			if (!response.ok) {
				// network request fails. Try 3 times with 100ms delay
				if ((response.status === 0 && tries < 4)) {
					console.log("Retrying request " + tries);
					return FunctionUtil.delay(100, () => this.request(data, tries + 1))();
				}
				throw new Error(`Response status: ${response.status}: ${response.statusText}`);
			}

			return response;
		} finally {
			this.requestsInProgress--;
		}
	}

	public async logout() {
		await fetch(this.uri + "auth.php" + (this.debugParam ? '?'+this.debugParam : ''), {
			signal: AbortSignal.timeout(this.requestTimeout),
			method: "DELETE",
			mode: "cors",
			credentials: "include",
			headers: this.buildHeaders()
		});

		this.CSRFToken = "";
		this.accessToken = "";
		sessionStorage.removeItem("accessToken");
		this.fire("logout", this);
	}

	private static blobCache: Record<string, Promise<any>> = {};

	/**
	 * Generate a URL for a blob ID
	 *
	 * @param blobId
	 */
	public getBlobURL(blobId: string) : Promise<string> {

		if (!Client.blobCache[blobId]) {
			let type: undefined | string;
			Client.blobCache[blobId] = fetch(client.downloadUrl(blobId), {
				method: 'GET',
				credentials: "include",
				headers: this.buildHeaders()
			})
				.then(r => {

					type = r.headers.get("Content-Type") || undefined

					return r.arrayBuffer()

				})
				.then(ab => URL.createObjectURL(new Blob([ab], {type: type})));
		}

		return Client.blobCache[blobId];
	}


	/**
	 * Releases an existing object URL which was previously created by calling getBlobURL()
	 *
	 * @param blobId
	 */
	public async revokeBlobURL(blobId:string) {
		if(blobId in Client.blobCache) {
			URL.revokeObjectURL(await Client.blobCache[blobId]);
			delete Client.blobCache[blobId];
		}
	}

	/**
	 * Downloads a blob ID
	 *
	 * @param blobId
	 * @param filename
	 */
	public async downloadBlobId(blobId: string, filename: string) {
		// Create a URL for the blob
		const url = await this.getBlobURL(blobId)
		// Create an anchor element to "point" to it
		const anchor = document.createElement('a');
		anchor.href = url;

		anchor.download = filename;

		// Simulate a click on our anchor element
		anchor.click();

		console.log("Downloading: " + url);

		// Discard the object data
		// URL.revokeObjectURL(url);
		void this.revokeBlobURL(url);
	}


	public auth(data: LoginData | RegisterData | ForgottenData) {

		return fetch(this.uri + "auth.php" + (this.debugParam ? '?'+this.debugParam : ''), {
			signal: AbortSignal.timeout(this.requestTimeout),
			method: "POST",
			mode: "cors",
			credentials: "include",
			headers: this.buildHeaders(),
			body: JSON.stringify(data)
		});
	}

	public downloadUrl(blobId: string) {
		return this.uri + "download.php?blob=" + encodeURIComponent(blobId);
	}

	public pageUrl(path: string) {
		return `${this.uri}page.php/${path}`;
	}

	/**
	 * Default headers that will be added to each request
	 */
	public defaultHeaders : Record<string, string> = {
		'Content-Type': 'application/json'
	};

	private getDefaultHeaders() {

		const headers: Record<string, string> = {};
		for(const key in this.defaultHeaders) {
			headers[key] = this.defaultHeaders[key];
		}

		if(this.accessToken) {
			headers.Authorization =  "Bearer " + this.accessToken;
		}

		if(this.CSRFToken)
		{
			headers['X-CSRF-Token'] = this.CSRFToken;
		}
		return headers;
	}

	private buildHeaders(headers:Record<string, string> = {}) {
		return Object.assign(this.getDefaultHeaders(), headers);
	}

	/**
	 * Upload a file to the API
	 *
	 * @todo Progress. Not possible ATM with fetch() so we probably need XMLHttpRequest()
	 * @param file
	 */
	public upload(file: File): Promise<UploadResponse> {

		return fetch(this.uri + "upload.php" + (this.debugParam ? '?'+this.debugParam : ''), { // Your POST endpoint
			method: 'POST',
			credentials: "include",
			headers: this.buildHeaders({
				'X-File-Name': "UTF-8''" + encodeURIComponent(file.name),
				'Content-Type': file.type,
				'X-File-LastModified': Math.round(file['lastModified'] / 1000).toString()
			}),
			body: file
		}).then((response) => {
			if (response.status > 201) {
				throw response.statusText;
			}

			return response;
		}).then(response => response.json())
			.then(response => Object.assign(response, {file: file}))
	}

	/**
	 * Upload multiple files to the API
	 *
	 * @example
	 * ```
	 * btn({
	 * 	type: "button",
	 * 	text: t("Attach files"),
	 * 	icon: "attach_file",
	 * 	handler: async () => {
	 *
	 * 		const files = await browser.pickLocalFiles(true);
	 * 		this.mask();
	 * 		const blobs = await client.uploadMultiple(files);
	 * 		this.unmask();
	 * 	  console.warn(blobs);
	 *
	 * 	}
	 * })
	 * ```
	 * @param files
	 */
	public uploadMultiple(files: File[]) : Promise<UploadResponse[]> {
		const p = [];
		for(let f of files) {
			p.push(this.upload(f));
		}
		return Promise.all(p);
	}


	/**
	 * Execute JMAP method
	 *
	 * Multiple calls will be joined together in a single call on the next event loop
	 *
	 * @param method
	 * @param params
	 * @param callId Make sure this ID is unique if you pass it
	 */
	public jmap(method: string, params: Object = {}, callId: string|undefined = undefined): Promise<any> {
		if(callId === undefined) {
			callId = "call-" + (++this._lastCallCounter)
		}
		this._lastCallId = callId;
		const promise: Promise<Object> = new Promise((resolve, reject) => {

			this._requestData[callId!] = {
				reject: reject,
				resolve: resolve,
				params: params,
				method: method
			}
		})

		this._requests.push([method, params, callId]);

		this.delayedJmap();

		return promise;
	}


	/**
	 * Performs the requests queued in the jmap() method
	 *
	 * @private
	 */
	private doJmap() {
		this.request(this._requests)
			.then((response) => {
				return response.json();
			})
			.then((responseData) => {

				responseData.forEach((response: [method: string, response: Object, callId: string]) => {

					const callId = response[2];

					if (!this._requestData[callId]) {
						//aborted
						console.debug("Aborted", callId, response);
						return true;
					}

					const success = response[0] !== "error";

					if (success) {
						this._requestData[callId].resolve(response[1]);
					} else {
						this._requestData[callId].reject(response[1]);
					}

					delete this._requestData[callId];
				});
			}).catch((e) => {
				console.error(e);
				for(const callId in this._requestData) {
					// request level error: https://www.rfc-editor.org/rfc/rfc7807#section-3
					this._requestData[callId].reject({
						"type": "urn:ietf:params:go:error:connectionError",
						"status": 500,
						"detail": e ? `Error: type: ${e.name}, message: ${e.message}` :  "Connection error"

					});
					delete this._requestData[callId];
				}
			});

		this._requests = [];
	}

	/**
	 * When SSE is disabled we'll poll the server for changes every 2 minutes.
	 * This also keeps the token alive. Which expires in 30M.
	 */
	public updateAllDataSources(entities:string[]) {
		entities.forEach(function(entity) {

			const ds = jmapds(entity);
			ds.getState().then((state) => {
				if (state)
					ds.updateFromServer();
			});
		});
	}


	public startPolling(entities:string[]) {
		this.updateAllDataSources(entities);
		this.pollInterval =setInterval(() => {
			this.updateAllDataSources(entities);
		}, 60000);
	}

	public stopSSE() {
		if(this.SSEABortController) {
			this.SSEABortController.abort();
		}

		if(this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = undefined
		}
	}


	/**
	 * Initializes Server Sent Events via EventSource. This function is called in MainLayout.onAuthenticated()
	 *
	 * Note: disable this if you want to use xdebug because it will crash if you use SSE.
	 *
	 * @returns {Boolean}
	 */
	public async startSSE (entities:string[]) {
		try {

			this.SSELastEntities = entities;

			if(!this.SSEEventsRegistered) {
				this.registerSSEEvents();
			}

			if (!window.navigator.onLine){
				console.log("SSE not stated because we're offline");
				return false;
			}

			const session = this.session;
			if(!session)
			{
				return;
			}

			if (!session.eventSourceUrl) {
				console.debug("Server Sent Events (EventSource) is disabled on the server.");
				this.startPolling(entities);
				return false;
			}

			console.debug("Starting SSE");

			const url = this.uri + 'sse.php?types=' +		entities.join(',') + (this.debugParam ? '&'+this.debugParam : '');
			const headers = this.buildHeaders();
			delete headers['Content-Type'];


			// Event source will stop when document is hidden. Other tab is selected. When coming back check all sources for
			// updates
			document.addEventListener('visibilitychange', () => {
				if (!document.hidden) {
					this.updateAllDataSources(entities);
				}
			});

			this.SSEABortController = new AbortController()

			// let retry = 0;
			void fetchEventSource(url,{
				headers: headers,
				signal: this.SSEABortController.signal,
				onmessage: (msg) => {

					if(msg.event == "ping") {
						return;
					}

					let data;

					try {
						data = JSON.parse(msg.data);
					}catch(e) {
						console.warn(e);
						console.warn(msg.data);

						this.stopSSE();

						return;
					}
					for (let entity in data) {
						let ds = jmapds(entity);

						ds.getState().then(state => {
							if (!state || state == data[entity]) {
								//don't fetch updates if there's no state yet because it never was used in that case.
								return;
							}

							ds.updateFromServer();
						}).catch(e => {
							console.warn(e);
						})
					}

				},
				onclose: () => {
					// if the server closes the connection then retry.
					this.startSSE(entities);
				}
			})

		} catch (e) {
			console.error("Failed to start Server Sent Events. Perhaps the API URL in the system settings is invalid?", e);
		}
	}

	private registerSSEEvents() {
		this.SSEEventsRegistered = true;

		window.addEventListener('offline', () => {
			console.log("Closing SSE because we're offline")
			this.stopSSE();
		});

		window.addEventListener('online', () => {
			console.log("Starting SSE because we're online")
			this.startSSE(this.SSELastEntities!);
		});
	}
}

export const client = new Client();

if(window.GO) {
	client.uri = document.location.origin + BaseHref + "api/";
}

