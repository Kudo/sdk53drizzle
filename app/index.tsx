import * as schema from '@/db/schema';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useSQLiteContext } from 'expo-sqlite';

export default function Index() {
  const db = useSQLiteContext();
  const drizzleDb = drizzle(db, { schema });

  // more code
}
