import {
	comp,
	Observable,
	root,
	t,
	Button,
	btn,
	tbar,
	Window,
	INotification,
	h3,
	Notifier as GOUINotifier,
	list, store, Store, List, datasourcestore, Format, DefaultEntity, progress, Component
} from "@intermesh/goui";
import {jmapds} from "../jmap";
import {entities} from "../Entities";


export interface AlertEntity extends DefaultEntity{
	createdBy: string
	// data from db
	data:any
	// set client side by this onBeforeLoad event
	entityData:any
	// entitytype  name
	entity: string
	entityId: string
	// is email sent
	isSent: boolean
	permissionLevel: number
	recurrenceId?: string
	// should email be send
	sendMail?: boolean
	// date when alert should no longer show
	staleAt: string
	tag: string
	// date: alert should not show before this date
	triggerAt: string
	userId: number
}

// "beforeshow"
// "beforenotify"

type SoundName = 'question' | 'email' | 'reminders';
//type IconName = 'reminder' | 'email';

const iconPath = 'views/goui/groupoffice-core/style/resources/notify/';
const soundPath = 'views/goui/groupoffice-core/style/resources/sounds/';
const queue: (() => void)[] = [];
const defaultIcon = iconPath+'reminder.png'
const defaultTitle = t("Reminders");

let audioUnlocked = false;
window.addEventListener('pointerdown', () => {
	audioUnlocked = true;
	while (queue.length) queue.shift()?.();
}, { once: true });

export class Notifier extends Observable {

	declare btn: Button
	private canNotify = false
	private readonly store: Store<INotification>
	private panel
	private count = 0
	private alertCount = 0;
	private alertStore;
	private msgList: List
	private notificationRenderers: {[entityType:string]: (alert:any, closeFn: ()=>void) => INotification | undefined} = {};

	constructor() {
		super();

		this.store = store<INotification>({data:[]});

		this.alertStore = datasourcestore({
			dataSource:jmapds<AlertEntity>('Alert'),
			onBeforeLoad: async (records: AlertEntity[]): Promise<any[]> => { // add dynamic relations

				const promises:Promise<any>[] = [];
				const alerts: any[] = [];
				const now = new Date();
				for(const alert of records) {
					const triggerDate = new Date(alert.triggerAt);
					const staleDate = new Date(alert.staleAt);
					if(triggerDate > now || now > staleDate) continue; // delete me;
					const ds = jmapds(alert.entity);
					if(!ds) continue; // no dataSource for entity type found
					alerts.push(alert);
					promises.push(ds.single(alert.entityId).then((entity:any) => {
						alert.entityData = entity;
					}).catch(e =>{console.warn("Failed to fetch relation", e)}));
				}
				this.alertCount = promises.length;
				this.updateCount();
				return Promise.all(promises).then(() => alerts);
			}
		});

		// has child with cls "notifications"
		const sidePanel = comp({cls:'notifications', hidden:true},
			tbar({style:{paddingLeft:'0'}},
				btn({icon: "chevron_right", title: t("Close")}).on('click',() => {
					sidePanel.hide()
				}),
				'->',
				btn({icon: 'delete_sweep', title: t('Dismiss all')}).on('click', _=>{

					Window.confirm(t("Confirm"), t('Are you sure you want to dismiss all notifications?')).then(ok => {
						sidePanel.hide();
						ok && this.clear();
					});
				})
			),
			this.msgList = list({
				emptyStateHtml: '<div style="position:absolute;z-index:-1" class="goui-empty-state"><b>'+t('No notifications')+'</b></div>',
				store: this.store,
				renderer: (msg:any) => [this.card(msg)]
			}),
			list({
				emptyStateHtml: '',
				store: this.alertStore,
				renderer: (alert:any) => {
					const closeFn = ()=>{jmapds("Alert").destroy(alert.id);};
					let note = this.notificationRenderers?.[alert.entity]?.(alert, closeFn);
					note ??= this.defaultNotificationRenderer(alert, closeFn);
					note.onClose ??= closeFn;

					return [this.card(note)];
				}
			})
		);

		root.items.add(sidePanel);

		this.btn = btn({icon: "notifications"}).on('click',_=>{
			sidePanel.hidden ? sidePanel.show() : sidePanel.hide();
		});

		GOUINotifier.on('notify',({msg})=>{

			// what is msg already exists?
			switch(msg.category) {
				case 'status':
					return true; // goui toast
				case 'system':
				case 'error':
				case 'alarm':
					sidePanel.show(); // severe, open panel
				case 'message':
				case 'progress':
					this.notify(msg); // flyout and desktop
			}

			this.add(msg);

			return false; // prevent goui toast
		 });

		this.panel = sidePanel;

		void this.initNotifications();
	}

	load() {
		this.alertStore.load();
	}

	regRenderer(entityType:string, renderer: (alert: AlertEntity, closeFn: ()=>void) => INotification | undefined) {
		this.notificationRenderers[entityType] = renderer;
	}

