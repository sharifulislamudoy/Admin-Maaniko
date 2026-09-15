"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal, flushSync } from "react-dom";

import type { Order } from "@/components/admin/OrdersManager";

const BUSINESS = {
  name: "Maaniko",
  phone: "01646844221",
  address: "Dhaka, Bangladesh",
  website: "www.maaniko.com",
  email: "support@maaniko.com",
};

const SINGLE_PAGE_POINTS = 13;
const FIRST_PAGE_POINTS = 42;
const MIDDLE_PAGE_POINTS = 72;
const LAST_PAGE_POINTS = 46;
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

type PageCapacities = {
  single: number;
  first: number;
  middle: number;
  last: number;
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

function totalSize(rows: InvoiceRow[], sizeOf: (row: InvoiceRow) => number) {
  return rows.reduce((total, row) => total + sizeOf(row), 0);
}

function takeRows(
  rows: InvoiceRow[],
  capacity: number,
  sizeOf: (row: InvoiceRow) => number,
  keepAtLeast = 0,
) {
  const maximum = Math.max(1, rows.length - keepAtLeast);
  const selected: InvoiceRow[] = [];
  let used = 0;

  for (let index = 0; index < maximum; index += 1) {
    const row = rows[index];
    const rowSize = sizeOf(row);
    if (selected.length > 0 && used + rowSize > capacity) break;
    selected.push(row);
    used += rowSize;
  }

  return selected;
}

function paginateRows(
  rows: InvoiceRow[],
  sizeOf: (row: InvoiceRow) => number,
  capacities: PageCapacities,
): InvoicePage[] {
  const size = (items: InvoiceRow[]) => totalSize(items, sizeOf);

  if (rows.length === 0 || size(rows) <= capacities.single) {
    return [{ rows, first: true, last: true }];
  }

  const pages: InvoicePage[] = [];
  const firstRows = takeRows(rows, capacities.first, sizeOf, 1);
  pages.push({ rows: firstRows, first: true, last: false });

  let remaining = rows.slice(firstRows.length);
  while (size(remaining) > capacities.last) {
    const middleRows: InvoiceRow[] = [];
    let used = 0;

    while (remaining.length > 1) {
      const next = remaining[0];
      const nextSize = sizeOf(next);
      if (middleRows.length > 0 && used + nextSize > capacities.middle) break;

      middleRows.push(next);
      remaining = remaining.slice(1);
      used += nextSize;
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

function fallbackPages(order: Order) {
  return paginateRows(createRows(order), (row) => row.points, {
    single: SINGLE_PAGE_POINTS,
    first: FIRST_PAGE_POINTS,
    middle: MIDDLE_PAGE_POINTS,
    last: LAST_PAGE_POINTS,
  });
}

function InvoiceTable({
  rows,
  measureOrderId,
}: {
  rows: InvoiceRow[];
  measureOrderId?: string;
}) {
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
            <tr
              key={row.key}
              data-invoice-measure-row={
                measureOrderId ? `${measureOrderId}:${row.key}` : undefined
              }
            >
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

function InvoiceHeading({ order }: { order: Order }) {
  return (
    <>
      <header className="invoice-header" data-invoice-measure-header>
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
          <img className="invoice-logo" src="/Logo.png" alt="Maaniko" />
          <p>মায়ের পাশে, প্রতিটি ধাপে</p>
        </div>
      </header>

      <section className="invoice-parties" data-invoice-measure-parties>
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
  );
}

function InvoiceEnding({ order }: { order: Order }) {
  const discount = Math.max(
    0,
    Number(order.subtotal) + Number(order.deliveryCharge) - Number(order.total),
  );

  return (
    <div className="invoice-ending" data-invoice-measure-ending>
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
        নোট: ডেলিভারির সময় পণ্যের পরিমাণ, অবস্থা ও প্যাকেজিং যাচাই করে নিন। কোনো
        সমস্যা হলে দ্রুত Maaniko কাস্টমার কেয়ারে যোগাযোগ করুন।
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
    </div>
  );
}

function MeasurementSheet({
  order,
  rows,
}: {
  order: Order;
  rows: InvoiceRow[];
}) {
  return (
    <article
      className="invoice-measure-page"
      data-invoice-measure-sheet={order.id}
    >
      <div className="invoice-frame">
        <InvoiceHeading order={order} />
        <InvoiceTable rows={rows} measureOrderId={order.id} />
        <InvoiceEnding order={order} />
      </div>
    </article>
  );
}

function measuredPages(order: Order, rows: InvoiceRow[], sheet: HTMLElement) {
  const frame = sheet.querySelector<HTMLElement>(".invoice-frame");
  const header = sheet.querySelector<HTMLElement>(
    "[data-invoice-measure-header]",
  );
  const parties = sheet.querySelector<HTMLElement>(
    "[data-invoice-measure-parties]",
  );
  const ending = sheet.querySelector<HTMLElement>(
    "[data-invoice-measure-ending]",
  );
  const tableHead = sheet.querySelector<HTMLElement>(".invoice-items thead");

  if (!frame || !header || !parties || !ending || !tableHead) {
    return fallbackPages(order);
  }

  const frameStyle = window.getComputedStyle(frame);
  const innerHeight =
    frame.clientHeight -
    Number.parseFloat(frameStyle.paddingTop) -
    Number.parseFloat(frameStyle.paddingBottom);
  const gap = Number.parseFloat(frameStyle.rowGap || frameStyle.gap) || 0;
  const safety = 3;

  if (!Number.isFinite(innerHeight) || innerHeight <= 0) {
    return fallbackPages(order);
  }

  const rowHeights = new Map<string, number>();
  sheet
    .querySelectorAll<HTMLElement>("[data-invoice-measure-row]")
    .forEach((element) => {
      const key = element.dataset.invoiceMeasureRow;
      if (key) rowHeights.set(key, element.getBoundingClientRect().height);
    });

  const sizeOf = (row: InvoiceRow) =>
    rowHeights.get(`${order.id}:${row.key}`) ?? row.points * 8;
  const headHeight = tableHead.getBoundingClientRect().height;

  return paginateRows(rows, sizeOf, {
    single: Math.max(
      1,
      innerHeight -
        header.getBoundingClientRect().height -
        parties.getBoundingClientRect().height -
        ending.getBoundingClientRect().height -
        headHeight -
        gap * 3 -
        safety,
    ),
    first: Math.max(
      1,
      innerHeight -
        header.getBoundingClientRect().height -
        parties.getBoundingClientRect().height -
        headHeight -
        gap * 2 -
        safety,
    ),
    middle: Math.max(1, innerHeight - headHeight - safety),
    last: Math.max(
      1,
      innerHeight -
        ending.getBoundingClientRect().height -
        headHeight -
        gap -
        safety,
    ),
  });
}

export default function InvoicePrintArea({
  orders,
  onAfterPrint,
}: {
  orders: Order[];
  onAfterPrint: () => void;
}) {
  const rowsByOrder = useMemo(
    () => new Map(orders.map((order) => [order.id, createRows(order)])),
    [orders],
  );
  const fallbackByOrder = useMemo(
    () => new Map(orders.map((order) => [order.id, fallbackPages(order)])),
    [orders],
  );
  const [measuredByOrder, setMeasuredByOrder] = useState<
    Map<string, InvoicePage[]>
  >(new Map());

  useEffect(() => {
    if (orders.length === 0) return;

    const prepareExactPages = () => {
      const sheets = Array.from(
        document.querySelectorAll<HTMLElement>("[data-invoice-measure-sheet]"),
      );
      const next = new Map<string, InvoicePage[]>();

      for (const order of orders) {
        const rows = rowsByOrder.get(order.id) ?? [];
        const sheet = sheets.find(
          (element) => element.dataset.invoiceMeasureSheet === order.id,
        );

        next.set(
          order.id,
          sheet
            ? measuredPages(order, rows, sheet)
            : (fallbackByOrder.get(order.id) ?? fallbackPages(order)),
        );
      }

      flushSync(() => setMeasuredByOrder(next));
    };

    const finish = () => onAfterPrint();
    window.addEventListener("beforeprint", prepareExactPages);
    window.addEventListener("afterprint", finish, { once: true });
    const timer = window.setTimeout(() => window.print(), 200);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeprint", prepareExactPages);
      window.removeEventListener("afterprint", finish);
    };
  }, [fallbackByOrder, onAfterPrint, orders, rowsByOrder]);

  if (orders.length === 0) return null;

  return createPortal(
    <div className="invoice-print-root" aria-hidden="true">
      <div className="invoice-measure-root">
        {orders.map((order) => (
          <MeasurementSheet
            key={order.id}
            order={order}
            rows={rowsByOrder.get(order.id) ?? []}
          />
        ))}
      </div>

      {orders.flatMap((order) => {
        const pages =
          measuredByOrder.get(order.id) ??
          fallbackByOrder.get(order.id) ??
          fallbackPages(order);

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
              {page.first ? <InvoiceHeading order={order} /> : null}

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