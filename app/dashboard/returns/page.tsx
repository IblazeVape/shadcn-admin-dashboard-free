// app/dashboard/returns/page.tsx
"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { LayoutGrid, List, ArrowLeft, Loader2, Upload, AlertTriangle, CheckCircle2 } from "lucide-react"

export default function ReturnsPortalPage() {
  const [view, setView] = useState<"LIST" | "PORTAL" | "SUCCESS">("LIST")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [layout, setLayout] = useState<"grid" | "list">("grid")
  const [requestMode, setRequestMode] = useState<"RETURN" | "CLAIM">("RETURN")
  const [hasAcceptedHygiene, setHasAcceptedHygiene] = useState(false)
  const [isHygieneOpen, setIsHygieneOpen] = useState(false)
  
  const [selectedItems, setSelectedItems] = useState<Record<string, { quantity: number; reason: string; note: string }>>({})
  const [shippingLabel, setShippingLabel] = useState<File | null>(null)
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  useEffect(() => {
    async function loadOrders() {
      try {
        setIsLoading(true)
        setErrorBanner(null)
        const res = await fetch("/api/get-orders")
        if (!res.ok) throw new Error("Could not fetch order history data.")
        const data = await res.json()
        const parsed = Array.isArray(data) ? data : data.orders || []
        setOrders(parsed)
        setFilteredOrders(parsed)
      } catch (err: any) {
        console.error(err)
        setErrorBanner("Could not fetch your recent records. Please refresh the browser.")
      } finally {
        setIsLoading(false)
      }
    }
    loadOrders()
  }, [])

  useEffect(() => {
    const query = searchQuery.toLowerCase().replace("#", "")
    const filtered = orders.filter((order) =>
      order?.name?.toLowerCase().replace("#", "").includes(query)
    )
    setFilteredOrders(filtered)
  }, [searchQuery, orders])

  const handleSelectOrder = async (rawId: string) => {
    try {
      setIsLoading(true)
      setErrorBanner(null)
      const res = await fetch(`/api/get-order?orderId=${rawId}`)
      if (!res.ok) throw new Error("Failed to map item specifications.")
      const data = await res.json()
      
      setSelectedOrder(data)
      setRequestMode("RETURN")
      setHasAcceptedHygiene(false)
      setSelectedItems({})
      setShippingLabel(null)
      setEvidenceFiles([])
      
      if (data?.orderSummary?.createdAt) {
        const compareDate = new Date(data.orderSummary.createdAt)
        const daysSince = Math.floor((Date.now() - compareDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSince > 30 && data.orderSummary.isDelivered) {
          setErrorBanner("Unfortunately, this order was delivered more than 30 days ago and is no longer eligible for an unwanted return.")
          return
        }
      }
      setView("PORTAL")
    } catch (err: any) {
      setErrorBanner(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleItemToggle = (itemId: string, checked: boolean) => {
    setSelectedItems((prev) => {
      const updated = { ...prev }
      if (checked) {
        updated[itemId] = { quantity: 1, reason: "", note: "" }
      } else {
        delete updated[itemId]
      }
      return updated
    })
  }

  const handleItemDataChange = (itemId: string, field: "quantity" | "reason" | "note", value: any) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }))
  }

  const calculateSubtotal = () => {
    let total = 0
    Object.entries(selectedItems).forEach(([id, item]) => {
      const match = selectedOrder?.eligibleItems?.find((i: any) => i.id === id)
      if (match) total += item.quantity * parseFloat(match.price || "0")
    })
    return total
  }

  const validateSubmission = () => {
    const keys = Object.keys(selectedItems)
    if (keys.length === 0) return false

    for (const id of keys) {
      const selection = selectedItems[id]
      if (!selection.reason) return false
      if (selection.reason === "OTHER" && !selection.note.trim()) return false
    }

    if (requestMode === "CLAIM" && !shippingLabel) return false
    if (requestMode === "RETURN" && !hasAcceptedHygiene) return false

    return true
  }

  const handleSubmit = async () => {
    if (!validateSubmission()) return
    try {
      setIsSubmitLoading(true)
      setErrorBanner(null)
      const currentId = selectedOrder.orderSummary.id.split("/").pop()
      const payload = {
        orderId: currentId,
        items: Object.entries(selectedItems).map(([id, item]) => ({
          lineItemId: id,
          quantity: item.quantity,
          reason: item.reason,
          description: item.note,
        })),
      }

      const endpoint = requestMode === "CLAIM" ? "/api/submit-claim" : "/api/submit-return"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Submission failed.")
      setView("SUCCESS")
    } catch (err: any) {
      setErrorBanner(err.message)
    } finally {
      setIsSubmitLoading(false)
    }
  }

  if (view === "SUCCESS") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 max-w-xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-sm ring-4 ring-green-50">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Request Submitted</h2>
        <p className="text-muted-foreground">Your request was sent and is being reviewed.</p>
        <p className="text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg p-3 w-full">
          We'll email you what we said earlier once it's been completed.
        </p>
        <Button onClick={() => setView("LIST")} variant="outline" className="w-full sm:w-auto">
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6">
      {errorBanner && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex gap-3 text-sm font-medium">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{errorBanner}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {view === "LIST" ? "Your Recent Orders" : `Order #${selectedOrder?.orderSummary?.name?.replace("#", "")}`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {view === "LIST" ? "Select an order below to initiate a return or log a claim." : "Review details and select products."}
          </p>
        </div>

        {view === "LIST" ? (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Search orders..."
              className="max-w-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex items-center border rounded-lg p-1 bg-zinc-50 space-x-1">
              <Button size="icon" variant={layout === "grid" ? "outline" : "ghost"} className="h-8 w-8" onClick={() => setLayout("grid")}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button size="icon" variant={layout === "list" ? "outline" : "ghost"} className="h-8 w-8" onClick={() => setLayout("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setView("LIST")} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Select value={requestMode} onValueChange={(val: "RETURN" | "CLAIM") => setRequestMode(val)}>
              <SelectTrigger className="w-48 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RETURN">Standard Return</SelectItem>
                <SelectItem value="CLAIM">Log a Claim</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="w-full space-y-4 p-5">
              <Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : view === "LIST" ? (
        <div className={layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
          {filteredOrders.length === 0 ? (
            <div className="col-span-full py-12 text-center border border-dashed rounded-xl max-w-md mx-auto space-y-3">
              <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">No orders found.</p>
              <p className="text-xs text-muted-foreground">Note: Your order number can always be found in your confirmation email or account history.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const rawId = order.id.split("/").pop()
              return (
                <Card key={order.id} className="hover:border-zinc-300 shadow-sm cursor-pointer transition-all" onClick={() => handleSelectOrder(rawId)}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle className="text-base font-bold">Order #{order.name?.replace("#", "")}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </CardDescription>
                    </div>
                    <span className="text-sm font-bold bg-zinc-100 px-2.5 py-1 rounded-full">
                      £{parseFloat(order?.totalPriceSet?.shopMoney?.amount || "0").toFixed(2)}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 flex-wrap">
                      {order.lineItems?.edges?.slice(0, 4).map((edge: any, i: number) => (
                        <div key={i} className="w-10 h-10 border rounded-md overflow-hidden bg-white shrink-0 p-0.5">
                          <img src={edge.node.image?.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className={`p-4 rounded-xl border flex gap-3 text-sm font-medium ${requestMode === "RETURN" ? "bg-zinc-50 text-zinc-800 border-zinc-200" : "bg-blue-50 text-blue-800 border-blue-200"}`}>
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                {requestMode === "RETURN"
                  ? "Unwanted items can be returned within 30 days from delivery. Return postage is at your expense (tracked service required)."
                  : "If you've received a faulty, damaged, or missing item, please submit a claim. For accepted claims, we’ll issue a FREE returns label."}
              </p>
            </div>

            <Card>
              <CardHeader className="border-b bg-zinc-50/50 py-4">
                <CardTitle className="text-sm font-semibold text-zinc-900">Select items to return</CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {selectedOrder?.eligibleItems?.map((item: any) => {
                  const isChecked = !!selectedItems[item.id]
                  return (
                    <div key={item.id} className="p-4 sm:p-5 space-y-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          id={`check-${item.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleItemToggle(item.id, !!checked)}
                          className="mt-1"
                        />
                        <div className="w-16 h-16 border rounded-lg overflow-hidden bg-white shrink-0 p-1 relative">
                          <img src={item.image} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-1">
                            <label htmlFor={`check-${item.id}`} className="text-sm font-semibold cursor-pointer block">{item.title}</label>
                            <span className="text-sm font-bold">£{parseFloat(item.price).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {isChecked && (
                        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wide text-zinc-700">Quantity</label>
                            <select
                              value={selectedItems[item.id].quantity}
                              onChange={(e) => handleItemDataChange(item.id, "quantity", parseInt(e.target.value))}
                              className="w-full h-9 bg-white border border-input rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              {Array.from({ length: item.quantityAvailable }, (_, idx) => (
                                <option key={idx + 1} value={idx + 1}>{idx + 1}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wide text-zinc-700">Reason</label>
                            <select
                              value={selectedItems[item.id].reason}
                              onChange={(e) => handleItemDataChange(item.id, "reason", e.target.value)}
                              className="w-full h-9 bg-white border border-input rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              <option value="">Select a reason</option>
                              {requestMode === "RETURN" ? (
                                <>
                                  <option value="UNWANTED">Changed my mind</option>
                                  <option value="WRONG_ITEM">Ordered wrong item</option>
                                  <option value="OTHER">Other (please specify)</option>
                                </>
                              ) : (
                                <>
                                  <option value="FAULTY">Faulty / Broken device</option>
                                  <option value="DAMAGED">Damaged in transit</option>
                                  <option value="MISSING">Missing item(s)</option>
                                  <option value="WRONG_ITEM">Received wrong item</option>
                                  <option value="OTHER">Other (please specify)</option>
                                </>
                              )}
                            </select>
                          </div>

                          {selectedItems[item.id].reason === "OTHER" && (
                            <div className="sm:col-span-2 space-y-1.5">
                              <Input
                                type="text"
                                placeholder="Please specify your reason here..."
                                value={selectedItems[item.id].note}
                                onChange={(e) => handleItemDataChange(item.id, "note", e.target.value)}
                                className="bg-white"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {requestMode === "CLAIM" && (
              <Card className="p-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold block">Shipping Label Photo <span className="text-red-500">*</span></label>
                  <p className="text-xs text-muted-foreground">Please upload a clear photo of the shipping label on the parcel.</p>
                  <div className="border border-dashed rounded-xl p-6 bg-zinc-50/50 text-center relative hover:bg-zinc-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => setShippingLabel(e.target.files?.[0] || null)}
                    />
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <span className="text-xs font-semibold block">Click to upload shipping label</span>
                  </div>
                  {shippingLabel && <p className="text-xs text-green-600 font-medium">Selected: {shippingLabel.name}</p>}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {requestMode === "RETURN" && (
              <Card className="p-5 space-y-3">
                <h3 className="font-semibold text-sm">Hygiene & Returns Policy</h3>
                <p className="text-xs text-muted-foreground">You must review and accept our policy to select items.</p>
                <Button className={`w-full ${hasAcceptedHygiene ? "bg-green-600 hover:bg-green-700 text-white" : ""}`} onClick={() => setIsHygieneOpen(true)}>
                  {hasAcceptedHygiene ? "Accepted ✓" : "Review & Accept"}
                </Button>
              </Card>
            )}

            <Card>
              <CardHeader className="border-b bg-zinc-50/50 py-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Refund Estimator</h2>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Selected products count</span>
                  <span className="font-medium">
                    {Object.values(selectedItems).reduce((acc, curr) => acc + curr.quantity, 0)} items
                  </span>
                </div>
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="font-bold text-sm uppercase tracking-wide text-zinc-700">Estimated total</span>
                  <span className="font-bold text-xl">£{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button disabled={!validateSubmission() || isSubmitLoading} onClick={handleSubmit} className="w-full">
                    {isSubmitLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Submit Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Sheet open={isHygieneOpen} onOpenChange={setIsHygieneOpen}>
        <SheetContent side="right" className="w-full max-w-sm flex flex-col h-full">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="text-sm font-bold uppercase tracking-wider">Hygiene Policy Standard</SheetTitle>
          </SheetHeader>
          <div className="flex-1 py-6 space-y-4 text-xs text-zinc-600 list-disc list-inside">
            <p><strong className="text-zinc-900">Vape Kits & Mods:</strong> 30-day refund window matching validation parameters.</p>
            <p><strong className="text-zinc-900">E-Liquids & Disposables:</strong> Must remain completely factory sealed.</p>
          </div>
          <div className="border-t pt-4 space-y-2 mt-auto">
            <Button className="w-full" onClick={() => { setHasAcceptedHygiene(true); setIsHygieneOpen(false); }}>I accept</Button>
            <Button variant="outline" className="w-full" onClick={() => { setHasAcceptedHygiene(false); setIsHygieneOpen(false); }}>Decline</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