	private clear(){
		// this.notifications.forEach(msg => {
		// 	msg.el.remove(); // todo
		// });
		this.store.clear();
		this.count = 0;
		this.updateCount();
	}

	private updateCount(){
		const c = (this.alertCount + this.count);
		this.btn.el.dataset.count = ''+(c>0?c:'');
	}

	private add(msg: INotification) {
		this.store.add(msg);
		this.msgList.onStoreLoad();
		this.count++;
		this.updateCount();
	}

	private remove(msg:INotification) {
		this.store.remove(msg);
		this.msgList.onStoreLoad();
		this.count--;
		this.updateCount();
	}

	async initNotifications() {
		if (!('Notification' in window) || !isSecureContext) {
			return;
		}
		let p = Notification.permission;
		if (p === 'default') {
			try {
				p = await Notification.requestPermission();
			} catch {
				return;
			}
		}
		this.canNotify = (p === 'granted');
	}

	notify(msg: INotification) {

		console.log(msg);
		return;
		if(['alarm','message'].includes(msg.category!)) {
			this.playSound(msg.category==='alarm' ? 'reminders' : 'email');
		}

		// Hard fallback conditions
		if (!this.canNotify) {
			return this.flyout(msg);
		}

		try {
			const n = new Notification(msg.title || defaultTitle, {body:msg.text, icon: msg.icon?.link || defaultIcon});
			if (msg.actions?.click) {
				n.onclick = (e) => {
					e.preventDefault();
					msg.actions!.click.run();
					n.close();
				};
				delete msg.actions?.click;
			}
			n.onclose = () => {
				// TODO: some OSes and Browsers auto close in a few seconds. re-open to keep persistent?
			};
			n.onerror = () => {
				this.flyout(msg);
			};

			return n;
		} catch {
			return this.flyout(msg);
		}
	}

	private defaultNotificationRenderer(alert:any, closeFn: () => void): INotification {

		const entity = alert.entityData;

		// oldcode: remove this when the old code for link configs is updated
		const oldIconClass = entities.getLinkConfig(alert.entity)?.iconCls || '';
		let parts = oldIconClass.split(' ');
		const icon = {
			name:parts[1].replace('ic-',''),
		} as any;
		if(parts[2]) icon.color = parts[2];
		// end of oldcode

		let text = Format.dateTime(alert.triggerAt);

		if(alert.data) {
			if("progress" in alert.data) {
				text = t("Progress") + " " + alert.data.progress + "%";
			// } else {
			// 	text += ": " + JSON.stringify(alert.data, undefined, 1);
			}
		}

		return {
			title: alert.data && alert.data.title ? alert.data.title : entity.name || entity.title || entity.description || alert.entity,
			text,
			icon,
			category: ("progress" in alert.data) ? 'progress' : 'event',
			onClick: () => { entities.get(alert.entity).goto(alert.entityId); closeFn(); }
		}

	}

	private card(msg: INotification)
	{
		const rm = () => {
			// remove from list, if in list. otherwise its an alert
			if(this.store.has(msg))
				this.remove(msg);
			msg.onClose?.();
		}
		const items: Component[] = [comp({text:msg.text})];
		const actions = [msg.actions?.primary,msg.actions?.secondary].filter(Boolean);
		if(msg.category==='progress') {
			const bar = comp({tagName:'progress'});
			items.push(bar);
			msg.onProcessed = (loaded, total) => {
				bar.el.max = total;
				bar.el.value = loaded;
				if(loaded >= total) this.remove(msg); // done!
			};
		}


		const card = comp({cls:msg.variant||''},
			h3({text:msg.title},
				comp({tagName:'i',cls:'icon',text: msg.icon?.name, style:{color:msg.icon?.color}}),
				btn({icon:'close', title:t('Close'), hidden: msg.category==='alarm'}).on('click', rm)
			),
			...items,
			...(actions.length ? [tbar({},...Object.values(actions).map(a =>
				btn({text:a!.text, icon:a!.icon}).on('click', ()=>{a!.run(); })))] : [])
		);
		const seconds = (when: Date) => Math.floor((when.getTime() - (new Date()).getTime()) / 1000);

		if (msg.time) {
			setTimeout(() => {card.show()}, seconds(msg.time));
		}
		if(msg.stale) {
			setTimeout(() => {card.remove()}, seconds(msg.stale));
		}

		return card.on('render', e => {
			if(msg.onClick)
				e.target.el.on('click', msg.onClick)
		})
	}

	flyout(msg: INotification) {

		const c = this.card(msg);

		if(msg.category==='status' || msg.category === 'message') {
			setTimeout(() => {
				c.remove();
			}, 5000);
		}

		this.panel.items.add(c);

	}

	playSound(filename: SoundName = 'question') {
		if(!GO.util.empty(go.User.mute_sound) ||
			(filename === 'email' && go.User.mute_new_mail_sound) ||
			(filename === 'question' && go.User.mute_reminder_sound)) {
			return;
		}
		const play= () => {new Audio(soundPath+filename+'.mp3').play().catch(() => {})}

		if (audioUnlocked) play();
		else queue.push(play);
	}
}
