import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#abb3b7',
          borderTopWidth: 1,
          height: 60,
        },
        tabBarActiveTintColor: '#5e5c75',
        tabBarInactiveTintColor: '#737c7f',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 4,
        },
        headerStyle: { backgroundColor: '#1A1A2E' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerTitle: 'RWAscope',
        headerRight: () => (
          <MaterialIcons name="notifications" size={22} color="#94a3b8" style={{ marginRight: 16 }} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Market',
          tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="assessment"
        options={{
          title: 'Self-assess',
          tabBarIcon: ({ color }) => <MaterialIcons name="receipt-long" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="framework"
        options={{
          title: 'Framework',
          tabBarIcon: ({ color }) => <MaterialIcons name="verified-user" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="friction"
        options={{
          title: 'Friction',
          tabBarIcon: ({ color }) => <MaterialIcons name="analytics" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
