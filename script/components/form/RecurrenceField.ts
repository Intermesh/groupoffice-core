/**
 * @license https://github.com/Intermesh/goui/blob/main/LICENSE MIT License
 * @copyright Copyright 2023 Intermesh BV
 * @author Michael de Hart <mdhart@intermesh.nl>
 */

import {RecurrencePicker} from "../picker/RecurrencePicker.js";
import {RecurrenceRule} from "../../util/Recurrence.js";
import {
	Field, FieldConfig, FieldEventMap,
	menu, btn, Button, createComponent, DateTime,
	t, E, Format
} from "@intermesh/goui";

export interface RecurrenceField extends Field {
	set value(v:RecurrenceRule|null)
}

export class RecurrenceField extends Field {

	private readonly picker: RecurrencePicker
	private readonly pickerButton: Button;

	protected control: HTMLInputElement | undefined

	protected baseCls = 'goui-form-field recurrence';

	constructor() {
		super();

		this.picker = new RecurrencePicker(new DateTime());
		this.picker.on('select', ({rule}) => {

			this.pickerButton.menu!.hide();
			this.clearInvalid();
			this.focus();

			this.value = rule;
			this.control!.value = RecurrenceField.toText(rule!, this.picker.startDate);
		});

		this.buttons = [
			this.pickerButton = btn({
				icon: "expand_more",
				menu:
					menu({
							alignTo:  this.el,
							alignToInheritWidth: true
						},
						this.picker
					)
			})
		]
	}

	protected internalSetValue(v?: any) {
		if(this.control) {
			this.control.value = RecurrenceField.toText(v, this.picker.startDate);
		}
		this.picker.setValue(v);
	}

	protected createControl() {
		this.control = E('input').attr('type', 'text').attr('readOnly', true).cls('text');
		this.control.value = t('Not recurring'); // default state until changed
		return this.control;
	}
	setStartDate(date: DateTime) {
		this.picker.setStartDate(date);
		if(this.control)
			this.control.value = RecurrenceField.toText(this.value, this.picker.startDate);
	}

	static toText(rule: RecurrenceRule|null, start: DateTime) {
		const rr = rule;
		if (!rr || !rr.frequency) {
			return t('Not recurring');
		}
		const record = RecurrencePicker.frequencies[rr.frequency];
		if (!record) {
			return "Unsupported frequency: " + rr.frequency;
		}
		let str = record[4];
		if (rr.interval) {
			str = t('Every') + ' ' + rr.interval + ' ' + record[rr.interval > 1 ? 1 : 0];
		}
		if (rr.byDay) {
			let
				days = [],
				workdays = (rr.byDay.length === 5);
			for (var i = 0; i < rr.byDay.length; i++) {
				if (rr.byDay[i].day.toLowerCase() == 'sa' || rr.byDay[i].day.toLowerCase() == 'su') {
					workdays = false;
				}
				var nthDay = '';
				if (rr.byDay[i].nthOfPeriod) {
					nthDay = t('the') + ' ' + RecurrenceField.getSuffix(rr.byDay[i].nthOfPeriod!) + ' ';
				}
				if(rr.bySetPosition && rr.bySetPosition[i]) {
					nthDay = t('the') + ' ' + RecurrenceField.getSuffix(rr.bySetPosition[i]) + ' ';
				}
				days.push(nthDay + DateTime.dayNames[rr.byDay[i].day.toLowerCase()]);
			}
			if (workdays) {
				days = [t('Workdays')];
			}
			str += (' ' + t('at ') + days.join(', '));
		} else if(rr.frequency == 'weekly') {
			str += (' ' + t('at ') + start.format('l'));
		}
		if (rr.byMonthDay) {
			str += (' ' + t('at day') + ' ' + rr.byMonthDay.join(', '))
		}

		if (rr.count) {
			str += ', ' + rr.count + ' ' + t('times');
		}
		if (rr.until) {
			str += ', ' + t('until') + ' ' + Format.date(new DateTime(rr.until));
		}
		return str;
	}

	private static getSuffix(week: number) {
		switch (week) {
			case 1:
				return t("first");
			case 2:
				return t("second");
			case 3:
				return t("third");
			case 4:
				return t("fourth");
			case 5:
				return t("fifth");
			default:
				return t("last");
		}
	}
}

/**
 * Shorthand function to create {@see RecurrenceField}
 *
 * @param config
 */
	export const recurrencefield = (config?: FieldConfig<RecurrenceField>) => createComponent(new RecurrenceField(), config);