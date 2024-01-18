import {AutocompleteEventMap, BaseEntity, ComboBox, ComboBoxConfig, createComponent, t} from "@intermesh/goui";
import {jmapds} from "../jmap";
import {Principal, User} from "../auth";



export class PrincipalCombo extends ComboBox {

	constructor(entity:string) {

		super(jmapds<Principal>("Principal"));

		this.name = "userId";

		if(entity === 'User') {
			this.label = t("User");
			this.filter = {entity: 'User'};
		}
	}

	pickerRecordToValue(_field: this, record: Principal): string {
		return record.id.split(':').pop();
	}
}

export const principalcombo = (config?: Omit<ComboBoxConfig<PrincipalCombo>, "dataSource">) => createComponent(new PrincipalCombo(), config);

// backwards-compat
export const userdisplaycombo = (config?: Omit<ComboBoxConfig<PrincipalCombo>, "dataSource">) => createComponent(new PrincipalCombo('User'), config);