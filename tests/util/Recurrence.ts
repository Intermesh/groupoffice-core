import {expect} from "chai";
import {describe} from "mocha";
import {DateTime} from "@intermesh/goui";
import {Recurrence, RecurrenceRule} from "../../script/util/Recurrence.js";

const date = (s: string) => DateTime.createFromFormat(s, "Y-m-d H:i")!;

/**
 * The occurrences between start and end as "Y-m-d H:i"
 */
const occurrences = (rule: RecurrenceRule, dtstart: string, start: string, end: string) => {
	const r = new Recurrence({rule, dtstart: date(dtstart)});
	return [...r.loop(date(start), date(end))].map(d => d.format("Y-m-d H:i"));
}

describe('Recurrence class', () => {

	it('Repeats daily', () => {
		expect(occurrences({frequency: "daily"}, "2026-03-02 09:00", "2026-03-02 00:00", "2026-03-05 00:00"))
			.to.deep.equal(["2026-03-02 09:00", "2026-03-03 09:00", "2026-03-04 09:00"]);
	});

	it('Repeats with an interval', () => {
		expect(occurrences({frequency: "daily", interval: 2}, "2026-03-02 09:00", "2026-03-02 00:00", "2026-03-09 00:00"))
			.to.deep.equal(["2026-03-02 09:00", "2026-03-04 09:00", "2026-03-06 09:00", "2026-03-08 09:00"]);
	});

	it('Repeats weekly on given days', () => {
		// 2026-03-02 is a Monday
		expect(occurrences({frequency: "weekly", byDay: [{day: "mo"}, {day: "we"}]}, "2026-03-02 09:00", "2026-03-02 00:00", "2026-03-12 00:00"))
			.to.deep.equal(["2026-03-02 09:00", "2026-03-04 09:00", "2026-03-09 09:00", "2026-03-11 09:00"]);
	});

	it('Repeats monthly on the nth weekday', () => {
		// the first Monday of the month
		expect(occurrences({frequency: "monthly", byDay: [{day: "mo", nthOfPeriod: 1}]}, "2026-03-02 09:00", "2026-03-01 00:00", "2026-06-01 00:00"))
			.to.deep.equal(["2026-03-02 09:00", "2026-04-06 09:00", "2026-05-04 09:00"]);
	});

	it('Stops after count', () => {
		expect(occurrences({frequency: "daily", count: 2}, "2026-03-02 09:00", "2026-03-01 00:00", "2026-04-01 00:00"))
			.to.deep.equal(["2026-03-02 09:00", "2026-03-03 09:00"]);
	});

	it('Stops at the until time', () => {
		expect(occurrences({frequency: "daily", until: "2026-03-04T09:00:00"}, "2026-03-02 09:00", "2026-03-01 00:00", "2026-04-01 00:00"))
			.to.deep.equal(["2026-03-02 09:00", "2026-03-03 09:00", "2026-03-04 09:00"]);
	});

	it('Includes the occurrence on a date-only until', () => {
		expect(occurrences({frequency: "daily", until: "2026-03-04"}, "2026-03-02 09:00", "2026-03-01 00:00", "2026-04-01 00:00"))
			.to.deep.equal(["2026-03-02 09:00", "2026-03-03 09:00", "2026-03-04 09:00"]);
	});

	it('Includes the last day of a full-day event with a date-only until', () => {
		expect(occurrences({frequency: "daily", until: "2026-03-04"}, "2026-03-02 00:00", "2026-03-01 00:00", "2026-04-01 00:00"))
			.to.deep.equal(["2026-03-02 00:00", "2026-03-03 00:00", "2026-03-04 00:00"]);
	});

	it('Skips occurrences before the start of the period', () => {
		expect(occurrences({frequency: "weekly"}, "2026-03-02 09:00", "2026-03-10 00:00", "2026-03-24 00:00"))
			.to.deep.equal(["2026-03-16 09:00", "2026-03-23 09:00"]);
	});

	it('Keeps the time over a daylight saving time change', () => {
		// summer time in Europe starts on 2026-03-29
		expect(occurrences({frequency: "daily"}, "2026-03-27 09:00", "2026-03-27 00:00", "2026-03-31 00:00"))
			.to.deep.equal(["2026-03-27 09:00", "2026-03-28 09:00", "2026-03-29 09:00", "2026-03-30 09:00"]);
	});
});
