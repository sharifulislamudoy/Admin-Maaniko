"use client";
/* eslint-disable @next/next/no-img-element */

import { Plus } from "lucide-react";
import { slugify } from "@/lib/catalog-editor";
import type {
  ComboPayload,
  ContentText,
  ProductOption,
} from "@/types/catalog";
import ImageUploader from "./ImageUploader";
import {
  EmptyState,
  Field,
  FormSection,
  inputClass,
  ContentField,
  ContentListEditor,
  RemoveButton,
  TwoColumns,
} from "./FormUi";

function replaceAt<T>(items: T[], index: number, item: T) {
  return items.map((old, itemIndex) => (itemIndex === index ? item : old));
}

export default function ComboForm({
  value,
  onChange,
  products,
}: {
  value: ComboPayload;
  onChange: (value: ComboPayload) => void;
  products: ProductOption[];
}) {
  function updateName(name: ContentText) {
    onChange({ ...value, name });
  }

  return (
    <div className="space-y-4">
      <FormSection
        title="1. Solution box identity"
        description="ক্রেতা যে নাম ও বিবরণ ওয়েবসাইটে দেখবেন"
      >
        <div className="space-y-4">
          <ContentField
            label="Box name"
            value={value.name}
            onChange={updateName}
            required
          />
          <ContentField
            label="Short subtitle"
            value={value.subtitle}
            onChange={(subtitle) => onChange({ ...value, subtitle })}
            required
          />
          <ContentField
            label="Full description"
            value={value.description}
            onChange={(description) => onChange({ ...value, description })}
            multiline
            required
          />
          <TwoColumns>
            <Field label="URL name / Slug" required>
              <input
                value={value.slug}
                onChange={(event) =>
                  onChange({ ...value, slug: slugify(event.target.value) })
                }
                placeholder="new-mother-solution-box"
                className={inputClass}
              />
            </Field>
            <Field label="SKU / box code" required>
              <input
                value={value.sku}
                onChange={(event) =>
                  onChange({ ...value, sku: event.target.value.toUpperCase() })
                }
                placeholder="MN-COMBO-001"
                className={inputClass}
              />
            </Field>
          </TwoColumns>
          <ContentField
            label="Journey stage"
            value={value.journeyStage}
            onChange={(journeyStage) => onChange({ ...value, journeyStage })}
            placeholders={"নতুন মায়ের যত্ন"}
            required
          />
        </div>
      </FormSection>

      <FormSection
        title="2. Box images"
        description="প্রথম ছবিটি কার্ড ও বিস্তারিত পেজের প্রধান ছবি হবে"
      >
        <ImageUploader
          folder="combos"
          images={value.images}
          onChange={(images) => onChange({ ...value, images })}
        />
      </FormSection>

      <FormSection
        title="3. Included products"
        description="পণ্যের ID লেখার প্রয়োজন নেই—তালিকা থেকে পণ্য বেছে নিন"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              এই বক্সে মোট {value.items.length} ধরনের পণ্য আছে
            </p>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  items: [
                    ...value.items,
                    { productId: products[0]?.id ?? "", quantity: 1 },
                  ],
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#ef4277] px-3 py-2 text-xs font-extrabold text-white"
            >
              <Plus className="size-3.5" /> পণ্য যোগ করুন
            </button>
          </div>
          {value.items.length === 0 && (
            <EmptyState>
              “পণ্য যোগ করুন” চাপুন, তারপর তালিকা থেকে পণ্য নির্বাচন করুন।
            </EmptyState>
          )}
          {value.items.map((item, index) => {
            const product = products.find(
              (option) => option.id === item.productId,
            );
            return (
              <article
                key={`${item.productId}-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {product?.images?.[0] && (
                      <img
                        src={product.images[0]}
                        alt=""
                        className="size-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#062a54]">
                        {product?.name || product?.name || `পণ্য ${index + 1}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {product?.sku ?? "পণ্য নির্বাচন করুন"}
                      </p>
                    </div>
                  </div>
                  <RemoveButton
                    label="Remove"
                    onClick={() =>
                      onChange({
                        ...value,
                        items: value.items.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      })
                    }
                  />
                </div>
                <div className="grid gap-4 lg:grid-cols-[1fr_120px]">
                  <Field label="Product" required>
                    <select
                      value={item.productId}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          items: replaceAt(value.items, index, {
                            ...item,
                            productId: event.target.value,
                          }),
                        })
                      }
                      className={inputClass}
                    >
                      <option value="">পণ্য নির্বাচন করুন</option>
                      {products.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name || option.name} — {option.sku}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Quantity" required>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          items: replaceAt(value.items, index, {
                            ...item,
                            quantity: Math.max(1, Number(event.target.value)),
                          }),
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <ContentField
                    label="Specific variant (optional)"
                    value={item.variant ?? ""}
                    onChange={(variant) =>
                      onChange({
                        ...value,
                        items: replaceAt(value.items, index, {
                          ...item,
                          variant,
                        }),
                      })
                    }
                    placeholders={"যেমন: নীল, বড়"}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </FormSection>

      <FormSection
        title="4. Price, stock and publishing"
        description="বক্সের মোট বিক্রয় মূল্য ও প্রাপ্যতা"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Box price (৳)" required>
              <input
                type="number"
                min={0}
                value={value.price}
                onChange={(event) =>
                  onChange({ ...value, price: Number(event.target.value) })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Previous total price (৳)" required>
              <input
                type="number"
                min={0}
                value={value.compareAtPrice}
                onChange={(event) =>
                  onChange({
                    ...value,
                    compareAtPrice: Number(event.target.value),
                  })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Stock" required>
              <input
                type="number"
                min={0}
                value={value.stock}
                onChange={(event) =>
                  onChange({ ...value, stock: Number(event.target.value) })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Rating">
              <input
                type="number"
                min={0}
                max={5}
                step="0.1"
                value={value.rating}
                onChange={(event) =>
                  onChange({ ...value, rating: Number(event.target.value) })
                }
                className={inputClass}
              />
            </Field>
          </div>
          <TwoColumns>
            <Field label="Box status">
              <select
                value={value.status}
                onChange={(event) =>
                  onChange({
                    ...value,
                    status: event.target.value as ComboPayload["status"],
                  })
                }
                className={inputClass}
              >
                <option value="DRAFT">খসড়া — ওয়েবসাইটে দেখাবে না</option>
                <option value="ACTIVE">সক্রিয় — ওয়েবসাইটে দেখাবে</option>
                <option value="ARCHIVED">আর্কাইভ — সংরক্ষিত</option>
              </select>
            </Field>
            <Field label="Review count">
              <input
                type="number"
                min={0}
                value={value.reviewCount}
                onChange={(event) =>
                  onChange({
                    ...value,
                    reviewCount: Number(event.target.value),
                  })
                }
                className={inputClass}
              />
            </Field>
          </TwoColumns>
        </div>
      </FormSection>

      <FormSection
        title="5. Box benefits"
        description="বিস্তারিত পেজের মূল পয়েন্টগুলো"
        defaultOpen={false}
      >
        <div className="space-y-6">
          <ContentListEditor
            title="Why this box"
            items={value.whyThisBox}
            onChange={(whyThisBox) => onChange({ ...value, whyThisBox })}
          />
          <ContentListEditor
            title="Best for"
            items={value.preferredFor}
            onChange={(preferredFor) => onChange({ ...value, preferredFor })}
          />
          <ContentListEditor
            title="Selection reasons"
            items={value.selectionReasons}
            onChange={(selectionReasons) =>
              onChange({ ...value, selectionReasons })
            }
          />
          <ContentListEditor
            title="Packaging information"
            items={value.packaging}
            onChange={(packaging) => onChange({ ...value, packaging })}
          />
        </div>
      </FormSection>

      <FormSection
        title="6. Usage guide"
        description="ক্রেতাকে ধাপে ধাপে ব্যবহার বুঝিয়ে দিন"
        defaultOpen={false}
      >
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  usageGuide: [
                    ...value.usageGuide,
                    {
                      id: `step-${value.usageGuide.length + 1}`,
                      title: "",
                      description: "",
                    },
                  ],
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-xs font-extrabold text-sky-700"
            >
              <Plus className="size-3.5" /> ধাপ যোগ করুন
            </button>
          </div>
          {value.usageGuide.length === 0 && (
            <EmptyState>এখনো কোনো ব্যবহারের ধাপ যোগ করা হয়নি।</EmptyState>
          )}
          {value.usageGuide.map((step, index) => (
            <article
              key={index}
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex justify-between">
                <span className="text-xs font-black text-slate-500">
                  ধাপ {index + 1}
                </span>
                <RemoveButton
                  label="Remove"
                  onClick={() =>
                    onChange({
                      ...value,
                      usageGuide: value.usageGuide.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    })
                  }
                />
              </div>
              <ContentField
                label="Step title"
                value={step.title}
                onChange={(title) =>
                  onChange({
                    ...value,
                    usageGuide: replaceAt(value.usageGuide, index, {
                      ...step,
                      title,
                    }),
                  })
                }
              />
              <ContentField
                label="Description"
                value={step.description}
                onChange={(description) =>
                  onChange({
                    ...value,
                    usageGuide: replaceAt(value.usageGuide, index, {
                      ...step,
                      description,
                    }),
                  })
                }
                multiline
              />
            </article>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="7. Reviews and FAQs"
        description="বিশ্বাসযোগ্যতা এবং সাধারণ প্রশ্নের উত্তর"
        defaultOpen={false}
      >
        <div className="space-y-7">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-slate-700">ক্রেতার রিভিউ</p>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    reviews: [
                      ...value.reviews,
                      { customerName: "", rating: 5, review: "" },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-700"
              >
                <Plus className="size-3" /> রিভিউ যোগ করুন
              </button>
            </div>
            {value.reviews.map((review, index) => (
              <article
                key={index}
                className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex justify-between">
                  <span className="text-xs font-black text-slate-500">
                    রিভিউ {index + 1}
                  </span>
                  <RemoveButton
                    label="Remove"
                    onClick={() =>
                      onChange({
                        ...value,
                        reviews: value.reviews.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      })
                    }
                  />
                </div>
                <TwoColumns>
                  <Field label="Customer name">
                    <input
                      value={review.customerName}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          reviews: replaceAt(value.reviews, index, {
                            ...review,
                            customerName: event.target.value,
                          }),
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Rating">
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={review.rating}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          reviews: replaceAt(value.reviews, index, {
                            ...review,
                            rating: Number(event.target.value),
                          }),
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                </TwoColumns>
                <ContentField
                  label="Review"
                  value={review.review}
                  onChange={(reviewText) =>
                    onChange({
                      ...value,
                      reviews: replaceAt(value.reviews, index, {
                        ...review,
                        review: reviewText,
                      }),
                    })
                  }
                  multiline
                />
              </article>
            ))}
          </div>
          <div className="space-y-3 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-slate-700">সাধারণ প্রশ্ন</p>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    faqs: [...value.faqs, { question: "", answer: "" }],
                  })
                }
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-700"
              >
                <Plus className="size-3" /> প্রশ্ন যোগ করুন
              </button>
            </div>
            {value.faqs.map((faq, index) => (
              <article
                key={index}
                className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex justify-between">
                  <span className="text-xs font-black text-slate-500">
                    প্রশ্ন {index + 1}
                  </span>
                  <RemoveButton
                    label="Remove"
                    onClick={() =>
                      onChange({
                        ...value,
                        faqs: value.faqs.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      })
                    }
                  />
                </div>
                <ContentField
                  label="Question"
                  value={faq.question}
                  onChange={(question) =>
                    onChange({
                      ...value,
                      faqs: replaceAt(value.faqs, index, { ...faq, question }),
                    })
                  }
                />
                <ContentField
                  label="Answer"
                  value={faq.answer}
                  onChange={(answer) =>
                    onChange({
                      ...value,
                      faqs: replaceAt(value.faqs, index, { ...faq, answer }),
                    })
                  }
                  multiline
                />
              </article>
            ))}
          </div>
        </div>
      </FormSection>
    </div>
  );
}
