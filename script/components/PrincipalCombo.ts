import {AutocompleteEventMap, BaseEntity, ComboBox, ComboBoxConfig, createComponent, t} from "@intermesh/goui";
import {jmapds} from "../jmap";
import {Principal, User} from "../auth";



export class PrincipalCombo extends ComboBox {

	constructor(entity?:string) {

		super(jmapds<Principal>("Principal"));

		this.name = "userId";

		if(entity === 'User') {
			this.label = t("User");
			this.filter = {entity: 'User'};
		}
	}
}

export type PrincipalComboConfig = Omit<ComboBoxConfig<PrincipalCombo>, "dataSource"> & {
	entity?: string
}

export const principalcombo = (config?:PrincipalComboConfig) => createComponent(new PrincipalCombo(config?.entity), config);

