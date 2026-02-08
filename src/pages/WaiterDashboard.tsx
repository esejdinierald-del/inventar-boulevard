import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Clock, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { format } from "date-fns";
import { sq } from "date-fns/locale";

interface WaiterCall {
  id: string;
  table_number: number;
  call_type: string;
  status: string;
  special_request: string | null;
  created_at: string;
  acknowledged_at: string | null;
  completed_at: string | null;
  priority: number;
}

const WaiterDashboard = () => {
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");

  useEffect(() => {
    // Load initial data
    loadCalls();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel("waiter_calls_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waiter_calls",
        },
        (payload) => {
          console.log("Thirrje e re:", payload);
          loadCalls();
          if (payload.eventType === "INSERT") {
            toast.success("🔔 Thirrje e re!");
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadCalls = async () => {
    try {
      const { data, error } = await supabase
        .from("waiter_calls")
        .select("*")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCalls(data || []);
    } catch (error) {
      console.error("Gabim në ngarkim:", error);
      toast.error("Gabim në ngarkim të thirrjeve");
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (callId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "acknowledged") {
        updateData.acknowledged_at = new Date().toISOString();
      } else if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("waiter_calls")
        .update(updateData)
        .eq("id", callId);

      if (error) throw error;
      toast.success("✅ Status i përditësuar");
      loadCalls();
    } catch (error) {
      console.error("Gabim:", error);
      toast.error("Gabim në përditësim");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-destructive/10 text-destructive border-destructive/30";
      case "acknowledged":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "🔴 Në Pritje";
      case "acknowledged":
        return "🟡 E Pranuar";
      case "completed":
        return "🟢 E Përfunduar";
      default:
        return status;
    }
  };

  const getCallTypeLabel = (type: string) => {
    switch (type) {
      case "call_waiter":
        return "📞 Thirrje Kamarieri";
      case "bill":
        return "💰 Kërkesa për Faturë";
      case "menu":
        return "📋 Kërkesa për Menu";
      case "other":
        return "❓ Tjetër";
      default:
        return type;
    }
  };

  const filteredCalls = calls.filter((call) => {
    if (filter === "all") return true;
    return call.status === filter;
  });

  const pendingCount = calls.filter((c) => c.status === "pending").length;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 pb-24 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Dashboard Thirrjesh</h1>
            <Button
              onClick={loadCalls}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Përditëso
            </Button>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-semibold text-red-700">
                {pendingCount} thirrje në pritje!
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {["pending", "acknowledged", "completed", "all"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status === "pending" && "🔴"}
              {status === "acknowledged" && "🟡"}
              {status === "completed" && "🟢"}
              {status === "all" && "📊"}
              {status === "all" ? "Të Gjitha" : status}
            </Button>
          ))}
        </div>

        {/* Calls List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Po ngarkohet...</p>
          </div>
        ) : filteredCalls.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">
                {filter === "all"
                  ? "Nuk ka thirrje"
                  : `Nuk ka thirrje ${filter}`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredCalls.map((call) => (
              <Card key={call.id} className="border-l-4 border-l-primary/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="text-lg px-3 py-1 bg-primary/20 text-primary border-primary/30">
                          Tavolina #{call.table_number}
                        </Badge>
                        <Badge className={`border ${getStatusColor(call.status)}`}>
                          {getStatusLabel(call.status)}
                        </Badge>
                        {call.priority === 2 && (
                          <Badge className="bg-red-100 text-red-800">⚠️ URGJENT</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {getCallTypeLabel(call.call_type)}
                      </p>
                      {call.special_request && (
                        <p className="text-sm text-muted-foreground italic">
                          "{call.special_request}"
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Timeline */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Thirrje: {format(new Date(call.created_at), "HH:mm:ss", { locale: sq })}
                      </span>
                    </div>
                    {call.acknowledged_at && (
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        <span>
                          E pranuar: {format(new Date(call.acknowledged_at), "HH:mm:ss", { locale: sq })}
                        </span>
                      </div>
                    )}
                    {call.completed_at && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>
                          E përfunduar: {format(new Date(call.completed_at), "HH:mm:ss", { locale: sq })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {call.status === "pending" && (
                      <Button
                        onClick={() => updateStatus(call.id, "acknowledged")}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        Prano
                      </Button>
                    )}
                    {call.status === "acknowledged" && (
                      <Button
                        onClick={() => updateStatus(call.id, "completed")}
                        size="sm"
                        variant="default"
                        className="flex-1"
                      >
                        Përfundo
                      </Button>
                    )}
                    {call.status !== "completed" && (
                      <Button
                        onClick={() => updateStatus(call.id, "completed")}
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                      >
                        Përfundo Menjëherë
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WaiterDashboard;
