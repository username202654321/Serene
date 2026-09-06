import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "./db.js";

const filename = fileURLToPath(import.meta.url);
const migrationDirectory = path.resolve(path.dirname(filename), "../migrations");

async function main() {
	await sql.unsafe("create table if not exists serene_migrations (id text primary key, applied_at timestamptz not null default now())");
	const applied = await sql<{ id: string }[]>`select id from serene_migrations`;
	const appliedIds = new Set(applied.map((row) => row.id));
	const files = (await readdir(migrationDirectory)).filter((file) => /^\d+_.*\.sql$/.test(file)).sort();
	for (const file of files) {
		const id = file.replace(/\.sql$/, "");
		if (appliedIds.has(id)) continue;
		await sql.begin(async (transaction) => {
			await transaction.unsafe(await readFile(path.join(migrationDirectory, file), "utf8"));
			await transaction`insert into serene_migrations (id) values (${id})`;
		});
		console.log(`Applied ${id}.`);
	}
	await sql.end();
	console.log("Serene database migration complete.");
}

void main();
