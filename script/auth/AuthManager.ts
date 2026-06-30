import {User} from "./User.js";
import {Observable, ObservableEventMap, root} from "@intermesh/goui";
import {client} from "../jmap/index.js";
import {LoginWindow} from "./LoginWindow.js";

interface AuthManagerEventMap extends ObservableEventMap {
	login: {loginWindow: LoginWindow}
}

/**
 * Authentication manager
 */
class AuthManager extends Observable<AuthManagerEventMap> {

	private _requireLogin?: Promise<User>;

	/**
	 * Will continue if user is authenticated and present login dialog if not
	 *
	 * @todo what if there are concurrent requests to this method?
	 */
	public async requireLogin(): Promise<User> {

		if(this._requireLogin) {
			return this._requireLogin;
		}

		this._requireLogin = new Promise(async (resolve) => {

			root.mask();

			await client.authenticate();

			root.unmask();

			while(!client.isLoggedIn()) {
				await this.showLogin();
			}

			resolve(client.user);
		});

		return this._requireLogin;
	}
	private showLogin() {
		return new Promise<void>((resolve, reject) => {
			const loginWindow = new LoginWindow();

			this.fire("login", {loginWindow})
			loginWindow.show();

			loginWindow.on('login', () => {
				resolve();
			});

			loginWindow.on('cancel', () => {
				reject();
			})
		})

	}
}

export const authManager = new AuthManager();