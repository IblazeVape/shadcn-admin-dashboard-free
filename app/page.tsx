// app/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

// --- Icons ---
const IconBase = ({ children, className = "", ...props }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} width="1em" height="1em" {...props}>
    {children}
  </svg>
);

export const LayoutGrid = (props: any) => <IconBase {...props}><rect x="3" y="3" width="8" height="8" /><rect x="13" y="3" width="8" height="8" /><rect x="3" y="13" width="8" height="8" /><rect x="13" y="13" width="8" height="8" /></IconBase>;
export const List = (props: any) => <IconBase {...props}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3.5" cy="6" r="1.5" /><circle cx="3.5" cy="12" r="1.5" /><circle cx="3.5" cy="18" r="1.5" /></IconBase>;
export const ArrowLeft = (props: any) => <IconBase {...props}><polyline points="15 18 9 12 15 6" /></IconBase>;
export const Loader2 = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={props.className} width="1em" height="1em" {...props}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.2" fill="none" /><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" /></svg>;
export const Upload = (props: any) => <IconBase {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></IconBase>;
export const AlertTriangle = (props: any) => <IconBase {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12" y2="17" /></IconBase>;
export const CheckCircle2 = (props: any) => <IconBase {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></IconBase>;

export default function ReturnsPortalPage() {
  const [view, setView] = useState<"LIST" | "PORTAL" | "SUCCESS">("LIST");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [requestMode, setRequestMode] = useState<"RETURN" | "CLAIM">("RETURN");
  const [hasAcceptedHygiene, setHasAcceptedHygiene] = useState(false);
  const [isHygieneOpen, setIsHygieneOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, { quantity: number; reason: string; note: string }>>({});
  const [shippingLabel, setShippingLabel] = useState<File | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/get-orders");
        if (!res.ok) throw new Error("Could not fetch order history data.");
        const data = await res.json();
        const parsed = Array.isArray(data) ? data : data.orders || [];
        setOrders(parsed);
        setFilteredOrders(parsed);
      } catch (err: any) {
        setErrorBanner("Could not fetch your recent records. Please refresh the browser.");
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase().replace("#", "");
    setFilteredOrders(orders.filter((order) => order?.name?.toLowerCase().replace("#", "").includes(query)));
  }, [searchQuery, orders]);

  const handleSelectOrder = async (rawId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/get-order?orderId=${rawId}`);
      if (!res.ok) throw new Error("Failed to map item specifications.");
      const data = await res.json();
      setSelectedOrder(data);
      setView("PORTAL");
    } catch (err: any) {
      setErrorBanner(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSubtotal = () => {
    let total = 0;
    Object.entries(selectedItems).forEach(([id, item]) => {
      const match = selectedOrder?.eligibleItems?.find((i: any) => i.id === id);
      if (match) total += item.quantity * parseFloat(match.price || "0");
    });
    return total;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitLoading(true);
      const res = await fetch(requestMode === "CLAIM" ? "/api/submit-claim" : "/api/submit-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrder.orderSummary.id.split("/").pop(), items: Object.entries(selectedItems).map(([id, item]) => ({ lineItemId: id, quantity: item.quantity, reason: item.reason, description: item.note })) }),
      });
      if (!res.ok) throw new Error("Submission failed.");
      setView("SUCCESS");
    } catch (err: any) {
      setErrorBanner(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  if (view === "SUCCESS") return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">
      <CheckCircle2 className="w-16 h-16 text-green-600" />
      <h2 className="text-2xl font-bold">Request Submitted</h2>
      <p className="text-sm p-3 border rounded-lg bg-zinc-50">We'll email you what we said earlier once it's been completed.</p>
      <Button onClick={() => setView("LIST")}>Back to Dashboard</Button>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto space-y-6">
      {errorBanner && <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">{errorBanner}</div>}
      <h1 className="text-2xl font-bold">{view === "LIST" ? "Your Recent Orders" : `Order #${selectedOrder?.orderSummary?.name?.replace("#", "")}`}</h1>
      
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : view === "LIST" ? (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="cursor-pointer" onClick={() => handleSelectOrder(order.id.split("/").pop())}>
              <CardContent className="p-4">Order #{order.name?.replace("#", "")}</CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div>{/* ... Render Portal Content */}</div>
      )}
    </div>
  );
}
