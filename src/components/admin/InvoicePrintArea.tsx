"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import type { Order } from "@/components/admin/OrdersManager";

const BUSINESS = {
  name: "Maaniko",
  phone: "01646844221",
  address: "Dhaka, Bangladesh",
  website: "www.maaniko.com",
  email: "maanikobd@gamil.com",
};

const SINGLE_PAGE_POINTS = 13;
const FIRST_PAGE_POINTS = 18;
const MIDDLE_PAGE_POINTS = 30;
const LAST_PAGE_POINTS = 18;
const MAX_INCLUDED_PRODUCTS_PER_ROW = 12;

type OrderItem = Order["items"][number];
type IncludedProduct = NonNullable<OrderItem["customConfig"]>[number];

type InvoiceRow = {
  key: string;
  item: OrderItem;
  included: IncludedProduct[];
  continuation: boolean;
  showAmounts: boolean;
  points: number;
};

type InvoicePage = {
  rows: InvoiceRow[];
  first: boolean;
  last: boolean;
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

function textLines(value: string, charactersPerLine: number) {
  return Math.min(
    3,
    Math.max(1, Math.ceil(value.trim().length / charactersPerLine)),
  );
}

function rowPoints(item: OrderItem, included: IncludedProduct[]) {
  const namePoints = textLines(item.name, 38);
  const includedPoints =
    included.length > 0 ? 1 + Math.ceil(included.length / 2) : 0;
  return 2 + namePoints + includedPoints;
}

function createRows(order: Order): InvoiceRow[] {
  return order.items.flatMap((item) => {
    const included = Array.isArray(item.customConfig) ? item.customConfig : [];

    if (included.length <= MAX_INCLUDED_PRODUCTS_PER_ROW) {
      return [
        {
          key: item.id,
          item,
          included,
          continuation: false,
          showAmounts: true,
          points: rowPoints(item, included),
        },
      ];
    }

    const rows: InvoiceRow[] = [];
    for (
      let index = 0;
      index < included.length;
      index += MAX_INCLUDED_PRODUCTS_PER_ROW
    ) {
      const group = included.slice(
        index,
        index + MAX_INCLUDED_PRODUCTS_PER_ROW,
      );
      const continuation = index > 0;
      rows.push({
        key: `${item.id}-${index}`,
        item,
        included: group,
        continuation,
        showAmounts: !continuation,
        points: rowPoints(item, group),
      });
    }
    return rows;
  });
}

function totalPoints(rows: InvoiceRow[]) {
  return rows.reduce((total, row) => total + row.points, 0);
}

function takeRows(rows: InvoiceRow[], capacity: number, keepAtLeast = 0) {
  const maximum = Math.max(1, rows.length - keepAtLeast);
  const selected: InvoiceRow[] = [];
  let used = 0;

  for (let index = 0; index < maximum; index += 1) {
    const row = rows[index];
    if (selected.length > 0 && used + row.points > capacity) break;
    selected.push(row);
    used += row.points;
  }

  return selected;
}

function paginateOrder(order: Order): InvoicePage[] {
  const rows = createRows(order);

  if (rows.length === 0 || totalPoints(rows) <= SINGLE_PAGE_POINTS) {
    return [{ rows, first: true, last: true }];
  }

  const pages: InvoicePage[] = [];
  const firstRows = takeRows(rows, FIRST_PAGE_POINTS, 1);
  pages.push({ rows: firstRows, first: true, last: false });

  let remaining = rows.slice(firstRows.length);
  while (totalPoints(remaining) > LAST_PAGE_POINTS) {
    const middleRows: InvoiceRow[] = [];
    let used = 0;

    while (remaining.length > 1) {
      const next = remaining[0];
      const pointsAfterNext = totalPoints(remaining.slice(1));
      if (middleRows.length > 0 && used + next.points > MIDDLE_PAGE_POINTS)
        break;

      middleRows.push(next);
      remaining = remaining.slice(1);
      used += next.points;

      if (pointsAfterNext <= LAST_PAGE_POINTS) break;
    }

    if (middleRows.length === 0) {
      middleRows.push(remaining[0]);
      remaining = remaining.slice(1);
    }

    pages.push({ rows: middleRows, first: false, last: false });
  }

  pages.push({ rows: remaining, first: false, last: true });
  return pages;
}

function InvoiceTable({ rows }: { rows: InvoiceRow[] }) {
  return (
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
          {rows.map((row) => (
            <tr key={row.key}>
              <td>
                <strong>
                  {row.item.name}
                  {row.continuation ? " (continued)" : ""}
                </strong>

                {row.included.length > 0 ? (
                  <div className="invoice-includes">
                    <span>
                      {row.continuation
                        ? "Included products continued"
                        : "Included products"}
                    </span>
                    <ul>
                      {row.included.map((included, index) => (
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
              <td>
                {row.showAmounts
                  ? String(row.item.quantity).padStart(2, "0")
                  : "—"}
              </td>
              <td>{row.showAmounts ? money(row.item.unitPrice) : "—"}</td>
              <td>{row.showAmounts ? money(row.item.lineTotal) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function InvoiceEnding({ order }: { order: Order }) {
  const discount = Math.max(
    0,
    Number(order.subtotal) + Number(order.deliveryCharge) - Number(order.total),
  );

  return (
    <>
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
          <p>
            <span>Subtotal</span>
            <strong>{money(order.subtotal)}</strong>
          </p>
          <p>
            <span>Delivery charge</span>
            <strong>{money(order.deliveryCharge)}</strong>
          </p>
          {discount > 0 ? (
            <p>
              <span>Discount</span>
              <strong>- {money(discount)}</strong>
            </p>
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
        নোট: ডেলিভারির সময় পণ্যের পরিমাণ, অবস্থা ও প্যাকেজিং যাচাই করে নিন। কোনো
        সমস্যা হলে দ্রুত Maaniko কাস্টমার কেয়ারে যোগাযোগ করুন।
      </p>

      <footer className="invoice-footer">
        <div className="invoice-thanks">
          <strong>Thank You!</strong>
          <span>আমাদের উপর ভরসা করার জন্য</span>
        </div>
        <div>
          <b>✓</b>
          <span>100% Authentic</span>
        </div>
        <div>
          <b>♥</b>
          <span>Customer Support</span>
        </div>
        <div>
          <b>➜</b>
          <span>Fast &amp; Safe Delivery</span>
        </div>
      </footer>
    </>
  );
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
      {orders.flatMap((order) => {
        const pages = paginateOrder(order);

        return pages.map((page, pageIndex) => (
          <article
            key={`${order.id}-${pageIndex}`}
            className={[
              "invoice-page",
              page.first ? "invoice-page--first" : "invoice-page--continuation",
              page.last ? "invoice-page--has-ending" : "invoice-page--open",
            ].join(" ")}
          >
            <div className="invoice-frame">
              {page.first ? (
                <>
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
                      <p>
                        <b>Phone:</b> {BUSINESS.phone}
                      </p>
                      <p>
                        <b>Address:</b> {BUSINESS.address}
                      </p>
                      <p>
                        <b>Website:</b> {BUSINESS.website}
                      </p>
                      <p>
                        <b>Email:</b> {BUSINESS.email}
                      </p>
                    </div>

                    <div className="invoice-party invoice-party--to">
                      <h2>Bill To: {order.customerName}</h2>
                      <p>
                        <b>Phone:</b> {order.phone}
                      </p>
                      {order.alternativePhone ? (
                        <p>
                          <b>Alternative:</b> {order.alternativePhone}
                        </p>
                      ) : null}
                      <p className="invoice-address">
                        <b>Shipping address:</b> {fullAddress(order)}
                      </p>
                    </div>
                  </section>
                </>
              ) : null}

              <InvoiceTable rows={page.rows} />
              {page.last ? <InvoiceEnding order={order} /> : null}
            </div>

            <span className="invoice-page-number">
              {pageIndex + 1} / {pages.length}
            </span>
          </article>
        ));
      })}
    </div>,
    document.body,
  );
}