"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const IconBase = ({ children, className = "", ...props }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} width="1em" height="1em" {...props}>
    {children}
  </svg>
);

const CheckCircle2 = (props: any) => (
  <IconBase {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </IconBase>
);

export default function ReturnsPortalPage() {
  const [view, setView] = useState<"LIST" | "PORTAL" | "SUCCESS">("LIST");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, { quantity: number; reason: string; note: string }>>({});
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/get-orders");
        if (!res.ok) throw new Error("Could not fetch order history.");
        const data = await res.json();
        const parsed = Array.isArray(data) ? data : data.orders || [];
        setOrders(parsed);
        setFilteredOrders(parsed);
      } catch (err: any) {
        setErrorBanner("Could not fetch your recent orders. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase().replace("#", "");
    setFilteredOrders(
      orders.filter((order) =>
        order?.name?.toLowerCase().replace("#", "").includes(query)
      )
    );
  }, [searchQuery, orders]);

  const handleSelectOrder = async (rawId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/get-order?orderId=${rawId}`);
      if (!res.ok) throw new Error("Failed to load order details.");
      const data = await res.json();
      setSelectedOrder(data);
      setView("PORTAL");
    } catch (err: any) {
      setErrorBanner(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitLoading(true);
      const res = await fetch("/api/submit-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.orderSummary.id.split("/").pop(),
          items: Object.entries(selectedItems).map(([id, item]) => ({
            lineItemId: id,
            quantity: item.quantity,
            reason: item.reason,
            description: item.note,
          })),
        }),
      });
      if (!res.ok) throw new Error("Submission failed. Please try again.");
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
      <p className="text-sm p-3 border rounded-lg bg-zinc-50">
        We'll be in touch once your return has been processed.
      </p>
      <Button onClick={() => { setView("LIST"); setSelectedOrder(null); setSelectedItems({}); }}>
        Back to Orders
      </Button>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto space-y-6">

      {errorBanner && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">
          {errorBanner}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          {view === "LIST"
            ? "Your Recent Orders"
            : `Order #${selectedOrder?.orderSummary?.name?.replace("#", "")}`}
        </h1>
        {view === "PORTAL" && (
          <Button variant="outline" onClick={() => { setView("LIST"); setSelectedOrder(null); setSelectedItems({}); }}>
            ← Back
          </Button>
        )}
      </div>

      {view === "LIST" && (
        <Input
          placeholder="Search by order number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : view === "LIST" ? (
        <div className="grid gap-3">
          {filteredOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No orders found.</p>
          ) : (
            filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectOrder(order.id.split("/").pop())}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Order #{order.name?.replace("#", "")}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-GB") : ""}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">View →</span>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3">
            {selectedOrder?.eligibleItems?.length === 0 ? (
              <p className="text-muted-foreground text-sm">No eligible items found for this order.</p>
            ) : (
              selectedOrder?.eligibleItems?.map((item: any) => (
                <Card key={item.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantityAvailable} · £{parseFloat(item.price).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitLoading} className="w-full">
            {isSubmitLoading ? "Submitting..." : "Submit Return Request"}
          </Button>
        </div>
      )}
    </div>
  );
}
