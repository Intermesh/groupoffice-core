import {AutocompleteEventMap, BaseEntity, ComboBox, ComboBoxConfig, createComponent, t} from "@intermesh/goui";
import {jmapds} from "../jmap";
import {User} from "../auth";



export class UserDisplayCombo extends ComboBox {

	constructor() {

		super(jmapds<User>("UserDisplay"), 'displayName');

		this.label = t("User", );
		this.name = "userId";

		this.filterName = "text";
	}
}

export const userdisplaycombo = (config?: ComboBoxConfig<UserDisplayCombo>) => createComponent(new UserDisplayCombo(), config);