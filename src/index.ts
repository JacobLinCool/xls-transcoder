export default {
	async fetch(request: Request, _: Env, ctx: ExecutionContext): Promise<Response> {
		return handle(request, ctx);
	},
};

async function handle(request: Request, ctx: ExecutionContext): Promise<Response> {
	const url = new URL(request.url);
	if (url.pathname === "/") {
		return Response.redirect("https://github.com/JacobLinCool/xls-transcoder", 301);
	} else if (url.pathname === "/favicon.ico") {
		return new Response(null, { status: 404 });
	} else {
		const transcoder = url.pathname.startsWith("/json") ? json : xlsx;
		console.log("transcoder", transcoder);

		const from = url.searchParams.get("from");
		try {
			if (from === null) {
				throw new Error("from is required");
			}

			new URL(from);
		} catch (err) {
			if (err instanceof Error) {
				return new Response("Invalid parameter: " + err.message, { status: 400 });
			} else {
				return new Response("Unknown error", { status: 500 });
			}
		}

		return transcode(from, transcoder, request, ctx);
	}
}

async function transcode(
	from: string,
	transcoder: (xls: ArrayBuffer) => Promise<ArrayBuffer | string>,
	request: Request,
	ctx: ExecutionContext,
): Promise<Response> {
	const cache = await caches.open("xls-transcoder");
	const raw_key = `https://cache/raw/${from}`;
	const result_key = `https://cache/${transcoder.name}/${from}`;
	const cached_result = await cache.match(result_key);
	if (cached_result) {
		console.log("cache hit", result_key);
		return cached_result;
	}

	const raw = await cache.match(raw_key);
	let res: Response;
	if (raw) {
		console.log("cache hit", raw_key);
		res = raw;
	} else {
		const payload = {
			method: request.method,
			body: request.body,
			headers: request.headers,
		};
		console.log("fetch", from, payload);
		res = await fetch(from, payload);
		if (!res.ok) {
			return new Response("Failed to fetch: " + res.statusText, { status: 500 });
		}
		if (!res.headers.get("Content-Type")?.includes("application/vnd.ms-excel")) {
			return new Response("Invalid content type: " + res.headers.get("Content-Type"), {
				status: 400,
			});
		}
		if (request.method === "GET") {
			ctx.waitUntil(cache.put(raw_key, res.clone()));
		}
	}

	const buffer = await res.arrayBuffer();
	const transcoded = await transcoder(buffer);

	const headers = new Headers(res.headers);
	headers.delete("Content-Disposition");
	if (transcoder === json) {
		headers.set("Content-Type", "application/json");
	} else {
		headers.set(
			"Content-Type",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);
	}

	const result = new Response(transcoded, { headers });
	if (request.method === "GET") {
		ctx.waitUntil(cache.put(result_key, result.clone()));
	}

	return result;
}

async function xlsx(xls: ArrayBuffer): Promise<ArrayBuffer> {
	const XLSX = await import("xlsx");
	const workbook = XLSX.read(xls, { type: "array" });
	const converted = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
	return converted;
}

async function json(xls: ArrayBuffer): Promise<string> {
	const XLSX = await import("xlsx");
	const workbook = XLSX.read(xls, { type: "array" });
	const sheets = workbook.SheetNames.map((name) => {
		const sheet = workbook.Sheets[name];
		return { name, data: XLSX.utils.sheet_to_json(sheet) };
	});
	return JSON.stringify({ sheets });
}

interface Env {}
