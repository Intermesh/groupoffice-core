import {User} from "./User.js";
import {root} from "@intermesh/goui";
import {client} from "../jmap/index.js";
import {Login} from "./Login.js";

/**
 * Authentication manager
 */
class AuthManager {

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

			if(client.isLoggedIn()) {
				resolve(client.user!);
			}

			root.unmask();

			while (!client.user) {
				await this.showLogin();
			}

			resolve(client.user);
		});

		return this._requireLogin;
	}
	private showLogin() {
		return new Promise<void>((resolve, reject) => {
			const login = new Login();
			login.show();

			login.on('login', () => {
				resolve();
			});

			login.on('cancel', () => {
				reject();
			})
		})

	}
}

export const authManager = new AuthManager();