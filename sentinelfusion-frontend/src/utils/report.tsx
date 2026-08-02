import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import { TYPE_LABELS } from '../components/incidents/constants'
import type { DateRange, LeadershipData } from '../types'

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, color: '#1a1a1a' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#666', marginBottom: 16 },
  section: { fontSize: 13, fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  label: { color: '#666' },
  activity: { marginBottom: 4 },
})

function formatRange(range: DateRange): string {
  return `${range.from} → ${range.to} (${range.preset})`
}

/** Client-side PDF report: KPIs, type/severity summaries, and activity feed. */
export async function exportLeadershipReport(
  data: LeadershipData,
  range: DateRange,
): Promise<void> {
  const blob = await pdf(
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>SentinelFusion — Executive Report</Text>
        <Text style={styles.subtitle}>Date range: {formatRange(range)}</Text>

        <Text style={styles.section}>Key Performance Indicators</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total AOIs</Text>
          <Text>{data.stats.totalAOIs}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Active Incidents</Text>
          <Text>{data.stats.activeIncidents} ({data.stats.activeIncidentsTrend}% vs prior)</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Avg Response Time</Text>
          <Text>{data.stats.avgResponseHours} hours</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Incidents Resolved</Text>
          <Text>{data.stats.resolvedIncidents} ({data.stats.resolutionRate}%)</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Field Ops Active</Text>
          <Text>{data.stats.fieldOpsActive}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Critical Incidents</Text>
          <Text>{data.stats.criticalIncidents}</Text>
        </View>

        <Text style={styles.section}>Incidents by Type</Text>
        {data.incidentsByType.map((entry) => (
          <View key={entry.type} style={styles.row}>
            <Text style={styles.label}>{TYPE_LABELS[entry.type]}</Text>
            <Text>{entry.count}</Text>
          </View>
        ))}

        <Text style={styles.section}>Severity Distribution</Text>
        {data.severityDistribution.map((slice) => (
          <View key={slice.severity} style={styles.row}>
            <Text style={styles.label}>{slice.severity}</Text>
            <Text>{slice.count}</Text>
          </View>
        ))}

        <Text style={styles.section}>Recent Activity</Text>
        {data.activities.map((activity) => (
          <View key={activity.id} style={styles.activity}>
            <Text>
              {activity.timestamp} — {activity.description} ({activity.user})
            </Text>
          </View>
        ))}
      </Page>
    </Document>,
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `sentinel-fusion-report-${range.from}-${range.to}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
