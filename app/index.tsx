import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Index() {
  const db = useSQLiteContext();
  const drizzleDb = drizzle(db, { schema });

  const [lists, setLists] = useState<(typeof schema.lists.$inferSelect)[]>([]);
  const [tasks, setTasks] = useState<schema.Task[]>([]);
  const [newListName, setNewListName] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedListId, setSelectedListId] = useState<number | null>(null);

  const loadLists = useCallback(async () => {
    try {
      const result = await drizzleDb.select().from(schema.lists);
      setLists(result);
    } catch {
      Alert.alert('Error', 'Failed to load lists');
    }
  }, [drizzleDb]);

  const loadTasks = useCallback(async () => {
    try {
      const result = await drizzleDb.select().from(schema.tasks);
      setTasks(result);
    } catch {
      Alert.alert('Error', 'Failed to load tasks');
    }
  }, [drizzleDb]);

  const createList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    try {
      await drizzleDb.insert(schema.lists).values({ name: newListName });
      setNewListName('');
      loadLists();
    } catch {
      Alert.alert('Error', 'Failed to create list');
    }
  };

  const deleteList = useCallback(
    async (id: number) => {
      try {
        // Delete all tasks in the list first
        await drizzleDb
          .delete(schema.tasks)
          .where(eq(schema.tasks.list_id, id));
        // Then delete the list
        await drizzleDb.delete(schema.lists).where(eq(schema.lists.id, id));
        loadLists();
        loadTasks();
        if (selectedListId === id) {
          setSelectedListId(null);
        }
      } catch {
        Alert.alert('Error', 'Failed to delete list');
      }
    },
    [drizzleDb, loadLists, loadTasks, selectedListId]
  );

  const createTask = useCallback(async () => {
    if (!newTaskName.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    if (!selectedListId) {
      Alert.alert('Error', 'Please select a list first');
      return;
    }

    try {
      await drizzleDb.insert(schema.tasks).values({
        name: newTaskName,
        list_id: selectedListId,
      });
      setNewTaskName('');
      loadTasks();
    } catch {
      Alert.alert('Error', 'Failed to create task');
    }
  }, [drizzleDb, loadTasks, selectedListId, newTaskName]);

  const deleteTask = useCallback(
    async (id: number) => {
      try {
        await drizzleDb.delete(schema.tasks).where(eq(schema.tasks.id, id));
        loadTasks();
      } catch {
        Alert.alert('Error', 'Failed to delete task');
      }
    },
    [drizzleDb, loadTasks]
  );

  const getTasksForSelectedList = useCallback(() => {
    if (!selectedListId) return [];
    return tasks.filter((task) => task.list_id === selectedListId);
  }, [selectedListId, tasks]);

  // Load data on component mount
  useEffect(() => {
    loadLists();
    loadTasks();
  }, [loadLists, loadTasks]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Todo Lists</Text>

      {/* Lists Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lists</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter list name"
            value={newListName}
            onChangeText={setNewListName}
          />
          <TouchableOpacity style={styles.button} onPress={createList}>
            <Text style={styles.buttonText}>Add List</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={lists}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View
              style={[
                styles.listItem,
                selectedListId === item.id && styles.selectedListItem,
              ]}
            >
              <TouchableOpacity
                style={styles.listContent}
                onPress={() => setSelectedListId(item.id)}
              >
                <Text style={styles.listText}>{item.name}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteList(item.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* Tasks Section */}
      {selectedListId && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Tasks for: {lists.find((l) => l.id === selectedListId)?.name}
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter task name"
              value={newTaskName}
              onChangeText={setNewTaskName}
            />
            <TouchableOpacity style={styles.button} onPress={createTask}>
              <Text style={styles.buttonText}>Add Task</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={getTasksForSelectedList()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <Text style={styles.listText}>{item.name}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteTask(item.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedListItem: {
    backgroundColor: '#e3f2fd',
  },
  listContent: {
    flex: 1,
  },
  listText: {
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
  },
});
