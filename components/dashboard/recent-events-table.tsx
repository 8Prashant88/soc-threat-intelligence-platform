/**
 * SecureLogTI - Recent Security Events Table
 * Displays recent security events with severity indicators
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { mockSecurityEvents } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

function getSeverityBadge(severity: string) {
  const styles = {
    info: "bg-primary/20 text-primary hover:bg-primary/30",
    warning: "bg-warning/20 text-warning hover:bg-warning/30",
    error: "bg-danger/20 text-danger hover:bg-danger/30",
    critical: "bg-danger text-danger-foreground hover:bg-danger/90",
  }

  return <Badge className={cn("font-medium", styles[severity as keyof typeof styles])}>{severity.toUpperCase()}</Badge>
}

export function RecentEventsTable() {
  const events = mockSecurityEvents

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Recent Security Events</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Time</TableHead>
              <TableHead className="text-muted-foreground">Event Type</TableHead>
              <TableHead className="text-muted-foreground">Source IP</TableHead>
              <TableHead className="text-muted-foreground">Description</TableHead>
              <TableHead className="text-muted-foreground">Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id} className="border-border">
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {event.timestamp.toLocaleTimeString()}
                </TableCell>
                <TableCell className="font-medium text-card-foreground">{event.eventType}</TableCell>
                <TableCell className="font-mono text-sm text-primary">{event.sourceIp}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">{event.description}</TableCell>
                <TableCell>{getSeverityBadge(event.severity)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
