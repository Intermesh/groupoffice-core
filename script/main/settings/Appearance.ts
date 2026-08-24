import {
	browser,
	btn,
	checkbox, comp,
	datasourceform,
	datasourcestore,
	fieldset,
	radio,
	select,
	t,
	textfield
} from "@intermesh/goui";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {userSettingsPanels} from "./UserSettingsWindow.js";
import {moduleDS} from "../../Modules";
import {userDS} from "../../auth";
import {languagefield} from "../../components/index.js";

userSettingsPanels.add(class Appearance extends AbstractSettingsPanel {

	constructor() {
		super("appearance", t("Appearance"), "palette");
		this.items.add(this.form = datasourceform({dataSource: userDS, cls: "autofit"},


				fieldset({legend: t("Theme"), minWidth: 300, flex: 1},
					radio({
					name: "theme",
					value: 'Paper',
					options: [
						{value: 'Paper', text:'Paper'},
						{value: 'Compact', text: 'Compact'}
					]
					}),

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
					}),

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
				fieldset({legend: t('Formatting'), minWidth: 300, flex: 1},
					textfield({name:'listSeparator', label: t('List separator')}),
					textfield({name:'textSeparator', label: t('Text separator')}),
					textfield({name:'thousandsSeparator', label: t('Thousand separator')}),
					textfield({name:'decimalSeparator', label: t('Decimal separator')}),
					textfield({name:'currency', label: t('Currency')}),
				),

				fieldset({legend: t('Global'), minWidth: 300, flex: 1},
					// select({name: 'start_module', label: t("Start in module"), listeners: {render: e => e.target.store!.load()}, store: datasourcestore({dataSource:moduleDS}), valueField: "name", textRenderer: record => record.title}),
					select({name: 'max_rows_list', label:t("Maximum items in list"), options: [
							{text: '10', value: 10},
							{text: '20', value: 20},
							{text: '50', value: 50},
					]}),
					select({name: 'sort_name', label: t("Sort names by"), options: [
						{value: 'first_name', text: t("First name")},
						{value: 'last_name', text: t("Last name")}
					]}),
					checkbox({name: 'enableSendShortcut',label:t("Use shortcut to send forms")+` (${browser.isMac() ? "⌘" : "Ctrl"} + Enter)`}),
					checkbox({name: 'show_smilies',label: t("Show smilies")}),
					checkbox({name: 'auto_punctuation',label: t("Capital after punctuation")}),
					checkbox({name: 'confirmOnMove',label: t("Show confirmation dialog on move"),
						hint: t("When this is on and items are moved by dragging, confirmation is requested")}),
				),
				fieldset({legend: t("Regional"), minWidth: 300, flex: 1},
					languagefield(),
					select({name: 'timezone', label: t("Timezone"), options: Intl.supportedValuesOf('timeZone').map(tz => {return {value: tz, text: tz};})}),
					select({name: 'dateFormat', label: t("Date format"), options: [
							{value: 'd-m-Y', text: t("Day-Month-Year",'users','core')},
							{value: 'm/d/Y', text: t("Month/Day/Year",'users','core')},
							{value: 'd/m/Y', text: t("Day/Month/Year",'users','core')},
							{value: 'd.m.Y', text: t("Day.Month.Year",'users','core')},
							{value: 'Y-m-d', text: t("Year-Month-Day",'users','core')},
							{value: 'Y.m.d', text: t("Year.Month.Day",'users','core')}
						]}),

					select({name: 'timeFormat', label: t("Time format"), options:[
							{value: 'G:i', text: t('24 hour format','users','core')},
							{value: 'g:i a', text: t('12 hour format','users','core')}
						]}),

					checkbox({name: 'shortDateInList',label: t("Use short format for date and time in lists")}),

					select({name: 'firstWeekday', label: t("First weekday"), options:[
						{value: '0', text:  t('Sunday','users','core')},
						{value: '1', text: t('Monday','users','core')}
					] }),
					// select({name: 'holidayset',label: t("Holidays"), options:[]}), // GO.lang.holidaySets ? Deprecate in favour of new calendar holidays?
				)
			))

	}
});