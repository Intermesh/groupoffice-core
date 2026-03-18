import {AbstractSettingsPanel} from "./AbstractSettingsPanel";
import {checkbox, datasourceform, fieldset, t} from "@intermesh/goui";
import {settingsPanels} from "./SettingsWindow";
import {userDS} from "../../auth";

settingsPanels.add(class Notifications extends AbstractSettingsPanel {
	constructor() {
		super("notifications", t("Notifications"), "alarm");

		this.items.add(this.form = datasourceform({dataSource: userDS, cls:'autofit'},
			fieldset({legend: "Notifications"},
				checkbox({name: 'mail_reminders', label: t("Mail reminders")}),
			), fieldset({legend: "Sounds"},
				checkbox({name: 'mute_sound', label: t("Mute all sounds")}).on('setvalue', ({target,newValue}) => {
					target.nextSibling()!.disabled = newValue;
					target.nextSibling()!.nextSibling()!.disabled = newValue;
				}),
				checkbox({name: 'mute_reminder_sound', label: t("Mute reminder sounds")}),
				checkbox({name: 'mute_new_mail_sound', label: t("Mute new mail sounds")})
			)
		));
	}
});