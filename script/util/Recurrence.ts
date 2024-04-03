/**
 * Recurrenence rule inspired by:
 * https://github.com/kewisch/ical.js/blob/main/lib/ical/recur_iterator.js
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch
 */

import { datetime, RRule} from 'rrule'
import {DateTime, Timezone} from "@intermesh/goui";

interface RecurrenceConfig {
	rule: RecurrenceRule
	timeZone:Timezone
	dtstart: Date
}

type NDay = { day: string, nthOfPeriod?: number };
export type Frequency = "yearly" | "monthly" | "weekly" | "daily" //| "hourly"
type DayOfWeek = 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su'
export type RecurrenceRule = {
	frequency: Frequency
	interval?: number
	skip?: 'omit' | 'backward' | 'forward'
	firstDayOfWeek?: DayOfWeek
	count?: number
	until?: string
	byDay?: NDay[]
	byMonthDay?: number[]
	byMonth?: string[] //'1'= january
	bySetPosition?: number[]
	byWeekNo?: number[]
	byYearDay?: number[]
	byHour?: number[]
}
/**
 * Class for looping date for Recurrence Rule
 *
 * @category Utility
 */
export class Recurrence {

	private rrule?: RRule
	private timeZone?: Timezone
	private config: RecurrenceConfig;

	private dayNb(shortName: string) {
		return {
			'mo':RRule.MO,
			'tu':RRule.TU,
			'we':RRule.WE,
			'th':RRule.TH,
			'fr':RRule.FR,
			'sa':RRule.SA,
			'su':RRule.SU,
		}[shortName.toLowerCase()];
	}

	private byWeekDay(input: NDay[]) {
		return input.map(i => {
			const d = this.dayNb(i.day)!;
			if(i.nthOfPeriod){
				d.nth(i.nthOfPeriod)
			}
			return d;
		});
	}

	constructor(config: RecurrenceConfig) {

		const cfg: any = {
			freq: {
				"daily": RRule.DAILY,
				"weekly": RRule.WEEKLY,
				"monthly": RRule.MONTHLY,
				"yearly": RRule.YEARLY
			}[config.rule.frequency],
			dtstart: this.makeDate(config.dtstart, true)
		};
		if(config.timeZone) {
			this.timeZone = config.timeZone;
			cfg.tzid = config.timeZone
		}

		if(config.rule.interval) cfg.interval = config.rule.interval;
		if(config.rule.until) {
			const date = config.rule.until.substring(0,10),
				time = config.rule.until.substring(11);
			let [h,i,s] = time.split(':').map(i => +i) as [number,number,number];
			if(!time) {
				h=23; i=59; s=59;
			}
			const [y,m,d] = date.split('-').map(i => +i) as [number,number,number];

			cfg.until = datetime(y,m,d, h,i,s);
		}
		if(config.rule.count) cfg.count = config.rule.count;

		if(config.rule.firstDayOfWeek) cfg.wkst = this.dayNb(config.rule.firstDayOfWeek);
		if(config.rule.byDay) cfg.byweekday = this.byWeekDay(config.rule.byDay);
		if(config.rule.byMonthDay) cfg.bymonthday = config.rule.byMonthDay;
		if(config.rule.byMonth) cfg.bymonth = config.rule.byMonth;
		if(config.rule.bySetPosition) cfg.bysetpos = config.rule.bySetPosition;
		if(config.rule.byWeekNo) cfg.byweekno = config.rule.byWeekNo;
		if(config.rule.byYearDay) cfg.byyearday = config.rule.byYearDay;
		//if(config.rule.byHour) cfg.count = config.rule.count;

		this.config = config;
		try {
			this.rrule = new RRule(cfg);
		} catch (e) {
			console.error("Failed to parse rrule: ", cfg);
		}
	}

	private makeDate(d: Date, withTime?: boolean) {
		//d = (new DateTime(d)).toTimezone('UTC').date;
		return withTime ? datetime(d.getFullYear(), d.getMonth()+1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()):
			datetime(d.getFullYear(), d.getMonth()+1, d.getDate());
	}

	*loop(start:DateTime, end: DateTime){
		if(!this.rrule) {
			yield new DateTime(this.config.dtstart);
			return;
		}
		const dates = this.rrule.between(this.makeDate(start.date),this.makeDate(end.date));
		for(const d of dates) {
			const dt = new DateTime(`${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()} ${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()}`);
			yield this.timeZone ? dt.toTimezone(this.timeZone) : dt;


			// if(this.timeZone) {
			// 	yield d.toTimezone(this.timeZone);
			// } else
			// 	yield d;
		}
	}

}