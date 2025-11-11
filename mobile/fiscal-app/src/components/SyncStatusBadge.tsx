import { StyleSheet, Text, View } from 'react-native';

interface Props {
  lastSyncAt: string | null;
  pendingCount: number;
}

export function SyncStatusBadge({ lastSyncAt, pendingCount }: Props) {
  const pendingText = pendingCount > 0 ? `${pendingCount} pendências` : 'Sem pendências';
  const statusColor = pendingCount > 0 ? '#F79009' : '#32D583';

  return (
    <View style={[styles.container, { backgroundColor: `${statusColor}10`, borderColor: statusColor }]}>
      <Text style={[styles.status, { color: statusColor }]}>{pendingText}</Text>
      {lastSyncAt ? <Text style={styles.time}>Última sync: {new Date(lastSyncAt).toLocaleString()}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  status: {
    fontWeight: '600',
    fontSize: 14,
  },
  time: {
    marginTop: 4,
    fontSize: 12,
    color: '#D0D5DD',
  },
});
