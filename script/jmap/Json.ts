function pointer(path:string) {
	const parts = path.replace(/^\//, "").split('/');
	// ignore leading / as it is implicit
	for(let i=0; i < parts.length; i++) {
		parts[i].replace('~1', '/')
					.replace('~0', '~');
	}
	return parts;
}

function set(doc: any, path: string[], v: any, mustExist: boolean) {
	if(!doc) return; // skip patching item in non-existing objects

	const pathLength = path.length;

	if(pathLength > 1) {
		set(doc[path.shift()!], path, v, pathLength > 2);
	} else {
		if (v === null) {
			delete doc[path[0]];
		} else {
			doc[path[0]] = v;
		}
	}
}

export function applyPatch(doc:any, patch: any) {
	for(const p in patch) {
		const deepPatch = p.substring(0, 1) == "/";
		set(doc, deepPatch ? pointer(p) : [p], patch[p], deepPatch);
	}
	return doc; // the patched document
}