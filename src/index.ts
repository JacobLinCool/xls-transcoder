export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname === "/") {
			return Response.redirect("https://github.com/JacobLinCool/xls-transcoder", 301);
		}
		if (url.pathname === "/favicon.ico") {
			return new Response(null, { status: 404 });
		}

		const transcode = url.pathname.startsWith("/json") ? json : convert;
		console.log("transcode", transcode);

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

		const payload = { method: request.method, body: request.body, headers: request.headers };
		console.log("fetch", from, payload);
		const res = await fetch(from, payload);
		if (!res.ok) {
			return new Response("Failed to fetch: " + res.statusText, { status: 500 });
		}
		if (!res.headers.get("Content-Type")?.includes("application/vnd.ms-excel")) {
			return new Response("Invalid content type: " + res.headers.get("Content-Type"), {
				status: 400,
			});
		}

		const buffer = await res.arrayBuffer();
		const transcoded = await transcode(buffer);

		const headers = new Headers(res.headers);
		if (transcode === json) {
			headers.set("Content-Type", "application/json");
		} else {
			headers.set(
				"Content-Type",
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			);
		}

		return new Response(transcoded, { headers });
	},
};

async function convert(xls: ArrayBuffer): Promise<ArrayBuffer> {
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
