/**
 * @license https://github.com/Intermesh/goui/blob/main/LICENSE MIT License
 * @copyright Copyright 2023 Intermesh BV
 * @author Merijn Schering <mschering@intermesh.nl>
 */

import {client} from "./Client.js";
import {User} from "../auth/User.js";
import {
	AbstractDataSource,
	CommitResponse,
	Config,
	createComponent,
	DefaultEntity, EntityID, MergeResponse,
	QueryParams,
	QueryResponse,
	SetRequest
} from "@intermesh/goui";



// enum SetErrorType {
// 	'forbidden',
// 	'overQuota',
// 	'tooLarge',
// 	'rateLimit',
// 	'notFound',
// 	'invalidPatch',
// 	'willDestroy',
// 	'invalidProperties',
// 	'singleton',
// 	'requestTooLarge',
// 	'stateMismatch'
// }



/**
 * JMAP Data source
 *
 * Single Source Of Truth for JMAP entities
 *
 */
export class JmapDataSource<EntityType extends DefaultEntity = DefaultEntity> extends AbstractDataSource<EntityType> {

	/**
	 * The controller route
	 *
	 * By default, the store ID is used as route. Eg. id = "Contact" then get request will be Contact/get
	 *
	 * If you set this to "SpecialContact" it will be "SpecialContact/get"
	 */
	public controllerRoute:string|undefined;

	protected internalQuery(params: QueryParams) : Promise<QueryResponse<EntityType>> {
		return client.jmap((this.controllerRoute ?? this.id) + "/query", params, this.useCallId());
	}

	/**
	 * The ID to use when committing
	 */
	protected _nextCallId = 1;

	/**
	 * The call ID of the next JMAP method call. Useful for result references.
	 */
	get nextCallId() {
		return this.id + "_" + this._nextCallId;
	}

	private useCallId() {
		const callId  = this.nextCallId;
		this._nextCallId++;

		return callId;
	}


	protected async internalCommit(params: SetRequest<EntityType>) : Promise<CommitResponse<EntityType>> {

		try {
			return await client.jmap((this.controllerRoute ?? this.id) + "/set", params, this.useCallId());
		} catch(error:any) {
			//automatic retry when statemismatch occurs
			if(error.type && error.type == 'stateMismatch') {
				console.warn("statemismatch, we'll update and auto retry the JMAP set request");
				await this.updateFromServer();
				params.ifInState = await this.getState();
				return this.internalCommit(params);
			}

			throw error;
		}
	}


	/**
	 * This function makes sure the store is up to date. Should not be necessary but we ran into problems where tasks
	 * were out of date when viewed. This should always prevent that.
	 * @return {Promise<self>}
	 */
	public async validateState() {
		const r = await client.jmap((this.controllerRoute ?? this.id) + "/get", {
				ids: []
			});

		await this.checkState(r.state, r);
		return this;
	}

	protected internalGet(ids: string[]){
		return client.jmap((this.controllerRoute ?? this.id) + '/get', {
			ids: ids
		}, this.useCallId());
	}

	protected async internalRemoteChanges(state: string|undefined) {

			return client.jmap((this.controllerRoute ?? this.id) + "/changes", {
				sinceState: state
			}, this.useCallId());

	}

	protected async internalMerge(ids: EntityID[]) : Promise<MergeResponse<EntityType>> {
		return client.jmap((this.controllerRoute ?? this.id) + "/merge", {
			ids: ids
		}, this.useCallId());
	}
}


const stores: Record<string, any> = {};

/**
 * Get a single instance of a store by ID
 *
 * @deprecated
 * export a const instead
 *
 * @see User
 */
export const jmapds = <EntityType extends DefaultEntity = DefaultEntity>(storeId:string, config?: Config<JmapDataSource>) : JmapDataSource<EntityType> => {
	if(!stores[storeId]) {
		stores[storeId] = createComponent(new JmapDataSource<EntityType>(storeId), config);
	}
	return stores[storeId];
}