import {
	comp,
	fieldset,
	Fieldset,
	Field as FormField,
	Format,
	p,
	Component,
	span,
	Form,
	containerfield, ContainerField
} from "@intermesh/goui";
import {customFields, Field, FieldSet as CustomFieldSet} from "./CustomFields.js";
export class FormFieldset extends Fieldset {
	private container: ContainerField;
	constructor(public readonly fieldSet:CustomFieldSet) {
		super();

		this.legend = fieldSet.name;

		if(fieldSet.description) {
			this.items.add(p(Format.textToHtml(fieldSet.description)));
		}
		
		this.items.add(this.container = containerfield({cls: "hbox gap", keepUnknownValues: false, name: "customFields"}));

		const fields = customFields.getFieldSetFields(fieldSet),
			formFields = fields.map(f => this.createFormField(f)).filter(f => f !== undefined);

		if(fieldSet.columns == 1) {
			this.container.items.add(...formFields);
		} else{
			this.addInColumns(formFields);
		}

		this.on("render", () => {
			this.container.findChildrenByType(FormField).forEach( (f) => {
				f.on("setvalue", (ev) => {
					this.container.findChildrenByType(FormField).forEach((field) => {
							this.checkRequiredCondition(field);
					});
				});
			});
		})
	}
	private addInColumns(fields: Component[]) {
		const fieldsPerColumn = Math.floor(fields.length / this.fieldSet.columns),
			fieldsInFirstColumn = fieldsPerColumn + (fields.length % this.fieldSet.columns);

		for(let colIndex = 0; colIndex <this.fieldSet.columns; colIndex++) {
			this.container.items.add(comp({
				cls: "flow",
				flex: 1
			}, ...fields.splice(0, colIndex === 0 ? fieldsInFirstColumn : fieldsPerColumn)));
		}
	}

	private createFormField(f: Field) : Component|undefined {
		const cmp = customFields.getType(f.type).createFormField(f);
		if(!cmp) {
			return undefined;
		}
		cmp.dataSet.customField = f;
		if(f.suffix) {
			cmp.flex = 1;
			return comp({cls: "hbox"}, cmp, span({text: f.suffix, cls: "customfield-suffix"}));
		}

		return cmp;
	}


	/**
	 * Break a condition string into conditions and grouped subconditions
	 *
	 * @param {string} condition
	 * @returns {array}
	 */
	private getConditionString(condition: string): string {
		// Replace SQL-like operators with JS equivalents
		condition = condition
			.replace(/\sAND\s/g, " && ")
			.replace(/\sOR\s/g, " || ")
			.replace(/\s=\s/g, " == ");

		const comparisonOperators: string[] = ["==", "<", ">", ">=", "<=", "!="];
		const logicalOperators: string[] = ["&&", "||"];
		const tokens: string[] = condition.split(" ");

		for (let index = 0; index < tokens.length; index++) {
			let token: string = tokens[index];
			const prevIndex = index - 1;
			const nextIndex = index + 1;
			let prefix = "";
			let suffix = "";

			// Handle comparison operators (==, <, >, etc.)
			if (comparisonOperators.includes(token)) {
				let previousToken = String(tokens[prevIndex]);
				if (previousToken.startsWith("(")) {
					prefix = "(";
					previousToken = previousToken.substring(1);
				}
				tokens[prevIndex] = `${prefix}this.getValue(this["${previousToken}"])`;
				tokens[nextIndex] = `"${tokens[nextIndex]}`;

				// Handle logical operators (&&, ||)
			} else if (logicalOperators.includes(token)) {
				let previousToken = String(tokens[prevIndex]);
				if (previousToken.endsWith(")")) {
					suffix = ")";
					previousToken = previousToken.slice(0, -1);
				}
				if (previousToken !== "empty") {
					suffix = `"${suffix}`;
				}
				tokens[prevIndex] = previousToken + suffix;

				// Handle last token in expression
			} else if (index === tokens.length - 1) {
				if (token.endsWith(")")) {
					suffix = ")";
					token = token.slice(0, -1);
				}
				if (token !== "empty") {
					token += `"`;
				}
				tokens[index] = token + suffix;
			}
		}

		condition = tokens.join(" ");

		// Replace "is not empty"
		const notEmptyRegex = /(?<fieldName>\w+) is not empty/g;
		let notEmptyMatch: RegExpExecArray | null;
		while ((notEmptyMatch = notEmptyRegex.exec(condition)) !== null) {
			const fieldName = notEmptyMatch.groups?.fieldName ?? "";
			condition = condition.replace(
				notEmptyRegex,
				`!this["${fieldName}"])`
			);
		}

		// Replace "is empty"
		const emptyRegex = /(?<fieldName>\w+) is empty/g;
		let emptyMatch: RegExpExecArray | null;
		while ((emptyMatch = emptyRegex.exec(condition)) !== null) {
			const fieldName = emptyMatch.groups?.fieldName ?? "";
			condition = condition.replace(
				emptyRegex,
				`this["${fieldName}"]`
			);
		}

		return `return (${condition});`;
	}

	/**
	 * Required condition validator
	 */
	private checkRequiredCondition(formField: FormField): boolean {

		const customField = formField.dataSet.customField as Field|undefined;

		if(!customField) {
			return false; //some form fields have sub form fields
		}

		let requiredConditionMatches = false;

		const form = this.findAncestorByType(Form)!, formValue = form.value;

		if (!customField.relatedFieldCondition) {
			return false;
		}

		const conditionString: string = this.getConditionString(
			customField.relatedFieldCondition
		);

		try {
			const func = new Function(conditionString);

			const scope = {
				getValue: (v:any) =>{return v === true ? "1" : v ===false ? "0" : v === null || v === undefined ? '' : v;},
				...formValue.customFields
			}

			requiredConditionMatches = func.call(scope) as boolean;
		} catch (e) {
			console.error(
				`Required condition '${customField.relatedFieldCondition}' failed with error: `,
				e
			);
		}

		if (customField.conditionallyRequired) {
			formField.required = requiredConditionMatches;
		}

		if (customField.conditionallyHidden) {
			formField.hidden = requiredConditionMatches;
		}

		return requiredConditionMatches;
	}



}