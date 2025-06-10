import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { Suspense } from 'react';
import { ActivityIndicator } from 'react-native';

import { DrizzleContextProvider, migrateAsync } from '@/hooks/useDrizzle';

export const DATABASE_NAME = 'tasks';

export default function RootLayout() {
  return (
    <Suspense fallback={<ActivityIndicator size="large" />}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        options={{ enableChangeListener: true }}
        useSuspense
        onInit={migrateAsync}
      >
        <DrizzleContextProvider>
          <Stack>
            <Stack.Screen name="index" options={{ title: 'Tasks' }} />
          </Stack>
        </DrizzleContextProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
