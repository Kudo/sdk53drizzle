import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { createContext, use, useMemo } from 'react';

import * as schema from '@/db/schema';
import migrations from '@/drizzle/migrations';

export const DrizzleContext = createContext<ReturnType<typeof drizzle> | null>(
  null
);

export const DrizzleContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const db = useSQLiteContext();
  const drizzleDb = useMemo(() => drizzle(db, { schema }), [db]);

  return <DrizzleContext value={drizzleDb}>{children}</DrizzleContext>;
};

export function useDrizzle(): ReturnType<typeof drizzle> {
  const drizzleDb = use(DrizzleContext);
  if (!drizzleDb) {
    throw new Error('Unexpected error: null drizzleDb');
  }
  return drizzleDb;
}

/**
 * A drizzle migration helper for SQLiteProvider.onInit
 */
export async function migrateAsync(db: SQLiteDatabase) {
  // We create a dedicated drizzle instance for migrations,
  // because in SQLiteProvider.onInit state,
  // useSQLiteContext() is not available yet.
  const drizzleDb = drizzle(db, { schema });
  return migrate(drizzleDb, migrations);
}
