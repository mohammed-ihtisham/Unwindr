import { getDb } from "@utils/database.ts";

async function main() {
  const [db, client] = await getDb();
  try {
    const places = db.collection("PlaceCatalog.places");

    // Find all places where tags field doesn't exist
    const cursor = places.find(
      { tags: { $exists: false } },
      { projection: { _id: 1, name: 1 } },
    );

    let updated = 0;
    for await (const place of cursor) {
      const id: string = place._id;
      const name: string = place.name ?? "(unnamed)";

      const res = await places.updateOne(
        { _id: id },
        { $set: { tags: [] } },
      );

      if (res.modifiedCount > 0) {
        updated += 1;
        console.log(`Updated ${name} (${id}) - added tags: []`);
      }
    }

    console.log(`Completed. Total places updated: ${updated}`);
  } finally {
    await client.close();
  }
}

if (import.meta.main) {
  main();
}
