"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import type { Order } from "@/components/admin/OrdersManager";

const BUSINESS = {
  name: "Maaniko",
  phone: "01646844221",
  address: "Dhaka, Bangladesh",
  website: "www.maaniko.com",
  email: "support@maaniko.com",
};

function money(value: number) {
  return `৳${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)}`;
}

function invoiceDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function fullAddress(order: Order) {
  return [order.address, order.area, order.city].filter(Boolean).join(", ");
}

function itemDensity(order: Order) {
  const visibleLines = order.items.reduce(
    (total, item) => total + 1 + (item.customConfig?.length ?? 0),
    0,
  );

  if (visibleLines > 18) return "invoice-page--dense";
  if (visibleLines > 10) return "invoice-page--compact";
  return "";
}

export default function InvoicePrintArea({
  orders,
  onAfterPrint,
}: {
  orders: Order[];
  onAfterPrint: () => void;
}) {
  useEffect(() => {
    if (orders.length === 0) return;

    const finish = () => onAfterPrint();
    window.addEventListener("afterprint", finish, { once: true });

    const timer = window.setTimeout(() => window.print(), 150);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", finish);
    };
  }, [orders, onAfterPrint]);

  if (orders.length === 0) return null;

  return createPortal(
    <div className="invoice-print-root" aria-hidden="true">
      {orders.map((order, orderIndex) => {
        const discount = Math.max(
          0,
          Number(order.subtotal) + Number(order.deliveryCharge) - Number(order.total),
        );

        return (
          <article
            key={order.id}
            className={`invoice-page ${itemDensity(order)}`}
          >
            <div className="invoice-frame">
              <header className="invoice-header">
                <div>
                  <div className="invoice-title">INVOICE</div>
                  <p>
                    Invoice No: <strong>{order.orderNumber}</strong>
                  </p>
                  <p>
                    Date: <strong>{invoiceDate(order.createdAt)}</strong>
                  </p>
                </div>

                <div className="invoice-brand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="invoice-logo"
                    src="/Logo.png"
                    alt="Maaniko"
                  />
                  <p>মায়ের পাশে, প্রতিটি ধাপে</p>
                </div>
              </header>

              <section className="invoice-parties">
                <div className="invoice-party invoice-party--from">
                  <h2>From: {BUSINESS.name}</h2>
                  <p><b>Phone:</b> {BUSINESS.phone}</p>
                  <p><b>Address:</b> {BUSINESS.address}</p>
                  <p><b>Website:</b> {BUSINESS.website}</p>
                  <p><b>Email:</b> {BUSINESS.email}</p>
                </div>

                <div className="invoice-party invoice-party--to">
                  <h2>Bill To: {order.customerName}</h2>
                  <p><b>Phone:</b> {order.phone}</p>
                  {order.alternativePhone ? (
                    <p><b>Alternative:</b> {order.alternativePhone}</p>
                  ) : null}
                  <p className="invoice-address">
                    <b>Shipping address:</b> {fullAddress(order)}
                  </p>
                </div>
              </section>

              <section className="invoice-items-wrap">
                <table className="invoice-items">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Unit price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.name}</strong>
                          {item.sku ? <small>SKU: {item.sku}</small> : null}

                          {Array.isArray(item.customConfig) &&
                          item.customConfig.length > 0 ? (
                            <div className="invoice-includes">
                              <span>Included products</span>
                              <ul>
                                {item.customConfig.map((included, index) => (
                                  <li key={`${included.productId}-${index}`}>
                                    {included.name ?? included.productId}
                                    {included.quantity > 1
                                      ? ` × ${included.quantity}`
                                      : ""}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </td>
                        <td>{String(item.quantity).padStart(2, "0")}</td>
                        <td>{money(item.unitPrice)}</td>
                        <td>{money(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="invoice-summary">
                <div className="invoice-payment">
                  <h2>Payment information</h2>
                  <p>
                    Payment method: <strong>Cash on Delivery</strong>
                  </p>
                  <p>
                    Payment status: <strong>Unpaid</strong>
                  </p>
                </div>

                <div className="invoice-totals">
                  <p><span>Subtotal</span><strong>{money(order.subtotal)}</strong></p>
                  <p><span>Delivery charge</span><strong>{money(order.deliveryCharge)}</strong></p>
                  {discount > 0 ? (
                    <p><span>Discount</span><strong>- {money(discount)}</strong></p>
                  ) : null}
                  <p className="invoice-grand-total">
                    <span>Grand total</span>
                    <strong>{money(order.total)}</strong>
                  </p>
                </div>
              </section>

              {order.note ? (
                <p className="invoice-order-note">
                  <b>Customer note:</b> {order.note}
                </p>
              ) : null}

              <p className="invoice-notice">
                নোট: ডেলিভারির সময় পণ্যের পরিমাণ, অবস্থা ও প্যাকেজিং যাচাই করে
                নিন। কোনো সমস্যা হলে দ্রুত Maaniko কাস্টমার কেয়ারে যোগাযোগ করুন।
              </p>

              <footer className="invoice-footer">
                <div className="invoice-thanks">
                  <strong>Thank You!</strong>
                  <span>আমাদের উপর ভরসা করার জন্য</span>
                </div>
                <div><b>✓</b><span>100% Authentic</span></div>
                <div><b>♥</b><span>Customer Support</span></div>
                <div><b>➜</b><span>Fast & Safe Delivery</span></div>
              </footer>
            </div>

            <span className="invoice-page-number">
              {orderIndex + 1} / {orders.length}
            </span>
          </article>
        );
      })}
    </div>,
    document.body,
  );
}
