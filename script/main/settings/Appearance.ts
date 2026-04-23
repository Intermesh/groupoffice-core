import {
	btn,
	checkbox,
	comp, datasourceform,
	datasourcestore,
	fieldset,
	hiddenfield,
	radio,
	select,
	t, textfield
} from "@intermesh/goui";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {settingsPanels} from "./SettingsWindow.js";
import {moduleDS} from "../../Modules";
import {userDS} from "../../auth";

settingsPanels.add(class Appearance extends AbstractSettingsPanel {

	constructor() {
		super("appearance", t("Appearance"), "palette");
		this.items.add(this.form = datasourceform({dataSource: userDS, cls:'autofit'},
			fieldset({legend: "Theme"}, // TODO: only visible if (GO.settings.config.allow_themes)
				radio({name: "theme", value: 'Paper', options: [
						{value: 'Paper',text:'Paper'},
						{value: 'Compact', text: 'Compact'}
				]}),
				comp({cls: 'go-theme-color'},
					radio({name: 'themeColorScheme',type:'button', options:[
						{value:'light', text: t('Light')}, //cls:'mode-light'
						{value:'dark', text: t('Dark')},
						{value:'system', text: t('System default')}
					]}).on('setvalue',({target,newValue}) => {
						const bcl = document.body.classList;
						['light','dark','system'].forEach(name => {
							bcl.remove(name);
						});
						bcl.add(newValue);
						if(newValue === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
							bcl.add('dark');
						}
						// if(bcl.contains("dark") && document.getElementsByTagName("meta")["theme-color"]) {
						// 	document.getElementsByTagName("meta")["theme-color"].content = "#202020";
						// }
					})
				),
				btn({text: t('Reset windows and grids')}).on('click', e => {
					if(!this.user) return;
					// OLD FRAMEWORK CODE, refactor when clientSettings: {} property is available for User
					if(confirm(t('Are you sure you want to reset all grid columns, windows, panel sizes etc. to the factory defaults?'))){
						GO.request({url:'maintenance/resetState',
							params:{
								user_id: this.user.id
							},
							success(){document.location.reload();}
						});
					}
				})
			),
			fieldset({legend: t('Formatting'), width: 200},
				textfield({name:'listSeparator', label: t('List separator')}),
				textfield({name:'textSeparator', label: t('Text separator')}),
				textfield({name:'thousandsSeparator', label: t('Thousand separator')}),
				textfield({name:'decimalSeparator', label: t('Decimal separator')}),
				textfield({name:'currency', label: t('Currency')}),
			),
			fieldset({legend: t('Global')},
				select({name: 'start_module', label: t("Start in module"), store: datasourcestore({dataSource:moduleDS})}),
				select({name: 'max_rows_list', label:t("Maximum items in list"), options: [
					{'10':10},{'15':15},{'20':20},{'25':25},{'30':30},{'50':50}
				]}),
				select({name: 'sort_name', label: t("Sort names by"), options: [
					{'first_name':t("First name")},
					{'last_name':t("Last name")}
				]}),
				checkbox({name: 'enableSendShortcut',label:t("Use shortcut to send forms")+` (${Ext.isMac?"⌘":"Ctrl"} + Enter)`}),
				checkbox({name: 'show_smilies',label: t("Show smilies")}),
				checkbox({name: 'auto_punctuation',label: t("Capital after punctuation")}),
				checkbox({name: 'confirmOnMove',label: t("Show confirmation dialog on move"),
					hint: t("When this is on and items are moved by dragging, confirmation is requested")}),
			),
			fieldset({legend: t("Regional")},
				select({name: 'language', label: t("Language"), options:[
					// go.form.LanguageCombo
				]}),
				select({name: 'timezone', label: t("Timezone"), options:[]}), // go.TimeZones
				select({name: 'dateFormat', label: t("Date format"), options:[]}),// go.util.Format.dateFormats
				select({name: 'timeFormat', label: t("Time format"), options:[]}),// go.util.Format.timeFormats
				checkbox({name: 'shortDateInList',label: t("Use short format for date and time in lists")}),

				select({name: 'firstWeekday', label: t("First weekday"), options:[
					{'0': t('Sunday','users','core')},
					{'1': t('Monday','users','core')}
				] }),
				select({name: 'holidayset',label: t("Holidays"), options:[]}), // GO.lang.holidaySets
			)
		))
	}
});