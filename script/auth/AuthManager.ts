import {User} from "./User.js";
import {client} from "@goui/jmap/Client.js";

/**
 * Authentication manager
 */
class AuthManager {

	/**
	 * Will continue if user is authenticated and present login dialog if not
	 *
	 * @todo what if there are concurrent requests to this method?
	 */
	public async requireLogin(): Promise<User> {

		const user = await client.isLoggedIn();

		if (!user) {
			await this.showLogin();
			return this.requireLogin();
		} else {
			return user;
		}
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