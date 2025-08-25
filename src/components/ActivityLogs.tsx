import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, User, Calendar, Camera, Upload, Shield, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: 'login' | 'logout' | 'event_created' | 'event_updated' | 'photo_uploaded' | 'face_scanned' | 'user_role_changed' | 'user_created' | 'user_deleted';
  description: string;
  metadata: any;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

const ActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('activity_type', filter as any);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load activity logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
      case 'logout':
        return <User className="h-4 w-4" />;
      case 'event_created':
      case 'event_updated':
        return <Calendar className="h-4 w-4" />;
      case 'photo_uploaded':
        return <Upload className="h-4 w-4" />;
      case 'face_scanned':
        return <Camera className="h-4 w-4" />;
      case 'user_role_changed':
      case 'user_created':
      case 'user_deleted':
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login':
      case 'user_created':
      case 'event_created':
      case 'photo_uploaded':
        return 'default';
      case 'logout':
        return 'secondary';
      case 'face_scanned':
        return 'outline';
      case 'user_role_changed':
        return 'destructive';
      case 'user_deleted':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatActivityType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const refreshLogs = () => {
    setLoading(true);
    fetchLogs();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-accent" />
        <div>
          <h2 className="text-2xl font-bold text-primary">Activity Logs</h2>
          <p className="text-muted-foreground">
            Comprehensive audit trail of all platform activities
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter by activity:</label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="event_created">Event Created</SelectItem>
              <SelectItem value="photo_uploaded">Photo Uploaded</SelectItem>
              <SelectItem value="face_scanned">Face Scanned</SelectItem>
              <SelectItem value="user_role_changed">Role Changed</SelectItem>
              <SelectItem value="user_created">User Created</SelectItem>
              <SelectItem value="user_deleted">User Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="sm" onClick={refreshLogs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">User Actions</p>
                <p className="text-xl font-bold">
                  {logs.filter(log => ['login', 'logout', 'user_created'].includes(log.activity_type)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Event Actions</p>
                <p className="text-xl font-bold">
                  {logs.filter(log => ['event_created', 'event_updated'].includes(log.activity_type)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Photo Uploads</p>
                <p className="text-xl font-bold">
                  {logs.filter(log => log.activity_type === 'photo_uploaded').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Face Scans</p>
                <p className="text-xl font-bold">
                  {logs.filter(log => log.activity_type === 'face_scanned').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest {logs.length} activities across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant={getActivityColor(log.activity_type) as any} className="flex items-center gap-1 w-fit">
                      {getActivityIcon(log.activity_type)}
                      {formatActivityType(log.activity_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {log.profiles?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.profiles?.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{log.description}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="mt-1">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          View details
                        </summary>
                        <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {logs.length === 0 && (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No activity logs found{filter !== 'all' ? ` for ${formatActivityType(filter)}` : ''}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-accent">Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All user actions are logged for security, compliance, and troubleshooting purposes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-accent">Data Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity logs are retained for compliance and can be exported for external analysis if needed.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivityLogs;