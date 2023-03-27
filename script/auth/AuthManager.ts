import {User} from "./User.js";
import {client, root} from "@intermesh/goui";

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
			let user = await client.isLoggedIn();
			root.unmask();
			while (!user) {
				await this.showLogin();
				user = await client.isLoggedIn();
			}

			resolve(user);
		});

		return this._requireLogin;
	}
	private showLogin() {
		return new Promise<void>((resolve, reject) => {
			import("./Login.js").then((mods) => {

				const login = new mods.Login();
				login.show();

				login.on('login', () => {
					resolve();
				});

				login.on('cancel', () => {
					reject();
				})
			})
		});
	}
}

export const authManager = new AuthManager();