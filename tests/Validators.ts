import {expect} from "chai";
import {describe} from "mocha";
import {validateEmail} from "../script/Validators.js";

describe('Validators', () => {
	describe("validateEmail", () => {
		const valid = ["piet@example.com", "p.jansen+test@mail.example.nl"];
		const invalid = ["", "piet", "piet@example", "@example.com", "piet @example.com"];

		valid.forEach(email => {
			it(`Accepts "${email}"`, () => {
				expect(validateEmail(email)).to.be.true;
			});
		});

		invalid.forEach(email => {
			it(`Rejects "${email}"`, () => {
				expect(validateEmail(email)).to.be.false;
			});
		});
	});
});
