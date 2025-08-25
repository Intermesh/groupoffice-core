/**
 * @license https://github.com/Intermesh/goui/blob/main/LICENSE MIT License
 * @copyright Copyright 2023 Intermesh BV
 * @author Michael de Hart <mdhart@intermesh.nl>
 */
import {
	btn,
	CardContainer,
	CardContainerEventMap, CheckboxField, checkboxgroup, comp, form,
	Component, datefield,
	DateField,
	DateTime, Field,
	Form, Menu, numberfield,
	NumberField, select,
	t, tbar, textfield, Listener, ObservableListenerOpts, CheckboxGroup, SelectField
} from "@intermesh/goui";
import {Frequency, RecurrenceRule} from "../../util/Recurrence.js";

export interface RecurrencePickerEventMap extends CardContainerEventMap {
	select: {rule: RecurrenceRule | null}
}


type FrequencyDefaults = [text: string, plural: string, repeatDefault: number, untilDefault: string, frequencyText: string]

export class RecurrencePicker extends CardContainer<RecurrencePickerEventMap> {

	protected baseCls = "recurrencepicker";

	form: Form
	menu: Component
	weekOfMonth = 1

	startDate: DateTime

	count: NumberField
	until: DateField

	rule!: RecurrenceRule | null
	private readonly weeklyOptions: CheckboxGroup
	private readonly monthlyOptions: Component

	static frequencies: { [freq: string]: FrequencyDefaults } = {
		'daily': [t("day"), t('days'), 30, '30-d', t('Daily')],
		'weekly': [t("week"), t('weeks'), 13, '91-d', t('Weekly')],
		'monthly': [t("month"), t('months'), 12, '1-y', t('Monthly')],
		'yearly': [t("year"), t('years'), 5, '5-y', t('Annually')]
	}


	constructor(startDate: DateTime) {
		super();
		this.startDate = startDate;
		//this.width = 450;
		// value = current weekday?

		this.weeklyOptions = checkboxgroup({
			itemId: 'weeklyOptions',
			label: "Weekdays",
			options: [0, 1, 2, 3, 4, 5, 6].map(i => {
				return {label: DateTime.dayNames[DateTime.dayMap[i]].substring(0, 2), name: DateTime.dayMap[i]}
			})
		});
		this.monthlyOptions = comp({cls: 'flow', hidden: true},
			comp({text: t('at the'), width:50, style:{alignSelf: 'center'}}),
			select({
				disabled: true,
				name: 'monthlyType',
				itemId: 'monthlyOptions',
				width: 200,
				value: 'byMonthDay',
				options: [
					{value: 'byMonthDay', name: this.startDate.format('jS')},
					{value: 'byDay', name: this.getSuffix() + ' ' + this.startDate.format('l')}
				]
			})
		);

		this.menu = comp({cls:'vbox'}, ...this.quickMenuItems());

		const intervalField =  numberfield({
			decimals: 0,
			name: 'interval',
			itemId: 'interval',
			min: 1,
			width: 70,
			value: 1
		});

		const frequencyField = select({
			name: 'frequency',
			itemId: 'frequency',
			width: 140,
			textRenderer: r => intervalField.value == 1 ? r.text : r.plural,
			options: Object.keys(RecurrencePicker.frequencies).map(k => ({
				value: k,
				text: RecurrencePicker.frequencies[k as Frequency][0],
				plural: RecurrencePicker.frequencies[k as Frequency][1]
			})),
			listeners: {
				'change': ({newValue}) => {
					this.changeFrequency(newValue);
				}
			}
		});

		intervalField.on('setvalue', ({newValue, oldValue}) => {
			if (oldValue == 1 && newValue != 1 || oldValue != 1 && newValue == 1) {
				frequencyField.drawOptions();
			}
		});


		this.count = numberfield({
			itemId: 'repeatCount',
			name: 'count',
			hidden: true,
			max: 1000,
			width: 80,
			value: 13,
			decimals: 0,
			hint: t('times') // should be suffix
		});
		this.until = datefield({
			itemId: 'endDate',
			name: 'until',
			min: this.startDate,
			width: 180,
			hidden: true,
			required: false
		});
		this.form = form({width:496},
			comp({cls: 'flow pad'},
				comp({text: t('Every'), width:50, style:{alignSelf: 'center'}}),
				intervalField,
				frequencyField,

				this.monthlyOptions,
				this.weeklyOptions,
				textfield({
					hidden: true, name: 'byDay', listeners: {
						change: ({newValue}) => {
							for (let j = 0; j < 7; j++) {
								const cb = this.weeklyOptions.items.get(j) as CheckboxField;
								cb.value = newValue.indexOf(cb.name) !== -1;
							}
						}
					}
				}),
				comp({cls: 'flow', flex:1},
					comp({html: t("Ends"), width:50, style:{alignSelf: 'center'} }),
					select({
						width: 160,
						name: 'endsRadio',
						value: 'forever',
						textRenderer: r => r.text,
						options: [
							{text: t("Never"), value: 'forever'},
							{text: t("After"), value: 'count'},
							{text: t("At"), value: 'until'}
						],
						listeners: {
							setvalue: ({newValue}) => {
								this.count.hidden = this.count.disabled = (newValue != 'count');
								this.until.hidden = this.until.disabled = (newValue != 'until');
							}
						}
					}),
					this.count,
					this.until
				)

			),
			tbar({},
				btn({
					text: t('Back'),
					handler: _b => {
						this.activeItem = 0;
					}
				}),
				comp({flex: 1}),
				btn({
					text: t('Ok'),
					handler: _b => {
						this.setValue(this.createCustomRule(this.form.value));
						(this.parent! as Menu).close();
						this.activeItem = 0;
					}
				})
			)
		)
		this.items.add(this.menu, this.form);
	}

