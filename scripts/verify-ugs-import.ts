import { sql } from "../server/db.js";

const totals = await sql`select count(*)::int as total, count(*) filter (where source_file is not null)::int as imported, count(distinct source_file)::int as unique_sources from games`;
const sample = await sql`select title, source_file as "sourceFile", url from games where source_file is not null order by created_at asc limit 3`;
const tail = await sql`select title, source_file as "sourceFile", url from games where source_file is not null order by created_at desc limit 3`;
console.log(JSON.stringify({ totals, sample, tail }, null, 2));
await sql.end();
