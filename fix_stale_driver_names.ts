// Temporary cleanup script — run once then delete
// npx tsx fix_stale_driver_names.ts
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { deliveryJobs, orders } from "./src/lib/db/schema/index";
import { users } from "./src/lib/db/schema/users";
import { eq, isNotNull } from "drizzle-orm";

config(); // load .env

async function main() {
    const client = postgres(process.env.DATABASE_URL!);
    const db = drizzle(client);

    const jobs = await db
        .select({ jobId: deliveryJobs.id, orderId: deliveryJobs.orderId, driverName: deliveryJobs.driverName })
        .from(deliveryJobs)
        .where(isNotNull(deliveryJobs.driverName));

    console.log(`\nFound ${jobs.length} delivery job(s) with driverName set.\n`);

    let cleaned = 0;
    for (const job of jobs) {
        const [row] = await db
            .select({ customerName: users.name })
            .from(orders)
            .leftJoin(users, eq(orders.userId, users.id))
            .where(eq(orders.id, job.orderId))
            .limit(1);

        const c = (row?.customerName ?? "").trim().toLowerCase();
        const d = (job.driverName ?? "").trim().toLowerCase();

        const isCustomer =
            !!c && (
                d === c ||
                d.includes(c) ||
                c.includes(d) ||
                d.split(/\s+/).some((w) => w.length > 2 && c.split(/\s+/).includes(w))
            );

        if (isCustomer) {
            await db.update(deliveryJobs).set({ driverName: null, driverPhone: null }).where(eq(deliveryJobs.id, job.jobId));
            console.log(`  ✓ Cleared ${job.jobId.slice(0, 8)} | was="${job.driverName}" matched customer="${row?.customerName}"`);
            cleaned++;
        } else {
            console.log(`  – Kept   ${job.jobId.slice(0, 8)} | driverName="${job.driverName}" (looks like a real driver)`);
        }
    }

    console.log(`\nDone. Cleaned ${cleaned} / ${jobs.length} row(s).`);
    await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