	quickMenuItems() {
		const style = {textAlign:'left'};
		return [
			btn({style,
				text: t('Not recurring'),
				handler: _ => this.setValue(null)
			}),
			comp({tagName: 'hr'}),
			btn({style,
				text: t('Daily'),
				handler: _ => this.setValue({frequency: 'daily'})
			}),
			btn({style,
				text: t('Weekly') + ' ' + t('at ') + this.startDate.format('l'),
				handler: _ => this.setValue({frequency: 'weekly'})
			}),
			btn({style,
				text: t('Monthly') + ' ' + t('at day') + ' ' + this.startDate.format('j'),
				handler: _ => this.setValue({frequency: 'monthly', byMonthDay: [+this.startDate.format('j')]})
			}),
			btn({style,
				text: t('Monthly') + ' ' + t('at the') + ' ' + this.getSuffix() + ' ' + this.startDate.format('l'),
				handler: _ => this.setValue({
					frequency: 'monthly',
					byDay: [{day: DateTime.dayMap[this.startDate.getWeekDay()], nthOfPeriod: this.weekOfMonth}]
				})
			}),
			btn({style,
				text: t('Annually') + ' ' + t('at ') + this.startDate.format('j F'),
				handler: _ => this.setValue({frequency: 'yearly'})
			}),
			btn({style,
				text: t('Each working day'),
				handler: _ => this.setValue({
					frequency: 'weekly',
					byDay: [{day: 'mo'}, {day: 'tu'}, {day: 'we'}, {day: 'th'}, {day: 'fr'}]
				})
			}),
			comp({tagName: 'hr'}),
			btn({style,
				text: t('Customize') + '...', handler: () => {
					// collapse menu, open form
					this.changeFrequency(this.rule?.frequency || 'yearly');

					// fix the height so no jumping of menu occurs
					this.height = this.height;
					this.activeItem = 1;



				}
			})
		];
	}

