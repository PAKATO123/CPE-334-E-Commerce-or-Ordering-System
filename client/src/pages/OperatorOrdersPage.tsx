import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { getOperatorOrdersApi, processOperatorOrderApi } from "../api";
import RejectOrderDialog from "../components/operator/RejectOrderDialog";
import { FulfillmentStatus, OperatorQueueFilter, OrderData } from "../types/order";
import { formatUSD } from "../utils/currency";

const FILTERS: { value: OperatorQueueFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
];

export const OperatorOrdersPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const filter = FILTERS.find((entry) => entry.value === params.get("status"))?.value ?? "ALL";
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectOrder, setRejectOrder] = useState<OrderData | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const processingRef = useRef(false);
  const mountedRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const fetchQueue = useCallback(async () => {
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    setLoading(true);
    setError(null);
    try {
      const result = await getOperatorOrdersApi(filter === "ALL" ? undefined : filter, request.signal);
      if (!request.signal.aborted && mountedRef.current) setOrders(result.data);
    } catch (err: unknown) {
      if (!request.signal.aborted && mountedRef.current) {
        setError(err instanceof Error ? err.message : "Unable to load the operator queue.");
      }
    } finally {
      if (!request.signal.aborted && mountedRef.current) setLoading(false);
    }
  }, [filter]);
  const fetchQueueRef = useRef(fetchQueue);
  fetchQueueRef.current = fetchQueue;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    setRejectOrder(null);
    setDialogError(null);
    setActionError(null);
    void fetchQueue();
    return () => requestRef.current?.abort();
  }, [fetchQueue]);

  const processOrder = async (order: OrderData, status: FulfillmentStatus) => {
    // Ref closes the gap before React renders disabled controls on a double click.
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessingId(order.id);
    setError(null);
    setActionError(null);
    setDialogError(null);
    setNotice(null);
    requestRef.current?.abort();
    try {
      await processOperatorOrderApi(order.id, status);
      if (!mountedRef.current) return;
      setRejectOrder(null);
      setNotice(status === "ACCEPTED"
        ? `Order ${order.orderNumber} accepted.`
        : `Order ${order.orderNumber} rejected. Reserved inventory has been restored.`);
      headingRef.current?.focus();
      await fetchQueueRef.current();
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : "Unable to process this order. Please try again.";
      const conflict = typeof err === "object" && err !== null && "status" in err && err.status === 409;
      if (conflict) {
        setRejectOrder(null);
        headingRef.current?.focus();
        await fetchQueueRef.current();
        if (mountedRef.current) setActionError(`${message} Review the refreshed queue before trying another action.`);
      } else if (status === "REJECTED") {
        setDialogError(message);
      } else {
        setActionError(message);
      }
    } finally {
      processingRef.current = false;
      if (mountedRef.current) setProcessingId(null);
    }
  };

  return (
    <section className="tt-operator-page" aria-labelledby="operator-queue-title">
      <div className="tt-operator-heading">
        <div>
          <h1 id="operator-queue-title" ref={headingRef} tabIndex={-1}>Operator Orders Queue</h1>
          <p>Review customer orders and manage fulfillment.</p>
        </div>
        <button type="button" className="tt-btn" disabled={loading || processingId !== null} onClick={() => void fetchQueue()}>
          Refresh Queue
        </button>
      </div>

      <div className="tt-operator-filters" role="group" aria-label="Filter orders by status">
        {FILTERS.map((entry) => (
          <button
            key={entry.value}
            type="button"
            className={`tt-btn ${filter === entry.value ? "tt-btn-primary" : "tt-btn-outline"}`}
            aria-pressed={filter === entry.value}
            disabled={processingId !== null}
            onClick={() => {
              const next = new URLSearchParams(params);
              if (entry.value === "ALL") next.delete("status");
              else next.set("status", entry.value);
              setNotice(null);
              setParams(next);
            }}
          >{entry.label}</button>
        ))}
      </div>

      {notice && <p role="status" className="tt-operator-success">{notice}</p>}
      {actionError && <p role="alert" className="tt-operator-error">{actionError}</p>}
      {error && (
        <div role="alert" className="tt-operator-error">
          <p>{error}</p>
          <button type="button" className="tt-btn" disabled={loading || processingId !== null} onClick={() => void fetchQueue()}>Retry Queue</button>
        </div>
      )}
      <div aria-busy={loading}>
        {loading && <p role="status">Loading orders...</p>}
        {!loading && !error && orders.length === 0 && (
          <div className="tt-card tt-operator-empty">
            <h2>No {filter === "ALL" ? "" : `${filter.toLowerCase()} `}orders</h2>
            <p>Orders matching this filter will appear here.</p>
          </div>
        )}
        {!loading && !error && orders.map((order) => (
          <article key={order.id} className="tt-card tt-operator-order" aria-labelledby={`order-title-${order.id}`}>
            <div className="tt-operator-heading">
              <div>
                <h2 id={`order-title-${order.id}`}>{order.orderNumber}</h2>
                <span className={`tt-operator-status tt-operator-status-${order.status.toLowerCase()}`}>{order.status}</span>
              </div>
              <strong className="tt-operator-total">{formatUSD(order.totalAmount)}</strong>
            </div>
            <dl className="tt-operator-meta">
              <div><dt>Customer</dt><dd><span>{order.customerName || `Customer ${order.customerId}`}</span><br /><span>{order.customerEmail}</span></dd></div>
              <div><dt>Placed</dt><dd><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString()}</time></dd></div>
              <div><dt>Total quantity</dt><dd>{order.itemCount ?? order.items.reduce((sum, item) => sum + item.quantity, 0)}</dd></div>
            </dl>
            <ul className="tt-operator-items">
              {order.items.map((item) => <li key={item.id}>{item.quantity} × {item.productName} <span>({item.sku})</span></li>)}
            </ul>
            <div className="tt-operator-actions">
              <Link className="tt-btn tt-btn-outline" to={`/orders/${order.id}`} state={{ operatorQueueSearch: location.search }} aria-label={`View details for ${order.orderNumber}`}>View Details</Link>
              {order.status === "PENDING" && <>
                <button type="button" className="tt-btn tt-btn-primary" disabled={processingId !== null} onClick={() => void processOrder(order, "ACCEPTED")} aria-label={`Accept order ${order.orderNumber}`}>
                  {processingId === order.id ? "Processing..." : "Accept"}
                </button>
                <button type="button" className="tt-btn tt-btn-danger" disabled={processingId !== null} onClick={() => { setDialogError(null); setRejectOrder(order); }} aria-label={`Reject order ${order.orderNumber}`}>Reject</button>
              </>}
            </div>
          </article>
        ))}
      </div>
      {rejectOrder && (
        <RejectOrderDialog
          orderNumber={rejectOrder.orderNumber}
          busy={processingId !== null}
          error={dialogError}
          onCancel={() => { if (!processingRef.current) { setRejectOrder(null); setDialogError(null); } }}
          onConfirm={() => void processOrder(rejectOrder, "REJECTED")}
        />
      )}
    </section>
  );
};

export default OperatorOrdersPage;

