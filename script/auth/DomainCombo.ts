import {Config, createComponent, SelectField, t} from "@intermesh/goui";
import {client} from "../jmap/index.js";

/**
 * Combo box with authentication domains available
 * Authentication domains can be filled by modules like imapauthenticator or ldapauthenticator.
 */
export class DomainCombo extends SelectField {

	constructor() {
		super();

		this.label = t("Domain");
		this.name = "domain";
		this.placeholder = t("None");

		this.loadDomains();
	}

	private loadDomains() {

		const domains =  client.session!.auth.domains || [];

		this.options = domains.map((domain: string) => ({
			value: domain,
			text: domain
		}));

		this.hidden = domains.length == 0;

	}

	reloadDomains() {
		this.loadDomains();
	}
}

/**
 * Shorthand function to create {@link DomainCombo}
 *
 * @param config
 */
export const domaincombo = (config?: Config<DomainCombo>) => createComponent(new DomainCombo(), config);