	createCustomRule(values: any) {
		const rule = {frequency: values.frequency} as RecurrenceRule;
		if (values.interval != 1) rule.interval = values.interval;
		if (values.until && values.endsRadio === 'until') rule.until = values.until
		if (values.count && values.endsRadio === 'count') rule.count = values.count;
		if (values.monthlyType) {
			switch (values.monthlyType) {
				case 'byMonthDay':
					rule.byMonthDay = [parseInt(this.startDate.format('j'))];
					break;
				case 'byDay':
					rule.byDay = [{
						day: DateTime.dayMap[this.startDate.getWeekDay()],
						nthOfPeriod: this.weekOfMonth
					}];
					break;
			}
		}
		if(rule.frequency === 'weekly') {
			['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'].forEach(day => {
				if(values[day])
					(rule.byDay ??= []).push({day});
			});
		}

		return rule;
	}

	setStartDate(date: DateTime) {
		this.startDate = date.clone();
		this.weekOfMonth = Math.ceil(date.getDate() / 7);


		const monthOpt = this.form.findChild('monthlyOptions')! as SelectField;
		monthOpt.options = [
			{value: 'byMonthDay', name: this.startDate.format('jS')},
			{value: 'byDay', name: this.getSuffix() + ' ' + this.startDate.format('l')}
		];

		if(date.clone().addDays(7).getMonth() != this.startDate.getMonth()) {
			this.weekOfMonth = -1;
			monthOpt.options.push({value: 'byDay', name: this.getSuffix() + ' ' + this.startDate.format('l')});
		}

		this.menu.items.clear().add(...this.quickMenuItems());

		monthOpt.drawOptions();
	}

	changeFrequency(f: Frequency) {
		const record = RecurrencePicker.frequencies[f]; // 2 = repeat default, 3 = until default
		// set defaults for endAt fields
		(this.form.findChild('frequency')! as Field).value = f;
		const repeat = this.count
		if (repeat.disabled) {
			repeat.value = record[2]; // repeatDefault
		}
		const until = this.until;
		if (until.disabled) {
			const add: string[] = record[3].split('-'); // untilDefault
			const untilDate = add[1] == 'd' ? this.startDate.clone().addDays(parseInt(add[0])) : this.startDate.clone().addYears(parseInt(add[0]))
			until.value = untilDate.format('Y-m-d');
		}

		// show-n-hide option panels for week and month frequency
		this.weeklyOptions.hidden = this.weeklyOptions.disabled = (f != 'weekly');
		this.form.findChild('monthlyOptions')!.disabled = this.monthlyOptions.hidden = (f != 'monthly');
	}

	private static suffixText = [t("first"),t("second"),t("third"),t("fourth"),t("fifth")]
	private getSuffix(week?: number) {
		return RecurrencePicker.suffixText[(week || this.weekOfMonth)-1] || t('last');
	}

	setValue(rrule: RecurrenceRule | null) {
		if (this.rule == rrule) return;
		this.rule = rrule;
		this.fire('select', {rule: rrule});

		const form = this.form;
		if (rrule && rrule.frequency) {
			form.value = rrule;
			this.changeFrequency(rrule.frequency);
			if (rrule.until) {
				form.findField('endsRadio')!.value = 'until';
				this.until.value = rrule.until;
			} else if (rrule.count) {
				form.findField('endsRadio')!.value = 'count';
				this.count.value = rrule.count;
			} else {
				form.findField('endsRadio')!.value = 'forever';
			}
			if (rrule.byDay) {
				if(rrule.frequency === 'weekly') {
					rrule.byDay.forEach(nDay => {
						const f = form.findField(nDay.day);
						if(!f) {
							console.error("Unsupported weekday: ", nDay);
							return;
						}
						f.value = true;
					});
					// ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'].forEach(day => {
					// 	if(values[day])
					// 		(rule.byDay ??= []).push({day});
					// });
					//form.findField('weeklyOptions')!.value = rrule.byDay;
				} else if(rrule.frequency === 'monthly') {
					form.findField('monthlyOptions')!.value = 'byDay';
				}
			}
			if (rrule.byMonthDay) {
				form.findField('monthlyOptions')!.value = 'byMonthDay';
			}
		}
	}
}