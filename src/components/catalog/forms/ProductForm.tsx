"use client";

import { Plus } from "lucide-react";
import { slugify } from "@/lib/catalog-editor";
import type { ContentText, ProductPayload } from "@/types/catalog";
import ImageUploader from "./ImageUploader";
import {
  EmptyState,
  Field,
  FormSection,
  inputClass,
  ContentField,
  ContentListEditor,
  RemoveButton,
  textareaClass,
  TwoColumns,
} from "./FormUi";

function replaceAt<T>(items: T[], index: number, item: T) {
  return items.map((old, itemIndex) => (itemIndex === index ? item : old));
}

function optionalNumber(value: string) {
  return value === "" ? null : Number(value);
}

export default function ProductForm({
  value,
  onChange,
}: {
  value: ProductPayload;
  onChange: (value: ProductPayload) => void;
}) {
  function updateName(name: ContentText) {
    onChange({ ...value, name });
  }

  function updateAttributeName(attributeIndex: number, name: ContentText) {
    const attribute = value.attributes[attributeIndex];
    const oldName = attribute.name;
    onChange({
      ...value,
      attributes: replaceAt(value.attributes, attributeIndex, {
        ...attribute,
        name,
      }),
      variants: value.variants.map((variant) => ({
        ...variant,
        selections: variant.selections.map((selection) =>
          selection.attribute === oldName
            ? { ...selection, attribute: name }
            : selection,
        ),
      })),
    });
  }

  function updateAttributeValue(
    attributeIndex: number,
    optionIndex: number,
    optionValue: ContentText,
  ) {
    const attribute = value.attributes[attributeIndex];
    const option = attribute.values[optionIndex];
    const oldValue = option.value;
    onChange({
      ...value,
      attributes: replaceAt(value.attributes, attributeIndex, {
        ...attribute,
        values: replaceAt(attribute.values, optionIndex, {
          ...option,
          value: optionValue,
        }),
      }),
      variants: value.variants.map((variant) => ({
        ...variant,
        selections: variant.selections.map((selection) =>
          selection.attribute === attribute.name && selection.value === oldValue
            ? { ...selection, value: optionValue }
            : selection,
        ),
      })),
    });
  }

  return (
    <div className="space-y-4">
      <FormSection
        title="1. Product identity"
        description="নাম, SKU, ক্যাটাগরি ও সংক্ষিপ্ত পরিচিতি"
      >
        <div className="space-y-4">
          <ContentField
            label="Product name"
            value={value.name}
            onChange={updateName}
            required
          />
          <ContentField
            label="Product description"
            value={value.description}
            onChange={(description) => onChange({ ...value, description })}
            multiline
            required
          />
          <TwoColumns>
            <Field
              label="URL name / Slug"
              hint="URL-এর জন্য ইংরেজি ছোট হাতের অক্ষর ও dash ব্যবহার করুন।"
              required
            >
              <input
                value={value.slug}
                onChange={(event) =>
                  onChange({ ...value, slug: slugify(event.target.value) })
                }
                placeholder="premium-maternity-pillow"
                className={inputClass}
              />
            </Field>
            <Field label="SKU / product code" required>
              <input
                value={value.sku}
                onChange={(event) =>
                  onChange({ ...value, sku: event.target.value.toUpperCase() })
                }
                placeholder="MN-PIL-001"
                className={inputClass}
              />
            </Field>
          </TwoColumns>
          <ContentField
            label="Category name"
            value={value.category.name}
            onChange={(name) =>
              onChange({ ...value, category: { ...value.category, name } })
            }
            required
          />
          <Field label="Category URL name / Slug" required>
            <input
              value={value.category.slug}
              onChange={(event) =>
                onChange({
                  ...value,
                  category: {
                    ...value.category,
                    slug: slugify(event.target.value),
                  },
                })
              }
              placeholder="mother-care"
              className={inputClass}
            />
          </Field>
          <ContentField
            label="Badge (optional)"
            value={value.badge}
            onChange={(badge) => onChange({ ...value, badge })}
            placeholders={"যেমন: বেস্ট সেলার"}
          />
        </div>
      </FormSection>

      <FormSection
        title="2. Images"
        description="প্রথম ছবিটি পণ্য কার্ডের প্রধান ছবি হবে"
      >
        <ImageUploader
          folder="products"
          images={value.images}
          onChange={(images) => onChange({ ...value, images })}
        />
      </FormSection>

      <FormSection
        title="3. Price, stock and publishing"
        description="বিক্রয় মূল্য, আগের মূল্য এবং ওয়েবসাইটে দেখানোর অবস্থা"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Sale price (৳)" required>
              <input
                type="number"
                min={0}
                step="0.01"
                value={value.price}
                onChange={(event) =>
                  onChange({ ...value, price: Number(event.target.value) })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Previous price (৳)">
              <input
                type="number"
                min={0}
                step="0.01"
                value={value.compareAtPrice ?? ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    compareAtPrice: optionalNumber(event.target.value),
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
            <Field label="Product status">
              <select
                value={value.status}
                onChange={(event) =>
                  onChange({
                    ...value,
                    status: event.target.value as ProductPayload["status"],
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
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
            <input
              type="checkbox"
              checked={value.featured}
              onChange={(event) =>
                onChange({ ...value, featured: event.target.checked })
              }
              className="size-4 accent-[#ef4277]"
            />
            <span className="text-sm font-extrabold text-slate-700">
              বিশেষ পণ্য হিসেবে দেখান
            </span>
          </label>
        </div>
      </FormSection>

      <FormSection
        title="4. Customer journeys"
        description="কোন জার্নি নির্বাচন করলে এই পণ্যটি দেখাবে"
      >
        <Field
          label="Journey slugs"
          hint="একাধিক হলে comma দিয়ে লিখুন—যেমন pregnancy, postpartum, breastfeeding"
        >
          <input
            value={value.journeySlugs.join(", ")}
            onChange={(event) =>
              onChange({
                ...value,
                journeySlugs: event.target.value
                  .split(",")
                  .map((item) => slugify(item))
                  .filter(Boolean),
              })
            }
            placeholder="pregnancy, postpartum"
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection
        title="5. Product details"
        description="পণ্যের বিস্তারিত পেজের ব্যাখ্যা ও সুবিধা"
        defaultOpen={false}
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold text-slate-700">
                প্যাকেটে যা থাকবে
              </p>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    details: {
                      ...value.details,
                      includedItems: [
                        ...value.details.includedItems,
                        { name: "" },
                      ],
                    },
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-xs font-extrabold text-sky-700"
              >
                <Plus className="size-3.5" /> উপাদান যোগ করুন
              </button>
            </div>
            {value.details.includedItems.length === 0 && (
              <EmptyState>এখনো কোনো উপাদান যোগ করা হয়নি।</EmptyState>
            )}
            {value.details.includedItems.map((item, index) => (
              <div
                key={index}
                className="space-y-3 rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex justify-between">
                  <span className="text-xs font-black text-slate-500">
                    উপাদান {index + 1}
                  </span>
                  <RemoveButton
                    label="Remove"
                    onClick={() =>
                      onChange({
                        ...value,
                        details: {
                          ...value.details,
                          includedItems: value.details.includedItems.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        },
                      })
                    }
                  />
                </div>
                <ContentField
                  label="Included item name"
                  value={item.name}
                  onChange={(name) =>
                    onChange({
                      ...value,
                      details: {
                        ...value.details,
                        includedItems: replaceAt(
                          value.details.includedItems,
                          index,
                          { ...item, name },
                        ),
                      },
                    })
                  }
                />
                <Field label="Image URL (optional)">
                  <input
                    value={item.image ?? ""}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        details: {
                          ...value.details,
                          includedItems: replaceAt(
                            value.details.includedItems,
                            index,
                            { ...item, image: event.target.value },
                          ),
                        },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
            ))}
          </div>
          <ContentListEditor
            title="কেন প্রয়োজনীয়"
            items={value.details.whyEssential}
            onChange={(whyEssential) =>
              onChange({
                ...value,
                details: { ...value.details, whyEssential },
              })
            }
          />
          <ContentListEditor
            title="Best for"
            items={value.details.preferredFor}
            onChange={(preferredFor) =>
              onChange({
                ...value,
                details: { ...value.details, preferredFor },
              })
            }
          />
        </div>
      </FormSection>

      <FormSection
        title="6. Variants and options"
        description="সাইজ, রং, ভলিউম ইত্যাদির ডাইনামিক অপশন তৈরি করুন"
        defaultOpen={false}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-700">
                অপশন / অ্যাট্রিবিউট
              </p>
              <p className="text-xs text-slate-500">
                প্রথমে অ্যাট্রিবিউট ও তার ভ্যালুগুলো যোগ করুন।
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  attributes: [...value.attributes, { name: "", values: [] }],
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-xs font-extrabold text-sky-700"
            >
              <Plus className="size-3.5" /> অ্যাট্রিবিউট যোগ করুন
            </button>
          </div>
          {value.attributes.length === 0 && (
            <EmptyState>
              উদাহরণ: অ্যাট্রিবিউট = রং, ভ্যালু = কালো, নীল
            </EmptyState>
          )}
          {value.attributes.map((attribute, attributeIndex) => (
            <article
              key={attributeIndex}
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex justify-between">
                <span className="text-xs font-black text-slate-500">
                  অ্যাট্রিবিউট {attributeIndex + 1}
                </span>
                <RemoveButton
                  label="অ্যাট্রিবিউট বাদ দিন"
                  onClick={() =>
                    onChange({
                      ...value,
                      attributes: value.attributes.filter(
                        (_, index) => index !== attributeIndex,
                      ),
                      variants: value.variants.map((variant) => ({
                        ...variant,
                        selections: variant.selections.filter(
                          (selection) => selection.attribute !== attribute.name,
                        ),
                      })),
                    })
                  }
                />
              </div>
              <ContentField
                label="Attribute name"
                value={attribute.name}
                onChange={(name) => updateAttributeName(attributeIndex, name)}
                placeholders={"রং"}
              />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">ভ্যালুগুলো</p>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        attributes: replaceAt(
                          value.attributes,
                          attributeIndex,
                          {
                            ...attribute,
                            values: [...attribute.values, { value: "" }],
                          },
                        ),
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-700"
                  >
                    <Plus className="size-3" /> ভ্যালু যোগ করুন
                  </button>
                </div>
                {attribute.values.map((option, optionIndex) => (
                  <div key={optionIndex} className="rounded-xl bg-slate-50 p-3">
                    <div className="mb-2 flex justify-end">
                      <RemoveButton
                        label="Remove"
                        onClick={() =>
                          onChange({
                            ...value,
                            attributes: replaceAt(
                              value.attributes,
                              attributeIndex,
                              {
                                ...attribute,
                                values: attribute.values.filter(
                                  (_, index) => index !== optionIndex,
                                ),
                              },
                            ),
                            variants: value.variants.filter(
                              (variant) =>
                                !variant.selections.some(
                                  (selection) =>
                                    selection.attribute === attribute.name &&
                                    selection.value === option.value,
                                ),
                            ),
                          })
                        }
                      />
                    </div>
                    <ContentField
                      label="Value"
                      value={option.value}
                      onChange={(optionValue) =>
                        updateAttributeValue(
                          attributeIndex,
                          optionIndex,
                          optionValue,
                        )
                      }
                      placeholders={"কালো"}
                    />
                    <Field label="Color code (colors only)">
                      <input
                        type="color"
                        value={option.colorHex || "#000000"}
                        onChange={(event) =>
                          onChange({
                            ...value,
                            attributes: replaceAt(
                              value.attributes,
                              attributeIndex,
                              {
                                ...attribute,
                                values: replaceAt(
                                  attribute.values,
                                  optionIndex,
                                  { ...option, colorHex: event.target.value },
                                ),
                              },
                            ),
                          })
                        }
                        className="mt-3 h-10 w-20 rounded-lg border border-slate-200 bg-white p-1"
                      />
                    </Field>
                  </div>
                ))}
              </div>
            </article>
          ))}

          <div className="border-t border-slate-200 pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-700">
                  বিক্রয়যোগ্য ভ্যারিয়েন্ট
                </p>
                <p className="text-xs text-slate-500">
                  প্রতিটি কম্বিনেশনের আলাদা SKU, দাম ও স্টক দিন।
                </p>
              </div>
              <button
                type="button"
                disabled={
                  value.attributes.length === 0 ||
                  value.attributes.some((item) => item.values.length === 0)
                }
                onClick={() =>
                  onChange({
                    ...value,
                    variants: [
                      ...value.variants,
                      {
                        sku: `${value.sku}-VAR-${value.variants.length + 1}`,
                        price: null,
                        compareAtPrice: null,
                        stock: 0,
                        imageUrl: null,
                        isActive: true,
                        selections: value.attributes.map((attribute) => ({
                          attribute: attribute.name,
                          value: attribute.values[0]?.value ?? "",
                        })),
                      },
                    ],
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#ef4277] px-3 py-2 text-xs font-extrabold text-white disabled:opacity-40"
              >
                <Plus className="size-3.5" /> ভ্যারিয়েন্ট যোগ করুন
              </button>
            </div>
            {value.variants.length === 0 && (
              <EmptyState>
                অ্যাট্রিবিউট ও ভ্যালু যোগ করার পর ভ্যারিয়েন্ট তৈরি করতে পারবেন।
              </EmptyState>
            )}
            <div className="space-y-3">
              {value.variants.map((variant, variantIndex) => (
                <article
                  key={variantIndex}
                  className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-500">
                      ভ্যারিয়েন্ট {variantIndex + 1}
                    </span>
                    <RemoveButton
                      label="ভ্যারিয়েন্ট বাদ দিন"
                      onClick={() =>
                        onChange({
                          ...value,
                          variants: value.variants.filter(
                            (_, index) => index !== variantIndex,
                          ),
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {value.attributes.map((attribute) => {
                      const selection = variant.selections.find(
                        (item) => item.attribute === attribute.name,
                      );
                      return (
                        <Field
                          key={attribute.name}
                          label={attribute.name || attribute.name || "Option"}
                        >
                          <select
                            value={selection?.value ?? ""}
                            onChange={(event) => {
                              const selections = variant.selections.filter(
                                (item) => item.attribute !== attribute.name,
                              );
                              selections.push({
                                attribute: attribute.name,
                                value: event.target.value,
                              });
                              onChange({
                                ...value,
                                variants: replaceAt(
                                  value.variants,
                                  variantIndex,
                                  { ...variant, selections },
                                ),
                              });
                            }}
                            className={inputClass}
                          >
                            <option value="">নির্বাচন করুন</option>
                            {attribute.values.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.value || option.value}
                              </option>
                            ))}
                          </select>
                        </Field>
                      );
                    })}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Variant SKU" required>
                      <input
                        value={variant.sku}
                        onChange={(event) =>
                          onChange({
                            ...value,
                            variants: replaceAt(value.variants, variantIndex, {
                              ...variant,
                              sku: event.target.value.toUpperCase(),
                            }),
                          })
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Override price">
                      <input
                        type="number"
                        min={0}
                        value={variant.price ?? ""}
                        placeholder={String(value.price)}
                        onChange={(event) =>
                          onChange({
                            ...value,
                            variants: replaceAt(value.variants, variantIndex, {
                              ...variant,
                              price: optionalNumber(event.target.value),
                            }),
                          })
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Previous price">
                      <input
                        type="number"
                        min={0}
                        value={variant.compareAtPrice ?? ""}
                        onChange={(event) =>
                          onChange({
                            ...value,
                            variants: replaceAt(value.variants, variantIndex, {
                              ...variant,
                              compareAtPrice: optionalNumber(
                                event.target.value,
                              ),
                            }),
                          })
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Stock">
                      <input
                        type="number"
                        min={0}
                        value={variant.stock}
                        onChange={(event) =>
                          onChange({
                            ...value,
                            variants: replaceAt(value.variants, variantIndex, {
                              ...variant,
                              stock: Number(event.target.value),
                            }),
                          })
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <Field label="Variant image URL (optional)">
                    <input
                      value={variant.imageUrl ?? ""}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          variants: replaceAt(value.variants, variantIndex, {
                            ...variant,
                            imageUrl: event.target.value || null,
                          }),
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={variant.isActive}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          variants: replaceAt(value.variants, variantIndex, {
                            ...variant,
                            isActive: event.target.checked,
                          }),
                        })
                      }
                      className="size-4 accent-[#ef4277]"
                    />{" "}
                    এই ভ্যারিয়েন্ট বিক্রির জন্য চালু
                  </label>
                </article>
              ))}
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="7. Additional notes"
        description="প্রয়োজনে অভ্যন্তরীণ নোট হিসেবে ব্যবহার করুন"
        defaultOpen={false}
      >
        <textarea
          className={textareaClass}
          readOnly
          value="এই সংস্করণে সব প্রয়োজনীয় ফিল্ড উপরের নির্দেশিত ফর্মে আছে; JSON সম্পাদনার প্রয়োজন নেই।"
        />
      </FormSection>
    </div>
  );
}
