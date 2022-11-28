import {User} from "./User.js";
import {client} from "@goui/jmap/Client.js";

class AuthManager {

	private requireLoginPromise?: Promise<any>;

	public requireLogin(): Promise<User> {

		if (!this.requireLoginPromise) {
			this.requireLoginPromise = new Promise<void>((resolve, reject) => {
				if (client.accessToken) {
					resolve();
				} else {
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
				}
			});
		}

		return this.requireLoginPromise.then(() => {
			return client.isLoggedIn().then(user => {
				if (!user) {
					this.requireLoginPromise = undefined;
					return this.requireLogin();
				} else {
					return user;
				}
			}).catch(() => {
				this.requireLoginPromise = undefined;
				return this.requireLogin();
			});
		})
	}

}

export const authManager = new AuthManager();