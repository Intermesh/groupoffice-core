/**
 * Recurrenence rule inspired by:
 * https://github.com/kewisch/ical.js/blob/main/lib/ical/recur_iterator.js
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch
 */

//import { datetime, RRule} from '@akiflow/rrule'
import ICAL from "ical.js";
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

	private rrule?: ICAL.RecurIterator
	private timeZone?: Timezone
	private config: RecurrenceConfig;

	private dayNb(shortName: string) {
		return {'mo':2, 'tu':3, 'we':4, 'th':5, 'fr':6, 'sa':7, 'su':1}[shortName.toLowerCase()];
	}

	constructor(config: RecurrenceConfig) {
		this.config = config;

		const cfg: any = {freq: config.rule.frequency.toUpperCase()};
		if(config.timeZone) {
			this.timeZone = config.timeZone;
			//cfg.tzid = "UTC";
		}
		if(config.rule.interval) cfg.interval = config.rule.interval;
		if(config.rule.until) {
			cfg.until = config.rule.until.length > 10 ?
				ICAL.Time.fromDateTimeString(config.rule.until) :
				ICAL.Time.fromDateString(config.rule.until);
		}
		if(config.rule.count) cfg.count = config.rule.count;
		if(config.rule.firstDayOfWeek) cfg.wkst = this.dayNb(config.rule.firstDayOfWeek);
		if(config.rule.byDay) cfg.byday = config.rule.byDay.map(i => (i.nthOfPeriod ?? "") + i.day.toUpperCase());
		if(config.rule.byMonthDay) cfg.bymonthday = config.rule.byMonthDay;
		if(config.rule.byMonth) cfg.bymonth = config.rule.byMonth;
		if(config.rule.bySetPosition) cfg.bysetpos = config.rule.bySetPosition;
		if(config.rule.byWeekNo) cfg.byweekno = config.rule.byWeekNo;
		if(config.rule.byYearDay) cfg.byyearday = config.rule.byYearDay;

		try {
			this.rrule = ICAL.Recur.fromData(cfg).iterator(this.makeDate(config.dtstart, true));
		} catch (e) {
			console.error("Failed to parse rrule: ", cfg);
		}
	}

	private makeDate(d: Date, withTime?: boolean) {
		const t = ICAL.Time.fromJSDate(d);
		t.isDate = !withTime;
		return t;
	}

	*loop(start:DateTime, end: DateTime, iter?: (d:Date, i:number) => boolean){
		if(!this.rrule) {
			yield new DateTime(this.config.dtstart);
			return;
		}
		const startT = ICAL.Time.fromJSDate(start.date),
			endT = ICAL.Time.fromJSDate(end.date);

		for (let next = this.rrule.next(); next && next.compare(endT) < 0; next = this.rrule.next()) {
			if (next.compare(startT) < 0) {
				continue;
			}
			const dt = new DateTime(next.toJSDate());
			yield this.timeZone ? dt.toTimezone(this.timeZone) : dt;
		}
	}

}