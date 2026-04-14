import {AbstractSettingsPanel} from "./AbstractSettingsPanel";
import {btn, checkbox, datasourceform, fieldset, Notifier, t} from "@intermesh/goui";
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
			),
			fieldset({legend: "Notifications"},
				btn({text:'Event'}).on('click', _ => {
					Notifier.notify({title:'test', text:'test', icon:{name:'event', color:'darkred'}, category:'event'})
				}),
				btn({text:'Progress'}).on('click', _ => {
					Notifier.notify({title:'test', text:'test', icon:{name:'upload', color:'tail'},category:'progress'})
				}),
				btn({text:'Message'}).on('click', _ => {
					Notifier.notify({title:'test', text:'test', icon:{name:'comment'},category:'message'})
				}),
				btn({text:'Actions'}).on('click', _ => {
					Notifier.notify({title:'test', text:'test', icon:{name:'task', color:'purple'},category:'message', actions:{}})
				}),
				btn({text:'Toast'}).on('click', _ => {
					Notifier.notify({title:'test', text:'test', icon:{name:'info', color:'blue'},category:'status'})
				}),
				btn({text:'System'}).on('click', _ => {
					Notifier.notify({title:'test', text:'test', icon:{name:'battery_alert', color:'orange'},category:'system'})
				}),
				btn({text:'Error'}).on('click', _ => {
					Notifier.notify({title:'test', text:'test', icon:{name:'error', color:'red'},category:'error'})
				}),
				btn({text:'Alarm'}).on('click', _ => {
					Notifier.notify({title:'test', text:'test', icon:{name:'alarm', color:'green'},category:'alarm'})
				}),
			)
		));
	}
});